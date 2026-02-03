"""
Tests for RAG Pipeline
"""
from django.test import TestCase
import numpy as np


class ChunkingServiceTest(TestCase):
    """Test semantic chunking service"""
    
    def test_basic_chunking(self):
        """Test that text is chunked correctly"""
        from rag.chunking_service import SemanticChunker
        
        chunker = SemanticChunker(min_tokens=50, max_tokens=100)
        
        text = """# Introduction

This is the first paragraph with some content.

## Section 1

More content here in section 1. This paragraph has multiple sentences.
It continues with more information.

## Section 2

Final section with concluding remarks."""
        
        chunks = chunker.chunk_text(text)
        
        self.assertGreater(len(chunks), 0)
        for chunk in chunks:
            self.assertIsNotNone(chunk.text)
            self.assertGreaterEqual(chunk.chunk_index, 0)
    
    def test_table_preservation(self):
        """Test that tables are not split"""
        from rag.chunking_service import SemanticChunker
        
        chunker = SemanticChunker(min_tokens=10, max_tokens=50)
        
        text = """Introduction text.

| Column A | Column B |
|----------|----------|
| Value 1 | Value 2 |
| Value 3 | Value 4 |

Conclusion text."""
        
        chunks = chunker.chunk_text(text)
        
        # Find the table chunk
        table_chunks = [c for c in chunks if c.chunk_type == 'table']
        self.assertEqual(len(table_chunks), 1)
        
        # Table should be complete
        self.assertIn('Column A', table_chunks[0].text)
        self.assertIn('Value 4', table_chunks[0].text)


class EmbeddingServiceTest(TestCase):
    """Test embedding service"""
    
    def test_embedding_generation(self):
        """Test that embeddings are generated correctly"""
        from rag.embedding_service import EmbeddingService
        
        service = EmbeddingService()
        
        # Skip if model not available
        try:
            embedding = service.embed_text("Hello world")
        except Exception:
            self.skipTest("Embedding model not available")
            return
        
        self.assertIsInstance(embedding, np.ndarray)
        self.assertGreater(len(embedding), 0)
    
    def test_batch_embedding(self):
        """Test batch embedding generation"""
        from rag.embedding_service import EmbeddingService
        
        service = EmbeddingService()
        
        texts = ["Hello world", "Another sentence", "Third text"]
        
        try:
            embeddings = service.embed_texts(texts, show_progress=False)
        except Exception:
            self.skipTest("Embedding model not available")
            return
        
        self.assertEqual(len(embeddings), 3)
        self.assertEqual(embeddings.shape[0], 3)


class VectorStoreTest(TestCase):
    """Test FAISS vector store"""
    
    def setUp(self):
        """Create temporary vector store"""
        import tempfile
        self.temp_dir = tempfile.mkdtemp()
    
    def test_add_and_search(self):
        """Test adding vectors and searching"""
        from rag.vector_store import FAISSVectorStore, ChunkMetadata
        
        store = FAISSVectorStore(persist_dir=self.temp_dir, dimension=8)
        
        # Create fake embeddings
        embeddings = np.random.rand(3, 8).astype(np.float32)
        texts = ["First doc", "Second doc", "Third doc"]
        metadatas = [
            ChunkMetadata(doc_id=1, chunk_id=0, chunk_index=0),
            ChunkMetadata(doc_id=1, chunk_id=1, chunk_index=1),
            ChunkMetadata(doc_id=2, chunk_id=2, chunk_index=0),
        ]
        
        # Add to store
        ids = store.add(embeddings, texts, metadatas)
        self.assertEqual(len(ids), 3)
        
        # Search
        query = np.random.rand(8).astype(np.float32)
        results = store.search(query, k=2)
        self.assertEqual(len(results), 2)
    
    def test_doc_filtering(self):
        """Test filtering by document ID"""
        from rag.vector_store import FAISSVectorStore, ChunkMetadata
        
        store = FAISSVectorStore(persist_dir=self.temp_dir, dimension=8)
        
        embeddings = np.random.rand(3, 8).astype(np.float32)
        texts = ["Doc1 chunk1", "Doc1 chunk2", "Doc2 chunk1"]
        metadatas = [
            ChunkMetadata(doc_id=1, chunk_id=0, chunk_index=0),
            ChunkMetadata(doc_id=1, chunk_id=1, chunk_index=1),
            ChunkMetadata(doc_id=2, chunk_id=2, chunk_index=0),
        ]
        
        store.add(embeddings, texts, metadatas)
        
        # Search only in doc 2
        query = np.random.rand(8).astype(np.float32)
        results = store.search(query, k=5, doc_ids=[2])
        
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0].doc_id, 2)


class QueryProcessorTest(TestCase):
    """Test query processing"""
    
    def test_intent_detection(self):
        """Test intent detection for different queries"""
        from rag.query_processor import QueryProcessor, QueryIntent
        
        processor = QueryProcessor()
        
        # Summary intent
        intent = processor.detect_intent("Summarize the main points")
        self.assertEqual(intent, QueryIntent.SUMMARY)
        
        # Explain intent
        intent = processor.detect_intent("What is machine learning?")
        self.assertEqual(intent, QueryIntent.EXPLAIN)
        
        # Compare intent
        intent = processor.detect_intent("Compare CNN and ViT models")
        self.assertEqual(intent, QueryIntent.COMPARE)
    
    def test_query_cleaning(self):
        """Test query cleaning"""
        from rag.query_processor import QueryProcessor
        
        processor = QueryProcessor()
        
        cleaned = processor.clean_query("  Hey, can you tell me about AI?  ")
        self.assertNotIn("Hey,", cleaned)
        self.assertNotIn("  ", cleaned)


class ContextAssemblerTest(TestCase):
    """Test context assembly"""
    
    def test_deduplication(self):
        """Test that duplicate chunks are removed"""
        from rag.context_assembler import ContextAssembler
        
        assembler = ContextAssembler()
        
        chunks = [
            {'chunk_id': 1, 'doc_id': 1, 'text': 'Same content here'},
            {'chunk_id': 2, 'doc_id': 1, 'text': 'Same content here'},  # Duplicate
            {'chunk_id': 3, 'doc_id': 1, 'text': 'Different content'},
        ]
        
        result = assembler.assemble(chunks)
        
        # Should only have 2 unique chunks
        self.assertEqual(result.chunks_used, 2)
    
    def test_token_limit(self):
        """Test that context respects token limits"""
        from rag.context_assembler import ContextAssembler
        
        assembler = ContextAssembler(max_tokens=100)
        
        # Create chunks with lots of text
        chunks = [
            {'chunk_id': i, 'doc_id': 1, 'text': f'Content block {i} ' * 50}
            for i in range(10)
        ]
        
        result = assembler.assemble(chunks)
        
        # Should not use all chunks due to limit
        self.assertLess(result.chunks_used, 10)
