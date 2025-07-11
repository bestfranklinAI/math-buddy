# Enhanced Math Quiz System

## Overview

The enhanced quiz system now supports parsing simple text files with numbered questions and automatically generates:

1. **Themed question rewrites** using LLM
2. **Correct answers** for each question  
3. **Step-by-step explanations** for wrong answers
4. **Context-aware chatbot** for helping with specific questions

## New Features

### 📝 Text File Question Parsing

Upload simple text files with numbered questions:

```
1. What is 5 + 3?
2. If you have 12 apples and eat 4, how many do you have left?
3. Sarah has 15 stickers and gives 6 to her friend. How many stickers does Sarah have now?
```

The system automatically:
- Parses numbered questions
- Infers math topics (addition, subtraction, etc.)
- Generates themed versions
- Creates correct answers and explanations

### 🤖 LLM-Generated Answers & Explanations

For each question, the LLM generates:
- **Rewritten question** with chosen theme
- **Correct answer** for automatic grading
- **Step-by-step explanation** for learning

### ✅ Automatic Answer Checking

The system compares user answers with LLM-generated correct answers:
- Supports numeric answers with tolerance
- Handles text normalization
- Provides immediate feedback

### 💬 Context-Aware Chatbot

Students can chat about specific wrong questions:
- Bot has full context of the question
- Knows the student's wrong answer
- Provides targeted help and guidance

## API Endpoints

### Upload Quiz
```http
POST /api/upload-quiz
Content-Type: multipart/form-data

file: questions.txt
theme: "Space Pirates" 
age: 10
```

### Submit Quiz
```http
POST /api/submit-quiz
{
  "quiz_id": "uuid",
  "answers": [
    {"question_id": "q1", "answer": "8"},
    {"question_id": "q2", "answer": "7"}
  ]
}
```

### Get Wrong Questions
```http
GET /api/quiz/{quiz_id}/wrong-questions
```

### Context-Aware Chat
```http
POST /api/chat-with-context
{
  "message": "I don't understand this problem",
  "quiz_id": "uuid",
  "question_id": "q1",
  "history": []
}
```

### Get Explanation
```http
POST /api/explanation
{
  "quiz_id": "uuid",
  "question_id": "q1"
}
```

## File Structure

```
backend/
├── main.py                 # Enhanced API endpoints
├── services/
│   ├── llm.py              # Enhanced LLM service
│   ├── question_parser.py  # Question parsing logic
│   ├── quiz_storage.py     # Quiz session storage
│   └── image.py            # Image generation
└── requirements.txt
```

## Usage Flow

1. **Upload Questions**: Upload text file with numbered questions
2. **LLM Processing**: System rewrites questions, generates answers & explanations  
3. **Student Takes Quiz**: Student answers themed questions
4. **Auto-Grading**: System checks answers automatically
5. **Feedback & Help**: Wrong answers get explanations, chat support available

## Key Components

### QuestionParser
- Parses numbered questions from text
- Infers math topics automatically
- Creates structured Question objects

### QuizSession
- Manages quiz state and user answers
- Tracks score and wrong questions
- Provides context for chatbot

### Enhanced LLM Service
- `rewrite_with_answer()` - One-shot generation of rewrite, answer, explanation
- `check_answer()` - Compare user vs correct answers
- `chat_with_context()` - Context-aware chat for wrong questions

## Benefits

- ✅ **Easy Content Creation**: Just write numbered questions in a text file
- ✅ **Automatic Grading**: No manual answer key needed
- ✅ **Personalized Help**: Context-aware chatbot for each question
- ✅ **Detailed Explanations**: Step-by-step learning support
- ✅ **Theme Integration**: All existing theming features work
- ✅ **Accessibility**: Designed for dyslexic and ADHD students

## Example Question Flow

```
Input:     "What is 5 + 3?"
Rewritten: "Captain Blackbeard found 5 golden coins and then discovered 3 more in a treasure chest. How many coins does he have in total?"
Answer:    "8"
Explanation: "To find the total, we add: 5 + 3 = 8 coins"
```

## Testing

Run the test script to see the system in action:

```bash
python test_enhanced_quiz.py
```

This demonstrates the complete flow from text parsing to context-aware chat.
