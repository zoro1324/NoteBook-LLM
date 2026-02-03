"""
FAISS Vector Store for RAG Pipeline
Stores and retrieves document embeddings with metadata.
"""
import os
import json
import pickle
import numpy as np
from pathlib import Path
from typing import List, Dict, Optional, Tuple, Any
from dataclasses import dataclass, asdict
from django.conf import settings


@dataclass
class ChunkMetadata:
    """Metadata stored with each chunk in the vector store"""
    doc_id: int
    chunk_id: int
    chunk_index: int
    page_number: Optional[int] = None
    chunk_type: str = "text"  # text, table, heading
    section_title: Optional[str] = None
    token_count: int = 0
    
    def to_dict(self) -> dict:
        return asdict(self)
    
    @classmethod
    def from_dict(cls, d: dict) -> 'ChunkMetadata':
        return cls(**d)


@dataclass 
class SearchResult:
    """Result from vector search"""
    chunk_id: int
    doc_id: int
    score: float
    text: str
    metadata: ChunkMetadata
    
    def to_dict(self) -> dict:
        return {
            'chunk_id': self.chunk_id,
            'doc_id': self.doc_id,
            'score': float(self.score),
            'text': self.text,
            'metadata': self.metadata.to_dict()
        }


class FAISSVectorStore:
    """
    Vector store using FAISS for efficient similarity search.
    Stores embeddings with associated metadata and text.
    """
    
    def __init__(self, persist_dir: Optional[str] = None, dimension: int = 384):
        """
        Initialize the vector store.
        
        Args:
            persist_dir: Directory to persist the index
            dimension: Embedding dimension (default 384 for MiniLM)
        """
        config = getattr(settings, 'APP_CONFIG', {}).get('vector_db', {})
        self.persist_dir = Path(persist_dir or config.get('persist_directory', 'data/vector_store'))
        self.dimension = dimension
        
        # FAISS index
        self._index = None
        
        # Metadata storage (id -> metadata)
        self._metadata: Dict[int, ChunkMetadata] = {}
        
        # Text storage (id -> chunk text)
        self._texts: Dict[int, str] = {}
        
        # ID mapping (internal FAISS id -> chunk_id)
        self._id_map: List[int] = []
        
        # Track next ID
        self._next_id = 0
        
        # Ensure persist directory exists
        self.persist_dir.mkdir(parents=True, exist_ok=True)
        
        # Try to load existing index
        self._load_if_exists()
    
    def _get_or_create_index(self):
        """Get or create FAISS index"""
        if self._index is None:
            try:
                import faiss
                
                # Use IndexFlatIP for cosine similarity (assumes normalized vectors)
                self._index = faiss.IndexFlatIP(self.dimension)
                print(f"[VectorStore] Created new FAISS index with dimension {self.dimension}")
                
            except ImportError:
                raise ImportError(
                    "faiss is required. Install with: pip install faiss-cpu"
                )
        
        return self._index
    
    def _load_if_exists(self):
        """Load index from disk if it exists"""
        index_path = self.persist_dir / "faiss.index"
        metadata_path = self.persist_dir / "metadata.pkl"
        
        if index_path.exists() and metadata_path.exists():
            try:
                import faiss
                
                self._index = faiss.read_index(str(index_path))
                
                with open(metadata_path, 'rb') as f:
                    data = pickle.load(f)
                    self._metadata = data.get('metadata', {})
                    self._texts = data.get('texts', {})
                    self._id_map = data.get('id_map', [])
                    self._next_id = data.get('next_id', 0)
                    self.dimension = data.get('dimension', self.dimension)
                
                print(f"[VectorStore] Loaded index with {self._index.ntotal} vectors")
                
            except Exception as e:
                print(f"[VectorStore] Failed to load index: {e}")
                self._index = None
    
    def save(self):
        """Persist the index and metadata to disk"""
        if self._index is None or self._index.ntotal == 0:
            return
        
        try:
            import faiss
            
            index_path = self.persist_dir / "faiss.index"
            metadata_path = self.persist_dir / "metadata.pkl"
            
            # Save FAISS index
            faiss.write_index(self._index, str(index_path))
            
            # Save metadata
            with open(metadata_path, 'wb') as f:
                pickle.dump({
                    'metadata': self._metadata,
                    'texts': self._texts,
                    'id_map': self._id_map,
                    'next_id': self._next_id,
                    'dimension': self.dimension,
                }, f)
            
            print(f"[VectorStore] Saved index with {self._index.ntotal} vectors")
            
        except Exception as e:
            print(f"[VectorStore] Failed to save index: {e}")
    
    def add(
        self,
        embeddings: np.ndarray,
        texts: List[str],
        metadatas: List[ChunkMetadata]
    ) -> List[int]:
        """
        Add embeddings with metadata to the store.
        
        Args:
            embeddings: Array of shape (n, dimension)
            texts: List of chunk texts
            metadatas: List of ChunkMetadata objects
            
        Returns:
            List of assigned chunk IDs
        """
        if len(embeddings) == 0:
            return []
        
        if len(embeddings) != len(texts) or len(embeddings) != len(metadatas):
            raise ValueError("embeddings, texts, and metadatas must have same length")
        
        # Ensure embeddings are float32
        embeddings = embeddings.astype(np.float32)
        
        # Check dimension
        if embeddings.shape[1] != self.dimension:
            if self._index is None or self._index.ntotal == 0:
                # Update dimension if index is empty
                self.dimension = embeddings.shape[1]
            else:
                raise ValueError(f"Embedding dimension {embeddings.shape[1]} != index dimension {self.dimension}")
        
        index = self._get_or_create_index()
        
        # Generate IDs
        chunk_ids = []
        for i, meta in enumerate(metadatas):
            chunk_id = meta.chunk_id if meta.chunk_id else self._next_id
            self._next_id = max(self._next_id, chunk_id + 1)
            
            chunk_ids.append(chunk_id)
            self._id_map.append(chunk_id)
            self._metadata[chunk_id] = meta
            self._texts[chunk_id] = texts[i]
        
        # Add to FAISS index
        index.add(embeddings)
        
        print(f"[VectorStore] Added {len(embeddings)} vectors. Total: {index.ntotal}")
        
        return chunk_ids
    
    def search(
        self,
        query_embedding: np.ndarray,
        k: int = 5,
        doc_ids: Optional[List[int]] = None,
        min_score: float = 0.0
    ) -> List[SearchResult]:
        """
        Search for similar vectors.
        
        Args:
            query_embedding: Query vector of shape (dimension,)
            k: Number of results to return
            doc_ids: Optional filter to specific documents
            min_score: Minimum similarity score threshold
            
        Returns:
            List of SearchResult objects
        """
        if self._index is None or self._index.ntotal == 0:
            return []
        
        # Reshape query if needed
        query_embedding = query_embedding.astype(np.float32)
        if query_embedding.ndim == 1:
            query_embedding = query_embedding.reshape(1, -1)
        
        # Search more than k if filtering by doc_ids
        search_k = k * 3 if doc_ids else k
        search_k = min(search_k, self._index.ntotal)
        
        # Run FAISS search
        scores, indices = self._index.search(query_embedding, search_k)
        
        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx < 0 or idx >= len(self._id_map):
                continue
            
            chunk_id = self._id_map[idx]
            metadata = self._metadata.get(chunk_id)
            
            if metadata is None:
                continue
            
            # Apply filters
            if score < min_score:
                continue
            
            if doc_ids and metadata.doc_id not in doc_ids:
                continue
            
            results.append(SearchResult(
                chunk_id=chunk_id,
                doc_id=metadata.doc_id,
                score=float(score),
                text=self._texts.get(chunk_id, ""),
                metadata=metadata
            ))
            
            if len(results) >= k:
                break
        
        return results
    
    def delete_by_doc_id(self, doc_id: int):
        """
        Delete all vectors for a document.
        Note: FAISS doesn't support deletion efficiently, so we rebuild the index.
        
        Args:
            doc_id: Document ID to delete
        """
        if self._index is None or self._index.ntotal == 0:
            return
        
        # Find chunk IDs to keep
        keep_ids = [cid for cid, meta in self._metadata.items() if meta.doc_id != doc_id]
        
        if len(keep_ids) == len(self._metadata):
            return  # Nothing to delete
        
        # Rebuild index with remaining vectors
        self._rebuild_index(keep_ids)
        
        print(f"[VectorStore] Deleted vectors for doc_id={doc_id}")
    
    def _rebuild_index(self, keep_ids: List[int]):
        """Rebuild index with only specified chunk IDs"""
        import faiss
        
        # Collect vectors and metadata to keep
        new_embeddings = []
        new_texts = {}
        new_metadata = {}
        new_id_map = []
        
        old_index = self._index
        
        for i, chunk_id in enumerate(self._id_map):
            if chunk_id in keep_ids:
                # Get vector from old index
                vec = old_index.reconstruct(i)
                new_embeddings.append(vec)
                new_id_map.append(chunk_id)
                new_texts[chunk_id] = self._texts.get(chunk_id, "")
                new_metadata[chunk_id] = self._metadata.get(chunk_id)
        
        # Create new index
        self._index = faiss.IndexFlatIP(self.dimension)
        
        if new_embeddings:
            embeddings_array = np.array(new_embeddings, dtype=np.float32)
            self._index.add(embeddings_array)
        
        self._texts = new_texts
        self._metadata = new_metadata
        self._id_map = new_id_map
    
    def get_doc_chunk_count(self, doc_id: int) -> int:
        """Get number of chunks indexed for a document"""
        return sum(1 for meta in self._metadata.values() if meta.doc_id == doc_id)
    
    def get_total_count(self) -> int:
        """Get total number of indexed vectors"""
        if self._index is None:
            return 0
        return self._index.ntotal
    
    def clear(self):
        """Clear the entire index"""
        self._index = None
        self._metadata = {}
        self._texts = {}
        self._id_map = []
        self._next_id = 0
        
        # Delete persisted files
        index_path = self.persist_dir / "faiss.index"
        metadata_path = self.persist_dir / "metadata.pkl"
        
        if index_path.exists():
            index_path.unlink()
        if metadata_path.exists():
            metadata_path.unlink()
        
        print("[VectorStore] Index cleared")


# Global singleton instance
_vector_store_instance = None


def get_vector_store(dimension: int = 384) -> FAISSVectorStore:
    """Get or create the global vector store instance"""
    global _vector_store_instance
    
    if _vector_store_instance is None:
        _vector_store_instance = FAISSVectorStore(dimension=dimension)
    
    return _vector_store_instance
