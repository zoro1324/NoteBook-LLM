from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser

from .models import Document, DocumentChunk, NotebookGuide
from .serializers import (
    DocumentSerializer, DocumentUploadSerializer, 
    DocumentChunkSerializer, NotebookGuideSerializer
)
from .services import get_processor, DocumentProcessor


class DocumentViewSet(viewsets.ModelViewSet):
    """
    API endpoint for documents (CRUD + file upload).
    """
    queryset = Document.objects.all()
    parser_classes = [MultiPartParser, FormParser]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return DocumentUploadSerializer
        return DocumentSerializer
    
    def perform_create(self, serializer):
        """Process document after upload"""
        document = serializer.save()
        
        # Process the document in background (for now, sync)
        self.process_document(document)
    
    def process_document(self, document):
        """Extract text and create chunks"""
        try:
            processor = get_processor(document.file_type)
            if not processor:
                document.processing_error = f"No processor for {document.file_type}"
                document.save()
                return
            
            # Extract text
            if document.file:
                text, metadata = processor.extract_text(document.file.path)
            elif document.url:
                # URL processing would go here
                text = ""
                metadata = {}
            else:
                text = ""
                metadata = {}
            
            document.extracted_text = text
            document.word_count = len(text.split())
            document.processed = True
            document.save()
            
            # Create chunks for RAG
            chunks = DocumentProcessor.chunk_text(text)
            for i, (chunk_text, start, end) in enumerate(chunks):
                DocumentChunk.objects.create(
                    document=document,
                    chunk_text=chunk_text,
                    chunk_index=i,
                    start_char=start,
                    end_char=end,
                    page_number=metadata.get('page_number')
                )
            
        except Exception as e:
            document.processing_error = str(e)
            document.save()
    
    @action(detail=True, methods=['get'])
    def chunks(self, request, pk=None):
        """Get document chunks"""
        document = self.get_object()
        chunks = document.chunks.all()
        serializer = DocumentChunkSerializer(chunks, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def reprocess(self, request, pk=None):
        """Reprocess a document"""
        document = self.get_object()
        document.chunks.all().delete()  # Clear existing chunks
        document.processed = False
        document.processing_error = ''
        document.save()
        
        self.process_document(document)
        return Response({'status': 'reprocessing complete'})


class NotebookGuideViewSet(viewsets.ModelViewSet):
    """
    API endpoint for notebook guides (FAQs, summaries, etc.)
    """
    queryset = NotebookGuide.objects.all()
    serializer_class = NotebookGuideSerializer
