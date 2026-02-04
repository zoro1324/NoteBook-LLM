from rest_framework import serializers
from .models import Notebook, Conversation, Message, Citation
from documents.models import Document


class CitationSerializer(serializers.ModelSerializer):
    document_title = serializers.CharField(source='document.title', read_only=True)
    
    class Meta:
        model = Citation
        fields = ['id', 'document', 'document_title', 'chunk_text', 'page_number', 
                  'start_char', 'end_char', 'citation_index']


class MessageSerializer(serializers.ModelSerializer):
    citations = CitationSerializer(many=True, read_only=True)
    
    class Meta:
        model = Message
        fields = ['id', 'role', 'content', 'created_at', 'citations']


class ConversationSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)
    message_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = ['id', 'notebook', 'title', 'documents', 'created_at', 
                  'updated_at', 'messages', 'message_count']
    
    def get_message_count(self, obj):
        return obj.messages.count()


class NotebookListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for homepage grid"""
    source_count = serializers.ReadOnlyField()
    date = serializers.SerializerMethodField()
    
    class Meta:
        model = Notebook
        fields = ['id', 'title', 'description', 'icon', 'color', 'is_public', 'source_count', 'date', 
                  'created_at', 'updated_at']
    
    def get_date(self, obj):
        return obj.updated_at.strftime('%d %b %Y')


class NotebookDetailSerializer(serializers.ModelSerializer):
    """Full serializer for notebook page"""
    documents = serializers.SerializerMethodField()
    conversations = ConversationSerializer(many=True, read_only=True)
    source_count = serializers.ReadOnlyField()
    
    class Meta:
        model = Notebook
        fields = ['id', 'title', 'description', 'icon', 'color', 'is_public', 'documents', 'conversations',
                  'source_count', 'created_at', 'updated_at']
    
    def get_documents(self, obj):
        from documents.serializers import DocumentSerializer
        return DocumentSerializer(obj.documents.all(), many=True).data
