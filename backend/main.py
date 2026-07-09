from fastapi import FastAPI, File, UploadFile, Header, HTTPException, Form, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os
import time
import shutil
from datetime import datetime
from PIL import Image
import torch
import json

from backend.database import (
    create_user, get_user_by_email, get_user_by_id,
    create_scan, get_scans_by_user, get_scan_by_id, delete_scan
)
from backend.auth import hash_password, verify_password, generate_session, check_session, invalidate_session
from backend.model import load_model, transform, classes
from backend.gradcam import generate_gradcam_overlay

# Initialize FastAPI
app = FastAPI(title="AI Pathology Analytics Platform API", version="1.0.0")

# Enable CORS for development flexibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event to load PyTorch model
@app.on_event("startup")
def startup_event():
    print("Loading PyTorch hybrid AI model...")
    load_model()
    print("[OK] Model loaded successfully on startup.")

# Dependency to check session and return user_id
def get_current_user_id(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized session. Please log in.")
    token = authorization.split(" ")[1]
    user_id = check_session(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Session expired or invalid. Please log in again.")
    return user_id

# ----------------- AUTHENTICATION API -----------------

@app.post("/signup")
def signup(
    full_name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    institution: str = Form(...),
    country: str = Form(...),
    role: str = Form(...)
):
    email_clean = email.strip().lower()
    existing_user = get_user_by_email(email_clean)
    if existing_user:
        raise HTTPException(status_code=400, detail="Account with this email already exists.")
    
    password_hash, salt = hash_password(password)
    user_id = create_user(
        email_clean, password_hash, salt, 
        full_name.strip(), institution.strip(), country.strip(), role.strip()
    )
    if not user_id:
        raise HTTPException(status_code=500, detail="Failed to create user account.")
    
    # Auto-login after signup
    token = generate_session(user_id)
    return {"message": "Signup successful", "token": token}

@app.post("/login")
def login(
    email: str = Form(...),
    password: str = Form(...)
):
    email_clean = email.strip().lower()
    user = get_user_by_email(email_clean)
    if not user:
        raise HTTPException(status_code=400, detail="Invalid email or password.")
    
    valid = verify_password(password, user["password_hash"], user["salt"])
    if not valid:
        raise HTTPException(status_code=400, detail="Invalid email or password.")
    
    token = generate_session(user["id"])
    return {"message": "Login successful", "token": token}

@app.post("/logout")
def logout(authorization: str = Header(None)):
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        invalidate_session(token)
    return {"message": "Logout successful"}

# ----------------- USER PROFILE API -----------------

@app.get("/profile")
def profile(user_id: int = Depends(get_current_user_id)):
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User profile not found.")
    
    # Calculate statistics
    scans = get_scans_by_user(user_id)
    total_scans = len(scans)
    avg_confidence = sum(s["confidence"] for s in scans) / total_scans if total_scans > 0 else 0.0
    
    return {
        "full_name": user["full_name"],
        "email": user["email"],
        "institution": user["institution"],
        "country": user["country"],
        "role": user["role"],
        "created_at": user["created_at"],
        "statistics": {
            "total_scans": total_scans,
            "average_confidence": round(avg_confidence, 2)
        }
    }

# ----------------- SCAN AND DIAGNOSIS API -----------------

@app.post("/scan")
def scan_image(
    file: UploadFile = File(...),
    notes: str = Form(""),
    user_id: int = Depends(get_current_user_id)
):
    # Validate file type
    filename = file.filename
    ext = os.path.splitext(filename)[1].lower()
    if ext not in [".png", ".jpg", ".jpeg"]:
        raise HTTPException(status_code=400, detail="Unsupported file format. Use PNG or JPEG.")
        
    uploads_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
    os.makedirs(uploads_dir, exist_ok=True)
    
    # Save original image
    timestamp = int(time.time() * 1000)
    original_filename = f"orig_{timestamp}_{filename}"
    original_path = os.path.join(uploads_dir, original_filename)
    
    with open(original_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        # Load image for processing
        image = Image.open(original_path).convert("RGB")
        
        # Start timer for inference time calculation
        start_time = time.time()
        
        # Load model and device
        model, device = load_model()
        
        # Preprocess
        input_tensor = transform(image).unsqueeze(0).to(device)
        
        # Run inference
        with torch.no_grad():
            output = model(input_tensor)
            probs = torch.softmax(output, dim=1)[0]
            confidence_tensor, pred_tensor = torch.max(probs, 0)
            
        inference_time = time.time() - start_time
        
        # Get label and confidence details
        pred_class_idx = pred_tensor.item()
        pred_label = classes[pred_class_idx]
        confidence_val = round(confidence_tensor.item() * 100, 2)
        
        # Risk level determination
        if "Cancer" in pred_label:
            risk_level = "High Risk" if confidence_val >= 85 else "Moderate Risk"
        else:
            risk_level = "Low Risk" if confidence_val >= 85 else "Moderate Risk"
            
        # Get class probabilities
        probs_numpy = probs.cpu().numpy()
        probabilities = {classes[i]: float(probs_numpy[i]) for i in range(len(classes))}
        
        # Generate GradCAM Heatmap overlay
        gradcam_filename = f"cam_{timestamp}_{filename}"
        gradcam_path = os.path.join(uploads_dir, gradcam_filename)
        generate_gradcam_overlay(model, input_tensor, image, gradcam_path)
        
        # Save record in SQLite database
        scan_id = create_scan(
            user_id=user_id,
            date=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            prediction=pred_label,
            confidence=confidence_val,
            risk_level=risk_level,
            inference_time=round(inference_time, 3),
            model_version="HybridATS-v1.1",
            dataset="Fitzpatrick & TCGA Histopathology Subset",
            original_image_path=f"/uploads/{original_filename}",
            gradcam_image_path=f"/uploads/{gradcam_filename}",
            probabilities=probabilities,
            notes=notes,
            doctor_comments=""
        )
        
        return {
            "id": scan_id,
            "prediction": pred_label,
            "confidence": confidence_val,
            "risk_level": risk_level,
            "inference_time": round(inference_time, 3),
            "model_version": "HybridATS-v1.1",
            "dataset": "Fitzpatrick & TCGA Histopathology Subset",
            "original_image": f"/uploads/{original_filename}",
            "gradcam_image": f"/uploads/{gradcam_filename}",
            "probabilities": probabilities,
            "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        
    except Exception as e:
        # Clean up files if processing failed
        if os.path.exists(original_path):
            os.remove(original_path)
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

# ----------------- SCAN HISTORY API -----------------

@app.get("/history")
def history(user_id: int = Depends(get_current_user_id)):
    scans = get_scans_by_user(user_id)
    # Parse probabilities JSON strings back into dictionaries
    for scan in scans:
        if isinstance(scan["probabilities"], str):
            scan["probabilities"] = json.loads(scan["probabilities"])
    return scans

@app.get("/report/{report_id}")
def report_details(report_id: int, user_id: int = Depends(get_current_user_id)):
    scan = get_scan_by_id(report_id, user_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Medical report not found.")
    
    if isinstance(scan["probabilities"], str):
        scan["probabilities"] = json.loads(scan["probabilities"])
    return scan

@app.delete("/report/{report_id}")
def delete_report(report_id: int, user_id: int = Depends(get_current_user_id)):
    scan = get_scan_by_id(report_id, user_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Medical report not found.")
        
    # Delete file assets on disk
    uploads_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
    
    # Original image deletion
    orig_path = os.path.join(uploads_dir, os.path.basename(scan["original_image_path"]))
    if os.path.exists(orig_path):
        os.remove(orig_path)
        
    # GradCAM image deletion
    cam_path = os.path.join(uploads_dir, os.path.basename(scan["gradcam_image_path"]))
    if os.path.exists(cam_path):
        os.remove(cam_path)
        
    # Delete from database
    delete_scan(report_id, user_id)
    return {"message": "Medical report successfully deleted."}

# ----------------- SERVING FRONTEND STATIC ASSETS -----------------

# Mount Uploads directory
app.mount("/uploads", StaticFiles(directory=os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")), name="uploads")

# Mount Frontend directory (mounted last, so router endpoints take priority)
app.mount("/", StaticFiles(directory=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend"), html=True), name="static")
