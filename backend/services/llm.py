import os
from typing import List
import logging
import re

import httpx

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
USE_LOCAL_LLM = os.getenv("USE_LOCAL_LLM", "false").lower() == "true"
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "phi4-mini-reasoning:latest")

# GitHub Models API configuration
GITHUB_API_URL = "https://models.github.ai/inference"
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
MODEL_NAME = "openai/gpt-4.1-mini"

# Determine which mode to use
if USE_LOCAL_LLM:
    MOCK = False  # Use local model
    logger.info(f"Using local Ollama model: {OLLAMA_MODEL}")
else:
    MOCK = not GITHUB_TOKEN
    if not MOCK:
        logger.info(f"Using GitHub model: {MODEL_NAME}")
    else:
        logger.info("Using mock responses")

SYSTEM_PROMPT_REWRITE = (
    "You are an engaging mathematician for ADHD students. Your job is to rewrite math questions in a way that is fun and engaging. "
    "Format your response in clean markdown. You ONLY need to output the rewritten question, no additional text or explanations. "
    "Do not include any thinking process or reasoning steps in your response."
)

SYSTEM_PROMPT_ANSWER = (
    "You are a precise math teacher. Generate the correct answer to this math question. "
    "Provide ONLY the final numerical answer or the exact answer expected. "
    "For word problems, provide the numerical result. For calculations, provide the number. "
    "Do not include units unless specifically asked. Do not include any working or explanation."
)

SYSTEM_PROMPT_EXPLANATION = (
    "You are a patient math tutor helping a dyslexic student. Explain how to solve this math problem step by step. "
    "Use simple sentences (<15 words each), clear steps, and encouraging language. "
    "Format your response in clean markdown with proper headings and numbered steps. "
    "Make it easy to understand and build confidence. "
    "Do not include any thinking process or reasoning steps in your response."
)

SYSTEM_PROMPT_CHAT = (
    "You are 'Math Buddy', a patient story-teller supporting a dyslexic student. "
    "Use simple sentences (<15 words), explicit line-breaks, and ask one question at a time. "
    "Format your response in clean markdown with proper headings, lists, and emphasis where appropriate. "
    "Do not include any thinking process or reasoning steps in your response."
)


def clean_reasoning_output(text: str) -> str:
    """
    Clean up output from reasoning models by removing thinking tags and formatting as markdown.
    
    :param text: Raw output from the model
    :return: Cleaned and formatted text
    """
    if not text:
        return text
    
    # Replace thinking tags with a space to maintain word separation
    text = re.sub(r'<think>.*?</think>', ' ', text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r'<thinking>.*?</thinking>', ' ', text, flags=re.DOTALL | re.IGNORECASE)
    
    # Handle mismatched tags (orphaned opening/closing)
    text = re.sub(r'<think>.*?</thinking>', ' ', text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r'<thinking>.*?</think>', ' ', text, flags=re.DOTALL | re.IGNORECASE)
    
    # Remove any standalone opening or closing think tags
    text = re.sub(r'</?think>', ' ', text, flags=re.IGNORECASE)
    text = re.sub(r'</?thinking>', ' ', text, flags=re.IGNORECASE)
    
    # Clean up multiple consecutive spaces but preserve newlines
    text = re.sub(r'[ \t]+', ' ', text)
    
    # Clean up multiple consecutive newlines but keep double newlines for paragraphs
    text = re.sub(r'\n\s*\n\s*\n+', '\n\n', text)
    
    # Remove leading/trailing whitespace
    text = text.strip()
    
    # Ensure proper markdown formatting for math content
    # Add proper spacing around lists and headings
    lines = text.split('\n')
    formatted_lines = []
    
    for i, line in enumerate(lines):
        line = line.strip()
        if not line:
            formatted_lines.append('')
            continue
            
        # Ensure proper spacing before headers
        if line.startswith('#') and i > 0 and formatted_lines and formatted_lines[-1]:
            formatted_lines.append('')
        
        # Ensure proper spacing before lists
        if (line.startswith(('-', '*', '+')) or re.match(r'^\d+\.', line)) and i > 0 and formatted_lines and formatted_lines[-1] and not formatted_lines[-1].startswith(('-', '*', '+')) and not re.match(r'^\d+\.', formatted_lines[-1]):
            formatted_lines.append('')
        
        formatted_lines.append(line)
    
    return '\n'.join(formatted_lines).strip()


