"""
Main RAG Service Orchestrator
Coordinates the full RAG pipeline: ingestion, embedding, retrieval, and generation.
"""
import numpy as np
from typing import List, Optional, Dict, Any
from dataclasses import dataclass


@dataclass
class RAGResponse:
    """Response from RAG query"""
    answer: str
    sources: List[dict]
    citations: List[dict]
    context_tokens: int
    model_used: str


class RAGService:
    """
    Main RAG orchestration service.
    
    Pipeline:
    1. Document Processing → Chunking → Embedding → Vector Store (ingestion)
    2. Query → Embedding → Search → Context Assembly → LLM (retrieval)
    """
    
    def __init__(self):
        """Initialize with lazy-loaded components"""
        self._embedding_service = None
        self._vector_store = None
        self._chunker = None
        self._query_processor = None
        self._context_assembler = None
        self._llm_service = None
    
    @property
    def embedding_service(self):
        if self._embedding_service is None:
            from .embedding_service import embedding_service
            self._embedding_service = embedding_service
        return self._embedding_service
    
    @property
    def vector_store(self):
        if self._vector_store is None:
            from .vector_store import get_vector_store
            # Get dimension from embedding service
            dim = self.embedding_service.get_embedding_dimension()
            self._vector_store = get_vector_store(dimension=dim)
        return self._vector_store
    
    @property
    def chunker(self):
        if self._chunker is None:
            from .chunking_service import semantic_chunker
            self._chunker = semantic_chunker
        return self._chunker
    
    @property
    def query_processor(self):
        if self._query_processor is None:
            from .query_processor import query_processor
            self._query_processor = query_processor
        return self._query_processor
    
    @property
    def context_assembler(self):
        if self._context_assembler is None:
            from .context_assembler import context_assembler
            self._context_assembler = context_assembler
        return self._context_assembler
    
    @property
    def llm_service(self):
        if self._llm_service is None:
            from chat.services import ollama_service
            self._llm_service = ollama_service
        return self._llm_service
    
    # ============== Ingestion Pipeline ==============
    
    def ingest_document(self, document) -> Dict[str, Any]:
        """
        Full ingestion pipeline for a document.
        
        Args:
            document: Document model instance
            
        Returns:
            Dict with ingestion stats
        """
        from .vector_store import ChunkMetadata
        from documents.models import DocumentChunk
        
        if not document.extracted_text:
            return {'error': 'No extracted text', 'chunks': 0}
        
        # Step 1: Semantic chunking
        chunks = self.chunker.chunk_with_metadata(
            text=document.extracted_text,
            doc_id=document.id,
            base_chunk_id=0
        )
        
        if not chunks:
            return {'error': 'No chunks created', 'chunks': 0}
        
        # Step 2: Generate embeddings
        chunk_texts = [c['text'] for c in chunks]
        embeddings = self.embedding_service.embed_texts(
            chunk_texts,
            show_progress=len(chunks) > 10
        )
        
        # Step 3: Prepare metadata
        metadatas = [
            ChunkMetadata(
                doc_id=c['doc_id'],
                chunk_id=c['chunk_id'],
                chunk_index=c['chunk_index'],
                page_number=c.get('page_number'),
                chunk_type=c.get('chunk_type', 'text'),
                section_title=c.get('section_title'),
                token_count=c.get('token_count', 0)
            )
            for c in chunks
        ]
        
        # Step 4: Store in vector store
        chunk_ids = self.vector_store.add(
            embeddings=embeddings,
            texts=chunk_texts,
            metadatas=metadatas
        )
        
        # Step 5: Save chunks to database
        DocumentChunk.objects.filter(document=document).delete()  # Clear old chunks
        
        for i, c in enumerate(chunks):
            DocumentChunk.objects.create(
                document=document,
                chunk_text=c['text'],
                chunk_index=c['chunk_index'],
                page_number=c.get('page_number'),
                start_char=c.get('start_char', 0),
                end_char=c.get('end_char', 0),
                embedding_id=str(chunk_ids[i]) if i < len(chunk_ids) else ''
            )
        
        # Step 6: Update document status
        document.embedded = True
        document.save()
        
        # Step 7: Persist vector store
        self.vector_store.save()
        
        return {
            'chunks': len(chunks),
            'embedded': True,
            'dimension': embeddings.shape[1] if len(embeddings) > 0 else 0
        }
    
    def remove_document(self, doc_id: int):
        """
        Remove document from vector store.
        
        Args:
            doc_id: Document ID to remove
        """
        self.vector_store.delete_by_doc_id(doc_id)
        self.vector_store.save()
    
    # ============== Retrieval Pipeline ==============
    
    def retrieve(
        self,
        query: str,
        doc_ids: Optional[List[int]] = None,
        k: Optional[int] = None
    ) -> List[dict]:
        """
        Retrieve relevant chunks for a query.
        
        Args:
            query: User query
            doc_ids: Optional list of document IDs to search
            k: Number of results (auto-determined if not specified)
            
        Returns:
            List of chunk dictionaries with scores
        """
        # Process query
        processed = self.query_processor.process(query, embed=True)
        
        # Use suggested K if not specified
        search_k = k or processed.suggested_k
        
        # Search vector store
        results = self.vector_store.search(
            query_embedding=processed.query_embedding,
            k=search_k,
            doc_ids=doc_ids
        )
        
        # Enrich with document info
        enriched = []
        from documents.models import Document
        
        for result in results:
            try:
                doc = Document.objects.get(id=result.doc_id)
                doc_title = doc.title
            except Document.DoesNotExist:
                doc_title = f"Document {result.doc_id}"
            
            enriched.append({
                'chunk_id': result.chunk_id,
                'doc_id': result.doc_id,
                'doc_title': doc_title,
                'text': result.text,
                'score': result.score,
                'page_number': result.metadata.page_number,
                'chunk_index': result.metadata.chunk_index,
                'chunk_type': result.metadata.chunk_type,
                'section_title': result.metadata.section_title,
            })
        
        return enriched
    
    def query(
        self,
        question: str,
        doc_ids: Optional[List[int]] = None,
        k: Optional[int] = None,
        stream: bool = False
    ) -> RAGResponse:
        """
        Full RAG query: retrieve context and generate answer.
        
        Args:
            question: User question
            doc_ids: Optional document filter
            k: Number of chunks to retrieve
            stream: Whether to stream response
            
        Returns:
            RAGResponse with answer and sources
        """
        # Step 1: Retrieve relevant chunks
        chunks = self.retrieve(question, doc_ids=doc_ids, k=k)
        
        if not chunks:
            return RAGResponse(
                answer="I couldn't find relevant information in the provided documents to answer your question.",
                sources=[],
                citations=[],
                context_tokens=0,
                model_used=self.llm_service.model
            )
        
        # Step 2: Assemble context
        assembled = self.context_assembler.assemble(chunks)
        
        # Step 3: Generate answer
        system_prompt = """You are a helpful AI assistant that answers questions based ONLY on the provided source documents.

CRITICAL RULES:
1. Answer based ONLY on the context provided below. NEVER use external knowledge or assumptions.
2. If the information is not explicitly stated in the sources, say "I cannot find this information in the provided documents."
3. NEVER mention document types (like PowerPoint, PPT, slides) unless explicitly shown in the source text.
4. When citing information, use the exact source reference format [Source X].
5. Keep answers factual, accurate, and based strictly on what the sources say.
6. If you're uncertain about something, acknowledge the uncertainty rather than guessing.
7. Do not embellish, paraphrase excessively, or add information not found in the sources."""

        user_prompt = f"""Context from documents:

{assembled.context_text}

---

Question: {question}

Please provide a comprehensive answer based on the sources above."""

        if stream:
            answer = self.llm_service.generate(
                prompt=user_prompt,
                system_prompt=system_prompt,
                stream=True
            )
            # For streaming, return generator wrapped in response
            return RAGResponse(
                answer=answer,  # This is a generator
                sources=[{'doc_id': d} for d in assembled.source_documents],
                citations=assembled.citations,
                context_tokens=assembled.total_tokens,
                model_used=self.llm_service.model
            )
        else:
            answer = self.llm_service.generate(
                prompt=user_prompt,
                system_prompt=system_prompt,
                stream=False
            )
            
            return RAGResponse(
                answer=answer,
                sources=[{'doc_id': d} for d in assembled.source_documents],
                citations=assembled.citations,
                context_tokens=assembled.total_tokens,
                model_used=self.llm_service.model
            )
    
    # ============== Utility Methods ==============
    
    def get_stats(self) -> dict:
        """Get RAG system statistics"""
        return {
            'total_vectors': self.vector_store.get_total_count(),
            'embedding_dimension': self.embedding_service.get_embedding_dimension(),
            'embedding_model': self.embedding_service._model_name,
        }
    
    def reindex_document(self, document) -> Dict[str, Any]:
        """
        Reindex a document (remove and re-add).
        
        Args:
            document: Document model instance
            
        Returns:
            Ingestion stats
        """
        self.remove_document(document.id)
        return self.ingest_document(document)


# Global singleton
rag_service = RAGService()
