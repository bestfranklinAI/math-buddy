from fastapi import FastAPI, Request, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Dict, Optional
import os
import re
import uuid
import asyncio
import logging

from backend.services import llm, image
from backend.services.question_parser import QuestionParser, QuizSession
from backend.services.quiz_storage import quiz_storage

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="SEN Math Buddy API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create static directory and mount it
backend_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(backend_dir)
static_dir = os.path.join(project_root, "static")
images_dir = os.path.join(static_dir, "images")

os.makedirs(static_dir, exist_ok=True)
os.makedirs(images_dir, exist_ok=True)

print(f"Static directory: {static_dir}")
print(f"Images directory: {images_dir}")

# Note: We'll handle static files with custom endpoints instead of mounting


class RewriteRequest(BaseModel):
    question: str
    theme: str
    age: int = 10


class RewriteResponse(BaseModel):
    rewritten: str


@app.post("/api/rewrite", response_model=RewriteResponse)
async def rewrite(req: RewriteRequest):
    result = await llm.rewrite_question(req.question, req.theme, req.age)
    return {"rewritten": result}


class ImageRequest(BaseModel):
    prompt: str
    theme: str
    format: str = "default"


class ImageResponse(BaseModel):
    image_url: str
    status: str
    message: str


@app.post("/api/image", response_model=ImageResponse)
async def gen_image(req: ImageRequest):
    result = await image.generate_image(req.prompt, req.theme, req.format)
    return result


class ChatRequest(BaseModel):
    message: str
    history: List[dict] = []


class ChatResponse(BaseModel):
    assistant: str


class ChatWithContextRequest(BaseModel):
    message: str
    history: List[dict] = []
    quiz_id: Optional[str] = None
    question_id: Optional[str] = None


class ExplanationRequest(BaseModel):
    quiz_id: str
    question_id: str


@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest):
    """Chat with the Math Buddy assistant"""
    result = await llm.chat(req.message, req.history)
    return ChatResponse(assistant=result)


@app.post("/api/chat-with-context", response_model=ChatResponse)
async def chat_with_context_endpoint(req: ChatWithContextRequest):
    """Chat with the Math Buddy assistant with question context"""
    question_context = None
    
    if req.quiz_id and req.question_id:
        session = quiz_storage.get_session(req.quiz_id)
        if session:
            question_context = session.get_question_context(req.question_id)
    
    result = await llm.chat_with_context(req.message, req.history, question_context)
    return ChatResponse(assistant=result)


class QuizQuestion(BaseModel):
    id: str
    original: str
    rewritten: str
    correct_answer: str
    explanation: str
    image_url: Optional[str] = None
    theme: str
    topic: str

class QuizData(BaseModel):
    quiz_id: str
    theme: str
    age: int
    questions: List[QuizQuestion]

class QuizAnswer(BaseModel):
    question_id: str
    answer: str

class QuizSubmission(BaseModel):
    quiz_id: str
    answers: List[QuizAnswer]

class QuizResult(BaseModel):
    quiz_id: str
    score: int
    total: int
    percentage: float
    encouragement: str
    feedback: List[Dict]
    wrong_questions: List[str]


