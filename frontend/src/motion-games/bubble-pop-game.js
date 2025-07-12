/**
 * Bubble Pop Game Engine
 * Students pop bubbles containing correct answers by waving their hand over them
 */

class BubblePopGame {
    constructor(containerId, themeKeyword = 'default') {
        this.container = document.getElementById(containerId);
        this.themeManager = new ThemeManager();
        this.motionDetector = new MotionDetector();
        this.theme = this.themeManager.getThemedAsset(themeKeyword);
        this.themeKeyword = themeKeyword;
        
        // Initialize Pikachu Assistant
        this.pikachuAssistant = new PikachuAssistant(containerId);
        
        this.gameState = {
            currentQuestion: null,
            correctAnswer: '',
            distractors: [],
            bubbles: [],
            score: 0,
            isPlaying: false,
            gameComplete: false
        };
        
        this.bubbleSpeed = 1;
        this.bubbleSpawnRate = 60; // Spawn bubbles less frequently for better tracking
        this.frameCount = 0;
        this.gameLoop = null;
        this.maxBubbles = 4; // Fewer bubbles for better interaction
        
        // Callbacks
        this.onCorrectAnswer = null;
        this.onWrongAnswer = null;
        this.onGameComplete = null;
    }

    /**
     * Initialize the game
     */
    async init() {
        try {
            this.createGameContainer();
            
            // Setup webcam and motion detection
            const video = this.container.querySelector('#game-video');
            const canvas = this.container.querySelector('#game-canvas');
            
            const initialized = await this.motionDetector.initialize(video, canvas);
            if (!initialized) {
                throw new Error('Failed to initialize motion detection');
            }
            
            this.setupEventListeners();
            return true;
        } catch (error) {
            console.error('Failed to initialize Bubble Pop game:', error);
            this.showError('Unable to access camera. Please ensure camera permissions are enabled.');
            return false;
        }
    }

