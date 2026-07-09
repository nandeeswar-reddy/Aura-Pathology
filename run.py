import sys
import os

# Add current folder to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    import fastapi
    import uvicorn
    import starlette
except ImportError:
    print("❌ Critical python modules are missing. Please verify that dependencies are correctly installed in venv.")
    sys.exit(1)

if __name__ == "__main__":
    env = os.environ.get("APP_ENV", "development").lower()
    is_prod = env == "production"
    
    host = os.environ.get("HOST", "0.0.0.0" if is_prod else "127.0.0.1")
    port = int(os.environ.get("PORT", 8000))

    print("--------------------------------------------------")
    print(f"Starting AI Pathology Analytics Platform in {env.upper()} mode...")
    print(f"Server binding to: http://{host}:{port}")
    print("--------------------------------------------------")
    
    # Run the uvicorn server serving backend.main:app
    uvicorn.run(
        "backend.main:app",
        host=host,
        port=port,
        reload=not is_prod
    )
