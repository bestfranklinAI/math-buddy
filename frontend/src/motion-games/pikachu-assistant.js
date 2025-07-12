/**
 * Pikachu Assistant - A friendly helper for all motion games
 * Shows encouragement and feedback during gameplay
 */

class PikachuAssistant {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.isShowing = false;
        this.currentMessage = '';
        this.messageTimeout = null;
        
        // Create the assistant element
        this.createAssistant();
        
        // Messages for different situations
        this.messages = {
            correct: ["Right! ⭐", "Great job! ✨", "Perfect! 🎉", "Amazing! 🌟"],
            wrong: ["Try again! 💪", "Almost there! 🤔", "Keep going! 🚀", "You can do it! 💫"],
            encouragement: ["You're awesome! 😊", "Keep it up! 🎯", "Fantastic! 🌈", "Well done! 🏆"],
            start: ["Let's play! 🎮", "Ready? Let's go! ⚡", "Time for math! 📚", "Here we go! 🎪"]
        };
    }

    createAssistant() {
        // Create the main assistant container
        this.assistantElement = document.createElement('div');
        this.assistantElement.className = 'pikachu-assistant';
        this.assistantElement.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 1000;
            pointer-events: none;
            transition: all 0.3s ease-in-out;
            transform: translateY(100px);
            opacity: 0;
        `;

        // Create Pikachu image
        this.pikachuImage = document.createElement('img');
        this.pikachuImage.src = 'pikachu.jpg'; // Relative path - should work from most locations
        this.pikachuImage.alt = 'Pikachu Assistant';
        this.pikachuImage.style.cssText = `
            width: 80px;
            height: 80px;
            border-radius: 50%;
            border: 3px solid #FFD700;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            animation: pikachuBounce 2s ease-in-out infinite;
        `;

        // Create speech bubble
        this.speechBubble = document.createElement('div');
        this.speechBubble.className = 'speech-bubble';
        this.speechBubble.style.cssText = `
            position: absolute;
            bottom: 90px;
            right: 0;
            background: white;
            color: #333;
            padding: 12px 16px;
            border-radius: 20px;
            border: 2px solid #FFD700;
            font-size: 16px;
            font-weight: bold;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            max-width: 120px;
            text-align: center;
            opacity: 0;
            transform: scale(0.8);
            transition: all 0.3s ease-in-out;
        `;

        // Add speech bubble tail
        const bubbleTail = document.createElement('div');
        bubbleTail.style.cssText = `
            position: absolute;
            bottom: -10px;
            right: 20px;
            width: 0;
            height: 0;
            border-left: 10px solid transparent;
            border-right: 10px solid transparent;
            border-top: 10px solid #FFD700;
        `;

        const bubbleTailInner = document.createElement('div');
        bubbleTailInner.style.cssText = `
            position: absolute;
            bottom: 2px;
            right: -8px;
            width: 0;
            height: 0;
            border-left: 8px solid transparent;
            border-right: 8px solid transparent;
            border-top: 8px solid white;
        `;

        bubbleTail.appendChild(bubbleTailInner);
        this.speechBubble.appendChild(bubbleTail);

        // Assemble the assistant
        this.assistantElement.appendChild(this.speechBubble);
        this.assistantElement.appendChild(this.pikachuImage);

        // Add CSS animations
        this.addStyles();

        // Add to the container (or body if container not found)
        const targetContainer = this.container || document.body;
        targetContainer.appendChild(this.assistantElement);
    }

    addStyles() {
        // Add CSS animations if not already added
        if (!document.getElementById('pikachu-assistant-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'pikachu-assistant-styles';
            styleSheet.textContent = `
                @keyframes pikachuBounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }

                @keyframes speechBubblePopIn {
                    0% { 
                        opacity: 0; 
                        transform: scale(0.5) translateY(10px); 
                    }
                    100% { 
                        opacity: 1; 
                        transform: scale(1) translateY(0); 
                    }
                }

                @keyframes speechBubblePopOut {
                    0% { 
                        opacity: 1; 
                        transform: scale(1) translateY(0); 
                    }
                    100% { 
                        opacity: 0; 
                        transform: scale(0.8) translateY(10px); 
                    }
                }

                @keyframes pikachuCelebration {
                    0%, 100% { transform: rotate(0deg) scale(1); }
                    25% { transform: rotate(10deg) scale(1.1); }
                    75% { transform: rotate(-10deg) scale(1.1); }
                }

                .pikachu-assistant.celebrating img {
                    animation: pikachuCelebration 0.6s ease-in-out;
                }
            `;
            document.head.appendChild(styleSheet);
        }
    }

    show() {
        this.isShowing = true;
        this.assistantElement.style.transform = 'translateY(0)';
        this.assistantElement.style.opacity = '1';
    }

    hide() {
        this.isShowing = false;
        this.assistantElement.style.transform = 'translateY(100px)';
        this.assistantElement.style.opacity = '0';
        this.hideSpeechBubble();
    }

    showMessage(type = 'correct', customMessage = null, duration = 3000) {
        if (!this.isShowing) {
            this.show();
        }

        // Get message
        let message;
        if (customMessage) {
            message = customMessage;
        } else if (this.messages[type]) {
            const messageArray = this.messages[type];
            message = messageArray[Math.floor(Math.random() * messageArray.length)];
        } else {
            message = "Right! ⭐";
        }

        // Update speech bubble
        this.speechBubble.textContent = message;
        this.speechBubble.style.animation = 'speechBubblePopIn 0.3s ease-out forwards';
        this.speechBubble.style.opacity = '1';
        this.speechBubble.style.transform = 'scale(1) translateY(0)';

        // Add celebration animation for correct answers
        if (type === 'correct') {
            this.assistantElement.classList.add('celebrating');
            setTimeout(() => {
                this.assistantElement.classList.remove('celebrating');
            }, 600);
        }

        // Clear existing timeout
        if (this.messageTimeout) {
            clearTimeout(this.messageTimeout);
        }

        // Hide message after duration
        this.messageTimeout = setTimeout(() => {
            this.hideSpeechBubble();
        }, duration);
    }

    hideSpeechBubble() {
        this.speechBubble.style.animation = 'speechBubblePopOut 0.3s ease-in forwards';
        setTimeout(() => {
            this.speechBubble.style.opacity = '0';
            this.speechBubble.style.transform = 'scale(0.8) translateY(10px)';
        }, 300);
    }

    // Method to show "Right" specifically as requested
    showRight() {
        this.showMessage('correct', 'Right! ⭐', 2000);
    }

    // Method to show encouragement
    showEncouragement() {
        this.showMessage('encouragement');
    }

    // Method to show start message
    showStart() {
        this.showMessage('start');
    }

    // Method to show custom message
    say(message, duration = 3000) {
        this.showMessage('custom', message, duration);
    }

    // Clean up
    destroy() {
        if (this.messageTimeout) {
            clearTimeout(this.messageTimeout);
        }
        if (this.assistantElement && this.assistantElement.parentNode) {
            this.assistantElement.parentNode.removeChild(this.assistantElement);
        }
    }
}

// Make it globally available
window.PikachuAssistant = PikachuAssistant;
