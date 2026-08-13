import { useRef, useState } from "react";
import "./Converter.css";

function Converter() {
  /*
    The Converter supports two directions:

    1. .ipynb → .md
    2. .md → .ipynb
  */
  const [mode, setMode] = useState("ipynb-to-md");

  // Stores the file selected by the user
  const [selectedFile, setSelectedFile] = useState(null);

  // Controls the drag-and-drop visual state
  const [dragging, setDragging] = useState(false);

  // Shows success/loading messages
  const [status, setStatus] = useState("");

  // Shows conversion or file errors
  const [error, setError] = useState("");

  // Reference to our hidden file input
  const fileInputRef = useRef(null);


  /*
    These values automatically change
    depending on the selected conversion mode.
  */
  const isIpynbMode = mode === "ipynb-to-md";

  const inputExtension = isIpynbMode
    ? ".ipynb"
    : ".md";

  const outputExtension = isIpynbMode
    ? ".md"
    : ".ipynb";

  const acceptedFiles = isIpynbMode
    ? ".ipynb,application/x-ipynb+json,application/json"
    : ".md,text/markdown,text/plain";


  /*
    Switch between:

    .ipynb → .md

    and

    .md → .ipynb
  */
  const changeMode = (newMode) => {
    setMode(newMode);

    // Clear the previous file
    setSelectedFile(null);

    // Clear old messages
    setStatus("");
    setError("");

    // Reset the native file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };


  /*
    Open the operating-system file picker.
  */
  const openFilePicker = () => {
    fileInputRef.current?.click();
  };


  /*
    Validate and save the selected file.
  */
  const handleFile = (file) => {
    if (!file) {
      return;
    }

    setStatus("");
    setError("");

    const fileName = file.name.toLowerCase();

    /*
      Make sure the selected file matches
      the current conversion direction.
    */
    if (!fileName.endsWith(inputExtension)) {
      setSelectedFile(null);

      setError(
        `Please select a valid ${inputExtension} file.`
      );

      return;
    }

    setSelectedFile(file);

    setStatus(
      `${file.name} is ready to convert.`
    );
  };


  /*
    Called when a file is selected
    using the normal file picker.
  */
  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    handleFile(file);
  };


  /*
    Prevent the browser from opening
    a file when it is dragged over the page.
  */
  const handleDragOver = (event) => {
    event.preventDefault();

    setDragging(true);
  };


  const handleDragLeave = () => {
    setDragging(false);
  };


  /*
    Handle files dropped directly
    inside the BlackHole converter.
  */
  const handleDrop = (event) => {
    event.preventDefault();

    setDragging(false);

    const file = event.dataTransfer.files?.[0];

    handleFile(file);
  };


  /*
    Send the selected file to our Python backend.

    Jupytext performs the real conversion there.
  */
  const convertFile = async () => {
    if (!selectedFile) {
      setError("Please select a file first.");

      return;
    }

    try {
      setError("");

      setStatus("Converting...");


      /*
        FormData lets us send the actual file
        to FastAPI as multipart/form-data.
      */
      const formData = new FormData();

      formData.append("file", selectedFile);


      /*
        Send the file to our Jupytext backend.
      */
      const response = await fetch(
        "https://blackhole-foku.onrender.com/convert",
        {
          method: "POST",
          body: formData,
        }
      );


      /*
        If FastAPI reports an error,
        show that error inside the UI.
      */
      if (!response.ok) {
        let message = "Conversion failed.";

        try {
          const result = await response.json();

          message =
            result.detail ||
            message;
        } catch {
          // Keep the default message if the
          // backend response is not JSON.
        }

        throw new Error(message);
      }


      /*
        FastAPI returns the converted file.
      */
      const blob = await response.blob();


      /*
        Generate the new file name.

        example.ipynb → example.md

        example.md → example.ipynb
      */
      const outputName =
        selectedFile.name.replace(
          /\.(ipynb|md)$/i,
          outputExtension
        );


      /*
        Create a temporary browser URL
        containing the converted file.
      */
      const url =
        URL.createObjectURL(blob);


      /*
        Create a temporary download link.
      */
      const link =
        document.createElement("a");

      link.href = url;

      link.download = outputName;


      /*
        Trigger the download automatically.
      */
      document.body.appendChild(link);

      link.click();

      link.remove();


      /*
        Remove the temporary browser URL
        after the download starts.
      */
      URL.revokeObjectURL(url);


      setStatus(
        `Converted successfully to ${outputName}`
      );

    } catch (conversionError) {
      console.error(
        "BlackHole conversion error:",
        conversionError
      );

      setStatus("");

      setError(
        conversionError.message ||
        "Conversion failed."
      );
    }
  };


  return (
    <section className="converter-page">

      <div className="converter-glass">


        {/* ---------------------------------
            Page Heading
        ---------------------------------- */}

        <header className="converter-header">

          <span className="converter-kicker">
            BLACKHOLE CONVERTER
          </span>

          <h1>
            Converter
          </h1>

          <p>
            Convert Jupyter notebooks and Markdown files
            without leaving the BlackHole workspace.
          </p>

        </header>


        {/* ---------------------------------
            Conversion Direction
        ---------------------------------- */}

        <div className="conversion-selector">

          <button
            type="button"
            className={
              isIpynbMode
                ? "conversion-option conversion-option-active"
                : "conversion-option"
            }
            onClick={() =>
              changeMode("ipynb-to-md")
            }
          >

            <span className="conversion-format">
              .ipynb
            </span>

            <span className="conversion-arrow">
              →
            </span>

            <span className="conversion-format">
              .md
            </span>

          </button>


          <button
            type="button"
            className={
              !isIpynbMode
                ? "conversion-option conversion-option-active"
                : "conversion-option"
            }
            onClick={() =>
              changeMode("md-to-ipynb")
            }
          >

            <span className="conversion-format">
              .md
            </span>

            <span className="conversion-arrow">
              →
            </span>

            <span className="conversion-format">
              .ipynb
            </span>

          </button>

        </div>


        {/* ---------------------------------
            Upload Area
        ---------------------------------- */}

        <div
          className={
            dragging
              ? "upload-zone upload-zone-dragging"
              : "upload-zone"
          }
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >

          {/*
            Hidden native input.

            Our custom BlackHole button
            opens this input.
          */}
          <input
            ref={fileInputRef}
            className="file-input"
            type="file"
            accept={acceptedFiles}
            onChange={handleFileChange}
          />


          {/* Upload Icon */}

          <div className="upload-symbol">

            <svg
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >

              <path
                d="M12 16V4M12 4L7.5 8.5M12 4L16.5 8.5M5 14V19H19V14"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

            </svg>

          </div>


          {/* File Information */}

          <div className="upload-text">

            <h2>
              {selectedFile
                ? selectedFile.name
                : `Drop your ${inputExtension} file here`}
            </h2>

            <p>
              {selectedFile
                ? `${inputExtension} ready to convert into ${outputExtension}`
                : `Drag and drop or select a ${inputExtension} file from your computer.`}
            </p>

          </div>


          {/*
            Before a file is selected,
            only show the Select button.
          */}

          {!selectedFile && (
            <button
              className="select-file-button"
              type="button"
              onClick={openFilePicker}
            >
              Select {inputExtension} file
            </button>
          )}


          {/*
            After a file is selected,
            show both actions.
          */}

          {selectedFile && (
            <>

              <div className="converter-actions">

                <button
                  className="secondary-file-button"
                  type="button"
                  onClick={openFilePicker}
                >
                  Choose another
                </button>


                <button
                  className="convert-file-button"
                  type="button"
                  onClick={convertFile}
                >
                  Convert to {outputExtension}
                </button>

              </div>


              <div className="selected-file">

                <span className="file-ready-dot" />

                <span>
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </span>

                <span className="file-info-separator">
                  •
                </span>

                <span>
                  Ready
                </span>

              </div>

            </>
          )}


          {/* ---------------------------------
              Status Message
          ---------------------------------- */}

          {status && (
            <p className="converter-status">
              {status}
            </p>
          )}


          {/* ---------------------------------
              Error Message
          ---------------------------------- */}

          {error && (
            <p className="converter-error">
              {error}
            </p>
          )}

        </div>


        {/* ---------------------------------
            Bottom Status
        ---------------------------------- */}

        <footer className="converter-footer">

          <span className="footer-dot" />

          <span>
            {inputExtension}
            {" → "}
            {outputExtension}
          </span>

        </footer>

      </div>

    </section>
  );
}

export default Converter;
