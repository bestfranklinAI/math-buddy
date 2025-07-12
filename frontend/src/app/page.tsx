'use client';
import { useState, useEffect } from 'react';
import { ThemePicker } from '../components/ThemePicker';
import { LoadingAnimation } from '../components/LoadingAnimation';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface QuizQuestion {
  id: string;
  original: string;
  rewritten: string;
  image_url?: string;
  theme: string;
}

interface QuizData {
  quiz_id: string;
  theme: string;
  age: number;
  questions: QuizQuestion[];
}

interface QuizAnswer {
  question_id: string;
  answer: string;
}

interface QuizResult {
  quiz_id: string;
  score: number;
  total: number;
  percentage: number;
  encouragement: string;
  feedback: Array<{question_id: string; feedback: string}>;
}

interface MinigameRequest {
  quiz_id: string;
  game_prompt: string;
  theme: string;
}

interface MinigameResponse {
  game_html: string;
  status: string;
  message: string;
}

type AppStage = 'upload' | 'mode-select' | 'quiz' | 'results' | 'assistant' | 'minigame' | 'motion-game';

export default function Home() {
  // Stage management
  const [currentStage, setCurrentStage] = useState<AppStage>('upload');
  
  // Upload stage
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [theme, setTheme] = useState('Space Pirates');
  const [age, setAge] = useState(10);
  const [uploading, setUploading] = useState(false);
  const [loadingType, setLoadingType] = useState<'upload' | 'quiz' | 'chat' | 'game' | 'motion'>('upload');
  const [loadingMessage, setLoadingMessage] = useState('');
  
  // Processed quiz data (shared across all modes)
  const [processedQuizData, setProcessedQuizData] = useState<QuizData | null>(null);
  
  // Quiz stage
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  
  // Results stage
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  
  // Assistant stage
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  // Minigame stage
  const [gamePrompt, setGamePrompt] = useState('');
  const [generatedGame, setGeneratedGame] = useState<string>('');
  const [gameLoading, setGameLoading] = useState(false);

  // Motion game stage
  const [motionGameController, setMotionGameController] = useState<any>(null);
  const [motionGameLoading, setMotionGameLoading] = useState(false);

  // Initialize motion games when stage changes
  useEffect(() => {
    if (currentStage === 'motion-game' && quizData && !motionGameController) {
      // Dynamically load motion game scripts
      const loadMotionGameScripts = async () => {
        try {
          setMotionGameLoading(true);
          setLoadingType('motion');
          setLoadingMessage('Setting up your motion games and camera...');
          
          // Load motion game scripts
          const scripts = [
            '/motion-games/motion-detector.js',
            '/motion-games/enhanced-motion-detector.js',
            '/motion-games/theme-manager.js',
            '/motion-games/bubble-pop-game.js',
            '/motion-games/enhanced-bubble-pop-game.js',
            '/motion-games/side-to-side-game.js',
            '/motion-games/number-line-jump-game.js',
            '/motion-games/enhanced-number-line-jump-game.js',
            '/motion-games/enhanced-physical-math-game.js',
            '/motion-games/motion-game-controller.js'
          ];

          for (const scriptSrc of scripts) {
            if (!document.querySelector(`script[src="${scriptSrc}"]`)) {
              console.log(`Loading motion game script: ${scriptSrc}`);
              const script = document.createElement('script');
              script.src = scriptSrc;
              script.async = false;
              document.head.appendChild(script);
              
              await new Promise((resolve, reject) => {
                script.onload = () => {
                  console.log(`Successfully loaded: ${scriptSrc}`);
                  resolve(undefined);
                };
                script.onerror = (error) => {
                  console.error(`Failed to load: ${scriptSrc}`, error);
                  reject(new Error(`Failed to load ${scriptSrc}`));
                };
              });
            }
          }

          // Check if MotionGameController is available
          if (!(window as any).MotionGameController) {
            throw new Error('MotionGameController not found after loading scripts');
          }

          console.log('All motion game scripts loaded successfully');
          console.log('Available classes:', {
            MotionGameController: !!(window as any).MotionGameController,
            BubblePopGame: !!(window as any).BubblePopGame,
            EnhancedBubblePopGame: !!(window as any).EnhancedBubblePopGame,
            MotionDetector: !!(window as any).MotionDetector,
            ThemeManager: !!(window as any).ThemeManager
          });

          // Initialize motion game controller
          const controller = new (window as any).MotionGameController('motion-game-container');
          console.log('Motion game controller created');
          
          controller.init(quizData, theme);
          console.log('Motion game controller initialized with data:', { questionsCount: quizData.questions.length, theme });
          
          controller.onGameComplete = (result: any) => {
            // Handle game completion
            console.log('Motion game completed:', result);
            setCurrentStage('results');
          };
          
          setMotionGameController(controller);
        } catch (error) {
          console.error('Failed to load motion game scripts:', error);
          // Show user-friendly error message
          setLoadingMessage('Unable to load motion games. Please refresh the page and try again.');
          
          // Fallback: redirect to results after a short delay
          setTimeout(() => {
            console.log('Falling back to results stage due to motion game loading failure');
            setCurrentStage('results');
          }, 3000);
        } finally {
          setMotionGameLoading(false);
        }
      };

      loadMotionGameScripts();
    }
  }, [currentStage, quizData, theme, motionGameController]);

  // Handle file upload (drag & drop)
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'text/plain' || droppedFile.name.endsWith('.txt')) {
        setFile(droppedFile);
      } else {
        alert('Please upload a .txt file');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const processFileForAllModes = async () => {
    if (!file) return;
    
    setUploading(true);
    setLoadingType('upload');
    setLoadingMessage('Processing your questions for all game modes...');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('theme', theme);
    formData.append('age', age.toString());
    
    try {
      const response = await fetch('http://localhost:8000/api/upload-quiz', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Upload failed');
      
      const data: QuizData = await response.json();
      setProcessedQuizData(data);
      setCurrentStage('mode-select');
      playSound('success');
    } catch (error) {
      alert('Error processing file. Please try again.');
      playSound('error');
    } finally {
      setUploading(false);
    }
  };

  const startQuizMode = () => {
    if (processedQuizData) {
      setQuizData(processedQuizData);
      setCurrentStage('quiz');
      playSound('click');
    }
  };

  const startMinigameMode = () => {
    if (processedQuizData) {
      setQuizData(processedQuizData);
      setCurrentStage('minigame');
      playSound('click');
    }
  };

  const startMotionGameMode = () => {
    if (processedQuizData) {
      setQuizData(processedQuizData);
      setCurrentStage('motion-game');
      playSound('click');
    }
  };

  const handleQuestionAnswer = () => {
    if (!currentAnswer.trim() || !quizData) return;
    
    const currentQuestion = quizData.questions[currentQuestionIndex];
    const newAnswer: QuizAnswer = {
      question_id: currentQuestion.id,
      answer: currentAnswer
    };
    
    setAnswers([...answers, newAnswer]);
    setCurrentAnswer('');
    
    if (currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      playSound('click');
    } else {
      // Submit quiz
      submitQuiz([...answers, newAnswer]);
    }
  };

  const submitQuiz = async (finalAnswers: QuizAnswer[]) => {
    if (!quizData) return;
    
    try {
      const response = await fetch('http://localhost:8000/api/submit-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quiz_id: quizData.quiz_id,
          answers: finalAnswers
        }),
      });
      
      const result: QuizResult = await response.json();
      setQuizResult(result);
      setCurrentStage('results');
      playSound('success');
    } catch (error) {
      alert('Error submitting quiz. Please try again.');
      playSound('error');
    }
  };

  const sendChatMessage = async () => {
    if (!chatMessage.trim()) return;
    
    setChatLoading(true);
    setLoadingType('chat');
    setLoadingMessage('Math Buddy is thinking about your question...');
    
    const userMessage: ChatMessage = {
      role: 'user',
      content: chatMessage,
      timestamp: new Date()
    };
    
    const updatedHistory = [...chatHistory, userMessage];
    setChatHistory(updatedHistory);
    setChatMessage('');
    
    try {
      const resp = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: chatMessage, 
          history: chatHistory.map(msg => ({ role: msg.role, content: msg.content }))
        }),
      });
      const data = await resp.json();
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.assistant,
        timestamp: new Date()
      };
      
      setChatHistory([...updatedHistory, assistantMessage]);
      playSound('success');
    } catch {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I had trouble understanding that. Can you try again?',
        timestamp: new Date()
      };
      setChatHistory([...updatedHistory, errorMessage]);
      playSound('error');
    } finally {
      setChatLoading(false);
    }
  };

  const generateMinigame = async () => {
    if (!gamePrompt.trim() || !quizData) {
      alert('Please enter a game description and ensure you have quiz data!');
      return;
    }
    
    setGameLoading(true);
    setLoadingType('game');
    setLoadingMessage('Creating your custom math adventure...');
    
    try {
      const response = await fetch('http://localhost:8000/api/generate-minigame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quiz_id: quizData.quiz_id,
          game_prompt: gamePrompt,
          theme: theme
        }),
      });
      
      if (!response.ok) throw new Error('Failed to generate minigame');
      
      const result: MinigameResponse = await response.json();
      
      if (result.status === 'success') {
        setGeneratedGame(result.game_html);
        playSound('success');
      } else {
        alert(result.message);
        playSound('error');
      }
    } catch (error) {
      alert('Error generating minigame. Please try again.');
      playSound('error');
    } finally {
      setGameLoading(false);
    }
  };

  // Sound effects
  const playSound = (type: 'success' | 'click' | 'error') => {
    if (typeof window !== 'undefined') {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      switch (type) {
        case 'success':
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
          oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.3);
          break;
        case 'click':
          oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.1);
          break;
        case 'error':
          oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
          gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.2);
          break;
      }
    }
  };

  const resetQuiz = () => {
    setCurrentStage('upload');
    setFile(null);
    setQuizData(null);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setCurrentAnswer('');
    setQuizResult(null);
    setChatHistory([]);
    setGamePrompt('');
    setGeneratedGame('');
    setGameLoading(false);
    
    // Cleanup motion game controller
    if (motionGameController) {
      motionGameController.stop();
      setMotionGameController(null);
    }
  };

  const handleSelect = (selectedTheme: string) => {
    setTheme(selectedTheme);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4 animate-pulse">
            🧮 Math Buddy Quest 🌟
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-6">
            Upload your math questions and embark on a themed learning adventure!
          </p>
          
          {/* Progress indicator */}
          <div className="flex justify-center items-center space-x-4 mb-6">
            <div className={`flex items-center ${currentStage === 'upload' ? 'text-purple-600 font-bold' : 'text-green-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${currentStage === 'upload' ? 'bg-purple-100' : 'bg-green-100'}`}>
                {currentStage === 'upload' ? '1' : '✓'}
              </div>
              Upload
            </div>
            <div className="w-8 h-1 bg-gray-200"></div>
            <div className={`flex items-center ${currentStage === 'quiz' ? 'text-purple-600 font-bold' : ['results', 'assistant'].includes(currentStage) ? 'text-green-500' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${currentStage === 'quiz' ? 'bg-purple-100' : ['results', 'assistant'].includes(currentStage) ? 'bg-green-100' : 'bg-gray-100'}`}>
                {['results', 'assistant'].includes(currentStage) ? '✓' : currentStage === 'quiz' ? '2' : '2'}
              </div>
              Quiz
            </div>
            <div className="w-8 h-1 bg-gray-200"></div>
            <div className={`flex items-center ${currentStage === 'results' ? 'text-purple-600 font-bold' : currentStage === 'assistant' ? 'text-green-500' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${currentStage === 'results' ? 'bg-purple-100' : currentStage === 'assistant' ? 'bg-green-100' : 'bg-gray-100'}`}>
                {currentStage === 'assistant' ? '✓' : currentStage === 'results' ? '3' : '3'}
              </div>
              Results
            </div>
            <div className="w-8 h-1 bg-gray-200"></div>
            <div className={`flex items-center ${currentStage === 'assistant' ? 'text-purple-600 font-bold' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${currentStage === 'assistant' ? 'bg-purple-100' : 'bg-gray-100'}`}>
                4
              </div>
              Assistant
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8">
          {/* Upload Stage */}
          {currentStage === 'upload' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">📁 Upload Your Math Questions</h2>
                <p className="text-gray-600 mb-6">
                  Drag and drop a .txt file with numbered questions (1., 2., 3., etc.)
                </p>
              </div>

              {/* File upload area */}
              <div
                className={`border-4 border-dashed rounded-xl p-12 text-center transition-all duration-200 ${
                  dragActive 
                    ? 'border-purple-400 bg-purple-50' 
                    : file 
                      ? 'border-green-400 bg-green-50' 
                      : 'border-gray-300 hover:border-purple-300'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {file ? (
                  <div className="space-y-4">
                    <div className="text-6xl">📄</div>
                    <p className="text-xl font-semibold text-green-600">{file.name}</p>
                    <p className="text-gray-600">File ready to upload!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-6xl">☁️</div>
                    <p className="text-xl font-semibold text-gray-700">
                      Drop your .txt file here or click to browse
                    </p>
                    <p className="text-gray-500">
                      Format: 1. First question 2. Second question 3. Third question...
                    </p>
                  </div>
                )}
                
                <input
                  type="file"
                  accept=".txt"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-block mt-4 px-6 py-3 bg-purple-500 text-white rounded-lg cursor-pointer hover:bg-purple-600 transition-colors"
                >
                  Browse Files
                </label>
              </div>

              {/* Settings */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Student Age
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="18"
                    value={age}
                    onChange={(e) => setAge(parseInt(e.target.value))}
                    className="w-full border-2 border-gray-200 rounded-lg p-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                  />
                </div>
                
                <div>
                  <ThemePicker selected={theme} onSelect={handleSelect} />
                </div>
              </div>

              {/* Choose Learning Mode */}
              <div className="text-center space-y-4">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">🚀 Ready to Start Learning!</h3>
                <div className="max-w-md mx-auto">
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-8 hover:border-indigo-400 transition-all">
                    <div className="text-center space-y-4">
                      <div className="text-6xl animate-bounce">🎯</div>
                      <h4 className="text-xl font-bold text-gray-800">Process Your Questions</h4>
                      <p className="text-gray-600">Get your questions ready for all learning modes!</p>
                      <button
                        onClick={processFileForAllModes}
                        disabled={!file || uploading}
                        className="w-full px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold rounded-lg disabled:opacity-50 hover:shadow-lg transition-all text-lg"
                      >
                        {uploading ? '🎨 Processing...' : '✨ Let\'s Go!'}
                      </button>
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-gray-500 mt-4">
                  📚 After processing, you can try all three learning modes with the same questions!
                </p>
              </div>
            </div>
          )}

          {/* Mode Selection Stage */}
          {currentStage === 'mode-select' && processedQuizData && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-4">🎯 Choose Your Learning Adventure!</h2>
                <p className="text-lg text-gray-600 mb-6">
                  Your questions are ready! Pick any mode below and switch anytime during your session.
                </p>
                <div className="bg-gradient-to-r from-green-100 to-blue-100 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-700">
                    <strong>✨ Theme:</strong> {theme} &nbsp;|&nbsp; <strong>📊 Questions:</strong> {processedQuizData.questions.length} &nbsp;|&nbsp; <strong>🎂 Age:</strong> {age}
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {/* Traditional Quiz Option */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6 hover:border-purple-400 transition-all cursor-pointer group transform hover:scale-105">
                  <div className="text-center space-y-4">
                    <div className="text-6xl group-hover:animate-bounce">📚</div>
                    <h4 className="text-xl font-bold text-gray-800">Traditional Quiz</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Step through questions with instant feedback and detailed explanations
                    </p>
                    <div className="flex flex-wrap gap-1 justify-center text-xs">
                      <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">📖 Step-by-step</span>
                      <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">💡 Explanations</span>
                    </div>
                    <button
                      onClick={startQuizMode}
                      className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                    >
                      📝 Start Quiz
                    </button>
                  </div>
                </div>

                {/* Motion Games Option */}
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-6 hover:border-blue-400 transition-all cursor-pointer group transform hover:scale-105">
                  <div className="text-center space-y-4">
                    <div className="text-6xl group-hover:animate-bounce">🎥</div>
                    <h4 className="text-xl font-bold text-gray-800">Motion Games</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Wave & move! Use your webcam to interact with math challenges
                    </p>
                    <div className="flex flex-wrap gap-1 justify-center text-xs">
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">📹 Webcam</span>
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">🏃 Active</span>
                    </div>
                    <button
                      onClick={startMotionGameMode}
                      className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                    >
                      🎥 Start Motion
                    </button>
                  </div>
                </div>

                {/* Minigame Option */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 hover:border-green-400 transition-all cursor-pointer group transform hover:scale-105">
                  <div className="text-center space-y-4">
                    <div className="text-6xl group-hover:animate-bounce">🎮</div>
                    <h4 className="text-xl font-bold text-gray-800">Custom Game</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Create unique interactive adventures with AI-generated games
                    </p>
                    <div className="flex flex-wrap gap-1 justify-center text-xs">
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded">🎨 Custom</span>
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded">🤖 AI-made</span>
                    </div>
                    <button
                      onClick={startMinigameMode}
                      className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                    >
                      🎮 Create Game
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="text-center mt-8">
                <button
                  onClick={() => setCurrentStage('upload')}
                  className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all"
                >
                  ← Back to Upload
                </button>
              </div>
            </div>
          )}

          {/* Quiz Stage */}
          {currentStage === 'quiz' && quizData && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                  🎯 Question {currentQuestionIndex + 1} of {quizData.questions.length}
                </h2>
                <div className="flex justify-center space-x-3 mb-4">
                  <button
                    onClick={() => setCurrentStage('mode-select')}
                    className="px-3 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all"
                  >
                    🔄 Change Mode
                  </button>
                  <button
                    onClick={startMotionGameMode}
                    className="px-3 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all"
                  >
                    � Motion Games
                  </button>
                  <button
                    onClick={startMinigameMode}
                    className="px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all"
                  >
                    🎮 Custom Game
                  </button>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${((currentQuestionIndex + 1) / quizData.questions.length) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Question */}
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-orange-400 p-6 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-3 text-lg">Math Challenge:</h3>
                    <p className="text-gray-700 text-lg leading-relaxed">
                      {quizData.questions[currentQuestionIndex].rewritten}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Your Answer:
                    </label>
                    <input
                      type="text"
                      value={currentAnswer}
                      onChange={(e) => setCurrentAnswer(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleQuestionAnswer()}
                      placeholder="Type your answer here..."
                      className="w-full border-2 border-gray-200 rounded-lg p-4 text-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                    />
                  </div>

                  <button
                    onClick={handleQuestionAnswer}
                    disabled={!currentAnswer.trim()}
                    className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-blue-500 text-white text-lg font-semibold rounded-lg disabled:opacity-50 hover:shadow-lg transition-all"
                  >
                    {currentQuestionIndex === quizData.questions.length - 1 ? '🏁 Finish Quiz!' : '➡️ Next Question'}
                  </button>
                </div>

                {/* Image */}
                <div className="flex items-center justify-center">
                  {quizData.questions[currentQuestionIndex].image_url ? (
                    <img
                      src={quizData.questions[currentQuestionIndex].image_url}
                      alt="Question illustration"
                      className="max-w-full h-auto rounded-lg shadow-lg"
                    />
                  ) : (
                    <div className="text-center text-gray-400">
                      <div className="text-8xl mb-4">🎨</div>
                      <p>Visual aid loading...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Results Stage */}
          {currentStage === 'results' && quizResult && (
            <div className="space-y-6 text-center">
              <div className="space-y-4">
                <h2 className="text-4xl font-bold text-gray-800">🎉 Quest Complete!</h2>
                
                {/* Score Display */}
                <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 text-white rounded-2xl p-8 max-w-md mx-auto">
                  <div className="text-6xl font-bold mb-2">{quizResult.score}</div>
                  <div className="text-2xl mb-1">out of {quizResult.total}</div>
                  <div className="text-lg opacity-90">{Math.round(quizResult.percentage)}% Score</div>
                </div>

                {/* Encouragement */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 border-l-4 border-green-400 p-6 rounded-lg max-w-2xl mx-auto">
                  <p className="text-xl text-gray-700 leading-relaxed">
                    {quizResult.encouragement}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center space-x-4 pt-6">
                  <button
                    onClick={() => setCurrentStage('assistant')}
                    className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-lg font-semibold rounded-xl hover:shadow-lg transition-all"
                  >
                    🤖 Chat with Assistant
                  </button>
                  <button
                    onClick={() => setCurrentStage('minigame')}
                    className="px-8 py-4 bg-gradient-to-r from-green-500 to-blue-500 text-white text-lg font-semibold rounded-xl hover:shadow-lg transition-all"
                  >
                    🎮 Play Minigame
                  </button>
                  <button
                    onClick={resetQuiz}
                    className="px-8 py-4 bg-gradient-to-r from-gray-500 to-gray-600 text-white text-lg font-semibold rounded-xl hover:shadow-lg transition-all"
                  >
                    🔄 New Quest
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Assistant Stage */}
          {currentStage === 'assistant' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                  🤖 {theme} Math Assistant
                </h2>
                <p className="text-gray-600">
                  Ask me anything about math! I'm here to help you learn and grow.
                </p>
                <div className="flex justify-center space-x-3 mt-4">
                  <button
                    onClick={() => setCurrentStage('mode-select')}
                    className="px-3 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all"
                  >
                    🔄 Change Mode
                  </button>
                  <button
                    onClick={startQuizMode}
                    className="px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all"
                  >
                    📝 Quiz Mode
                  </button>
                  <button
                    onClick={startMotionGameMode}
                    className="px-3 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all"
                  >
                    🎥 Motion Games
                  </button>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 h-96 overflow-y-auto space-y-4">
                {chatHistory.length === 0 && (
                  <div className="text-center text-gray-500 mt-20">
                    <div className="text-6xl mb-4">🎭</div>
                    <p>Hello there! I'm your {theme.toLowerCase()} math buddy. What would you like to explore?</p>
                  </div>
                )}
                
                {chatHistory.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                      msg.role === 'user' 
                        ? 'bg-purple-500 text-white' 
                        : 'bg-white text-gray-800 shadow-md'
                    }`}>
                      <p className="leading-relaxed">{msg.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {msg.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white text-gray-800 shadow-md px-4 py-2 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                  placeholder="Ask me about math..."
                  className="flex-1 border-2 border-gray-200 rounded-lg p-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                />
                <button
                  onClick={sendChatMessage}
                  disabled={chatLoading || !chatMessage.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg disabled:opacity-50 hover:shadow-lg transition-all"
                >
                  Send ✨
                </button>
              </div>

              <div className="text-center pt-4">
                <button
                  onClick={resetQuiz}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  🔄 Start New Quest
                </button>
              </div>
            </div>
          )}

          {/* Minigame Stage */}
          {currentStage === 'minigame' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                  🎮 {theme} Math Minigame
                </h2>
                <div className="flex justify-center space-x-3 mb-4">
                  <button
                    onClick={() => setCurrentStage('mode-select')}
                    className="px-3 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all"
                  >
                    🔄 Change Mode
                  </button>
                  <button
                    onClick={startQuizMode}
                    className="px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all"
                  >
                    � Quiz Mode
                  </button>
                  <button
                    onClick={startMotionGameMode}
                    className="px-3 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all"
                  >
                    🎥 Motion Games
                  </button>
                </div>
                <p className="text-gray-600">
                  Describe what kind of interactive game you'd like based on your quiz questions!
                </p>
              </div>

              {!generatedGame ? (
                <div className="space-y-6">
                  {/* Game Prompt Input */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      What simple game would you like? (Keep it simple!)
                    </label>
                    <textarea
                      value={gamePrompt}
                      onChange={(e) => setGamePrompt(e.target.value)}
                      placeholder="e.g., 'Click the right number to feed the space cat', 'Pop colorful balloons with correct answers', 'Help the dinosaur find the right door by clicking the answer', 'Match cards by clicking two with the same number'"
                      rows={4}
                      className="w-full border-2 border-gray-200 rounded-lg p-4 text-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 resize-none"
                    />
                  </div>

                  {/* Generate Button */}
                  <div className="text-center">
                    <button
                      onClick={generateMinigame}
                      disabled={!gamePrompt.trim() || gameLoading}
                      className="px-12 py-4 bg-gradient-to-r from-green-500 to-blue-500 text-white text-xl font-semibold rounded-xl disabled:opacity-50 hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                    >
                      {gameLoading ? '🎨 Creating Your Game...' : '🚀 Generate Minigame!'}
                    </button>
                  </div>

                  {/* Example Ideas */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-400 p-6 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-3">💡 Simple Game Ideas:</h3>
                    <ul className="text-gray-700 space-y-2">
                      <li>� <strong>Feed the Cat:</strong> Click the right number to give the cat food</li>
                      <li>� <strong>Pop the Balloons:</strong> Click balloons with correct answers to pop them</li>
                      <li>� <strong>Choose the Door:</strong> Help your character find the right door by clicking answers</li>
                      <li>� <strong>Collect the Stars:</strong> Click on stars with the right numbers to collect them</li>
                      <li>🧩 <strong>Match the Cards:</strong> Click two cards with the same answer to match them</li>
                      <li>🚗 <strong>Drive the Car:</strong> Click the right answer to make your car move forward</li>
                      <li>🎯 <strong>Hit the Target:</strong> Click the correct answer to hit the bullseye</li>
                      <li>� <strong>Paint the Rainbow:</strong> Click colors in the right order using math</li>
                    </ul>
                    <p className="text-sm text-gray-600 mt-3 italic bg-yellow-50 p-2 rounded">
                      ✨ <strong>Remember:</strong> Simple clicking + Big buttons + Happy sounds = Perfect for SEN students!
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Generated Game Display */}
                  <div className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 flex justify-between items-center">
                      <h3 className="font-semibold text-gray-800">🎮 Your Interactive Math Game</h3>
                      <button
                        onClick={() => {
                          setGeneratedGame('');
                          setGamePrompt('');
                        }}
                        className="text-sm px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
                      >
                        🔄 Create New Game
                      </button>
                    </div>
                    <div 
                      className="w-full h-96 border-0"
                      dangerouslySetInnerHTML={{ __html: generatedGame }}
                    />
                  </div>

                  {/* Fullscreen Option */}
                  <div className="text-center">
                    <button
                      onClick={() => {
                        const newWindow = window.open('', '_blank');
                        if (newWindow) {
                          newWindow.document.write(generatedGame);
                          newWindow.document.close();
                        }
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                    >
                      🖥️ Open in Full Screen
                    </button>
                  </div>
                </div>
              )}

              <div className="text-center pt-4">
                <button
                  onClick={resetQuiz}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  🔄 Start New Quest
                </button>
              </div>
            </div>
          )}

          {/* Motion Game Stage */}
          {currentStage === 'motion-game' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                  🎥 {theme} Motion Games
                </h2>
                <div className="flex justify-center space-x-3 mb-4">
                  <button
                    onClick={() => setCurrentStage('mode-select')}
                    className="px-3 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all"
                  >
                    🔄 Change Mode
                  </button>
                  <button
                    onClick={startQuizMode}
                    className="px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all"
                  >
                    � Quiz Mode
                  </button>
                  <button
                    onClick={startMinigameMode}
                    className="px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all"
                  >
                    🎮 Custom Game
                  </button>
                </div>
                <p className="text-gray-600">
                  👋 Wave & move to solve math! 📹 Camera needed for motion detection.
                </p>
              </div>

              {/* Motion Game Container */}
              <div className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 flex justify-between items-center">
                  <h3 className="font-semibold text-gray-800">🎥 Motion-Based Math Games</h3>
                  <div className="text-sm text-gray-600">
                    Camera required • Make sure you have good lighting
                  </div>
                </div>
                <div id="motion-game-container" style={{ minHeight: '600px' }}>
                  {/* Motion game controller will be injected here */}
                </div>
              </div>

              <div className="text-center pt-4">
                <button
                  onClick={resetQuiz}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  🔄 Start New Quest
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Loading Animation */}
      {(uploading || chatLoading || gameLoading || motionGameLoading) && (
        <LoadingAnimation 
          type={loadingType} 
          theme={theme} 
          message={loadingMessage}
        />
      )}
    </div>
  );
}
