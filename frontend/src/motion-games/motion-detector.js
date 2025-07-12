/**
 * Motion Detection Module for Math Buddy Motion Games
 * Uses webcam to detect user movement for interactive math games
 */

class MotionDetector {
    constructor() {
        this.video = null;
        this.canvas = null;
        this.context = null;
        this.previousFrame = null;
        this.currentFrame = null;
        this.isInitialized = false;
        this.stream = null;
        this.motionThreshold = 30;
        this.minMotionArea = 500;
        this.onMotionCallback = null;
    }

    /**
     * Initialize webcam and motion detection
     */
    async initialize(videoElement, canvasElement) {
        try {
            this.video = videoElement;
            this.canvas = canvasElement;
            this.context = this.canvas.getContext('2d', { willReadFrequently: true });

            // Request webcam access
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                }
            });

            this.video.srcObject = this.stream;
            this.video.play();

            // Wait for video to be ready
            await new Promise((resolve) => {
                this.video.onloadedmetadata = () => {
                    this.canvas.width = this.video.videoWidth;
                    this.canvas.height = this.video.videoHeight;
                    resolve();
                };
            });

            this.isInitialized = true;
            console.log('Motion detector initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize motion detector:', error);
            return false;
        }
    }

    /**
     * Start motion detection loop
     */
    startDetection(onMotionCallback) {
        if (!this.isInitialized) {
            console.error('Motion detector not initialized');
            return;
        }

        this.onMotionCallback = onMotionCallback;
        this.detectMotion();
    }

    /**
     * Stop motion detection and cleanup
     */
    stop() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
        this.isInitialized = false;
    }

    /**
     * Main motion detection loop
     */
    detectMotion() {
        if (!this.isInitialized) return;

        // Draw current frame (mirrored for natural movement)
        this.context.save();
        this.context.scale(-1, 1);
        this.context.drawImage(this.video, -this.canvas.width, 0, this.canvas.width, this.canvas.height);
        this.context.restore();
        
        // Get current frame data
        const currentImageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
        this.currentFrame = this.rgbaToGrayscale(currentImageData.data);

        if (this.previousFrame) {
            // Calculate motion
            const motionData = this.calculateMotion();
            
            if (motionData && this.onMotionCallback) {
                this.onMotionCallback(motionData);
            }
        }

        // Store current frame as previous for next iteration
        this.previousFrame = this.currentFrame.slice();

        // Continue detection loop
        requestAnimationFrame(() => this.detectMotion());
    }

    /**
     * Convert RGBA to grayscale for motion detection
     */
    rgbaToGrayscale(imageData) {
        const grayscale = new Uint8Array(imageData.length / 4);
        for (let i = 0; i < grayscale.length; i++) {
            const r = imageData[i * 4];
            const g = imageData[i * 4 + 1];
            const b = imageData[i * 4 + 2];
            grayscale[i] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
        }
        return grayscale;
    }

    /**
     * Calculate motion between frames
     */
    calculateMotion() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const motionPixels = [];
        let totalMotion = 0;

        // Apply simple blur to reduce noise
        const blurredCurrent = this.applyBlur(this.currentFrame, width, height);
        const blurredPrevious = this.applyBlur(this.previousFrame, width, height);

        // Calculate differences
        for (let i = 0; i < blurredCurrent.length; i++) {
            const diff = Math.abs(blurredCurrent[i] - blurredPrevious[i]);
            
            if (diff > this.motionThreshold) {
                const x = i % width;
                const y = Math.floor(i / width);
                motionPixels.push({ x, y, intensity: diff });
                totalMotion += diff;
            }
        }

        if (motionPixels.length < this.minMotionArea) {
            return null; // Not enough motion
        }

        // Find the largest contour (primary motion area)
        const primaryMotionArea = this.findLargestMotionArea(motionPixels, width, height);
        
        if (!primaryMotionArea) {
            return null;
        }

        return {
            centerX: this.canvas.width - primaryMotionArea.centerX, // Mirror the center X coordinate
            centerY: primaryMotionArea.centerY,
            boundingBox: {
                x: this.canvas.width - primaryMotionArea.boundingBox.x - primaryMotionArea.boundingBox.width, // Mirror bounding box
                y: primaryMotionArea.boundingBox.y,
                width: primaryMotionArea.boundingBox.width,
                height: primaryMotionArea.boundingBox.height
            },
            intensity: totalMotion,
            pixelCount: motionPixels.length
        };
    }

    /**
     * Apply simple blur to reduce noise
     */
    applyBlur(imageData, width, height) {
        const blurred = new Uint8Array(imageData.length);
        const kernelSize = 3;
        const offset = Math.floor(kernelSize / 2);

        for (let y = offset; y < height - offset; y++) {
            for (let x = offset; x < width - offset; x++) {
                let sum = 0;
                let count = 0;

                for (let ky = -offset; ky <= offset; ky++) {
                    for (let kx = -offset; kx <= offset; kx++) {
                        const idx = (y + ky) * width + (x + kx);
                        sum += imageData[idx];
                        count++;
                    }
                }

                blurred[y * width + x] = sum / count;
            }
        }

        return blurred;
    }

    /**
     * Find the largest connected motion area
     */
    findLargestMotionArea(motionPixels, width, height) {
        if (motionPixels.length === 0) return null;

        // Simple clustering: find the center of mass of motion pixels
        let sumX = 0, sumY = 0;
        let minX = width, maxX = 0, minY = height, maxY = 0;

        for (const pixel of motionPixels) {
            sumX += pixel.x;
            sumY += pixel.y;
            
            minX = Math.min(minX, pixel.x);
            maxX = Math.max(maxX, pixel.x);
            minY = Math.min(minY, pixel.y);
            maxY = Math.max(maxY, pixel.y);
        }

        const centerX = sumX / motionPixels.length;
        const centerY = sumY / motionPixels.length;

        return {
            centerX,
            centerY,
            boundingBox: {
                x: minX,
                y: minY,
                width: maxX - minX,
                height: maxY - minY
            }
        };
    }

    /**
     * Get normalized motion position (0-1 range) 
     */
    getNormalizedPosition(motionData) {
        if (!motionData) return null;

        return {
            x: motionData.centerX / this.canvas.width, // X is already mirrored in calculateMotion
            y: motionData.centerY / this.canvas.height
        };
    }

    /**
     * Check if motion intersects with a rectangle
     */
    checkCollision(motionData, rect) {
        if (!motionData) return false;

        const motionRect = motionData.boundingBox;
        
        return !(motionRect.x + motionRect.width < rect.x ||
                rect.x + rect.width < motionRect.x ||
                motionRect.y + motionRect.height < rect.y ||
                rect.y + rect.height < motionRect.y);
    }

    /**
     * Set motion detection sensitivity
     */
    setSensitivity(threshold, minArea) {
        this.motionThreshold = threshold || 30;
        this.minMotionArea = minArea || 500;
    }
}

// Export for use in other modules
window.MotionDetector = MotionDetector;
