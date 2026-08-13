from pathlib import Path
import shutil
import tempfile

import jupytext

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse


app = FastAPI(
    title="BlackHole Converter API"
)


# Allow our React frontend to communicate
# with the Python backend during development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {
        "message": "BlackHole backend is running"
    }


@app.post("/convert")
async def convert_file(
    file: UploadFile = File(...)
):
    # Get the uploaded file extension
    extension = Path(file.filename).suffix.lower()

    # BlackHole currently supports only these two formats
    if extension not in [".ipynb", ".md"]:
        raise HTTPException(
            status_code=400,
            detail="Only .ipynb and .md files are supported.",
        )


    # Create a temporary working directory
    temp_directory = Path(
        tempfile.mkdtemp()
    )

    input_path = (
        temp_directory / file.filename
    )


    # Save the uploaded file temporarily
    with input_path.open("wb") as buffer:
        shutil.copyfileobj(
            file.file,
            buffer,
        )


    try:

        # =========================================
        # .ipynb -> .md
        # =========================================

        if extension == ".ipynb":

            output_path = (
                input_path.with_suffix(".md")
            )

            # Let Jupytext read the real notebook
            notebook = jupytext.read(
                input_path
            )

            # Convert the notebook to Markdown
            jupytext.write(
                notebook,
                output_path,
                fmt="md",
            )

            media_type = "text/markdown"


        # =========================================
        # .md -> .ipynb
        # =========================================

        else:

            output_path = (
                input_path.with_suffix(".ipynb")
            )

            # Read the Markdown through Jupytext
            notebook = jupytext.read(
                input_path,
                fmt="md",
            )

            # Generate a real Jupyter Notebook
            jupytext.write(
                notebook,
                output_path,
                fmt="ipynb",
            )

            media_type = (
                "application/x-ipynb+json"
            )


        # Return the converted file to React
        return FileResponse(
            path=output_path,
            filename=output_path.name,
            media_type=media_type,
        )


    except Exception as error:

        print(
            "BlackHole conversion error:",
            error,
        )

        raise HTTPException(
            status_code=500,
            detail=str(error),
        )