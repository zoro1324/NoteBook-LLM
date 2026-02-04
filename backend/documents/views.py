from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser

from .models import Document, DocumentChunk, NotebookGuide
from .serializers import (
    DocumentSerializer, DocumentUploadSerializer, 
    DocumentChunkSerializer, NotebookGuideSerializer
)
from .services import get_processor


class DocumentViewSet(viewsets.ModelViewSet):
    """
    API endpoint for documents (CRUD + file upload).
    Integrates with RAG pipeline for semantic chunking and embedding.
    """
    queryset = Document.objects.all()
    parser_classes = [MultiPartParser, FormParser]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return DocumentUploadSerializer
        return DocumentSerializer
    
    def _get_rag_service(self):
        """Lazy load RAG service"""
        from rag.rag_service import rag_service
        return rag_service
    
    def perform_create(self, serializer):
        """Process document after upload"""
        document = serializer.save()
        
        # Link to notebook if provided
        notebook_id = self.request.data.get('notebook')
        if notebook_id:
            try:
                from chat.models import Notebook
                notebook = Notebook.objects.get(id=notebook_id)
                notebook.documents.add(document)
                print(f"[Document] Linked document {document.id} to notebook {notebook.title}")
            except Exception as e:
                print(f"[Document] Failed to link to notebook: {e}")
        
        # Process the document: extract text, chunk, and embed
        self.process_document(document)
    
    def perform_destroy(self, instance):
        """Remove document from vector store when deleted"""
        try:
            rag_service = self._get_rag_service()
            rag_service.remove_document(instance.id)
        except Exception as e:
            print(f"[Document] Failed to remove from vector store: {e}")
        
        instance.delete()
    
    def process_document(self, document):
        """
        Full document processing pipeline:
        1. Extract text using appropriate processor
        2. Semantic chunking via RAG service
        3. Generate embeddings and store in vector store
        """
        try:
            processor = get_processor(document.file_type)
            if not processor:
                document.processing_error = f"No processor for {document.file_type}"
                document.save()
                return
            
            # Step 1: Extract text
            if document.file:
                print(f"[Document] Extracting text from {document.file.path}")
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
            
            # Print extracted text for debugging
            print(f"\n{'='*50}")
            print(f"EXTRACTED TEXT FROM: {document.title}")
            print(f"{'='*50}")
            print(text)
            print(f"{'='*50}\n")
            
            if not text.strip():
                document.processing_error = "No text extracted from document"
                document.save()
                return
            
            # Step 2 & 3: Chunk and embed using RAG service
            try:
                rag_service = self._get_rag_service()
                result = rag_service.ingest_document(document)
                
                print(f"[Document] Ingested: {result}")
                
                if result.get('error'):
                    document.processing_error = result['error']
                    document.save()
                    
            except Exception as e:
                print(f"[Document] RAG ingestion failed: {e}")
                # Fall back to basic chunking if RAG fails
                self._fallback_chunking(document, text, metadata)
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            document.processing_error = str(e)
            document.save()
    
    def _fallback_chunking(self, document, text, metadata):
        """Fallback to basic chunking if RAG service fails"""
        from .services import DocumentProcessor
        
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
        
        document.embedded = False
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
        """Reprocess a document - re-extract, re-chunk, and re-embed"""
        document = self.get_object()
        
        # Clear existing chunks
        document.chunks.all().delete()
        document.processed = False
        document.embedded = False
        document.processing_error = ''
        document.save()
        
        # Remove from vector store
        try:
            rag_service = self._get_rag_service()
            rag_service.remove_document(document.id)
        except Exception as e:
            print(f"[Document] Failed to remove from vector store: {e}")
        
        # Reprocess
        self.process_document(document)
        
        return Response({
            'status': 'reprocessing complete',
            'word_count': document.word_count,
            'embedded': document.embedded,
            'chunk_count': document.chunks.count()
        })
    
    @action(detail=True, methods=['post'])
    def embed(self, request, pk=None):
        """
        Embed/re-embed a document without re-extracting text.
        Useful if embedding model changed or embeddings were lost.
        """
        document = self.get_object()
        
        if not document.extracted_text:
            return Response(
                {'error': 'No extracted text to embed'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            rag_service = self._get_rag_service()
            
            # Remove existing embeddings
            rag_service.remove_document(document.id)
            
            # Re-ingest
            result = rag_service.ingest_document(document)
            
            return Response({
                'status': 'embedding complete',
                'chunks': result.get('chunks', 0),
                'embedded': document.embedded
            })
            
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def embed_all(self, request):
        """Embed all unembedded documents"""
        documents = Document.objects.filter(embedded=False, processed=True)
        
        results = []
        for document in documents:
            try:
                rag_service = self._get_rag_service()
                result = rag_service.ingest_document(document)
                results.append({
                    'id': document.id,
                    'title': document.title,
                    'status': 'success',
                    'chunks': result.get('chunks', 0)
                })
            except Exception as e:
                results.append({
                    'id': document.id,
                    'title': document.title,
                    'status': 'error',
                    'error': str(e)
                })
        
        return Response({
            'processed': len(results),
            'results': results
        })


class NotebookGuideViewSet(viewsets.ModelViewSet):
    """
    API endpoint for notebook guides (FAQs, summaries, etc.)
    """
    queryset = NotebookGuide.objects.all()
    serializer_class = NotebookGuideSerializer
