import numpy as np
from PIL import Image
import torch
from pytorch_grad_cam import GradCAM
from pytorch_grad_cam.utils.image import show_cam_on_image

# Global variable to cache the GradCAM object
_cam_instance = None

def get_cam(model):
    global _cam_instance
    if _cam_instance is None:
        # Target the last layer of ResNet34
        target_layer = model.cnn.layer4[-1]
        _cam_instance = GradCAM(
            model=model,
            target_layers=[target_layer]
        )
    return _cam_instance

def generate_gradcam_overlay(model, input_tensor, original_image_pil, save_path):
    """
    Generates a Grad-CAM heatmap overlay on top of the original image 
    and saves it to save_path.
    """
    # 1. Initialize CAM
    cam = get_cam(model)
    
    # 2. Get grayscale CAM (Grad-CAM needs gradients, run outside torch.no_grad())
    grayscale_cam = cam(input_tensor=input_tensor)[0]
    
    # 3. Prepare background RGB image resized to 224x224 (model resolution)
    # matching the original code: rgb_img = np.array(image.resize((224,224))) / 255.0
    rgb_img = np.array(original_image_pil.resize((224, 224))) / 255.0
    
    # 4. Overlay heatmap
    visualization = show_cam_on_image(
        rgb_img.astype(np.float32),
        grayscale_cam,
        use_rgb=True
    )
    
    # 5. Save the output overlay image
    overlay_img = Image.fromarray(visualization)
    overlay_img.save(save_path)
    return save_path
