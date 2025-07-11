# SEN Math Buddy

Prototype for interactive math practice tailored for SEN (Special Educational Needs) learners.

## 🚀 Quick Start

### Prerequisites
- Python 3.8+ 
- Node.js 18+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd GoodNotes
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   cp backend/.env.example backend/.env
   # Edit the .env files with your actual API keys
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   cd ..
   ```

4. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

## 🏃‍♂️ Running the Application

### Development Mode

1. **Start the backend server**
   ```bash
   cd backend
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Start the frontend development server** (in a new terminal)
   ```bash
   cd frontend
   npm run dev
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## 📁 Project Structure

```
├── backend/           # Python FastAPI backend
│   ├── services/     # Business logic services
│   ├── main.py       # FastAPI application entry point
│   └── requirements.txt
├── frontend/         # Next.js React frontend
│   ├── src/
│   ├── public/
│   └── package.json
├── static/           # Static assets
├── tests/            # Test files
└── docs/             # Documentation files
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
python -m pytest
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 📝 Environment Variables

See `.env.example` and `backend/.env.example` for required environment variables.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and add tests
4. Commit your changes: `git commit -am 'Add some feature'`
5. Push to the branch: `git push origin feature-name`
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
