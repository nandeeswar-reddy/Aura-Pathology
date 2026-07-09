# AI Pathology Analytics Platform

A hybrid deep learning system designed for automated cancer detection in histopathology images. This project combines a Convolutional Neural Network (ResNet34) and a Vision Transformer (ViT-Tiny) to analyze tissue morphology and identify potential cancerous patterns with high accuracy. 

The application provides a seamless WebGL/React frontend powered by a robust FastAPI backend.

## Features

- **Hybrid Deep Learning Architecture**: Combines CNN (local feature extraction) and Vision Transformers (global context) for state-of-the-art pathology classification.
- **Explainable AI (XAI)**: Utilizes Grad-CAM to generate attention heatmaps, providing visual explanations of which tissue regions influenced the model's prediction.
- **High-Performance UI**: A modern, glassmorphism-inspired UI featuring 3D WebGL animations built with React Three Fiber.
- **Production-Ready Backend**: Built on FastAPI with SQLite for user management, secure JWT authentication, and scan history tracking.

## Getting Started

### Prerequisites

- Python 3.10+
- (Optional but Recommended) A CUDA-compatible GPU for accelerated model inference.

### Installation

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd <your-repo-directory>
   ```
2. **Create a virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```
3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
4. **Environment Variables**:
   Copy the example environment file and configure your secrets:
   ```bash
   cp .env.example .env
   ```

### Running the Application

To run the full stack locally:
```bash
python run.py
```
The application will be available at `http://127.0.0.1:8000`.

### Docker Deployment

A `Dockerfile` is included for containerized deployment.
```bash
docker build -t pathology-ai .
docker run -p 8000:8000 pathology-ai
```

## Disclaimer

**Strictly for Research Purposes.** This AI system is not approved for clinical use and must not replace professional medical diagnosis.
