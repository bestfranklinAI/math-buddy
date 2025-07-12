/**
 * Motion Game Controller
 * Manages the selection and execution of motion-based math games
 */

class MotionGameController {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.currentGame = null;
        this.gameData = null;
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.theme = 'default';
        
        // Initialize game engines lazily to avoid dependency issues
        this.gameEngines = null;
        
        // Callbacks
        this.onGameComplete = null;
    }

    /**
     * Initialize the motion game system
     */
    init(quizData, theme = 'default') {
        this.gameData = quizData;
        this.theme = theme;
        this.currentQuestionIndex = 0;
        this.score = 0;
        
        // Initialize game engines now that all scripts should be loaded
        this.initializeGameEngines();
        
        this.createGameSelector();
    }

    /**
     * Initialize game engines with lazy loading
     */
    initializeGameEngines() {
        if (this.gameEngines) return; // Already initialized
        
        try {
            this.gameEngines = {
                'bubble-pop': window.BubblePopGame,
                'enhanced-bubble-pop': window.EnhancedBubblePopGame,
                'side-to-side': window.SideToSideGame,
                'physical-math': window.EnhancedPhysicalMathGame,
                'number-line': window.NumberLineJumpGame,
                'enhanced-number-line': window.EnhancedNumberLineJumpGame
            };
            
            // Verify all game engines are available
            const missingEngines = [];
            for (const [key, engine] of Object.entries(this.gameEngines)) {
                if (!engine) {
                    missingEngines.push(key);
                }
            }
            
            if (missingEngines.length > 0) {
                console.warn('Some game engines are not available:', missingEngines);
                // Remove missing engines to prevent errors
                missingEngines.forEach(key => delete this.gameEngines[key]);
            }
            
            console.log('Game engines initialized:', Object.keys(this.gameEngines));
        } catch (error) {
            console.error('Failed to initialize game engines:', error);
            this.gameEngines = {}; // Fallback to empty object
        }
    }

    /**
     * Create the game selection interface
     */
    createGameSelector() {
        // Ensure game engines are initialized
        if (!this.gameEngines) {
            this.initializeGameEngines();
        }
        
        const availableGames = Object.keys(this.gameEngines).filter(key => this.gameEngines[key]);
        console.log('Available games:', availableGames);
        
        // If no games are available, show error message
        if (availableGames.length === 0) {
            this.container.innerHTML = `
                <div style="
                    padding: 30px;
                    text-align: center;
                    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
                    border-radius: 15px;
                    color: white;
                ">
                    <h2 style="font-size: 2.5em; margin-bottom: 10px;">⚠️ Games Not Available</h2>
                    <p style="font-size: 1.2em; margin-bottom: 20px;">
                        Motion games could not be loaded. Please refresh the page and try again.
                    </p>
                    <button onclick="location.reload()" style="
                        padding: 15px 30px;
                        font-size: 1.2em;
                        background: white;
                        color: #ee5a24;
                        border: none;
                        border-radius: 10px;
                        cursor: pointer;
                        font-weight: bold;
                    ">
                        🔄 Refresh Page
                    </button>
                </div>
            `;
            return;
        }
        this.container.innerHTML = `
            <div class="motion-game-selector" style="
                padding: 30px;
                text-align: center;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 15px;
                color: white;
            ">
                <h2 style="font-size: 2.5em; margin-bottom: 10px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">
                    🎮 Pick Your Game!
                </h2>
                <p style="font-size: 1.2em; margin-bottom: 30px; opacity: 0.9;">
                    👋 Wave to play! 📹 Camera needed
                </p>
                
                <div class="game-options" style="
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                ">
                    <!-- Enhanced Bubble Pop Game -->
                    <div class="game-option" data-game="enhanced-bubble-pop" style="
                        background: linear-gradient(135deg, rgba(255,64,129,0.3), rgba(156,39,176,0.3));
                        border: 2px solid rgba(255,255,255,0.4);
                        border-radius: 15px;
                        padding: 25px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        backdrop-filter: blur(10px);
                        position: relative;
                        overflow: hidden;
                    ">
                        <div style="position: absolute; top: 10px; right: 10px; background: #FF4081; color: white; padding: 5px 10px; border-radius: 15px; font-size: 12px; font-weight: bold;">✨ NEW!</div>
                        <div style="font-size: 4em; margin-bottom: 15px;">🫧✨</div>
                        <h3 style="font-size: 1.5em; margin-bottom: 10px;">Interactive Bubble Pop</h3>
                        <p style="opacity: 0.9; line-height: 1.4; font-size: 1.1em;">
                            👋 Wave, 🖐️ Count fingers, 👉 Point!
                        </p>
                        <div style="margin-top: 15px; font-size: 0.9em; opacity: 0.8;">
                            🌟 Hand tracking, gestures & sounds!
                        </div>
                    </div>
                    
                    <!-- Enhanced Physical Math Game -->
                    <div class="game-option" data-game="physical-math" style="
                        background: linear-gradient(135deg, rgba(76,175,80,0.3), rgba(139,195,74,0.3));
                        border: 2px solid rgba(255,255,255,0.4);
                        border-radius: 15px;
                        padding: 25px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        backdrop-filter: blur(10px);
                        position: relative;
                        overflow: hidden;
                    ">
                        <div style="position: absolute; top: 10px; right: 10px; background: #4CAF50; color: white; padding: 5px 10px; border-radius: 15px; font-size: 12px; font-weight: bold;">✨ NEW!</div>
                        <div style="font-size: 4em; margin-bottom: 15px;">🏃‍♂️🧮</div>
                        <h3 style="font-size: 1.5em; margin-bottom: 10px;">Physical Math Adventure</h3>
                        <p style="opacity: 0.9; line-height: 1.4; font-size: 1.1em;">
                            🤸‍♀️ Full body movement & exercise!
                        </p>
                        <div style="margin-top: 15px; font-size: 0.9em; opacity: 0.8;">
                            🌟 Jump, stretch, dance to learn!
                        </div>
                    </div>
                    
                    <!-- Enhanced Number Line Jump -->
                    <div class="game-option" data-game="enhanced-number-line" style="
                        background: linear-gradient(135deg, rgba(33,150,243,0.3), rgba(3,169,244,0.3));
                        border: 2px solid rgba(255,255,255,0.4);
                        border-radius: 15px;
                        padding: 25px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        backdrop-filter: blur(10px);
                        position: relative;
                        overflow: hidden;
                    ">
                        <div style="position: absolute; top: 10px; right: 10px; background: #2196F3; color: white; padding: 5px 10px; border-radius: 15px; font-size: 12px; font-weight: bold;">✨ NEW!</div>
                        <div style="font-size: 4em; margin-bottom: 15px;">🦘🔢</div>
                        <h3 style="font-size: 1.5em; margin-bottom: 10px;">Number Line Jump</h3>
                        <p style="opacity: 0.9; line-height: 1.4; font-size: 1.1em;">
                            🎵 Jump to rhythm & solve math!
                        </p>
                        <div style="margin-top: 15px; font-size: 0.9em; opacity: 0.8;">
                            🌟 Story mode, rhythm & sequences!
                        </div>
                    </div>
                    
                    <!-- Classic Bubble Pop Game -->
                    <div class="game-option" data-game="bubble-pop" style="
                        background: rgba(255,255,255,0.1);
                        border: 2px solid rgba(255,255,255,0.3);
                        border-radius: 15px;
                        padding: 25px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        backdrop-filter: blur(10px);
                    ">
                        <div style="font-size: 4em; margin-bottom: 15px;">🫧</div>
                        <h3 style="font-size: 1.5em; margin-bottom: 10px;">Classic Bubble Pop</h3>
                        <p style="opacity: 0.8; line-height: 1.4; font-size: 1.1em;">
                            👋 Wave at correct answers!
                        </p>
                        <div style="margin-top: 15px; font-size: 0.9em; opacity: 0.7;">
                            ✨ Simple motion detection
                        </div>
                    </div>
                    
                    <!-- Side-to-Side Game -->
                    <div class="game-option" data-game="side-to-side" style="
                        background: rgba(255,255,255,0.1);
                        border: 2px solid rgba(255,255,255,0.3);
                        border-radius: 15px;
                        padding: 25px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        backdrop-filter: blur(10px);
                    ">
                        <div style="font-size: 4em; margin-bottom: 15px;">↔️</div>
                        <h3 style="font-size: 1.5em; margin-bottom: 10px;">Zone Select</h3>
                        <p style="opacity: 0.8; line-height: 1.4; font-size: 1.1em;">
                            🤚 Hold hand over answers!
                        </p>
                        <div style="margin-top: 15px; font-size: 0.9em; opacity: 0.7;">
                            ✨ Multiple choice questions
                        </div>
                    </div>
                    
                    <!-- Classic Number Line Game -->
                    <div class="game-option" data-game="number-line" style="
                        background: rgba(255,255,255,0.1);
                        border: 2px solid rgba(255,255,255,0.3);
                        border-radius: 15px;
                        padding: 25px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        backdrop-filter: blur(10px);
                    ">
                        <div style="font-size: 4em; margin-bottom: 15px;">🦘</div>
                        <h3 style="font-size: 1.5em; margin-bottom: 10px;">Classic Jump & Count</h3>
                        <p style="opacity: 0.8; line-height: 1.4; font-size: 1.1em;">
                            🦘 Move left & right to jump!
                        </p>
                        <div style="margin-top: 15px; font-size: 0.9em; opacity: 0.7;">
                            ✨ Basic motion tracking
                        </div>
                    </div>
                </div>
                
                <!-- Game controls -->
                <div style="
                    display: flex; 
                    justify-content: center; 
                    gap: 15px; 
                    margin-bottom: 20px;
                    flex-wrap: wrap;
                ">
                    <button id="fullscreen-all-games" style="
                        padding: 12px 20px;
                        background: linear-gradient(135deg, #667eea, #764ba2);
                        color: white;
                        border: none;
                        border-radius: 10px;
                        cursor: pointer;
                        font-size: 16px;
                        font-weight: bold;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                        transition: all 0.3s ease;
                    " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                        🖥️ Play Any Game in Fullscreen
                    </button>
                </div>
                
                <div style="margin-top: 20px; padding: 15px; background: rgba(255,255,255,0.1); border-radius: 10px;">
                    <h4 style="margin-bottom: 10px;">� Ready to Play</h4>
                    <p style="margin: 5px 0;">🎯 <strong>${this.gameData?.questions?.length || 0}</strong> questions</p>
                    <p style="margin: 5px 0;">🎨 <strong>${this.theme}</strong> theme</p>
                    <p style="margin: 5px 0; font-size: 0.9em; opacity: 0.8;">
                        💡 Make sure camera works & good light!
                    </p>
                </div>
            </div>
            
            <style>
                .game-option:hover {
                    transform: translateY(-5px);
                    border-color: rgba(255,255,255,0.6);
                    background: rgba(255,255,255,0.2);
                    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                }
                
                .game-option:active {
                    transform: translateY(-2px);
                }
                
                @media (max-width: 768px) {
                    .game-options {
                        grid-template-columns: 1fr;
                    }
                }
            </style>
        `;
        
        // Hide unavailable games after HTML is created
        this.filterAvailableGames();
        
        this.setupGameSelector();
    }

    /**
     * Hide game options that are not available
     */
    filterAvailableGames() {
        const gameOptions = this.container.querySelectorAll('.game-option');
        
        gameOptions.forEach(option => {
            const gameType = option.dataset.game;
            if (!this.gameEngines[gameType]) {
                // Add visual indication that game is unavailable
                option.style.opacity = '0.5';
                option.style.pointerEvents = 'none';
                option.style.filter = 'grayscale(1)';
                
                // Add "Not Available" badge
                const unavailableBadge = document.createElement('div');
                unavailableBadge.style.cssText = `
                    position: absolute;
                    top: 10px;
                    left: 10px;
                    background: #dc3545;
                    color: white;
                    padding: 5px 10px;
                    border-radius: 15px;
                    font-size: 12px;
                    font-weight: bold;
                    z-index: 10;
                `;
                unavailableBadge.textContent = '❌ Not Available';
                option.appendChild(unavailableBadge);
                
                console.warn(`Game engine not available: ${gameType}`);
            }
        });
    }

    /**
     * Setup game selector event listeners
     */
    setupGameSelector() {
        const gameOptions = this.container.querySelectorAll('.game-option');
        const fullscreenButton = this.container.querySelector('#fullscreen-all-games');
        
        gameOptions.forEach(option => {
            option.addEventListener('click', () => {
                const gameType = option.dataset.game;
                this.startGame(gameType);
            });
        });

        fullscreenButton.addEventListener('click', () => {
            this.showFullscreenGameSelector();
        });
    }

    /**
     * Start a specific game
     */
    async startGame(gameType) {
        if (!this.gameEngines[gameType]) {
            console.error('Unknown game type:', gameType);
            return;
        }
        
        // Show loading
        this.showLoading();
        
        try {
            // Create game container
            this.container.innerHTML = `
                <div class="game-header" style="
                    background: rgba(255,255,255,0.9);
                    padding: 15px;
                    border-radius: 10px;
                    margin-bottom: 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                ">
                    <div>
                        <h3 style="margin: 0; color: #333;">Question <span id="question-counter">1</span> of ${this.gameData.questions.length}</h3>
                        <p style="margin: 5px 0 0 0; color: #666; font-size: 0.9em;">Theme: ${this.theme}</p>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button id="back-button" style="
                            padding: 8px 15px;
                            background: #6366f1;
                            color: white;
                            border: none;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 0.9em;
                        ">
                            ← Back to Games
                        </button>
                        <button id="next-question" style="
                            padding: 8px 15px;
                            background: #10b981;
                            color: white;
                            border: none;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 0.9em;
                            display: none;
                        ">
                            Next Question →
                        </button>
                    </div>
                </div>
                <div id="game-container" style="width: 100%; height: 600px;"></div>
            `;
            
            // Initialize the game
            const GameClass = this.gameEngines[gameType];
            this.currentGame = new GameClass('game-container', this.theme);
            
            const initialized = await this.currentGame.init();
            if (!initialized) {
                throw new Error('Failed to initialize game');
            }
            
            // Setup game callbacks
            this.setupGameCallbacks();
            
            // Load first question
            this.loadCurrentQuestion();
            
            // Setup header buttons
            this.setupHeaderButtons();
            
        } catch (error) {
            console.error('Failed to start game:', error);
            this.showError('Failed to start the game. Please check your camera permissions and try again.');
        }
    }

    /**
     * Setup game event callbacks
     */
    setupGameCallbacks() {
        this.currentGame.onCorrectAnswer = () => {
            this.score += 10;
            // Show success feedback
            const nextButton = document.getElementById('next-question');
            if (nextButton) {
                nextButton.style.display = 'inline-block';
                nextButton.textContent = '✅ Next Question';
            }
            
            // Auto-advance after short delay
            setTimeout(() => {
                this.nextQuestion();
            }, 2500);
        };
        
        this.currentGame.onWrongAnswer = () => {
            // Game handles wrong answer feedback
            // Player can continue trying - don't advance automatically
        };
        
        this.currentGame.onGameComplete = (gameScore) => {
            this.handleGameComplete(gameScore);
        };
    }

    /**
     * Setup header button events
     */
    setupHeaderButtons() {
        const backButton = document.getElementById('back-button');
        const nextButton = document.getElementById('next-question');
        
        backButton.addEventListener('click', () => {
            this.stopCurrentGame();
            this.createGameSelector();
        });
        
        nextButton.addEventListener('click', () => {
            this.nextQuestion();
        });
    }

    /**
     * Load the current question into the game
     */
    loadCurrentQuestion() {
        if (!this.gameData || !this.gameData.questions) return;
        
        const question = this.gameData.questions[this.currentQuestionIndex];
        if (!question) return;
        
        // Update question counter
        const counter = document.getElementById('question-counter');
        if (counter) {
            counter.textContent = this.currentQuestionIndex + 1;
        }
        
        // Prepare question data based on game type
        if (this.currentGame instanceof BubblePopGame) {
            // Generate distractors for bubble pop
            const distractors = this.generateDistractors(question.correct_answer, 3);
            this.currentGame.loadQuestion(
                question.rewritten || question.original,
                question.correct_answer,
                distractors
            );
        } else if (this.currentGame instanceof SideToSideGame) {
            // Generate multiple choice options
            const options = this.generateMultipleChoice(question.correct_answer, 3);
            this.currentGame.loadQuestion(
                question.rewritten || question.original,
                options,
                question.correct_answer
            );
        } else if (this.currentGame instanceof NumberLineJumpGame) {
            // Extract numbers for number line game
            const { startNumber, targetNumber } = this.extractNumberLineData(question);
            this.currentGame.loadQuestion(
                question.rewritten || question.original,
                startNumber,
                targetNumber
            );
        }
    }

    /**
     * Generate distractor answers
     */
    generateDistractors(correctAnswer, count = 3) {
        const distractors = [];
        const correct = parseInt(correctAnswer);
        
        if (isNaN(correct)) {
            // For non-numeric answers, generate simple alternatives
            return ['A', 'B', 'C'].slice(0, count);
        }
        
        // Generate numeric distractors
        const used = new Set([correct]);
        
        while (distractors.length < count) {
            let distractor;
            
            if (Math.random() < 0.5) {
                // Add/subtract small amounts
                distractor = correct + (Math.random() < 0.5 ? -1 : 1) * (Math.floor(Math.random() * 5) + 1);
            } else {
                // Generate numbers in similar range
                const range = Math.max(10, Math.abs(correct));
                distractor = Math.floor(Math.random() * range * 2) - range + correct;
            }
            
            if (!used.has(distractor) && distractor >= 0) {
                distractors.push(distractor.toString());
                used.add(distractor);
            }
        }
        
        return distractors;
    }

    /**
     * Generate multiple choice options
     */
    generateMultipleChoice(correctAnswer, count = 3) {
        const distractors = this.generateDistractors(correctAnswer, count - 1);
        const options = [correctAnswer, ...distractors];
        
        // Shuffle the options
        for (let i = options.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [options[i], options[j]] = [options[j], options[i]];
        }
        
        return options;
    }

    /**
     * Extract number line data from question
     */
    extractNumberLineData(question) {
        const text = question.original || question.rewritten || '';
        const answer = parseInt(question.correct_answer);
        
        // Try to extract starting number from question text
        const numbers = text.match(/\d+/g);
        let startNumber = 0;
        
        if (numbers && numbers.length > 0) {
            startNumber = parseInt(numbers[0]);
        }
        
        // If we can't extract a good starting number, use a sensible default
        if (isNaN(startNumber) || startNumber === answer) {
            if (!isNaN(answer)) {
                startNumber = Math.max(0, answer - Math.floor(Math.random() * 5) - 2);
            }
        }
        
        return {
            startNumber: isNaN(startNumber) ? 0 : startNumber,
            targetNumber: isNaN(answer) ? 5 : answer
        };
    }

    /**
     * Move to next question
     */
    nextQuestion() {
        this.currentQuestionIndex++;
        
        if (this.currentQuestionIndex >= this.gameData.questions.length) {
            this.handleGameComplete(this.currentGame.getScore());
            return;
        }
        
        this.loadCurrentQuestion();
    }

    /**
     * Handle game completion
     */
    handleGameComplete(finalScore) {
        this.stopCurrentGame();
        
        this.container.innerHTML = `
            <div class="game-complete" style="
                text-align: center;
                padding: 40px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 15px;
                color: white;
            ">
                <div style="font-size: 5em; margin-bottom: 20px;">🎉</div>
                <h2 style="font-size: 2.5em; margin-bottom: 20px;">Congratulations!</h2>
                <p style="font-size: 1.3em; margin-bottom: 15px;">You completed all the questions!</p>
                <p style="font-size: 1.1em; margin-bottom: 30px;">Final Score: <strong>${finalScore}</strong> points</p>
                
                <div style="
                    background: rgba(255,255,255,0.1);
                    padding: 20px;
                    border-radius: 10px;
                    margin-bottom: 30px;
                    backdrop-filter: blur(10px);
                ">
                    <h3 style="margin-bottom: 15px;">🏆 Game Summary</h3>
                    <p>Questions Completed: <strong>${this.gameData.questions.length}</strong></p>
                    <p>Theme: <strong>${this.theme}</strong></p>
                    <p>You used motion controls to solve math problems - amazing work!</p>
                </div>
                
                <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                    <button id="play-again" style="
                        padding: 15px 25px;
                        font-size: 1.1em;
                        background: #10b981;
                        color: white;
                        border: none;
                        border-radius: 10px;
                        cursor: pointer;
                        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                    ">
                        🎮 Play Again
                    </button>
                    <button id="finish-game" style="
                        padding: 15px 25px;
                        font-size: 1.1em;
                        background: #6366f1;
                        color: white;
                        border: none;
                        border-radius: 10px;
                        cursor: pointer;
                        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                    ">
                        ✅ Finish
                    </button>
                </div>
            </div>
        `;
        
        // Setup completion buttons
        document.getElementById('play-again').addEventListener('click', () => {
            this.currentQuestionIndex = 0;
            this.score = 0;
            this.createGameSelector();
        });
        
        document.getElementById('finish-game').addEventListener('click', () => {
            if (this.onGameComplete) {
                this.onGameComplete({
                    score: finalScore,
                    questionsCompleted: this.gameData.questions.length,
                    theme: this.theme
                });
            }
        });
    }

    /**
     * Show loading screen
     */
    showLoading() {
        this.container.innerHTML = `
            <div style="
                display: flex;
                align-items: center;
                justify-content: center;
                height: 400px;
                text-align: center;
                color: #666;
                font-size: 1.2em;
            ">
                <div>
                    <div style="font-size: 3em; margin-bottom: 20px; animation: spin 2s linear infinite;">⚙️</div>
                    <p>Setting up your motion game...</p>
                    <p style="font-size: 0.9em; margin-top: 10px;">Please allow camera access when prompted.</p>
                </div>
            </div>
            
            <style>
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            </style>
        `;
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
                height: 400px;
                text-align: center;
                color: #666;
                font-size: 1.2em;
            ">
                <div>
                    <div style="font-size: 3em; margin-bottom: 20px;">❌</div>
                    <p>${message}</p>
                    <button onclick="location.reload()" style="
                        margin-top: 20px;
                        padding: 10px 20px;
                        background: #6366f1;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                    ">
                        Try Again
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Stop current game and cleanup
     */
    stopCurrentGame() {
        if (this.currentGame) {
            this.currentGame.stop();
            this.currentGame = null;
        }
    }

    /**
     * Get current game state
     */
    getGameState() {
        return {
            currentQuestionIndex: this.currentQuestionIndex,
            score: this.score,
            totalQuestions: this.gameData?.questions?.length || 0,
            currentGame: this.currentGame ? this.currentGame.constructor.name : null
        };
    }

    /**
     * Show fullscreen game selector
     */
    showFullscreenGameSelector() {
        // Request fullscreen for the entire container
        const element = this.container;
        
        if (element.requestFullscreen) {
            element.requestFullscreen().then(() => {
                this.adjustGameSelectorForFullscreen();
            });
        } else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen();
            this.adjustGameSelectorForFullscreen();
        } else if (element.mozRequestFullScreen) {
            element.mozRequestFullScreen();
            this.adjustGameSelectorForFullscreen();
        } else if (element.msRequestFullscreen) {
            element.msRequestFullscreen();
            this.adjustGameSelectorForFullscreen();
        } else {
            // Fallback: just adjust layout without fullscreen
            this.adjustGameSelectorForFullscreen();
            alert('Fullscreen mode not supported. Games will display in large format.');
        }
    }

    /**
     * Adjust game selector layout for fullscreen
     */
    adjustGameSelectorForFullscreen() {
        const gameSelector = this.container.querySelector('.motion-game-selector');
        if (gameSelector) {
            gameSelector.style.height = '100vh';
            gameSelector.style.padding = '50px';
            
            // Make game options larger
            const gameOptions = this.container.querySelectorAll('.game-option');
            gameOptions.forEach(option => {
                option.style.padding = '35px';
                option.style.fontSize = '1.2em';
            });
            
            // Hide the fullscreen button since we're already in fullscreen
            const fullscreenButton = this.container.querySelector('#fullscreen-all-games');
            if (fullscreenButton) {
                fullscreenButton.style.display = 'none';
            }
        }
    }
}

// Export for use in other modules
window.MotionGameController = MotionGameController;
