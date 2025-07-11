'use client';
import { useState } from 'react';
import { ThemePicker } from '../components/ThemePicker';

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

type AppStage = 'upload' | 'quiz' | 'results' | 'assistant';

export default function Home() {
  // Stage management
  const [currentStage, setCurrentStage] = useState<AppStage>('upload');
  
  // Upload stage
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [theme, setTheme] = useState('Space Pirates');
  const [age, setAge] = useState(10);
  const [uploading, setUploading] = useState(false);
  
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

  const uploadAndCreateQuiz = async () => {
    if (!file) return;
    
    setUploading(true);
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
      setQuizData(data);
      setCurrentStage('quiz');
      playSound('success');
    } catch (error) {
      alert('Error creating quiz. Please try again.');
      playSound('error');
    } finally {
      setUploading(false);
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

              {/* Create Quiz Button */}
              <div className="text-center">
                <button
                  onClick={uploadAndCreateQuiz}
                  disabled={!file || uploading}
                  className="px-12 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xl font-semibold rounded-xl disabled:opacity-50 hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                >
                  {uploading ? '🎨 Creating Your Quest...' : '🚀 Start Math Quest!'}
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
        </div>
      </div>
    </div>
  );
}