async def call_ollama(prompt: str, system_prompt: str = "") -> str:
    """Call Ollama API with the given prompt"""
    try:
        full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
        
        async with httpx.AsyncClient(timeout=60) as client:
            payload = {
                "model": OLLAMA_MODEL,
                "prompt": full_prompt,
                "stream": False
            }
            
            response = await client.post(f"{OLLAMA_URL}/api/generate", json=payload)
            response.raise_for_status()
            data = response.json()
            raw_response = data.get("response", "").strip()
            
            # Clean up reasoning model output
            cleaned_response = clean_reasoning_output(raw_response)
            return cleaned_response
            
    except Exception as e:
        logger.error(f"Error calling Ollama: {str(e)}")
        raise Exception(f"Local LLM error: {str(e)}")


async def call_github_model(messages: List[dict], temperature: float = 0.7) -> str:
    """Call GitHub Models API with the given messages"""
    try:
        # Increase timeout and use correct endpoint path
        async with httpx.AsyncClient(timeout=120) as client:
            payload = {
                "model": MODEL_NAME,
                "messages": messages,
                "temperature": temperature,
                "top_p": 1.0
            }
            headers = {"Authorization": f"Bearer {GITHUB_TOKEN}"}
            # Use the correct endpoint path
            resp = await client.post(f"{GITHUB_API_URL}/chat/completions", json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            raw_response = data["choices"][0]["message"]["content"].strip()
            
            # Clean up reasoning model output (in case cloud models also use reasoning tags)
            cleaned_response = clean_reasoning_output(raw_response)
            return cleaned_response
            
    except Exception as e:
        logger.error(f"Error calling GitHub model: {str(e)}")
        raise Exception(f"GitHub model error: {str(e)}")


async def rewrite_question(question: str, theme: str, age: int) -> str:
    if MOCK:
        return f"[Mock] {question} with theme {theme}"
    
    prompt = f"Rewrite this math question with theme '{theme}' for age {age}: {question}"
    
    if USE_LOCAL_LLM:
        return await call_ollama(prompt, SYSTEM_PROMPT_REWRITE)
    else:
        try:
            messages = [
                {"role": "system", "content": SYSTEM_PROMPT_REWRITE},
                {"role": "user", "content": prompt},
            ]
            return await call_github_model(messages, temperature=0.7)
        except Exception as e:
            logger.error(f"GitHub model failed, falling back to mock: {e}")
            return f"[Mock Fallback] {question} with theme {theme}"


async def chat(message: str, history: List[dict]) -> str:
    if MOCK:
        return "[Mock] Let's solve it together!"
    
    if USE_LOCAL_LLM:
        # Format history for Ollama (single prompt format)
        conversation = ""
        for msg in history:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            conversation += f"{role.capitalize()}: {content}\n"
        
        full_prompt = f"{conversation}User: {message}\nAssistant:"
        return await call_ollama(full_prompt, SYSTEM_PROMPT_CHAT)
    else:
        msgs = [{"role": "system", "content": SYSTEM_PROMPT_CHAT}]
        msgs.extend(history)
        msgs.append({"role": "user", "content": message})
        return await call_github_model(msgs, temperature=0.7)


async def generate_encouragement(prompt: str, theme: str) -> str:
    """Generate themed encouragement message for quiz results"""
    if MOCK:
        return f"[Mock] Great job! You're a {theme} champion! 🌟"
    
    system_prompt = (
        f"You are an encouraging math tutor with a {theme} theme. "
        "Create a short, enthusiastic, and supportive message. "
        "Use simple language and include relevant emojis. "
        "Keep it under 50 words and make it fun and themed. "
        "Format in clean markdown and do not include any thinking process or reasoning steps."
    )
    
    if USE_LOCAL_LLM:
        return await call_ollama(prompt, system_prompt)
    else:
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt},
        ]
        return await call_github_model(messages, temperature=0.8)


async def generate_answer(question: str) -> str:
    """Generate the correct answer for a math question"""
    if MOCK:
        return "42"  # Mock answer
    
    prompt = f"What is the correct answer to this math question: {question}"
    
    if USE_LOCAL_LLM:
        return await call_ollama(prompt, SYSTEM_PROMPT_ANSWER)
    else:
        try:
            messages = [
                {"role": "system", "content": SYSTEM_PROMPT_ANSWER},
                {"role": "user", "content": prompt},
            ]
            return await call_github_model(messages, temperature=0.1)  # Low temp for consistency
        except Exception as e:
            logger.error(f"Answer generation failed: {e}")
            return "Error generating answer"


