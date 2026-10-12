/**
 * Python SDK Service for BlackHole
 * 
 * Provides in-browser Python execution using Pyodide (CPython WebAssembly),
 * with fallback support to the BlackHole FastAPI /execute endpoint.
 * Maintains execution globals across notebook cells so variable definitions persist.
 */

import { getBackendBaseUrl } from "./api";

let pyodideInstance = null;
let pyodideLoadingPromise = null;



/**
 * Initializes and retrieves the Pyodide WebAssembly Python SDK
 */
export async function getPyodide(onProgress) {
  if (pyodideInstance) {
    return pyodideInstance;
  }

  if (pyodideLoadingPromise) {
    return pyodideLoadingPromise;
  }

  pyodideLoadingPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      return reject(new Error("Python SDK requires browser environment"));
    }

    if (onProgress) onProgress("Loading Python WebAssembly runtime...");

    const loadScript = () => {
      if (window.loadPyodide) {
        window
          .loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/",
          })
          .then((py) => {
            pyodideInstance = py;
            if (onProgress) onProgress("Python SDK Ready");
            resolve(py);
          })
          .catch((err) => {
            console.error("Pyodide initialization error:", err);
            reject(err);
          });
      } else {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js";
        script.async = true;
        script.onload = () => {
          if (onProgress) onProgress("Initializing Python engine...");
          window
            .loadPyodide({
              indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/",
            })
            .then((py) => {
              pyodideInstance = py;
              if (onProgress) onProgress("Python SDK Ready");
              resolve(py);
            })
            .catch((err) => {
              console.error("Pyodide initialization error:", err);
              reject(err);
            });
        };
        script.onerror = (e) => {
          console.error("Failed to load Pyodide from CDN:", e);
          reject(new Error("Failed to load Python WebAssembly runtime from CDN"));
        };
        document.head.appendChild(script);
      }
    };

    loadScript();
  });

  return pyodideLoadingPromise;
}

/**
 * Executes a string of Python code and captures stdout, stderr, and result.
 * Persists variables across runs using a shared execution namespace.
 * 
 * @param {string} code - Python code to execute
 * @returns {Promise<{success: boolean, stdout: string, stderr: string, result?: string, error?: string, executionTime: number}>}
 */
export async function executePython(code) {
  const startTime = performance.now();

  try {
    const pyodide = await getPyodide();

    // Setup stdout and stderr collectors
    const stdoutLines = [];
    const stderrLines = [];

    pyodide.setStdout({
      batched: (text) => {
        stdoutLines.push(text);
      },
    });

    pyodide.setStderr({
      batched: (text) => {
        stderrLines.push(text);
      },
    });

    // Run code asynchronously
    const rawResult = await pyodide.runPythonAsync(code);

    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);

    let resultString = "";
    if (rawResult !== undefined && rawResult !== null) {
      try {
        resultString = String(rawResult);
        if (typeof rawResult.destroy === "function") {
          rawResult.destroy();
        }
      } catch {
        resultString = String(rawResult);
      }
    }

    return {
      success: true,
      stdout: stdoutLines.join("\n"),
      stderr: stderrLines.join("\n"),
      result: resultString,
      executionTime: duration,
    };
  } catch (err) {
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);

    // If Pyodide failed to load or threw an exception, check if backend fallback is available
    if (err.message && err.message.includes("from CDN")) {
      return executeViaBackend(code, startTime);
    }

    return {
      success: false,
      stdout: "",
      stderr: "",
      error: err.message || String(err),
      executionTime: duration,
    };
  }
}

/**
 * Fallback to FastAPI backend /execute endpoint if WebAssembly runtime is blocked
 */
async function executeViaBackend(code, startTime) {
  try {
    const backendUrl = getBackendBaseUrl();
    const response = await fetch(`${backendUrl}/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    if (response.ok) {
      const data = await response.json();
      const endTime = performance.now();
      return {
        success: data.success,
        stdout: data.stdout || "",
        stderr: data.stderr || "",
        error: data.error || "",
        executionTime: Math.round(endTime - startTime),
      };
    }
  } catch (backendErr) {
    console.warn("Backend execution fallback unavailable:", backendErr);
  }

  const endTime = performance.now();
  return {
    success: false,
    stdout: "",
    stderr: "",
    error: "Python SDK execution failed. Please verify network access to load Pyodide runtime.",
    executionTime: Math.round(endTime - startTime),
  };
}
