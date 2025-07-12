/**
 * Side-to-Side Select Game Engine
 * Students select answers by holding their hand over zones for a brief moment
 */

class SideToSideGame {
    constructor(containerId, themeKeyword = 'default') {
        this.container = document.getElementById(containerId);
        this.themeManager = new ThemeManager();
        this.motionDetector = new MotionDetector();
        this.theme = this.themeManager.getThemedAsset(themeKeyword);
        this.themeKeyword = themeKeyword;
        
        this.gameState = {
            currentQuestion: null,
            answerOptions: [],
            correctAnswer: '',
            zones: [],
            score: 0,
            isPlaying: false,
            gameComplete: false,
            dwellTimer: null,
            dwellDuration: 2000, // 2 seconds
            currentZone: null
        };
        
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
            console.error('Failed to initialize Side-to-Side game:', error);
            this.showError('Unable to access camera. Please ensure camera permissions are enabled.');
            return false;
        }
    }

    /**
     * Create the game container HTML
     */
    createGameContainer() {
        this.container.innerHTML = `
            <div class="side-to-side-game" style="position: relative; width: 100%; height: 600px; overflow: hidden; border-radius: 15px; background: ${this.theme.background};">
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
                        Hold your hand over your choice for 2 seconds!
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
                    
                    <!-- Answer zones container -->
                    <div id="zones-container" style="
                        position: absolute;
                        bottom: 100px;
                        left: 20px;
                        right: 20px;
                        height: 250px;
                        display: flex;
                        justify-content: space-around;
                        align-items: center;
                        gap: 20px;
                    ">
                        <!-- Zones will be added dynamically -->
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
                    
                    <!-- Dwell timer -->
                    <div id="dwell-timer" style="
                        position: absolute;
                        width: 80px;
                        height: 80px;
                        border: 4px solid ${this.theme.accent};
                        border-radius: 50%;
                        background: rgba(255,255,255,0.9);
                        display: none;
                        z-index: 40;
                        align-items: center;
                        justify-content: center;
                        font-size: 1.5em;
                        font-weight: bold;
                        color: #333;
                    ">
                        <div id="timer-value">2</div>
                    </div>
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
                        <h2 style="font-size: 2.5em; margin-bottom: 20px;">${this.theme.character} Zone Select!</h2>
                        <p style="font-size: 1.2em; margin-bottom: 30px;">Hold your hand over an answer zone for 2 seconds to select it!</p>
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
                @keyframes dwellProgress {
                    0% { 
                        background: conic-gradient(${this.theme.accent} 0deg, rgba(255,255,255,0.3) 0deg);
                    }
                    100% { 
                        background: conic-gradient(${this.theme.accent} 360deg, rgba(255,255,255,0.3) 360deg);
                    }
                }
                
                @keyframes zoneSelect {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                    100% { transform: scale(1); }
                }
                
                @keyframes correctZone {
                    0% { transform: scale(1); box-shadow: 0 0 0 rgba(0,255,0,0.7); }
                    50% { transform: scale(1.2); box-shadow: 0 0 20px rgba(0,255,0,0.7); }
                    100% { transform: scale(1); box-shadow: 0 0 0 rgba(0,255,0,0.7); }
                }
                
                @keyframes incorrectZone {
                    0% { transform: scale(1); box-shadow: 0 0 0 rgba(255,0,0,0.7); }
                    25% { transform: translateX(-10px); box-shadow: 0 0 20px rgba(255,0,0,0.7); }
                    75% { transform: translateX(10px); }
                    100% { transform: scale(1); box-shadow: 0 0 0 rgba(255,0,0,0.7); }
                }
                
                .answer-zone {
                    flex: 1;
                    max-width: 300px;
                    height: 200px;
                    border-radius: 15px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    transition: all 0.3s ease;
                    cursor: pointer;
                    box-shadow: 0 8px 16px rgba(0,0,0,0.3);
                    border: 4px solid transparent;
                }
                
                .answer-zone.active {
                    border-color: ${this.theme.accent};
                    animation: zoneSelect 0.5s ease-in-out;
                }
                
                .answer-zone.correct {
                    animation: correctZone 1s ease-in-out;
                }
                
                .answer-zone.incorrect {
                    animation: incorrectZone 0.5s ease-in-out;
                }
                
                .zone-character {
                    font-size: 3em;
                    margin-bottom: 10px;
                }
                
                .zone-text {
                    font-size: 1.5em;
                    font-weight: bold;
                    color: white;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.7);
                    text-align: center;
                    padding: 0 10px;
                }
                
                .dwell-timer.active {
                    animation: dwellProgress 2s linear forwards;
                }
            </style>
        `;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        const startButton = this.container.querySelector('#start-button');
        startButton.addEventListener('click', () => this.startGame());
        
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
        
        const startScreen = this.container.querySelector('#start-screen');
        startScreen.style.display = 'none';
        
        this.playSound('start');
    }

    /**
     * Load a new question with multiple choice answers
     */
    loadQuestion(question, answerOptions, correctAnswer) {
        this.gameState.currentQuestion = question;
        this.gameState.answerOptions = answerOptions;
        this.gameState.correctAnswer = correctAnswer;
        
        // Update question display
        const questionDisplay = this.container.querySelector('#question-display');
        questionDisplay.innerHTML = `<strong>${question}</strong><br><small>Hold your hand over an answer for 2 seconds to select it!</small>`;
        
        // Create answer zones
        this.createAnswerZones();
    }

    /**
     * Create answer zones
     */
    createAnswerZones() {
        const zonesContainer = this.container.querySelector('#zones-container');
        zonesContainer.innerHTML = '';
        this.gameState.zones = [];
        
        const canvas = this.container.querySelector('#game-canvas');
        const containerRect = zonesContainer.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();
        
        this.gameState.answerOptions.forEach((option, index) => {
            const zone = document.createElement('div');
            zone.className = 'answer-zone';
            zone.style.background = this.theme.background;
            zone.innerHTML = `
                <div class="zone-character">${this.theme.character}</div>
                <div class="zone-text">${option}</div>
            `;
            
            zonesContainer.appendChild(zone);
            
            // Calculate zone position relative to canvas
            setTimeout(() => {
                const zoneRect = zone.getBoundingClientRect();
                const zoneCanvasRect = {
                    x: zoneRect.left - canvasRect.left,
                    y: zoneRect.top - canvasRect.top,
                    width: zoneRect.width,
                    height: zoneRect.height
                };
                
                this.gameState.zones.push({
                    element: zone,
                    rect: zoneCanvasRect,
                    answer: option,
                    isCorrect: option === this.gameState.correctAnswer
                });
            }, 100);
        });
    }

    /**
     * Handle motion detection
     */
    handleMotion(motionData) {
        if (!this.gameState.isPlaying) return;
        
        // Update motion indicator
        const indicator = this.container.querySelector('#motion-indicator');
        
        if (motionData) {
            indicator.style.display = 'block';
            indicator.style.left = `${motionData.centerX}px`;
            indicator.style.top = `${motionData.centerY}px`;
            
            // Check zone collisions
            this.checkZoneCollisions(motionData);
        } else {
            indicator.style.display = 'none';
            this.stopDwellTimer();
        }
    }

    /**
     * Check collisions between motion and zones
     */
    checkZoneCollisions(motionData) {
        let activeZone = null;
        
        for (const zone of this.gameState.zones) {
            if (this.motionDetector.checkCollision(motionData, zone.rect)) {
                activeZone = zone;
                break;
            }
        }
        
        if (activeZone && activeZone !== this.gameState.currentZone) {
            // New zone detected
            this.stopDwellTimer();
            this.startDwellTimer(activeZone);
        } else if (!activeZone && this.gameState.currentZone) {
            // No zone detected, stop timer
            this.stopDwellTimer();
        }
    }

    /**
     * Start dwell timer for zone selection
     */
    startDwellTimer(zone) {
        this.gameState.currentZone = zone;
        
        // Visual feedback
        zone.element.classList.add('active');
        
        // Show dwell timer
        const dwellTimer = this.container.querySelector('#dwell-timer');
        const timerValue = this.container.querySelector('#timer-value');
        
        dwellTimer.style.display = 'flex';
        dwellTimer.style.left = `${zone.rect.x + zone.rect.width / 2 - 40}px`;
        dwellTimer.style.top = `${zone.rect.y + zone.rect.height / 2 - 40}px`;
        
        let countdown = 2;
        timerValue.textContent = countdown;
        
        // Countdown timer
        const countdownInterval = setInterval(() => {
            countdown--;
            timerValue.textContent = countdown;
            
            if (countdown <= 0) {
                clearInterval(countdownInterval);
                this.selectZone(zone);
            }
        }, 1000);
        
        // Store timer reference
        this.gameState.dwellTimer = {
            interval: countdownInterval,
            zone: zone
        };
        
        // Start visual progress animation
        dwellTimer.classList.add('active');
    }

    /**
     * Stop dwell timer
     */
    stopDwellTimer() {
        if (this.gameState.dwellTimer) {
            clearInterval(this.gameState.dwellTimer.interval);
            
            // Remove visual feedback
            if (this.gameState.currentZone) {
                this.gameState.currentZone.element.classList.remove('active');
            }
            
            this.gameState.dwellTimer = null;
        }
        
        this.gameState.currentZone = null;
        
        // Hide dwell timer
        const dwellTimer = this.container.querySelector('#dwell-timer');
        dwellTimer.style.display = 'none';
        dwellTimer.classList.remove('active');
    }

    /**
     * Select a zone (answer)
     */
    selectZone(zone) {
        this.stopDwellTimer();
        
        if (zone.isCorrect) {
            this.handleCorrectAnswer(zone);
        } else {
            this.handleWrongAnswer(zone);
        }
    }

    /**
     * Handle correct answer
     */
    handleCorrectAnswer(zone) {
        this.gameState.score += 10;
        this.updateScore();
        
        // Visual feedback
        zone.element.classList.add('correct');
        setTimeout(() => zone.element.classList.remove('correct'), 1000);
        
        this.playSound('success');
        this.showFeedback('Correct! Well done! 🎉', 'success');
        
        if (this.onCorrectAnswer) {
            this.onCorrectAnswer();
        }
    }

    /**
     * Handle wrong answer
     */
    handleWrongAnswer(zone) {
        // Visual feedback
        zone.element.classList.add('incorrect');
        setTimeout(() => zone.element.classList.remove('incorrect'), 500);
        
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
        this.stopDwellTimer();
        this.motionDetector.stop();
    }

    /**
     * Get current score
     */
    getScore() {
        return this.gameState.score;
    }
}

// Export for use in other modules
window.SideToSideGame = SideToSideGame;
