import { useEffect, useRef, useState } from "react";
import { Subagent } from "../ui/Trace";
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
  AttachmentGroup,
} from "../ui/Attachment";
import "./AgenticAssistant.css";

// Realistic astrophysical research sample attachments for quick testing
const SAMPLE_ATTACHMENTS = [
  {
    id: "sample-img-1",
    name: "accretion_disc_spectral.png",
    variant: "image",
    sizeStr: "1.8 MB",
    description: "PNG · 1024x1024 · 1.8 MB",
    type: "image/png",
    state: "done",
    previewUrl:
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240' viewBox='0 0 240 240'><rect width='240' height='240' fill='%23050508'/><circle cx='120' cy='120' r='75' fill='none' stroke='%23ffd84d' stroke-width='5'/><circle cx='120' cy='120' r='90' fill='none' stroke='%23ff9900' stroke-width='2' stroke-dasharray='6,6'/><circle cx='120' cy='120' r='38' fill='%23000000'/><text x='120' y='220' fill='%23ffd84d' font-size='10' font-family='monospace' text-anchor='middle'>ACCRETION SPECTRAL MAP</text></svg>",
    contentSnippet:
      "Spectral emission map: Peak radiation temperature T_eff = 1.2e7 K at innermost stable circular orbit (ISCO = 3 Rs).",
  },
  {
    id: "sample-csv-1",
    name: "schwarzschild_geodesics.csv",
    variant: "icon",
    sizeStr: "34 KB",
    description: "CSV · 500 rows · 34 KB",
    type: "text/csv",
    state: "done",
    contentSnippet:
      "step,r_norm,phi_rad,time_dilation,dr_dtau\n0,10.000,0.000,1.054,-0.012\n1,9.814,0.082,1.057,-0.015\n2,9.521,0.174,1.062,-0.019\n3,9.182,0.276,1.068,-0.024\n4,8.790,0.391,1.076,-0.030",
  },
  {
    id: "sample-pdf-1",
    name: "relativistic_spec.pdf",
    variant: "icon",
    sizeStr: "2.4 MB",
    description: "PDF · 12 pages · 2.4 MB",
    type: "application/pdf",
    state: "done",
    contentSnippet:
      "BlackHole Observational Telemetry Specification v2.4\nAuthors: Event Horizon Physics Group\nAbstract: Kerr and Schwarzschild spacetime geodesics under frame dragging constraints.",
  },
];

