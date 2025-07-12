/**
 * Enhanced Motion Detection Module using OpenCV.js
 * Provides advanced hand tracking and gesture recognition for interactive math games
 */

class EnhancedMotionDetector {
    constructor() {
        this.video = null;
        this.canvas = null;
        this.context = null;
        this.isInitialized = false;
        this.stream = null;
        this.onMotionCallback = null;
        this.onGestureCallback = null;
        
        // OpenCV variables
        this.src = null;
        this.dst = null;
        this.cap = null;
        this.skinMask = null;
        this.lastHandPosition = null;
        this.handTrackingEnabled = true;
        this.gestureHistory = [];
        
        // Hand tracking parameters
        this.minHandArea = 2000;
        this.maxHandArea = 50000;
        
        // Gesture recognition
        this.gestureThreshold = 30; // pixels
        this.gestureTimeWindow = 500; // ms
        this.currentGesture = null;
        
        this.debugMode = false;
    }

    /**
     * Initialize webcam and OpenCV
     */
    async initialize(videoElement, canvasElement) {
        try {
            // Wait for OpenCV to be ready
            if (typeof cv === 'undefined') {
                console.log('Loading OpenCV.js...');
                await this.loadOpenCV();
            }
            
            // Ensure OpenCV is fully initialized
            await this.ensureOpenCVReady();

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
                    // Set canvas size to match video exactly
                    this.canvas.width = this.video.videoWidth;
                    this.canvas.height = this.video.videoHeight;
                    
                    // Initialize OpenCV matrices with exact video dimensions
                    this.src = new cv.Mat(this.video.videoHeight, this.video.videoWidth, cv.CV_8UC4);
                    this.dst = new cv.Mat(this.video.videoHeight, this.video.videoWidth, cv.CV_8UC3);
                    this.skinMask = new cv.Mat();
                    
                    resolve();
                };
            });

            this.isInitialized = true;
            console.log('Enhanced motion detector initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize enhanced motion detector:', error);
            return false;
        }
    }

    /**
     * Load OpenCV.js dynamically
     */
    async loadOpenCV() {
        return new Promise((resolve, reject) => {
            if (typeof cv !== 'undefined') {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://docs.opencv.org/4.5.0/opencv.js';
            script.onload = () => {
                cv.onRuntimeInitialized = () => {
                    console.log('OpenCV.js loaded successfully');
                    resolve();
                };
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Ensure OpenCV is fully ready before use
     */
    async ensureOpenCVReady() {
        return new Promise((resolve) => {
            const checkReady = () => {
                if (typeof cv !== 'undefined' && cv.Mat && cv.Scalar && cv.cvtColor) {
                    console.log('OpenCV is ready for use');
                    resolve();
                } else {
                    console.log('Waiting for OpenCV to be ready...');
                    setTimeout(checkReady, 100);
                }
            };
            checkReady();
        });
    }

    /**
     * Start enhanced motion detection with hand tracking
     */
    startDetection(onMotionCallback, onGestureCallback = null) {
        if (!this.isInitialized) {
            console.error('Enhanced motion detector not initialized');
            return;
        }

        this.onMotionCallback = onMotionCallback;
        this.onGestureCallback = onGestureCallback;
        this.detectHandMotion();
    }

    /**
     * Main hand detection and tracking loop
     */
    detectHandMotion() {
        if (!this.isInitialized) return;

        try {
            // Ensure OpenCV is loaded and ready
            if (typeof cv === 'undefined' || !cv.Mat || !cv.cvtColor) {
                console.warn('OpenCV not ready');
                setTimeout(() => this.detectHandMotion(), 100);
                return;
            }
            
            // Ensure matrices are properly initialized
            if (!this.src || !this.dst || !this.src.rows || !this.dst.rows) {
                console.warn('OpenCV matrices not initialized');
                setTimeout(() => this.detectHandMotion(), 100);
                return;
            }

            // Draw current frame (flipped for natural interaction)
            this.context.save();
            this.context.scale(-1, 1);
            this.context.drawImage(this.video, -this.canvas.width, 0, this.canvas.width, this.canvas.height);
            this.context.restore();

            // Get image data and convert to OpenCV format
            const imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
            
            // Verify image data size matches matrix size
            const expectedSize = this.video.videoHeight * this.video.videoWidth * 4; // RGBA
            if (imageData.data.length !== expectedSize) {
                console.warn('Image data size mismatch:', imageData.data.length, 'expected:', expectedSize);
                return;
            }
            
            this.src.data.set(imageData.data);

            // Convert RGBA to RGB
            cv.cvtColor(this.src, this.dst, cv.COLOR_RGBA2RGB);
            
            // Validate dst matrix before using it
            if (!this.dst || !this.dst.rows || !this.dst.cols) {
                console.warn('Invalid dst matrix after color conversion');
                return;
            }
            
            // Detect and track hands
            const handData = this.detectHands(this.dst);
            
            if (handData && this.onMotionCallback) {
                // Mirror the hand position for natural interaction
                const mirroredHandData = {
                    ...handData,
                    centerX: this.canvas.width - handData.centerX,
                    boundingBox: {
                        ...handData.boundingBox,
                        x: this.canvas.width - handData.boundingBox.x - handData.boundingBox.width
                    }
                };
                
                this.onMotionCallback(mirroredHandData);
                
                // Detect gestures
                const gesture = this.detectGestures(mirroredHandData);
                if (gesture && this.onGestureCallback) {
                    this.onGestureCallback(gesture);
                }
            }

            // Continue detection loop
            requestAnimationFrame(() => this.detectHandMotion());
        } catch (error) {
            console.error('Error in hand detection loop:', error);
            // Fallback to basic motion detection
            console.log('Switching to basic motion detection due to error');
            this.detectBasicMotion();
        }
    }

    /**
     * Basic motion detection fallback (without OpenCV)
     */
    detectBasicMotion() {
        if (!this.isInitialized) return;

        try {
            // Draw current frame (flipped for natural interaction)
            this.context.save();
            this.context.scale(-1, 1);
            this.context.drawImage(this.video, -this.canvas.width, 0, this.canvas.width, this.canvas.height);
            this.context.restore();

            // Simple motion detection using frame difference
            const imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
            const currentFrame = this.rgbaToGrayscale(imageData.data);

            if (this.previousFrame) {
                const motionData = this.calculateBasicMotion(currentFrame);
                
                if (motionData && this.onMotionCallback) {
                    // Create mock hand data for compatibility
                    const handData = {
                        centerX: motionData.centerX,
                        centerY: motionData.centerY,
                        boundingBox: motionData.boundingBox,
                        area: motionData.pixelCount * 10, // Rough estimate
                        fingerCount: 1, // Mock finger count
                        confidence: Math.min(motionData.intensity / 1000, 1.0)
                    };
                    
                    this.onMotionCallback(handData);
                }
            }

            this.previousFrame = currentFrame.slice();
            requestAnimationFrame(() => this.detectBasicMotion());
            
        } catch (error) {
            console.error('Error in basic motion detection:', error);
            requestAnimationFrame(() => this.detectBasicMotion());
        }
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
     * Calculate basic motion between frames
     */
    calculateBasicMotion(currentFrame) {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const motionPixels = [];
        let totalMotion = 0;
        const threshold = 30;

        for (let i = 0; i < currentFrame.length; i++) {
            const diff = Math.abs(currentFrame[i] - this.previousFrame[i]);
            
            if (diff > threshold) {
                const x = i % width;
                const y = Math.floor(i / width);
                motionPixels.push({ x, y, intensity: diff });
                totalMotion += diff;
            }
        }

        if (motionPixels.length < 100) {
            return null; // Not enough motion
        }

        // Find center of motion
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

        const centerX = this.canvas.width - (sumX / motionPixels.length); // Mirror X
        const centerY = sumY / motionPixels.length;

        return {
            centerX,
            centerY,
            boundingBox: {
                x: this.canvas.width - maxX, // Mirror bounding box
                y: minY,
                width: maxX - minX,
                height: maxY - minY
            },
            intensity: totalMotion,
            pixelCount: motionPixels.length
        };
    }

    /**
     * Detect hands using skin color segmentation and contour analysis
     */
    detectHands(src) {
        try {
            // Validate input parameter
            if (!src || typeof src !== 'object' || !src.rows || !src.cols) {
                console.warn('Invalid src Mat passed to detectHands');
                return null;
            }
            
            const handMask = this.makeHandMask(src);
            if (!handMask) {
                console.warn('Failed to create hand mask');
                return null;
            }
            
            const contours = new cv.MatVector();
            const hierarchy = new cv.Mat();
            
            // Find contours
            cv.findContours(handMask, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
            
            let largestContour = null;
            let maxArea = 0;
            
            // Find the largest contour (likely the hand)
            for (let i = 0; i < contours.size(); i++) {
                const contour = contours.get(i);
                const area = cv.contourArea(contour);
                
                if (area > this.minHandArea && area < this.maxHandArea && area > maxArea) {
                    maxArea = area;
                    largestContour = contour;
                }
            }
            
            if (!largestContour) {
                // Cleanup
                handMask.delete();
                contours.delete();
                hierarchy.delete();
                return null;
            }
            
            // Get hand features
            const moments = cv.moments(largestContour);
            const centerX = moments.m10 / moments.m00;
            const centerY = moments.m01 / moments.m00;
            
            const boundingRect = cv.boundingRect(largestContour);
            
            // Get convex hull and defects for finger detection
            const hull = new cv.Mat();
            const hullIndices = new cv.Mat();
            cv.convexHull(largestContour, hull, false, false);
            cv.convexHull(largestContour, hullIndices, false, true);
            
            // Detect fingers using convexity defects
            const fingerCount = this.detectFingers(largestContour, hullIndices);
            
            // Cleanup OpenCV objects
            handMask.delete();
            contours.delete();
            hierarchy.delete();
            hull.delete();
            hullIndices.delete();
            
            return {
                centerX,
                centerY,
                boundingBox: {
                    x: boundingRect.x,
                    y: boundingRect.y,
                    width: boundingRect.width,
                    height: boundingRect.height
                },
                area: maxArea,
                fingerCount,
                confidence: Math.min(maxArea / this.maxHandArea, 1.0)
            };
            
        } catch (error) {
            console.error('Error in hand detection:', error);
            return null;
        }
    }

    /**
     * Create hand mask using skin color segmentation
     */
    makeHandMask(src) {
        try {
            // Validate input
            if (!src || typeof src !== 'object' || !src.rows || !src.cols) {
                console.warn('Invalid src Mat passed to makeHandMask');
                return null;
            }
            
            // Convert to HSV
            const hsv = new cv.Mat();
            cv.cvtColor(src, hsv, cv.COLOR_RGB2HSV);
            
            // Create skin color mask using simpler approach
            const mask = new cv.Mat();
            const lowerBound = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [0, 25, 13, 255]);
            const upperBound = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [15, 204, 153, 255]);
            
            cv.inRange(hsv, lowerBound, upperBound, mask);
            
            // Morphological operations to clean up the mask
            const kernel = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(5, 5));
            const cleaned = new cv.Mat();
            
            // Remove noise
            cv.morphologyEx(mask, cleaned, cv.MORPH_OPEN, kernel);
            // Fill holes
            cv.morphologyEx(cleaned, cleaned, cv.MORPH_CLOSE, kernel);
            
            // Cleanup
            hsv.delete();
            mask.delete();
            lowerBound.delete();
            upperBound.delete();
            kernel.delete();
            
            return cleaned;
        } catch (error) {
            console.error('Error in makeHandMask:', error);
            // Return empty mask on error
            return new cv.Mat();
        }
    }

    /**
     * Detect number of fingers using convexity defects
     */
    detectFingers(contour, hullIndices) {
        try {
            if (!contour || !hullIndices || hullIndices.rows < 3) return 0;
            
            const defects = new cv.Mat();
            cv.convexityDefects(contour, hullIndices, defects);
            
            if (defects.rows === 0) {
                defects.delete();
                return 0;
            }
            
            let fingerCount = 0;
            
            // Use safer approach - get contour as array first
            const contourArray = [];
            const dataType = contour.type();
            
            for (let i = 0; i < contour.rows; i++) {
                try {
                    let x, y;
                    if (dataType === cv.CV_32SC2) {
                        // 32-bit signed integer, 2 channels
                        x = contour.data32S[i * 2];
                        y = contour.data32S[i * 2 + 1];
                    } else {
                        // Fallback to safer access method
                        const point = contour.data32S || contour.data32F || contour.data;
                        if (point && point.length > i * 2 + 1) {
                            x = Math.round(point[i * 2]);
                            y = Math.round(point[i * 2 + 1]);
                        } else {
                            continue; // Skip invalid points
                        }
                    }
                    
                    if (isNaN(x) || isNaN(y) || x < 0 || y < 0) {
                        continue; // Skip invalid coordinates
                    }
                    
                    contourArray.push({ x, y });
                } catch (e) {
                    console.warn('Error accessing contour point:', i, e);
                    continue;
                }
            }
            
            if (contourArray.length < 3) {
                defects.delete();
                return 0;
            }
            
            // Analyze defects to count fingers
            for (let i = 0; i < defects.rows; i++) {
                try {
                    const defectData = defects.data32S;
                    if (!defectData || defectData.length < (i + 1) * 4) {
                        continue;
                    }
                    
                    const startIdx = defectData[i * 4];
                    const endIdx = defectData[i * 4 + 1];
                    const defectIdx = defectData[i * 4 + 2];
                    const depth = defectData[i * 4 + 3] / 256.0;
                    
                    // Bounds checking
                    if (startIdx >= contourArray.length || endIdx >= contourArray.length || 
                        defectIdx >= contourArray.length || startIdx < 0 || endIdx < 0 || defectIdx < 0) {
                        continue;
                    }
                    
                    if (depth > 20 && depth < 1000) { // Reasonable depth range
                        const start = contourArray[startIdx];
                        const end = contourArray[endIdx];
                        const defectPt = contourArray[defectIdx];
                        
                        // Validate points
                        if (!start || !end || !defectPt || 
                            isNaN(start.x) || isNaN(start.y) || 
                            isNaN(end.x) || isNaN(end.y) || 
                            isNaN(defectPt.x) || isNaN(defectPt.y)) {
                            continue;
                        }
                        
                        // Calculate angle
                        const angle = this.calculateAngle(start, defectPt, end);
                        
                        if (angle > 0 && angle < 90) { // Sharp angle indicates finger valley
                            fingerCount++;
                        }
                    }
                } catch (e) {
                    console.warn('Error processing defect:', i, e);
                    continue;
                }
            }
            
            defects.delete();
            return Math.min(fingerCount + 1, 5); // Add 1 for thumb, cap at 5
            
        } catch (error) {
            console.error('Error in finger detection:', error.message || error);
            return 1; // Return default finger count on error
        }
    }

    /**
     * Calculate angle between three points
     */
    calculateAngle(p1, p2, p3) {
        try {
            // Validate input points
            if (!p1 || !p2 || !p3 || 
                isNaN(p1.x) || isNaN(p1.y) || 
                isNaN(p2.x) || isNaN(p2.y) || 
                isNaN(p3.x) || isNaN(p3.y)) {
                return 0;
            }
            
            const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
            const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };
            
            const dot = v1.x * v2.x + v1.y * v2.y;
            const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
            const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
            
            // Check for zero magnitude vectors
            if (mag1 === 0 || mag2 === 0) {
                return 0;
            }
            
            const cos = dot / (mag1 * mag2);
            const clampedCos = Math.max(-1, Math.min(1, cos));
            const angle = Math.acos(clampedCos) * 180 / Math.PI;
            
            return isNaN(angle) ? 0 : angle;
        } catch (error) {
            console.warn('Error calculating angle:', error);
            return 0;
        }
    }

    /**
     * Detect gestures based on hand movement and finger count
     */
    detectGestures(handData) {
        const now = Date.now();
        
        // Add current hand data to history
        this.gestureHistory.push({
            ...handData,
            timestamp: now
        });
        
        // Remove old entries
        this.gestureHistory = this.gestureHistory.filter(
            entry => now - entry.timestamp < this.gestureTimeWindow
        );
        
        if (this.gestureHistory.length < 3) return null;
        
        // Detect different gesture types
        const waveGesture = this.detectWave();
        const swipeGesture = this.detectSwipe();
        const fingerCountGesture = this.detectFingerCount();
        
        return waveGesture || swipeGesture || fingerCountGesture;
    }

    /**
     * Detect wave gesture (rapid side-to-side movement)
     */
    detectWave() {
        if (this.gestureHistory.length < 5) return null;
        
        const recent = this.gestureHistory.slice(-5);
        let direction = 0;
        let changes = 0;
        
        for (let i = 1; i < recent.length; i++) {
            const dx = recent[i].centerX - recent[i-1].centerX;
            const newDirection = dx > 0 ? 1 : dx < 0 ? -1 : 0;
            
            if (Math.abs(dx) > 20 && newDirection !== 0 && newDirection !== direction) {
                changes++;
                direction = newDirection;
            }
        }
        
        if (changes >= 2) {
            return {
                type: 'wave',
                confidence: Math.min(changes / 4, 1.0),
                position: {
                    x: recent[recent.length - 1].centerX,
                    y: recent[recent.length - 1].centerY
                }
            };
        }
        
        return null;
    }

    /**
     * Detect swipe gestures
     */
    detectSwipe() {
        if (this.gestureHistory.length < 3) return null;
        
        const start = this.gestureHistory[0];
        const end = this.gestureHistory[this.gestureHistory.length - 1];
        
        const dx = end.centerX - start.centerX;
        const dy = end.centerY - start.centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 100) {
            const angle = Math.atan2(dy, dx) * 180 / Math.PI;
            let direction = 'unknown';
            
            if (angle > -45 && angle < 45) direction = 'right';
            else if (angle > 45 && angle < 135) direction = 'down';
            else if (angle > 135 || angle < -135) direction = 'left';
            else direction = 'up';
            
            return {
                type: 'swipe',
                direction,
                distance,
                confidence: Math.min(distance / 200, 1.0),
                startPosition: { x: start.centerX, y: start.centerY },
                endPosition: { x: end.centerX, y: end.centerY }
            };
        }
        
        return null;
    }

    /**
     * Detect finger count gesture
     */
    detectFingerCount() {
        const recent = this.gestureHistory[this.gestureHistory.length - 1];
        
        if (recent && recent.fingerCount > 0) {
            return {
                type: 'fingerCount',
                count: recent.fingerCount,
                confidence: recent.confidence,
                position: {
                    x: recent.centerX,
                    y: recent.centerY
                }
            };
        }
        
        return null;
    }

    /**
     * Get normalized hand position (0-1 range)
     */
    getNormalizedPosition(handData) {
        if (!handData) return null;

        return {
            x: handData.centerX / this.canvas.width,
            y: handData.centerY / this.canvas.height
        };
    }

    /**
     * Check if hand intersects with a rectangle
     */
    checkCollision(handData, rect) {
        if (!handData) return false;

        const handRect = handData.boundingBox;
        
        return !(handRect.x + handRect.width < rect.x ||
                rect.x + rect.width < handRect.x ||
                handRect.y + handRect.height < rect.y ||
                rect.y + rect.height < handRect.y);
    }

    /**
     * Enable/disable debug mode
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
    }

    /**
     * Set hand tracking sensitivity
     */
    setSensitivity(minArea, maxArea) {
        this.minHandArea = minArea || 2000;
        this.maxHandArea = maxArea || 50000;
    }

    /**
     * Stop detection and cleanup
     */
    stop() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
        
        // Cleanup OpenCV matrices (Scalars don't need deletion)
        if (this.src && typeof this.src.delete === 'function') this.src.delete();
        if (this.dst && typeof this.dst.delete === 'function') this.dst.delete();
        if (this.skinMask && typeof this.skinMask.delete === 'function') this.skinMask.delete();
        
        // Scalars are simple objects, no need to delete
        this.skinColorLower = null;
        this.skinColorUpper = null;
        
        this.isInitialized = false;
    }
}

// Export for use in other modules
window.EnhancedMotionDetector = EnhancedMotionDetector;