async def generate_explanation(question: str, correct_answer: str) -> str:
    """Generate step-by-step explanation for a math question"""
    if MOCK:
        return f"[Mock] Here's how to solve: {question} = {correct_answer}"
    
    prompt = f"Explain step by step how to solve this math problem:\nQuestion: {question}\nCorrect Answer: {correct_answer}"
    
    if USE_LOCAL_LLM:
        return await call_ollama(prompt, SYSTEM_PROMPT_EXPLANATION)
    else:
        try:
            messages = [
                {"role": "system", "content": SYSTEM_PROMPT_EXPLANATION},
                {"role": "user", "content": prompt},
            ]
            return await call_github_model(messages, temperature=0.7)
        except Exception as e:
            logger.error(f"Explanation generation failed: {e}")
            return "Error generating explanation"


async def rewrite_with_answer(question: str, theme: str, age: int) -> dict:
    """Rewrite question and generate answer and explanation in one go"""
    if MOCK:
        return {
            "rewritten": f"[Mock] {question} with theme {theme}",
            "answer": "42",
            "explanation": f"[Mock] Here's how to solve this {theme}-themed problem!"
        }
    
    try:
        # Generate all components concurrently for efficiency
        import asyncio
        
        rewritten_task = rewrite_question(question, theme, age)
        answer_task = generate_answer(question)
        
        rewritten, answer = await asyncio.gather(rewritten_task, answer_task)
        explanation = await generate_explanation(question, answer)
        
        return {
            "rewritten": rewritten,
            "answer": answer.strip(),
            "explanation": explanation
        }
    except Exception as e:
        logger.error(f"Error in rewrite_with_answer: {e}")
        return {
            "rewritten": f"[Error] {question}",
            "answer": "Error",
            "explanation": "Unable to generate explanation"
        }


def check_answer(user_answer: str, correct_answer: str) -> bool:
    """Check if user's answer matches the correct answer"""
    try:
        # Normalize answers by removing extra spaces and converting to lowercase
        user_clean = str(user_answer).strip().lower()
        correct_clean = str(correct_answer).strip().lower()
        
        # Try numeric comparison first
        try:
            user_num = float(user_clean)
            correct_num = float(correct_clean)
            # Allow small tolerance for floating point comparison
            return abs(user_num - correct_num) < 0.01
        except ValueError:
            # Fall back to string comparison for non-numeric answers
            return user_clean == correct_clean
            
    except Exception as e:
        logger.error(f"Error checking answer: {e}")
        return False


async def chat_with_context(message: str, history: List[dict], question_context: dict = None) -> str:
    """Enhanced chat with question context for wrong answers"""
    if MOCK:
        return "[Mock] Let's work through this together!"
    
    # Build context-aware system prompt
    context_prompt = SYSTEM_PROMPT_CHAT
    if question_context:
        context_prompt += f"\n\nContext: The student is asking about this math problem:\n"
        context_prompt += f"Original Question: {question_context.get('original', '')}\n"
        context_prompt += f"Themed Question: {question_context.get('rewritten', '')}\n"
        context_prompt += f"Correct Answer: {question_context.get('answer', '')}\n"
        context_prompt += f"Student's Answer: {question_context.get('user_answer', '')}\n"
        context_prompt += "Help them understand where they went wrong and guide them to the correct solution."
    
    if USE_LOCAL_LLM:
        # Format history for Ollama (single prompt format)
        conversation = ""
        for msg in history:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            conversation += f"{role.capitalize()}: {content}\n"
        
        full_prompt = f"{conversation}User: {message}\nAssistant:"
        return await call_ollama(full_prompt, context_prompt)
    else:
        msgs = [{"role": "system", "content": context_prompt}]
        msgs.extend(history)
        msgs.append({"role": "user", "content": message})
        return await call_github_model(msgs, temperature=0.7)