    /**
     * Create the game container HTML
     */
    createGameContainer() {
        this.container.innerHTML = `
            <div class="bubble-pop-game" style="position: relative; width: 100%; height: 600px; overflow: hidden; border-radius: 15px; background: ${this.theme.background};">
                <!-- Webcam feed (hidden) -->
                <video id="game-video" style="display: none;" autoplay muted></video>
                
                <!-- Game canvas -->
                <canvas id="game-canvas" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 10;"></canvas>
                
                <!-- Game overlay -->
                <div id="game-overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 20; pointer-events: none;">
                    <!-- Question display -->
                    <div id="question-display" style="
                        position: absolute;
                        top: 20px;
                        left: 20px;
                        right: 20px;
                        background: rgba(255,255,255,0.95);
                        padding: 15px;
                        border-radius: 10px;
                        text-align: center;
                        font-size: 18px;
                        font-weight: bold;
                        color: #333;
                        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                    ">
                        👋 Wave at correct bubbles!
                    </div>
                    
                    <!-- Score display -->
                    <div id="score-display" style="
                        position: absolute;
                        top: 20px;
                        right: 20px;
                        background: ${this.theme.primary};
                        color: white;
                        padding: 10px 15px;
                        border-radius: 10px;
                        font-size: 16px;
                        font-weight: bold;
                        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                    ">
                        Score: <span id="score-value">0</span>
                    </div>
                    
                    <!-- Motion indicator -->
                    <div id="motion-indicator" style="
                        position: absolute;
                        width: 30px;
                        height: 30px;
                        background: ${this.theme.accent};
                        border: 3px solid white;
                        border-radius: 50%;
                        display: none;
                        z-index: 30;
                        box-shadow: 0 0 10px rgba(0,0,0,0.5);
                    "></div>
                </div>
                
                <!-- Start button -->
                <div id="start-screen" style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.8);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    z-index: 50;
                ">
                    <div style="text-align: center; color: white;">
                        <h2 style="font-size: 2.5em; margin-bottom: 20px;">${this.theme.character} Bubble Pop!</h2>
                        <p style="font-size: 1.2em; margin-bottom: 30px;">👋 Wave to pop correct bubbles!</p>
                        
                        <div style="margin-bottom: 20px;">
                            <button id="fullscreen-button" style="
                                padding: 10px 15px;
                                font-size: 14px;
                                background: rgba(255,255,255,0.2);
                                color: white;
                                border: 2px solid white;
                                border-radius: 8px;
                                cursor: pointer;
                                margin-right: 10px;
                            ">🖥️ Fullscreen</button>
                        </div>
                        
                        <button id="start-button" style="
                            padding: 15px 30px;
                            font-size: 1.5em;
                            background: ${this.theme.primary};
                            color: white;
                            border: none;
                            border-radius: 10px;
                            cursor: pointer;
                            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                        ">
                            Start Game!
                        </button>
                    </div>
                </div>
            </div>
            
            <style>
                @keyframes bubbleFloat {
                    0% { transform: translateY(100vh) translateX(0px) scale(0.8); opacity: 0.8; }
                    5% { opacity: 1; }
                    25% { transform: translateY(75vh) translateX(-20px) scale(0.9); }
                    50% { transform: translateY(50vh) translateX(20px) scale(1); }
                    75% { transform: translateY(25vh) translateX(-10px) scale(1.1); }
                    95% { opacity: 1; }
                    100% { transform: translateY(-10vh) translateX(0px) scale(1.2); opacity: 0; }
                }
                
                @keyframes bubblePop {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.5); }
                    100% { transform: scale(0); opacity: 0; }
                }
                
                .bubble {
                    position: absolute;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    color: white;
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.7);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                    cursor: pointer;
                    animation: bubbleFloat 18s ease-in-out forwards;
                }
                
                .bubble.popping {
                    animation: bubblePop 0.5s ease-out forwards;
                }
                
                .bubble.correct {
                    background: ${this.theme.primary};
                    border: 4px solid ${this.theme.accent};
                }
                
                .bubble.incorrect {
                    background: ${this.theme.secondary};
                    border: 4px solid #ccc;
                }
            </style>
        `;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        const startButton = this.container.querySelector('#start-button');
        const fullscreenButton = this.container.querySelector('#fullscreen-button');
        
        startButton.addEventListener('click', () => this.startGame());
        fullscreenButton.addEventListener('click', () => this.toggleFullscreen());
        
        // Setup motion detection callback
        this.motionDetector.startDetection((motionData) => {
            this.handleMotion(motionData);
        });
    }

    /**
     * Start the game
     */
    startGame() {
        this.gameState.isPlaying = true;
        this.gameState.gameComplete = false;
        this.gameState.score = 0;
        
        // Show Pikachu assistant
        this.pikachuAssistant.showStart();
        
        const startScreen = this.container.querySelector('#start-screen');
        startScreen.style.display = 'none';
        
        this.startGameLoop();
        this.playSound('start');
    }

    /**
     * Load a new question
     */
    loadQuestion(question, correctAnswer, distractors) {
        this.gameState.currentQuestion = question;
        this.gameState.correctAnswer = correctAnswer;
        this.gameState.distractors = distractors || [];
        
        // Update question display
        const questionDisplay = this.container.querySelector('#question-display');
        questionDisplay.innerHTML = `<strong>${question}</strong><br><small>Wave your hand over the bubble with the correct answer!</small>`;
        
        // Clear existing bubbles
        this.gameState.bubbles = [];
        this.clearBubbles();
    }

    /**
     * Start the game loop
     */
    startGameLoop() {
        this.gameLoop = setInterval(() => {
            this.updateGame();
        }, 1000 / 60); // 60 FPS
    }

