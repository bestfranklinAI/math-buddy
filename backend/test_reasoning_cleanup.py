#!/usr/bin/env python3
"""
Test script for reasoning output cleaning functionality
"""

import sys
import os
sys.path.append(os.path.dirname(__file__))

from services.llm import clean_reasoning_output

def test_cleaning():
    """Test the clean_reasoning_output function with various inputs"""
    
    test_cases = [
        {
            "name": "Basic thinking tags",
            "input": "<think>Let me think about this...</think>The answer is 4.",
            "expected": "The answer is 4."
        },
        {
            "name": "Thinking tags with content",
            "input": "<thinking>2 + 2 = 4 because...</thinking>\n\n**The answer is 4**",
            "expected": "**The answer is 4**"
        },
        {
            "name": "Multiple thinking sections",
            "input": "<think>First thought</think>Some content<think>Second thought</think>More content",
            "expected": "Some content More content"
        },
        {
            "name": "Mixed case tags",
            "input": "<THINK>uppercase</THINK>Content<Think>mixed</Think>Final",
            "expected": "Content Final"
        },
        {
            "name": "Math question rewrite",
            "input": "<think>I need to make this engaging...</think>\n\n# 🚀 Space Adventure Math!\n\nCaptain Sarah has **5 rockets** and finds **3 more** in the asteroid field. How many rockets does she have now?",
            "expected": "# 🚀 Space Adventure Math!\n\nCaptain Sarah has **5 rockets** and finds **3 more** in the asteroid field. How many rockets does she have now?"
        },
        {
            "name": "Chat response with formatting",
            "input": "<thinking>The student needs help with fractions...</thinking>\n\nHi there! 😊\n\nLet's work on fractions together.\n\n- First, we'll look at the **numerator** (top number)\n- Then, we'll check the **denominator** (bottom number)\n\nWhat fraction are you working on?",
            "expected": "Hi there! 😊\n\nLet's work on fractions together.\n\n- First, we'll look at the **numerator** (top number)\n- Then, we'll check the **denominator** (bottom number)\n\nWhat fraction are you working on?"
        },
        {
            "name": "No thinking tags",
            "input": "This is a normal response without any thinking tags.",
            "expected": "This is a normal response without any thinking tags."
        },
        {
            "name": "Empty input",
            "input": "",
            "expected": ""
        },
        {
            "name": "Orphaned tags",
            "input": "Some content <think> orphaned content </thinking> more content",
            "expected": "Some content more content"
        }
    ]
    
    print("🧪 Testing Reasoning Output Cleaning")
    print("=" * 50)
    
    passed = 0
    failed = 0
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\nTest {i}: {test_case['name']}")
        print("-" * 30)
        
        result = clean_reasoning_output(test_case['input'])
        
        if result == test_case['expected']:
            print("✅ PASS")
            passed += 1
        else:
            print("❌ FAIL")
            print(f"Input:    {repr(test_case['input'])}")
            print(f"Expected: {repr(test_case['expected'])}")
            print(f"Got:      {repr(result)}")
            failed += 1
    
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {passed} passed, {failed} failed")
    
    if failed == 0:
        print("🎉 All tests passed!")
    else:
        print(f"⚠️  {failed} tests failed")
    
    return failed == 0

def test_markdown_formatting():
    """Test markdown formatting improvements"""
    
    print("\n🎨 Testing Markdown Formatting")
    print("=" * 50)
    
    test_input = """<think>This needs formatting</think>

# Math Problem
Here's a problem
- Item 1
- Item 2

## Solution
The answer is 42.

### Steps
1. First step
2. Second step


Final answer: **42**"""
    
    expected_structure = [
        "# Math Problem",
        "Here's a problem",
        "",  # Blank line before list
        "- Item 1",
        "- Item 2",
        "",  # Blank line before header
        "## Solution",
        "The answer is 42.",
        "",  # Blank line before header
        "### Steps",
        "",  # Blank line before numbered list
        "1. First step",
        "2. Second step",
        "",
        "Final answer: **42**"
    ]
    
    result = clean_reasoning_output(test_input)
    print("Formatted output:")
    print("-" * 20)
    print(result)
    print("-" * 20)
    
    # Check if the structure is reasonable
    lines = result.split('\n')
    has_headers = any(line.startswith('#') for line in lines)
    has_lists = any(line.startswith(('-', '*', '+')) or line.strip().startswith(tuple('123456789')) and '.' in line for line in lines)
    no_think_tags = '<think>' not in result and '</think>' not in result
    
    print(f"✅ Has headers: {has_headers}")
    print(f"✅ Has lists: {has_lists}")
    print(f"✅ No thinking tags: {no_think_tags}")
    
    return has_headers and has_lists and no_think_tags

if __name__ == "__main__":
    basic_tests_passed = test_cleaning()
    formatting_tests_passed = test_markdown_formatting()
    
    if basic_tests_passed and formatting_tests_passed:
        print("\n🎉 All reasoning output cleaning tests passed!")
        sys.exit(0)
    else:
        print("\n❌ Some tests failed!")
        sys.exit(1)
