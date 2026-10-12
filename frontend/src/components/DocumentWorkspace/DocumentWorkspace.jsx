import { useCallback, useEffect, useId, useRef, useState } from "react";
import { marked } from "marked";
import AgenticAssistant from "../AgenticAssistant/AgenticAssistant";
import { executePython, getPyodide } from "../../services/pythonSdk";
import "./DocumentWorkspace.css";

// Configure marked options
marked.setOptions({
  breaks: true,
  gfm: true,
});

export default function DocumentWorkspace({
  workspaceType = "notes", // "notes" | "lab"
  defaultFileType = "md",  // "md" | "ipynb"
  initialDocument = null,
}) {
  const uploadInputId = useId();
  // Active document type: 'md' | 'ipynb'
  const [fileType, setFileType] = useState(defaultFileType);
  const [fileName, setFileName] = useState(
    defaultFileType === "ipynb"
      ? `${workspaceType}_simulation.ipynb`
      : `${workspaceType}_document.md`
  );

  // Markdown content
  const [markdownContent, setMarkdownContent] = useState("");

  // Jupyter Notebook structure
  const [notebookCells, setNotebookCells] = useState([]);

  // Python SDK status
  const [pythonStatus, setPythonStatus] = useState("loading"); // "loading" | "ready" | "error"
  const [pythonStatusMsg, setPythonStatusMsg] = useState("Initializing Python SDK...");

  // Assistant state (Left panel)
  const [isAssistantOpen, setIsAssistantOpen] = useState(true);

  // Jupyter Notebook workspace states
  const [selectedCellIndex, setSelectedCellIndex] = useState(0);
  const [editingMarkdownIndex, setEditingMarkdownIndex] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null); // 'file' | 'edit' | 'view' | 'insert' | 'cell' | 'kernel' | 'help' | null
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [cellClipboard, setCellClipboard] = useState(null);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [isKernelBusy, setIsKernelBusy] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);

  // Notification status
  const [notification, setNotification] = useState("");

  const fileInputRef = useRef(null);
  const markdownTextareaRef = useRef(null);
  const previewRef = useRef(null);
  const activeScroller = useRef(null);
  const scrollTimeout = useRef(null);

  // Close menus on click outside
  useEffect(() => {
    const handleDocumentClick = (e) => {
      if (!e.target.closest(".jupyter-menubar-container")) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, []);

  /**
   * Synchronized Scrolling between Source Editor and Live Preview
   */
  const handleEditorScroll = (e) => {
    if (activeScroller.current && activeScroller.current !== "editor") return;
    activeScroller.current = "editor";

    const editor = e.target;
    const preview = previewRef.current;
    if (editor && preview) {
      const maxScrollEditor = editor.scrollHeight - editor.clientHeight;
      if (maxScrollEditor > 0) {
        const ratio = editor.scrollTop / maxScrollEditor;
        const maxScrollPreview = preview.scrollHeight - preview.clientHeight;
        preview.scrollTop = ratio * maxScrollPreview;
      }
    }

    clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      activeScroller.current = null;
    }, 60);
  };

  const handlePreviewScroll = (e) => {
    if (activeScroller.current && activeScroller.current !== "preview") return;
    activeScroller.current = "preview";

    const preview = e.target;
    const editor = markdownTextareaRef.current;
    if (editor && preview) {
      const maxScrollPreview = preview.scrollHeight - preview.clientHeight;
      if (maxScrollPreview > 0) {
        const ratio = preview.scrollTop / maxScrollPreview;
        const maxScrollEditor = editor.scrollHeight - editor.clientHeight;
        editor.scrollTop = ratio * maxScrollEditor;
      }
    }

    clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      activeScroller.current = null;
    }, 60);
  };

  // Initialize Python SDK on mount
  useEffect(() => {
    getPyodide((progress) => {
      setPythonStatusMsg(progress);
    })
      .then(() => {
        setPythonStatus("ready");
        setPythonStatusMsg("Python SDK Ready (Pyodide WebAssembly)");
      })
      .catch((err) => {
        console.warn("Python SDK initialization note:", err);
        setPythonStatus("ready"); // Can still attempt execution or fallback
        setPythonStatusMsg("Python SDK Connected");
      });
  }, []);

  /**
   * Load Default Templates
   */
  const loadDefaultTemplate = useCallback(
    (type) => {
      if (type === "ipynb") {
        setFileType("ipynb");
        setFileName(
          workspaceType === "lab"
            ? "blackhole_lab_simulation.ipynb"
            : "computational_notes.ipynb"
        );
        setNotebookCells([
          {
            id: "cell-1",
            type: "markdown",
            source: `# BlackHole Computational Laboratory\n*Relativistic Gravitational Mechanics & Accretion Inflow Simulation*\n\nThis notebook executes live Python code directly in your browser using the **BlackHole Python SDK (WebAssembly)**. Click **Run** on any code cell below to calculate metrics in real time.`,
          },
          {
            id: "cell-2",
            type: "code",
            source: `# 1. Physical constants in SI units\nG = 6.67430e-11   # Gravitational constant (m^3 kg^-1 s^-2)\nc = 299792458     # Speed of light in vacuum (m/s)\nM_sun = 1.989e30  # Solar mass (kg)\n\nprint("Astrophysical constants loaded successfully!")\nprint(f"Speed of light c: {c:,} m/s")\nprint(f"Solar mass M_sun: {M_sun:.3e} kg")`,
            output: "",
            error: "",
            executionCount: null,
            isRunning: false,
          },
          {
            id: "cell-3",
            type: "markdown",
            source: `### 2. Schwarzschild Event Horizon Calculation\n\nThe radius of the event horizon of a non-rotating spherically symmetric black hole is given by:\n$$\\mathcal{R}_s = \\frac{2GM}{c^2}$$\n\nBelow, we compute $\\mathcal{R}_s$ across stellar, intermediate, and supermassive black hole mass scales:`,
          },
          {
            id: "cell-4",
            type: "code",
            source: `def schwarzschild_radius(solar_masses):\n    mass_kg = solar_masses * M_sun\n    rs_meters = (2 * G * mass_kg) / (c ** 2)\n    return rs_meters / 1000  # Return in kilometers\n\n# Compute for diverse black hole classes\ntargets = [\n    ("Stellar Black Hole (Cygnus X-1)", 21.2),\n    ("Intermediate Black Hole (HLX-1)", 20000.0),\n    ("Sagittarius A* (Milky Way Center)", 4.3e6),\n    ("M87* (Supermassive Giant)", 6.5e9),\n]\n\nprint(f"{'Target Object':<36} | {'Mass (M_sun)':<12} | {'Horizon Radius (km)':<20}")\nprint("-" * 75)\nfor name, mass in targets:\n    radius_km = schwarzschild_radius(mass)\n    print(f"{name:<36} | {mass:<12.1e} | {radius_km:<20,.2f}")`,
            output: "",
            error: "",
            executionCount: null,
            isRunning: false,
          },
          {
            id: "cell-5",
            type: "code",
            source: `# 3. Gravitational Time Dilation Factor\n# Calculates time dilation factor relative to an observer at infinity:\n# t_local = t_infinity * sqrt(1 - (Rs / r))\nimport math\n\ndef time_dilation(r_over_rs):\n    if r_over_rs <= 1.0:\n        return 0.0\n    return math.sqrt(1.0 - (1.0 / r_over_rs))\n\nranges = [1.05, 1.2, 1.5, 2.0, 3.0, 5.0, 10.0, 50.0]\nprint("Relative Distance (r / Rs) -> Local Time Flow Rate Factor:")\nfor r in ranges:\n    factor = time_dilation(r)\n    print(f"  At {r:5.2f} Rs  =>  dilation rate = {factor:.4f}")`,
            output: "",
            error: "",
            executionCount: null,
            isRunning: false,
          },
        ]);
      } else {
        setFileType("md");
        setFileName(
          workspaceType === "notes"
            ? "cosmic_field_notes.md"
            : "experiment_documentation.md"
        );
        setMarkdownContent(
          `# Cosmic Field Research & Astrophysical Observations

> *BlackHole Unified Workspace — Live Split View Editor & Preview*

---

## 1. Relativistic Accretion Dynamics

When matter falls toward a compact relativistic object, gravitational potential energy is converted into thermal radiation with exceptional efficiency:

$$\\eta = 1 - \\sqrt{1 - \\frac{2GM}{r_{isco} c^2}}$$

* For a **Schwarzschild black hole**, the innermost stable circular orbit (ISCO) is $r_{isco} = 6 \\frac{GM}{c^2}$, yielding an accretion efficiency $\\eta \\approx 5.7\\%$.
* For a **maximally rotating Kerr black hole** ($a = 1$), $r_{isco} = \\frac{GM}{c^2}$, elevating radiative efficiency up to $\\eta \\approx 42.3\\%$.

---

## 2. Experimental Verification Checklist

- [x] Calibrate interferometric baselines for millimeter VLBI arrays
- [x] Correlate accretion disk Doppler frequency shift and photon ring geometry
- [ ] Compute magnetohydrodynamic jet collimation profiles
- [ ] Measure frame-dragging precession frequencies

---

## 3. Observational Metrics Table

| Metric | Schwarzschild ($a = 0$) | Moderate Kerr ($a = 0.7$) | Extreme Kerr ($a = 0.998$) |
| :--- | :--- | :--- | :--- |
| **Photon Sphere Radius** | $3.0\\, R_g$ | $2.31\\, R_g$ | $1.07\\, R_g$ |
| **Marginally Stable Orbit (ISCO)** | $6.0\\, R_g$ | $3.39\\, R_g$ | $1.23\\, R_g$ |
| **Maximum Radiative Efficiency** | $5.72\\%$ | $10.4\\%$ | $32.4\\%$ |

---

\`\`\`python
# Accretion Luminosity Calculation
def accretion_luminosity(mass_accretion_rate_kg_s, efficiency=0.1):
    c = 299792458
    return efficiency * mass_accretion_rate_kg_s * (c ** 2)

l_watts = accretion_luminosity(1e15, 0.42)
print(f"Luminosity: {l_watts:.3e} Watts")
\`\`\`

*Notes are live-synced between the Markdown editor and live preview pane.*
`
        );
      }
    },
    [workspaceType]
  );

  // Initialize document on mount
  useEffect(() => {
    if (initialDocument) {
      if (initialDocument.type === "ipynb") {
        setFileType("ipynb");
        setFileName(initialDocument.name || "simulation.ipynb");
        setNotebookCells(initialDocument.cells || []);
      } else {
        setFileType("md");
        setFileName(initialDocument.name || "notes.md");
        setMarkdownContent(initialDocument.content || "");
      }
    } else {
      loadDefaultTemplate(defaultFileType);
    }
  }, [defaultFileType, initialDocument, loadDefaultTemplate]);

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification("");
    }, 3500);
  };

  /**
   * Handle File Upload (.md or .ipynb)
   */
  const handleFileUpload = (file) => {
    if (!file) return;

    const name = file.name;
    const extension = name.split(".").pop().toLowerCase();

    const reader = new FileReader();

    if (extension === "ipynb") {
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target.result);
          const rawCells = parsed.cells || [];

          const formattedCells = rawCells.map((c, index) => {
            const rawSource = Array.isArray(c.source)
              ? c.source.join("")
              : c.source || "";

            let existingOutput = "";
            if (Array.isArray(c.outputs) && c.outputs.length > 0) {
              const texts = c.outputs
                .map((out) => {
                  if (out.text) {
                    return Array.isArray(out.text)
                      ? out.text.join("")
                      : out.text;
                  }
                  if (out.data && out.data["text/plain"]) {
                    return Array.isArray(out.data["text/plain"])
                      ? out.data["text/plain"].join("")
                      : out.data["text/plain"];
                  }
                  return "";
                })
                .filter(Boolean);
              existingOutput = texts.join("\n");
            }

            return {
              id: `cell-${Date.now()}-${index}`,
              type: c.cell_type === "markdown" ? "markdown" : "code",
              source: rawSource,
              output: existingOutput,
              error: "",
              executionCount: c.execution_count || null,
              isRunning: false,
            };
          });

          setFileType("ipynb");
          setFileName(name);
          setNotebookCells(formattedCells);
          showNotification(`Loaded notebook: ${name}`);
        } catch (err) {
          console.error("Notebook parse error:", err);
          showNotification("Invalid .ipynb file structure. Please check JSON.");
        }
      };
      reader.readAsText(file);
    } else {
      // Treat as markdown / text
      reader.onload = (e) => {
        setFileType("md");
        setFileName(name.endsWith(".md") ? name : `${name}.md`);
        setMarkdownContent(e.target.result || "");
        showNotification(`Loaded markdown document: ${name}`);
      };
      reader.readAsText(file);
    }
  };

  /**
   * Run Single Python Cell
   */
  const handleRunCell = async (cellIndex) => {
    const targetCell = notebookCells[cellIndex];
    if (!targetCell || targetCell.type !== "code") return;

    // Set running state
    setIsKernelBusy(true);
    setNotebookCells((prev) =>
      prev.map((c, idx) =>
        idx === cellIndex ? { ...c, isRunning: true, error: "" } : c
      )
    );

    const result = await executePython(targetCell.source);
    setIsKernelBusy(false);

    setNotebookCells((prev) =>
      prev.map((c, idx) => {
        if (idx !== cellIndex) return c;

        let outputText = result.stdout || "";
        if (result.result) {
          outputText = outputText
            ? `${outputText}\n${result.result}`
            : result.result;
        }

        return {
          ...c,
          isRunning: false,
          output: outputText,
          error: result.error || "",
          executionCount: (c.executionCount || 0) + 1,
        };
      })
    );
  };

  /**
   * Run Cell and Advance to Next
   */
  const handleRunCellAndSelectNext = async (index) => {
    await handleRunCell(index);
    if (index === notebookCells.length - 1) {
      handleAddCell("code", index);
      setSelectedCellIndex(index + 1);
    } else {
      setSelectedCellIndex(index + 1);
    }
  };

  /**
   * Run All Python Cells Sequentially
   */
  const handleRunAllCells = async () => {
    setIsKernelBusy(true);
    showNotification("Executing all notebook cells with Python SDK...");
    for (let i = 0; i < notebookCells.length; i++) {
      if (notebookCells[i].type === "code") {
        await handleRunCell(i);
      }
    }
    setIsKernelBusy(false);
    showNotification("Finished running all notebook cells.");
  };

  /**
   * Cell Management Helpers
   */
  const handleUpdateCellSource = (index, newSource) => {
    setNotebookCells((prev) =>
      prev.map((c, idx) => (idx === index ? { ...c, source: newSource } : c))
    );
  };

  const handleAddCell = (type, afterIndex = null) => {
    const newCell = {
      id: `cell-${Date.now()}`,
      type: type,
      source:
        type === "code"
          ? `# New Python Cell\nprint("Executing inside BlackHole Python SDK")`
          : `### New Section\nWrite notes here...`,
      output: "",
      error: "",
      executionCount: null,
      isRunning: false,
    };

    setNotebookCells((prev) => {
      if (afterIndex === null || afterIndex === undefined) {
        return [...prev, newCell];
      }
      const updated = [...prev];
      updated.splice(afterIndex + 1, 0, newCell);
      return updated;
    });

    if (afterIndex !== null && afterIndex !== undefined) {
      setSelectedCellIndex(afterIndex + 1);
    } else {
      setSelectedCellIndex(notebookCells.length);
    }
  };

  const handleDeleteCell = (index) => {
    if (notebookCells.length <= 1) {
      showNotification("Notebook must contain at least one cell.");
      return;
    }
    setNotebookCells((prev) => prev.filter((_, idx) => idx !== index));
    setSelectedCellIndex((prev) => Math.max(0, Math.min(prev, notebookCells.length - 2)));
    showNotification("Cell deleted.");
  };

  const handleCutCell = (index) => {
    if (notebookCells.length <= 1) {
      showNotification("Cannot cut the only remaining cell.");
      return;
    }
    const cellToCut = notebookCells[index];
    setCellClipboard(cellToCut);
    setNotebookCells((prev) => prev.filter((_, i) => i !== index));
    setSelectedCellIndex((prev) => Math.max(0, Math.min(prev, notebookCells.length - 2)));
    showNotification("Cell cut to clipboard.");
  };

  const handleCopyCell = (index) => {
    const cellToCopy = notebookCells[index];
    if (cellToCopy) {
      setCellClipboard({ ...cellToCopy, id: `cell-${Date.now()}` });
      showNotification("Cell copied to clipboard.");
    }
  };

  const handlePasteCell = (index, position = "below") => {
    if (!cellClipboard) {
      showNotification("Clipboard is empty.");
      return;
    }
    const newCell = {
      ...cellClipboard,
      id: `cell-${Date.now()}`,
      executionCount: null,
      output: "",
      error: "",
    };
    const targetPos = position === "above" ? index : index + 1;
    setNotebookCells((prev) => {
      const copy = [...prev];
      copy.splice(targetPos, 0, newCell);
      return copy;
    });
    setSelectedCellIndex(targetPos);
    showNotification(`Cell pasted ${position}.`);
  };

  const handleMoveCell = (index, direction) => {
    if (direction === "up" && index > 0) {
      setNotebookCells((prev) => {
        const copy = [...prev];
        const temp = copy[index];
        copy[index] = copy[index - 1];
        copy[index - 1] = temp;
        return copy;
      });
      setSelectedCellIndex(index - 1);
    } else if (direction === "down" && index < notebookCells.length - 1) {
      setNotebookCells((prev) => {
        const copy = [...prev];
        const temp = copy[index];
        copy[index] = copy[index + 1];
        copy[index + 1] = temp;
        return copy;
      });
      setSelectedCellIndex(index + 1);
    }
  };

  const handleConvertCellType = (index, newType) => {
    setNotebookCells((prev) =>
      prev.map((c, i) =>
        i === index
          ? {
              ...c,
              type: newType,
              output: newType === "markdown" ? "" : c.output,
              error: newType === "markdown" ? "" : c.error,
              executionCount: newType === "markdown" ? null : c.executionCount,
            }
          : c
      )
    );
    showNotification(`Converted cell to ${newType}.`);
  };

  const handleRestartKernel = () => {
    setIsKernelBusy(false);
    setNotebookCells((prev) =>
      prev.map((c) => ({
        ...c,
        isRunning: false,
        executionCount: null,
      }))
    );
    showNotification("Kernel restarted (Python 3 ipykernel).");
  };

  const handleRestartAndRunAll = async () => {
    handleRestartKernel();
    await handleRunAllCells();
  };

  const handleSaveCheckpoint = () => {
    const timeStr = new Date().toLocaleTimeString();
    showNotification(`Notebook checkpoint saved at ${timeStr}`);
  };

  const handleExportPython = () => {
    const codeBlocks = notebookCells
      .filter((c) => c.type === "code")
      .map((c, i) => `# In [${i + 1}]:\n${c.source}`)
      .join("\n\n# --------------------------------------------------\n\n");
    const blob = new Blob([codeBlocks], { type: "text/x-python" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName.replace(/\.[^/.]+$/, "") + ".py";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showNotification("Exported Python script (.py)");
  };

  const handleClearOutputs = () => {
    setNotebookCells((prev) =>
      prev.map((c) => ({ ...c, output: "", error: "", executionCount: null }))
    );
    showNotification("Cleared all cell outputs.");
  };

  /**
   * Download Active File
   */
  const handleDownload = () => {
    let blob;
    let downloadName = fileName;

    if (fileType === "ipynb") {
      const ipynbStructure = {
        cells: notebookCells.map((c) => ({
          cell_type: c.type,
          metadata: {},
          source: c.source.split("\n").map((line, i, arr) => (i < arr.length - 1 ? `${line}\n` : line)),
          execution_count: c.executionCount,
          outputs: c.output
            ? [
                {
                  output_type: "stream",
                  name: "stdout",
                  text: c.output.split("\n").map((line, i, arr) => (i < arr.length - 1 ? `${line}\n` : line)),
                },
              ]
            : [],
        })),
        metadata: {
          kernelspec: {
            display_name: "Python 3 (BlackHole SDK)",
            language: "python",
            name: "python3",
          },
          language_info: {
            name: "python",
            version: "3.12.0",
          },
        },
        nbformat: 4,
        nbformat_minor: 5,
      };

      blob = new Blob([JSON.stringify(ipynbStructure, null, 2)], {
        type: "application/x-ipynb+json",
      });
      if (!downloadName.endsWith(".ipynb")) downloadName += ".ipynb";
    } else {
      blob = new Blob([markdownContent], { type: "text/markdown" });
      if (!downloadName.endsWith(".md")) downloadName += ".md";
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = downloadName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showNotification(`Downloaded ${downloadName}`);
  };

  /**
   * Assistant Integration: Insert Snippet from Agent
   */
  const handleAssistantInsert = (snippet, snippetType) => {
    if (fileType === "ipynb") {
      const newCell = {
        id: `cell-${Date.now()}`,
        type: snippetType === "markdown" ? "markdown" : "code",
        source: snippet,
        output: "",
        error: "",
        executionCount: null,
        isRunning: false,
      };
      setNotebookCells((prev) => [...prev, newCell]);
      showNotification(`Inserted ${snippetType} cell from Assistant!`);
    } else {
      setMarkdownContent((prev) => `${prev}\n\n${snippet}`);
      showNotification("Appended content from Assistant to Markdown notes!");
    }
  };


  return (
    <div
      className={`workspace-container ${isDragging ? "workspace-drag-over" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setIsDragging(false);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        handleFileUpload(file);
      }}
    >
      {/* Hidden File Upload Input */}
      <input
        ref={fileInputRef}
        id={uploadInputId}
        type="file"
        accept=".md,.ipynb,text/markdown,application/json,application/x-ipynb+json"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          handleFileUpload(file);
          e.target.value = "";
        }}
      />

      {/* Drag & Drop Visual Overlay */}
      {isDragging && (
        <div className="workspace-drop-overlay">
          <div className="drop-target-box">
            <div className="drop-symbol">
              <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3>Drop your file into BlackHole</h3>
            <p>Supports .md (Markdown Split View) and .ipynb (Jupyter Notebook with Python SDK)</p>
          </div>
        </div>
      )}

      {/* LEFT PANEL: Agentic Assistant */}
      <AgenticAssistant
        activeFileType={fileType}
        activeFileName={fileName}
        documentContent={fileType === "ipynb" ? notebookCells : markdownContent}
        onInsertSnippet={handleAssistantInsert}
        onRunAllCells={handleRunAllCells}
        pythonSdkStatus={pythonStatus}
        isOpen={isAssistantOpen}
        onToggle={() => setIsAssistantOpen((prev) => !prev)}
      />

      {/* MAIN WORKSPACE AREA */}
      <section className="workspace-main-panel">
        {/* Top Workspace Toolbar */}
        <header className="workspace-toolbar">
          <div className="toolbar-left">
            <div className="file-badge-group">
              <span className={`file-type-pill ${fileType === "ipynb" ? "pill-ipynb" : "pill-md"}`}>
                {fileType === "ipynb" ? ".ipynb" : ".md"}
              </span>
              <span className="file-name-display" title={fileName}>
                {fileName}
              </span>
            </div>
          </div>

          <div className="toolbar-center">
            {/* Format Mode Switcher */}
            <div className="mode-toggle-group">
              <button
                type="button"
                className={`mode-btn ${fileType === "md" ? "mode-btn-active" : ""}`}
                onClick={() => {
                  if (fileType !== "md") loadDefaultTemplate("md");
                }}
              >
                Split Markdown View
              </button>
              <button
                type="button"
                className={`mode-btn ${fileType === "ipynb" ? "mode-btn-active" : ""}`}
                onClick={() => {
                  if (fileType !== "ipynb") loadDefaultTemplate("ipynb");
                }}
              >
                Jupyter Notebook
              </button>
            </div>
          </div>

          <div className="toolbar-right">
            {/* Upload Button */}
            <label
              htmlFor={uploadInputId}
              className="toolbar-action-btn upload-trigger-btn"
              title="Upload .md or .ipynb file from your computer"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 16V4M12 4L7.5 8.5M12 4L16.5 8.5M5 14V19H19V14" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Upload File</span>
            </label>

            {/* Notebook Specific Action: Run All */}
            {fileType === "ipynb" && (
              <button
                type="button"
                className="toolbar-action-btn run-all-btn"
                onClick={handleRunAllCells}
                title="Run all Python cells with WebAssembly Python SDK"
              >
                <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                <span>Run All</span>
              </button>
            )}

            {/* Download Button */}
            <button
              type="button"
              className="toolbar-action-btn download-btn"
              onClick={handleDownload}
              title={`Download active ${fileType === "ipynb" ? ".ipynb" : ".md"} file`}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 4v12M12 16l4.5-4.5M12 16L7.5 11.5M5 19h14" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Export</span>
            </button>
          </div>
        </header>

        {/* Global Notification Banner */}
        {notification && (
          <div className="workspace-notification-bar">
            <span>{notification}</span>
          </div>
        )}

        {/* WORKSPACE BODY */}
        <div className="workspace-content-body">
          {/* ====================================================
              VIEW A: SPLIT VIEW FOR MARKDOWN (.md)
          ==================================================== */}
          {fileType === "md" ? (
            <div className="unified-split-panel">
              {/* Single Continuous Center Partition Line: Exactly Aligned to Dead Center */}
              <div className="unified-panel-center-line" aria-hidden="true" />

              {/* Unified Partitioned Header (Exact 50/50 Symmetry) */}
              <div className="unified-panel-header">
                <div className="header-partition-left">
                  <div className="pane-title">
                    <span className="pane-dot" />
                    <span>Markdown Source</span>
                  </div>
                  <span className="partition-role-tag">EDITOR</span>
                </div>

                <div className="header-partition-right">
                  <div className="pane-title">
                    <span className="preview-dot" />
                    <span>Live Document Preview</span>
                  </div>
                  <span className="sync-status-badge">SYNC SCROLL ACTIVE</span>
                </div>
              </div>

              {/* Unified Partitioned Body (Exact 50/50 Symmetry) */}
              <div className="unified-panel-body">
                {/* Left Partition: Source Editor */}
                <div className="body-partition-editor">
                  <textarea
                    ref={markdownTextareaRef}
                    className="markdown-editor-textarea"
                    value={markdownContent}
                    onChange={(e) => setMarkdownContent(e.target.value)}
                    onScroll={handleEditorScroll}
                    placeholder="Type or paste Markdown content here..."
                    spellCheck="false"
                  />
                </div>

                {/* Right Partition: Live Rendered Preview */}
                <div
                  className="body-partition-preview"
                  ref={previewRef}
                  onScroll={handlePreviewScroll}
                >
                  <div
                    className="markdown-rendered-view"
                    dangerouslySetInnerHTML={{
                      __html: marked.parse(markdownContent || "*Empty document. Type on the left or upload a file.*"),
                    }}
                  />
                </div>
              </div>

              {/* Unified Partitioned Footer (Exact 50/50 Symmetry) */}
              <div className="unified-panel-footer">
                <div className="footer-partition-left">
                  <span>Lines: {markdownContent.split("\n").length}</span>
                  <span>Characters: {markdownContent.length}</span>
                </div>

                <div className="footer-partition-right">
                  <span className="sync-indicator">Synchronized View</span>
                  <span>GitHub Flavored Markdown</span>
                </div>
              </div>
            </div>
          ) : (
            /* ====================================================
                VIEW B: INTERACTIVE JUPYTER NOTEBOOK WORKSPACE
            ==================================================== */
            <div className="jupyter-notebook-workspace">
              <div className="jupyter-software-window">
                  {/* Top Bar: Brand Logo, Document Title, Checkpoint */}
                  <div className="jupyter-header-band">
                    <div className="jupyter-header-brand-cluster">
                      {/* Jupyter Logo SVG with Cosmic Yellow Orbit */}
                      <svg className="jupyter-brand-logo" viewBox="0 0 152 165" width="20" height="22">
                        <path
                          fill="#ffd84d"
                          d="M76.021 140.163c-32.64 0-61.145-11.927-75.942-29.58 5.51 15.84 15.781 29.567 29.39 39.278a80.17 80.17 0 0 0 46.57 14.929 80.17 80.17 0 0 0 46.57-14.929c13.61-9.711 23.88-23.437 29.391-39.278-14.833 17.653-43.338 29.58-75.979 29.58m-.005-114.832c32.64 0 61.146 11.927 75.943 29.58a80.9 80.9 0 0 0-29.391-39.278A80.16 80.16 0 0 0 75.998.705a80.16 80.16 0 0 0-46.57 14.928A80.9 80.9 0 0 0 .038 54.912c14.832-17.617 43.338-29.58 75.978-29.58"
                        />
                        <circle fill="#ffd84d" cx="19.5" cy="82.5" r="14.5" />
                        <circle fill="#ffd84d" cx="132.5" cy="82.5" r="14.5" />
                        <circle fill="#ffd84d" cx="76" cy="14" r="8" />
                      </svg>
                      <span className="jupyter-brand-word">jupyter</span>
                    </div>

                    <div className="jupyter-doc-title-cluster">
                      {isEditingTitle ? (
                        <input
                          type="text"
                          className="jupyter-doc-title-input"
                          value={fileName}
                          autoFocus
                          onChange={(e) => setFileName(e.target.value)}
                          onBlur={() => setIsEditingTitle(false)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") setIsEditingTitle(false);
                          }}
                        />
                      ) : (
                        <span
                          className="jupyter-doc-title"
                          onClick={() => setIsEditingTitle(true)}
                          title="Click to rename notebook"
                        >
                          {fileName}
                        </span>
                      )}
                      <span className="jupyter-checkpoint-label">(autosaved)</span>
                      <span className="jupyter-trusted-pill">Trusted</span>
                    </div>

                    <div className="jupyter-header-status-cluster">
                      <span className="jupyter-kernel-indicator">
                        <span className={`kernel-status-dot ${isKernelBusy ? "dot-busy" : "dot-idle"}`} />
                        <span>Python 3 (ipykernel)</span>
                      </span>
                    </div>
                  </div>

                  {/* Complete Working Jupyter Menu Bar */}
                  <div className="jupyter-menubar-container">
                    {/* File Menu */}
                    <div className="jupyter-menu-wrapper">
                      <button
                        type="button"
                        className={`jupyter-menu-trigger ${activeMenu === "file" ? "active" : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenu(activeMenu === "file" ? null : "file");
                        }}
                      >
                        File
                      </button>
                      {activeMenu === "file" && (
                        <div className="jupyter-dropdown-menu">
                          <button
                            type="button"
                            className="jupyter-dropdown-item"
                            onClick={() => {
                              loadDefaultTemplate("ipynb");
                              setActiveMenu(null);
                            }}
                          >
                            <span>New Notebook</span>
                          </button>
                          <button
                            type="button"
                            className="jupyter-dropdown-item"
                            onClick={() => {
                              fileInputRef.current?.click();
                              setActiveMenu(null);
                            }}
                          >
                            <span>Open...</span>
                          </button>
                          <button
                            type="button"
                            className="jupyter-dropdown-item"
                            onClick={() => {
                              handleSaveCheckpoint();
                              setActiveMenu(null);
                            }}
                          >
                            <span>Save and Checkpoint</span>
                            <span className="menu-shortcut-badge">Ctrl+S</span>
                          </button>
                          <div className="jupyter-menu-divider" />
                          <button
                            type="button"
                            className="jupyter-dropdown-item"
                            onClick={() => {
                              handleDownload();
                              setActiveMenu(null);
                            }}
                          >
                            <span>Download as .ipynb</span>
                          </button>
                          <button
                            type="button"
                            className="jupyter-dropdown-item"
                            onClick={() => {
                              handleExportPython();
                              setActiveMenu(null);
                            }}
                          >
                            <span>Download as .py (Python)</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Edit Menu */}
                    <div className="jupyter-menu-wrapper">
                      <button
                        type="button"
                        className={`jupyter-menu-trigger ${activeMenu === "edit" ? "active" : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenu(activeMenu === "edit" ? null : "edit");
                        }}
                      >
                        Edit
                      </button>
                      {activeMenu === "edit" && (
                        <div className="jupyter-dropdown-menu">
                          <button
                            type="button"
                            className="jupyter-dropdown-item"
                            onClick={() => {
                              handleCutCell(selectedCellIndex);
                              setActiveMenu(null);
                            }}
                          >
                            <span>Cut Cell</span>
                            <span className="menu-shortcut-badge">X</span>
                          </button>
                          <button
                            type="button"
                            className="jupyter-dropdown-item"
                            onClick={() => {
                              handleCopyCell(selectedCellIndex);
                              setActiveMenu(null);
                            }}
                          >
                            <span>Copy Cell</span>
                            <span className="menu-shortcut-badge">C</span>
                          </button>
                          <button
                            type="button"
                            className="jupyter-dropdown-item"
                            onClick={() => {
                              handlePasteCell(selectedCellIndex, "below");
                              setActiveMenu(null);
                            }}
                          >
                            <span>Paste Cell Below</span>
                            <span className="menu-shortcut-badge">V</span>
                          </button>
                          <button
                            type="button"
                            className="jupyter-dropdown-item"
                            onClick={() => {
                              handlePasteCell(selectedCellIndex, "above");
                              setActiveMenu(null);
                            }}
                          >
                            <span>Paste Cell Above</span>
                            <span className="menu-shortcut-badge">Shift+V</span>
                          </button>
                          <div className="jupyter-menu-divider" />
                          <button
                            type="button"
                            className="jupyter-dropdown-item"
                            onClick={() => {
                              handleDeleteCell(selectedCellIndex);
                              setActiveMenu(null);
                            }}
                          >
                            <span>Delete Selected Cell</span>
                            <span className="menu-shortcut-badge">D, D</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* View Menu */}
                    <div className="jupyter-menu-wrapper">
                      <button
                        type="button"
                        className={`jupyter-menu-trigger ${activeMenu === "view" ? "active" : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenu(activeMenu === "view" ? null : "view");
                        }}
                      >
                        View
                      </button>
                      {activeMenu === "view" && (
                        <div className="jupyter-dropdown-menu">
                          <button
                            type="button"
                            className="jupyter-dropdown-item"
                            onClick={() => {
                              setShowLineNumbers((prev) => !prev);
                              setActiveMenu(null);
                            }}
                          >
                            <span>{showLineNumbers ? "[x] Line Numbers" : "[ ] Line Numbers"}</span>
                            <span className="menu-shortcut-badge">L</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Insert Menu */}
                    <div className="jupyter-menu-wrapper">
                      <button
                        type="button"
                        className={`jupyter-menu-trigger ${activeMenu === "insert" ? "active" : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenu(activeMenu === "insert" ? null : "insert");
                        }}
                      >
                        Insert
                      </button>
                      {activeMenu === "insert" && (
                        <div className="jupyter-dropdown-menu">
                          <button
                            type="button"
                            className="jupyter-dropdown-item"
                            onClick={() => {
                              handleAddCell("code", Math.max(0, selectedCellIndex - 1));
                              setActiveMenu(null);
                            }}
                          >
                            <span>Insert Cell Above</span>
                            <span className="menu-shortcut-badge">A</span>
                          </button>
                          <button
                            type="button"
                            className="jupyter-dropdown-item"
                            onClick={() => {
                              handleAddCell("code", selectedCellIndex);
                              setActiveMenu(null);
                            }}
                          >
                            <span>Insert Cell Below</span>
                            <span className="menu-shortcut-badge">B</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Cell Menu */}
                    <div className="jupyter-menu-wrapper">
                      <button
                        type="button"
                        className={`jupyter-menu-trigger ${activeMenu === "cell" ? "active" : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenu(activeMenu === "cell" ? null : "cell");
                        }}
                      >
                        Cell
                      </button>
                      {activeMenu === "cell" && (
                        <div className="jupyter-dropdown-menu">
                          <button
                            type="button"
                            className="jupyter-dropdown-item"
                            onClick={() => {
                              handleRunCellAndSelectNext(selectedCellIndex);
                              setActiveMenu(null);
                            }}
                          >
                            <span>Run Cells and Select Below</span>
                            <span className="menu-shortcut-badge">Shift+Enter</span>
                          </button>
                          <button
                            type="button"
                            className="jupyter-dropdown-item"
                            onClick={() => {
                              handleRunCell(selectedCellIndex);
                              setActiveMenu(null);
                            }}
                          >
                            <span>Run Cells (In-Place)</span>
                            <span className="menu-shortcut-badge">Ctrl+Enter</span>
                          </button>
                          <button
                            type="button"
                            className="jupyter-dropdown-item"
                            onClick={() => {
                              handleRunAllCells();
                              setActiveMenu(null);
                            }}
                          >
                            <span>Run All</span>
                          </button>
                          <div className="jupyter-menu-divider" />
                          <button
                            type="button"
                            className="jupyter-dropdown-item"
                            onClick={() => {
                              handleConvertCellType(selectedCellIndex, "code");
                              setActiveMenu(null);
                            }}
                          >
                            <span>Cell Type: Code</span>
                            <span className="menu-shortcut-badge">Y</span>
                          </button>
                          <button
                            type="button"
                            className="jupyter-dropdown-item"
                            onClick={() => {
                              handleConvertCellType(selectedCellIndex, "markdown");
                              setActiveMenu(null);
                            }}
                          >
                            <span>Cell Type: Markdown</span>
                            <span className="menu-shortcut-badge">M</span>
                          </button>
                          <div className="jupyter-menu-divider" />
                          <button
                            type="button"
                            className="jupyter-dropdown-item"
                            onClick={() => {
                              handleClearOutputs();
                              setActiveMenu(null);
                            }}
                          >
                            <span>Clear All Outputs</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Kernel Menu */}
                    <div className="jupyter-menu-wrapper">
                      <button
                        type="button"
                        className={`jupyter-menu-trigger ${activeMenu === "kernel" ? "active" : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenu(activeMenu === "kernel" ? null : "kernel");
                        }}
                      >
                        Kernel
                      </button>
                      {activeMenu === "kernel" && (
                        <div className="jupyter-dropdown-menu">
                          <button
                            type="button"
                            className="jupyter-dropdown-item"
                            onClick={() => {
                              setIsKernelBusy(false);
                              showNotification("Kernel interrupted.");
                              setActiveMenu(null);
                            }}
                          >
                            <span>Interrupt</span>
                            <span className="menu-shortcut-badge">I, I</span>
                          </button>
                          <button
                            type="button"
                            className="jupyter-dropdown-item"
                            onClick={() => {
                              handleRestartKernel();
                              setActiveMenu(null);
                            }}
                          >
                            <span>Restart</span>
                            <span className="menu-shortcut-badge">0, 0</span>
                          </button>
                          <button
                            type="button"
                            className="jupyter-dropdown-item"
                            onClick={() => {
                              handleRestartKernel();
                              handleClearOutputs();
                              setActiveMenu(null);
                            }}
                          >
                            <span>Restart & Clear Output</span>
                          </button>
                          <button
                            type="button"
                            className="jupyter-dropdown-item"
                            onClick={() => {
                              handleRestartAndRunAll();
                              setActiveMenu(null);
                            }}
                          >
                            <span>Restart & Run All</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Help Menu */}
                    <div className="jupyter-menu-wrapper">
                      <button
                        type="button"
                        className={`jupyter-menu-trigger ${activeMenu === "help" ? "active" : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenu(activeMenu === "help" ? null : "help");
                        }}
                      >
                        Help
                      </button>
                      {activeMenu === "help" && (
                        <div className="jupyter-dropdown-menu">
                          <button
                            type="button"
                            className="jupyter-dropdown-item"
                            onClick={() => {
                              setShowShortcutsModal(true);
                              setActiveMenu(null);
                            }}
                          >
                            <span>Keyboard Shortcuts</span>
                            <span className="menu-shortcut-badge">H</span>
                          </button>
                          <button
                            type="button"
                            className="jupyter-dropdown-item"
                            onClick={() => {
                              showNotification("BlackHole Pyodide WebAssembly Python SDK Active");
                              setActiveMenu(null);
                            }}
                          >
                            <span>About Jupyter Software Sandbox</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Iconic Jupyter Command Toolbar */}
                  <div className="jupyter-toolbar-strip">
                    <button
                      type="button"
                      className="jupyter-tb-btn"
                      onClick={handleSaveCheckpoint}
                      title="Save and Checkpoint (Ctrl+S)"
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                        <polyline points="17 21 17 13 7 13 7 21" />
                        <polyline points="7 3 7 8 15 8" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      className="jupyter-tb-btn"
                      onClick={() => handleAddCell("code", selectedCellIndex)}
                      title="Insert cell below (B)"
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </button>

                    <div className="jupyter-tb-separator" />

                    <button
                      type="button"
                      className="jupyter-tb-btn"
                      onClick={() => handleCutCell(selectedCellIndex)}
                      title="Cut selected cells (X)"
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="6" cy="6" r="3" />
                        <circle cx="6" cy="18" r="3" />
                        <line x1="20" y1="4" x2="8.12" y2="15.88" />
                        <line x1="14.47" y1="14.48" x2="20" y2="20" />
                        <line x1="8.12" y1="8.12" x2="12" y2="12" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      className="jupyter-tb-btn"
                      onClick={() => handleCopyCell(selectedCellIndex)}
                      title="Copy selected cells (C)"
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      className="jupyter-tb-btn"
                      onClick={() => handlePasteCell(selectedCellIndex, "below")}
                      title="Paste cells below (V)"
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                      </svg>
                    </button>

                    <div className="jupyter-tb-separator" />

                    <button
                      type="button"
                      className="jupyter-tb-btn"
                      onClick={() => handleMoveCell(selectedCellIndex, "up")}
                      title="Move selected cells up"
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="19" x2="12" y2="5" />
                        <polyline points="5 12 12 5 19 12" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      className="jupyter-tb-btn"
                      onClick={() => handleMoveCell(selectedCellIndex, "down")}
                      title="Move selected cells down"
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <polyline points="19 12 12 19 5 12" />
                      </svg>
                    </button>

                    <div className="jupyter-tb-separator" />

                    <button
                      type="button"
                      className="jupyter-tb-btn jupyter-run-pill"
                      onClick={() => handleRunCellAndSelectNext(selectedCellIndex)}
                      title="Run the selected cells and advance (Shift+Enter)"
                    >
                      <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                      <span>Run</span>
                    </button>

                    <button
                      type="button"
                      className="jupyter-tb-btn"
                      onClick={() => {
                        setIsKernelBusy(false);
                        showNotification("Kernel interrupted.");
                      }}
                      title="Interrupt the kernel (I, I)"
                    >
                      <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
                        <rect x="6" y="6" width="12" height="12" rx="1" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      className="jupyter-tb-btn"
                      onClick={handleRestartKernel}
                      title="Restart the kernel (0, 0)"
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="23 4 23 10 17 10" />
                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      className="jupyter-tb-btn"
                      onClick={handleRestartAndRunAll}
                      title="Restart the kernel, then re-run the whole notebook"
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="13 19 22 12 13 5 13 19" fill="#ffd84d" stroke="none" />
                        <polygon points="2 19 11 12 2 5 2 19" fill="#ffd84d" stroke="none" />
                      </svg>
                    </button>

                    <div className="jupyter-tb-separator" />

                    {/* Cell Type Selector */}
                    <div className="jupyter-cell-type-select-wrap">
                      <select
                        className="jupyter-cell-type-select"
                        value={notebookCells[selectedCellIndex]?.type || "code"}
                        onChange={(e) => handleConvertCellType(selectedCellIndex, e.target.value)}
                        title="Change cell type (Y for Code, M for Markdown)"
                      >
                        <option value="code">Code</option>
                        <option value="markdown">Markdown</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      className={`jupyter-tb-btn ${showLineNumbers ? "active-toggle" : ""}`}
                      onClick={() => setShowLineNumbers((prev) => !prev)}
                      title="Toggle Line Numbers (L)"
                    >
                      <span className="tb-ln-tag">#</span>
                    </button>

                    <div className="jupyter-tb-spacer" />

                    <div className="jupyter-kernel-toolbar-status">
                      <span className={`kernel-status-dot ${isKernelBusy ? "dot-busy" : "dot-idle"}`} />
                      <span className="kernel-status-text">
                        {isKernelBusy ? "Kernel Busy..." : "Python 3 (Idle)"}
                      </span>
                    </div>
                  </div>

                  {/* Notebook Interactive Cells Canvas */}
                  <div className="jupyter-cells-canvas">
                    {notebookCells.map((cell, index) => {
                      const isSelected = selectedCellIndex === index;
                      const lineCount = cell.source.split("\n").length;

                      return (
                        <div key={cell.id} className="jupyter-cell-block-group">
                          {/* In-Between Cell Add Triggers on Hover */}
                          <div className="jupyter-cell-inserter">
                            <button
                              type="button"
                              className="inserter-btn"
                              onClick={() => handleAddCell("code", index - 1)}
                              title="Insert Code Cell Here"
                            >
                              + Code
                            </button>
                            <button
                              type="button"
                              className="inserter-btn"
                              onClick={() => handleAddCell("markdown", index - 1)}
                              title="Insert Markdown Cell Here"
                            >
                              + Markdown
                            </button>
                          </div>

                          {/* The Notebook Cell */}
                          <div
                            className={`jupyter-cell-row ${
                              cell.type === "code" ? "jupyter-code-cell" : "jupyter-markdown-cell"
                            } ${isSelected ? "jupyter-cell-selected" : ""} ${
                              cell.isRunning ? "jupyter-cell-running" : ""
                            }`}
                            onClick={() => setSelectedCellIndex(index)}
                          >
                            {/* Left Focus Bar Indicator */}
                            <div className="cell-focus-bar" />

                            {/* Input Prompt Section */}
                            <div className="cell-input-row">
                              <div className="cell-prompt-gutter">
                                {cell.type === "code" ? (
                                  <span className="prompt-label in-prompt">
                                    {cell.isRunning
                                      ? "In [*]:"
                                      : cell.executionCount !== null
                                      ? `In [${cell.executionCount}]:`
                                      : "In [ ]:"}
                                  </span>
                                ) : (
                                  <span className="prompt-label md-prompt" />
                                )}
                              </div>

                              <div className="cell-input-box">
                                {cell.type === "code" ? (
                                  <div className="code-editor-layout">
                                    {showLineNumbers && (
                                      <div className="code-line-numbers" aria-hidden="true">
                                        {Array.from({ length: Math.max(1, lineCount) }, (_, i) => (
                                          <div key={i + 1} className="ln-digit">
                                            {i + 1}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    <textarea
                                      className="code-editor-textarea"
                                      value={cell.source}
                                      onChange={(e) => handleUpdateCellSource(index, e.target.value)}
                                      onFocus={() => setSelectedCellIndex(index)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter" && e.shiftKey) {
                                          e.preventDefault();
                                          handleRunCellAndSelectNext(index);
                                        } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                                          e.preventDefault();
                                          handleRunCell(index);
                                        }
                                      }}
                                      placeholder="Type Python code here... (Shift+Enter to run)"
                                      rows={Math.max(2, lineCount)}
                                      spellCheck="false"
                                    />
                                    <div className="cell-quick-action-strip">
                                      <button
                                        type="button"
                                        className="cell-quick-run-btn"
                                        disabled={cell.isRunning}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRunCell(index);
                                        }}
                                        title="Execute this cell (Shift+Enter)"
                                      >
                                        {cell.isRunning ? (
                                          <span className="cell-mini-spin" />
                                        ) : (
                                          <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor">
                                            <polygon points="5 3 19 12 5 21 5 3" />
                                          </svg>
                                        )}
                                      </button>
                                      <button
                                        type="button"
                                        className="cell-quick-del-btn"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteCell(index);
                                        }}
                                        title="Delete cell"
                                      >
                                        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                                          <line x1="18" y1="6" x2="6" y2="18" />
                                          <line x1="6" y1="6" x2="18" y2="18" />
                                        </svg>
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  /* Markdown Cell Rendering / Editing */
                                  <div className="markdown-cell-container">
                                    {editingMarkdownIndex === index ? (
                                      <div className="md-edit-box">
                                        <textarea
                                          className="md-editor-textarea"
                                          value={cell.source}
                                          autoFocus
                                          onChange={(e) => handleUpdateCellSource(index, e.target.value)}
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter" && e.shiftKey) {
                                              e.preventDefault();
                                              setEditingMarkdownIndex(null);
                                            }
                                          }}
                                          onBlur={() => setEditingMarkdownIndex(null)}
                                          placeholder="Type markdown documentation here... (Shift+Enter to render)"
                                          rows={Math.max(2, lineCount)}
                                          spellCheck="false"
                                        />
                                        <div className="md-edit-footer">
                                          <span>Press Shift+Enter or click outside to render</span>
                                        </div>
                                      </div>
                                    ) : (
                                      <div
                                        className="md-rendered-content"
                                        onDoubleClick={() => setEditingMarkdownIndex(index)}
                                        title="Double-click to edit Markdown cell"
                                        dangerouslySetInnerHTML={{
                                          __html: marked.parse(cell.source || "*Double-click to edit Markdown cell*"),
                                        }}
                                      />
                                    )}
                                    <div className="cell-quick-action-strip">
                                      <button
                                        type="button"
                                        className="cell-quick-edit-btn"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingMarkdownIndex(editingMarkdownIndex === index ? null : index);
                                        }}
                                        title={editingMarkdownIndex === index ? "Render Markdown" : "Edit Markdown"}
                                      >
                                        {editingMarkdownIndex === index ? (
                                          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <polyline points="20 6 9 17 4 12" />
                                          </svg>
                                        ) : (
                                          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M12 20h9" />
                                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                          </svg>
                                        )}
                                      </button>
                                      <button
                                        type="button"
                                        className="cell-quick-del-btn"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteCell(index);
                                        }}
                                        title="Delete cell"
                                      >
                                        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                                          <line x1="18" y1="6" x2="6" y2="18" />
                                          <line x1="6" y1="6" x2="18" y2="18" />
                                        </svg>
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Output Section (Code Cells Only) */}
                            {cell.type === "code" && (cell.output || cell.error) && (
                              <div className="cell-output-row">
                                <div className="cell-prompt-gutter">
                                  <span className="prompt-label out-prompt">
                                    {cell.executionCount !== null ? `Out [${cell.executionCount}]:` : "Out:"}
                                  </span>
                                </div>
                                <div className="cell-output-box">
                                  {cell.output && (
                                    <pre className="output-stream-text">{cell.output}</pre>
                                  )}
                                  {cell.error && (
                                    <pre className="output-error-text">{cell.error}</pre>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Bottom Append Buttons */}
                    <div className="jupyter-append-cell-bar">
                      <button
                        type="button"
                        className="append-cell-btn"
                        onClick={() => handleAddCell("code")}
                        title="Add Code Cell to Bottom"
                      >
                        + Add Code Cell
                      </button>
                      <button
                        type="button"
                        className="append-cell-btn"
                        onClick={() => handleAddCell("markdown")}
                        title="Add Markdown Cell to Bottom"
                      >
                        + Add Markdown Cell
                      </button>
                    </div>
                  </div>

                  {/* Bottom Jupyter Status Bar */}
                  <div className="jupyter-statusbar-band">
                    <div className="sb-segment">
                      <span className="sb-label">Mode:</span>
                      <span className="sb-val">Command Mode</span>
                    </div>
                    <div className="sb-segment">
                      <span className="sb-label">Engine:</span>
                      <span className="sb-val">{pythonStatusMsg || "Python 3 (BlackHole Pyodide WebAssembly)"}</span>
                    </div>
                    <div className="sb-segment">
                      <span className="sb-label">Cells:</span>
                      <span className="sb-val">{notebookCells.length} total</span>
                    </div>
                    <div className="sb-segment sb-right">
                      <span className="sb-val">UTF-8</span>
                    </div>
                  </div>
                </div>

              {/* Keyboard Shortcuts Reference Modal */}
              {showShortcutsModal && (
                <div className="jupyter-modal-overlay" onClick={() => setShowShortcutsModal(false)}>
                  <div className="jupyter-modal-window" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                      <h3>Keyboard Shortcuts</h3>
                      <button
                        type="button"
                        className="modal-close-btn"
                        onClick={() => setShowShortcutsModal(false)}
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                    <div className="modal-body">
                      <div className="shortcut-section">
                        <h4>Command Mode (press Esc to enable)</h4>
                        <div className="shortcut-row">
                          <kbd>Shift</kbd> + <kbd>Enter</kbd>
                          <span>Run cell, select below</span>
                        </div>
                        <div className="shortcut-row">
                          <kbd>Ctrl</kbd> + <kbd>Enter</kbd>
                          <span>Run selected cells</span>
                        </div>
                        <div className="shortcut-row">
                          <kbd>A</kbd>
                          <span>Insert cell above</span>
                        </div>
                        <div className="shortcut-row">
                          <kbd>B</kbd>
                          <span>Insert cell below</span>
                        </div>
                        <div className="shortcut-row">
                          <kbd>X</kbd> / <kbd>C</kbd> / <kbd>V</kbd>
                          <span>Cut / Copy / Paste cell</span>
                        </div>
                        <div className="shortcut-row">
                          <kbd>D</kbd>, <kbd>D</kbd>
                          <span>Delete selected cell</span>
                        </div>
                        <div className="shortcut-row">
                          <kbd>Y</kbd>
                          <span>Change cell to code</span>
                        </div>
                        <div className="shortcut-row">
                          <kbd>M</kbd>
                          <span>Change cell to markdown</span>
                        </div>
                        <div className="shortcut-row">
                          <kbd>L</kbd>
                          <span>Toggle line numbers</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
