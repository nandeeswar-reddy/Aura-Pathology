import streamlit as st
import torch
import torch.nn as nn
import timm
import numpy as np
from PIL import Image
from torchvision import transforms
from pytorch_grad_cam import GradCAM
from pytorch_grad_cam.utils.image import show_cam_on_image
import pandas as pd
# MODEL ARCHITECTURE
class HybridATS(nn.Module):
    def __init__(self, num_classes=5):
        super().__init__()
        self.cnn = timm.create_model(
            "resnet34",
            pretrained=False,
            num_classes=0
        )
        self.vit = timm.create_model(
            "vit_tiny_patch16_224",
            pretrained=False,
            num_classes=0
        )
        self.attention = nn.Sequential(
            nn.Linear(512+192,128),
            nn.Tanh(),
            nn.Linear(128,1),
            nn.Softmax(dim=1)
        )
        self.classifier = nn.Linear(512+192, num_classes)
    def forward(self,x):
        cnn_feat = self.cnn(x)
        vit_feat = self.vit(x)
        tokens = torch.cat([cnn_feat, vit_feat], dim=1)
        weights = self.attention(tokens)
        tokens = tokens * weights
        return self.classifier(tokens)
# LOAD MODEL
@st.cache_resource
def load_model():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = HybridATS().to(device)
    model.load_state_dict(
        torch.load("hybrid_finetuned_model.pth", map_location=device)
    )
    model.eval()
    return model, device
model, device = load_model()
target_layer = model.cnn.layer4[-1]
cam = GradCAM(
    model=model,
    target_layers=[target_layer]
)
classes = {
    0: "Colon Adenocarcinoma (Cancer)",
    1: "Benign Colon Tissue",
    2: "Lung Adenocarcinoma (Cancer)",
    3: "Benign Lung Tissue",
    4: "Lung Squamous Cell Carcinoma (Cancer)"
}
transform = transforms.Compose([
    transforms.Resize((224,224)),
    transforms.ToTensor()
])
# UI CONFIG
st.set_page_config(
    page_title="Cancer Detection AI",
    layout="wide"
)
# Sidebar
st.sidebar.title("About This AI System")
st.sidebar.info("""
Hybrid Deep Learning System for Automated Cancer Detection
**Core Technologies:**
✔ CNN + Vision Transformer  
✔ Self-Supervised Feature Learning  
✔ Fine-Tuned Hybrid Architecture  
✔ GradCAM Explainability  
Designed to assist research workflows in computational pathology.
""")
st.sidebar.success(f"Running on: {device}")
# Main UI
st.title("Cancer Detection AI System")
st.caption(
"Research-grade hybrid deep learning model for histopathological cancer detection."
)
st.write(
"Upload a histopathology image to analyze tissue morphology and identify potential cancerous patterns."
)
uploaded_file = st.file_uploader(
    "Upload Histopathology Image",
    type=["jpg","jpeg","png"]
)
# PREDICTION
if uploaded_file is not None:
    image = Image.open(uploaded_file).convert("RGB")
    col1, col2 = st.columns(2)
    with col1:
        st.image(image, caption="Uploaded Histopathology Image", use_container_width=True)
    rgb_img = np.array(image.resize((224,224))) / 255.0
    input_tensor = transform(image).unsqueeze(0).to(device)
    # Prediction
    with torch.no_grad():
        output = model(input_tensor)
        probs = torch.softmax(output, dim=1)[0]
        confidence, pred = torch.max(probs, 0)
    pred_label = classes[pred.item()]
    confidence = confidence.item() * 100
    # GradCAM
    grayscale_cam = cam(input_tensor=input_tensor)[0]
    visualization = show_cam_on_image(
        rgb_img.astype(np.float32),
        grayscale_cam,
        use_rgb=True
    )
    with col2:
        st.image(visualization, caption="Model Attention Heatmap")
    st.divider()
    # DIAGNOSIS PANEL
    st.subheader("🩺 AI Diagnostic Summary")
    if "Cancer" in pred_label:
        st.error(f"**Diagnosis:** {pred_label}")
    else:
        st.success(f"**Diagnosis:** {pred_label}")
    st.write(f"**Model Confidence:** {confidence:.2f}%")
    st.progress(float(confidence)/100)
    # Confidence interpretation
    if confidence > 90:
        st.success("High confidence prediction.")
    elif confidence > 75:
        st.warning("Moderate confidence — clinical correlation recommended.")
    else:
        st.error("Low confidence — image may be outside training distribution.")
    #OUT-OF-DISTRIBUTION SAFETY
    if confidence < 85:
        st.warning(
            "The uploaded image may be outside the model's training distribution. "
            "For best performance, use high-quality H&E-stained histopathology images."
        )
    # Probability Chart
    prob_df = pd.DataFrame({
        "Cancer Type": classes.values(),
        "Probability": probs.cpu().numpy()
    })
    st.subheader("Prediction Probability Distribution")
    st.bar_chart(prob_df.set_index("Cancer Type"))
# MEDICAL DISCLAIMER
st.divider()
st.warning(
"""
**Medical Disclaimer:**  
This AI system is intended strictly for research and educational purposes.  
It is not approved for clinical use and must not replace professional medical diagnosis.
"""
)
st.caption("© 2026 | AI-Based Cancer Detection Research System")