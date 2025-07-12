'use client';
import { useEffect, useState } from 'react';
import '../app/loading.css';

interface LoadingAnimationProps {
  type?: 'upload' | 'quiz' | 'chat' | 'game' | 'motion';
  theme?: string;
  message?: string;
}

export function LoadingAnimation({ 
  type = 'upload', 
  theme = 'Space Pirates', 
  message 
}: LoadingAnimationProps) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [funFact, setFunFact] = useState('');

  const funFacts = [
    "🧠 Math games help build neural pathways!",
    "🎯 Visual learning improves problem-solving skills!",
    "🌟 Every mistake is a learning opportunity!",
    "🚀 Math is everywhere in space exploration!",
    "🎮 Gaming makes learning 3x more effective!",
    "💡 Your brain grows stronger with each challenge!",
    "🎨 Creativity and math work together beautifully!",
    "🏆 Practice makes progress, not perfection!"
  ];

  useEffect(() => {
    // Animate frames
    const frameInterval = setInterval(() => {
      setCurrentFrame(prev => (prev + 1) % 8);
    }, 200);

    // Rotate fun facts
    const factInterval = setInterval(() => {
      setFunFact(funFacts[Math.floor(Math.random() * funFacts.length)]);
    }, 3000);

    // Set initial fun fact
    setFunFact(funFacts[Math.floor(Math.random() * funFacts.length)]);

    return () => {
      clearInterval(frameInterval);
      clearInterval(factInterval);
    };
  }, []);

  const getLoadingConfig = () => {
    switch (type) {
      case 'upload':
        return {
          emoji: '📚',
          title: 'Creating Your Quiz',
          description: 'Transforming your questions into magical adventures...',
          color: '#667eea',
          particles: ['✨', '📖', '🎨', '⭐']
        };
      case 'chat':
        return {
          emoji: '🤖',
          title: 'Math Buddy is Thinking',
          description: 'Preparing the perfect explanation just for you...',
          color: '#10b981',
          particles: ['💭', '🧠', '💡', '🎯']
        };
      case 'game':
        return {
          emoji: '🎮',
          title: 'Building Your Game',
          description: 'Crafting an amazing interactive experience...',
          color: '#f59e0b',
          particles: ['🎲', '🚀', '⚡', '🌟']
        };
      case 'motion':
        return {
          emoji: '📹',
          title: 'Setting Up Motion Games',
          description: 'Getting your camera ready for action...',
          color: '#8b5cf6',
          particles: ['🏃‍♂️', '👋', '🎯', '💫']
        };
      default:
        return {
          emoji: '🌟',
          title: 'Processing',
          description: 'Working on something awesome...',
          color: '#6366f1',
          particles: ['✨', '⭐', '🌟', '💫']
        };
    }
  };

  const config = getLoadingConfig();
  const bounceFrames = [0, -5, -10, -15, -10, -5, 0, 5];

  return (
    <div className="loading-overlay" style={{
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '40px',
        textAlign: 'center',
        maxWidth: '400px',
        width: '90%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        border: `3px solid ${config.color}`,
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Floating particles animation */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
          pointerEvents: 'none'
        }}>
          {config.particles.map((particle, index) => (
            <div
              key={index}
              style={{
                position: 'absolute',
                fontSize: '20px',
                opacity: '0.6',
                left: `${20 + (index * 20)}%`,
                top: `${10 + (index * 15)}%`,
                transform: `translateY(${Math.sin(currentFrame + index) * 10}px)`,
                transition: 'transform 0.2s ease'
              }}
            >
              {particle}
            </div>
          ))}
        </div>

        {/* Main emoji with bounce animation */}
        <div style={{
          fontSize: '4em',
          marginBottom: '20px',
          transform: `translateY(${bounceFrames[currentFrame]}px)`,
          transition: 'transform 0.2s ease',
          position: 'relative',
          zIndex: 2
        }}>
          {config.emoji}
        </div>

        {/* Loading title */}
        <h2 style={{
          fontSize: '1.8em',
          margin: '0 0 15px 0',
          color: config.color,
          fontWeight: 'bold',
          position: 'relative',
          zIndex: 2
        }}>
          {config.title}
        </h2>

        {/* Loading description */}
        <p style={{
          fontSize: '1.1em',
          color: '#666',
          margin: '0 0 25px 0',
          lineHeight: '1.4',
          position: 'relative',
          zIndex: 2
        }}>
          {message || config.description}
        </p>

        {/* Animated progress bar */}
        <div style={{
          width: '100%',
          height: '8px',
          background: '#f0f0f0',
          borderRadius: '4px',
          overflow: 'hidden',
          marginBottom: '20px',
          position: 'relative',
          zIndex: 2
        }}>
          <div style={{
            height: '100%',
            background: `linear-gradient(90deg, ${config.color}, ${config.color}bb)`,
            borderRadius: '4px',
            width: '100%',
            animation: 'loading-slide 2s ease-in-out infinite',
            transformOrigin: 'left'
          }} />
        </div>

        {/* Fun fact rotation */}
        <div style={{
          background: '#f8f9fa',
          padding: '15px',
          borderRadius: '10px',
          border: `2px solid ${config.color}33`,
          fontSize: '0.95em',
          color: '#555',
          minHeight: '50px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'opacity 0.5s ease',
          position: 'relative',
          zIndex: 2
        }}>
          {funFact}
        </div>

        {/* Loading dots */}
        <div style={{
          marginTop: '20px',
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          position: 'relative',
          zIndex: 2
        }}>
          {[0, 1, 2].map(i => (
            <div
              key={i}
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: config.color,
                opacity: currentFrame === i || currentFrame === (i + 3) ? '1' : '0.3',
                transform: currentFrame === i || currentFrame === (i + 3) ? 'scale(1.2)' : 'scale(1)',
                transition: 'all 0.2s ease'
              }}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes loading-slide {
          0% { transform: translateX(-100%) scaleX(1); }
          50% { transform: translateX(0%) scaleX(1); }
          100% { transform: translateX(100%) scaleX(1); }
        }
      `}</style>
    </div>
  );
}
