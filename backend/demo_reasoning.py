#!/usr/bin/env python3
"""
Demo script showing reasoning output cleaning in action
This demonstrates how the Math Buddy system handles reasoning models like gemma3:1b
"""

import sys
import os
sys.path.append(os.path.dirname(__file__))

from services.llm import clean_reasoning_output

def demo_reasoning_cleanup():
    """Demonstrate reasoning output cleaning with realistic examples"""
    
    print("🧮 Math Buddy - Reasoning Model Output Demo")
    print("=" * 60)
    print("This shows how we clean up output from reasoning models like gemma3:1b")
    print()
    
    examples = [
        {
            "title": "Math Question Rewriting",
            "raw_output": """<think>
I need to make this math problem more engaging for ADHD students. 
The theme is "space" and the student is 8 years old. 
I should use exciting space vocabulary and make it story-like.
</think>

# 🚀 Space Mission Math!

Commander Alex is preparing for a **space mission** to Mars! 

She has **7 fuel tanks** in her spaceship, but during the journey, she uses **3 fuel tanks** to power through an asteroid field.

**How many fuel tanks does Commander Alex have left** for the rest of her journey to Mars?

Show your calculation and help Commander Alex reach Mars safely! 🛸"""
        },
        {
            "title": "Chat Helper Response", 
            "raw_output": """<thinking>
The student is asking about fractions, which can be confusing for dyslexic students.
I need to use simple language, short sentences, and clear formatting.
I should ask one question at a time as specified in the system prompt.
</thinking>

Hi there! 😊

I'm here to help you with **fractions**.

Fractions are like pieces of a pizza! 🍕

Let's start simple:
- The **top number** (numerator) = how many pieces you have
- The **bottom number** (denominator) = how many pieces the whole pizza was cut into

What fraction problem are you working on?"""
        },
        {
            "title": "Encouragement Message",
            "raw_output": """<think>
The theme is "dinosaurs" and the student just completed a quiz.
I need to make it encouraging and fun while staying under 50 words.
</think>

🦕 **Roarsome work!** 🦖

You're a math **T-Rex** - totally awesome! Your problem-solving skills are as mighty as a Triceratops! 

Keep up the dino-mite effort! 🌟"""
        }
    ]
    
    for i, example in enumerate(examples, 1):
        print(f"📝 Example {i}: {example['title']}")
        print("-" * 40)
        print("**Raw Output (with thinking tags):**")
        print("```")
        print(example['raw_output'])
        print("```")
        print()
        
        cleaned = clean_reasoning_output(example['raw_output'])
        print("**Cleaned Output (user sees this):**")
        print("```markdown")
        print(cleaned)
        print("```")
        print()
        print("✅ **Benefits:**")
        print("- No thinking process visible to student")
        print("- Clean markdown formatting")
        print("- Proper spacing and structure")
        print("- Professional appearance")
        print()
        print("=" * 60)
        print()

def demo_edge_cases():
    """Demonstrate edge cases and robustness"""
    
    print("🔧 Edge Cases & Robustness Demo")
    print("=" * 40)
    
    edge_cases = [
        "Mixed tags: <think>thought</think>content<THINKING>more</THINKING>final",
        "Orphaned: <think>start content</thinking>end",
        "No tags: Just normal markdown content with **bold** and *italic*",
        "<thinking>Only thinking</thinking>",
        "",  # Empty string
    ]
    
    for case in edge_cases:
        if case:
            cleaned = clean_reasoning_output(case)
            print(f"Input:  {repr(case)}")
            print(f"Output: {repr(cleaned)}")
        else:
            print("Input:  (empty string)")
            print("Output: (empty string)")
        print()

if __name__ == "__main__":
    demo_reasoning_cleanup()
    demo_edge_cases()
    
    print("🎯 **Key Features Implemented:**")
    print("- Removes all <think> and <thinking> tags")
    print("- Handles mixed case and orphaned tags")
    print("- Preserves markdown formatting")
    print("- Maintains proper spacing")
    print("- Works with any reasoning model")
    print()
    print("🚀 **Ready for Production!**")
    print("Your Math Buddy now works seamlessly with reasoning models like gemma3:1b")