@app.post("/api/upload-quiz", response_model=QuizData)
async def upload_quiz_file(
    file: UploadFile = File(...),
    theme: str = "Space Pirates",
    age: int = 10
):
    """Upload a text file with numbered questions and create a themed quiz"""
    if not file.filename.endswith('.txt'):
        raise HTTPException(status_code=400, detail="Only .txt files are supported")
    
    # Read file content
    content = await file.read()
    text = content.decode('utf-8')
    
    # Parse questions using the new parser
    questions = QuestionParser.auto_parse(text)
    
    if not questions:
        raise HTTPException(status_code=400, detail="No questions found in file")
    
    # Generate quiz ID
    quiz_id = str(uuid.uuid4())
    
    # Process each question with LLM
    quiz_questions = []
    
    # Process questions in batches to avoid overwhelming the LLM
    for question in questions:
        try:
            # Generate rewritten question, answer, and explanation
            result = await llm.rewrite_with_answer(question.original_text, theme, age)
            
            # Update question object
            question.rewritten_text = result["rewritten"]
            question.correct_answer = result["answer"]
            question.explanation = result["explanation"]
            question.theme = theme
            
            # Generate image for the question
            image_prompt = f"Math problem illustration: {question.original_text}"
            image_result = await image.generate_image(image_prompt, theme, "default")
            
            quiz_question = QuizQuestion(
                id=question.id,
                original=question.original_text,
                rewritten=question.rewritten_text,
                correct_answer=question.correct_answer,
                explanation=question.explanation,
                image_url=image_result.get("image_url") if image_result.get("status") == "success" else None,
                theme=theme,
                topic=question.topic
            )
            quiz_questions.append(quiz_question)
            
        except Exception as e:
            logger.error(f"Error processing question {question.id}: {e}")
            # Add question with basic info if processing fails
            quiz_question = QuizQuestion(
                id=question.id,
                original=question.original_text,
                rewritten=f"[Error processing] {question.original_text}",
                correct_answer="Error",
                explanation="Unable to generate explanation",
                image_url=None,
                theme=theme,
                topic=question.topic
            )
            quiz_questions.append(quiz_question)
    
    # Create quiz session and store it
    session = QuizSession(quiz_id, questions, theme, age)
    quiz_storage.store_session(session)
    
    return QuizData(
        quiz_id=quiz_id,
        theme=theme,
        age=age,
        questions=quiz_questions
    )


@app.post("/api/submit-quiz", response_model=QuizResult)
async def submit_quiz(submission: QuizSubmission):
    """Submit quiz answers and get results with encouragement"""
    # Get the quiz session
    session = quiz_storage.get_session(submission.quiz_id)
    if not session:
        raise HTTPException(status_code=404, detail="Quiz session not found")
    
    # Store user answers
    for answer in submission.answers:
        session.add_answer(answer.question_id, answer.answer)
    
    # Calculate score
    score = session.calculate_score()
    total_questions = len(session.questions)
    percentage = (score / total_questions) * 100 if total_questions > 0 else 0
    
    # Get wrong questions
    wrong_questions = session.get_wrong_questions()
    
    # Generate themed encouragement
    encouragement_prompt = f"Create an encouraging message for a student who scored {score}/{total_questions} on a math quiz"
    encouragement = await llm.generate_encouragement(encouragement_prompt, session.theme)
    
    # Generate feedback for each question
    feedback = []
    for answer in submission.answers:
        question = session.questions.get(answer.question_id)
        if question:
            is_correct = llm.check_answer(answer.answer, question.correct_answer)
            feedback.append({
                "question_id": answer.question_id,
                "user_answer": answer.answer,
                "correct_answer": question.correct_answer,
                "is_correct": is_correct,
                "feedback": "Great work! ✅" if is_correct else "Let's practice this more! ❌"
            })
    
    # Update session with results
    session.score = score
    session.feedback = feedback
    
    return QuizResult(
        quiz_id=submission.quiz_id,
        score=score,
        total=total_questions,
        percentage=percentage,
        encouragement=encouragement,
        feedback=feedback,
        wrong_questions=wrong_questions
    )


