# Math Buddy Backend

The backe4. **Test your setup:**
   ```bash
   python test_local_models.py
   ```

5. **Test reasoning model cleanup:**
   ```bash
   python demo_reasoning.py
   ```

6. **Start the server:**vice for Math Buddy, supporting both cloud APIs and local models for cost-effective and private operation. **Now with reasoning model support** - automatically cleans up thinking tags for professional output.

## Features

### LLM (Language Model) Support
- **Cloud**: GitHub Models API (GPT-4 mini) 
- **Local**: Ollama with reasoning models (gemma3:1b, phi4-mini-reasoning, etc.)
- **Reasoning Support**: Automatically removes `<think>` and `<thinking>` tags
- **Markdown Formatting**: Ensures clean, properly formatted output
- **Fallback**: Mock responses when no API keys are available

### Image Generation Support
- **Cloud**: HuggingFace Stable Diffusion API
- **Local**: DrawThings or Stable Diffusion WebUI API
- **Fallback**: Placeholder images when no API keys are available

## Quick Start

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your preferred setup
   ```

3. **Test your setup:**
   ```bash
   python test_local_models.py
   ```

4. **Start the server:**
   ```bash
   cd ..
   uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
   ```

## Reasoning Model Support

Math Buddy now supports reasoning models like `gemma3:1b` and `phi4-mini-reasoning`. These models show their "thinking process" in `<think>` or `<thinking>` tags, which are automatically cleaned up for professional output.

### Example: Before and After

**Raw model output:**
```
<think>I need to make this engaging for ADHD students...</think>

# 🚀 Space Adventure Math!
Captain Sarah has **5 rockets** and finds **3 more**...
```

**Cleaned output (what users see):**
```markdown
# 🚀 Space Adventure Math!
Captain Sarah has **5 rockets** and finds **3 more**...
```

### Supported Reasoning Tags
- `<think>content</think>`
- `<thinking>content</thinking>`
- Mixed case variants
- Orphaned/mismatched tags

## Configuration Options

### Fully Local (No API Keys Needed)
```bash
USE_LOCAL_LLM=true
USE_LOCAL_IMAGE=true
```

### Cloud Only (API Keys Required)
```bash
USE_LOCAL_LLM=false
USE_LOCAL_IMAGE=false
GITHUB_TOKEN=your_token_here
HF_TOKEN=your_token_here
```

### Hybrid (Mix and Match)
```bash
USE_LOCAL_LLM=true
USE_LOCAL_IMAGE=false
HF_TOKEN=your_token_here
```

## API Endpoints

- `POST /api/rewrite` - Rewrite math questions with themes
- `POST /api/chat` - Chat with Math Buddy AI
- `POST /api/image` - Generate educational images
- `GET /static/images/{filename}` - Serve generated images
- `GET /api/test-static` - Test static file setup

## Local Model Setup

### Ollama (LLM)
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull the model
ollama pull phi4-mini-reasoning:latest

# Start service
ollama serve
```

### DrawThings (Images)
- **macOS**: Download from App Store
- **Other platforms**: Use Stable Diffusion WebUI with `--api` flag

## Troubleshooting

Run the test script to diagnose issues:
```bash
python test_local_models.py
```

Common issues:
- **Ollama not found**: Ensure Ollama is installed and running
- **Model not available**: Pull the model with `ollama pull`
- **DrawThings connection**: Check if API is enabled and accessible
- **Slow responses**: Local models may be slower than cloud APIs

## Development

The backend uses FastAPI with async support for optimal performance with both local and cloud models.

### Service Architecture
- `services/llm.py` - Language model abstraction
- `services/image.py` - Image generation abstraction
- `main.py` - FastAPI application with CORS and static file serving

### Adding New Models
1. Add configuration in service files
2. Implement the API client function
3. Update the main generation functions to use new models
4. Add tests to `test_local_models.py`

## Performance Notes

- **Local models**: Higher privacy, no usage costs, but require local resources
- **Cloud APIs**: Higher quality, faster setup, but usage costs and internet dependency
- **Hybrid**: Best of both worlds - use local for privacy-sensitive tasks, cloud for quality
