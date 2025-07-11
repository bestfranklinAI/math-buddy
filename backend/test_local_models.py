#!/usr/bin/env python3
"""
Test script to verify local model setup for Math Buddy
Run this script to check if your local models (Ollama and DrawThings) are working correctly.
"""

import asyncio
import aiohttp
import json
import os
import sys
from typing import Dict, Any

# Test configuration
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "phi4-mini-reasoning:latest")
DRAWTHINGS_URL = os.getenv("DRAWTHINGS_URL", "http://127.0.0.1:7860/sdapi/v1/txt2img")

def print_status(test_name: str, success: bool, message: str = ""):
    """Print test status with colored output"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status} {test_name}")
    if message:
        print(f"    {message}")
    print()

async def test_ollama() -> bool:
    """Test Ollama LLM service"""
    print("🧠 Testing Ollama LLM...")
    
    try:
        # Test connection
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=10)) as session:
            async with session.get(f"{OLLAMA_URL}/api/tags") as response:
                if response.status != 200:
                    print_status("Ollama Connection", False, f"Server responded with status {response.status}")
                    return False
                
                data = await response.json()
                models = [model.get("name", "") for model in data.get("models", [])]
                
                if OLLAMA_MODEL not in models:
                    print_status("Ollama Model", False, f"Model '{OLLAMA_MODEL}' not found. Available models: {', '.join(models)}")
                    return False
                
                print_status("Ollama Connection", True, f"Connected to {OLLAMA_URL}")
                print_status("Ollama Model", True, f"Model '{OLLAMA_MODEL}' is available")
        
        # Test generation
        print("Testing text generation...")
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=60)) as session:
            payload = {
                "model": OLLAMA_MODEL,
                "prompt": "What is 2 + 2? Please answer briefly.",
                "stream": False
            }
            
            async with session.post(f"{OLLAMA_URL}/api/generate", json=payload) as response:
                if response.status != 200:
                    print_status("Ollama Generation", False, f"Generation failed with status {response.status}")
                    return False
                
                data = await response.json()
                response_text = data.get("response", "").strip()
                
                if not response_text:
                    print_status("Ollama Generation", False, "Empty response received")
                    return False
                
                print_status("Ollama Generation", True, f"Response: {response_text[:100]}...")
                return True
                
    except aiohttp.ClientConnectorError:
        print_status("Ollama Connection", False, f"Could not connect to {OLLAMA_URL}. Is Ollama running?")
        return False
    except asyncio.TimeoutError:
        print_status("Ollama Generation", False, "Request timed out. Model might be loading or too slow.")
        return False
    except Exception as e:
        print_status("Ollama Test", False, f"Unexpected error: {str(e)}")
        return False

async def test_drawthings() -> bool:
    """Test DrawThings/Stable Diffusion API"""
    print("🎨 Testing DrawThings Image Generation...")
    
    try:
        # Test basic connection first
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=10)) as session:
            # Some SD APIs have a health check endpoint
            try:
                async with session.get(f"{DRAWTHINGS_URL.replace('/sdapi/v1/txt2img', '')}/docs") as response:
                    if response.status == 200:
                        print_status("DrawThings Connection", True, "API documentation accessible")
                    else:
                        print_status("DrawThings Connection", True, "Service responding (no docs endpoint)")
            except:
                # If docs don't exist, that's fine, we'll test the main endpoint
                pass
        
        # Test image generation
        print("Testing image generation...")
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=120)) as session:
            params = {
                "prompt": "simple test image, red circle",
                "negative_prompt": "(worst quality, low quality)",
                "seed": -1,
                "steps": 10,  # Low steps for faster testing
                "guidance_scale": 4,
                "batch_count": 1,
                "width": 256,  # Small size for faster testing
                "height": 256
            }
            
            async with session.post(
                DRAWTHINGS_URL,
                headers={'Content-Type': 'application/json'},
                json=params
            ) as response:
                if response.status != 200:
                    error_text = await response.text()
                    print_status("DrawThings Generation", False, f"Generation failed: {error_text[:200]}")
                    return False
                
                data = await response.json()
                
                if not data.get("images") or len(data["images"]) == 0:
                    print_status("DrawThings Generation", False, "No images generated")
                    return False
                
                # Check if we got a valid base64 image
                image_data = data["images"][0]
                if len(image_data) < 100:  # Basic sanity check for base64 data
                    print_status("DrawThings Generation", False, "Image data seems too small")
                    return False
                
                print_status("DrawThings Generation", True, f"Generated image ({len(image_data)} bytes base64)")
                return True
                
    except aiohttp.ClientConnectorError:
        print_status("DrawThings Connection", False, f"Could not connect to {DRAWTHINGS_URL}. Is DrawThings/SD WebUI running?")
        return False
    except asyncio.TimeoutError:
        print_status("DrawThings Generation", False, "Request timed out. Image generation might be slow.")
        return False
    except Exception as e:
        print_status("DrawThings Test", False, f"Unexpected error: {str(e)}")
        return False

async def test_services_integration():
    """Test the actual service functions"""
    print("🔧 Testing Math Buddy Services Integration...")
    
    try:
        # Import and test our services
        sys.path.append(os.path.dirname(__file__))
        from services.llm import rewrite_question, MOCK as LLM_MOCK, USE_LOCAL_LLM
        from services.image import generate_image, MOCK as IMAGE_MOCK, USE_LOCAL_IMAGE
        
        print(f"LLM Config: Local={USE_LOCAL_LLM}, Mock={LLM_MOCK}")
        print(f"Image Config: Local={USE_LOCAL_IMAGE}, Mock={IMAGE_MOCK}")
        print()
        
        # Test LLM service
        if not LLM_MOCK:
            try:
                result = await rewrite_question("What is 5 + 3?", "space", 8)
                print_status("LLM Service Integration", True, f"Rewritten question: {result[:100]}...")
            except Exception as e:
                print_status("LLM Service Integration", False, f"Error: {str(e)}")
        else:
            print_status("LLM Service Integration", True, "Using mock mode (no API keys)")
        
        # Test Image service
        if not IMAGE_MOCK:
            try:
                result = await generate_image("test math problem", "colorful", "default")
                success = result.get("status") == "success"
                message = result.get("message", "")
                print_status("Image Service Integration", success, message)
            except Exception as e:
                print_status("Image Service Integration", False, f"Error: {str(e)}")
        else:
            print_status("Image Service Integration", True, "Using mock mode (no API keys)")
        
    except ImportError as e:
        print_status("Service Import", False, f"Could not import services: {str(e)}")

def print_setup_recommendations():
    """Print recommendations based on test results"""
    print("📋 Setup Recommendations:")
    print()
    print("For Ollama:")
    print("  • Install: curl -fsSL https://ollama.ai/install.sh | sh")
    print("  • Pull model: ollama pull phi4-mini-reasoning:latest")
    print("  • Start service: ollama serve")
    print()
    print("For DrawThings (macOS):")
    print("  • Download from App Store: https://apps.apple.com/app/drawthings/id1583081086")
    print("  • Enable API in preferences")
    print()
    print("For Stable Diffusion WebUI (other platforms):")
    print("  • Clone: git clone https://github.com/AUTOMATIC1111/stable-diffusion-webui.git")
    print("  • Launch: ./webui.sh --api --listen --port 7860")
    print()
    print("Environment Variables:")
    print("  • Set USE_LOCAL_LLM=true to use Ollama")
    print("  • Set USE_LOCAL_IMAGE=true to use DrawThings")
    print()

async def main():
    """Main test function"""
    print("🧮 Math Buddy Local Model Test")
    print("=" * 50)
    print()
    
    # Check environment variables
    print("📋 Configuration:")
    print(f"  Ollama URL: {OLLAMA_URL}")
    print(f"  Ollama Model: {OLLAMA_MODEL}")
    print(f"  DrawThings URL: {DRAWTHINGS_URL}")
    print()
    
    # Run tests
    ollama_success = await test_ollama()
    drawthings_success = await test_drawthings()
    
    print("=" * 50)
    
    # Integration tests
    await test_services_integration()
    
    print("=" * 50)
    
    # Summary
    total_tests = 2
    passed_tests = sum([ollama_success, drawthings_success])
    
    print(f"📊 Test Summary: {passed_tests}/{total_tests} services working")
    
    if passed_tests == total_tests:
        print("🎉 All local models are working correctly!")
        print("You can set USE_LOCAL_LLM=true and USE_LOCAL_IMAGE=true in your .env file")
    elif passed_tests > 0:
        print("⚠️  Some services are working. You can use a hybrid setup:")
        if ollama_success:
            print("   • Set USE_LOCAL_LLM=true for local language model")
        if drawthings_success:
            print("   • Set USE_LOCAL_IMAGE=true for local image generation")
    else:
        print("❌ No local models are working. Consider:")
        print("   • Using cloud APIs (GitHub Models + HuggingFace)")
        print("   • Setting up local models using the recommendations below")
    
    print()
    print_setup_recommendations()

if __name__ == "__main__":
    asyncio.run(main())