export default function AgenticAssistant({
  activeFileType,
  activeFileName,
  documentContent,
  onInsertSnippet,
  onRunAllCells,
  pythonSdkStatus,
  isOpen,
  onToggle,
}) {
  const [inputMessage, setInputMessage] = useState("");
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [selectedAttachment, setSelectedAttachment] = useState(null);

  const [messages, setMessages] = useState([
    {
      id: "init-subagent",
      role: "assistant",
      subagent: {
        name: "Workspace Initializer Agent",
        task: `Index active workspace document "${activeFileName}", verify kernel runtime, and prepare context buffers.`,
        model: "gemini-1.5-flash",
        duration: "138ms",
        status: "completed",
        tools: [
          {
            name: `inspect_workspace(target="${activeFileName}")`,
            status: "completed",
            output: `file="${activeFileName}", mode="${activeFileType}"`,
          },
          {
            name: "verify_runtime(kernel='python-3.11-wasm')",
            status: "completed",
            output: "status=READY, memory=64MB",
          },
          {
            name: "load_astrophysics_constants()",
            status: "completed",
            output: "G=6.6743e-11, c=2.998e8, M_sun=1.989e30",
          },
        ],
        result:
          "Workspace indexed. The subagent is ready to execute research queries, diagnostic runs, and code generation.",
        attachments: [
          {
            id: "att-init-1",
            name: "workspace_tensor_cache.json",
            variant: "icon",
            sizeStr: "12 KB",
            description: "JSON · 12 KB · Ready",
            type: "application/json",
            state: "done",
            contentSnippet:
              '{\n  "metric": "Schwarzschild",\n  "coordinates": ["t", "r", "theta", "phi"],\n  "singularity": "r = 2GM/c^2"\n}',
          },
        ],
        code:
          activeFileType === "ipynb"
            ? `# Example: Calculate relativistic lorentz factor\nimport math\n\ndef lorentz_factor(v_over_c):\n    return 1.0 / math.sqrt(1 - (v_over_c ** 2))\n\nprint("Gamma at 0.9c:", lorentz_factor(0.9))`
            : `### Planetary Orbit Metrics\n- **Semi-major axis ($a$):** $1.496 \\times 10^{11}\\text{ m}$\n- **Orbital eccentricity ($e$):** $0.0167$\n- **Orbital period ($T$):** $365.256\\text{ days}$`,
      },
    },
  ]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, attachedFiles]);

  /**
   * Handle user attaching files via file picker
   */
  const handleFileInputChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.forEach((file) => {
      const isImg = file.type.startsWith("image/");
      const fileId = "file-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4);
      const previewUrl = isImg ? URL.createObjectURL(file) : null;
      const sizeKb = (file.size / 1024).toFixed(1);

      const newAttachment = {
        id: fileId,
        name: file.name,
        variant: isImg ? "image" : "icon",
        sizeStr: `${sizeKb} KB`,
        description: isImg ? `IMG · ${sizeKb} KB` : `${file.name.split(".").pop().toUpperCase()} · ${sizeKb} KB`,
        type: file.type || "application/octet-stream",
        state: "uploading",
        previewUrl,
        contentSnippet: `Uploaded file: ${file.name} (${file.size} bytes)`,
      };

      setAttachedFiles((prev) => [...prev, newAttachment]);

      // State progression: uploading -> processing -> done
      setTimeout(() => {
        setAttachedFiles((prev) =>
          prev.map((item) =>
            item.id === fileId ? { ...item, state: "processing" } : item
          )
        );
      }, 500);

      setTimeout(() => {
        setAttachedFiles((prev) =>
          prev.map((item) =>
            item.id === fileId ? { ...item, state: "done" } : item
          )
        );
      }, 950);
    });

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /**
   * Quick attach sample research file
   */
  const handleAttachSample = () => {
    const nextSample = SAMPLE_ATTACHMENTS[attachedFiles.length % SAMPLE_ATTACHMENTS.length];
    const newId = "sample-" + Date.now();

    const sampleCopy = {
      ...nextSample,
      id: newId,
      state: "uploading",
    };

    setAttachedFiles((prev) => [...prev, sampleCopy]);

    setTimeout(() => {
      setAttachedFiles((prev) =>
        prev.map((item) =>
          item.id === newId ? { ...item, state: "processing" } : item
        )
      );
    }, 400);

    setTimeout(() => {
      setAttachedFiles((prev) =>
        prev.map((item) =>
          item.id === newId ? { ...item, state: "done" } : item
        )
      );
    }, 800);
  };

  const handleRemoveAttachment = (idToRemove) => {
    setAttachedFiles((prev) => prev.filter((item) => item.id !== idToRemove));
  };

  const handleClearAllAttachments = () => {
    setAttachedFiles([]);
  };

  const handleSendMessage = (textToSend) => {
    const text = (textToSend || inputMessage).trim();
    if (!text && attachedFiles.length === 0) return;

    const userMsgId = Date.now().toString();
    const subagentMsgId = (Date.now() + 1).toString();

    const currentAttachments = [...attachedFiles];
    setAttachedFiles([]); // Clear composer attachments

    const plan = planSubagentForQuery(
      text || `Analyze attached ${currentAttachments.map((a) => a.name).join(", ")}`,
      activeFileType,
      activeFileName,
      currentAttachments
    );

    // Append user message with attachments + preliminary running subagent message
    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        role: "user",
        text: text || `[Uploaded ${currentAttachments.length} attachment(s)]`,
        attachments: currentAttachments,
      },
      {
        id: subagentMsgId,
        role: "assistant",
        subagent: {
          name: plan.name,
          task: plan.task,
          model: plan.model,
          status: "running",
          duration: "running…",
          tools: plan.tools.map((t) => ({ ...t, status: "running" })),
          result: "",
          code: "",
          attachments: [],
        },
      },
    ]);
    setInputMessage("");

    // Simulate asynchronous subagent execution lifecycle
    setTimeout(() => {
      const completedPlan = finalizeSubagentPlan(
        plan,
        text,
        activeFileType,
        activeFileName,
        documentContent,
        currentAttachments
      );

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === subagentMsgId
            ? { ...msg, subagent: completedPlan }
            : msg
        )
      );
    }, 520);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleActionChip = (chipAction) => {
    if (chipAction === "run_all") {
      if (onRunAllCells) onRunAllCells();
      const runId = Date.now().toString();
      setMessages((prev) => [
        ...prev,
        {
          id: runId,
          role: "assistant",
          subagent: {
            name: "Notebook Execution Agent",
            task: "Execute all executable code cells in sequential order and pipe output streams.",
            model: "blackhole-runtime-v2",
            status: "running",
            duration: "executing…",
            tools: [
              { name: "scan_cell_dependency_graph()", status: "running" },
              { name: "execute_all_notebook_cells()", status: "running" },
            ],
            result: "",
            attachments: [],
          },
        },
      ]);

      setTimeout(() => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === runId
              ? {
                  ...msg,
                  subagent: {
                    name: "Notebook Execution Agent",
                    task: "Execute all executable code cells in sequential order and pipe output streams.",
                    model: "blackhole-runtime-v2",
                    status: "completed",
                    duration: "184ms",
                    tools: [
                      {
                        name: "scan_cell_dependency_graph()",
                        status: "completed",
                        output: "graph_verified: 0 cycles detected",
                      },
                      {
                        name: "execute_all_notebook_cells()",
                        status: "completed",
                        output: "all cells executed without runtime errors",
                      },
                    ],
                    result:
                      "Successfully triggered execution for all Python code cells in the active notebook. Outputs updated in document workspace.",
                    attachments: [
                      {
                        id: "att-exec-out",
                        name: "execution_telemetry.log",
                        variant: "icon",
                        sizeStr: "4.2 KB",
                        description: "LOG · Execution trace · 4.2 KB",
                        state: "done",
                        contentSnippet:
                          "[INFO] Kernel initialized in 42ms\n[INFO] Cell 0: lorentz_factor(0.9) -> Gamma=2.294\n[SUCCESS] Notebook execution complete.",
                      },
                    ],
                  },
                }
              : msg
          )
        );
      }, 420);
      return;
    }

    if (chipAction === "add_python") {
      const snippet = `# Gravitational Potential Energy Calculation
def gravitational_potential(mass_1, mass_2, distance):
    G = 6.67430e-11 # m^3 kg^-1 s^-2
    return - (G * mass_1 * mass_2) / distance

u = gravitational_potential(1.989e30, 5.972e24, 1.496e11)
print(f"Gravitational Potential: {u:.3e} Joules")`;

      if (onInsertSnippet) onInsertSnippet(snippet, "code");

      const addId = Date.now().toString();
      setMessages((prev) => [
        ...prev,
        {
          id: addId,
          role: "assistant",
          subagent: {
            name: "Cell Generator Agent",
            task: "Generate gravitational potential snippet and append directly into active notebook.",
            model: "gemini-1.5-flash",
            status: "completed",
            duration: "94ms",
            tools: [
              {
                name: "fetch_snippet_template(id='gravitational_potential')",
                status: "completed",
                output: "template_resolved: 7 lines",
              },
              {
                name: "inject_document_cell(type='code')",
                status: "completed",
                output: "cell_id=auto, inserted=true",
              },
            ],
            result: "Inserted a new gravitational potential calculation cell into the notebook.",
            code: snippet,
            attachments: [],
          },
        },
      ]);
      return;
    }

    if (chipAction === "attach_sample") {
      handleAttachSample();
      return;
    }

    if (chipAction === "explain") {
      handleSendMessage("Explain the active document and its core mathematical formulas.");
      return;
    }

    if (chipAction === "summarize") {
      handleSendMessage("Summarize the key takeaways and current state of this workspace.");
      return;
    }

    if (chipAction === "debug") {
      handleSendMessage("Check my Python code for syntax, performance, or division-by-zero risks.");
      return;
    }
  };

  return (
    <aside
      className={`agentic-assistant-panel ${isOpen ? "assistant-open" : "assistant-collapsed"}`}
      aria-label="Agentic Workspace Assistant"
    >
      {/* Panel Header */}
      <div className="assistant-panel-header">
        <div className="assistant-brand">
          <div className="assistant-pulsar">
            <span className="pulsar-core" />
            <span className="pulsar-ring" />
          </div>
          <div>
            <h3>Agentic Assistant</h3>
            <span className="assistant-status">
              {pythonSdkStatus === "ready"
                ? "Python SDK Ready"
                : pythonSdkStatus === "loading"
                ? "Python SDK Loading..."
                : "Workspace Connected"}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="assistant-toggle-btn"
          onClick={onToggle}
          title={isOpen ? "Collapse Assistant" : "Expand Assistant"}
          aria-label={isOpen ? "Collapse Assistant" : "Expand Assistant"}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            {isOpen ? (
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            ) : (
              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            )}
          </svg>
        </button>
      </div>

      {isOpen && (
        <>
          {/* Active Document Context Pill */}
          <div className="assistant-context-bar">
            <span className="context-kicker">ACTIVE:</span>
            <span className="context-filename" title={activeFileName}>
              {activeFileName}
            </span>
          </div>

          {/* Quick Action Chips */}
          <div className="assistant-quick-actions">
            {activeFileType === "ipynb" ? (
              <>
                <button
                  type="button"
                  className="action-chip action-chip-accent"
                  onClick={() => handleActionChip("run_all")}
                  title="Run all code cells in the notebook"
                >
                  Run All
                </button>
                <button
                  type="button"
                  className="action-chip"
                  onClick={() => handleActionChip("add_python")}
                  title="Insert a Python calculation cell"
                >
                  + Add Cell
                </button>
              </>
            ) : (
              <button
                type="button"
                className="action-chip action-chip-accent"
                onClick={() => {
                  const sampleMd = `\n### Empirical Notes\n- Verified accretion disc luminosity model.\n- Peak radiation corresponds to innermost stable circular orbit (ISCO).`;
                  if (onInsertSnippet) onInsertSnippet(sampleMd, "markdown");
                }}
                title="Append research note section"
              >
                + Append Note
              </button>
            )}

            <button
              type="button"
              className="action-chip"
              onClick={() => handleActionChip("attach_sample")}
              title="Attach sample simulation file/image"
            >
              + Attach File
            </button>

            <button
              type="button"
              className="action-chip"
              onClick={() => handleActionChip("explain")}
            >
              Explain
            </button>
            <button
              type="button"
              className="action-chip"
              onClick={() => handleActionChip("summarize")}
            >
              Summary
            </button>
            <button
              type="button"
              className="action-chip"
              onClick={() => handleActionChip("debug")}
            >
              Debug
            </button>
          </div>

          {/* Message Stream */}
          <div className="assistant-messages-stream">
            {messages.map((msg) => {
              if (msg.subagent) {
                return (
                  <div key={msg.id} className="assistant-subagent-wrapper">
                    <Subagent
                      name={msg.subagent.name}
                      task={msg.subagent.task}
                      model={msg.subagent.model}
                      tools={msg.subagent.tools}
                      status={msg.subagent.status}
                      duration={msg.subagent.duration}
                      result={msg.subagent.result}
                      code={msg.subagent.code}
                      attachments={msg.subagent.attachments}
                      onPreviewAttachment={setSelectedAttachment}
                      onInsertCode={onInsertSnippet}
                      activeFileType={activeFileType}
                      defaultOpen={true}
                    />
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`assistant-msg-bubble ${
                    msg.role === "user" ? "user-bubble" : "ai-bubble"
                  }`}
                >
                  <div className="bubble-text">{msg.text}</div>

                  {/* Render attachments sent with this message */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <AttachmentGroup className="message-attachments-group">
                      {msg.attachments.map((att) => (
                        <Attachment
                          key={att.id}
                          size="xs"
                          state={att.state || "done"}
                          orientation="horizontal"
                        >
                          <AttachmentMedia variant={att.variant || "icon"}>
                            {att.variant === "image" && att.previewUrl ? (
                              <img src={att.previewUrl} alt={att.name} />
                            ) : (
                              getFileIcon(att.name, att.type)
                            )}
                          </AttachmentMedia>
                          <AttachmentContent>
                            <AttachmentTitle>{att.name}</AttachmentTitle>
                            <AttachmentDescription>
                              {att.description || att.sizeStr}
                            </AttachmentDescription>
                          </AttachmentContent>
                          <AttachmentTrigger
                            aria-label={`Preview ${att.name}`}
                            onClick={() => setSelectedAttachment(att)}
                          />
                        </Attachment>
                      ))}
                    </AttachmentGroup>
                  )}

                  {msg.code && (
                    <div className="bubble-code-container">
                      <pre className="bubble-code">
                        <code>{msg.code}</code>
                      </pre>
                      <button
                        type="button"
                        className="insert-code-btn"
                        onClick={() =>
                          onInsertSnippet &&
                          onInsertSnippet(
                            msg.code,
                            activeFileType === "ipynb" ? "code" : "markdown"
                          )
                        }
                        title="Insert this snippet directly into your active document"
                      >
                        + Insert into Document
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer with Attachment Bar and Composer */}
          <div className="assistant-footer">
            {/* Attached Files List in Composer (if any) */}
            {attachedFiles.length > 0 && (
              <div className="composer-attachments-bar">
                <div className="composer-attachments-header">
                  <span className="composer-attachments-kicker">
                    ATTACHMENTS ({attachedFiles.length}):
                  </span>
                  <button
                    type="button"
                    className="composer-clear-attachments-btn"
                    onClick={handleClearAllAttachments}
                  >
                    Clear all
                  </button>
                </div>
                <AttachmentGroup>
                  {attachedFiles.map((file) => (
                    <Attachment
                      key={file.id}
                      size="sm"
                      state={file.state}
                      orientation="horizontal"
                    >
                      <AttachmentMedia variant={file.variant}>
                        {file.variant === "image" && file.previewUrl ? (
                          <img src={file.previewUrl} alt={file.name} />
                        ) : (
                          getFileIcon(file.name, file.type)
                        )}
                      </AttachmentMedia>
                      <AttachmentContent>
                        <AttachmentTitle>{file.name}</AttachmentTitle>
                        <AttachmentDescription>
                          {file.state === "uploading"
                            ? "Uploading… 65%"
                            : file.state === "processing"
                            ? "Processing AST…"
                            : file.state === "error"
                            ? "Upload error"
                            : file.description || file.sizeStr}
                        </AttachmentDescription>
                      </AttachmentContent>
                      <AttachmentActions>
                        <AttachmentAction
                          size="icon-xs"
                          aria-label={`Remove ${file.name}`}
                          onClick={() => handleRemoveAttachment(file.id)}
                        >
                          <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </AttachmentAction>
                      </AttachmentActions>
                      <AttachmentTrigger
                        aria-label={`Preview ${file.name}`}
                        onClick={() => setSelectedAttachment(file)}
                      />
                    </Attachment>
                  ))}
                </AttachmentGroup>
              </div>
            )}

            {/* Hidden native file input */}
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              multiple
              onChange={handleFileInputChange}
            />

            <form
              className="assistant-input-box"
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
            >
              {/* Paperclip Attach Button */}
              <button
                type="button"
                className="assistant-attach-btn"
                title="Attach files or images"
                aria-label="Attach files or images"
                onClick={() => fileInputRef.current?.click()}
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
              </button>

              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask subagent to research, inspect attachment, or write code..."
                rows="1"
              />

              <button
                type="submit"
                className="assistant-send-btn"
                disabled={!inputMessage.trim() && attachedFiles.length === 0}
                title="Send instruction to subagent"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </form>
            <span className="assistant-keyboard-hint">
              Enter to send · Shift+Enter for new line · Click 📎 to attach
            </span>
          </div>

          {/* Attachment Preview Modal (when an attachment trigger is clicked) */}
          {selectedAttachment && (
            <div
              className="attachment-preview-backdrop"
              onClick={() => setSelectedAttachment(null)}
            >
              <div
                className="attachment-preview-modal"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="preview-modal-header">
                  <h4>{selectedAttachment.name}</h4>
                  <button
                    type="button"
                    className="preview-modal-close-btn"
                    onClick={() => setSelectedAttachment(null)}
                    aria-label="Close preview"
                  >
                    ✕
                  </button>
                </div>

                <div className="preview-modal-body">
                  {selectedAttachment.variant === "image" && selectedAttachment.previewUrl ? (
                    <div className="preview-media-large">
                      <img
                        src={selectedAttachment.previewUrl}
                        alt={selectedAttachment.name}
                      />
                    </div>
                  ) : null}

                  <div className="preview-metadata-list">
                    <div className="preview-meta-item">
                      <span className="preview-meta-label">File Type</span>
                      <span className="preview-meta-value">
                        {selectedAttachment.type || selectedAttachment.name.split(".").pop()}
                      </span>
                    </div>
                    <div className="preview-meta-item">
                      <span className="preview-meta-label">Size</span>
                      <span className="preview-meta-value">{selectedAttachment.sizeStr || "Unknown"}</span>
                    </div>
                    <div className="preview-meta-item">
                      <span className="preview-meta-label">State</span>
                      <span className="preview-meta-value">{selectedAttachment.state || "done"}</span>
                    </div>
                    <div className="preview-meta-item">
                      <span className="preview-meta-label">Scope</span>
                      <span className="preview-meta-value">Active Assistant Context</span>
                    </div>
                  </div>

                  {selectedAttachment.contentSnippet && (
                    <div className="preview-excerpt-box">
                      <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                        {selectedAttachment.contentSnippet}
                      </pre>
                    </div>
                  )}
                </div>

                <div className="preview-modal-footer">
                  {onInsertSnippet && selectedAttachment.contentSnippet && (
                    <button
                      type="button"
                      className="preview-modal-action-btn"
                      onClick={() => {
                        onInsertSnippet(
                          selectedAttachment.contentSnippet,
                          activeFileType === "ipynb" ? "code" : "markdown"
                        );
                        setSelectedAttachment(null);
                      }}
                    >
                      Insert into Document
                    </button>
                  )}
                  <button
                    type="button"
                    className="preview-modal-action-btn"
                    onClick={() => setSelectedAttachment(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </aside>
  );
}

/**
 * Returns crisp SVG icon matching file format
 */
function getFileIcon(fileName = "", fileType = "") {
  const ext = fileName.split(".").pop().toLowerCase();

  if (fileType.includes("pdf") || ext === "pdf") {
    return (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="9" y1="15" x2="15" y2="15" />
      </svg>
    );
  }

  if (ext === "csv" || ext === "xlsx" || ext === "json" || ext === "dat") {
    return (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor">
        <path d="M3 3h18v18H3z" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="3" y1="15" x2="21" y2="15" />
        <line x1="9" y1="3" x2="9" y2="21" />
        <line x1="15" y1="3" x2="15" y2="21" />
      </svg>
    );
  }

  if (ext === "py" || ext === "ipynb") {
    return (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    );
  }

  if (ext === "png" || ext === "jpg" || ext === "jpeg" || ext === "webp" || ext === "svg") {
    return (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

/**
 * Creates subagent plan configuration based on query intent and attached assets
 */
function planSubagentForQuery(query, fileType, fileName, attachments = []) {
  const q = query.toLowerCase();
  const hasAttachments = attachments && attachments.length > 0;

  if (hasAttachments) {
    const firstAtt = attachments[0];
    return {
      name: "Multimodal Research Subagent",
      task: `Inspect attached asset "${firstAtt.name}" (${firstAtt.sizeStr}) alongside active context "${fileName}".`,
      model: "gemini-1.5-flash",
      tools: [
        { name: `read_attachment_stream(file="${firstAtt.name}")`, status: "running" },
        { name: "extract_multimodal_features()", status: "running" },
        { name: `cross_reference_workspace(file="${fileName}")`, status: "running" },
      ],
    };
  }

  if (q.includes("debug") || q.includes("error") || q.includes("risk")) {
    return {
      name: "Code Diagnostics Agent",
      task: `Inspect Python AST in "${fileName}" for syntax errors, boundary singularities, and performance bottlenecks.`,
      model: "gemini-1.5-flash",
      tools: [
        { name: `scan_syntax_tree(file="${fileName}")`, status: "running" },
        { name: "check_singularity_guards(terms=['r_s', 'v_over_c'])", status: "running" },
        { name: "verify_numeric_stability()", status: "running" },
      ],
    };
  }

  if (q.includes("explain") || q.includes("equation") || q.includes("formula")) {
    return {
      name: "Relativistic Physics Agent",
      task: `Derive mathematical formulas and relativistic metric properties for "${fileName}".`,
      model: "gemini-1.5-flash",
      tools: [
        { name: "query_astrophysics_knowledge_base(topic='Schwarzschild')", status: "running" },
        { name: "derive_metric_tensor(coords=['t', 'r', 'theta', 'phi'])", status: "running" },
      ],
    };
  }

  if (q.includes("summarize") || q.includes("summary")) {
    return {
      name: "Workspace Summary Agent",
      task: `Compile executive synthesis of document structure, computational cells, and astrophysical data in "${fileName}".`,
      model: "gemini-1.5-flash",
      tools: [
        { name: `parse_document_outline(target="${fileName}")`, status: "running" },
        { name: "aggregate_workspace_metrics()", status: "running" },
      ],
    };
  }

  if (q.includes("plot") || q.includes("chart") || q.includes("graph")) {
    return {
      name: "Astrophysics Visualizer Agent",
      task: `Generate numerical curvature density distribution and plotting routines for "${fileName}".`,
      model: "gemini-1.5-flash",
      tools: [
        { name: "compute_curvature_density_grid()", status: "running" },
        { name: "generate_ascii_projection()", status: "running" },
      ],
    };
  }

  return {
    name: "Research Subagent",
    task: `Process prompt: "${query.slice(0, 60)}..." against active context "${fileName}".`,
    model: "gemini-1.5-flash",
    tools: [
      { name: `read_context_slice(file="${fileName}")`, status: "running" },
      { name: `synthesize_response(query="${query.slice(0, 30)}")`, status: "running" },
    ],
  };
}

/**
 * Finalizes subagent execution with tool results, timing, code, and generated artifact attachments
 */
function finalizeSubagentPlan(plan, query, fileType, fileName, _content, userAttachments = []) {
  const q = query.toLowerCase();
  const randomMs = Math.floor(Math.random() * 160 + 130);

  if (userAttachments && userAttachments.length > 0) {
    const firstAtt = userAttachments[0];
    return {
      name: plan.name,
      task: plan.task,
      model: plan.model,
      status: "completed",
      duration: `${randomMs}ms`,
      tools: [
        {
          name: `read_attachment_stream(file="${firstAtt.name}")`,
          status: "completed",
          output: `parsed: ${firstAtt.type || "binary stream"}, length=${firstAtt.sizeStr}`,
        },
        {
          name: "extract_multimodal_features()",
          status: "completed",
          output: "feature_tensor=[128, 512], correlation_confidence=0.98",
        },
        {
          name: `cross_reference_workspace(file="${fileName}")`,
          status: "completed",
          output: "aligned with active spacetime equations",
        },
      ],
      result: `Processed attached asset "${firstAtt.name}". The subagent correlated its properties with "${fileName}" and synthesized a verified computational telemetry block:`,
      attachments: [
        {
          id: "derived-asset-1",
          name: "derived_geodesic_analysis.json",
          variant: "icon",
          sizeStr: "16 KB",
          description: "JSON · 16 KB · Analysis Output",
          type: "application/json",
          state: "done",
          contentSnippet: `{\n  "source_attachment": "${firstAtt.name}",\n  "geodesic_confidence": 0.992,\n  "isco_radius_km": 8.86,\n  "doppler_beaming_factor": 1.42\n}`,
        },
      ],
      code:
        fileType === "ipynb"
          ? `# Geodesic integration from attached data\nimport json\n\ndef evaluate_isco_telemetry(isco_km=8.86):\n    return f"Stable orbit confirmed outside horizon at {isco_km} km."\n\nprint(evaluate_isco_telemetry())`
          : `### Geodesic Correlation Findings\n- **Source Attachment:** \`${firstAtt.name}\`\n- **Confidence:** $99.2\\%$\n- **Derived ISCO Radius:** $8.86\\text{ km}$`,
    };
  }

  if (q.includes("debug") || q.includes("error") || q.includes("risk")) {
    return {
      name: plan.name,
      task: plan.task,
      model: plan.model,
      status: "completed",
      duration: `${randomMs}ms`,
      tools: [
        {
          name: `scan_syntax_tree(file="${fileName}")`,
          status: "completed",
          output: "syntax: clean, 0 parse errors",
        },
        {
          name: "check_singularity_guards(terms=['r_s', 'v_over_c'])",
          status: "completed",
          output: "warning: division by zero possible if r <= r_s",
        },
        {
          name: "verify_numeric_stability()",
          status: "completed",
          output: "recommendation: add guarded exception check",
        },
      ],
      result:
        "Code diagnostics complete: Syntax tree is valid. Discovered potential coordinate singularity at event horizon ($r \\le R_s$). Guard clause generated below.",
      attachments: [],
      code: `if r <= r_s:\n    raise ValueError("Coordinate singularity at event horizon (r <= Rs)")\nt_dilation = 1.0 / math.sqrt(1 - (r_s / r))`,
    };
  }

  if (q.includes("explain") || q.includes("equation") || q.includes("formula")) {
    return {
      name: plan.name,
      task: plan.task,
      model: plan.model,
      status: "completed",
      duration: `${randomMs}ms`,
      tools: [
        {
          name: "query_astrophysics_knowledge_base(topic='Schwarzschild')",
          status: "completed",
          output: "KB match: Schwarzschild radius formulation",
        },
        {
          name: "derive_metric_tensor(coords=['t', 'r', 'theta', 'phi'])",
          status: "completed",
          output: "metric: static spherically symmetric",
        },
      ],
      result: `In "${fileName}", we model relativistic gravitational physics. The Schwarzschild radius defines the spherical boundary where escape velocity reaches $c$:`,
      attachments: [],
      code:
        fileType === "ipynb"
          ? `# Schwarzschild radius calculation in kilometers\ndef r_schwarzschild(m_solar):\n    # G = 6.674e-11, c = 2.998e8, M_sun = 1.989e30\n    return (2 * 6.674e-11 * m_solar * 1.989e30) / (2.998e8 ** 2) / 1000\n\nprint("Solar mass event horizon:", r_schwarzschild(1.0), "km")`
          : `$$R_s = \\frac{2GM}{c^2}$$\n\nWhere:\n- $G = 6.67430 \\times 10^{-11}\\text{ m}^3\\text{kg}^{-1}\\text{s}^{-2}$\n- $M$ is the object mass\n- $c = 299,792,458\\text{ m/s}$`,
    };
  }

  if (q.includes("summarize") || q.includes("summary")) {
    return {
      name: plan.name,
      task: plan.task,
      model: plan.model,
      status: "completed",
      duration: `${randomMs}ms`,
      tools: [
        {
          name: `parse_document_outline(target="${fileName}")`,
          status: "completed",
          output: `sections: 3, cells: 4`,
        },
        {
          name: "aggregate_workspace_metrics()",
          status: "completed",
          output: "ready for live simulation",
        },
      ],
      result: `Summary for "${fileName}":\n• Format: ${
        fileType === "ipynb"
          ? "Jupyter Notebook (Executable Python)"
          : "Markdown Document (Split View)"
      }\n• Focus: Relativistic mechanics, event horizon curvature, and observational data metrics.\n• Status: Ready for continuous editing and computational simulation.`,
      attachments: [],
      code: "",
    };
  }

  if (q.includes("plot") || q.includes("chart") || q.includes("graph")) {
    return {
      name: plan.name,
      task: plan.task,
      model: plan.model,
      status: "completed",
      duration: `${randomMs}ms`,
      tools: [
        {
          name: "compute_curvature_density_grid()",
          status: "completed",
          output: "grid computed across 1.5 to 10.0 Rs multiples",
        },
        {
          name: "generate_ascii_projection()",
          status: "completed",
          output: "5 samples projected",
        },
      ],
      result: "Here is an ASCII and numerical projection of gravitational curvature across distance multiples:",
      attachments: [
        {
          id: "out-plot-1",
          name: "curvature_gradient_preview.png",
          variant: "image",
          sizeStr: "240 KB",
          description: "PNG · 240 KB · Generated plot",
          type: "image/png",
          state: "done",
          previewUrl:
            "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='160' viewBox='0 0 240 160'><rect width='240' height='160' fill='%23040408'/><path d='M10 140 Q 60 135 90 80 T 230 20' fill='none' stroke='%23ffd84d' stroke-width='3'/><circle cx='90' cy='80' r='4' fill='%23ff9900'/><text x='120' y='150' fill='%23888888' font-size='9' text-anchor='middle'>SPACETIME CURVATURE VS RADIUS</text></svg>",
          contentSnippet: "Curvature density: R_curv ~ 1 / r^3 across event horizon multiples.",
        },
      ],
      code: `# Tabular curvature density\nfor mult in [1.5, 2.0, 3.0, 5.0, 10.0]:\n    curvature = 1.0 / (mult ** 3)\n    bar = "█" * int(curvature * 30)\n    print(f"{mult:4.1f} Rs | {curvature:.4f} | {bar}")`,
    };
  }

  return {
    name: plan.name,
    task: plan.task,
    model: plan.model,
    status: "completed",
    duration: `${randomMs}ms`,
    tools: [
      {
        name: `read_context_slice(file="${fileName}")`,
        status: "completed",
        output: "context extracted: 1.2KB",
      },
      {
        name: `synthesize_response(query="${query.slice(0, 30)}")`,
        status: "completed",
        output: "synthesis complete",
      },
    ],
    result: `The research subagent has drafted a computational block tailored for "${fileName}":`,
    attachments: [],
    code:
      fileType === "ipynb"
        ? `# Generated by BlackHole Research Subagent\nimport math\n\ndef orbital_velocity(m_central, radius_meters):\n    G = 6.67430e-11\n    return math.sqrt((G * m_central) / radius_meters)\n\n# Earth around Sun\nv_earth = orbital_velocity(1.989e30, 1.496e11)\nprint(f"Earth orbital velocity: {v_earth / 1000:.2f} km/s")`
        : `### Observational Notes\n- Monitored spectral Doppler relativistic shift in accretion inflow.\n- Observed Doppler beaming factor: $\\delta = [\\gamma (1 - \\beta \\cos \\theta)]^{-1}$.`,
  };
}
