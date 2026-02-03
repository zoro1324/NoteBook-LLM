"""
Query Processor for RAG Pipeline
Handles query embedding, intent detection, and retrieval depth selection.
"""
import re
from typing import List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import numpy as np


class QueryIntent(Enum):
    """Types of user query intents"""
    SUMMARY = "summary"           # Summarize content
    EXPLAIN = "explain"           # Explain a concept
    COMPARE = "compare"           # Compare items
    FIND = "find"                 # Find specific info
    LIST = "list"                 # List items
    QUESTION = "question"         # General question


@dataclass
class ProcessedQuery:
    """Result of query processing"""
    original_query: str
    cleaned_query: str
    intent: QueryIntent
    suggested_k: int
    query_embedding: Optional[np.ndarray] = None
    keywords: List[str] = None


class QueryProcessor:
    """
    Processes user queries for optimal retrieval.
    - Cleans and normalizes query text
    - Detects query intent
    - Determines optimal retrieval depth (K)
    - Generates query embedding
    """
    
    # Intent detection patterns
    INTENT_PATTERNS = {
        QueryIntent.SUMMARY: [
            r'^summar',
            r'give me a summary',
            r'brief overview',
            r'main points',
            r'key points',
            r'tldr',
            r'in short',
        ],
        QueryIntent.EXPLAIN: [
            r'^explain',
            r'^what is',
            r'^what are',
            r'how does',
            r'how do',
            r'clarify',
            r'describe',
            r'meaning of',
        ],
        QueryIntent.COMPARE: [
            r'compare',
            r'difference between',
            r'differences between',
            r'how are .+ different',
            r'versus',
            r' vs ',
            r'contrast',
            r'similarities',
        ],
        QueryIntent.FIND: [
            r'^find',
            r'^locate',
            r'^where is',
            r'^where are',
            r'show me',
            r'look for',
            r'search for',
        ],
        QueryIntent.LIST: [
            r'^list',
            r'what are all',
            r'enumerate',
            r'give me all',
            r'all the .+ in',
        ],
    }
    
    # Default K values by intent
    INTENT_K_VALUES = {
        QueryIntent.SUMMARY: 10,
        QueryIntent.EXPLAIN: 5,
        QueryIntent.COMPARE: 8,
        QueryIntent.FIND: 3,
        QueryIntent.LIST: 10,
        QueryIntent.QUESTION: 5,
    }
    
    def __init__(self, embedding_service=None):
        """
        Initialize query processor.
        
        Args:
            embedding_service: Optional embedding service for query embedding
        """
        self._embedding_service = embedding_service
    
    def _get_embedding_service(self):
        """Lazy load embedding service"""
        if self._embedding_service is None:
            from .embedding_service import embedding_service
            self._embedding_service = embedding_service
        return self._embedding_service
    
    def clean_query(self, query: str) -> str:
        """
        Clean and normalize query text.
        
        Args:
            query: Raw user query
            
        Returns:
            Cleaned query string
        """
        # Remove extra whitespace
        cleaned = ' '.join(query.split())
        
        # Remove common filler phrases
        filler_patterns = [
            r'^(hey|hi|hello|please|can you|could you|would you|i want you to)\s*,?\s*',
            r'^(tell me|help me|i need to|i want to)\s*',
        ]
        
        for pattern in filler_patterns:
            cleaned = re.sub(pattern, '', cleaned, flags=re.IGNORECASE)
        
        return cleaned.strip()
    
    def detect_intent(self, query: str) -> QueryIntent:
        """
        Detect the intent of the query.
        
        Args:
            query: User query
            
        Returns:
            QueryIntent enum value
        """
        query_lower = query.lower()
        
        for intent, patterns in self.INTENT_PATTERNS.items():
            for pattern in patterns:
                if re.search(pattern, query_lower):
                    return intent
        
        # Default to general question
        return QueryIntent.QUESTION
    
    def extract_keywords(self, query: str) -> List[str]:
        """
        Extract important keywords from query.
        
        Args:
            query: User query
            
        Returns:
            List of keyword strings
        """
        # Remove stopwords and extract significant terms
        stopwords = {
            'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
            'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
            'would', 'could', 'should', 'may', 'might', 'can', 'this',
            'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it',
            'we', 'they', 'what', 'which', 'who', 'whom', 'where',
            'when', 'why', 'how', 'all', 'each', 'every', 'both',
            'few', 'more', 'most', 'other', 'some', 'such', 'no',
            'not', 'only', 'same', 'so', 'than', 'too', 'very',
            'just', 'about', 'into', 'from', 'with', 'for', 'on',
            'at', 'by', 'to', 'of', 'in', 'and', 'or', 'but',
            'me', 'my', 'myself', 'our', 'ours', 'your', 'yours',
        }
        
        # Tokenize and filter
        words = re.findall(r'\b[a-zA-Z]{2,}\b', query.lower())
        keywords = [w for w in words if w not in stopwords]
        
        # Return unique keywords preserving order
        seen = set()
        unique_keywords = []
        for kw in keywords:
            if kw not in seen:
                seen.add(kw)
                unique_keywords.append(kw)
        
        return unique_keywords
    
    def determine_k(self, intent: QueryIntent, query: str) -> int:
        """
        Determine optimal number of chunks to retrieve.
        
        Args:
            intent: Detected query intent
            query: Original query
            
        Returns:
            Number of chunks (K) to retrieve
        """
        base_k = self.INTENT_K_VALUES.get(intent, 5)
        
        # Adjust based on query complexity
        word_count = len(query.split())
        
        if word_count > 20:
            # Complex query, get more context
            base_k = min(base_k + 3, 15)
        elif word_count < 5:
            # Simple query, fewer results
            base_k = max(base_k - 2, 3)
        
        return base_k
    
    def process(self, query: str, embed: bool = True) -> ProcessedQuery:
        """
        Full query processing pipeline.
        
        Args:
            query: Raw user query
            embed: Whether to generate query embedding
            
        Returns:
            ProcessedQuery with all metadata
        """
        cleaned = self.clean_query(query)
        intent = self.detect_intent(cleaned)
        keywords = self.extract_keywords(cleaned)
        k = self.determine_k(intent, cleaned)
        
        embedding = None
        if embed:
            service = self._get_embedding_service()
            embedding = service.embed_query(cleaned)
        
        return ProcessedQuery(
            original_query=query,
            cleaned_query=cleaned,
            intent=intent,
            suggested_k=k,
            query_embedding=embedding,
            keywords=keywords
        )


# Global instance
query_processor = QueryProcessor()
