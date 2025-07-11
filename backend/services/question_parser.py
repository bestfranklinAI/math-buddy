"""
Question Parser Module
Handles parsing of simple text file questions and converts them to structured format
"""

import re
from typing import List, Dict, Optional
import uuid


class Question:
    """Represents a parsed question with metadata"""
    
    def __init__(self, text: str, question_id: str = None):
        self.id = question_id or str(uuid.uuid4())
        self.original_text = text.strip()
        self.rewritten_text: Optional[str] = None
        self.correct_answer: Optional[str] = None
        self.explanation: Optional[str] = None
        self.theme: Optional[str] = None
        self.difficulty = "medium"
        self.topic = self._infer_topic()
    
    def _infer_topic(self) -> str:
        """Infer the math topic from the question text"""
        text_lower = self.original_text.lower()
        
        if any(word in text_lower for word in ['+', 'add', 'plus', 'sum', 'total', 'altogether']):
            return "addition"
        elif any(word in text_lower for word in ['-', 'subtract', 'minus', 'take away', 'left', 'remain']):
            return "subtraction"
        elif any(word in text_lower for word in ['×', '*', 'multiply', 'times', 'product']):
            return "multiplication"
        elif any(word in text_lower for word in ['÷', '/', 'divide', 'split', 'share']):
            return "division"
        elif any(word in text_lower for word in ['fraction', 'half', 'quarter', 'third']):
            return "fractions"
        elif any(word in text_lower for word in ['percent', '%', 'percentage']):
            return "percentages"
        else:
            return "arithmetic"
    
    def to_dict(self) -> Dict:
        """Convert question to dictionary format"""
        return {
            "id": self.id,
            "original_text": self.original_text,
            "rewritten_text": self.rewritten_text,
            "correct_answer": self.correct_answer,
            "explanation": self.explanation,
            "theme": self.theme,
            "difficulty": self.difficulty,
            "topic": self.topic
        }


class QuestionParser:
    """Parses questions from various text formats"""
    
    @staticmethod
    def parse_numbered_questions(text: str) -> List[Question]:
        """
        Parse numbered questions from text file
        Format: 1. Question text
                2. Another question
        """
        questions = []
        lines = text.strip().split('\n')
        current_question = ""
        
        for line in lines:
            line = line.strip()
            
            # Skip empty lines and comments
            if not line or line.startswith('#') or line.startswith('//'):
                continue
            
            # Check if line starts with number and dot (1., 2., etc.)
            if re.match(r'^\d+\.', line):
                # Save previous question if exists
                if current_question:
                    questions.append(Question(current_question.strip()))
                
                # Start new question (remove number prefix)
                current_question = re.sub(r'^\d+\.\s*', '', line)
            elif current_question and line:
                # Continue multi-line question
                current_question += " " + line
        
        # Add the last question
        if current_question:
            questions.append(Question(current_question.strip()))
        
        return questions
    
    @staticmethod
    def parse_plain_questions(text: str) -> List[Question]:
        """
        Parse plain questions (one per line)
        """
        questions = []
        lines = text.strip().split('\n')
        
        for line in lines:
            line = line.strip()
            if line and not line.startswith('#') and not line.startswith('//'):
                questions.append(Question(line))
        
        return questions
    
    @staticmethod
    def auto_parse(text: str) -> List[Question]:
        """
        Automatically detect format and parse questions
        """
        # Check if text contains numbered questions
        if re.search(r'^\d+\.', text.strip(), re.MULTILINE):
            return QuestionParser.parse_numbered_questions(text)
        else:
            return QuestionParser.parse_plain_questions(text)


class QuizSession:
    """Manages a quiz session with questions, answers, and context"""
    
    def __init__(self, quiz_id: str, questions: List[Question], theme: str, age: int):
        self.quiz_id = quiz_id
        self.questions = {q.id: q for q in questions}
        self.theme = theme
        self.age = age
        self.user_answers: Dict[str, str] = {}
        self.score: Optional[int] = None
        self.feedback: List[Dict] = []
    
    def add_answer(self, question_id: str, answer: str):
        """Add user's answer for a question"""
        self.user_answers[question_id] = answer
    
    def get_question_context(self, question_id: str) -> Dict:
        """Get context for a specific question (for chat)"""
        question = self.questions.get(question_id)
        if not question:
            return {}
        
        return {
            "original": question.original_text,
            "rewritten": question.rewritten_text,
            "answer": question.correct_answer,
            "user_answer": self.user_answers.get(question_id),
            "explanation": question.explanation,
            "theme": self.theme
        }
    
    def calculate_score(self) -> int:
        """Calculate the quiz score"""
        correct = 0
        for question_id, user_answer in self.user_answers.items():
            question = self.questions.get(question_id)
            if question and question.correct_answer:
                from backend.services.llm import check_answer
                if check_answer(user_answer, question.correct_answer):
                    correct += 1
        
        self.score = correct
        return correct
    
    def get_wrong_questions(self) -> List[str]:
        """Get list of question IDs that were answered incorrectly"""
        wrong = []
        for question_id, user_answer in self.user_answers.items():
            question = self.questions.get(question_id)
            if question and question.correct_answer:
                from backend.services.llm import check_answer
                if not check_answer(user_answer, question.correct_answer):
                    wrong.append(question_id)
        return wrong
    
    def to_dict(self) -> Dict:
        """Convert quiz session to dictionary"""
        return {
            "quiz_id": self.quiz_id,
            "theme": self.theme,
            "age": self.age,
            "questions": [q.to_dict() for q in self.questions.values()],
            "user_answers": self.user_answers,
            "score": self.score,
            "feedback": self.feedback
        }
