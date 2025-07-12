/**
 * Theme Manager for Math Buddy Motion Games
 * Provides themed assets and visuals based on user keywords
 */

class ThemeManager {
    constructor() {
        this.themes = {
            // Pokemon theme
            pokemon: {
                primary: '#FF6B6B',
                secondary: '#4ECDC4',
                accent: '#FFE66D',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                character: '⚡',
                target: '🔴', // Pokeball
                collectible: '⭐',
                bubble: '🔵',
                sound: 'pokemon'
            },
            
            // Hello Kitty theme
            kitty: {
                primary: '#FF69B4',
                secondary: '#FFB6C1',
                accent: '#FFFFFF',
                background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
                character: '🐱',
                target: '🎀',
                collectible: '💝',
                bubble: '🌸',
                sound: 'cute'
            },
            
            // Dinosaur theme
            dinosaur: {
                primary: '#32CD32',
                secondary: '#8FBC8F',
                accent: '#FFD700',
                background: 'linear-gradient(135deg, #a8e6cf 0%, #dcedc1 100%)',
                character: '🦕',
                target: '🥩',
                collectible: '🦴',
                bubble: '🥚',
                sound: 'roar'
            },
            
            // Space theme
            space: {
                primary: '#4169E1',
                secondary: '#191970',
                accent: '#FFD700',
                background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)',
                character: '🚀',
                target: '⭐',
                collectible: '🌟',
                bubble: '🌍',
                sound: 'space'
            },
            
            // Ocean theme
            ocean: {
                primary: '#1E90FF',
                secondary: '#87CEEB',
                accent: '#FFD700',
                background: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)',
                character: '🐟',
                target: '🐚',
                collectible: '🦀',
                bubble: '🫧',
                sound: 'water'
            },
            
            // Princess theme
            princess: {
                primary: '#DA70D6',
                secondary: '#F0E68C',
                accent: '#FFB6C1',
                background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
                character: '👸',
                target: '👑',
                collectible: '💎',
                bubble: '🔮',
                sound: 'magical'
            },
            
            // Robot theme
            robot: {
                primary: '#808080',
                secondary: '#C0C0C0',
                accent: '#00FF00',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                character: '🤖',
                target: '⚙️',
                collectible: '🔧',
                bubble: '⚡',
                sound: 'robot'
            },
            
