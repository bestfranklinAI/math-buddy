/**
 * Enhanced Interactive Number Line Jump Game
 * Students physically jump to different positions on a number line
 * Features full-body tracking, rhythm integration, and adaptive difficulty
 */

class EnhancedNumberLineJumpGame {
    constructor(containerId, themeKeyword = 'default') {
        this.container = document.getElementById(containerId);
        this.themeManager = new ThemeManager();
        this.motionDetector = new EnhancedMotionDetector();
        this.theme = this.themeManager.getThemedAsset(themeKeyword);
        this.themeKeyword = themeKeyword;
        
        this.gameState = {
            currentQuestion: null,
            targetNumber: 0,
            playerPosition: 5, // Current position on number line (0-10)
            isJumping: false,
            score: 0,
            level: 1,
            isPlaying: false,
            jumpCount: 0,
            perfectJumps: 0,
            gameMode: 'basic', // basic, rhythm, sequence, story
            numberLineRange: { min: 0, max: 10 },
            timeLimit: 30000, // 30 seconds per question
            timeRemaining: 30000
        };
        
        // Game mechanics
        this.frameCount = 0;
        this.gameLoop = null;
        this.jumpThreshold = 50; // Pixels of vertical movement for jump detection
        this.positionHistory = [];
        this.jumpCooldown = 0;
        this.rhythmPattern = [];
        this.rhythmIndex = 0;
        
        // Visual effects
        this.particles = [];
        this.trails = [];
        this.celebrations = [];
        
        // Audio and speech
        this.audioContext = null;
        this.sounds = {};
        this.speechSynthesis = window.speechSynthesis;
        this.backgroundMusic = null;
        
        // Accessibility
        this.voiceEnabled = true;
        this.visualCuesEnabled = true;
        this.slowMotion = false;
        
        // Callbacks
        this.onCorrectJump = null;
        this.onWrongJump = null;
        this.onLevelComplete = null;
    }

    /**
     * Initialize the enhanced number line jump game
     */
    async init() {
        try {
            await this.initAudio();
            this.createGameContainer();
            
            // Setup enhanced motion detection
            const video = this.container.querySelector('#game-video');
            const canvas = this.container.querySelector('#game-canvas');
            
            const initialized = await this.motionDetector.initialize(video, canvas);
            if (!initialized) {
                throw new Error('Failed to initialize enhanced motion detection');
            }
            
            this.setupEventListeners();
            this.preloadSounds();
            this.initNumberLine();
            return true;
        } catch (error) {
            console.error('Failed to initialize Enhanced Number Line Jump game:', error);
            this.showError('Unable to access camera. Please ensure camera permissions are enabled.');
            return false;
        }
    }

