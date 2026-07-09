import torch
import torch.nn as nn
import timm


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


# -----------------------------

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

print("Using device:", device)

model = HybridATS().to(device)

model.load_state_dict(
    torch.load("hybrid_finetuned_model.pth", map_location=device)
)

model.eval()

print("✅ MODEL LOADED SUCCESSFULLY")
