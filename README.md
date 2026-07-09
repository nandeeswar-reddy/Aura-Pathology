<div align="center">

# 🧬 Aura Pathology Analytics Platform
**A High-Performance Hybrid Deep Learning System for Automated Cancer Detection**

[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![PyTorch](https://img.shields.io/badge/PyTorch-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)](https://pytorch.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-black?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)

*An intelligent, automated AI system built for analyzing histopathology images to identify potential cancerous patterns with high accuracy.*

---
</div>

## ✨ Features

- 🧠 **Hybrid Deep Learning Architecture**: Seamlessly fuses **ResNet34 (CNN)** for local feature extraction and **Vision Transformer (ViT-Tiny)** for global context analysis, achieving state-of-the-art pathology classification.
- 🔬 **Explainable AI (XAI)**: Integrated with **Grad-CAM** to generate visual attention heatmaps, providing researchers with transparent explanations of the tissue regions driving the model's predictions.
- 🎨 **Next-Gen WebGL UI**: A visually stunning, glassmorphism-inspired interface featuring dynamic 3D WebGL animations powered by **React Three Fiber**.
- ⚡ **Production-Ready Backend**: Built on ultra-fast **FastAPI** with SQLite user management, secure JWT authentication, and automated scan history tracking.

---

## 🚀 Getting Started

### 📦 Prerequisites

- Python 3.10 or higher
- Git & Git LFS *(Required for the large model weights)*
- *(Optional but Recommended)* A CUDA-compatible GPU for accelerated AI inference.

### 🛠 Installation

**1. Clone the repository**
Make sure you have [Git LFS](https://git-lfs.github.com/) installed to pull the 100MB+ model file!
```bash
git clone https://github.com/nandeeswar-reddy/Aura-Pathology.git
cd Aura-Pathology
```

**2. Create a virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

**3. Install dependencies**
```bash
pip install -r requirements.txt
```

**4. Configure Environment Variables**
Copy the example environment file and configure your security secrets:
```bash
cp .env.example .env
```

---

## 💻 Usage

To run the full-stack application locally in development mode:

```bash
python run.py
```
> 🌐 The application will boot up at [http://127.0.0.1:8000](http://127.0.0.1:8000).

---

## 🐳 Docker Deployment

The platform comes fully containerized and deployment-ready out of the box!

```bash
# Build the Docker image
docker build -t aura-pathology-ai .

# Run the container
docker run -p 8000:8000 aura-pathology-ai
```

---

## ⚠️ Medical Disclaimer

> **Strictly for Research and Educational Purposes.**  
> This AI diagnostic system is **not** approved for clinical use and must absolutely **not** replace professional, board-certified medical diagnosis. Always consult with a qualified healthcare provider.

<div align="center">
  <br>
  <i>Built with ❤️ for Computational Pathology Research.</i>
</div>
