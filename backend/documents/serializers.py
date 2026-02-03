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
    chunk_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Document
        fields = ['id', 'title', 'file_type', 'file', 'url', 'word_count',
                  'summary', 'created_at', 'updated_at', 'processed', 'embedded',
                  'file_size', 'filename', 'chunk_count', 'processing_error']
        read_only_fields = ['processed', 'embedded', 'word_count', 'summary', 'processing_error']
    
    def get_chunk_count(self, obj):
        return obj.chunks.count()


class DocumentUploadSerializer(serializers.ModelSerializer):
    """Serializer for file uploads"""
    title = serializers.CharField(required=False, allow_blank=True)
    file = serializers.FileField(required=False)
    url = serializers.URLField(required=False, allow_blank=True)
    
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
                'pptx': 'pptx', 'ppt': 'pptx',
                'txt': 'txt',
                'md': 'md', 'markdown': 'md',
                'png': 'image', 'jpg': 'image', 'jpeg': 'image', 'gif': 'image',
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
