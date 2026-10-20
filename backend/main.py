import io
import os
from pathlib import Path
import shutil
import sys
import tempfile
import traceback

import jupytext
from fastapi import BackgroundTasks, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel


app = FastAPI(
    title="BlackHole Converter & Python SDK API",
    version="1.0.0",
)


# Allow our React frontend to communicate with the Python backend
# Supports Render free instance subdomains, local dev, and custom domains.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://blackhole-1.onrender.com",
        "https://blackhole-foku.onrender.com",
        "https://blackhole.onrender.com",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_origin_regex=r"https://.*\.onrender\.com",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Persistent global namespace for notebook execution
notebook_globals = {}


class ExecuteRequest(BaseModel):
    code: str


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "blackhole-api",
        "version": "1.0.0",
    }


@app.get("/workspace/tree")
def get_workspace_tree():
    """
    Scans the workspace directory tree and returns hierarchical structure
    for the Agentic Assistant's FileTree component.
    """
    root_path = Path(__file__).resolve().parent.parent
    ignore_dirs = {".git", ".github", ".venv", "node_modules", "__pycache__", "dist", ".ipynb_checkpoints"}

    def build_tree(current_path: Path, rel_path: str = ""):
        items = []
        try:
            for entry in sorted(current_path.iterdir(), key=lambda e: (not e.is_dir(), e.name.lower())):
                if entry.name in ignore_dirs or entry.name.startswith(".system_generated"):
                    continue
                item_rel = f"{rel_path}/{entry.name}".lstrip("/")
                if entry.is_dir():
                    children = build_tree(entry, item_rel)
                    if children:
                        items.append({
                            "name": entry.name,
                            "type": "folder",
                            "path": item_rel,
                            "defaultOpen": entry.name in ["backend", "frontend", "src"],
                            "children": children
                        })
                else:
                    items.append({
                        "name": entry.name,
                        "type": "file",
                        "path": item_rel,
                        "size": entry.stat().st_size
                    })
        except Exception:
            pass
        return items

    tree = build_tree(root_path)
    return {"status": "success", "root": "blackhole", "tree": tree}



@app.post("/execute")
def execute_python_code(payload: ExecuteRequest):
    """
    Executes Python code cells and captures stdout, stderr, and tracebacks.
    Maintains a persistent global execution namespace across cell runs.
    """
    old_stdout = sys.stdout
    old_stderr = sys.stderr
    captured_stdout = io.StringIO()
    captured_stderr = io.StringIO()
    sys.stdout = captured_stdout
    sys.stderr = captured_stderr

    try:
        exec(payload.code, notebook_globals)
        return {
            "success": True,
            "stdout": captured_stdout.getvalue(),
            "stderr": captured_stderr.getvalue(),
        }
    except Exception:
        return {
            "success": False,
            "stdout": captured_stdout.getvalue(),
            "stderr": captured_stderr.getvalue(),
            "error": traceback.format_exc(),
        }
    finally:
        sys.stdout = old_stdout
        sys.stderr = old_stderr


def cleanup_directory(directory_path: Path):
    """Safely cleans up temporary upload/conversion directories to conserve Render disk space."""
    try:
        if directory_path.exists() and directory_path.is_dir():
            shutil.rmtree(directory_path, ignore_errors=True)
    except Exception:
        pass


@app.post("/convert")
async def convert_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
):
    """
    Converts between .ipynb and .md using Jupytext.
    Schedules temporary directory removal after FileResponse completes.
    """
    # Get the uploaded file extension
    extension = Path(file.filename).suffix.lower()

    # BlackHole supports .ipynb and .md formats
    if extension not in [".ipynb", ".md"]:
        raise HTTPException(
            status_code=400,
            detail="Only .ipynb and .md files are supported.",
        )

    # Create a temporary working directory
    temp_directory = Path(tempfile.mkdtemp(prefix="blackhole_"))
    input_path = temp_directory / file.filename

    # Save the uploaded file temporarily
    with input_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        if extension == ".ipynb":
            output_path = input_path.with_suffix(".md")
            notebook = jupytext.read(input_path)
            jupytext.write(notebook, output_path, fmt="md")
            media_type = "text/markdown"
        else:
            output_path = input_path.with_suffix(".ipynb")
            notebook = jupytext.read(input_path, fmt="md")
            jupytext.write(notebook, output_path, fmt="ipynb")
            media_type = "application/x-ipynb+json"

        # Register cleanup background task
        background_tasks.add_task(cleanup_directory, temp_directory)

        # Return the converted file to client
        return FileResponse(
            path=output_path,
            filename=output_path.name,
            media_type=media_type,
        )

    except Exception as error:
        cleanup_directory(temp_directory)
        print("BlackHole conversion error:", error)
        raise HTTPException(
            status_code=500,
            detail=str(error),
        )


# Check if built frontend static distribution exists (e.g., in unified Render deployment)
current_dir = Path(__file__).resolve().parent
candidates = [
    current_dir.parent / "frontend" / "dist",
    current_dir / "dist",
    Path("frontend/dist").resolve(),
    Path("dist").resolve(),
]

frontend_dist = next((c for c in candidates if c.exists() and (c / "index.html").exists()), None)

if frontend_dist:
    assets_dir = frontend_dist / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Do not intercept API paths
        if full_path in ["convert", "execute", "health", "docs", "openapi.json", "redoc"]:
            raise HTTPException(status_code=404, detail="Not Found")

        target_file = frontend_dist / full_path
        if target_file.is_file():
            return FileResponse(target_file)

        index_file = frontend_dist / "index.html"
        if index_file.is_file():
            return FileResponse(index_file)

        return JSONResponse({"message": "BlackHole backend is running"})
else:
    @app.get("/")
    def home():
        return {
            "message": "BlackHole backend is running"
        }


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
