from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.http import StreamingHttpResponse
import json

from .models import Notebook, Conversation, Message, Citation
from .serializers import (
    NotebookListSerializer, NotebookDetailSerializer,
    ConversationSerializer, MessageSerializer
)
from .services import OllamaService
from documents.models import Document, DocumentChunk


# Initialize Ollama service
ollama_service = OllamaService()


class NotebookViewSet(viewsets.ModelViewSet):
    """
    API endpoint for notebooks (CRUD operations).
    """
    queryset = Notebook.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'list':
            return NotebookListSerializer
        return NotebookDetailSerializer
    
    @action(detail=True, methods=['post'])
    def add_document(self, request, pk=None):
        """Add a document to a notebook"""
        notebook = self.get_object()
        document_id = request.data.get('document_id')
        try:
            document = Document.objects.get(id=document_id)
            notebook.documents.add(document)
            return Response({'status': 'document added'})
        except Document.DoesNotExist:
            return Response({'error': 'Document not found'}, 
                          status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'])
    def remove_document(self, request, pk=None):
        """Remove a document from a notebook"""
        notebook = self.get_object()
        document_id = request.data.get('document_id')
        try:
            document = Document.objects.get(id=document_id)
            notebook.documents.remove(document)
            return Response({'status': 'document removed'})
        except Document.DoesNotExist:
            return Response({'error': 'Document not found'}, 
                          status=status.HTTP_404_NOT_FOUND)


class ConversationViewSet(viewsets.ModelViewSet):
    """
    API endpoint for conversations.
    """
    queryset = Conversation.objects.all()
    serializer_class = ConversationSerializer
    
    def get_queryset(self):
        """Filter by notebook if provided"""
        queryset = Conversation.objects.all()
        notebook_id = self.request.query_params.get('notebook')
        if notebook_id:
            queryset = queryset.filter(notebook_id=notebook_id)
        return queryset


class ChatViewSet(viewsets.ViewSet):
    """
    API endpoint for chat operations with streaming support.
    """
    
    @action(detail=False, methods=['post'])
    def send(self, request):
        """Send a message and get AI response (streaming)"""
        conversation_id = request.data.get('conversation_id')
        message_content = request.data.get('message')
        document_ids = request.data.get('document_ids', [])
        
        # Get or create conversation
        if conversation_id:
            try:
                conversation = Conversation.objects.get(id=conversation_id)
            except Conversation.DoesNotExist:
                return Response({'error': 'Conversation not found'}, 
                              status=status.HTTP_404_NOT_FOUND)
        else:
            notebook_id = request.data.get('notebook_id')
            conversation = Conversation.objects.create(
                notebook_id=notebook_id,
                title=message_content[:50] + '...' if len(message_content) > 50 else message_content
            )
        
        # Save user message
        user_message = Message.objects.create(
            conversation=conversation,
            role='user',
            content=message_content
        )
        
        # Get relevant context from documents
        context_chunks = []
        citations = []
        if document_ids:
            chunks = DocumentChunk.objects.filter(
                document_id__in=document_ids
            ).order_by('document', 'chunk_index')[:10]  # Limit context
            
            for i, chunk in enumerate(chunks):
                context_chunks.append(chunk.chunk_text)
                citations.append({
                    'document_id': chunk.document_id,
                    'document_title': chunk.document.title,
                    'chunk_text': chunk.chunk_text[:200],
                    'page_number': chunk.page_number,
                    'citation_index': i + 1
                })
        
        # Generate AI response
        try:
            if context_chunks:
                response_text = ollama_service.generate_with_context(
                    question=message_content,
                    context_chunks=context_chunks,
                    stream=False
                )
            else:
                response_text = ollama_service.generate(
                    prompt=message_content,
                    stream=False
                )
            
            # Save assistant message
            assistant_message = Message.objects.create(
                conversation=conversation,
                role='assistant',
                content=response_text
            )
            
            # Save citations
            for cite in citations:
                Citation.objects.create(
                    message=assistant_message,
                    document_id=cite['document_id'],
                    chunk_text=cite['chunk_text'],
                    page_number=cite.get('page_number'),
                    citation_index=cite['citation_index']
                )
            
            return Response({
                'conversation_id': conversation.id,
                'message': MessageSerializer(assistant_message).data,
                'citations': citations
            })
            
        except Exception as e:
            return Response({'error': str(e)}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def stream(self, request):
        """Stream AI response using Server-Sent Events"""
        message_content = request.data.get('message')
        document_ids = request.data.get('document_ids', [])
        
        def generate():
            try:
                # Get context
                context_chunks = []
                if document_ids:
                    chunks = DocumentChunk.objects.filter(
                        document_id__in=document_ids
                    )[:10]
                    context_chunks = [c.chunk_text for c in chunks]
                
                # Stream response
                if context_chunks:
                    generator = ollama_service.generate_with_context(
                        question=message_content,
                        context_chunks=context_chunks,
                        stream=True
                    )
                else:
                    generator = ollama_service.generate(
                        prompt=message_content,
                        stream=True
                    )
                
                for chunk in generator:
                    yield f"data: {json.dumps({'content': chunk})}\n\n"
                
                yield f"data: {json.dumps({'done': True})}\n\n"
                
            except Exception as e:
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
        
        response = StreamingHttpResponse(
            generate(),
            content_type='text/event-stream'
        )
        response['Cache-Control'] = 'no-cache'
        return response
