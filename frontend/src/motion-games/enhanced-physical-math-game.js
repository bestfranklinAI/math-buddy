/**
 * Enhanced Physical Movement Math Game
 * Students use full-body movement to solve math problems
 * Features body tracking, exercise integration, and multi-sensory feedback
 */

class EnhancedPhysicalMathGame {
    constructor(containerId, themeKeyword = 'default') {
        this.container = document.getElementById(containerId);
        this.themeManager = new ThemeManager();
        this.motionDetector = new EnhancedMotionDetector();
        this.theme = this.themeManager.getThemedAsset(themeKeyword);
        this.themeKeyword = themeKeyword;
        
        // Initialize Pikachu Assistant
        this.pikachuAssistant = new PikachuAssistant(containerId);
        
        this.gameState = {
            currentQuestion: null,
            correctAnswer: '',
            playerPosition: 0.5, // Center of screen (0-1 range)
            targetZones: [],
            score: 0,
            level: 1,
            isPlaying: false,
            exerciseMode: 'jumping', // jumping, stretching, dancing
            energy: 100,
            movementCount: 0,
            gameType: 'numberLine' // numberLine, sorting, catching
        };
        
        // Game mechanics
        this.frameCount = 0;
        this.gameLoop = null;
        this.movementThreshold = 30;
        this.zoneWidth = 0.15; // Zone width as fraction of screen
        this.lastMovementTime = Date.now();
        this.exerciseTimer = 0;
        
        // Physical activity tracking
        this.movementHistory = [];
        this.exerciseGoals = {
            jumps: 0,
            stretches: 0,
            steps: 0
        };
        
        // Multi-sensory feedback
        this.audioContext = null;
        this.sounds = {};
        this.speechSynthesis = window.speechSynthesis;
        
        // Accessibility
        this.voiceEnabled = true;
        this.motionSensitivity = 'medium';
        
        // Callbacks
        this.onCorrectAnswer = null;
        this.onWrongAnswer = null;
        this.onExerciseComplete = null;
    }

    /**
     * Initialize the enhanced physical game
     */
    async init() {
        try {
            await this.initAudio();
            this.createGameContainer();
            
            // Setup enhanced webcam and body tracking
            const video = this.container.querySelector('#game-video');
            const canvas = this.container.querySelector('#game-canvas');
            
            const initialized = await this.motionDetector.initialize(video, canvas);
            if (!initialized) {
                throw new Error('Failed to initialize enhanced motion detection');
            }
            
            this.setupEventListeners();
            this.preloadSounds();
            return true;
        } catch (error) {
            console.error('Failed to initialize Enhanced Physical Math game:', error);
            this.showError('Unable to access camera. Please ensure camera permissions are enabled.');
            return false;
        }
    }

