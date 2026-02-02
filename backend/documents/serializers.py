from rest_framework import serializers
from .models import Document, DocumentChunk, NotebookGuide


class DocumentChunkSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentChunk
        fields = ['id', 'chunk_text', 'chunk_index', 'page_number', 
                  'start_char', 'end_char']


class DocumentSerializer(serializers.ModelSerializer):
    file_size = serializers.ReadOnlyField()
    filename = serializers.ReadOnlyField()
    
    class Meta:
        model = Document
        fields = ['id', 'title', 'file_type', 'file', 'url', 'word_count',
                  'summary', 'created_at', 'updated_at', 'processed', 
                  'file_size', 'filename']
        read_only_fields = ['processed', 'word_count', 'summary']


class DocumentUploadSerializer(serializers.ModelSerializer):
    """Serializer for file uploads"""
    class Meta:
        model = Document
        fields = ['id', 'title', 'file', 'url']
    
    def create(self, validated_data):
        # Auto-detect file type from extension
        file = validated_data.get('file')
        if file:
            ext = file.name.split('.')[-1].lower()
            type_map = {
                'pdf': 'pdf',
                'docx': 'docx', 'doc': 'docx',
                'txt': 'txt',
                'md': 'md', 'markdown': 'md',
                'mp3': 'audio', 'wav': 'audio', 'ogg': 'audio',
                'mp4': 'video', 'webm': 'video', 'mov': 'video',
            }
            validated_data['file_type'] = type_map.get(ext, 'txt')
            if not validated_data.get('title'):
                validated_data['title'] = file.name
        elif validated_data.get('url'):
            validated_data['file_type'] = 'url'
        
        return super().create(validated_data)


class NotebookGuideSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotebookGuide
        fields = ['id', 'guide_type', 'title', 'content', 'created_at']