@app.post("/api/explanation")
async def get_explanation(req: ExplanationRequest):
    """Get explanation for a specific question"""
    session = quiz_storage.get_session(req.quiz_id)
    if not session:
        raise HTTPException(status_code=404, detail="Quiz session not found")
    
    question = session.questions.get(req.question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    return {
        "question_id": req.question_id,
        "explanation": question.explanation,
        "correct_answer": question.correct_answer
    }


@app.get("/api/quiz/{quiz_id}/wrong-questions")
async def get_wrong_questions(quiz_id: str):
    """Get details of questions answered incorrectly"""
    session = quiz_storage.get_session(quiz_id)
    if not session:
        raise HTTPException(status_code=404, detail="Quiz session not found")
    
    wrong_question_ids = session.get_wrong_questions()
    wrong_questions = []
    
    for question_id in wrong_question_ids:
        question = session.questions.get(question_id)
        if question:
            wrong_questions.append({
                "question_id": question_id,
                "original_text": question.original_text,
                "rewritten_text": question.rewritten_text,
                "user_answer": session.user_answers.get(question_id),
                "correct_answer": question.correct_answer,
                "explanation": question.explanation,
                "topic": question.topic
            })
    
    return {
        "quiz_id": quiz_id,
        "wrong_questions": wrong_questions,
        "total_wrong": len(wrong_questions)
    }


@app.get("/api/test-static")
async def test_static():
    """Test endpoint to check static file setup"""
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(backend_dir)
    static_dir = os.path.join(project_root, "static")
    images_dir = os.path.join(static_dir, "images")

    result = {
        "backend_dir": backend_dir,
        "project_root": project_root,
        "static_dir": static_dir,
        "images_dir": images_dir,
        "static_exists": os.path.exists(static_dir),
        "images_exists": os.path.exists(images_dir),
        "images_in_dir": [],
    }

    if os.path.exists(images_dir):
        try:
            result["images_in_dir"] = os.listdir(images_dir)
        except Exception as e:
            result["error"] = str(e)

    return result


@app.get("/static/images/{filename}")
async def serve_image(filename: str):
    """Custom endpoint to serve images with proper CORS headers"""
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(backend_dir)
    images_dir = os.path.join(project_root, "static", "images")
    file_path = os.path.join(images_dir, filename)
    
    print(f"Trying to serve image: {file_path}")
    print(f"File exists: {os.path.exists(file_path)}")
    
    if os.path.exists(file_path):
        # Determine media type based on file extension
        media_type = "image/png"
        if filename.lower().endswith('.jpg') or filename.lower().endswith('.jpeg'):
            media_type = "image/jpeg"
        elif filename.lower().endswith('.gif'):
            media_type = "image/gif"
        elif filename.lower().endswith('.webp'):
            media_type = "image/webp"
        
        return FileResponse(
            file_path,
            media_type=media_type,
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET",
                "Access-Control-Allow-Headers": "*",
                "Cache-Control": "public, max-age=31536000"
            }
        )
    else:
        raise HTTPException(status_code=404, detail=f"Image not found: {filename}")


class MinigameRequest(BaseModel):
    quiz_id: str
    game_prompt: str
    theme: str = "Space Pirates"

class MinigameResponse(BaseModel):
    game_html: str
    status: str
    message: str


@app.post("/api/generate-minigame", response_model=MinigameResponse)
async def generate_minigame(req: MinigameRequest):
    """Generate an interactive HTML minigame based on quiz questions"""
    try:
        # Get the quiz session
        session = quiz_storage.get_session(req.quiz_id)
        if not session:
            raise HTTPException(status_code=404, detail="Quiz session not found")
        
        # Extract questions for the minigame
        questions_data = []
        for question in session.questions.values():
            questions_data.append({
                "original": question.original_text,
                "rewritten": question.rewritten_text or question.original_text,
                "answer": question.correct_answer,
                "topic": question.topic
            })
        
        # Generate the HTML minigame using LLM
        html_content = await llm.generate_minigame_html(
            questions_data, 
            req.game_prompt, 
            req.theme,
            session.age
        )
        
        return MinigameResponse(
            game_html=html_content,
            status="success",
            message="Minigame generated successfully!"
        )
        
    except Exception as e:
        logger.error(f"Error generating minigame: {e}")
        return MinigameResponse(
            game_html="<p>Error generating minigame</p>",
            status="error",
            message=f"Failed to generate minigame: {str(e)}"
        )
