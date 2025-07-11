# Architecture

```mermaid
flowchart TD
    A[User] --> B(Next.js App)
    B --> C[FastAPI Backend]
    C --> D[OpenAI GPT-4o]
    C --> E[HuggingFace API]
```
