/**
 * Number Line Jump Game Engine
 * Students guide a character along a number line by moving left/right
 */

class NumberLineJumpGame {
    constructor(containerId, themeKeyword = 'default') {
        this.container = document.getElementById(containerId);
        this.themeManager = new ThemeManager();
        this.motionDetector = new MotionDetector();
        this.theme = this.themeManager.getThemedAsset(themeKeyword);
        this.themeKeyword = themeKeyword;
        
        this.gameState = {
            currentQuestion: null,
            startNumber: 0,
            correctAnswer: 0,
            characterPosition: 0,
            numberLineStart: 0,
            numberLineEnd: 20,
            score: 0,
            isPlaying: false,
            gameComplete: false,
            dwellTimer: null,
            dwellDuration: 1500, // 1.5 seconds
            selectedNumber: null
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
            console.error('Failed to initialize Number Line Jump game:', error);
            this.showError('Unable to access camera. Please ensure camera permissions are enabled.');
            return false;
        }
    }

    /**
     * Create the game container HTML
     */
    createGameContainer() {
        this.container.innerHTML = `
            <div class="number-line-game" style="position: relative; width: 100%; height: 600px; overflow: hidden; border-radius: 15px; background: ${this.theme.background};">
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
                        Move left and right to guide your character to the correct number!
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
                    
                    <!-- Character -->
                    <div id="game-character" style="
                        position: absolute;
                        width: 80px;
                        height: 80px;
                        background: radial-gradient(circle, ${this.theme.secondary}, ${this.theme.primary});
                        border: 4px solid ${this.theme.accent};
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 3em;
                        box-shadow: 0 6px 12px rgba(0,0,0,0.4);
                        transition: left 0.3s ease;
                        z-index: 25;
                    ">
                        ${this.theme.character}
                    </div>
                    
                    <!-- Number line container -->
                    <div id="number-line-container" style="
                        position: absolute;
                        bottom: 80px;
                        left: 50px;
                        right: 50px;
                        height: 100px;
                        background: rgba(255,255,255,0.9);
                        border-radius: 15px;
                        border: 3px solid ${this.theme.accent};
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        padding: 0 20px;
                        box-shadow: 0 6px 12px rgba(0,0,0,0.3);
                    ">
                        <!-- Number markers will be added dynamically -->
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
                        width: 60px;
                        height: 60px;
                        border: 3px solid ${this.theme.accent};
                        border-radius: 50%;
                        background: rgba(255,255,255,0.9);
                        display: none;
                        z-index: 40;
                        align-items: center;
                        justify-content: center;
                        font-size: 1.2em;
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
                        <h2 style="font-size: 2.5em; margin-bottom: 20px;">${this.theme.character} Number Line Jump!</h2>
                        <p style="font-size: 1.2em; margin-bottom: 30px;">Move left and right to guide your character to the correct number!</p>
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
                @keyframes characterBounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                
                @keyframes numberSelect {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.2); }
                    100% { transform: scale(1); }
                }
                
                @keyframes correctNumber {
                    0% { transform: scale(1); box-shadow: 0 0 0 rgba(0,255,0,0.7); }
                    50% { transform: scale(1.3); box-shadow: 0 0 20px rgba(0,255,0,0.7); }
                    100% { transform: scale(1); box-shadow: 0 0 0 rgba(0,255,0,0.7); }
                }
                
                @keyframes incorrectNumber {
                    0% { transform: scale(1); }
                    25% { transform: rotate(-5deg); }
                    75% { transform: rotate(5deg); }
                    100% { transform: scale(1) rotate(0deg); }
                }
                
                @keyframes dwellProgress {
                    0% { 
                        background: conic-gradient(${this.theme.accent} 0deg, rgba(255,255,255,0.3) 0deg);
                    }
                    100% { 
                        background: conic-gradient(${this.theme.accent} 360deg, rgba(255,255,255,0.3) 360deg);
                    }
                }
                
                .number-marker {
                    width: 50px;
                    height: 50px;
                    background: ${this.theme.primary};
                    border: 2px solid ${this.theme.secondary};
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 16px;
                    font-weight: bold;
                    color: white;
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.7);
                    cursor: pointer;
                    transition: all 0.3s ease;
                    position: relative;
                }
                
                .number-marker.active {
                    background: ${this.theme.accent};
                    transform: scale(1.1);
                    animation: numberSelect 0.5s ease-in-out;
                }
                
                .number-marker.correct {
                    animation: correctNumber 1s ease-in-out;
                }
                
                .number-marker.incorrect {
                    animation: incorrectNumber 0.5s ease-in-out;
                    background: #ff6b6b;
                }
                
                .game-character {
                    animation: characterBounce 2s infinite ease-in-out;
                }
                
                .dwell-timer.active {
                    animation: dwellProgress 1.5s linear forwards;
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
     * Load a new question
     */
    loadQuestion(question, startNumber, correctAnswer) {
        this.gameState.currentQuestion = question;
        this.gameState.startNumber = startNumber;
        this.gameState.correctAnswer = correctAnswer;
        this.gameState.characterPosition = startNumber;
        
        // Calculate number line range
        const range = Math.abs(correctAnswer - startNumber) + 5;
        this.gameState.numberLineStart = Math.max(0, Math.min(startNumber, correctAnswer) - 2);
        this.gameState.numberLineEnd = this.gameState.numberLineStart + range + 4;
        
        // Update question display
        const questionDisplay = this.container.querySelector('#question-display');
        questionDisplay.innerHTML = `<strong>${question}</strong><br><small>Move left and right to guide your ${this.theme.character} to the answer!</small>`;
        
        // Create number line
        this.createNumberLine();
        
        // Position character at starting number
        this.updateCharacterPosition();
    }

    /**
     * Create the number line
     */
    createNumberLine() {
        const container = this.container.querySelector('#number-line-container');
        container.innerHTML = '';
        
        for (let i = this.gameState.numberLineStart; i <= this.gameState.numberLineEnd; i++) {
            const marker = document.createElement('div');
            marker.className = 'number-marker';
            marker.textContent = i;
            marker.dataset.number = i;
            
            // Highlight starting position
            if (i === this.gameState.startNumber) {
                marker.style.background = this.theme.accent;
                marker.style.transform = 'scale(1.1)';
            }
            
            container.appendChild(marker);
        }
    }

    /**
     * Update character position based on motion
     */
    updateCharacterPosition() {
        const character = this.container.querySelector('#game-character');
        const container = this.container.querySelector('#number-line-container');
        const markers = container.querySelectorAll('.number-marker');
        
        // Find the marker for current position
        const currentMarker = Array.from(markers).find(marker => 
            parseInt(marker.dataset.number) === this.gameState.characterPosition
        );
        
        if (currentMarker) {
            const containerRect = container.getBoundingClientRect();
            const markerRect = currentMarker.getBoundingClientRect();
            
            const relativeLeft = markerRect.left - containerRect.left + (markerRect.width / 2) - 40;
            character.style.left = `${container.offsetLeft + relativeLeft}px`;
            character.style.bottom = `190px`; // Above the number line
        }
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
            
            // Map horizontal position to number line
            this.mapMotionToNumberLine(motionData);
            
            // Check if character is positioned over a number for selection
            this.checkNumberSelection();
        } else {
            indicator.style.display = 'none';
            this.stopDwellTimer();
        }
    }

    /**
     * Map motion to number line position
     */
    mapMotionToNumberLine(motionData) {
        const canvas = this.container.querySelector('#game-canvas');
        const normalizedX = motionData.centerX / canvas.clientWidth;
        
        // Map to number line range (with some padding)
        const paddedNormalizedX = Math.max(0.1, Math.min(0.9, normalizedX));
        const mappedPosition = this.gameState.numberLineStart + 
            (paddedNormalizedX - 0.1) / 0.8 * (this.gameState.numberLineEnd - this.gameState.numberLineStart);
        
        // Round to nearest integer
        const newPosition = Math.round(mappedPosition);
        
        // Constrain to valid range
        const constrainedPosition = Math.max(
            this.gameState.numberLineStart, 
            Math.min(this.gameState.numberLineEnd, newPosition)
        );
        
        if (constrainedPosition !== this.gameState.characterPosition) {
            this.gameState.characterPosition = constrainedPosition;
            this.updateCharacterPosition();
        }
    }

    /**
     * Check if character should select current number
     */
    checkNumberSelection() {
        const currentNumber = this.gameState.characterPosition;
        
        if (currentNumber !== this.gameState.selectedNumber) {
            this.stopDwellTimer();
            this.startDwellTimer(currentNumber);
        }
    }

    /**
     * Start dwell timer for number selection
     */
    startDwellTimer(number) {
        this.gameState.selectedNumber = number;
        
        // Visual feedback on number marker
        const markers = this.container.querySelectorAll('.number-marker');
        markers.forEach(marker => marker.classList.remove('active'));
        
        const currentMarker = Array.from(markers).find(marker => 
            parseInt(marker.dataset.number) === number
        );
        
        if (currentMarker) {
            currentMarker.classList.add('active');
            
            // Show dwell timer
            const dwellTimer = this.container.querySelector('#dwell-timer');
            const timerValue = this.container.querySelector('#timer-value');
            
            const markerRect = currentMarker.getBoundingClientRect();
            const containerRect = this.container.getBoundingClientRect();
            
            dwellTimer.style.display = 'flex';
            dwellTimer.style.left = `${markerRect.left - containerRect.left + markerRect.width / 2 - 30}px`;
            dwellTimer.style.top = `${markerRect.top - containerRect.top - 70}px`;
            
            let countdown = Math.ceil(this.gameState.dwellDuration / 1000);
            timerValue.textContent = countdown;
            
            // Countdown timer
            const countdownInterval = setInterval(() => {
                countdown--;
                timerValue.textContent = countdown;
            }, 1000);
            
            // Selection timer
            const selectionTimer = setTimeout(() => {
                clearInterval(countdownInterval);
                this.selectNumber(number);
            }, this.gameState.dwellDuration);
            
            // Store timer reference
            this.gameState.dwellTimer = {
                selectionTimer,
                countdownInterval,
                number
            };
            
            // Start visual progress animation
            dwellTimer.classList.add('active');
        }
    }

    /**
     * Stop dwell timer
     */
    stopDwellTimer() {
        if (this.gameState.dwellTimer) {
            clearTimeout(this.gameState.dwellTimer.selectionTimer);
            clearInterval(this.gameState.dwellTimer.countdownInterval);
            
            // Remove visual feedback
            const markers = this.container.querySelectorAll('.number-marker');
            markers.forEach(marker => marker.classList.remove('active'));
            
            this.gameState.dwellTimer = null;
        }
        
        this.gameState.selectedNumber = null;
        
        // Hide dwell timer
        const dwellTimer = this.container.querySelector('#dwell-timer');
        dwellTimer.style.display = 'none';
        dwellTimer.classList.remove('active');
    }

    /**
     * Select a number
     */
    selectNumber(number) {
        this.stopDwellTimer();
        
        if (number === this.gameState.correctAnswer) {
            this.handleCorrectAnswer(number);
        } else {
            this.handleWrongAnswer(number);
        }
    }

    /**
     * Handle correct answer
     */
    handleCorrectAnswer(number) {
        this.gameState.score += 10;
        this.updateScore();
        
        // Visual feedback
        const markers = this.container.querySelectorAll('.number-marker');
        const correctMarker = Array.from(markers).find(marker => 
            parseInt(marker.dataset.number) === number
        );
        
        if (correctMarker) {
            correctMarker.classList.add('correct');
            setTimeout(() => correctMarker.classList.remove('correct'), 1000);
        }
        
        this.playSound('success');
        this.showFeedback('Correct! Your character found the right number! 🎉', 'success');
        
        if (this.onCorrectAnswer) {
            this.onCorrectAnswer();
        }
    }

    /**
     * Handle wrong answer
     */
    handleWrongAnswer(number) {
        // Visual feedback
        const markers = this.container.querySelectorAll('.number-marker');
        const wrongMarker = Array.from(markers).find(marker => 
            parseInt(marker.dataset.number) === number
        );
        
        if (wrongMarker) {
            wrongMarker.classList.add('incorrect');
            setTimeout(() => wrongMarker.classList.remove('incorrect'), 500);
        }
        
        this.playSound('error');
        this.showFeedback(`Try again! Look for ${this.gameState.correctAnswer}! 💪`, 'error');
        
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
window.NumberLineJumpGame = NumberLineJumpGame;
