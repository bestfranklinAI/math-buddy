"""
Quiz Storage Module
Simple in-memory storage for quiz sessions
In production, this would be replaced with a proper database
"""

from typing import Dict, Optional
from backend.services.question_parser import QuizSession

class QuizStorage:
    """Simple in-memory storage for quiz sessions"""
    
    def __init__(self):
        self._sessions: Dict[str, QuizSession] = {}
    
    def store_session(self, session: QuizSession):
        """Store a quiz session"""
        self._sessions[session.quiz_id] = session
    
    def get_session(self, quiz_id: str) -> Optional[QuizSession]:
        """Retrieve a quiz session by ID"""
        return self._sessions.get(quiz_id)
    
    def delete_session(self, quiz_id: str):
        """Delete a quiz session"""
        if quiz_id in self._sessions:
            del self._sessions[quiz_id]
    
    def list_sessions(self) -> Dict[str, QuizSession]:
        """List all sessions (for debugging)"""
        return self._sessions.copy()
    
    def clear_all(self):
        """Clear all sessions"""
        self._sessions.clear()


# Global instance (in production, use dependency injection)
quiz_storage = QuizStorage()
