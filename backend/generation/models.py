from django.db import models


class GeneratedContent(models.Model):
    """
    Stores generated multimedia content (images, audio, video).
    """
    CONTENT_TYPES = [
        ('image', 'Image'),
        ('audio', 'Audio'),
        ('video', 'Video'),
    ]
    
    content_type = models.CharField(max_length=10, choices=CONTENT_TYPES)
    prompt = models.TextField()  # User's prompt
    file = models.FileField(upload_to='generated/')
    
    # Generation parameters
    model_used = models.CharField(max_length=255)
    generation_params = models.JSONField(default=dict)  # Store all params
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    generation_time = models.FloatField(default=0)  # Seconds
    file_size_mb = models.FloatField(default=0)
    
    # Optional: Link to source documents if generated from doc context
    source_prompt_context = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.content_type} - {self.prompt[:50]}..."
    
    @property
    def file_url(self):
        """Get URL for the generated file"""
        if self.file:
            return self.file.url
        return None


class GenerationQueue(models.Model):
    """
    Queue for managing generation tasks (useful for batch processing).
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    content_type = models.CharField(max_length=10)
    prompt = models.TextField()
    params = models.JSONField(default=dict)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    error_message = models.TextField(blank=True)
    
    # Result
    generated_content = models.ForeignKey(
        GeneratedContent, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.content_type} - {self.status}"
