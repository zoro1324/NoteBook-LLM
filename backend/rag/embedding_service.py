"""
Embedding Service for RAG Pipeline
Generates embeddings for document chunks using sentence-transformers.
Supports multiple embedding models: bge-small-en, nomic-embed-text, e5-small
"""
import os
import numpy as np
from pathlib import Path
from typing import List, Optional, Union
from django.conf import settings


class EmbeddingService:
    """
    Service for generating text embeddings using sentence-transformers.
    Model is lazy-loaded and cached for performance.
    """
    
    # Supported embedding models
    SUPPORTED_MODELS = {
        'bge-small': 'BAAI/bge-small-en-v1.5',
        'nomic': 'nomic-ai/nomic-embed-text-v1.5',
        'e5-small': 'intfloat/e5-small-v2',
        'minilm': 'sentence-transformers/all-MiniLM-L6-v2',
    }
    
    # Singleton instance
    _instance = None
    _model = None
    _model_name = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        """Initialize with config from settings"""
        if not hasattr(self, '_initialized'):
            config = getattr(settings, 'APP_CONFIG', {}).get('embeddings', {})
            self._default_model = config.get('model', 'BAAI/bge-small-en-v1.5')
            self._batch_size = config.get('batch_size', 32)
            self._initialized = True
    
    def _load_model(self, model_name: Optional[str] = None):
        """Lazy load the embedding model"""
        model_to_load = model_name or self._default_model
        
        # Resolve short names to full model paths
        if model_to_load in self.SUPPORTED_MODELS:
            model_to_load = self.SUPPORTED_MODELS[model_to_load]
        
        # Only reload if model changed
        if self._model is not None and self._model_name == model_to_load:
            return self._model
        
        try:
            from sentence_transformers import SentenceTransformer
            
            print(f"[Embedding] Loading model: {model_to_load}")
            
            # Set trust_remote_code for nomic model
            trust_remote = 'nomic' in model_to_load.lower()
            
            # Determine device - prefer CUDA if available
            import torch
            device = 'cuda' if torch.cuda.is_available() else 'cpu'
            
            self._model = SentenceTransformer(
                model_to_load,
                trust_remote_code=trust_remote,
                device=device
            )
            print(f"[Embedding] Using device: {device.upper()}")
            self._model_name = model_to_load
            
            print(f"[Embedding] Model loaded successfully. Dimension: {self._model.get_sentence_embedding_dimension()}")
            
            return self._model
            
        except ImportError:
            raise ImportError(
                "sentence-transformers is required. Install with: pip install sentence-transformers"
            )
        except Exception as e:
            raise Exception(f"Failed to load embedding model: {str(e)}")
    
    def get_embedding_dimension(self) -> int:
        """Get the dimension of embeddings from current model"""
        model = self._load_model()
        return model.get_sentence_embedding_dimension()
    
    def embed_text(self, text: str, model_name: Optional[str] = None) -> np.ndarray:
        """
        Generate embedding for a single text.
        
        Args:
            text: Text to embed
            model_name: Optional model override
            
        Returns:
            Numpy array of shape (embedding_dim,)
        """
        model = self._load_model(model_name)
        
        # For e5 models, add instruction prefix
        if 'e5' in (model_name or self._model_name).lower():
            text = f"passage: {text}"
        
        embedding = model.encode(text, convert_to_numpy=True, normalize_embeddings=True)
        return embedding
    
    def embed_texts(
        self, 
        texts: List[str], 
        model_name: Optional[str] = None,
        batch_size: Optional[int] = None,
        show_progress: bool = True
    ) -> np.ndarray:
        """
        Generate embeddings for multiple texts.
        
        Args:
            texts: List of texts to embed
            model_name: Optional model override
            batch_size: Batch size for encoding
            show_progress: Show progress bar
            
        Returns:
            Numpy array of shape (num_texts, embedding_dim)
        """
        if not texts:
            return np.array([])
        
        model = self._load_model(model_name)
        batch_size = batch_size or self._batch_size
        
        # For e5 models, add instruction prefix
        actual_model = model_name or self._model_name
        if 'e5' in actual_model.lower():
            texts = [f"passage: {t}" for t in texts]
        
        embeddings = model.encode(
            texts,
            batch_size=batch_size,
            convert_to_numpy=True,
            normalize_embeddings=True,
            show_progress_bar=show_progress
        )
        
        return embeddings
    
    def embed_query(self, query: str, model_name: Optional[str] = None) -> np.ndarray:
        """
        Generate embedding for a query (uses different prefix for e5 models).
        
        Args:
            query: Query text to embed
            model_name: Optional model override
            
        Returns:
            Numpy array of shape (embedding_dim,)
        """
        model = self._load_model(model_name)
        actual_model = model_name or self._model_name
        
        # For e5 models, use query prefix
        if 'e5' in actual_model.lower():
            query = f"query: {query}"
        # For bge models, optionally add instruction
        elif 'bge' in actual_model.lower():
            query = f"Represent this sentence for searching relevant passages: {query}"
        
        embedding = model.encode(query, convert_to_numpy=True, normalize_embeddings=True)
        return embedding
    
    def compute_similarity(
        self, 
        query_embedding: np.ndarray, 
        document_embeddings: np.ndarray
    ) -> np.ndarray:
        """
        Compute cosine similarity between query and documents.
        Assumes embeddings are already normalized.
        
        Args:
            query_embedding: Shape (embedding_dim,)
            document_embeddings: Shape (num_docs, embedding_dim)
            
        Returns:
            Similarity scores of shape (num_docs,)
        """
        # Ensure query is 1D
        if query_embedding.ndim == 2:
            query_embedding = query_embedding.squeeze()
        
        # Dot product of normalized vectors = cosine similarity
        similarities = np.dot(document_embeddings, query_embedding)
        return similarities
    
    def unload_model(self):
        """Unload model to free memory"""
        if self._model is not None:
            del self._model
            self._model = None
            self._model_name = None
            
            # Force garbage collection
            import gc
            gc.collect()
            
            try:
                import torch
                if torch.cuda.is_available():
                    torch.cuda.empty_cache()
            except ImportError:
                pass
            
            print("[Embedding] Model unloaded")


# Global singleton instance
embedding_service = EmbeddingService()