    /**
     * Initialize audio for speech and sound effects
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
            <div class="physical-math-game" style="position: relative; width: 100%; height: 600px; overflow: hidden; border-radius: 15px; background: linear-gradient(135deg, #87CEEB, #98FB98);">
                <!-- Webcam feed (hidden) -->
                <video id="game-video" style="display: none;" autoplay muted></video>
                
                <!-- Game canvas with body tracking -->
                <canvas id="game-canvas" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 10; border-radius: 15px;"></canvas>
                
                <!-- Game interface overlay -->
                <div id="game-overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 20; pointer-events: none;">
                    
                    <!-- Question and instruction display -->
                    <div id="question-section" style="
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
                            font-size: 28px;
                            font-weight: bold;
                            color: #333;
                            margin-bottom: 10px;
                        ">Get Ready to Move!</div>
                        
                        <div id="instruction-display" style="
                            font-size: 16px;
                            color: #666;
                            margin-bottom: 15px;
                        ">🏃‍♂️ Move your body to the correct answer! 🤸‍♀️</div>
                        
                        <div id="exercise-mode" style="
                            display: flex;
                            justify-content: center;
                            gap: 15px;
                            flex-wrap: wrap;
                        ">
                            <div style="background: ${this.theme.primary}; color: white; padding: 8px 12px; border-radius: 20px; font-size: 14px;">
                                <span id="current-exercise">🏃‍♂️ Moving</span>
                            </div>
                            <div style="background: ${this.theme.accent}; color: white; padding: 8px 12px; border-radius: 20px; font-size: 14px;">
                                ⚡ Energy: <span id="energy-display">100%</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Score and progress display -->
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
                        
                        <div id="movement-counter" style="
                            background: linear-gradient(135deg, #FF6B6B, #4ECDC4);
                            color: white;
                            padding: 10px 15px;
                            border-radius: 12px;
                            font-size: 14px;
                            font-weight: bold;
                            box-shadow: 0 6px 15px rgba(0,0,0,0.3);
                            text-align: center;
                        ">
                            🏃‍♂️ <span id="movement-count">0</span> moves
                        </div>
                    </div>
                    
                    <!-- Number line / target zones -->
                    <div id="target-zones" style="
                        position: absolute;
                        bottom: 80px;
                        left: 0;
                        right: 0;
                        height: 100px;
                        display: flex;
                        align-items: center;
                        justify-content: space-around;
                        padding: 0 20px;
                    "></div>
                    
                    <!-- Player avatar -->
                    <div id="player-avatar" style="
                        position: absolute;
                        bottom: 20px;
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
                        z-index: 30;
                    ">🏃‍♂️</div>
                    
                    <!-- Body tracking indicator -->
                    <div id="body-indicator" style="
                        position: absolute;
                        width: 50px;
                        height: 50px;
                        background: radial-gradient(circle, rgba(255,255,0,0.8), rgba(255,165,0,0.6));
                        border: 3px solid white;
                        border-radius: 50%;
                        display: none;
                        z-index: 25;
                        box-shadow: 0 0 20px rgba(255,215,0,0.6);
                        animation: pulse 1s infinite;
                    "></div>
                    
                    <!-- Exercise feedback -->
                    <div id="exercise-feedback" style="
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        font-size: 48px;
                        font-weight: bold;
                        color: ${this.theme.primary};
                        text-shadow: 3px 3px 6px rgba(0,0,0,0.3);
                        opacity: 0;
                        transition: all 0.5s ease;
                        z-index: 40;
                    "></div>
                    
                    <!-- Movement trail effects -->
                    <div id="movement-effects" style="
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        pointer-events: none;
                        z-index: 15;
                    "></div>
                </div>
                
                <!-- Game mode selection screen -->
                <div id="mode-selection" style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, rgba(0,0,0,0.9), rgba(20,20,40,0.9));
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    z-index: 70;
                    border-radius: 15px;
                ">
                    <div style="text-align: center; color: white; max-width: 600px;">
                        <div style="font-size: 4em; margin-bottom: 20px;">🏃‍♂️🧮</div>
                        <h2 style="font-size: 2.5em; margin-bottom: 30px; background: linear-gradient(45deg, #FFD700, #FFA500); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                            Physical Math Adventure!
                        </h2>
                        
                        <div style="font-size: 1.2em; margin-bottom: 40px; line-height: 1.6;">
                            🌟 <strong>Move Your Body to Learn Math!</strong> 🌟<br>
                            Get active while solving problems!
                        </div>
                        
                        <!-- Game mode selection -->
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px;">
                            <button class="mode-button" data-mode="numberLine" style="
                                padding: 20px;
                                background: linear-gradient(135deg, #FF6B6B, #4ECDC4);
                                color: white;
                                border: none;
                                border-radius: 15px;
                                cursor: pointer;
                                font-size: 16px;
                                font-weight: bold;
                                transition: transform 0.3s ease;
                            ">
                                🔢 Number Line Jump<br>
                                <small>Jump to the right number!</small>
                            </button>
                            
                            <button class="mode-button" data-mode="sorting" style="
                                padding: 20px;
                                background: linear-gradient(135deg, #A8E6CF, #3CB371);
                                color: white;
                                border: none;
                                border-radius: 15px;
                                cursor: pointer;
                                font-size: 16px;
                                font-weight: bold;
                                transition: transform 0.3s ease;
                            ">
                                📊 Sort & Move<br>
                                <small>Sort numbers by moving!</small>
                            </button>
                            
                            <button class="mode-button" data-mode="catching" style="
                                padding: 20px;
                                background: linear-gradient(135deg, #FFB6C1, #FF69B4);
                                color: white;
                                border: none;
                                border-radius: 15px;
                                cursor: pointer;
                                font-size: 16px;
                                font-weight: bold;
                                transition: transform 0.3s ease;
                            ">
                                🎯 Answer Catcher<br>
                                <small>Catch the right answers!</small>
                            </button>
                        </div>
                        
                        <!-- Exercise mode selection -->
                        <div style="margin-bottom: 30px;">
                            <h3 style="color: #FFD700; margin-bottom: 15px;">Choose Your Exercise Style:</h3>
                            <div style="display: flex; justify-content: center; gap: 15px; flex-wrap: wrap;">
                                <button class="exercise-button" data-exercise="jumping" style="
                                    padding: 10px 15px;
                                    background: rgba(255,255,255,0.2);
                                    color: white;
                                    border: 2px solid white;
                                    border-radius: 20px;
                                    cursor: pointer;
                                    font-size: 14px;
                                ">🏃‍♂️ Active Moving</button>
                                
                                <button class="exercise-button" data-exercise="stretching" style="
                                    padding: 10px 15px;
                                    background: rgba(255,255,255,0.2);
                                    color: white;
                                    border: 2px solid white;
                                    border-radius: 20px;
                                    cursor: pointer;
                                    font-size: 14px;
                                ">🧘‍♀️ Gentle Stretching</button>
                                
                                <button class="exercise-button" data-exercise="dancing" style="
                                    padding: 10px 15px;
                                    background: rgba(255,255,255,0.2);
                                    color: white;
                                    border: 2px solid white;
                                    border-radius: 20px;
                                    cursor: pointer;
                                    font-size: 14px;
                                ">💃 Fun Dancing</button>
                            </div>
                        </div>
                        
                        <button id="start-physical-game" style="
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
                            🚀 Start Moving & Learning!
                        </button>
                    </div>
                </div>
            </div>
            
            ${this.getPhysicalGameStyles()}
        `;
    }

    /**
     * Get enhanced CSS styles for physical game
     */
    getPhysicalGameStyles() {
        return `
            <style>
                @keyframes pulse {
                    0%, 100% { transform: scale(1); opacity: 0.8; }
                    50% { transform: scale(1.2); opacity: 1; }
                }
                
                @keyframes jump {
                    0%, 100% { transform: translateY(0) scale(1); }
                    50% { transform: translateY(-20px) scale(1.1); }
                }
                
                @keyframes stretch {
                    0%, 100% { transform: scaleY(1) scaleX(1); }
                    50% { transform: scaleY(0.8) scaleX(1.2); }
                }
                
                @keyframes dance {
                    0% { transform: rotate(0deg) scale(1); }
                    25% { transform: rotate(-10deg) scale(1.1); }
                    75% { transform: rotate(10deg) scale(1.1); }
                    100% { transform: rotate(0deg) scale(1); }
                }
                
                @keyframes zoneActivate {
                    0% { transform: scale(1); background: rgba(76, 175, 80, 0.3); }
                    50% { transform: scale(1.1); background: rgba(76, 175, 80, 0.6); }
                    100% { transform: scale(1); background: rgba(76, 175, 80, 0.3); }
                }
                
                @keyframes movementTrail {
                    0% { opacity: 0.8; transform: scale(1); }
                    100% { opacity: 0; transform: scale(3); }
                }
                
                @keyframes correctAnswer {
                    0% { transform: scale(1) rotate(0deg); }
                    25% { transform: scale(1.2) rotate(5deg); }
                    75% { transform: scale(1.2) rotate(-5deg); }
                    100% { transform: scale(1) rotate(0deg); }
                }
                
                .mode-button:hover {
                    transform: translateY(-5px) scale(1.05);
                    box-shadow: 0 10px 25px rgba(0,0,0,0.3);
                }
                
                .exercise-button.selected {
                    background: rgba(255,255,255,0.4) !important;
                    border-color: #FFD700 !important;
                }
                
                .target-zone {
                    width: 120px;
                    height: 80px;
                    border-radius: 15px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                    font-weight: bold;
                    color: white;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
                    border: 3px solid white;
                    box-shadow: 0 6px 15px rgba(0,0,0,0.3);
                    transition: all 0.3s ease;
                    position: relative;
                }
                
                .target-zone.correct {
                    background: linear-gradient(135deg, #4CAF50, #8BC34A);
                }
                
                .target-zone.incorrect {
                    background: linear-gradient(135deg, #9E9E9E, #757575);
                }
                
                .target-zone.active {
                    animation: zoneActivate 0.5s ease-in-out;
                    transform: scale(1.1);
                }
                
                .movement-trail {
                    position: absolute;
                    width: 30px;
                    height: 30px;
                    background: radial-gradient(circle, ${this.theme.accent}CC, transparent);
                    border-radius: 50%;
                    pointer-events: none;
                    animation: movementTrail 1s ease-out forwards;
                }
                
                .exercise-jumping #player-avatar {
                    animation: jump 1s infinite;
                }
                
                .exercise-stretching #player-avatar {
                    animation: stretch 2s infinite;
                }
                
                .exercise-dancing #player-avatar {
                    animation: dance 1.5s infinite;
                }
                
                .correct-feedback {
                    animation: correctAnswer 1s ease-out;
                }
                
                @media (prefers-reduced-motion: reduce) {
                    .target-zone.active,
                    #player-avatar,
                    #body-indicator {
                        animation: none !important;
                    }
                    
                    .movement-trail {
                        animation-duration: 2s;
                    }
                }
            </style>
        `;
    }