    /**
     * Stop the game loop
     */
    stopGameLoop() {
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }
    }

    /**
     * Update game state
     */
    updateGame() {
        if (!this.gameState.isPlaying) return;
        
        this.frameCount++;
        
        // Spawn new bubbles more actively
        const activeBubbles = this.gameState.bubbles.filter(b => !b.isPopped).length;
        if (this.frameCount % this.bubbleSpawnRate === 0 && activeBubbles < this.maxBubbles) {
            this.spawnBubble();
        }
        
        // Emergency spawn if no bubbles exist
        if (activeBubbles === 0 && this.frameCount > 60) {
            this.spawnBubble();
        }
        
        // Update existing bubbles
        this.updateBubbles();
        
        // Check if all correct answers have been found
        const correctBubblesPopped = this.gameState.bubbles.filter(b => b.isCorrect && b.isPopped).length;
        if (correctBubblesPopped > 0 || (this.gameState.bubbles.length === 0 && this.frameCount > this.bubbleSpawnRate * 8)) {
            this.onQuestionComplete();
        }
    }

    /**
     * Spawn a new bubble
     */
    spawnBubble() {
        if (!this.gameState.currentQuestion) return;
        
        // Create array of all possible answers
        const allAnswers = [this.gameState.correctAnswer, ...this.gameState.distractors];
        
        // Only spawn if we have answers and haven't spawned them all
        if (this.gameState.bubbles.length >= allAnswers.length) return;
        
        const answer = allAnswers[this.gameState.bubbles.length];
        const isCorrect = answer === this.gameState.correctAnswer;
        
        const bubble = this.createBubble(answer, isCorrect);
        this.gameState.bubbles.push(bubble);
        
        // Add to DOM
        const gameOverlay = this.container.querySelector('#game-overlay');
        gameOverlay.appendChild(bubble.element);
    }

    /**
     * Create a bubble element
     */
    createBubble(content, isCorrect) {
        const canvas = this.container.querySelector('#game-canvas');
        const size = 80 + Math.random() * 50; // Larger bubbles for better interaction
        const containerWidth = canvas.clientWidth;
        const x = size + Math.random() * (containerWidth - 2 * size); // Keep within bounds
        
        const bubble = document.createElement('div');
        bubble.className = `bubble ${isCorrect ? 'correct' : 'incorrect'}`;
        bubble.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            bottom: -${size}px;
            font-size: ${size * 0.3}px;
        `;
        bubble.textContent = content;
        
        return {
            element: bubble,
            x: x,
            y: canvas.clientHeight + size,
            width: size,
            height: size,
            content: content,
            isCorrect: isCorrect,
            isPopped: false
        };
    }

    /**
     * Update bubble positions
     */
    updateBubbles() {
        this.gameState.bubbles = this.gameState.bubbles.filter(bubble => {
            if (bubble.isPopped) return false;
            
            // Check if bubble has floated off screen
            const rect = bubble.element.getBoundingClientRect();
            if (rect.bottom < 0) {
                bubble.element.remove();
                return false;
            }
            
            return true;
        });
    }

    /**
     * Handle motion detection
     */
    handleMotion(motionData) {
        if (!this.gameState.isPlaying) return;
        
        // Update motion indicator
        const indicator = this.container.querySelector('#motion-indicator');
        const canvas = this.container.querySelector('#game-canvas');
        
        if (motionData) {
            indicator.style.display = 'block';
            indicator.style.left = `${motionData.centerX}px`;
            indicator.style.top = `${motionData.centerY}px`;
            
            // Check collision with bubbles
            this.checkBubbleCollisions(motionData);
        } else {
            indicator.style.display = 'none';
        }
    }

    /**
     * Check collisions between motion and bubbles
     */
    checkBubbleCollisions(motionData) {
        for (const bubble of this.gameState.bubbles) {
            if (bubble.isPopped) continue;
            
            const bubbleRect = bubble.element.getBoundingClientRect();
            const canvasRect = this.container.querySelector('#game-canvas').getBoundingClientRect();
            
            // Adjust bubble position relative to canvas
            const bubbleCanvasRect = {
                x: bubbleRect.left - canvasRect.left,
                y: bubbleRect.top - canvasRect.top,
                width: bubbleRect.width,
                height: bubbleRect.height
            };
            
            if (this.motionDetector.checkCollision(motionData, bubbleCanvasRect)) {
                this.popBubble(bubble);
                break; // Only pop one bubble at a time
            }
        }
    }

    /**
     * Pop a bubble
     */
    popBubble(bubble) {
        if (bubble.isPopped) return;
        
        bubble.isPopped = true;
        bubble.element.classList.add('popping');
        
        if (bubble.isCorrect) {
            this.handleCorrectAnswer();
        } else {
            this.handleWrongAnswer();
        }
        
        // Remove bubble after animation
        setTimeout(() => {
            bubble.element.remove();
        }, 500);
    }

    /**
     * Handle correct answer
     */
    handleCorrectAnswer() {
        this.gameState.score += 10;
        this.updateScore();
        this.playSound('success');
        this.showFeedback('Correct! Great job! 🎉', 'success');
        
        // Show Pikachu saying "Right!"
        this.pikachuAssistant.showRight();
        
        if (this.onCorrectAnswer) {
            this.onCorrectAnswer();
        }
    }

    /**
     * Handle wrong answer
     */
    handleWrongAnswer() {
        this.playSound('error');
        this.showFeedback('Try again! Look for the correct answer! 💪', 'error');
        
        if (this.onWrongAnswer) {
            this.onWrongAnswer();
        }
    }

    /**
     * Update score display
     */
    updateScore() {
        const scoreValue = this.container.querySelector('#score-value');
        scoreValue.textContent = this.gameState.score;
    }

    /**
     * Show feedback message
     */
    showFeedback(message, type) {
        const feedback = document.createElement('div');
        feedback.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: ${type === 'success' ? this.theme.primary : '#ff6b6b'};
            color: white;
            padding: 20px 30px;
            border-radius: 15px;
            font-size: 1.5em;
            font-weight: bold;
            text-align: center;
            box-shadow: 0 8px 16px rgba(0,0,0,0.3);
            z-index: 60;
            animation: feedbackPop 2s ease-out forwards;
        `;
        feedback.textContent = message;
        
        const overlay = this.container.querySelector('#game-overlay');
        overlay.appendChild(feedback);
        
        setTimeout(() => feedback.remove(), 2000);
    }

    /**
     * Clear all bubbles
     */
    clearBubbles() {
        const bubbles = this.container.querySelectorAll('.bubble');
        bubbles.forEach(bubble => bubble.remove());
    }

    /**
     * Question complete handler
     */
    onQuestionComplete() {
        // Reset for next question or end game
        this.frameCount = 0;
        
        if (this.onGameComplete) {
            this.onGameComplete(this.gameState.score);
        }
    }

    /**
     * Play themed sound
     */
    playSound(type) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            switch (type) {
                case 'success':
                    oscillator.frequency.setValueAtTime(523, audioContext.currentTime);
                    oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1);
                    oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.2);
                    break;
                case 'error':
                    oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
                    oscillator.frequency.setValueAtTime(150, audioContext.currentTime + 0.1);
                    break;
                case 'start':
                    oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
                    oscillator.frequency.setValueAtTime(500, audioContext.currentTime + 0.1);
                    break;
            }
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (e) {
            console.log('Audio not supported');
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        this.container.innerHTML = `
            <div style="
                display: flex;
                align-items: center;
                justify-content: center;
                height: 300px;
                text-align: center;
                color: #666;
                font-size: 1.2em;
            ">
                <div>
                    <div style="font-size: 3em; margin-bottom: 20px;">📷</div>
                    <p>${message}</p>
                </div>
            </div>
        `;
    }

    /**
     * Stop the game and cleanup
     */
    stop() {
        this.gameState.isPlaying = false;
        this.stopGameLoop();
        this.motionDetector.stop();
        
        // Cleanup Pikachu assistant
        if (this.pikachuAssistant) {
            this.pikachuAssistant.destroy();
        }
    }

    /**
     * Get current score
     */
    getScore() {
        return this.gameState.score;
    }

    /**
     * Toggle fullscreen mode
     */
    toggleFullscreen() {
        if (!document.fullscreenElement && !document.webkitFullscreenElement && 
            !document.mozFullScreenElement && !document.msFullscreenElement) {
            this.enterFullscreen();
        } else {
            this.exitFullscreen();
        }
    }

    /**
     * Enter fullscreen mode
     */
    enterFullscreen() {
        const element = this.container;
        
        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen();
        } else if (element.mozRequestFullScreen) {
            element.mozRequestFullScreen();
        } else if (element.msRequestFullscreen) {
            element.msRequestFullscreen();
        }
    }

    /**
     * Exit fullscreen mode
     */
    exitFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
}

// Export for use in other modules
window.BubblePopGame = BubblePopGame;
