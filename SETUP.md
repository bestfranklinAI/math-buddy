# 🧮 Math Buddy - Interactive Demo Setup

A fun, colorful, and intuitive math learning application for ADHD and dyslexic students. Supports both cloud APIs (GitHub Models + Hugging Face) and local models (Ollama + DrawThings) for cost-effective and private operation.

## ✨ Features

- 📝 **Math Question Rewriter**: Transform boring math problems into engaging stories with fun themes
- 💬 **Interactive Chat**: Get step-by-step help from Math Buddy AI
- 🎨 **Image Generator**: Create visual aids to help explain math concepts
- 🌈 **Colorful UI**: Designed for neurodivergent learners with intuitive interface
- 🏠 **Local Model Support**: Run completely offline with Ollama and DrawThings
- ☁️ **Cloud API Support**: Use powerful online models with GitHub Models and Hugging Face
- 🧠 **Reasoning Model Support**: Automatically cleans `<think>` tags from reasoning models

## 🚀 Quick Setup

Choose your preferred setup method:

### Option 1: 🏠 Local Models (No API Keys Needed)
- **LLM**: Ollama with phi4-mini-reasoning model
- **Images**: DrawThings (Stable Diffusion)
- **Pros**: Free, private, offline-capable
- **Cons**: Requires local setup, moderate hardware requirements

### Option 2: ☁️ Cloud APIs (API Keys Required)
- **LLM**: GitHub Models (GPT-4 mini)
- **Images**: Hugging Face (Stable Diffusion)
- **Pros**: High quality, no local setup needed
- **Cons**: Requires API keys, usage costs

### Option 3: 🔄 Hybrid (Best of Both)
- Mix local and cloud models based on your needs
- Example: Local LLM + Cloud images, or vice versa

### Prerequisites

**For All Setups:**
- Node.js 18+ and npm
- Python 3.8+