    /**
     * Initialize audio system
     */
    async initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.warn('Audio context not available:', error);
        }
    }

    /**
     * Create the enhanced game container
     */
    createGameContainer() {
        this.container.innerHTML = `
            <div class="number-line-jump-game" style="position: relative; width: 100%; height: 600px; overflow: hidden; border-radius: 15px; background: linear-gradient(135deg, #87CEEB, #FFE4B5, #98FB98);">
                <!-- Webcam feed (hidden) -->
                <video id="game-video" style="display: none;" autoplay muted></video>
                
                <!-- Game canvas with body tracking -->
                <canvas id="game-canvas" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 10; border-radius: 15px;"></canvas>
                
                <!-- Background elements -->
                <div id="background-elements" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 5;">
                    <!-- Animated clouds -->
                    <div class="cloud" style="position: absolute; top: 50px; left: -100px; width: 100px; height: 60px; background: white; border-radius: 50px; opacity: 0.7; animation: floatClouds 20s linear infinite;"></div>
                    <div class="cloud" style="position: absolute; top: 100px; left: -150px; width: 120px; height: 70px; background: white; border-radius: 60px; opacity: 0.5; animation: floatClouds 25s linear infinite;"></div>
                    
                    <!-- Sun/Moon -->
                    <div id="celestial-body" style="position: absolute; top: 30px; right: 50px; width: 80px; height: 80px; background: radial-gradient(circle, #FFD700, #FFA500); border-radius: 50%; box-shadow: 0 0 30px #FFD700;"></div>
                </div>
                
                <!-- Game interface overlay -->
                <div id="game-overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 20; pointer-events: none;">
                    
                    <!-- Question and instruction panel -->
                    <div id="question-panel" style="
                        position: absolute;
                        top: 15px;
                        left: 15px;
                        right: 15px;
                        background: linear-gradient(135deg, rgba(255,255,255,0.95), rgba(240,248,255,0.95));
                        padding: 20px;
                        border-radius: 15px;
                        text-align: center;
                        box-shadow: 0 8px 20px rgba(0,0,0,0.2);
                        border: 3px solid ${this.theme.primary};
                    ">
                        <div id="question-display" style="
                            font-size: 32px;
                            font-weight: bold;
                            color: #333;
                            margin-bottom: 10px;
                        ">Jump to the Number!</div>
                        
                        <div id="target-display" style="
                            font-size: 48px;
                            font-weight: bold;
                            color: ${this.theme.primary};
                            margin: 15px 0;
                            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
                        ">5</div>
                        
                        <div id="instruction-text" style="
                            font-size: 16px;
                            color: #666;
                            margin-bottom: 10px;
                        ">🦘 Jump left and right to move on the number line!</div>
                        
                        <div id="timer-display" style="
                            background: linear-gradient(135deg, #FF6B6B, #4ECDC4);
                            color: white;
                            padding: 8px 15px;
                            border-radius: 20px;
                            font-size: 16px;
                            font-weight: bold;
                            display: inline-block;
                            margin-top: 10px;
                        ">⏰ <span id="time-value">30</span>s</div>
                    </div>
                    
                    <!-- Game stats panel -->
                    <div id="stats-panel" style="
                        position: absolute;
                        top: 15px;
                        right: 15px;
                        display: flex;
                        flex-direction: column;
                        gap: 10px;
                    ">
                        <div id="score-display" style="
                            background: linear-gradient(135deg, ${this.theme.primary}, ${this.theme.accent});
                            color: white;
                            padding: 12px 18px;
                            border-radius: 12px;
                            font-size: 18px;
                            font-weight: bold;
                            box-shadow: 0 6px 15px rgba(0,0,0,0.3);
                            text-align: center;
                        ">
                            🏆 <span id="score-value">0</span>
                        </div>
                        
                        <div id="level-display" style="
                            background: linear-gradient(135deg, #9C27B0, #E91E63);
                            color: white;
                            padding: 10px 15px;
                            border-radius: 12px;
                            font-size: 16px;
                            font-weight: bold;
                            box-shadow: 0 6px 15px rgba(0,0,0,0.3);
                            text-align: center;
                        ">
                            ⚡ Level <span id="level-value">1</span>
                        </div>
                        
                        <div id="jump-counter" style="
                            background: linear-gradient(135deg, #FF9800, #FFC107);
                            color: white;
                            padding: 10px 15px;
                            border-radius: 12px;
                            font-size: 14px;
                            font-weight: bold;
                            box-shadow: 0 6px 15px rgba(0,0,0,0.3);
                            text-align: center;
                        ">
                            🦘 <span id="jump-count">0</span> jumps
                        </div>
                    </div>
                    
                    <!-- Number line container -->
                    <div id="number-line-container" style="
                        position: absolute;
                        bottom: 150px;
                        left: 50px;
                        right: 50px;
                        height: 120px;
                        background: rgba(255,255,255,0.9);
                        border-radius: 15px;
                        border: 3px solid ${this.theme.primary};
                        box-shadow: 0 8px 20px rgba(0,0,0,0.2);
                    ">
                        <!-- Number line -->
                        <div id="number-line" style="
                            position: absolute;
                            bottom: 20px;
                            left: 20px;
                            right: 20px;
                            height: 80px;
                            display: flex;
                            align-items: flex-end;
                            justify-content: space-between;
                        "></div>
                        
                        <!-- Player character on number line -->
                        <div id="player-character" style="
                            position: absolute;
                            bottom: 100px;
                            width: 60px;
                            height: 60px;
                            background: radial-gradient(circle, ${this.theme.accent}, ${this.theme.primary});
                            border: 4px solid white;
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 24px;
                            box-shadow: 0 8px 20px rgba(0,0,0,0.3);
                            transition: all 0.3s ease;
                            z-index: 25;
                        ">🦘</div>
                    </div>
                    
                    <!-- Body tracking indicator -->
                    <div id="body-tracker" style="
                        position: absolute;
                        width: 60px;
                        height: 60px;
                        background: radial-gradient(circle, rgba(255,255,0,0.8), rgba(255,165,0,0.6));
                        border: 4px solid white;
                        border-radius: 50%;
                        display: none;
                        z-index: 30;
                        box-shadow: 0 0 25px rgba(255,215,0,0.7);
                    ">
                        <div id="jump-indicator" style="
                            position: absolute;
                            top: -40px;
                            left: 50%;
                            transform: translateX(-50%);
                            background: rgba(0,0,0,0.8);
                            color: white;
                            padding: 5px 10px;
                            border-radius: 15px;
                            font-size: 12px;
                            white-space: nowrap;
                            display: none;
                        ">Jump detected!</div>
                    </div>
                    
                    <!-- Particle effects container -->
                    <div id="particle-effects" style="
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        pointer-events: none;
                        z-index: 35;
                    "></div>
                    
                    <!-- Success feedback -->
                    <div id="success-feedback" style="
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        font-size: 56px;
                        font-weight: bold;
                        color: #4CAF50;
                        text-shadow: 3px 3px 6px rgba(0,0,0,0.3);
                        opacity: 0;
                        transition: all 0.6s ease;
                        z-index: 40;
                    "></div>
                </div>
                
                <!-- Game mode selection screen -->
                <div id="mode-selection" style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, rgba(0,0,0,0.9), rgba(20,20,60,0.9));
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    z-index: 70;
                    border-radius: 15px;
                ">
                    <div style="text-align: center; color: white; max-width: 700px;">
                        <div style="font-size: 5em; margin-bottom: 20px;">🦘🔢</div>
                        <h2 style="font-size: 3em; margin-bottom: 30px; background: linear-gradient(45deg, #FFD700, #FFA500); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                            Number Line Jump!
                        </h2>
                        
                        <div style="font-size: 1.3em; margin-bottom: 40px; line-height: 1.6;">
                            🌟 <strong>Jump Your Way to Math Success!</strong> 🌟<br>
                            Physical movement meets number learning!
                        </div>
                        
                        <!-- Game mode selection -->
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px;">
                            <button class="mode-button" data-mode="basic" style="
                                padding: 20px;
                                background: linear-gradient(135deg, #4CAF50, #8BC34A);
                                color: white;
                                border: none;
                                border-radius: 15px;
                                cursor: pointer;
                                font-size: 16px;
                                font-weight: bold;
                                transition: transform 0.3s ease;
                            ">
                                🎯 Basic Jump<br>
                                <small>Jump to target numbers</small>
                            </button>
                            
                            <button class="mode-button" data-mode="rhythm" style="
                                padding: 20px;
                                background: linear-gradient(135deg, #9C27B0, #E91E63);
                                color: white;
                                border: none;
                                border-radius: 15px;
                                cursor: pointer;
                                font-size: 16px;
                                font-weight: bold;
                                transition: transform 0.3s ease;
                            ">
                                🎵 Rhythm Jump<br>
                                <small>Jump to the beat!</small>
                            </button>
                            
                            <button class="mode-button" data-mode="sequence" style="
                                padding: 20px;
                                background: linear-gradient(135deg, #FF5722, #FF9800);
                                color: white;
                                border: none;
                                border-radius: 15px;
                                cursor: pointer;
                                font-size: 16px;
                                font-weight: bold;
                                transition: transform 0.3s ease;
                            ">
                                🔗 Sequence Jump<br>
                                <small>Follow the pattern!</small>
                            </button>
                            
                            <button class="mode-button" data-mode="story" style="
                                padding: 20px;
                                background: linear-gradient(135deg, #2196F3, #03A9F4);
                                color: white;
                                border: none;
                                border-radius: 15px;
                                cursor: pointer;
                                font-size: 16px;
                                font-weight: bold;
                                transition: transform 0.3s ease;
                            ">
                                📖 Story Jump<br>
                                <small>Adventure through numbers!</small>
                            </button>
                        </div>
                        
                        <!-- Difficulty selection -->
                        <div style="margin-bottom: 30px;">
                            <h3 style="color: #FFD700; margin-bottom: 15px;">Choose Difficulty:</h3>
                            <div style="display: flex; justify-content: center; gap: 15px; flex-wrap: wrap;">
                                <button class="difficulty-button" data-range="0,5" style="
                                    padding: 10px 15px;
                                    background: rgba(76, 175, 80, 0.3);
                                    color: white;
                                    border: 2px solid #4CAF50;
                                    border-radius: 20px;
                                    cursor: pointer;
                                    font-size: 14px;
                                ">🌱 Easy (0-5)</button>
                                
                                <button class="difficulty-button" data-range="0,10" style="
                                    padding: 10px 15px;
                                    background: rgba(255, 152, 0, 0.3);
                                    color: white;
                                    border: 2px solid #FF9800;
                                    border-radius: 20px;
                                    cursor: pointer;
                                    font-size: 14px;
                                ">⭐ Medium (0-10)</button>
                                
                                <button class="difficulty-button" data-range="0,20" style="
                                    padding: 10px 15px;
                                    background: rgba(244, 67, 54, 0.3);
                                    color: white;
                                    border: 2px solid #F44336;
                                    border-radius: 20px;
                                    cursor: pointer;
                                    font-size: 14px;
                                ">🔥 Hard (0-20)</button>
                            </div>
                        </div>
                        
                        <button id="start-jump-game" style="
                            padding: 20px 40px;
                            font-size: 1.8em;
                            background: linear-gradient(135deg, ${this.theme.primary}, ${this.theme.accent});
                            color: white;
                            border: none;
                            border-radius: 15px;
                            cursor: pointer;
                            box-shadow: 0 8px 20px rgba(0,0,0,0.3);
                            transform: translateY(0);
                            transition: all 0.3s ease;
                        " onmouseover="this.style.transform='translateY(-3px)'" onmouseout="this.style.transform='translateY(0)'">
                            🚀 Start Jumping!
                        </button>
                    </div>
                </div>
            </div>
            
            ${this.getJumpGameStyles()}
        `;
    }

    /**
     * Get enhanced CSS styles for jump game
     */
    getJumpGameStyles() {
        return `
            <style>
                @keyframes floatClouds {
                    0% { transform: translateX(-100px); }
                    100% { transform: translateX(calc(100vw + 100px)); }
                }
                
                @keyframes jumpAnimation {
                    0%, 100% { transform: translateY(0) scale(1); }
                    50% { transform: translateY(-30px) scale(1.1); }
                }
                
                @keyframes landAnimation {
                    0% { transform: translateY(-10px) scale(1.1); }
                    50% { transform: translateY(5px) scale(0.9); }
                    100% { transform: translateY(0) scale(1); }
                }
                
                @keyframes numberGlow {
                    0%, 100% { 
                        box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
                        transform: scale(1);
                    }
                    50% { 
                        box-shadow: 0 0 25px rgba(255, 215, 0, 0.8);
                        transform: scale(1.1);
                    }
                }
                
                @keyframes successPulse {
                    0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
                    50% { transform: translate(-50%, -50%) scale(1.5); opacity: 1; }
                    100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
                }
                
                @keyframes particleRise {
                    0% { 
                        transform: translateY(0) scale(1);
                        opacity: 1;
                    }
                    100% { 
                        transform: translateY(-100px) scale(0.5);
                        opacity: 0;
                    }
                }
                
                @keyframes rhythmPulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.2); }
                }
                
                .mode-button:hover {
                    transform: translateY(-5px) scale(1.05);
                    box-shadow: 0 10px 25px rgba(0,0,0,0.3);
                }
                
                .difficulty-button.selected {
                    background: rgba(255,255,255,0.4) !important;
                    border-color: #FFD700 !important;
                    transform: scale(1.1);
                }
                
                .number-position {
                    width: 50px;
                    height: 70px;
                    border-radius: 10px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: flex-end;
                    font-size: 20px;
                    font-weight: bold;
                    color: white;
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
                    border: 2px solid #333;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.3);
                    transition: all 0.3s ease;
                    position: relative;
                }
                
                .number-position.target {
                    animation: numberGlow 1s infinite;
                    border-color: #FFD700;
                }
                
                .number-position.current {
                    border-color: ${this.theme.accent};
                    box-shadow: 0 0 20px ${this.theme.accent};
                    transform: scale(1.1);
                }
                
                .number-position::before {
                    content: attr(data-number);
                    position: absolute;
                    bottom: 10px;
                    font-size: 18px;
                    font-weight: bold;
                }
                
                .number-position::after {
                    content: '';
                    position: absolute;
                    bottom: -10px;
                    width: 100%;
                    height: 10px;
                    background: linear-gradient(to bottom, transparent, rgba(0,0,0,0.2));
                    border-radius: 0 0 10px 10px;
                }
                
                .jumping #player-character {
                    animation: jumpAnimation 0.6s ease-out;
                }
                
                .landing #player-character {
                    animation: landAnimation 0.4s ease-out;
                }
                
                .success-feedback.show {
                    animation: successPulse 2s ease-out;
                }
                
                .particle {
                    position: absolute;
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    animation: particleRise 2s ease-out forwards;
                    pointer-events: none;
                }
                
                .rhythm-mode .number-position.beat {
                    animation: rhythmPulse 0.5s ease-in-out;
                }
                
                .cloud::before,
                .cloud::after {
                    content: '';
                    position: absolute;
                    background: white;
                    border-radius: 50%;
                }
                
                .cloud::before {
                    width: 50px;
                    height: 50px;
                    top: -25px;
                    left: 10px;
                }
                
                .cloud::after {
                    width: 60px;
                    height: 60px;
                    top: -35px;
                    right: 10px;
                }
                
                @media (prefers-reduced-motion: reduce) {
                    .number-position.target,
                    #player-character,
                    .particle {
                        animation: none !important;
                    }
                    
                    .cloud {
                        animation-duration: 40s !important;
                    }
                }
            </style>
        `;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Mode selection buttons
        const modeButtons = this.container.querySelectorAll('.mode-button');
        modeButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.gameState.gameMode = button.dataset.mode;
                this.updateModeSelection(button);
            });
        });
        
        // Difficulty selection buttons
        const difficultyButtons = this.container.querySelectorAll('.difficulty-button');
        difficultyButtons.forEach(button => {
            button.addEventListener('click', () => {
                const [min, max] = button.dataset.range.split(',').map(Number);
                this.gameState.numberLineRange = { min, max };
                this.updateDifficultySelection(button);
            });
        });
        
        // Start game button
        const startButton = this.container.querySelector('#start-jump-game');
        startButton.addEventListener('click', () => this.startJumpGame());
        
        // Set default selections
        this.updateModeSelection(this.container.querySelector('[data-mode="basic"]'));
        this.updateDifficultySelection(this.container.querySelector('[data-range="0,10"]'));
    }

    /**
     * Update mode selection UI
     */
    updateModeSelection(selectedButton) {
        const modeButtons = this.container.querySelectorAll('.mode-button');
        modeButtons.forEach(button => {
            button.style.transform = '';
            button.style.boxShadow = '';
        });
        
        selectedButton.style.transform = 'translateY(-5px) scale(1.05)';
        selectedButton.style.boxShadow = '0 10px 25px rgba(0,0,0,0.3)';
    }

    /**
     * Update difficulty selection UI
     */
    updateDifficultySelection(selectedButton) {
        const difficultyButtons = this.container.querySelectorAll('.difficulty-button');
        difficultyButtons.forEach(button => {
            button.classList.remove('selected');
        });
        
        selectedButton.classList.add('selected');
    }

    /**
     * Initialize the number line
     */
    initNumberLine() {
        this.createNumberLine();
        this.updatePlayerPosition();
    }

    /**
     * Create the visual number line
     */
    createNumberLine() {
        const numberLine = this.container.querySelector('#number-line');
        numberLine.innerHTML = '';
        
        const { min, max } = this.gameState.numberLineRange;
        const range = max - min;
        
        for (let i = min; i <= max; i++) {
            const position = document.createElement('div');
            position.className = 'number-position';
            position.dataset.number = i;
            position.textContent = i;
            
            // Color coding for better visual distinction
            if (i === 0) {
                position.style.background = 'linear-gradient(135deg, #607D8B, #455A64)';
            } else if (i % 5 === 0) {
                position.style.background = 'linear-gradient(135deg, #2196F3, #1976D2)';
            } else if (i % 2 === 0) {
                position.style.background = 'linear-gradient(135deg, #4CAF50, #388E3C)';
            } else {
                position.style.background = 'linear-gradient(135deg, #FF9800, #F57C00)';
            }
            
            numberLine.appendChild(position);
        }
    }

    /**
     * Start the jump game
     */
    async startJumpGame() {
        this.container.querySelector('#mode-selection').style.display = 'none';
        this.gameState.isPlaying = true;
        
        // Add game mode class for styling
        this.container.querySelector('.number-line-jump-game').classList.add(`${this.gameState.gameMode}-mode`);
        
        // Start enhanced motion detection with jump tracking
        this.motionDetector.startDetection(
            (handData) => this.handleBodyTracking(handData),
            (gesture) => this.handleJumpGesture(gesture)
        );
        
        // Start game loop
        this.gameLoop = setInterval(() => this.updateJumpGame(), 1000 / 30); // 30 FPS
        
        // Start background music based on mode
        this.startBackgroundMusic();
        
        // Load first question/target
        await this.nextJumpTarget();
        
        // Provide speech introduction
        this.speakInstruction(`Welcome to Number Line Jump! ${this.getModeDescription()}`);
    }

    /**
     * Get description for current game mode
     */
    getModeDescription() {
        const descriptions = {
            basic: 'Jump to the target number on the number line!',
            rhythm: 'Jump to the beat and hit the right numbers!',
            sequence: 'Follow the number sequence by jumping in order!',
            story: 'Help the character reach their destination by jumping to story numbers!'
        };
        
        return descriptions[this.gameState.gameMode] || descriptions.basic;
    }

    /**
     * Handle body tracking for jump detection
     */
    handleBodyTracking(handData) {
        if (!handData) return;
        
        const bodyTracker = this.container.querySelector('#body-tracker');
        
        // Show body tracking indicator
        bodyTracker.style.display = 'block';
        bodyTracker.style.left = `${handData.centerX - 30}px`;
        bodyTracker.style.top = `${handData.centerY - 30}px`;
        
        // Add to position history for jump detection
        this.positionHistory.push({
            x: handData.centerX,
            y: handData.centerY,
            timestamp: Date.now()
        });
        
        // Keep only recent history (last 1 second)
        this.positionHistory = this.positionHistory.filter(
            pos => Date.now() - pos.timestamp < 1000
        );
        
        // Update player position based on horizontal movement
        this.updatePlayerPositionFromMovement(handData.centerX);
        
        // Detect jumps from vertical movement
        this.detectJumps();
    }

    /**
     * Update player position on number line based on movement
     */
    updatePlayerPositionFromMovement(x) {
        const containerWidth = this.container.offsetWidth;
        const normalizedX = x / containerWidth;
        
        const { min, max } = this.gameState.numberLineRange;
        const range = max - min;
        
        // Map normalized position to number line
        const targetPosition = Math.round(min + (normalizedX * range));
        const clampedPosition = Math.max(min, Math.min(max, targetPosition));
        
        if (clampedPosition !== this.gameState.playerPosition) {
            this.gameState.playerPosition = clampedPosition;
            this.updatePlayerPosition();
        }
    }

    /**
     * Detect jump movements from vertical motion
     */
    detectJumps() {
        if (this.positionHistory.length < 5 || this.jumpCooldown > 0) return;
        
        const recent = this.positionHistory.slice(-5);
        let maxVerticalMovement = 0;
        
        // Calculate maximum vertical movement in recent history
        for (let i = 1; i < recent.length; i++) {
            const movement = Math.abs(recent[i].y - recent[i-1].y);
            maxVerticalMovement = Math.max(maxVerticalMovement, movement);
        }
        
        // Check for significant upward movement (jump)
        if (maxVerticalMovement > this.jumpThreshold && !this.gameState.isJumping) {
            this.detectJump();
        }
    }

    /**
     * Process detected jump
     */
    detectJump() {
        this.gameState.isJumping = true;
        this.gameState.jumpCount++;
        this.jumpCooldown = 30; // Prevent multiple jump detections
        
        // Update jump counter display
        this.container.querySelector('#jump-count').textContent = this.gameState.jumpCount;
        
        // Show jump indicator
        const jumpIndicator = this.container.querySelector('#jump-indicator');
        jumpIndicator.style.display = 'block';
        
        setTimeout(() => {
            jumpIndicator.style.display = 'none';
        }, 1000);
        
        // Add jumping animation
        this.container.querySelector('.number-line-jump-game').classList.add('jumping');
        
        // Create jump particles
        this.createJumpParticles();
        
        // Play jump sound
        this.playSound('jump');
        
        // Check if jump lands on target
        setTimeout(() => {
            this.checkJumpTarget();
            this.gameState.isJumping = false;
            
            // Add landing animation
            this.container.querySelector('.number-line-jump-game').classList.remove('jumping');
            this.container.querySelector('.number-line-jump-game').classList.add('landing');
            
            setTimeout(() => {
                this.container.querySelector('.number-line-jump-game').classList.remove('landing');
            }, 400);
            
        }, 300); // Jump duration
    }

    /**
     * Handle jump gestures
     */
    handleJumpGesture(gesture) {
        if (gesture.type === 'wave') {
            // Wave gesture can trigger special jumps
            this.detectJump();
        }
    }

    /**
     * Update player character position on number line
     */
    updatePlayerPosition() {
        const playerCharacter = this.container.querySelector('#player-character');
        const numberLine = this.container.querySelector('#number-line');
        const positions = numberLine.querySelectorAll('.number-position');
        
        // Remove current position highlighting
        positions.forEach(pos => pos.classList.remove('current'));
        
        // Find and highlight current position
        const { min } = this.gameState.numberLineRange;
        const currentIndex = this.gameState.playerPosition - min;
        
        if (positions[currentIndex]) {
            positions[currentIndex].classList.add('current');
            
            // Move player character
            const positionRect = positions[currentIndex].getBoundingClientRect();
            const containerRect = this.container.getBoundingClientRect();
            
            const relativeLeft = positionRect.left - containerRect.left - 30; // Center on position
            playerCharacter.style.left = `${relativeLeft}px`;
        }
    }

    /**
     * Check if current jump lands on target
     */
    checkJumpTarget() {
        const isCorrect = this.gameState.playerPosition === this.gameState.targetNumber;
        
        if (isCorrect) {
            this.handleCorrectJump();
        } else {
            this.handleIncorrectJump();
        }
    }

    /**
     * Handle correct jump
     */
    handleCorrectJump() {
        this.gameState.perfectJumps++;
        
        // Calculate points based on mode and accuracy
        let points = 50 * this.gameState.level;
        
        if (this.gameState.gameMode === 'rhythm') {
            points *= 1.5; // Bonus for rhythm mode
        }
        
        this.gameState.score += points;
        this.container.querySelector('#score-value').textContent = this.gameState.score;
        
        // Show success feedback
        this.showSuccessFeedback(`Perfect! +${points}`);
        
        // Create celebration particles
        this.createCelebrationParticles();
        
        // Play success sound
        this.playSound('success');
        
        // Speech feedback
        this.speakInstruction(`Excellent jump! You landed on ${this.gameState.targetNumber}!`);
        
        // Check for level progression
        if (this.gameState.perfectJumps % 5 === 0) {
            this.levelUp();
        }
        
        // Load next target
        setTimeout(() => this.nextJumpTarget(), 2000);
        
        if (this.onCorrectJump) {
            this.onCorrectJump(this.gameState.score);
        }
    }

    /**
     * Handle incorrect jump
     */
    handleIncorrectJump() {
        // Show gentle correction
        this.showSuccessFeedback(`Try ${this.gameState.targetNumber}!`);
        
        // Play gentle correction sound
        this.playSound('try_again');
        
        // Speech feedback
        this.speakInstruction(`Not quite! Try jumping to ${this.gameState.targetNumber}`);
        
        if (this.onWrongJump) {
            this.onWrongJump();
        }
    }

    /**
     * Generate next jump target based on game mode
     */
    async nextJumpTarget() {
        let target;
        
        switch (this.gameState.gameMode) {
            case 'basic':
                target = this.generateBasicTarget();
                break;
            case 'rhythm':
                target = this.generateRhythmTarget();
                break;
            case 'sequence':
                target = this.generateSequenceTarget();
                break;
            case 'story':
                target = this.generateStoryTarget();
                break;
            default:
                target = this.generateBasicTarget();
        }
        
        this.gameState.targetNumber = target.number;
        this.gameState.currentQuestion = target.question;
        
        // Update display
        this.container.querySelector('#target-display').textContent = target.number;
        this.container.querySelector('#question-display').textContent = target.question;
        
        // Highlight target on number line
        this.highlightTarget(target.number);
        
        // Reset timer for timed modes
        this.resetTimer();
        
        // Speak the new target
        this.speakInstruction(target.question);
    }

    /**
     * Generate basic target number
     */
    generateBasicTarget() {
        const { min, max } = this.gameState.numberLineRange;
        const number = Math.floor(Math.random() * (max - min + 1)) + min;
        
        const questions = [
            `Jump to ${number}!`,
            `Find ${number} on the number line!`,
            `Can you reach ${number}?`,
            `Hop to ${number}!`
        ];
        
        return {
            number,
            question: questions[Math.floor(Math.random() * questions.length)]
        };
    }

    /**
     * Generate rhythm-based target
     */
    generateRhythmTarget() {
        // Create rhythmic patterns
        if (this.rhythmPattern.length === 0) {
            this.generateRhythmPattern();
            this.rhythmIndex = 0;
        }
        
        const number = this.rhythmPattern[this.rhythmIndex];
        this.rhythmIndex = (this.rhythmIndex + 1) % this.rhythmPattern.length;
        
        return {
            number,
            question: `🎵 Jump to the beat: ${number}! 🎵`
        };
    }

    /**
     * Generate rhythm pattern
     */
    generateRhythmPattern() {
        const { min, max } = this.gameState.numberLineRange;
        const patternLength = 4;
        
        this.rhythmPattern = [];
        for (let i = 0; i < patternLength; i++) {
            this.rhythmPattern.push(Math.floor(Math.random() * (max - min + 1)) + min);
        }
    }

    /**
     * Generate sequence target
     */
    generateSequenceTarget() {
        // Create mathematical sequences (even, odd, multiples, etc.)
        const sequences = {
            even: (n) => n * 2,
            odd: (n) => n * 2 + 1,
            multiples: (n) => n * 3,
            fibonacci: [1, 1, 2, 3, 5, 8, 13],
            squares: [1, 4, 9, 16, 25]
        };
        
        const sequenceType = Object.keys(sequences)[Math.floor(Math.random() * Object.keys(sequences).length)];
        const { min, max } = this.gameState.numberLineRange;
        
        let number;
        if (Array.isArray(sequences[sequenceType])) {
            const validNumbers = sequences[sequenceType].filter(n => n >= min && n <= max);
            number = validNumbers[Math.floor(Math.random() * validNumbers.length)];
        } else {
            let n = 1;
            do {
                number = sequences[sequenceType](n);
                n++;
            } while (number < min || number > max);
        }
        
        return {
            number,
            question: `Follow the ${sequenceType} pattern: ${number}!`
        };
    }

    /**
     * Generate story-based target
     */
    generateStoryTarget() {
        const stories = [
            {
                setup: "The bunny needs to collect",
                number: () => Math.floor(Math.random() * 6) + 3,
                ending: "carrots!"
            },
            {
                setup: "Jump to house number",
                number: () => Math.floor(Math.random() * 8) + 1,
                ending: "to deliver mail!"
            },
            {
                setup: "The frog must catch",
                number: () => Math.floor(Math.random() * 5) + 2,
                ending: "flies for dinner!"
            }
        ];
        
        const story = stories[Math.floor(Math.random() * stories.length)];
        const number = story.number();
        
        return {
            number,
            question: `📖 ${story.setup} ${number} ${story.ending}`
        };
    }

    /**
     * Highlight target number on number line
     */
    highlightTarget(targetNumber) {
        const positions = this.container.querySelectorAll('.number-position');
        
        // Remove previous target highlighting
        positions.forEach(pos => pos.classList.remove('target'));
        
        // Highlight new target
        const { min } = this.gameState.numberLineRange;
        const targetIndex = targetNumber - min;
        
        if (positions[targetIndex]) {
            positions[targetIndex].classList.add('target');
        }
    }

    /**
     * Create jump particles
     */
    createJumpParticles() {
        const playerCharacter = this.container.querySelector('#player-character');
        const rect = playerCharacter.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();
        
        const centerX = rect.left - containerRect.left + rect.width / 2;
        const centerY = rect.top - containerRect.top + rect.height / 2;
        
        // Create multiple particles
        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            const angle = (i / 8) * Math.PI * 2;
            const distance = 30 + Math.random() * 20;
            const x = centerX + Math.cos(angle) * distance;
            const y = centerY + Math.sin(angle) * distance;
            
            particle.style.left = `${x}px`;
            particle.style.top = `${y}px`;
            particle.style.background = this.theme.accent;
            particle.style.animationDelay = `${Math.random() * 0.5}s`;
            
            this.container.querySelector('#particle-effects').appendChild(particle);
            
            setTimeout(() => particle.remove(), 2000);
        }
    }

    /**
     * Create celebration particles
     */
    createCelebrationParticles() {
        const colors = [this.theme.primary, this.theme.accent, '#FFD700', '#FF6B6B', '#4ECDC4'];
        
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            const x = Math.random() * this.container.offsetWidth;
            const y = this.container.offsetHeight - 100;
            
            particle.style.left = `${x}px`;
            particle.style.top = `${y}px`;
            particle.style.background = colors[Math.floor(Math.random() * colors.length)];
            particle.style.animationDelay = `${Math.random() * 1}s`;
            
            this.container.querySelector('#particle-effects').appendChild(particle);
            
            setTimeout(() => particle.remove(), 3000);
        }
    }

    /**
     * Show success feedback
     */
    showSuccessFeedback(message) {
        const feedback = this.container.querySelector('#success-feedback');
        feedback.textContent = message;
        feedback.classList.add('show');
        
        setTimeout(() => {
            feedback.classList.remove('show');
        }, 2000);
    }

    /**
     * Level up
     */
    levelUp() {
        this.gameState.level++;
        this.container.querySelector('#level-value').textContent = this.gameState.level;
        
        // Show level up feedback
        this.showSuccessFeedback(`🎉 Level ${this.gameState.level}! 🎉`);
        
        // Play level up sound
        this.playSound('level_up');
        
        // Speech feedback
        this.speakInstruction(`Congratulations! You reached level ${this.gameState.level}!`);
        
        // Increase difficulty slightly
        this.jumpThreshold = Math.max(30, this.jumpThreshold - 5);
        
        if (this.onLevelComplete) {
            this.onLevelComplete(this.gameState.level);
        }
    }

    /**
     * Reset timer for time-based challenges
     */
    resetTimer() {
        this.gameState.timeRemaining = this.gameState.timeLimit;
        this.updateTimerDisplay();
    }

    /**
     * Update timer display
     */
    updateTimerDisplay() {
        const seconds = Math.ceil(this.gameState.timeRemaining / 1000);
        this.container.querySelector('#time-value').textContent = seconds;
        
        // Change color based on remaining time
        const timerDisplay = this.container.querySelector('#timer-display');
        if (seconds <= 10) {
            timerDisplay.style.background = 'linear-gradient(135deg, #F44336, #D32F2F)';
        } else if (seconds <= 20) {
            timerDisplay.style.background = 'linear-gradient(135deg, #FF9800, #F57C00)';
        } else {
            timerDisplay.style.background = 'linear-gradient(135deg, #FF6B6B, #4ECDC4)';
        }
    }

    /**
     * Update jump game loop
     */
    updateJumpGame() {
        if (!this.gameState.isPlaying) return;
        
        this.frameCount++;
        
        // Update jump cooldown
        if (this.jumpCooldown > 0) {
            this.jumpCooldown--;
        }
        
        // Update timer for timed modes
        if (this.gameState.timeRemaining > 0) {
            this.gameState.timeRemaining -= 1000 / 30; // 30 FPS
            this.updateTimerDisplay();
        }
        
        // Handle rhythm mode beat indicators
        if (this.gameState.gameMode === 'rhythm' && this.frameCount % 30 === 0) {
            this.updateRhythmBeats();
        }
    }

    /**
     * Update rhythm beat indicators
     */
    updateRhythmBeats() {
        const positions = this.container.querySelectorAll('.number-position');
        
        // Clear previous beats
        positions.forEach(pos => pos.classList.remove('beat'));
        
        // Add beat to random positions for visual rhythm
        const beatCount = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < beatCount; i++) {
            const randomIndex = Math.floor(Math.random() * positions.length);
            positions[randomIndex].classList.add('beat');
        }
    }

    /**
     * Start background music based on mode
     */
    startBackgroundMusic() {
        // Implementation would depend on audio files or generated music
        // For now, just play ambient sounds
        if (this.gameState.gameMode === 'rhythm') {
            this.playRhythmTrack();
        }
    }

    /**
     * Play rhythm track
     */
    playRhythmTrack() {
        // Generate simple rhythm using Web Audio API
        if (!this.audioContext) return;
        
        const createBeat = (frequency, time) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequency, time);
            gainNode.gain.setValueAtTime(0.1, time);
            gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
            
            oscillator.start(time);
            oscillator.stop(time + 0.1);
        };
        
        // Create simple 4/4 beat
        const now = this.audioContext.currentTime;
        for (let i = 0; i < 8; i++) {
            createBeat(200, now + i * 0.5);
        }
        
        // Schedule next beat sequence
        setTimeout(() => {
            if (this.gameState.isPlaying && this.gameState.gameMode === 'rhythm') {
                this.playRhythmTrack();
            }
        }, 4000);
    }

    /**
     * Preload sound effects
     */
    preloadSounds() {
        if (!this.audioContext) return;
        
        this.sounds = {
            jump: this.createJumpSound(),
            success: this.createSuccessSound(),
            try_again: this.createTryAgainSound(),
            level_up: this.createLevelUpSound()
        };
    }

    /**
     * Create jump sound
     */
    createJumpSound() {
        return () => {
            if (!this.audioContext) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.2);
        };
    }

    /**
     * Create success sound
     */
    createSuccessSound() {
        return () => {
            if (!this.audioContext) return;
            
            const frequencies = [523, 659, 784]; // C, E, G
            
            frequencies.forEach((freq, i) => {
                setTimeout(() => {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(this.audioContext.destination);
                    
                    oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
                    
                    gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
                    
                    oscillator.start();
                    oscillator.stop(this.audioContext.currentTime + 0.3);
                }, i * 100);
            });
        };
    }

    /**
     * Create try again sound
     */
    createTryAgainSound() {
        return () => {
            if (!this.audioContext) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime);
            oscillator.frequency.setValueAtTime(250, this.audioContext.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.3);
        };
    }

    /**
     * Create level up sound
     */
    createLevelUpSound() {
        return () => {
            if (!this.audioContext) return;
            
            const frequencies = [523, 659, 784, 1047]; // C, E, G, C
            
            frequencies.forEach((freq, i) => {
                setTimeout(() => {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(this.audioContext.destination);
                    
                    oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
                    
                    gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);
                    
                    oscillator.start();
                    oscillator.stop(this.audioContext.currentTime + 0.4);
                }, i * 150);
            });
        };
    }

    /**
     * Play sound effect
     */
    playSound(soundName) {
        if (this.sounds[soundName]) {
            try {
                this.sounds[soundName]();
            } catch (error) {
                console.warn('Could not play sound:', error);
            }
        }
    }

    /**
     * Speak instruction using Web Speech API
     */
    speakInstruction(text) {
        if (!this.voiceEnabled || !this.speechSynthesis) return;
        
        // Cancel any ongoing speech
        this.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.8;
        utterance.pitch = 1.1;
        utterance.volume = 0.7;
        
        this.speechSynthesis.speak(utterance);
    }

    /**
     * Show error message
     */
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(244, 67, 54, 0.9);
            color: white;
            padding: 20px;
            border-radius: 10px;
            z-index: 1000;
            font-size: 16px;
            text-align: center;
        `;
        errorDiv.textContent = message;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            document.body.removeChild(errorDiv);
        }, 5000);
    }

    /**
     * Stop the jump game
     */
    stop() {
        this.gameState.isPlaying = false;
        
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }
        
        if (this.motionDetector) {
            this.motionDetector.stop();
        }
        
        if (this.speechSynthesis) {
            this.speechSynthesis.cancel();
        }
        
        if (this.audioContext) {
            this.audioContext.close();
        }
    }
}

// Export for use in other modules
window.EnhancedNumberLineJumpGame = EnhancedNumberLineJumpGame;
