# NotebookLM Local - AI Workspace

A fully local NotebookLM alternative with enhanced multimedia generation capabilities. Process documents, chat with AI, and generate images, audio, and video - all running on your machine.

## ✨ Features

- 📚 **Document Processing**: Upload PDFs, DOCX, TXT, audio, and video files
- 💬 **AI Chat**: Chat with your documents using local LLMs via Ollama
- 🔗 **Source Citations**: Every AI response includes citations to source documents
- 🎨 **Image Generation**: Create images using Stable Diffusion
- 🎵 **Audio Generation**: Text-to-speech and music generation
- 🎬 **Video Generation**: Create short video clips from text prompts
- 🔒 **100% Local**: All processing happens on your machine - no data leaves your computer

## 🖥️ System Requirements

### Minimum Requirements
- **GPU**: 4GB VRAM (GTX 1650, RTX 3050, or equivalent)
- **RAM**: 16GB
- **Storage**: 15GB free space for models
- **OS**: Windows 10/11, Linux, or macOS

### Recommended
- **GPU**: 6GB+ VRAM (RTX 3060, RTX 4060, or better)
- **RAM**: 16GB+
- **Storage**: 20GB+ free space

## 📋 Prerequisites

1. **Python 3.10+**: [Download Python](https://www.python.org/downloads/)
2. **Ollama**: [Download Ollama](https://ollama.com/download)
3. **Node.js 18+**: [Download Node.js](https://nodejs.org/)
4. **Git**: [Download Git](https://git-scm.com/downloads)

## 🚀 Quick Start

### 1. Install Ollama and Pull Models

```bash
# Install Ollama from https://ollama.com/download

# Pull a small, efficient model (recommended for 4-6GB VRAM)
ollama pull phi3:mini

# Or use Llama 3.2 3B
ollama pull llama3.2:3b
```

### 2. Clone and Setup

```bash
# Navigate to project directory
cd "d:/NoteBook LLM"

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Run Django migrations
python manage.py migrate

# Create admin user
python manage.py createsuperuser
```

### 3. Download AI Models

The setup will automatically download the necessary models on first run:
- Stable Diffusion 1.5 (~4GB)
- Faster Whisper Tiny (~100MB)
- Sentence Transformers (~80MB)

### 4. Setup Frontend

```bash
cd frontend
npm install
```

### 5. Run the Application

**Terminal 1** - Start Ollama (if not running as service):
```bash
ollama serve
```

**Terminal 2** - Start Django Backend:
```bash
python manage.py runserver
```

**Terminal 3** - Start Frontend:
```bash
cd frontend
npm run dev
```

Open your browser to `http://localhost:5173`

## 🎨 UI Overview

The interface follows NotebookLM's three-panel design:

- **📁 Sources Panel (Left)**: Upload and manage your documents
- **💬 Chat Panel (Center)**: Ask questions and get AI-powered answers with citations
- **✨ Studio Panel (Right)**: Generate images, audio, video, and summaries

## 📖 Usage Guide

### Upload Documents
1. Click the "+" button in the Sources panel
2. Select PDF, DOCX, TXT, audio, or video files
3. Wait for processing (automatic summarization and indexing)

### Chat with Your Documents
1. Type your question in the chat input
2. AI responds with citations to specific sources
3. Click citation chips to view the source

### Generate Content
1. Switch to the Studio panel
2. Choose generation type (Image, Audio, Video, Study Guide)
3. Enter your prompt and click Generate

## ⚙️ Configuration

Edit `config.yaml` to customize:

```yaml
# LLM Settings
llm:
  model: "phi3:mini"  # Ollama model name
  temperature: 0.7
  max_tokens: 2048

# Image Generation
image:
  model: "stabilityai/stable-diffusion-1-5"
  steps: 20
  guidance_scale: 7.5
  vram_optimization: true  # Enable for 4-6GB GPUs

# VRAM Management
vram:
  max_vram_gb: 5  # Maximum VRAM to use
  auto_unload: true  # Unload models when not in use
  unload_timeout: 300  # Seconds before unloading
```

## 🐛 Troubleshooting

### CUDA Out of Memory
- Reduce `vram.max_vram_gb` in config.yaml
- Enable `vram_optimization` for image generation
- Use smaller models (phi3:mini instead of llama3.2:7b)

### Ollama Connection Failed
- Ensure Ollama is running: `ollama serve`
- Check if model is downloaded: `ollama list`
- Verify Ollama is accessible: `curl http://localhost:11434`

### Slow Generation
- First-time model loading takes longer
- Subsequent generations should be faster
- Check GPU utilization in Task Manager

## 📚 Model Recommendations

### For 4GB VRAM:
- LLM: `phi3:mini` or `gemma:2b`
- Image: Stable Diffusion 1.5 with optimizations

### For 6GB+ VRAM:
- LLM: `llama3.2:3b` or `phi3:mini`
- Image: SDXL Turbo for faster generation

## 🤝 Contributing

This is a local-first AI workspace. Feel free to customize and extend!

## 📄 License

MIT License - Feel free to use and modify for personal or commercial use.

## 🙏 Acknowledgments

Built with:
- [Ollama](https://ollama.com/) for LLM management
- [Stable Diffusion](https://stability.ai/) for image generation
- [Django](https://www.djangoproject.com/) for backend
- [React](https://react.dev/) for frontend
- Inspired by [Google NotebookLM](https://notebooklm.google.com/)
