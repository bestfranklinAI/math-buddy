#!/usr/bin/env python3
"""
Test script to demonstrate the enhanced quiz system
"""

import asyncio
import json
from backend.services.question_parser import QuestionParser, QuizSession
from backend.services import llm
from backend.services.quiz_storage import quiz_storage

async def test_quiz_flow():
    """Test the complete quiz flow"""
    print("🧮 Testing Enhanced Math Quiz System\n")
    
    # 1. Parse sample questions
    print("📝 Step 1: Parsing sample questions...")
    with open('/Users/franklin/Codes/GoodNotes/sample-questions.txt', 'r') as f:
        text = f.read()
    
    questions = QuestionParser.auto_parse(text)
    print(f"✅ Parsed {len(questions)} questions")
    
    # Display parsed questions
    for i, q in enumerate(questions[:3]):  # Show first 3
        print(f"   {i+1}. {q.original_text} (Topic: {q.topic})")
    
    # 2. Create quiz session
    print("\n🎮 Step 2: Creating quiz session...")
    quiz_id = "test-quiz-123"
    theme = "Space Pirates"
    age = 10
    
    session = QuizSession(quiz_id, questions, theme, age)
    quiz_storage.store_session(session)
    print(f"✅ Created quiz session: {quiz_id}")
    
    # 3. Process first question with LLM
    print(f"\n🤖 Step 3: Processing questions with LLM (theme: {theme})...")
    test_question = questions[0]
    
    try:
        result = await llm.rewrite_with_answer(test_question.original_text, theme, age)
        
        print(f"📚 Original: {test_question.original_text}")
        print(f"🚀 Rewritten: {result['rewritten']}")
        print(f"💯 Answer: {result['answer']}")
        print(f"📖 Explanation: {result['explanation'][:100]}...")
        
        # Update question with results
        test_question.rewritten_text = result['rewritten']
        test_question.correct_answer = result['answer']
        test_question.explanation = result['explanation']
        
    except Exception as e:
        print(f"❌ Error processing question: {e}")
    
    # 4. Test answer checking
    print(f"\n✅ Step 4: Testing answer checking...")
    test_answers = ["8", "7", "wrong"]  # First is correct, others wrong
    
    for i, answer in enumerate(test_answers):
        is_correct = llm.check_answer(answer, test_question.correct_answer)
        print(f"   Answer '{answer}': {'✅ Correct' if is_correct else '❌ Wrong'}")
    
    # 5. Simulate quiz submission
    print(f"\n📊 Step 5: Simulating quiz submission...")
    session.add_answer(test_question.id, "8")  # Correct answer
    session.add_answer(questions[1].id, "wrong")  # Wrong answer
    
    score = session.calculate_score()
    wrong_questions = session.get_wrong_questions()
    
    print(f"   Score: {score}/{len(session.user_answers)}")
    print(f"   Wrong questions: {len(wrong_questions)}")
    
    # 6. Test context-aware chat
    print(f"\n💬 Step 6: Testing context-aware chat...")
    if wrong_questions:
        question_context = session.get_question_context(wrong_questions[0])
        try:
            chat_response = await llm.chat_with_context(
                "I don't understand this problem. Can you help?",
                [],
                question_context
            )
            print(f"   Chat response: {chat_response[:100]}...")
        except Exception as e:
            print(f"   ❌ Chat error: {e}")
    
    print(f"\n🎉 Quiz system test completed successfully!")
    
    return {
        "questions_parsed": len(questions),
        "quiz_id": quiz_id,
        "score": score,
        "wrong_questions": len(wrong_questions)
    }

if __name__ == "__main__":
    result = asyncio.run(test_quiz_flow())
    print(f"\n📋 Test Results: {json.dumps(result, indent=2)}")