    /**
     * Setup event listeners for physical game
     */
    setupEventListeners() {
        // Mode selection buttons
        const modeButtons = this.container.querySelectorAll('.mode-button');
        modeButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.gameState.gameType = button.dataset.mode;
                this.updateModeSelection(button);
            });
        });
        
        // Exercise selection buttons
        const exerciseButtons = this.container.querySelectorAll('.exercise-button');
        exerciseButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.gameState.exerciseMode = button.dataset.exercise;
                this.updateExerciseSelection(button);
            });
        });
        
        // Start game button
        const startButton = this.container.querySelector('#start-physical-game');
        startButton.addEventListener('click', () => this.startPhysicalGame());
        
        // Set default selections
        this.updateModeSelection(this.container.querySelector('[data-mode="numberLine"]'));
        this.updateExerciseSelection(this.container.querySelector('[data-exercise="jumping"]'));
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
     * Update exercise selection UI
     */
    updateExerciseSelection(selectedButton) {
        const exerciseButtons = this.container.querySelectorAll('.exercise-button');
        exerciseButtons.forEach(button => {
            button.classList.remove('selected');
        });
        
        selectedButton.classList.add('selected');
    }

    /**
     * Start the physical math game
     */
    async startPhysicalGame() {
        this.container.querySelector('#mode-selection').style.display = 'none';
        this.gameState.isPlaying = true;
        
        // Update exercise mode display
        const exerciseMap = {
            jumping: '🏃‍♂️ Active Moving',
            stretching: '🧘‍♀️ Gentle Stretching',
            dancing: '💃 Fun Dancing'
        };
        
        this.container.querySelector('#current-exercise').textContent = exerciseMap[this.gameState.exerciseMode];
        this.container.querySelector('.physical-math-game').className += ` exercise-${this.gameState.exerciseMode}`;
        
        // Start enhanced motion detection with body tracking
        this.motionDetector.startDetection(
            (handData) => this.handleBodyTracking(handData),
            (gesture) => this.handlePhysicalGesture(gesture)
        );
        
        // Start game loop
        this.gameLoop = setInterval(() => this.updatePhysicalGame(), 1000 / 30); // 30 FPS
        
        // Load first question
        await this.nextPhysicalQuestion();
        
        // Provide speech feedback
        this.speakInstruction('Let\'s start moving and learning! Move your body to the correct answer!');
    }

    /**
     * Handle body tracking for physical movement
     */
    handleBodyTracking(handData) {
        if (!handData) return;
        
        const bodyIndicator = this.container.querySelector('#body-indicator');
        const playerAvatar = this.container.querySelector('#player-avatar');
        
        // Show body tracking indicator
        bodyIndicator.style.display = 'block';
        bodyIndicator.style.left = `${handData.centerX - 25}px`;
        bodyIndicator.style.top = `${handData.centerY - 25}px`;
        
        // Update player position based on horizontal movement
        const normalizedX = handData.centerX / this.container.offsetWidth;
        this.gameState.playerPosition = Math.max(0, Math.min(1, normalizedX));
        
        // Update player avatar position
        const avatarX = this.gameState.playerPosition * (this.container.offsetWidth - 60);
        playerAvatar.style.left = `${avatarX}px`;
        
        // Create movement trail
        this.createMovementTrail(handData.centerX, handData.centerY);
        
        // Track movement for exercise counting
        this.trackMovement(handData);
        
        // Check target zone collisions
        this.checkTargetZoneCollisions();
    }

    /**
     * Handle physical gestures for exercise interactions
     */
    handlePhysicalGesture(gesture) {
        switch (gesture.type) {
            case 'wave':
                this.handleExerciseMovement('wave', gesture.position);
                break;
            case 'fingerCount':
                this.handleFingerCountInteraction(gesture);
                break;
            case 'swipe':
                this.handleSwipeMovement(gesture);
                break;
        }
    }

    /**
     * Track physical movement for exercise goals
     */
    trackMovement(handData) {
        const now = Date.now();
        this.movementHistory.push({
            x: handData.centerX,
            y: handData.centerY,
            timestamp: now
        });
        
        // Keep only recent movement history (last 2 seconds)
        this.movementHistory = this.movementHistory.filter(
            entry => now - entry.timestamp < 2000
        );
        
        // Detect exercise movements
        if (this.movementHistory.length > 5) {
            this.detectExerciseMovements();
        }
    }

    /**
     * Detect specific exercise movements
     */
    detectExerciseMovements() {
        if (this.movementHistory.length < 5) return;
        
        const recent = this.movementHistory.slice(-5);
        
        switch (this.gameState.exerciseMode) {
            case 'jumping':
                this.detectJumping(recent);
                break;
            case 'stretching':
                this.detectStretching(recent);
                break;
            case 'dancing':
                this.detectDancing(recent);
                break;
        }
    }

    /**
     * Detect jumping movements (vertical motion)
     */
    detectJumping(movements) {
        let verticalMovement = 0;
        
        for (let i = 1; i < movements.length; i++) {
            verticalMovement += Math.abs(movements[i].y - movements[i-1].y);
        }
        
        if (verticalMovement > 100) { // Significant vertical movement
            this.recordExercise('jump');
        }
    }

    /**
     * Detect stretching movements (slow, extended motion)
     */
    detectStretching(movements) {
        const start = movements[0];
        const end = movements[movements.length - 1];
        const distance = Math.sqrt(
            Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
        );
        
        const duration = end.timestamp - start.timestamp;
        
        if (distance > 80 && duration > 1000) { // Slow, extended movement
            this.recordExercise('stretch');
        }
    }

    /**
     * Detect dancing movements (rhythmic, varied motion)
     */
    detectDancing(movements) {
        let directionChanges = 0;
        let lastDirection = null;
        
        for (let i = 1; i < movements.length; i++) {
            const dx = movements[i].x - movements[i-1].x;
            const dy = movements[i].y - movements[i-1].y;
            
            const direction = Math.atan2(dy, dx);
            
            if (lastDirection !== null && Math.abs(direction - lastDirection) > Math.PI / 4) {
                directionChanges++;
            }
            
            lastDirection = direction;
        }
        
        if (directionChanges >= 2) { // Varied movement pattern
            this.recordExercise('dance');
        }
    }

    /**
     * Record exercise movement and provide feedback
     */
    recordExercise(type) {
        const now = Date.now();
        if (now - this.lastMovementTime < 1000) return; // Prevent rapid firing
        
        this.lastMovementTime = now;
        this.gameState.movementCount++;
        
        // Update movement counter
        this.container.querySelector('#movement-count').textContent = this.gameState.movementCount;
        
        // Show exercise feedback
        const feedback = this.container.querySelector('#exercise-feedback');
        const feedbackText = {
            jump: '🏃‍♂️ Great Jump!',
            stretch: '🧘‍♀️ Nice Stretch!',
            dance: '💃 Awesome Dance!'
        };
        
        feedback.textContent = feedbackText[type] || '⚡ Great Move!';
        feedback.style.opacity = '1';
        
        setTimeout(() => {
            feedback.style.opacity = '0';
        }, 1500);
        
        // Award bonus points for exercise
        this.addExerciseBonus(5);
        
        // Energy boost
        this.gameState.energy = Math.min(100, this.gameState.energy + 2);
        this.updateEnergyDisplay();
    }

    /**
     * Create movement trail effect
     */
    createMovementTrail(x, y) {
        const trail = document.createElement('div');
        trail.className = 'movement-trail';
        trail.style.left = `${x - 15}px`;
        trail.style.top = `${y - 15}px`;
        
        this.container.querySelector('#movement-effects').appendChild(trail);
        
        setTimeout(() => trail.remove(), 1000);
    }

    /**
     * Check if player is in any target zone
     */
    checkTargetZoneCollisions() {
        const zones = this.container.querySelectorAll('.target-zone');
        const playerX = this.gameState.playerPosition;
        
        zones.forEach((zone, index) => {
            const zoneStart = index / zones.length;
            const zoneEnd = (index + 1) / zones.length;
            
            if (playerX >= zoneStart && playerX <= zoneEnd) {
                if (!zone.classList.contains('active')) {
                    zone.classList.add('active');
                    this.handleZoneEntry(zone, index);
                }
            } else {
                zone.classList.remove('active');
            }
        });
    }

    /**
     * Handle entering a target zone
     */
    handleZoneEntry(zone, zoneIndex) {
        const zoneValue = zone.textContent.trim();
        const isCorrect = zoneValue === this.gameState.correctAnswer;
        
        if (isCorrect) {
            setTimeout(() => {
                this.handleCorrectZone(zone);
            }, 1000); // Give player time to stay in zone
        }
    }

    /**
     * Handle correct zone selection
     */
    handleCorrectZone(zone) {
        // Check if player is still in the zone
        if (!zone.classList.contains('active')) return;
        
        zone.classList.add('correct-feedback');
        
        // Award points
        const points = 20 * this.gameState.level;
        this.gameState.score += points;
        this.container.querySelector('#score-value').textContent = this.gameState.score;
        
        // Show Pikachu saying "Right!"
        this.pikachuAssistant.showRight();
        
        // Show success feedback
        this.showSuccessFeedback(`Correct! +${points} points`);
        
        // Speech feedback
        this.speakInstruction(`Excellent! ${this.gameState.correctAnswer} is correct!`);
        
        // Load next question
        setTimeout(() => this.nextPhysicalQuestion(), 2000);
        
        if (this.onCorrectAnswer) {
            this.onCorrectAnswer(this.gameState.score);
        }
    }

    /**
     * Load next physical math question
     */
    async nextPhysicalQuestion() {
        // Generate math problem based on game type
        let question, answer, options;
        
        switch (this.gameState.gameType) {
            case 'numberLine':
                ({ question, answer, options } = this.generateNumberLineQuestion());
                break;
            case 'sorting':
                ({ question, answer, options } = this.generateSortingQuestion());
                break;
            case 'catching':
                ({ question, answer, options } = this.generateCatchingQuestion());
                break;
        }
        
        this.gameState.currentQuestion = question;
        this.gameState.correctAnswer = answer.toString();
        
        // Update question display
        this.container.querySelector('#question-display').textContent = question;
        
        // Create target zones
        this.createTargetZones(options);
        
        // Speak the question
        this.speakInstruction(question);
    }

    /**
     * Generate number line question
     */
    generateNumberLineQuestion() {
        const num1 = Math.floor(Math.random() * 10) + 1;
        const num2 = Math.floor(Math.random() * 10) + 1;
        const operation = Math.random() < 0.5 ? '+' : '-';
        
        let question, answer;
        if (operation === '+') {
            question = `${num1} + ${num2} = ?`;
            answer = num1 + num2;
        } else {
            question = `${num1 + num2} - ${num2} = ?`;
            answer = num1;
        }
        
        // Generate options including correct answer
        const options = [answer];
        while (options.length < 4) {
            const distractor = answer + (Math.floor(Math.random() * 6) - 3);
            if (distractor > 0 && !options.includes(distractor)) {
                options.push(distractor);
            }
        }
        
        // Shuffle options
        for (let i = options.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [options[i], options[j]] = [options[j], options[i]];
        }
        
        return { question, answer, options };
    }

    /**
     * Generate sorting question
     */
    generateSortingQuestion() {
        const numbers = [];
        for (let i = 0; i < 4; i++) {
            numbers.push(Math.floor(Math.random() * 20) + 1);
        }
        
        const sortedNumbers = [...numbers].sort((a, b) => a - b);
        const targetNumber = sortedNumbers[Math.floor(Math.random() * sortedNumbers.length)];
        
        const question = `Move to the ${this.getOrdinal(sortedNumbers.indexOf(targetNumber) + 1)} smallest number`;
        
        return {
            question,
            answer: targetNumber,
            options: numbers
        };
    }

    /**
     * Generate catching question
     */
    generateCatchingQuestion() {
        const category = Math.random() < 0.5 ? 'even' : 'odd';
        const numbers = [];
        
        // Generate mixed even and odd numbers
        for (let i = 0; i < 4; i++) {
            numbers.push(Math.floor(Math.random() * 20) + 1);
        }
        
        // Find the correct answer
        const correctNumbers = numbers.filter(num => 
            (category === 'even' && num % 2 === 0) || 
            (category === 'odd' && num % 2 === 1)
        );
        
        const answer = correctNumbers[Math.floor(Math.random() * correctNumbers.length)] || 
                      (category === 'even' ? 2 : 1);
        
        const question = `Move to an ${category} number`;
        
        return { question, answer, options: numbers };
    }

    /**
     * Create target zones for answers
     */
    createTargetZones(options) {
        const zonesContainer = this.container.querySelector('#target-zones');
        zonesContainer.innerHTML = '';
        
        options.forEach((option, index) => {
            const zone = document.createElement('div');
            zone.className = 'target-zone';
            zone.textContent = option;
            
            if (option.toString() === this.gameState.correctAnswer) {
                zone.classList.add('correct');
            } else {
                zone.classList.add('incorrect');
            }
            
            zonesContainer.appendChild(zone);
        });
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
     * Show success feedback
     */
    showSuccessFeedback(message) {
        const feedback = this.container.querySelector('#exercise-feedback');
        feedback.textContent = message;
        feedback.style.color = '#4CAF50';
        feedback.style.opacity = '1';
        
        setTimeout(() => {
            feedback.style.opacity = '0';
            feedback.style.color = this.theme.primary;
        }, 2000);
    }

    /**
     * Add exercise bonus points
     */
    addExerciseBonus(points) {
        this.gameState.score += points;
        this.container.querySelector('#score-value').textContent = this.gameState.score;
        
        // Show floating bonus text
        const bonus = document.createElement('div');
        bonus.textContent = `+${points}`;
        bonus.style.cssText = `
            position: absolute;
            top: 100px;
            right: 50px;
            color: #FFD700;
            font-size: 20px;
            font-weight: bold;
            animation: floatUp 2s ease-out forwards;
            pointer-events: none;
            z-index: 50;
        `;
        
        this.container.appendChild(bonus);
        
        setTimeout(() => bonus.remove(), 2000);
    }

    /**
     * Update energy display
     */
    updateEnergyDisplay() {
        const energyDisplay = this.container.querySelector('#energy-display');
        energyDisplay.textContent = `${this.gameState.energy}%`;
        
        // Change color based on energy level
        const energyElement = energyDisplay.parentElement;
        if (this.gameState.energy > 70) {
            energyElement.style.background = this.theme.accent;
        } else if (this.gameState.energy > 30) {
            energyElement.style.background = '#FFA500';
        } else {
            energyElement.style.background = '#FF6B6B';
        }
    }

    /**
     * Get ordinal number string
     */
    getOrdinal(num) {
        const suffixes = ['th', 'st', 'nd', 'rd'];
        const mod = num % 100;
        
        return num + (suffixes[(mod - 20) % 10] || suffixes[mod] || suffixes[0]);
    }

    /**
     * Handle exercise movement
     */
    handleExerciseMovement(type, position) {
        this.recordExercise(type);
    }

    /**
     * Handle finger count interaction
     */
    handleFingerCountInteraction(gesture) {
        // Use finger count as answer selection
        const zones = this.container.querySelectorAll('.target-zone');
        const fingerCount = gesture.count;
        
        zones.forEach(zone => {
            if (parseInt(zone.textContent) === fingerCount) {
                zone.classList.add('active');
                setTimeout(() => {
                    if (zone.classList.contains('active')) {
                        this.handleZoneEntry(zone, Array.from(zones).indexOf(zone));
                    }
                }, 500);
            }
        });
    }

    /**
     * Handle swipe movement
     */
    handleSwipeMovement(gesture) {
        // Swipe gestures can trigger special movements
        switch (gesture.direction) {
            case 'up':
                this.recordExercise('jump');
                break;
            case 'left':
            case 'right':
                this.recordExercise('dance');
                break;
            case 'down':
                this.recordExercise('stretch');
                break;
        }
    }

    /**
     * Update physical game loop
     */
    updatePhysicalGame() {
        if (!this.gameState.isPlaying) return;
        
        this.frameCount++;
        
        // Gradually decrease energy to encourage movement
        if (this.frameCount % 60 === 0) { // Every 2 seconds
            this.gameState.energy = Math.max(0, this.gameState.energy - 1);
            this.updateEnergyDisplay();
        }
        
        // Encourage movement if energy is low
        if (this.gameState.energy < 30 && this.frameCount % 180 === 0) {
            this.speakInstruction('Keep moving to maintain your energy!');
        }
    }

    /**
     * Preload sound effects
     */
    preloadSounds() {
        // Implementation similar to enhanced bubble game
        // Create appropriate sounds for physical activity
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
     * Stop the physical game
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

// Add floating animation CSS
const floatingCSS = `
<style>
@keyframes floatUp {
    0% { transform: translateY(0); opacity: 1; }
    100% { transform: translateY(-50px); opacity: 0; }
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', floatingCSS);

// Export for use in other modules
window.EnhancedPhysicalMathGame = EnhancedPhysicalMathGame;
