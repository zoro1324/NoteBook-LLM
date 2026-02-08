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

from .models import Notebook, Conversation, Message, Citation
from .serializers import (
    NotebookListSerializer, NotebookDetailSerializer,
    ConversationSerializer, MessageSerializer
)
from documents.models import Document, DocumentChunk, NotebookGuide
from generation.podcast_service import podcast_service
import os
from django.conf import settings


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

    @action(detail=True, methods=['post'])
    def get_persona_options(self, request, pk=None):
        """Generate persona options based on notebook documents"""
        notebook = self.get_object()
        
        # Aggregate text
        all_text = ""
        for doc in notebook.documents.all():
            if doc.extracted_text:
                all_text += f"\n\n--- Document: {doc.title} ---\n{doc.extracted_text}"
        
        if not all_text.strip():
             return Response(
                {'error': 'No text content found in notebook documents.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            options = podcast_service.generate_persona_options(all_text)
            return Response({'options': options})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def get_scenario_options(self, request, pk=None):
        """Generate podcast theme/scenario options based on notebook documents and selected personas"""
        notebook = self.get_object()
        person1 = request.data.get('person1')
        person2 = request.data.get('person2')
        personas = {'person1': person1, 'person2': person2} if person1 and person2 else None
        
        # Aggregate text
        all_text = ""
        for doc in notebook.documents.all():
            if doc.extracted_text:
                all_text += f"\n\n--- Document: {doc.title} ---\n{doc.extracted_text}"
        
        if not all_text.strip():
             return Response(
                {'error': 'No text content found in notebook documents.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            options = podcast_service.generate_scenario_options(all_text, personas=personas)
            return Response({'options': options})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def generate_podcast(self, request, pk=None):
        """Generate podcast audio for the notebook with specific instruction and personas"""
        notebook = self.get_object()
        instruction = request.data.get('instruction')
        person1 = request.data.get('person1')
        person2 = request.data.get('person2')
        
        # Aggregate text
        all_text = ""
        for doc in notebook.documents.all():
            if doc.extracted_text:
                all_text += f"\n\n--- Document: {doc.title} ---\n{doc.extracted_text}"
        
        if not all_text.strip():
             return Response(
                {'error': 'No text content found in notebook documents.'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            # Output directory
            output_dir = os.path.join(settings.MEDIA_ROOT, 'podcasts')
            
            # Generate
            filename = podcast_service.generate_podcast(
                all_text, 
                instruction=instruction, 
                person1=person1,
                person2=person2,
                output_dir=output_dir
            )
            
            if not filename:
                return Response(
                    {'error': 'Failed to generate podcast audio'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
            # Construct URL
            audio_url = request.build_absolute_uri(settings.MEDIA_URL + 'podcasts/' + filename)
            
            # Save as NotebookGuide
            guide_title = f"Audio Overview"
            if person1 and person2:
                guide_title += f" ({person1} & {person2})"
            
            if len(guide_title) > 255:
                guide_title = guide_title[:252] + "..."
                
            guide = NotebookGuide.objects.create(
                guide_type='audio',
                title=guide_title,
                content=audio_url,
                notebook=notebook
            )
            
            # Link to documents
            guide.documents.set(notebook.documents.all())
            
            return Response({
                'status': 'success',
                'audio_url': audio_url,
                'guide_id': guide.id
            })
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


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
    API endpoint for chat operations with RAG-powered responses.
    Uses semantic search to find relevant context from documents.
    """
    
    def _get_rag_service(self):
        """Lazy load RAG service"""
        from rag.rag_service import rag_service
        return rag_service
    
    def _get_session_memory(self):
        """Lazy load session memory"""
        from rag.session_memory import session_memory
        return session_memory
    
    @action(detail=False, methods=['post'])
    def send(self, request):
        """Send a message and get AI response with RAG retrieval"""
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
        
        try:
            rag_service = self._get_rag_service()
            session_memory = self._get_session_memory()
            
            # Check if this is a follow-up question
            is_follow_up = session_memory.is_follow_up_query(conversation.id, message_content)
            
            # Get relevant chunks using RAG
            if document_ids:
                retrieved_chunks = rag_service.retrieve(
                    query=message_content,
                    doc_ids=document_ids,
                    k=10 if is_follow_up else None  # More context for follow-ups
                )
                
                # For follow-ups, merge with previous context
                if is_follow_up:
                    retrieved_chunks = session_memory.get_context_for_follow_up(
                        conversation.id,
                        retrieved_chunks
                    )
            else:
                retrieved_chunks = []
            
            # Build citations from retrieved chunks
            citations = []
            for i, chunk in enumerate(retrieved_chunks):
                citations.append({
                    'document_id': chunk.get('doc_id'),
                    'document_title': chunk.get('doc_title'),
                    'chunk_text': chunk.get('text', '')[:200] + '...' if len(chunk.get('text', '')) > 200 else chunk.get('text', ''),
                    'page_number': chunk.get('page_number'),
                    'section_title': chunk.get('section_title'),
                    'score': chunk.get('score', 0),
                    'citation_index': i + 1
                })
            
            # Generate response with RAG
            if retrieved_chunks:
                rag_response = rag_service.query(
                    question=message_content,
                    doc_ids=document_ids,
                    stream=False
                )
                response_text = rag_response.answer
            else:
                # No documents selected, use plain LLM
                from chat.services import ollama_service
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
            
            # Save citations to database
            for cite in citations[:5]:  # Limit stored citations
                Citation.objects.create(
                    message=assistant_message,
                    document_id=cite['document_id'],
                    chunk_text=cite['chunk_text'],
                    page_number=cite.get('page_number'),
                    citation_index=cite['citation_index']
                )
            
            # Update session memory
            if retrieved_chunks:
                from rag.query_processor import query_processor
                processed = query_processor.process(message_content, embed=False)
                session_memory.update_session(
                    conversation.id,
                    message_content,
                    retrieved_chunks,
                    processed.keywords
                )
            
            return Response({
                'conversation_id': conversation.id,
                'message': MessageSerializer(assistant_message).data,
                'citations': citations,
                'is_follow_up': is_follow_up
            })
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def stream(self, request):
        """Stream AI response using Server-Sent Events with RAG"""
        message_content = request.data.get('message')
        document_ids = request.data.get('document_ids', [])
        conversation_id = request.data.get('conversation_id')
        
        def generate():
            try:
                rag_service = self._get_rag_service()
                
                # Retrieve relevant chunks
                if document_ids:
                    retrieved_chunks = rag_service.retrieve(
                        query=message_content,
                        doc_ids=document_ids
                    )
                    
                    # Send citations first
                    citations = []
                    for i, chunk in enumerate(retrieved_chunks[:5]):
                        citations.append({
                            'document_id': chunk.get('doc_id'),
                            'document_title': chunk.get('doc_title'),
                            'chunk_text': chunk.get('text', '')[:200],
                            'page_number': chunk.get('page_number'),
                            'score': chunk.get('score', 0),
                            'citation_index': i + 1
                        })
                    
                    yield f"data: {json.dumps({'citations': citations})}\n\n"
                    
                    # Stream answer
                    rag_response = rag_service.query(
                        question=message_content,
                        doc_ids=document_ids,
                        stream=True
                    )
                    
                    # rag_response.answer is a generator when streaming
                    for chunk in rag_response.answer:
                        yield f"data: {json.dumps({'content': chunk})}\n\n"
                else:
                    # No documents, use plain LLM
                    from chat.services import ollama_service
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
    
    @action(detail=False, methods=['get'])
    def rag_stats(self, request):
        """Get RAG system statistics"""
        try:
            rag_service = self._get_rag_service()
            stats = rag_service.get_stats()
            return Response(stats)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
