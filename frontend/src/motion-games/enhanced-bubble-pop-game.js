/**
 * Enhanced Interactive Bubble Pop Game
 * Uses advanced hand tracking and gesture recognition for SEN students
 * Features multi-modal interaction: hand waves, finger counting, and physical movement
 */

class EnhancedBubblePopGame {
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
            distractors: [],
            bubbles: [],
            score: 0,
            isPlaying: false,
            gameComplete: false,
            level: 1,
            consecutiveCorrect: 0,
            magicBubbles: [], // Special bubbles that respond to finger count
            powerUps: []
        };
        
        // Enhanced game mechanics
        this.bubbleSpeed = 0.4; // Slower speed for better tracking
        this.bubbleSpawnRate = 90; // Spawn bubbles less frequently
        this.frameCount = 0;
        this.gameLoop = null;
        this.maxBubbles = 4; // Fewer bubbles for better interaction
        this.currentGesture = null;
        this.celebrationMode = false;
        this.encouragementMessages = [
            "Amazing! 🌟", "Fantastic! 🎉", "You're doing great! 💪", 
            "Brilliant! ✨", "Keep it up! 🚀", "Wonderful! 🎯"
        ];
        
        // Multi-sensory feedback
        this.audioContext = null;
        this.sounds = {};
        this.vibrationSupported = 'vibrate' in navigator;
        
        // Accessibility features
        this.highContrast = false;
        this.largeText = false;
        this.reducedMotion = false;
        
        // Callbacks
        this.onCorrectAnswer = null;
        this.onWrongAnswer = null;
        this.onGameComplete = null;
    }

    /**
     * Initialize the enhanced game
     */
    async init() {
        try {
            await this.initAudio();
            this.createGameContainer();
            
            // Setup enhanced webcam and hand tracking
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
            console.error('Failed to initialize Enhanced Bubble Pop game:', error);
            this.showError('Unable to access camera. Please ensure camera permissions are enabled.');
            return false;
        }
    }

    /**
     * Initialize Web Audio API for sound effects
     */
    async initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.warn('Audio context not available:', error);
        }
    }

    /**
     * Create sound effects
     */
    preloadSounds() {
        if (!this.audioContext) return;
        
        // Create different sound effects
        this.sounds = {
            pop: this.createPopSound(),
            correct: this.createCorrectSound(),
            wrong: this.createWrongSound(),
            magic: this.createMagicSound(),
            levelUp: this.createLevelUpSound()
        };
    }

    /**
     * Create the enhanced game container HTML
     */
    createGameContainer() {
        this.container.innerHTML = `
            <div class="enhanced-bubble-game" style="position: relative; width: 100%; height: 600px; overflow: hidden; border-radius: 15px; background: linear-gradient(135deg, ${this.theme.background}, ${this.theme.secondary});">
                <!-- Webcam feed (hidden) -->
                <video id="game-video" style="display: none;" autoplay muted></video>
                
                <!-- Game canvas -->
                <canvas id="game-canvas" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 10; border-radius: 15px;"></canvas>
                
                <!-- Interactive overlays -->
                <div id="game-overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 20; pointer-events: none;">
                    <!-- Question display with animation -->
                    <div id="question-display" style="
                        position: absolute;
                        top: 15px;
                        left: 15px;
                        right: 15px;
                        background: linear-gradient(135deg, rgba(255,255,255,0.95), rgba(240,248,255,0.95));
                        padding: 20px;
                        border-radius: 15px;
                        text-align: center;
                        font-size: 20px;
                        font-weight: bold;
                        color: #333;
                        box-shadow: 0 8px 20px rgba(0,0,0,0.2);
                        border: 3px solid ${this.theme.primary};
                        transform: translateY(-5px);
                        transition: all 0.3s ease;
                    ">
                        <div style="font-size: 24px; margin-bottom: 10px;">👋 Wave to pop bubbles! 🫧</div>
                        <div style="font-size: 18px; color: #666;">Use gestures: Wave ✋ | Count fingers 🖐️ | Point 👉</div>
                    </div>
                    
                    <!-- Enhanced score and level display -->
                    <div id="game-stats" style="
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
                            🏆 Score: <span id="score-value">0</span>
                        </div>
                        
                        <div id="level-display" style="
                            background: linear-gradient(135deg, ${this.theme.secondary}, ${this.theme.primary});
                            color: white;
                            padding: 10px 15px;
                            border-radius: 12px;
                            font-size: 16px;
                            font-weight: bold;
                            box-shadow: 0 6px 15px rgba(0,0,0,0.3);
                            text-align: center;
                        ">
                            ⚡ Level: <span id="level-value">1</span>
                        </div>
                    </div>
                    
                    <!-- Hand tracking indicator with gesture feedback -->
                    <div id="hand-indicator" style="
                        position: absolute;
                        width: 40px;
                        height: 40px;
                        background: radial-gradient(circle, ${this.theme.accent}, ${this.theme.primary});
                        border: 4px solid white;
                        border-radius: 50%;
                        display: none;
                        z-index: 30;
                        box-shadow: 0 0 20px rgba(0,0,0,0.4);
                        transition: all 0.2s ease;
                    ">
                        <div id="gesture-feedback" style="
                            position: absolute;
                            top: -30px;
                            left: 50%;
                            transform: translateX(-50%);
                            background: rgba(0,0,0,0.8);
                            color: white;
                            padding: 5px 10px;
                            border-radius: 15px;
                            font-size: 12px;
                            white-space: nowrap;
                            display: none;
                        "></div>
                    </div>
                    
                    <!-- Celebration effects -->
                    <div id="celebration-effects" style="
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        pointer-events: none;
                        z-index: 40;
                    "></div>
                    
                    <!-- Encouragement messages -->
                    <div id="encouragement" style="
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        font-size: 36px;
                        font-weight: bold;
                        color: ${this.theme.primary};
                        text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
                        opacity: 0;
                        transition: all 0.5s ease;
                        z-index: 50;
                    "></div>
                </div>
                
                <!-- Enhanced start screen -->
                <div id="start-screen" style="
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
                    z-index: 60;
                    border-radius: 15px;
                ">
                    <div style="text-align: center; color: white; max-width: 500px;">
                        <div style="font-size: 4em; margin-bottom: 20px;">${this.theme.character}</div>
                        <h2 style="font-size: 2.5em; margin-bottom: 20px; background: linear-gradient(45deg, #FFD700, #FFA500); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                            Interactive Bubble Pop!
                        </h2>
                        <div style="font-size: 1.3em; margin-bottom: 30px; line-height: 1.6;">
                            🌟 <strong>Multi-Sensory Learning!</strong> 🌟<br>
                            👋 <strong>Wave</strong> to pop bubbles<br>
                            🖐️ <strong>Show fingers</strong> for number answers<br>
                            👉 <strong>Point</strong> to select bubbles<br>
                            🎯 <strong>Move your body</strong> to play!
                        </div>
                        
                        <div style="display: flex; gap: 15px; justify-content: center; margin-bottom: 30px; flex-wrap: wrap;">
                            <button id="accessibility-toggle" style="
                                padding: 10px 15px;
                                font-size: 14px;
                                background: rgba(255,255,255,0.2);
                                color: white;
                                border: 2px solid white;
                                border-radius: 8px;
                                cursor: pointer;
                            ">♿ Accessibility</button>
                            
                            <button id="tutorial-button" style="
                                padding: 10px 15px;
                                font-size: 14px;
                                background: rgba(255,255,255,0.2);
                                color: white;
                                border: 2px solid white;
                                border-radius: 8px;
                                cursor: pointer;
                            ">📚 How to Play</button>
                            
                            <button id="fullscreen-button" style="
                                padding: 10px 15px;
                                font-size: 14px;
                                background: rgba(255,255,255,0.2);
                                color: white;
                                border: 2px solid white;
                                border-radius: 8px;
                                cursor: pointer;
                            ">🖥️ Fullscreen</button>
                        </div>
                        
                        <button id="start-button" style="
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
                            🚀 Start Adventure!
                        </button>
                    </div>
                </div>
            </div>
            
            ${this.getEnhancedStyles()}
        `;
    }

    /**
     * Get enhanced CSS styles with animations
     */
    getEnhancedStyles() {
        return `
            <style>
                @keyframes bubbleFloat {
                    0% { 
                        transform: translateY(100vh) translateX(0px) scale(0.8) rotate(0deg); 
                        opacity: 0.9; 
                    }
                    5% { opacity: 1; }
                    25% { 
                        transform: translateY(75vh) translateX(-30px) scale(0.9) rotate(90deg); 
                    }
                    50% { 
                        transform: translateY(50vh) translateX(30px) scale(1) rotate(180deg); 
                    }
                    75% { 
                        transform: translateY(25vh) translateX(-20px) scale(1.1) rotate(270deg); 
                    }
                    95% { opacity: 1; }
                    100% { 
                        transform: translateY(-10vh) translateX(0px) scale(1.2) rotate(360deg); 
                        opacity: 0; 
                    }
                }
                
                @keyframes bubblePop {
                    0% { transform: scale(1) rotate(0deg); }
                    25% { transform: scale(1.3) rotate(90deg); }
                    50% { transform: scale(1.6) rotate(180deg); }
                    75% { transform: scale(1.3) rotate(270deg); }
                    100% { transform: scale(0) rotate(360deg); opacity: 0; }
                }
                
                @keyframes magicBubble {
                    0%, 100% { 
                        transform: scale(1);
                        box-shadow: 0 0 20px ${this.theme.accent};
                    }
                    50% { 
                        transform: scale(1.1);
                        box-shadow: 0 0 30px ${this.theme.accent}, 0 0 50px ${this.theme.primary};
                    }
                }
                
                @keyframes celebration {
                    0% { transform: scale(0) rotate(0deg); opacity: 0; }
                    50% { transform: scale(1.5) rotate(180deg); opacity: 1; }
                    100% { transform: scale(0) rotate(360deg); opacity: 0; }
                }
                
                @keyframes encouragementPulse {
                    0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
                    50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
                    100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
                }
                
                .enhanced-bubble {
                    position: absolute;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    color: white;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.7);
                    box-shadow: 0 8px 25px rgba(0,0,0,0.3);
                    cursor: pointer;
                    animation: bubbleFloat 20s ease-in-out forwards;
                    transition: all 0.3s ease;
                    font-size: 18px;
                }
                
                .enhanced-bubble:hover {
                    transform: scale(1.1);
                }
                
                .enhanced-bubble.popping {
                    animation: bubblePop 0.6s ease-out forwards;
                }
                
                .enhanced-bubble.correct {
                    background: linear-gradient(135deg, ${this.theme.primary}, ${this.theme.accent});
                    border: 4px solid #FFD700;
                }
                
                .enhanced-bubble.incorrect {
                    background: linear-gradient(135deg, ${this.theme.secondary}, #999);
                    border: 4px solid #ccc;
                }
                
                .enhanced-bubble.magic {
                    background: linear-gradient(135deg, #FF6B6B, #4ECDC4, #45B7D1);
                    background-size: 200% 200%;
                    animation: magicBubble 2s ease-in-out infinite, bubbleFloat 20s ease-in-out forwards;
                    border: 4px solid #FFD700;
                    box-shadow: 0 0 30px rgba(255, 215, 0, 0.6);
                }
                
                .celebration-particle {
                    position: absolute;
                    width: 10px;
                    height: 10px;
                    background: ${this.theme.accent};
                    border-radius: 50%;
                    animation: celebration 1s ease-out forwards;
                }
                
                .hand-trail {
                    position: absolute;
                    width: 20px;
                    height: 20px;
                    background: radial-gradient(circle, ${this.theme.accent}80, transparent);
                    border-radius: 50%;
                    pointer-events: none;
                    animation: fadeOut 0.5s ease-out forwards;
                }
                
                @keyframes fadeOut {
                    0% { opacity: 1; transform: scale(1); }
                    100% { opacity: 0; transform: scale(2); }
                }
                
                .accessibility-mode .enhanced-bubble {
                    border-width: 6px;
                    font-size: 24px;
                    font-weight: 900;
                }
                
                .accessibility-mode .enhanced-bubble.correct {
                    border-color: #00FF00;
                    box-shadow: 0 0 20px #00FF00;
                }
                
                .accessibility-mode .enhanced-bubble.incorrect {
                    border-color: #FF0000;
                    box-shadow: 0 0 20px #FF0000;
                }
                
                @media (prefers-reduced-motion: reduce) {
                    .enhanced-bubble {
                        animation-duration: 25s;
                    }
                    
                    .enhanced-bubble.magic {
                        animation: bubbleFloat 25s ease-in-out forwards;
                    }
                }
            </style>
        `;
    }

    /**
     * Setup enhanced event listeners
     */
    setupEventListeners() {
        const startButton = this.container.querySelector('#start-button');
        const accessibilityToggle = this.container.querySelector('#accessibility-toggle');
        const tutorialButton = this.container.querySelector('#tutorial-button');
        const fullscreenButton = this.container.querySelector('#fullscreen-button');
        
        startButton.addEventListener('click', () => this.startGame());
        accessibilityToggle.addEventListener('click', () => this.toggleAccessibility());
        tutorialButton.addEventListener('click', () => this.showTutorial());
        
        if (fullscreenButton) {
            fullscreenButton.addEventListener('click', () => this.toggleFullscreen());
        }
        
        // Listen for fullscreen changes
        document.addEventListener('fullscreenchange', () => this.handleFullscreenChange());
        document.addEventListener('webkitfullscreenchange', () => this.handleFullscreenChange());
        document.addEventListener('mozfullscreenchange', () => this.handleFullscreenChange());
        document.addEventListener('msfullscreenchange', () => this.handleFullscreenChange());
        document.addEventListener('webkitfullscreenchange', () => this.handleFullscreenChange());
        document.addEventListener('mozfullscreenchange', () => this.handleFullscreenChange());
        document.addEventListener('MSFullscreenChange', () => this.handleFullscreenChange());
    }

    /**
     * Start the enhanced game
     */
    async startGame() {
        this.container.querySelector('#start-screen').style.display = 'none';
        this.gameState.isPlaying = true;
        
        // Show Pikachu assistant
        this.pikachuAssistant.showStart();
        
        // Start enhanced motion detection with gesture recognition
        this.motionDetector.startDetection(
            (handData) => this.handleHandTracking(handData),
            (gesture) => this.handleGesture(gesture)
        );
        
        // Start game loop
        this.gameLoop = setInterval(() => this.updateGame(), 1000 / 60); // 60 FPS
        
        // Show first question
        await this.nextQuestion();
        
        // Play start sound
        this.playSound('levelUp');
        
        // Provide haptic feedback if available
        this.hapticFeedback(200);
    }

    /**
     * Handle advanced hand tracking
     */
    handleHandTracking(handData) {
        const indicator = this.container.querySelector('#hand-indicator');
        const gestureDisplay = this.container.querySelector('#gesture-feedback');
        
        if (handData) {
            // Show hand position
            indicator.style.display = 'block';
            indicator.style.left = `${handData.centerX - 20}px`;
            indicator.style.top = `${handData.centerY - 20}px`;
            
            // Update indicator based on confidence
            const confidence = handData.confidence || 0;
            indicator.style.transform = `scale(${0.8 + confidence * 0.4})`;
            indicator.style.opacity = Math.max(0.6, confidence);
            
            // Show finger count if detected
            if (handData.fingerCount > 0) {
                gestureDisplay.textContent = `${handData.fingerCount} finger${handData.fingerCount > 1 ? 's' : ''}`;
                gestureDisplay.style.display = 'block';
            } else {
                gestureDisplay.style.display = 'none';
            }
            
            // Create hand trail effect
            this.createHandTrail(handData.centerX, handData.centerY);
            
            // Check for bubble collisions
            this.checkBubbleCollisions(handData);
        } else {
            indicator.style.display = 'none';
            gestureDisplay.style.display = 'none';
        }
    }

    /**
     * Handle gesture recognition
     */
    handleGesture(gesture) {
        this.currentGesture = gesture;
        const gestureDisplay = this.container.querySelector('#gesture-feedback');
        
        switch (gesture.type) {
            case 'wave':
                gestureDisplay.textContent = '👋 Wave detected!';
                gestureDisplay.style.background = 'rgba(76, 175, 80, 0.9)';
                this.handleWaveGesture(gesture);
                break;
                
            case 'swipe':
                gestureDisplay.textContent = `↗️ Swipe ${gesture.direction}!`;
                gestureDisplay.style.background = 'rgba(33, 150, 243, 0.9)';
                this.handleSwipeGesture(gesture);
                break;
                
            case 'fingerCount':
                gestureDisplay.textContent = `🖐️ ${gesture.count} fingers!`;
                gestureDisplay.style.background = 'rgba(156, 39, 176, 0.9)';
                this.handleFingerCountGesture(gesture);
                break;
        }
        
        gestureDisplay.style.display = 'block';
        
        // Hide gesture feedback after delay
        setTimeout(() => {
            gestureDisplay.style.display = 'none';
            gestureDisplay.style.background = 'rgba(0,0,0,0.8)';
        }, 2000);
    }

    /**
     * Handle wave gesture - pops nearby bubbles
     */
    handleWaveGesture(gesture) {
        const bubbles = this.container.querySelectorAll('.enhanced-bubble');
        const waveRadius = 100;
        
        bubbles.forEach(bubble => {
            const bubbleRect = bubble.getBoundingClientRect();
            const containerRect = this.container.getBoundingClientRect();
            
            const bubbleX = bubbleRect.left - containerRect.left + bubbleRect.width / 2;
            const bubbleY = bubbleRect.top - containerRect.top + bubbleRect.height / 2;
            
            const distance = Math.sqrt(
                Math.pow(bubbleX - gesture.position.x, 2) + 
                Math.pow(bubbleY - gesture.position.y, 2)
            );
            
            if (distance < waveRadius) {
                this.popBubble(bubble);
            }
        });
        
        // Create wave effect
        this.createWaveEffect(gesture.position.x, gesture.position.y);
    }

    /**
     * Handle finger count gesture - selects bubbles with matching numbers
     */
    handleFingerCountGesture(gesture) {
        const bubbles = this.container.querySelectorAll('.enhanced-bubble');
        
        bubbles.forEach(bubble => {
            const bubbleText = bubble.textContent.trim();
            const bubbleNumber = parseInt(bubbleText);
            
            if (!isNaN(bubbleNumber) && bubbleNumber === gesture.count) {
                setTimeout(() => this.popBubble(bubble), 500); // Delay for dramatic effect
            }
        });
    }

    /**
     * Handle swipe gesture - creates directional effects
     */
    handleSwipeGesture(gesture) {
        // Create swipe trail effect
        this.createSwipeTrail(gesture.startPosition, gesture.endPosition);
        
        // Special swipe interactions based on direction
        switch (gesture.direction) {
            case 'up':
                this.addBonusPoints(50);
                break;
            case 'down':
                this.slowDownBubbles();
                break;
            case 'left':
            case 'right':
                this.shuffleBubbles();
                break;
        }
    }

    /**
     * Create visual wave effect
     */
    createWaveEffect(x, y) {
        const effect = document.createElement('div');
        effect.style.position = 'absolute';
        effect.style.left = `${x - 50}px`;
        effect.style.top = `${y - 50}px`;
        effect.style.width = '100px';
        effect.style.height = '100px';
        effect.style.border = `3px solid ${this.theme.accent}`;
        effect.style.borderRadius = '50%';
        effect.style.animation = 'waveExpand 0.6s ease-out forwards';
        effect.style.pointerEvents = 'none';
        effect.style.zIndex = '35';
        
        this.container.querySelector('#celebration-effects').appendChild(effect);
        
        setTimeout(() => effect.remove(), 600);
    }

    /**
     * Create hand trail effect
     */
    createHandTrail(x, y) {
        const trail = document.createElement('div');
        trail.className = 'hand-trail';
        trail.style.left = `${x - 10}px`;
        trail.style.top = `${y - 10}px`;
        
        this.container.querySelector('#celebration-effects').appendChild(trail);
        
        setTimeout(() => trail.remove(), 500);
    }

    /**
     * Enhanced bubble collision detection
     */
    checkBubbleCollisions(handData) {
        const bubbles = this.container.querySelectorAll('.enhanced-bubble:not(.popping)');
        
        bubbles.forEach(bubble => {
            const bubbleRect = bubble.getBoundingClientRect();
            const containerRect = this.container.getBoundingClientRect();
            
            const relativeRect = {
                x: bubbleRect.left - containerRect.left,
                y: bubbleRect.top - containerRect.top,
                width: bubbleRect.width,
                height: bubbleRect.height
            };
            
            if (this.motionDetector.checkCollision(handData, relativeRect)) {
                this.popBubble(bubble);
            }
        });
    }

    /**
     * Enhanced bubble popping with effects
     */
    popBubble(bubble) {
        if (bubble.classList.contains('popping')) return;
        
        bubble.classList.add('popping');
        const isCorrect = bubble.classList.contains('correct');
        const isMagic = bubble.classList.contains('magic');
        
        // Create pop effect
        this.createPopEffect(bubble);
        
        // Play appropriate sound
        if (isMagic) {
            this.playSound('magic');
        } else if (isCorrect) {
            this.playSound('correct');
        } else {
            this.playSound('wrong');
        }
        
        // Haptic feedback
        this.hapticFeedback(isCorrect ? 100 : 200);
        
        // Handle scoring
        if (isCorrect) {
            this.handleCorrectAnswer();
        } else if (isMagic) {
            this.handleMagicBubble();
        } else {
            this.handleWrongAnswer();
        }
        
        // Remove bubble after animation
        setTimeout(() => {
            if (bubble.parentNode) {
                bubble.remove();
            }
        }, 600);
    }

    /**
     * Create enhanced pop effect with particles
     */
    createPopEffect(bubble) {
        const rect = bubble.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();
        
        const centerX = rect.left - containerRect.left + rect.width / 2;
        const centerY = rect.top - containerRect.top + rect.height / 2;
        
        // Create particle explosion
        for (let i = 0; i < 12; i++) {
            const particle = document.createElement('div');
            particle.className = 'celebration-particle';
            
            const angle = (i / 12) * Math.PI * 2;
            const distance = 50 + Math.random() * 30;
            const x = centerX + Math.cos(angle) * distance;
            const y = centerY + Math.sin(angle) * distance;
            
            particle.style.left = `${x}px`;
            particle.style.top = `${y}px`;
            particle.style.background = bubble.classList.contains('correct') ? this.theme.accent : this.theme.secondary;
            particle.style.animationDelay = `${Math.random() * 0.3}s`;
            
            this.container.querySelector('#celebration-effects').appendChild(particle);
            
            setTimeout(() => particle.remove(), 1000);
        }
    }

    /**
     * Show encouragement message
     */
    showEncouragement(message) {
        const encouragement = this.container.querySelector('#encouragement');
        encouragement.textContent = message;
        encouragement.style.animation = 'encouragementPulse 2s ease-out forwards';
        
        setTimeout(() => {
            encouragement.style.animation = 'none';
            encouragement.style.opacity = '0';
        }, 2000);
    }

    /**
     * Handle correct answer with enhanced feedback
     */
    handleCorrectAnswer() {
        this.gameState.score += (10 * this.gameState.level);
        this.gameState.consecutiveCorrect++;
        
        // Update score display
        this.container.querySelector('#score-value').textContent = this.gameState.score;
        
        // Show Pikachu saying "Right!"
        this.pikachuAssistant.showRight();
        
        // Show encouragement
        const message = this.encouragementMessages[Math.floor(Math.random() * this.encouragementMessages.length)];
        this.showEncouragement(message);
        
        // Level up after consecutive correct answers
        if (this.gameState.consecutiveCorrect >= 3) {
            this.levelUp();
        }
        
        // Trigger callback
        if (this.onCorrectAnswer) {
            this.onCorrectAnswer(this.gameState.score);
        }
        
        // Load next question
        setTimeout(() => this.nextQuestion(), 1500);
    }

    /**
     * Level up with celebration
     */
    levelUp() {
        this.gameState.level++;
        this.gameState.consecutiveCorrect = 0;
        
        // Update level display
        this.container.querySelector('#level-value').textContent = this.gameState.level;
        
        // Celebration mode
        this.celebrationMode = true;
        this.showEncouragement(`🎉 Level ${this.gameState.level}! 🎉`);
        
        // Play level up sound
        this.playSound('levelUp');
        
        // Increase difficulty
        this.bubbleSpeed += 0.2;
        this.maxBubbles = Math.min(8, this.maxBubbles + 1);
        
        setTimeout(() => {
            this.celebrationMode = false;
        }, 3000);
    }

    /**
     * Enhanced sound generation
     */
    createPopSound() {
        if (!this.audioContext) return null;
        
        return () => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.1);
        };
    }

    createCorrectSound() {
        if (!this.audioContext) return null;
        
        return () => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(523, this.audioContext.currentTime); // C5
            oscillator.frequency.setValueAtTime(659, this.audioContext.currentTime + 0.1); // E5
            oscillator.frequency.setValueAtTime(784, this.audioContext.currentTime + 0.2); // G5
            
            gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.3);
        };
    }

    createWrongSound() {
        if (!this.audioContext) return null;
        
        return () => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
            oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime + 0.2);
            
            gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.4);
        };
    }

    createMagicSound() {
        if (!this.audioContext) return null;
        
        return () => {
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(this.audioContext.destination);
                    
                    oscillator.frequency.setValueAtTime(400 + i * 200, this.audioContext.currentTime);
                    
                    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
                    
                    oscillator.start();
                    oscillator.stop(this.audioContext.currentTime + 0.2);
                }, i * 50);
            }
        };
    }

    createLevelUpSound() {
        if (!this.audioContext) return null;
        
        return () => {
            const frequencies = [523, 659, 784, 1047]; // C5, E5, G5, C6
            
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
     * Haptic feedback for mobile devices
     */
    hapticFeedback(duration = 100) {
        if (this.vibrationSupported) {
            navigator.vibrate(duration);
        }
    }

    /**
     * Toggle accessibility features
     */
    toggleAccessibility() {
        this.highContrast = !this.highContrast;
        const gameContainer = this.container.querySelector('.enhanced-bubble-game');
        
        if (this.highContrast) {
            gameContainer.classList.add('accessibility-mode');
        } else {
            gameContainer.classList.remove('accessibility-mode');
        }
    }

    /**
     * Show tutorial overlay
     */
    showTutorial() {
        // Implementation for tutorial - could be a modal with step-by-step instructions
        alert('Tutorial: Wave your hand to pop bubbles! Show fingers to select numbers. Use gestures for special effects!');
    }

    /**
     * Enhanced game update loop
     */
    updateGame() {
        if (!this.gameState.isPlaying) return;
        
        this.frameCount++;
        
        // Spawn new bubbles based on level
        if (this.frameCount % Math.max(30, this.bubbleSpawnRate - this.gameState.level * 5) === 0) {
            this.spawnBubble();
        }
        
        // Occasionally spawn magic bubbles
        if (this.frameCount % 600 === 0 && Math.random() < 0.3) {
            this.spawnMagicBubble();
        }
        
        // Clean up old bubbles
        this.cleanupBubbles();
    }

    /**
     * Spawn enhanced bubble with random math problem
     */
    spawnBubble() {
        const existingBubbles = this.container.querySelectorAll('.enhanced-bubble:not(.popping)');
        if (existingBubbles.length >= this.maxBubbles) return;
        
        const bubble = document.createElement('div');
        bubble.className = 'enhanced-bubble';
        
        // Determine if this should be the correct answer
        const isCorrect = Math.random() < 0.4; // 40% chance for correct answer
        
        if (isCorrect && this.gameState.correctAnswer) {
            bubble.textContent = this.gameState.correctAnswer;
            bubble.classList.add('correct');
        } else {
            // Generate distractor
            const distractor = this.generateDistractor();
            bubble.textContent = distractor;
            bubble.classList.add('incorrect');
        }
        
        // Random size and position - start from bottom
        const size = 70 + Math.random() * 50; // Larger bubbles for better interaction
        const containerWidth = this.container.offsetWidth;
        const xPosition = size + Math.random() * (containerWidth - 2 * size); // Keep bubbles within bounds
        
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        bubble.style.left = `${xPosition}px`;
        bubble.style.bottom = `-${size}px`; // Start from bottom
        bubble.style.fontSize = `${Math.max(16, size / 4)}px`;
        
        // Add to game
        this.container.querySelector('#game-overlay').appendChild(bubble);
    }

    /**
     * Spawn special magic bubble
     */
    spawnMagicBubble() {
        const bubble = document.createElement('div');
        bubble.className = 'enhanced-bubble magic';
        bubble.textContent = '✨';
        
        const size = 80;
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        bubble.style.left = `${Math.random() * (this.container.offsetWidth - size)}px`;
        bubble.style.fontSize = '24px';
        
        this.container.querySelector('#game-overlay').appendChild(bubble);
    }

    /**
     * Generate random distractor answer
     */
    generateDistractor() {
        if (!this.gameState.correctAnswer) return Math.floor(Math.random() * 10);
        
        const correct = parseInt(this.gameState.correctAnswer);
        const variance = Math.floor(Math.random() * 6) - 3; // -3 to +3
        return Math.max(0, correct + variance);
    }

    /**
     * Load next question
     */
    async nextQuestion() {
        // This would typically load from your question API
        // For now, generate a simple math problem
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
        
        this.gameState.currentQuestion = question;
        this.gameState.correctAnswer = answer.toString();
        
        // Update question display
        const questionDisplay = this.container.querySelector('#question-display');
        questionDisplay.innerHTML = `
            <div style="font-size: 28px; margin-bottom: 10px;">${question}</div>
            <div style="font-size: 16px; color: #666;">Wave at the correct bubble! 👋</div>
        `;
    }

    /**
     * Clean up bubbles that have floated off screen
     */
    cleanupBubbles() {
        const bubbles = this.container.querySelectorAll('.enhanced-bubble');
        bubbles.forEach(bubble => {
            const rect = bubble.getBoundingClientRect();
            if (rect.bottom < 0) { // Bubble has floated off the top
                bubble.remove();
            }
        });
    }

    /**
     * Stop the game and cleanup
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
        
        // Cleanup Pikachu assistant
        if (this.pikachuAssistant) {
            this.pikachuAssistant.destroy();
        }
        
        // Close audio context
        if (this.audioContext) {
            this.audioContext.close();
        }
    }

    /**
     * Handle magic bubble interaction
     */
    handleMagicBubble() {
        // Magic bubbles give bonus points and special effects
        this.gameState.score += 100;
        this.container.querySelector('#score-value').textContent = this.gameState.score;
        
        this.showEncouragement('✨ Magic Bonus! ✨');
        
        // Special magic effect - slow down all bubbles temporarily
        const bubbles = this.container.querySelectorAll('.enhanced-bubble');
        bubbles.forEach(bubble => {
            bubble.style.animationDuration = '25s';
        });
        
        setTimeout(() => {
            const bubbles = this.container.querySelectorAll('.enhanced-bubble');
            bubbles.forEach(bubble => {
                bubble.style.animationDuration = '15s';
            });
        }, 5000);
    }

    /**
     * Add bonus points with visual feedback
     */
    addBonusPoints(points) {
        this.gameState.score += points;
        this.container.querySelector('#score-value').textContent = this.gameState.score;
        this.showEncouragement(`+${points} Bonus!`);
    }

    /**
     * Temporarily slow down bubbles
     */
    slowDownBubbles() {
        const bubbles = this.container.querySelectorAll('.enhanced-bubble');
        bubbles.forEach(bubble => {
            bubble.style.animationDuration = '20s';
        });
        
        setTimeout(() => {
            const bubbles = this.container.querySelectorAll('.enhanced-bubble');
            bubbles.forEach(bubble => {
                bubble.style.animationDuration = '15s';
            });
        }, 3000);
    }

    /**
     * Shuffle bubble positions
     */
    shuffleBubbles() {
        const bubbles = this.container.querySelectorAll('.enhanced-bubble');
        bubbles.forEach(bubble => {
            const newLeft = Math.random() * (this.container.offsetWidth - 80);
            bubble.style.left = `${newLeft}px`;
        });
    }

    /**
     * Handle wrong answer
     */
    handleWrongAnswer() {
        this.gameState.consecutiveCorrect = 0;
        
        if (this.onWrongAnswer) {
            this.onWrongAnswer();
        }
        
        this.showEncouragement('Try again! 💪');
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
     * Create swipe trail effect
     */
    createSwipeTrail(start, end) {
        const trail = document.createElement('div');
        trail.style.position = 'absolute';
        trail.style.left = `${start.x}px`;
        trail.style.top = `${start.y}px`;
        trail.style.width = '4px';
        trail.style.height = `${Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2))}px`;
        trail.style.background = `linear-gradient(to bottom, ${this.theme.accent}, transparent)`;
        trail.style.transform = `rotate(${Math.atan2(end.y - start.y, end.x - start.x) * 180 / Math.PI + 90}deg)`;
        trail.style.transformOrigin = 'top center';
        trail.style.opacity = '0.8';
        trail.style.animation = 'fadeOut 1s ease-out forwards';
        trail.style.pointerEvents = 'none';
        trail.style.zIndex = '35';
        
        this.container.querySelector('#celebration-effects').appendChild(trail);
        
        setTimeout(() => trail.remove(), 1000);
    }

    /**
     * Toggle fullscreen mode
     */
    toggleFullscreen() {
        if (!document.fullscreenElement && !document.webkitFullscreenElement && 
            !document.mozFullScreenElement && !document.msFullscreenElement) {
            // Enter fullscreen
            this.enterFullscreen();
        } else {
            // Exit fullscreen
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
        } else {
            // Fallback: open in new tab
            this.openInNewTab();
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

    /**
     * Open game in new tab (fallback for fullscreen)
     */
    openInNewTab() {
        const gameHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Enhanced Bubble Pop Game - Fullscreen</title>
            <style>
                body { 
                    margin: 0; 
                    padding: 0; 
                    background: #000; 
                    overflow: hidden;
                    font-family: 'Arial', sans-serif;
                }
                #game-container { 
                    width: 100vw; 
                    height: 100vh; 
                }
            </style>
        </head>
        <body>
            <div id="game-container"></div>
            <script src="https://docs.opencv.org/4.5.0/opencv.js"></script>
            <script>
                // Include all game scripts here
                // This would need to be populated with the actual game code
                alert('Game will open in fullscreen mode. Please ensure your browser supports this feature.');
            </script>
        </body>
        </html>
        `;
        
        const blob = new Blob([gameHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    }

    /**
     * Handle fullscreen change events
     */
    handleFullscreenChange() {
        const fullscreenButton = this.container.querySelector('#fullscreen-button');
        
        if (document.fullscreenElement || document.webkitFullscreenElement || 
            document.mozFullScreenElement || document.msFullscreenElement) {
            // In fullscreen
            if (fullscreenButton) {
                fullscreenButton.innerHTML = '🪟 Exit Fullscreen';
            }
            // Adjust game dimensions for fullscreen
            this.adjustForFullscreen(true);
        } else {
            // Exited fullscreen
            if (fullscreenButton) {
                fullscreenButton.innerHTML = '🖥️ Fullscreen';
            }
            // Restore normal dimensions
            this.adjustForFullscreen(false);
        }
    }

    /**
     * Adjust game layout for fullscreen
     */
    adjustForFullscreen(isFullscreen) {
        const gameContainer = this.container.querySelector('.enhanced-bubble-game');
        
        if (isFullscreen) {
            gameContainer.style.height = '100vh';
            gameContainer.style.width = '100vw';
            gameContainer.style.borderRadius = '0';
            
            // Adjust bubble spawn parameters for larger screen
            this.maxBubbles = 6;
            this.bubbleSpawnRate = 80;
        } else {
            gameContainer.style.height = '600px';
            gameContainer.style.width = '100%';
            gameContainer.style.borderRadius = '15px';
            
            // Restore normal parameters
            this.maxBubbles = 4;
            this.bubbleSpawnRate = 90;
        }
    }
}

// Export for use in other modules
window.EnhancedBubblePopGame = EnhancedBubblePopGame;
