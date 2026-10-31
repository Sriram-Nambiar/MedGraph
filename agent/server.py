import uvicorn
import os
from app.server import app

if __name__ == "__main__":
    port = int(os.environ.get("AGENT_PORT", 8000))
    host = os.environ.get("AGENT_HOST", "0.0.0.0")
    print(f"Starting MedGraph LangGraph Agent Service on {host}:{port}...")
    uvicorn.run("app.server:app", host=host, port=port, reload=True)
