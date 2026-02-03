"""
Session Memory Service for RAG Pipeline
Maintains conversation context for follow-up questions.
"""
from typing import List, Dict, Optional, Any
from dataclasses import dataclass, field
from collections import defaultdict
import time


@dataclass
class SessionContext:
    """Context for a single conversation session"""
    conversation_id: int
    last_query: str = ""
    last_chunks: List[dict] = field(default_factory=list)
    query_history: List[str] = field(default_factory=list)
    topic_keywords: List[str] = field(default_factory=list)
    last_updated: float = field(default_factory=time.time)
    
    def update(self, query: str, chunks: List[dict], keywords: List[str]):
        """Update session with new query context"""
        self.last_query = query
        self.last_chunks = chunks[:10]  # Keep last 10 chunks
        self.query_history.append(query)
        
        # Merge keywords, keeping most recent
        self.topic_keywords = list(set(self.topic_keywords[-20:] + keywords))[-30:]
        self.last_updated = time.time()
    
    def is_follow_up(self, query: str) -> bool:
        """
        Determine if query is a follow-up to previous conversation.
        
        Args:
            query: New query
            
        Returns:
            True if likely a follow-up
        """
        query_lower = query.lower()
        
        # Check for follow-up indicators
        follow_up_patterns = [
            'explain more', 'tell me more', 'elaborate',
            'what about', 'how about', 'and what',
            'can you clarify', 'what do you mean',
            'in other words', 'simpler', 'more detail',
            'why is that', 'how does that', 'what else',
            'related to that', 'regarding that', 'on that note',
            'also', 'additionally', "what's that",
        ]
        
        for pattern in follow_up_patterns:
            if pattern in query_lower:
                return True
        
        # Check for pronouns without clear referent
        pronoun_patterns = [
            r'^(it|this|that|these|those|they)\s',
            r'^what (is|are) (it|they|these|those)\b',
            r'^(explain|describe|summarize) (it|this|that)\b',
        ]
        
        import re
        for pattern in pronoun_patterns:
            if re.search(pattern, query_lower):
                return True
        
        # Check keyword overlap with topic
        if self.topic_keywords:
            query_words = set(query_lower.split())
            topic_words = set(w.lower() for w in self.topic_keywords)
            overlap = len(query_words & topic_words)
            if overlap >= 2:
                return True
        
        return False


class SessionMemory:
    """
    Manages session contexts for multiple conversations.
    Enables context-aware follow-up handling.
    """
    
    # Session timeout in seconds (30 minutes)
    SESSION_TIMEOUT = 1800
    
    def __init__(self):
        """Initialize session storage"""
        self._sessions: Dict[int, SessionContext] = {}
    
    def get_session(self, conversation_id: int) -> SessionContext:
        """
        Get or create session for conversation.
        
        Args:
            conversation_id: Conversation ID
            
        Returns:
            SessionContext
        """
        # Clean expired sessions periodically
        self._cleanup_expired()
        
        if conversation_id not in self._sessions:
            self._sessions[conversation_id] = SessionContext(
                conversation_id=conversation_id
            )
        
        return self._sessions[conversation_id]
    
    def update_session(
        self,
        conversation_id: int,
        query: str,
        chunks: List[dict],
        keywords: List[str] = None
    ):
        """
        Update session with new query context.
        
        Args:
            conversation_id: Conversation ID
            query: User query
            chunks: Retrieved chunks
            keywords: Extracted keywords
        """
        session = self.get_session(conversation_id)
        session.update(query, chunks, keywords or [])
    
    def get_previous_chunks(self, conversation_id: int) -> List[dict]:
        """
        Get chunks from previous query in session.
        
        Args:
            conversation_id: Conversation ID
            
        Returns:
            List of chunk dictionaries
        """
        session = self._sessions.get(conversation_id)
        if session:
            return session.last_chunks
        return []
    
    def is_follow_up_query(self, conversation_id: int, query: str) -> bool:
        """
        Check if query is a follow-up in this session.
        
        Args:
            conversation_id: Conversation ID
            query: New query
            
        Returns:
            True if follow-up
        """
        session = self._sessions.get(conversation_id)
        if not session or not session.last_query:
            return False
        
        return session.is_follow_up(query)
    
    def get_context_for_follow_up(
        self,
        conversation_id: int,
        new_chunks: List[dict]
    ) -> List[dict]:
        """
        Merge previous and new chunks for follow-up query.
        
        Args:
            conversation_id: Conversation ID
            new_chunks: Newly retrieved chunks
            
        Returns:
            Combined chunk list
        """
        previous = self.get_previous_chunks(conversation_id)
        
        if not previous:
            return new_chunks
        
        # Combine with new chunks first
        seen_ids = set()
        combined = []
        
        for chunk in new_chunks:
            chunk_id = chunk.get('chunk_id')
            if chunk_id not in seen_ids:
                seen_ids.add(chunk_id)
                combined.append(chunk)
        
        # Add relevant previous chunks
        for chunk in previous:
            chunk_id = chunk.get('chunk_id')
            if chunk_id not in seen_ids:
                seen_ids.add(chunk_id)
                combined.append(chunk)
        
        return combined
    
    def clear_session(self, conversation_id: int):
        """Clear session data"""
        if conversation_id in self._sessions:
            del self._sessions[conversation_id]
    
    def _cleanup_expired(self):
        """Remove expired sessions"""
        now = time.time()
        expired = [
            cid for cid, session in self._sessions.items()
            if now - session.last_updated > self.SESSION_TIMEOUT
        ]
        
        for cid in expired:
            del self._sessions[cid]


# Global instance
session_memory = SessionMemory()