**For Local LLM (Option 1 or 3):**
- [Ollama](https://ollama.ai/) installed
- phi4-mini-reasoning model downloaded

**For Local Images (Option 1 or 3):**
- [DrawThings](https://drawthings.ai/) or compatible Stable Diffusion API server

**For Cloud APIs (Option 2 or 3):**
- GitHub Personal Access Token (for GitHub Models API)
- Hugging Face API Token (for image generation)

### 1. Local Model Setup (Optional)

#### Setting up Ollama for LLM

```bash
# Install Ollama (macOS)
curl -fsSL https://ollama.ai/install.sh | sh

# Or download from https://ollama.ai/

# Pull the phi4-mini-reasoning model
ollama pull phi4-mini-reasoning:latest

# Start Ollama service (if not auto-started)
ollama serve
```

#### Setting up DrawThings for Image Generation

1. **For macOS**: Download [DrawThings](https://drawthings.ai/) from the App Store
2. **For other platforms**: Set up a Stable Diffusion WebUI API server:
   ```bash
   # Clone AUTOMATIC1111's webui
   git clone https://github.com/AUTOMATIC1111/stable-diffusion-webui.git
   cd stable-diffusion-webui
   
   # Launch with API enabled
   ./webui.sh --api --listen --port 7860
   ```

### 2. Environment Variables

#### Option A: Interactive Configuration (Recommended)
Use our interactive setup script to generate your `.env` file:

```bash
cd backend
python configure.py
```

This script will:
- Guide you through choosing local vs cloud models
- Help you set up the appropriate configuration
- Generate a properly formatted `.env` file
- Provide next steps for your chosen setup

#### Option B: Manual Configuration

Create and edit a `.env` file in the backend directory:
cp .env.example .env
```

Edit your `.env` file based on your chosen setup:

#### For Local Models Only:
```bash
# Use local models (no API keys needed)
USE_LOCAL_LLM=true
USE_LOCAL_IMAGE=true

# Local service URLs (defaults shown)
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=phi4-mini-reasoning:latest
DRAWTHINGS_URL=http://127.0.0.1:7860/sdapi/v1/txt2img

# Backend URL
BACKEND_URL=http://localhost:8000
```

#### For Cloud APIs Only:
```bash
# Use cloud APIs
USE_LOCAL_LLM=false
USE_LOCAL_IMAGE=false

# Required: GitHub Models API
GITHUB_TOKEN=your_github_personal_access_token_here

# Required: Hugging Face API for image generation
HF_TOKEN=your_huggingface_api_token_here
HF_API_URL=https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-3.5-large-turbo

# Backend URL
BACKEND_URL=http://localhost:8000
```

#### For Hybrid Setup (Local LLM + Cloud Images):
```bash
# Use local LLM, cloud images
USE_LOCAL_LLM=true
USE_LOCAL_IMAGE=false

# Local LLM settings
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=phi4-mini-reasoning:latest

# Cloud image generation
HF_TOKEN=your_huggingface_api_token_here

# Backend URL
BACKEND_URL=http://localhost:8000
```

### 3. Backend Setup

```bash
# Install Python dependencies
cd backend
pip install -r requirements.txt

# Start the FastAPI server
cd ..
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at `http://localhost:8000`

### 4. Frontend Setup

```bash
# Install Node.js dependencies
cd frontend
npm install

# Start the development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

## 🔍 Verifying Local Model Setup

### Quick Test Script
We provide a comprehensive test script to verify your local setup:

```bash
# Navigate to backend directory
cd backend

# Run the test script
python test_local_models.py
```

This script will:
- ✅ Check if Ollama is running and has the required model
- ✅ Test text generation with your LLM
- ✅ Check if DrawThings/SD WebUI is accessible
- ✅ Test image generation
- ✅ Verify integration with Math Buddy services
- 📋 Provide setup recommendations if issues are found

### Manual Testing

#### Test Ollama LLM
```bash
# Test if Ollama is running and model is available
curl http://localhost:11434/api/generate -d '{
  "model": "phi4-mini-reasoning:latest",
  "prompt": "What is 2+2?",
  "stream": false
}'
```

#### Test DrawThings Image Generation
```bash
# Test if DrawThings API is accessible
curl -X POST http://127.0.0.1:7860/sdapi/v1/txt2img \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "a simple math equation",
    "steps": 10,
    "width": 512,
    "height": 512
  }'
```

## 🎯 How to Get API Tokens

### GitHub Token (Required)

1. Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token" → "Generate new token (classic)"
3. Give it a name like "Math Buddy API"
4. Select scopes: No special scopes needed for GitHub Models
5. Click "Generate token"
6. Copy the token and add it to your `.env` file

### Hugging Face Token (Optional)

1. Go to [Hugging Face Settings > Access Tokens](https://huggingface.co/settings/tokens)
2. Click "New token"
3. Choose "Read" access level
4. Give it a name like "Math Buddy Images"
5. Click "Create token"
6. Copy the token and add it to your `.env` file

**Note**: Without the HF token, image generation will show placeholder images but all other features will work.

## 🎮 Usage Guide

### Math Question Rewriter
1. Enter any math question in the text area
2. Select student age (5-18)
3. Choose a fun theme (Space Pirates, Dinosaurs, etc.)
4. Click "Transform Question" to see the rewritten version

### Chat Helper
1. Click the "Chat Helper" tab
2. Ask math questions or request help
3. Get step-by-step explanations in simple language

### Image Generator
1. Click the "Image Generator" tab
2. Describe what you want to visualize
3. Choose image format and theme
4. Click "Generate Image" to create visual aids

## 🛠️ Development

### Backend API Endpoints

- `POST /api/rewrite` - Rewrite math questions with themes
- `POST /api/chat` - Chat with Math Buddy AI
- `POST /api/image` - Generate educational images
- `GET /static/images/{filename}` - Serve generated images

### Frontend Structure

- `src/app/page.tsx` - Main application with tabbed interface
- `src/components/ThemePicker.tsx` - Colorful theme selection component
- `src/app/globals.css` - Custom animations and styling

## 🎨 Customization

### Adding New Themes

Edit `frontend/src/components/ThemePicker.tsx`:

```tsx
const themes = [
  { label: 'Your Theme', emoji: '🎭', color: 'from-color1 to-color2' },
  // ... existing themes
];
```

### Modifying AI Prompts

Edit `backend/services/llm.py`:

```python
SYSTEM_PROMPT_REWRITE = "Your custom rewrite prompt..."
SYSTEM_PROMPT_CHAT = "Your custom chat prompt..."
```

## 🚨 Troubleshooting

### Backend Issues
- **Port 8000 in use**: Change port with `--port 8001`
- **Module not found**: Run `pip install -r requirements.txt`
- **API errors**: Check your tokens in `.env` file

### Frontend Issues
- **Port 3000 in use**: Next.js will automatically use the next available port
- **API connection**: Ensure backend is running on port 8000
- **Module errors**: Run `npm install`

### Local Model Issues

#### Ollama Problems
- **Connection refused**: Ensure Ollama is running with `ollama serve`
- **Model not found**: Pull the model with `ollama pull phi4-mini-reasoning:latest`
- **Slow responses**: phi4-mini-reasoning is a reasoning model and may be slower than simpler models
- **Memory issues**: Ensure you have enough RAM (8GB+ recommended)

#### DrawThings Problems
- **API not accessible**: Ensure DrawThings is running with API enabled
- **Wrong URL**: Check if the API is running on port 7860
- **CORS issues**: Some SD WebUI setups require `--cors-allow-origins=*` flag
- **Model not loaded**: Ensure a Stable Diffusion model is loaded in DrawThings/WebUI

### Cloud API Issues
- **GitHub Models error**: Verify your GitHub token has access to GitHub Models
- **Image generation fails**: Check HF_TOKEN or switch to local images
- **Rate limiting**: Cloud APIs have usage limits; consider local models for heavy usage
- **CORS errors**: Backend CORS is configured for all origins in development

### Hybrid Setup Issues
- **Partial failures**: Check which service (local/cloud) is failing in the logs
- **Configuration conflicts**: Ensure environment variables are set correctly
- **Fallback not working**: The app will show error messages if a service fails

## 📚 API Documentation

Once the backend is running, visit:
- API docs: `http://localhost:8000/docs`
- OpenAPI spec: `http://localhost:8000/openapi.json`

## 🤝 Contributing

This is an educational demo project. Feel free to:
- Add new themes and visual enhancements
- Improve accessibility features
- Add voice synthesis for audio support
- Enhance the AI prompts for better educational content

## 📝 License

MIT License - see LICENSE file for details.
