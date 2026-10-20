# BlackHole — Comprehensive Project Documentation & Claude Guide

> **Project Name:** BlackHole  
> **Repository:** [R-Mahesh-Babu-001/blackhole](https://github.com/R-Mahesh-Babu-001/blackhole.git)  
> **Author / Maintainer:** R-Mahesh-Babu-001  
> **Primary Technology Stack:** React 19, Vite 8, React Router v8, Python 3.14, FastAPI, Jupytext, Pyodide WebAssembly, Azure CI/CD  
> **Last Updated:** 2026-10-07  

---

## 1. Executive Summary & Vision

**BlackHole** is a cosmic-themed, high-performance web workspace application engineered for data scientists, astrophysicists, and developers. It unifies **document conversion**, **interactive note-taking**, **computational notebook execution**, and **agentic AI assistance** inside a unified interface anchored by a swirling black hole video background.

### Core Pillars
1. **Bidirectional Document Conversion (`/converter`):** Instant `.ipynb` $\leftrightarrow$ `.md` document conversion powered by Jupytext and FastAPI.
2. **Interactive Notes Workspace (`/notes`):** Split-view Markdown workspace with live editing on the left and real-time rendered preview on the right, with synchronized scrolling and full support for uploading and switching to `.ipynb` notebooks.
3. **Computational Laboratory (`/lab`) & Jupyter Sandbox:** Complete Jupyter Notebook software environment running directly in the browser. Features an authentic interactive desktop software suite (menubar with File/Edit/View/Insert/Cell/Kernel/Help, iconic command toolbar, `In [ ]:` and `Out [ ]:` execution gutters, line numbers) and a locally bundled static JupyterLite distribution (`/jupyter/notebooks/`, `/jupyter/lab/`) served directly from local assets with Pyodide WebAssembly Python SDK execution.
4. **Agentic Assistant (Left Panel):** Embedded on the left side of the workspace across Notes and Lab, the Agentic Assistant inspects the active document, debugs cell execution errors, provides explanations, and inserts generated code/markdown directly into the workspace with a single click.
5. **Pure Black & Cosmic Yellow Aesthetics:** Pure black background (`#000000`), solid opaque panels (`#060609`, `#09090d`, `#0d0d14`), zero transparency, and strictly yellow accents (`#ffd84d`, `#ffe36d`) with zero blue anywhere on the platform.

---

## 2. High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT BROWSER                                 │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                         React 19 SPA (Vite)                         │   │
│   │                                                                     │   │
│   │   [ AppLayout ] ── Pure solid black canvas (#000000)                │   │
│   │         ├── [ Navbar ] ── navigation links (Converter, Notes, Lab)  │   │
│   │         └── [ Outlet ] ── dynamic route viewports:                  │   │
│   │                 ├── /           ── Home (minimalist pure black)     │   │
│   │                 ├── /converter  ── Converter (Jupytext upload API)  │   │
│   │                 ├── /notes      ── Notes (Markdown Split View + NB) │   │
│   │                 └── /lab        ── Lab (Notebook Runner + Py SDK)   │   │
│   │                                                                     │   │
│   │   [ DocumentWorkspace ] (Used by both Notes & Lab)                  │   │
│   │         ├── [ AgenticAssistant ] (Left Panel: 340px solid dark)    │   │
│   │         ├── [ Workspace Toolbar ] (Upload, Format Switch, Run All)  │   │
│   │         └── [ Content Body ]:                                       │   │
│   │               ├── If .md: Split View (Editor | Live Preview)        │   │
│   │               └── If .ipynb: Jupyter Notebook (Live Python Runner)  │   │
│   └──────────────────────────────────┬──────────────────────────────────┘   │
└──────────────────────────────────────┼──────────────────────────────────────┘
                                       │
                ┌──────────────────────┴──────────────────────┐
                │                                             │
      In-Browser Python Execution                  HTTP REST Requests
     (Pyodide WebAssembly Runtime)               (FastAPI Python Microservice)
                │                                             │
                ▼                                             ▼
    • Standard Python 3.12 engine                 • POST /convert (Jupytext)
    • Persistent global variables                 • POST /execute (Code runner)
    • Zero server latency                         • GET / (Health check)
```

---

## 3. Repository Directory Structure

```
blackhole/
├── .github/
│   └── workflows/
│       ├── azure-static-web-apps-zealous-ocean-086cff900.yml  # Frontend CI/CD pipeline (Azure Static Web Apps)
│       └── main_blackhole.yml                                # Backend CI/CD pipeline (Azure App Service)
├── backend/
│   ├── .gitignore                                            # Python ignores (__pycache__, envs, OS artifacts)
│   ├── main.py                                               # FastAPI app: /convert, /execute, and CORS
│   └── requirements.txt                                      # Local backend dependencies (FastAPI, Jupytext, etc.)
├── frontend/
│   ├── public/
│   │   ├── favicon.svg                                       # Vector brand favicon with gradient filters
│   │   ├── icons.svg                                         # Reusable SVG sprite icons (Discord, GitHub, X, etc.)
│   │   └── jupyter/                                          # Downloaded & bundled Jupyter Notebook 7 & JupyterLab static distribution
│   │       ├── notebooks/index.html                          # Bundled Jupyter Notebook application
│   │       ├── lab/index.html                                # Bundled JupyterLab application
│   │       └── build/                                        # Pre-built WebAssembly kernels and application bundles
│   ├── src/
│   │   ├── components/
│   │   │   ├── AgenticAssistant/
│   │   │   │   ├── AgenticAssistant.css                      # Left-panel solid dark styling, pulsar animation
│   │   │   │   └── AgenticAssistant.jsx                      # Context-aware agent, quick action chips, snippet inserter
│   │   │   ├── DocumentWorkspace/
│   │   │   │   ├── DocumentWorkspace.css                     # Split-view, notebook flow, and drop overlay styling
│   │   │   │   └── DocumentWorkspace.jsx                     # Unified engine for Markdown & Notebook editing/running
│   │   │   └── Navbar/
│   │   │       ├── Navbar.css                                # Top navigation styling, solid black background
│   │   │       └── Navbar.jsx                                # Brand logo, NavLinks to Converter, Notes, Lab
│   │   ├── layouts/
│   │   │   └── AppLayout/
│   │   │       ├── AppLayout.css                             # Application root layout styling (#000000)
│   │   │       └── AppLayout.jsx                             # Common container combining Nav and Outlet
│   │   ├── pages/
│   │   │   ├── Converter/
│   │   │   │   ├── Converter.css                             # Drag-drop target, mode switcher, responsive rules
│   │   │   │   └── Converter.jsx                             # Two-way conversion UI, file validation, download handler
│   │   │   ├── Home/
│   │   │   │   ├── Home.css                                  # Pure black landing page styles
│   │   │   │   └── Home.jsx                                  # Clean landing page
│   │   │   ├── Lab/
│   │   │   │   ├── Lab.css                                   # Full-viewport workspace styling (#000000)
│   │   │   │   └── Lab.jsx                                   # Lab page hosting DocumentWorkspace in notebook mode
│   │   │   └── Notes/
│   │   │       ├── Notes.css                                 # Full-viewport workspace styling (#000000)
│   │   │       └── Notes.jsx                                 # Notes page hosting DocumentWorkspace in markdown mode
│   │   ├── services/
│   │   │   └── pythonSdk.js                                  # Pyodide WebAssembly Python SDK & backend execution service
│   │   ├── App.css                                           # Root dimension configuration
│   │   ├── App.jsx                                           # React Router v8 route definitions
│   │   ├── index.css                                         # Global resets, typography, pure black background
│   │   └── main.jsx                                          # React 19 entry point with BrowserRouter & StrictMode
│   ├── .gitignore                                            # Node/Vite ignores (node_modules, dist, logs)
│   ├── .oxlintrc.json                                        # Oxlint linter ruleset (React hooks, component exports)
│   ├── index.html                                            # HTML5 template (black theme color, viewport config)
│   ├── package.json                                          # Frontend scripts and npm package definitions
│   ├── package-lock.json                                     # Deterministic dependency lockfile
│   └── vite.config.js                                        # Vite configuration (server watcher ignore rules)
├── CLAUDE.md                                                 # Project reference and AI agent guide (this file)
└── requirements.txt                                          # Root Python dependencies for cloud deployment
```

---

## 4. Workspaces & Core Features Deep Dive

### 4.1 Unified Document Workspace (`DocumentWorkspace.jsx`)

Shared across both **Notes** and **Lab**, this component provides:
* **Dual Document Support:** Seamlessly switches between Markdown documents (`.md`) and Jupyter Notebooks (`.ipynb`).
* **Universal Upload & Drag-and-Drop:** Dragging a `.md` or `.ipynb` file anywhere over the screen displays a glowing cosmic target overlay that parses and loads the file automatically.
* **Toolbar Controls:**
  * Active file type badge (`.md` or `.ipynb`) and filename display.
  * Split Markdown View vs. Jupyter Notebook toggle buttons.
  * Upload file button opening the native file selector.
  * "Run All" button (for Jupyter Notebooks).
  * "Export" button allowing one-click download of the active edited file.

---

### 4.2 Unified Partitioned Markdown Panel & Synchronized Scrolling (`.md` Mode)

When viewing or editing a `.md` document:
* **Single Continuous Solid Panel:** Rather than two detached floating cards, the editor and live preview reside within **one unified partitioned panel** with solid dark obsidian styling (`#09090d`, border `#161622`), eliminating transparency and visual clutter.
* **Exact Symmetrical 50/50 Partition:** A single continuous, millimeter-precise vertical divider (`.unified-panel-center-line`) with an ambient amber gradient runs uninterrupted from the top header border down through the body and footer. The header, body, and footer containers use CSS Grid (`grid-template-columns: minmax(0, 1fr) minmax(0, 1fr)`), mathematically guaranteeing that both panes remain locked to the exact 50% dead-center without any horizontal offsets or jagged steps.
* **Minimalist Distraction-Free Header:** Removed cluttering formatting button bars to maintain BlackHole's clean, minimalist aesthetic.
* **Bidirectional Synchronized Scrolling:**
  * Scrolling on the source editor automatically scrolls the live preview to the exact proportional position.
  * Scrolling on the live preview synchronizes the source editor in real time.
  * Ensures the code and preview remain locked to the same document section at all times.
* **Left Partition (Source Editor):**
  * Monospace textarea with live character and line telemetry and custom translucent scrollbars.
* **Right Partition (Live Preview):**
  * Rendered via `marked` with GitHub Flavored Markdown (GFM) support.
  * Formatted headings, blockquotes with gold borders, styled tables, code blocks, task lists, and horizontal dividers.
  * Clean typography with `overflow-x: hidden` preventing unwanted horizontal container scrollbars.

---

### 4.3 Jupyter Notebook Software Sandbox (`.ipynb` Mode)

When viewing or editing a `.ipynb` notebook:
* **Fully Loaded Jupyter Notebook Software Sandbox:** Embeds the complete, official Jupyter Notebook application (Notebook 7 / RetroLab) directly inside a secure browser sandbox (`<iframe sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads">`).
  * Features the complete Jupyter application interface: Menus (File, Edit, View, Insert, Cell, Kernel), toolbar, in-browser WebAssembly Python kernel, and local storage virtual filesystem.
  * Runs completely client-side in a secure sandbox with zero server overhead.
* **Environment Mode Switcher:**
  * **Jupyter Notebook:** Complete standalone Jupyter Notebook 7 software suite in dark mode.
  * **JupyterLab:** Complete JupyterLab studio interface in dark mode.
  * **Native Cells:** Built-in lightweight cell runner with one-click code execution, execution counters, line numbers, and output consoles.
* **Sandbox Controls:**
  * `⟳ Refresh`: Instant reload of the sandbox environment.
  * `⤢ Popout`: Fullscreen external tab launcher for wide-screen computational sessions.
* **Pure Black & Cosmic Yellow Styling:** Solid black background (`#000000`), solid dark headers (`#0d0d14`), yellow indicators (`#ffd84d`), and zero blue tones throughout.

---

### 4.4 In-Browser Python SDK (`src/services/pythonSdk.js`)

* **Engine:** Powered by [Pyodide](https://pyodide.org/) (official CPython 3.12 WebAssembly port).
* **Zero-Setup Execution:** Downloads WebAssembly binaries from CDN on demand; requires no local Python installation on client machines.
* **Variable Persistence:** Maintains a persistent Python global execution namespace across cell runs (e.g., variables defined in Cell 1 are available in Cell 2).
* **Output Capture:** Intercepts `sys.stdout`, `sys.stderr`, and evaluation return values.
* **Backend Fallback:** If WebAssembly execution is blocked by browser restrictions, automatically falls back to the FastAPI `/execute` endpoint.

---

### 4.5 Agentic Assistant (Left Panel: `AgenticAssistant.jsx`)

Positioned on the left side of the workspace, the Agentic Assistant provides intelligent co-pilot capabilities:
* **Context Awareness:** Automatically reads the active document title, type (`.md` or `.ipynb`), and content.
* **Quick Action Chips:**
  * **Run All:** Triggers batch execution of all notebook cells.
  * **Add Cell / Append Note:** Inserts tailored equations or computational code.
  * **Explain:** Explains the active equations (Schwarzschild radius, accretion dynamics, etc.).
  * **Summary:** Generates a concise summary of the active document.
  * **Debug:** Analyzes code for syntax or mathematical edge cases (e.g., coordinate singularities).
* **Interactive Chat:** Allows freeform prompts with formatted responses.
* **Direct Document Insertion:** Code blocks in assistant responses include an **"Insert into Document"** button that appends directly into the active editor or notebook.
* **Collapsible:** Users can collapse the left panel into a mini bar for a full-screen editing experience.

---

### 4.6 Cosmic Transparency Preservation

BlackHole’s design language is strictly preserved:
* Root layout uses `background: transparent;`.
* The background video `blackhole-background.mp4` loops continuously beneath all workspaces.
* All panes, cards, and toolbars utilize translucent rgba layers:
  * Assistant panel: `rgba(10, 10, 14, 0.48)` with `backdrop-filter: blur(24px)`.
  * Split-view panes: `rgba(10, 10, 15, 0.45)` with `backdrop-filter: blur(20px)`.
  * Notebook cells: `rgba(12, 12, 18, 0.45)` with `backdrop-filter: blur(20px)`.
  * Cell outputs: `rgba(4, 4, 6, 0.65)` with amber accent highlights.
* No opaque solid backgrounds are used anywhere in the workspace.

---

## 5. Backend Deep Dive (`backend/`)

### 5.1 Endpoints Specification

#### `GET /` — Health Check
Verifies that the backend process is running. Returns `{"message": "BlackHole backend is running"}`.

#### `POST /convert` — Document Conversion
Accepts `.ipynb` or `.md` files via `multipart/form-data`, uses `jupytext` to convert between formats, and returns the converted file directly as a `FileResponse`.

#### `POST /execute` — Python Execution Service
Accepts JSON payload `{"code": "..."}`, executes code within a persistent global dictionary using Python's `exec`, captures stdout/stderr via `io.StringIO`, and returns execution results and tracebacks.

---

## 6. Developer & Environment Setup

### 6.1 Prerequisites
* **Node.js:** v18.0.0+ (v20+ recommended)
* **npm:** v9.0.0+
* **Python:** 3.10 to 3.14

### 6.2 Running Locally

```bash
# 1. Start Python Backend (Terminal 1)
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000

# 2. Start Frontend (Terminal 2)
cd frontend
npm install
npm run dev
```

* Frontend: `http://localhost:5173`
* Backend API & Swagger Docs: `http://127.0.0.1:8000/docs`

#### Quality Commands:
* `npm run build` — Builds production bundle with Vite.
* `npm run lint` — Runs high-speed `oxlint` static code analysis.

---

## 7. Deployment & CI/CD Pipelines

* **Frontend:** Deployed automatically to Azure Static Web Apps via `.github/workflows/azure-static-web-apps-zealous-ocean-086cff900.yml`.
* **Backend:** Deployed to Azure App Service via `.github/workflows/main_blackhole.yml`.
* **Live Render Instances:**
  * Frontend: `https://blackhole-1.onrender.com`
  * Backend: `https://blackhole-foku.onrender.com`
