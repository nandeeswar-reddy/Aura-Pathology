import os
import torch
import torch.nn as nn
import timm
from torchvision import transforms

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
            nn.Linear(512+192, 128),
            nn.Tanh(),
            nn.Linear(128, 1),
            nn.Softmax(dim=1)
        )
        self.classifier = nn.Linear(512+192, num_classes)

    def forward(self, x):
        cnn_feat = self.cnn(x)
        vit_feat = self.vit(x)
        tokens = torch.cat([cnn_feat, vit_feat], dim=1)
        weights = self.attention(tokens)
        tokens = tokens * weights
        return self.classifier(tokens)

# Global variables for model state
model = None
device = None

classes = {
    0: "Colon Adenocarcinoma (Cancer)",
    1: "Benign Colon Tissue",
    2: "Lung Adenocarcinoma (Cancer)",
    3: "Benign Lung Tissue",
    4: "Lung Squamous Cell Carcinoma (Cancer)"
}

# Preprocessing transforms (identical to original)
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor()
])

def load_model():
    global model, device
    if model is not None:
        return model, device

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = HybridATS().to(device)
    
    # Locate weight file dynamically relative to this script
    weights_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "hybrid_finetuned_model.pth"
    )
    
    if not os.path.exists(weights_path):
        raise FileNotFoundError(f"Model weight file not found at: {weights_path}")
        
    model.load_state_dict(
        torch.load(weights_path, map_location=device)
    )
    model.eval()
    return model, device
