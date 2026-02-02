from django.db import models
from django.contrib.auth.models import User
import os


class Document(models.Model):
    """
    Represents an uploaded document/source file.
    Similar to NotebookLM's "Sources" concept.
    """
    FILE_TYPES = [
        ('pdf', 'PDF Document'),
        ('docx', 'Word Document'),
        ('txt', 'Text File'),
        ('md', 'Markdown File'),
        ('audio', 'Audio File'),
        ('video', 'Video File'),
        ('url', 'Web URL'),
    ]
    
    title = models.CharField(max_length=255, blank=True, default='Untitled')
    file_type = models.CharField(max_length=10, choices=FILE_TYPES, blank=True, default='txt')
    file = models.FileField(upload_to='documents/', null=True, blank=True)
    url = models.URLField(null=True, blank=True)  # For web URLs
    
    # Content
    extracted_text = models.TextField(blank=True)  # Full extracted text
    summary = models.TextField(blank=True)  # AI-generated summary
    word_count = models.IntegerField(default=0)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    processed = models.BooleanField(default=False)
    processing_error = models.TextField(blank=True)
    
    # Embeddings flag
    embedded = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title
    
    @property
    def file_size(self):
        """Get file size in MB"""
        if self.file:
            return round(self.file.size / (1024 * 1024), 2)
        return 0
    
    @property
    def filename(self):
        """Get original filename"""
        if self.file:
            return os.path.basename(self.file.name)
        return ""


class DocumentChunk(models.Model):
    """
    Text chunks from documents for RAG (Retrieval Augmented Generation).
    Each chunk is embedded and stored in vector database.
    """
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='chunks')
    chunk_text = models.TextField()
    chunk_index = models.IntegerField()  # Position in document
    
    # For citation purposes
    page_number = models.IntegerField(null=True, blank=True)  # For PDFs
    start_char = models.IntegerField(default=0)
    end_char = models.IntegerField(default=0)
    
    # Embedding info
    embedding_id = models.CharField(max_length=255, blank=True)  # ID in vector store
    
    class Meta:
        ordering = ['document', 'chunk_index']
        unique_together = ['document', 'chunk_index']
    
    def __str__(self):
        return f"{self.document.title} - Chunk {self.chunk_index}"


class NotebookGuide(models.Model):
    """
    AI-generated guides from documents (FAQs, Study Guides, Summaries).
    Similar to NotebookLM's "Notebook Guide" feature.
    """
    GUIDE_TYPES = [
        ('faq', 'Frequently Asked Questions'),
        ('study', 'Study Guide'),
        ('summary', 'Briefing Document'),
        ('toc', 'Table of Contents'),
    ]
    
    documents = models.ManyToManyField(Document, related_name='guides')
    guide_type = models.CharField(max_length=20, choices=GUIDE_TYPES)
    title = models.CharField(max_length=255)
    content = models.TextField()  # Markdown formatted content
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.get_guide_type_display()} - {self.title}"
