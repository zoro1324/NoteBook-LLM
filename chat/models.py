from django.db import models
from documents.models import Document


class Conversation(models.Model):
    """
    Chat conversation thread with documents.
    """
    title = models.CharField(max_length=255, default="New Chat")
    documents = models.ManyToManyField(Document, related_name='conversations', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-updated_at']
    
    def __str__(self):
        return f"{self.title} ({self.messages.count()} messages)"


class Message(models.Model):
    """
    Individual chat messages with source citations.
    """
    ROLE_CHOICES = [
        ('user', 'User'),
        ('assistant', 'Assistant'),
        ('system', 'System'),
    ]
    
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    content = models.TextField()
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    tokens_used = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.role}: {self.content[:50]}..."


class Citation(models.Model):
    """
    Citations linking AI responses to source documents.
    This is the key feature that makes NotebookLM trustworthy.
    """
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='citations')
    document = models.ForeignKey(Document, on_delete=models.CASCADE)
    
    # Reference to specific chunk
    chunk_text = models.TextField()
    page_number = models.IntegerField(null=True, blank=True)
    start_char = models.IntegerField(null=True, blank=True)
    end_char = models.IntegerField(null=True, blank=True)
    
    # Position in message where citation appears
    citation_index = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['citation_index']
    
    def __str__(self):
        return f"Citation {self.citation_index} from {self.document.title}"