async def generate_minigame_html(questions_data: list, game_prompt: str, theme: str, age: int) -> str:
    """Generate interactive HTML minigame based on quiz questions"""
    if MOCK:
        return f"""
        <div style="text-align: center; padding: 20px; font-family: Arial;">
            <h2>🎮 {theme} Math Adventure</h2>
            <p>[Mock] {game_prompt}</p>
            <button onclick="alert('Mock game!')">Start Game!</button>
        </div>
        """
    
    # Create a comprehensive prompt for the LLM
    system_prompt = f"""
You are creating a SIMPLE educational HTML5 game for children aged {age} with special educational needs (SEN). 
The game must be EASY TO UNDERSTAND and SIMPLE TO PLAY with the theme '{theme}'.

CRITICAL REQUIREMENTS - SEN ACCESSIBILITY:
1. ONE clear instruction at a time (max 6-8 words)
2. LARGE, colorful buttons (minimum 60px height)
3. BIG, clear text (minimum 18px font size)
4. HIGH contrast colors (dark text on light backgrounds)
5. Simple click/tap interactions only (no drag & drop or complex gestures)
6. Immediate positive feedback for every action
7. NO time pressure or stress elements
8. Clear visual indicators for what to do next
9. Repetitive, predictable game patterns
10. Success sounds and celebrations after each correct answer

GAME STRUCTURE - KEEP IT SIMPLE:
- Start with a big "START GAME" button
- One math question at a time
- 2-4 answer choices as large buttons
- Instant feedback: "WELL DONE!" or "TRY AGAIN!"
- Simple scoring: stars or smiley faces
- "NEXT" button to continue
- Celebration screen at the end

INTERACTION STYLE:
- Click to select answers (large touch targets)
- Visual feedback when buttons are pressed
- Simple hover effects (color changes)
- No complex animations that might distract
- Clear progression indicators (1 of 5, 2 of 5, etc.)

VISUAL DESIGN:
- Use emojis for visual appeal
- Rounded corners on all elements
- Bright, cheerful colors
- Simple {theme} decorations (not overwhelming)
- Large fonts: Comic Sans MS or Arial
- Plenty of white space
- Clear visual separation between elements

INSTRUCTIONS STYLE:
- Use simple words (reading age 6-8)
- One sentence instructions
- Visual cues with emojis
- Positive, encouraging language
- No complex grammar or long explanations

The game should be based on: {game_prompt}

Format: Return ONLY the complete HTML code with embedded CSS and JavaScript.
Do not include any markdown code blocks or additional text.
Do not include any thinking process or reasoning steps in your response.
"""

    # Format questions for the prompt
    questions_text = "\n".join([
        f"Math Problem {i+1}: {q['topic']} - {q['rewritten']} (Answer: {q['answer']})"
        for i, q in enumerate(questions_data[:3])  # Limit to first 3 questions for simplicity
    ])
    
    user_prompt = f"""
Create a SIMPLE interactive HTML game that uses these math problems:

{questions_text}

GAME REQUEST: {game_prompt}
THEME: {theme}
AGE: {age} years old

MAKE IT SIMPLE FOR SEN STUDENTS:
- One question at a time
- Big colorful buttons to click
- Clear instructions (6-8 words max)
- Happy sounds when correct
- Encouraging messages like "Well done!" or "Great job!"
- No rushing or time limits
- Simple clicking only (no dragging)
- Large text that's easy to read

EXAMPLE SIMPLE GAMES:
- Click the correct number to feed the {theme.lower()} character
- Pop balloons with the right answer to help your {theme.lower()} friend
- Choose the right door to help your character continue the adventure
- Match pairs by clicking two cards with the same answer

Remember: SIMPLE CLICKING + BIG BUTTONS + CLEAR WORDS + HAPPY SOUNDS = PERFECT!
"""

    if USE_LOCAL_LLM:
        html_content = await call_ollama(user_prompt, system_prompt)
    else:
        try:
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ]
            html_content = await call_github_model(messages, temperature=0.8)
        except Exception as e:
            logger.error(f"Minigame generation failed: {e}")
            # Fallback to a simple, SEN-friendly template
            html_content = f"""
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>{theme} Math Fun</title>
                <style>
                    body {{ 
                        font-family: 'Comic Sans MS', Arial, sans-serif; 
                        margin: 0; 
                        padding: 20px; 
                        background: linear-gradient(to bottom, #87CEEB, #98FB98);
                        text-align: center;
                        min-height: 100vh;
                    }}
                    .game-box {{ 
                        max-width: 500px; 
                        margin: 0 auto;
                        background: white; 
                        border-radius: 20px; 
                        padding: 30px; 
                        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                        border: 5px solid #FFD700;
                    }}
                    .big-title {{ 
                        font-size: 2.5em; 
                        color: #333;
                        margin-bottom: 20px;
                        text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
                    }}
                    .simple-text {{ 
                        font-size: 20px; 
                        color: #555;
                        margin: 15px 0;
                        line-height: 1.5;
                    }}
                    .big-button {{ 
                        padding: 20px 40px; 
                        font-size: 24px; 
                        background: #4CAF50; 
                        color: white; 
                        border: none; 
                        border-radius: 15px; 
                        cursor: pointer; 
                        margin: 15px; 
                        box-shadow: 0 5px 10px rgba(0,0,0,0.2);
                        font-family: 'Comic Sans MS', Arial, sans-serif;
                        font-weight: bold;
                        min-width: 200px;
                        min-height: 60px;
                    }}
                    .big-button:hover {{ 
                        background: #45a049;
                        transform: scale(1.05);
                        transition: all 0.2s ease;
                    }}
                    .happy-emoji {{ 
                        font-size: 3em; 
                        margin: 20px 0;
                        animation: bounce 2s infinite;
                    }}
                    @keyframes bounce {{
                        0%, 20%, 50%, 80%, 100% {{ transform: translateY(0); }}
                        40% {{ transform: translateY(-15px); }}
                        60% {{ transform: translateY(-7px); }}
                    }}
                    .instruction {{ 
                        background: #FFF9C4;
                        border: 3px solid #FFD54F;
                        border-radius: 15px;
                        padding: 20px;
                        margin: 20px 0;
                        font-size: 18px;
                        color: #333;
                    }}
                </style>
            </head>
            <body>
                <div class="game-box">
                    <div class="happy-emoji">🎮</div>
                    <h1 class="big-title">{theme} Math Fun!</h1>
                    
                    <div class="instruction">
                        <strong>📝 Your Game Idea:</strong><br>
                        {game_prompt}
                    </div>
                    
                    <p class="simple-text">🌟 <strong>Made for age {age}</strong> 🌟</p>
                    
                    <div style="background: #E8F5E8; border-radius: 10px; padding: 15px; margin: 20px 0;">
                        <p class="simple-text" style="margin: 5px 0;"><strong>✅ Easy to click</strong></p>
                        <p class="simple-text" style="margin: 5px 0;"><strong>✅ Big buttons</strong></p>
                        <p class="simple-text" style="margin: 5px 0;"><strong>✅ Happy sounds</strong></p>
                        <p class="simple-text" style="margin: 5px 0;"><strong>✅ No time pressure</strong></p>
                    </div>
                    
                    <button class="big-button" onclick="startDemo()">🚀 Try Demo</button>
                    <button class="big-button" onclick="showHelp()" style="background: #2196F3;">❓ How to Play</button>
                    
                    <div id="demo-area" style="display: none; margin-top: 30px; padding: 20px; background: #F0F8FF; border-radius: 15px;">
                        <div class="happy-emoji">😊</div>
                        <h3 style="color: #333;">Demo Time!</h3>
                        <p class="simple-text">Click the buttons to hear sounds!</p>
                        <button onclick="playHappySound()" style="padding: 15px 25px; margin: 10px; font-size: 16px; border: none; background: #FF9800; color: white; border-radius: 10px; cursor: pointer;">🎵 Happy Sound</button>
                        <button onclick="playSuccessSound()" style="padding: 15px 25px; margin: 10px; font-size: 16px; border: none; background: #4CAF50; color: white; border-radius: 10px; cursor: pointer;">🎉 Success Sound</button>
                    </div>
                    
                    <script>
                        function startDemo() {{
                            const demo = document.getElementById('demo-area');
                            demo.style.display = demo.style.display === 'none' ? 'block' : 'none';
                            playHappySound();
                        }}
                        
                        function showHelp() {{
                            alert('� How to Play:\\n\\n1. Read the question\\n2. Click your answer\\n3. Get happy sounds for correct answers\\n4. Try again if wrong - no problem!\\n5. Have fun learning math!');
                            playSuccessSound();
                        }}
                        
                        function playHappySound() {{
                            try {{
                                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                                const oscillator = audioContext.createOscillator();
                                const gainNode = audioContext.createGain();
                                
                                oscillator.connect(gainNode);
                                gainNode.connect(audioContext.destination);
                                
                                // Happy sound - ascending notes
                                oscillator.frequency.setValueAtTime(523, audioContext.currentTime);      // C
                                oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.15); // E
                                oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.3);  // G
                                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                                oscillator.start(audioContext.currentTime);
                                oscillator.stop(audioContext.currentTime + 0.5);
                            }} catch(e) {{
                                console.log('Audio not supported');
                            }}
                        }}
                        
                        function playSuccessSound() {{
                            try {{
                                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                                const oscillator = audioContext.createOscillator();
                                const gainNode = audioContext.createGain();
                                
                                oscillator.connect(gainNode);
                                gainNode.connect(audioContext.destination);
                                
                                // Success fanfare
                                oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                                oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
                                oscillator.frequency.setValueAtTime(1200, audioContext.currentTime + 0.2);
                                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
                                oscillator.start(audioContext.currentTime);
                                oscillator.stop(audioContext.currentTime + 0.4);
                            }} catch(e) {{
                                console.log('Audio not supported');
                            }}
                        }}
                    </script>
                </div>
            </body>
            </html>
            """
    
    return html_content
