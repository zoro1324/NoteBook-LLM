"""
Semantic Chunking Service for RAG Pipeline
Splits documents into meaningful chunks while preserving tables and structure.
"""
import re
from typing import List, Tuple, Optional
from dataclasses import dataclass
from django.conf import settings


@dataclass
class Chunk:
    """Represents a document chunk with metadata"""
    text: str
    chunk_index: int
    start_char: int
    end_char: int
    page_number: Optional[int] = None
    chunk_type: str = "text"  # text, table, heading
    section_title: Optional[str] = None
    token_count: int = 0


class SemanticChunker:
    """
    Semantic-aware text chunker that:
    - Respects token limits (500-800 tokens)
    - Preserves tables (never splits them)
    - Uses meaningful section boundaries
    - Adds overlap for context continuity
    """
    
    # Regex patterns
    TABLE_PATTERN = re.compile(
        r'(\|[^\n]+\|\n(?:\|[-:| ]+\|\n)?(?:\|[^\n]+\|\n?)+)',
        re.MULTILINE
    )
    HEADING_PATTERN = re.compile(r'^(#{1,6})\s+(.+)$', re.MULTILINE)
    PAGE_PATTERN = re.compile(r'^---\s*Page\s*(\d+)\s*---\s*$', re.MULTILINE)
    
    def __init__(
        self,
        min_tokens: int = 500,
        max_tokens: int = 800,
        overlap_percent: float = 0.15
    ):
        """
        Initialize chunker with config.
        
        Args:
            min_tokens: Minimum tokens per chunk
            max_tokens: Maximum tokens per chunk
            overlap_percent: Overlap as fraction of chunk size
        """
        config = getattr(settings, 'APP_CONFIG', {}).get('chunking', {})
        self.min_tokens = config.get('min_tokens', min_tokens)
        self.max_tokens = config.get('max_tokens', max_tokens)
        self.overlap_percent = config.get('overlap_percent', overlap_percent)
        
        # Lazy load tokenizer
        self._tokenizer = None
    
    def _get_tokenizer(self):
        """Lazy load tiktoken tokenizer"""
        if self._tokenizer is None:
            try:
                import tiktoken
                self._tokenizer = tiktoken.get_encoding("cl100k_base")
            except ImportError:
                # Fallback to simple word-based estimation
                self._tokenizer = None
        return self._tokenizer
    
    def _count_tokens(self, text: str) -> int:
        """Count tokens in text"""
        tokenizer = self._get_tokenizer()
        if tokenizer:
            return len(tokenizer.encode(text))
        else:
            # Rough estimation: ~4 chars per token
            return len(text) // 4
    
    def _extract_tables(self, text: str) -> List[Tuple[int, int, str]]:
        """
        Find all markdown tables in text.
        
        Returns:
            List of (start, end, table_text) tuples
        """
        tables = []
        for match in self.TABLE_PATTERN.finditer(text):
            tables.append((match.start(), match.end(), match.group(0)))
        return tables
    
    def _extract_page_numbers(self, text: str) -> List[Tuple[int, int]]:
        """
        Find page markers and their positions.
        
        Returns:
            List of (position, page_number) tuples
        """
        pages = []
        for match in self.PAGE_PATTERN.finditer(text):
            pages.append((match.start(), int(match.group(1))))
        return pages
    
    def _get_page_at_position(self, position: int, pages: List[Tuple[int, int]]) -> Optional[int]:
        """Get page number at a given position"""
        current_page = None
        for pos, page_num in pages:
            if pos <= position:
                current_page = page_num
            else:
                break
        return current_page
    
    def _find_section_title(self, text: str, position: int) -> Optional[str]:
        """Find the most recent heading before position"""
        last_heading = None
        for match in self.HEADING_PATTERN.finditer(text):
            if match.start() <= position:
                last_heading = match.group(2).strip()
            else:
                break
        return last_heading
    
    def _split_at_boundaries(self, text: str) -> List[str]:
        """
        Split text at natural boundaries (paragraphs, headings).
        Keeps tables intact.
        """
        # First, protect tables by replacing with placeholders
        tables = self._extract_tables(text)
        protected_text = text
        table_placeholders = {}
        
        for i, (start, end, table_text) in enumerate(sorted(tables, reverse=True)):
            placeholder = f"<<<TABLE_{i}>>>"
            table_placeholders[placeholder] = table_text
            protected_text = protected_text[:start] + placeholder + protected_text[end:]
        
        # Split by double newlines (paragraphs) and headings
        segments = []
        current_pos = 0
        
        # Split by paragraph or heading
        pattern = re.compile(r'(\n\n+|^#{1,6}\s+[^\n]+\n)', re.MULTILINE)
        
        for match in pattern.finditer(protected_text):
            if match.start() > current_pos:
                segment = protected_text[current_pos:match.start()].strip()
                if segment:
                    segments.append(segment)
            
            # Add the delimiter if it's a heading
            delim = match.group(0)
            if delim.strip().startswith('#'):
                segments.append(delim.strip())
            
            current_pos = match.end()
        
        # Add remaining text
        if current_pos < len(protected_text):
            segment = protected_text[current_pos:].strip()
            if segment:
                segments.append(segment)
        
        # Restore tables
        restored_segments = []
        for segment in segments:
            for placeholder, table_text in table_placeholders.items():
                segment = segment.replace(placeholder, table_text)
            restored_segments.append(segment)
        
        return restored_segments
    
    def chunk_text(self, text: str) -> List[Chunk]:
        """
        Split text into semantic chunks.
        
        Args:
            text: Full document text (markdown format preferred)
            
        Returns:
            List of Chunk objects
        """
        if not text or not text.strip():
            return []
        
        # Extract page markers
        pages = self._extract_page_numbers(text)
        
        # Split into segments at natural boundaries
        segments = self._split_at_boundaries(text)
        
        chunks = []
        current_chunk_segments = []
        current_tokens = 0
        chunk_index = 0
        
        for segment in segments:
            segment_tokens = self._count_tokens(segment)
            is_table = self.TABLE_PATTERN.search(segment) is not None
            
            # If segment is a table, it gets its own chunk (never split tables)
            if is_table:
                # Flush current chunk first
                if current_chunk_segments:
                    chunk_text = "\n\n".join(current_chunk_segments)
                    start_char = text.find(current_chunk_segments[0])
                    end_char = start_char + len(chunk_text)
                    
                    chunks.append(Chunk(
                        text=chunk_text,
                        chunk_index=chunk_index,
                        start_char=start_char,
                        end_char=end_char,
                        page_number=self._get_page_at_position(start_char, pages),
                        chunk_type="text",
                        section_title=self._find_section_title(text, start_char),
                        token_count=current_tokens
                    ))
                    chunk_index += 1
                    current_chunk_segments = []
                    current_tokens = 0
                
                # Add table as its own chunk
                start_char = text.find(segment)
                chunks.append(Chunk(
                    text=segment,
                    chunk_index=chunk_index,
                    start_char=start_char,
                    end_char=start_char + len(segment),
                    page_number=self._get_page_at_position(start_char, pages),
                    chunk_type="table",
                    section_title=self._find_section_title(text, start_char),
                    token_count=segment_tokens
                ))
                chunk_index += 1
                continue
            
            # Check if adding this segment exceeds max tokens
            if current_tokens + segment_tokens > self.max_tokens and current_chunk_segments:
                # Flush current chunk
                chunk_text = "\n\n".join(current_chunk_segments)
                start_char = text.find(current_chunk_segments[0])
                end_char = start_char + len(chunk_text)
                
                chunks.append(Chunk(
                    text=chunk_text,
                    chunk_index=chunk_index,
                    start_char=start_char,
                    end_char=end_char,
                    page_number=self._get_page_at_position(start_char, pages),
                    chunk_type="text",
                    section_title=self._find_section_title(text, start_char),
                    token_count=current_tokens
                ))
                chunk_index += 1
                
                # Calculate overlap
                overlap_tokens = int(current_tokens * self.overlap_percent)
                overlap_segments = []
                overlap_count = 0
                
                for seg in reversed(current_chunk_segments):
                    seg_tokens = self._count_tokens(seg)
                    if overlap_count + seg_tokens <= overlap_tokens:
                        overlap_segments.insert(0, seg)
                        overlap_count += seg_tokens
                    else:
                        break
                
                current_chunk_segments = overlap_segments
                current_tokens = overlap_count
            
            # Add segment to current chunk
            current_chunk_segments.append(segment)
            current_tokens += segment_tokens
        
        # Flush final chunk
        if current_chunk_segments:
            chunk_text = "\n\n".join(current_chunk_segments)
            start_char = text.find(current_chunk_segments[0])
            end_char = start_char + len(chunk_text)
            
            chunks.append(Chunk(
                text=chunk_text,
                chunk_index=chunk_index,
                start_char=start_char,
                end_char=end_char,
                page_number=self._get_page_at_position(start_char, pages),
                chunk_type="text",
                section_title=self._find_section_title(text, start_char),
                token_count=current_tokens
            ))
        
        return chunks
    
    def chunk_with_metadata(
        self, 
        text: str, 
        doc_id: int, 
        base_chunk_id: int = 0
    ) -> List[dict]:
        """
        Chunk text and return with full metadata for storage.
        
        Args:
            text: Document text
            doc_id: Document ID
            base_chunk_id: Starting chunk ID
            
        Returns:
            List of chunk dictionaries ready for database storage
        """
        chunks = self.chunk_text(text)
        
        return [
            {
                'doc_id': doc_id,
                'chunk_id': base_chunk_id + chunk.chunk_index,
                'chunk_index': chunk.chunk_index,
                'text': chunk.text,
                'start_char': chunk.start_char,
                'end_char': chunk.end_char,
                'page_number': chunk.page_number,
                'chunk_type': chunk.chunk_type,
                'section_title': chunk.section_title,
                'token_count': chunk.token_count,
            }
            for chunk in chunks
        ]


# Global instance
semantic_chunker = SemanticChunker()
