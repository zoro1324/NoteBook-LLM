"""
Context Assembler for RAG Pipeline
Assembles retrieved chunks into coherent context for LLM.
"""
import re
from typing import List, Dict, Optional, Set
from dataclasses import dataclass


@dataclass
class AssembledContext:
    """Result of context assembly"""
    context_text: str
    chunks_used: int
    total_tokens: int
    source_documents: List[int]
    citations: List[dict]


class ContextAssembler:
    """
    Assembles retrieved chunks into coherent context for LLM.
    - Orders chunks logically
    - Deduplicates overlapping content
    - Preserves table formatting
    - Respects context window limits
    """
    
    # Maximum context tokens (leave room for system prompt + response)
    DEFAULT_MAX_TOKENS = 4000
    
    def __init__(self, max_tokens: int = None):
        """
        Initialize context assembler.
        
        Args:
            max_tokens: Maximum tokens for context
        """
        from django.conf import settings
        config = getattr(settings, 'APP_CONFIG', {}).get('retrieval', {})
        self.max_tokens = max_tokens or config.get('max_context_tokens', self.DEFAULT_MAX_TOKENS)
    
    def _count_tokens(self, text: str) -> int:
        """Estimate token count"""
        try:
            import tiktoken
            enc = tiktoken.get_encoding("cl100k_base")
            return len(enc.encode(text))
        except ImportError:
            # Rough estimation
            return len(text) // 4
    
    def _compute_text_hash(self, text: str) -> str:
        """Compute hash for deduplication"""
        # Normalize text for comparison
        normalized = re.sub(r'\s+', ' ', text.lower().strip())
        # Use first 100 chars as hash key
        return normalized[:100]
    
    def _calculate_overlap(self, text1: str, text2: str) -> float:
        """Calculate text overlap ratio"""
        words1 = set(text1.lower().split())
        words2 = set(text2.lower().split())
        
        if not words1 or not words2:
            return 0.0
        
        intersection = len(words1 & words2)
        union = len(words1 | words2)
        
        return intersection / union if union > 0 else 0.0
    
    def _deduplicate_chunks(
        self, 
        chunks: List[dict], 
        overlap_threshold: float = 0.7
    ) -> List[dict]:
        """
        Remove duplicate or highly overlapping chunks.
        
        Args:
            chunks: List of chunk dictionaries
            overlap_threshold: Max overlap ratio before dedup
            
        Returns:
            Deduplicated chunks
        """
        if not chunks:
            return []
        
        seen_hashes: Set[str] = set()
        unique_chunks = []
        
        for chunk in chunks:
            text = chunk.get('text', '')
            text_hash = self._compute_text_hash(text)
            
            # Exact duplicate check
            if text_hash in seen_hashes:
                continue
            
            # Overlap check with existing chunks
            is_duplicate = False
            for existing in unique_chunks:
                overlap = self._calculate_overlap(text, existing.get('text', ''))
                if overlap >= overlap_threshold:
                    is_duplicate = True
                    break
            
            if not is_duplicate:
                seen_hashes.add(text_hash)
                unique_chunks.append(chunk)
        
        return unique_chunks
    
    def _sort_chunks(self, chunks: List[dict]) -> List[dict]:
        """
        Sort chunks for logical ordering.
        
        Priority:
        1. Group by document
        2. Order by page number
        3. Order by chunk index
        """
        return sorted(chunks, key=lambda c: (
            c.get('doc_id', 0),
            c.get('page_number', 0) or 0,
            c.get('chunk_index', 0)
        ))
    
    def _format_chunk(self, chunk: dict, index: int) -> str:
        """
        Format a chunk for inclusion in context.
        
        Args:
            chunk: Chunk dictionary
            index: Citation index
            
        Returns:
            Formatted chunk string
        """
        text = chunk.get('text', '')
        doc_title = chunk.get('doc_title', f"Document {chunk.get('doc_id', '?')}")
        page = chunk.get('page_number')
        section = chunk.get('section_title')
        
        # Build header
        header_parts = [f"[Source {index}]"]
        
        if doc_title:
            header_parts.append(f"From: {doc_title}")
        
        if page:
            header_parts.append(f"Page {page}")
        
        if section:
            header_parts.append(f"Section: {section}")
        
        header = " | ".join(header_parts)
        
        return f"{header}\n{text}"
    
    def _build_citations(self, chunks: List[dict]) -> List[dict]:
        """Build citation metadata from chunks"""
        citations = []
        
        for i, chunk in enumerate(chunks, 1):
            citations.append({
                'index': i,
                'doc_id': chunk.get('doc_id'),
                'doc_title': chunk.get('doc_title'),
                'chunk_id': chunk.get('chunk_id'),
                'page_number': chunk.get('page_number'),
                'section_title': chunk.get('section_title'),
                'preview': chunk.get('text', '')[:200] + '...' if len(chunk.get('text', '')) > 200 else chunk.get('text', '')
            })
        
        return citations
    
    def assemble(
        self,
        chunks: List[dict],
        max_tokens: Optional[int] = None
    ) -> AssembledContext:
        """
        Assemble chunks into context for LLM.
        
        Args:
            chunks: List of chunk dictionaries with text and metadata
            max_tokens: Override max tokens
            
        Returns:
            AssembledContext with formatted context and metadata
        """
        if not chunks:
            return AssembledContext(
                context_text="",
                chunks_used=0,
                total_tokens=0,
                source_documents=[],
                citations=[]
            )
        
        max_tokens = max_tokens or self.max_tokens
        
        # Deduplicate
        unique_chunks = self._deduplicate_chunks(chunks)
        
        # Sort logically
        sorted_chunks = self._sort_chunks(unique_chunks)
        
        # Assemble within token limit
        context_parts = []
        used_chunks = []
        current_tokens = 0
        
        for chunk in sorted_chunks:
            citation_index = len(used_chunks) + 1
            formatted = self._format_chunk(chunk, citation_index)
            chunk_tokens = self._count_tokens(formatted)
            
            # Check if adding this chunk exceeds limit
            if current_tokens + chunk_tokens > max_tokens:
                # Try to fit partial chunk for tables
                if chunk.get('chunk_type') == 'table':
                    # Tables are important, include if possible
                    if current_tokens + chunk_tokens < max_tokens * 1.1:
                        context_parts.append(formatted)
                        used_chunks.append(chunk)
                        current_tokens += chunk_tokens
                break
            
            context_parts.append(formatted)
            used_chunks.append(chunk)
            current_tokens += chunk_tokens
        
        # Join with separators
        context_text = "\n\n---\n\n".join(context_parts)
        
        # Get unique document IDs
        source_docs = list(set(c.get('doc_id') for c in used_chunks if c.get('doc_id')))
        
        return AssembledContext(
            context_text=context_text,
            chunks_used=len(used_chunks),
            total_tokens=current_tokens,
            source_documents=source_docs,
            citations=self._build_citations(used_chunks)
        )
    
    def assemble_for_follow_up(
        self,
        previous_chunks: List[dict],
        new_chunks: List[dict],
        max_tokens: Optional[int] = None
    ) -> AssembledContext:
        """
        Assemble context for follow-up question, prioritizing new chunks
        but including relevant previous context.
        
        Args:
            previous_chunks: Chunks from previous turn
            new_chunks: Newly retrieved chunks
            max_tokens: Override max tokens
            
        Returns:
            AssembledContext
        """
        max_tokens = max_tokens or self.max_tokens
        
        # Allocate 70% to new, 30% to previous
        new_max = int(max_tokens * 0.7)
        prev_max = max_tokens - new_max
        
        # Assemble new context first
        new_context = self.assemble(new_chunks, new_max)
        
        # Add relevant previous context
        remaining_tokens = max_tokens - new_context.total_tokens
        
        if remaining_tokens > 100 and previous_chunks:
            # Filter previous chunks not in new
            new_chunk_ids = set(c.get('chunk_id') for c in new_chunks)
            prev_only = [c for c in previous_chunks if c.get('chunk_id') not in new_chunk_ids]
            
            prev_context = self.assemble(prev_only[:3], remaining_tokens)
            
            if prev_context.context_text:
                combined_text = f"{new_context.context_text}\n\n---\n[Previous Context]\n---\n\n{prev_context.context_text}"
                
                return AssembledContext(
                    context_text=combined_text,
                    chunks_used=new_context.chunks_used + prev_context.chunks_used,
                    total_tokens=new_context.total_tokens + prev_context.total_tokens,
                    source_documents=list(set(new_context.source_documents + prev_context.source_documents)),
                    citations=new_context.citations + prev_context.citations
                )
        
        return new_context


# Global instance
context_assembler = ContextAssembler()