            // Default fallback
            default: {
                primary: '#6366F1',
                secondary: '#8B5CF6',
                accent: '#F59E0B',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                character: '😊',
                target: '🎯',
                collectible: '⭐',
                bubble: '🎈',
                sound: 'happy'
            }
        };
    }

    /**
     * Get themed assets based on keyword
     */
    getThemedAsset(keyword) {
        const normalizedKeyword = keyword.toLowerCase().trim();
        
        // Check for exact matches first
        if (this.themes[normalizedKeyword]) {
            return this.themes[normalizedKeyword];
        }
        
        // Check for partial matches
        for (const [themeKey, themeData] of Object.entries(this.themes)) {
            if (normalizedKeyword.includes(themeKey) || themeKey.includes(normalizedKeyword)) {
                return themeData;
            }
        }
        
        // Special keyword mappings
        const keywordMappings = {
            'cat': 'kitty',
            'kitten': 'kitty',
            'hello kitty': 'kitty',
            'dino': 'dinosaur',
            'dinosaurs': 'dinosaur',
            'trex': 'dinosaur',
            'pokemon': 'pokemon',
            'pikachu': 'pokemon',
            'pokeball': 'pokemon',
            'stars': 'space',
            'rocket': 'space',
            'astronaut': 'space',
            'galaxy': 'space',
            'fish': 'ocean',
            'sea': 'ocean',
            'water': 'ocean',
            'mermaid': 'ocean',
            'fairy': 'princess',
            'crown': 'princess',
            'castle': 'princess',
            'machine': 'robot',
            'android': 'robot',
            'gear': 'robot'
        };
        
        for (const [keyword, theme] of Object.entries(keywordMappings)) {
            if (normalizedKeyword.includes(keyword)) {
                return this.themes[theme];
            }
        }
        
        // Return default theme
        return this.themes.default;
    }

    /**
     * Generate CSS variables for a theme
     */
    generateThemeCSS(keyword) {
        const theme = this.getThemedAsset(keyword);
        
        return `
            :root {
                --theme-primary: ${theme.primary};
                --theme-secondary: ${theme.secondary};
                --theme-accent: ${theme.accent};
                --theme-background: ${theme.background};
            }
        `;
    }

    /**
     * Create an SVG bubble/target with theme
     */
    createThemedBubble(keyword, size = 60, content = '') {
        const theme = this.getThemedAsset(keyword);
        
        return `
            <div class="themed-bubble" style="
                width: ${size}px;
                height: ${size}px;
                background: ${theme.primary};
                border: 3px solid ${theme.secondary};
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: ${size * 0.4}px;
                font-weight: bold;
                color: white;
                text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                cursor: pointer;
                transition: transform 0.2s ease;
            " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                ${content || theme.bubble}
            </div>
        `;
    }

    /**
     * Create a themed character sprite
     */
    createThemedCharacter(keyword, size = 80) {
        const theme = this.getThemedAsset(keyword);
        
        return `
            <div class="themed-character" style="
                width: ${size}px;
                height: ${size}px;
                background: radial-gradient(circle, ${theme.secondary}, ${theme.primary});
                border: 3px solid ${theme.accent};
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: ${size * 0.6}px;
                box-shadow: 0 6px 12px rgba(0,0,0,0.4);
                animation: characterBounce 2s infinite ease-in-out;
            ">
                ${theme.character}
            </div>
        `;
    }

    /**
     * Create themed number line markers
     */
    createNumberLineMarker(keyword, number, isActive = false) {
        const theme = this.getThemedAsset(keyword);
        const activeStyle = isActive ? `background: ${theme.accent}; transform: scale(1.2);` : '';
        
        return `
            <div class="number-marker" style="
                width: 50px;
                height: 50px;
                background: ${theme.primary};
                border: 2px solid ${theme.secondary};
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
                font-weight: bold;
                color: white;
                text-shadow: 1px 1px 2px rgba(0,0,0,0.7);
                cursor: pointer;
                transition: all 0.3s ease;
                ${activeStyle}
            " data-number="${number}">
                ${number}
            </div>
        `;
    }

    /**
     * Create themed zone backgrounds
     */
    createThemedZone(keyword, content, width = '40%') {
        const theme = this.getThemedAsset(keyword);
        
        return `
            <div class="themed-zone" style="
                width: ${width};
                height: 200px;
                background: ${theme.background};
                border: 4px solid ${theme.accent};
                border-radius: 15px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                position: relative;
                overflow: hidden;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 8px 16px rgba(0,0,0,0.3);
            " onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
                <div style="
                    font-size: 2em;
                    margin-bottom: 10px;
                ">
                    ${theme.character}
                </div>
                <div style="
                    font-size: 1.5em;
                    font-weight: bold;
                    color: white;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.7);
                    text-align: center;
                    padding: 0 10px;
                ">
                    ${content}
                </div>
            </div>
        `;
    }

    /**
     * Get themed sound type for audio feedback
     */
    getThemedSound(keyword) {
        const theme = this.getThemedAsset(keyword);
        return theme.sound;
    }

    /**
     * Create floating particles effect
     */
    createThemedParticles(keyword, count = 5) {
        const theme = this.getThemedAsset(keyword);
        let particles = '';
        
        for (let i = 0; i < count; i++) {
            const left = Math.random() * 100;
            const animationDelay = Math.random() * 2;
            const animationDuration = 3 + Math.random() * 2;
            
            particles += `
                <div class="themed-particle" style="
                    position: absolute;
                    left: ${left}%;
                    font-size: 1.5em;
                    animation: floatUp ${animationDuration}s infinite linear;
                    animation-delay: ${animationDelay}s;
                    pointer-events: none;
                    z-index: 1;
                ">
                    ${theme.collectible}
                </div>
            `;
        }
        
        return particles;
    }
}

// Export for use in other modules
window.ThemeManager = ThemeManager;
