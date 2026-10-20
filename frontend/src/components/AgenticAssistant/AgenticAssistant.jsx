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
import { ChainOfThoughtBlock } from "../ui/ChainOfThought";
import { Checkpoint } from "../ui/Checkpoint";
import {
  CodeBlock,
  CodeBlockHeader,
  CodeBlockTitle,
  CodeBlockActions,
  CodeBlockCopyButton,
  CodeBlockContent,
  CodeBlockLine,
  CodeBlockCard,
} from "../ui/CodeBlock";
import "./AgenticAssistant.css";

export default function AgenticAssistant({
  activeFileType,
  activeFileName,
  documentContent,
  onInsertSnippet,
  pythonSdkStatus,
  isOpen,
  onToggle,
}) {
  const [inputMessage, setInputMessage] = useState("");
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const [restoreNotice, setRestoreNotice] = useState("");

  const [messages, setMessages] = useState([]);

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


  const handleRemoveAttachment = (idToRemove) => {
    setAttachedFiles((prev) => prev.filter((item) => item.id !== idToRemove));
  };

  const handleClearAllAttachments = () => {
    setAttachedFiles([]);
  };

  /**
   * Restore conversation thread to a previous checkpoint turn
   * Drops every turn after it
   */
  const handleRestoreCheckpoint = (messageId, label) => {
    const index = messages.findIndex((m) => m.id === messageId);
    if (index !== -1) {
      setMessages(messages.slice(0, index + 1));
      setRestoreNotice(`Restored conversation to "${label}"`);
      setTimeout(() => setRestoreNotice(""), 3500);
    }
  };

  const handleSendMessage = (textToSend) => {
    const text = (textToSend || inputMessage).trim();
    if (!text && attachedFiles.length === 0) return;

    const userMsgId = Date.now().toString();
    const assistantMsgId = (Date.now() + 1).toString();

    const currentAttachments = [...attachedFiles];
    setAttachedFiles([]); // Clear composer attachments

    const plan = planSubagentForQuery(
      text || `Analyze attached ${currentAttachments.map((a) => a.name).join(", ")}`,
      activeFileType,
      activeFileName,
      currentAttachments
    );

    // Append user message with attachments + preliminary running chain of thought & subagent
    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        role: "user",
        text: text || `[Uploaded ${currentAttachments.length} attachment(s)]`,
        attachments: currentAttachments,
      },
      {
        id: assistantMsgId,
        role: "assistant",
        chainOfThought: {
          summary: "Reasoning & Analyzing…",
          status: "running",
          duration: "thinking…",
          steps: plan.cotSteps.map((step) => ({
            ...step,
            status: "running",
          })),
        },
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

    // Simulate asynchronous execution lifecycle
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
          msg.id === assistantMsgId
            ? {
                ...msg,
                chainOfThought: completedPlan.chainOfThought,
                subagent: completedPlan.subagent,
                checkpoint: completedPlan.checkpoint,
                diffLines: completedPlan.diffLines,
              }
            : msg
        )
      );
    }, 540);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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

          {/* Checkpoint Restore Notification Banner */}
          {restoreNotice && (
            <div className="assistant-restore-notice">
              <span>↺ {restoreNotice}</span>
              <button
                type="button"
                className="notice-close-btn"
                onClick={() => setRestoreNotice("")}
              >
                ✕
              </button>
            </div>
          )}


          {/* Message Stream */}
          <div className="assistant-messages-stream">
            {messages.map((msg) => {
              return (
                <div key={msg.id} className="message-turn-container">
                  {/* Assistant Turn */}
                  {msg.role === "assistant" && (
                    <div className="assistant-msg-bundle">
                      {/* Render Chain of Thought Reasoning Component */}
                      {msg.chainOfThought && (
                        <div className="assistant-cot-wrapper">
                          <ChainOfThoughtBlock
                            summary={msg.chainOfThought.summary}
                            status={msg.chainOfThought.status}
                            duration={msg.chainOfThought.duration}
                            steps={msg.chainOfThought.steps}
                            defaultOpen={msg.chainOfThought.status === "running"}
                          />
                        </div>
                      )}

                      {/* Render Subagent Trace Card */}
                      {msg.subagent && (
                        <div className="assistant-subagent-wrapper">
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
                      )}

                      {/* Render diff lines visualization if available */}
                      {msg.diffLines && (
                        <div style={{ marginTop: "6px" }}>
                          <CodeBlock size="sm">
                            <CodeBlockHeader>
                              <CodeBlockTitle>
                                <span className="lang-tag">diff</span>
                                <span className="title-text">singularity_guard.py</span>
                              </CodeBlockTitle>
                              <CodeBlockActions>
                                <CodeBlockCopyButton value={msg.subagent?.code || ""} />
                              </CodeBlockActions>
                            </CodeBlockHeader>
                            <CodeBlockContent>
                              {msg.diffLines.map((line, lIdx) => (
                                <CodeBlockLine key={lIdx} variant={line.variant} lineNumber={lIdx + 1}>
                                  {line.text}
                                </CodeBlockLine>
                              ))}
                            </CodeBlockContent>
                          </CodeBlock>
                        </div>
                      )}

                      {/* Standalone code without subagent */}
                      {!msg.subagent && msg.code && (
                        <CodeBlockCard
                          title={activeFileType === "ipynb" ? "simulation_cell.py" : "relativistic_notes.md"}
                          language={activeFileType === "ipynb" ? "python" : "markdown"}
                          code={msg.code}
                          lineNumbers={true}
                          onInsert={onInsertSnippet}
                        />
                      )}

                      {/* Fallback bubble if plain message text exists */}
                      {!msg.subagent && !msg.chainOfThought && msg.text && (
                        <div className="assistant-msg-bubble ai-bubble">
                          <div className="bubble-text">{msg.text}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* User Turn */}
                  {msg.role === "user" && (
                    <div className="assistant-msg-bubble user-bubble">
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
                        <CodeBlockCard
                          size="sm"
                          title="user_snippet.py"
                          language={activeFileType === "ipynb" ? "python" : "markdown"}
                          code={msg.code}
                          lineNumbers={true}
                        />
                      )}
                    </div>
                  )}

                  {/* Checkpoint Marker following this turn */}
                  {msg.checkpoint && (
                    <Checkpoint
                      label={msg.checkpoint.label}
                      onRestore={() =>
                        handleRestoreCheckpoint(msg.id, msg.checkpoint.label)
                      }
                    />
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
                placeholder="Ask assistant to reason, write code, or analyze..."
                rows="1"
              />

              <button
                type="submit"
                className="assistant-send-btn"
                disabled={!inputMessage.trim() && attachedFiles.length === 0}
                title="Send instruction to assistant"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </form>
            <span className="assistant-keyboard-hint">
              Enter to send · Shift+Enter for new line · 🚩 Checkpoints let you restore turns
            </span>
          </div>

          {/* Attachment Preview Modal */}
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
 * Creates subagent and chain of thought plan configuration based on query intent and attached assets
 */
function planSubagentForQuery(query, fileType, fileName, attachments = []) {
  const q = query.toLowerCase();
  const hasAttachments = attachments && attachments.length > 0;

  if (hasAttachments) {
    const firstAtt = attachments[0];
    return {
      name: "Multimodal Research Subagent",
      checkpointLabel: `Attachment "${firstAtt.name}" analyzed`,
      task: `Inspect attached asset "${firstAtt.name}" (${firstAtt.sizeStr}) alongside active context "${fileName}".`,
      model: "gemini-1.5-flash",
      cotSteps: [
        {
          title: `Stream attached asset "${firstAtt.name}" (${firstAtt.sizeStr})`,
          description: "Read binary headers and verify encoding integrity.",
        },
        {
          title: "Extract multimodal spacetime tensor representations",
          description: "Projected high-dimensional features into coordinate frame.",
          searchResults: ["fits.gsfc.nasa.gov", "astropy.org/docs"],
        },
        {
          title: `Cross-correlate with active workspace "${fileName}"`,
          description: "Matched metric variables with Schwarzschild geodesics.",
        },
      ],
      tools: [
        { name: `read_attachment_stream(file="${firstAtt.name}")`, status: "running" },
        { name: "extract_multimodal_features()", status: "running" },
        { name: `cross_reference_workspace(file="${fileName}")`, status: "running" },
      ],
    };
  }

  if (q.includes("think") || q.includes("reason") || q.includes("isco") || q.includes("frame dragging")) {
    return {
      name: "Astrophysics Reasoning Agent",
      checkpointLabel: "ISCO boundary conditions derived",
      task: `Formulate rigorous relativistic derivation for "${fileName}" including ISCO and metric horizons.`,
      model: "gemini-1.5-flash",
      cotSteps: [
        {
          title: "Formulated Einstein Field Equations in vacuum (T_μν = 0)",
          description: "Established boundary conditions for static spherically symmetric spacetime.",
          searchResults: ["arxiv.org/abs/gr-qc", "gravity.perimeterinstitute.ca"],
        },
        {
          title: "Solved geodesic equation for timelike test particles",
          description: "Calculated effective potential V_eff(r) = -(GM/r) + (L^2/2r^2) - (GML^2/c^2 r^3).",
        },
        {
          title: "Derived Innermost Stable Circular Orbit (ISCO = 3 Rs)",
          description: "Identified inflection point d^2 V_eff / dr^2 = 0 where stable circular orbits cease.",
          searchResults: ["relativity.nature.com", "nasa.gov/heasarc"],
        },
        {
          title: "Evaluated gravitational redshift and Doppler beaming factor",
          description: "Synthesized continuous relativistic equation block.",
        },
      ],
      tools: [
        { name: "derive_einstein_field_equations()", status: "running" },
        { name: "solve_effective_potential_inflection()", status: "running" },
        { name: "evaluate_isco_boundaries()", status: "running" },
      ],
    };
  }

  if (q.includes("debug") || q.includes("error") || q.includes("risk")) {
    return {
      name: "Code Diagnostics Agent",
      checkpointLabel: "Singularity guards validated",
      task: `Inspect Python AST in "${fileName}" for syntax errors, boundary singularities, and performance bottlenecks.`,
      model: "gemini-1.5-flash",
      cotSteps: [
        {
          title: `Scanned Python syntax tree for "${fileName}"`,
          description: "Verified 0 unhandled tokens, validated import definitions.",
          searchResults: ["docs.python.org/3/ast", "peps.python.org"],
        },
        {
          title: "Audited coordinate singularity boundaries (r -> Rs, v -> c)",
          description: "Detected potential division by zero when calculating lorentz factor.",
        },
        {
          title: "Drafted guarded ValueError exception clause",
          description: "Ensured clean error handling when inputs violate event horizon boundaries.",
        },
      ],
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
      checkpointLabel: "Schwarzschild radius explained",
      task: `Derive mathematical formulas and relativistic metric properties for "${fileName}".`,
      model: "gemini-1.5-flash",
      cotSteps: [
        {
          title: "Retrieved Schwarzschild metric components g_00 and g_11",
          description: "Set escape velocity equal to c to locate event horizon radius.",
          searchResults: ["arxiv.org/astro-ph", "nasa.gov/heasarc"],
        },
        {
          title: "Integrated spatial curvature element dΩ^2 = dθ^2 + sin^2θ dφ^2",
          description: "Verified spherical symmetry and asymptotic flatness as r -> infinity.",
        },
        {
          title: "Derived exact Schwarzschild radius formula Rs = 2GM / c^2",
          description: "Calculated numeric value for solar mass reference.",
        },
      ],
      tools: [
        { name: "query_astrophysics_knowledge_base(topic='Schwarzschild')", status: "running" },
        { name: "derive_metric_tensor(coords=['t', 'r', 'theta', 'phi'])", status: "running" },
      ],
    };
  }

  if (q.includes("summarize") || q.includes("summary")) {
    return {
      name: "Workspace Summary Agent",
      checkpointLabel: "Workspace summary compiled",
      task: `Compile executive synthesis of document structure, computational cells, and astrophysical data in "${fileName}".`,
      model: "gemini-1.5-flash",
      cotSteps: [
        {
          title: "Parsed document headers, markdown cells, and code AST",
          description: "Collected telemetry counts and variable bindings.",
        },
        {
          title: "Aggregated workspace performance & readiness scores",
          description: "Checked client-side Pyodide WASM runtime and file format constraints.",
          searchResults: ["pyodide.org", "jupyter.org/spec"],
        },
      ],
      tools: [
        { name: `parse_document_outline(target="${fileName}")`, status: "running" },
        { name: "aggregate_workspace_metrics()", status: "running" },
      ],
    };
  }

  if (q.includes("plot") || q.includes("chart") || q.includes("graph")) {
    return {
      name: "Astrophysics Visualizer Agent",
      checkpointLabel: "Curvature density chart projected",
      task: `Generate numerical curvature density distribution and plotting routines for "${fileName}".`,
      model: "gemini-1.5-flash",
      cotSteps: [
        {
          title: "Calculated spacetime curvature density grid across radius multiples",
          description: "Sampled curvature density from 1.5 Rs to 10.0 Rs.",
        },
        {
          title: "Generated vector chart preview artifact and ASCII projection",
          description: "Rendered SVG gradient plot for radial gravitational field.",
          searchResults: ["matplotlib.org", "scipy.org"],
        },
      ],
      tools: [
        { name: "compute_curvature_density_grid()", status: "running" },
        { name: "generate_ascii_projection()", status: "running" },
      ],
    };
  }

  return {
    name: "Research Subagent",
    checkpointLabel: "Calculation block created",
    task: `Process prompt: "${query.slice(0, 60)}..." against active context "${fileName}".`,
    model: "gemini-1.5-flash",
    cotSteps: [
      {
        title: "Extracted context slice from active document",
        description: `Inspected ${fileName} active formulas and variables.`,
      },
      {
        title: "Searched astrophysics domain corpus for query matching",
        description: "Synthesized computational solution aligned with general relativity.",
        searchResults: ["arxiv.org", "wikipedia.org/wiki/General_relativity"],
      },
    ],
    tools: [
      { name: `read_context_slice(file="${fileName}")`, status: "running" },
      { name: `synthesize_response(query="${query.slice(0, 30)}")`, status: "running" },
    ],
  };
}

/**
 * Finalizes subagent and chain of thought execution with tool results, timing, code, attachments, and checkpoint
 */
function finalizeSubagentPlan(plan, query, fileType, fileName, _content, userAttachments = []) {
  const q = query.toLowerCase();
  const randomMs = Math.floor(Math.random() * 160 + 130);
  const cotMs = Math.floor(randomMs * 0.7);

  const finalizedCot = {
    summary: `Reasoned in ${plan.cotSteps.length} steps`,
    status: "completed",
    duration: `${cotMs}ms`,
    steps: plan.cotSteps.map((s) => ({
      ...s,
      status: "completed",
    })),
  };

  const checkpoint = {
    label: plan.checkpointLabel || "Turn completed",
  };

  if (userAttachments && userAttachments.length > 0) {
    const firstAtt = userAttachments[0];
    return {
      checkpoint,
      chainOfThought: finalizedCot,
      subagent: {
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
        result: `Processed attached asset "${firstAtt.name}". The reasoning engine verified its properties and generated a verified computational telemetry block:`,
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
      },
    };
  }

  if (q.includes("think") || q.includes("reason") || q.includes("isco") || q.includes("frame dragging")) {
    return {
      checkpoint,
      chainOfThought: finalizedCot,
      subagent: {
        name: plan.name,
        task: plan.task,
        model: plan.model,
        status: "completed",
        duration: `${randomMs}ms`,
        tools: [
          {
            name: "derive_einstein_field_equations()",
            status: "completed",
            output: "vacuum metric tensor confirmed: G_μν = 0",
          },
          {
            name: "solve_effective_potential_inflection()",
            status: "completed",
            output: "inflection point at r = 6GM/c^2 = 3 Rs",
          },
          {
            name: "evaluate_isco_boundaries()",
            status: "completed",
            output: "orbits stable for r > 3 Rs; dynamical plunge for r < 3 Rs",
          },
        ],
        result:
          "Deep reasoning complete: For a Schwarzschild black hole, circular orbits within r < 3 Rs become unstable, forcing matter to plunge directly through the event horizon without emitting further equilibrium radiation.",
        attachments: [],
        code:
          fileType === "ipynb"
            ? `# Effective Potential & ISCO Calculation\nimport math\n\ndef isco_radius(solar_masses):\n    G = 6.67430e-11\n    c = 2.99792e8\n    M = solar_masses * 1.989e30\n    r_s = (2 * G * M) / (c ** 2)\n    r_isco = 3.0 * r_s\n    return r_s / 1000, r_isco / 1000\n\nrs_km, isco_km = isco_radius(4.1e6) # Sagittarius A*\nprint(f"Sgr A* Event Horizon: {rs_km:,.1f} km | ISCO: {isco_km:,.1f} km")`
            : `### Innermost Stable Circular Orbit (ISCO)\n$$r_{\\text{ISCO}} = 3 R_s = \\frac{6GM}{c^2}$$\n\n- At $r > r_{\\text{ISCO}}$: Stable circular accretion orbits exist.\n- At $r < r_{\\text{ISCO}}$: Inward radial plunge toward event horizon.`,
      },
    };
  }

  if (q.includes("debug") || q.includes("error") || q.includes("risk")) {
    return {
      checkpoint,
      chainOfThought: finalizedCot,
      subagent: {
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
      },
      diffLines: [
        { text: "def calculate_lorentz_dilation(r, r_s):", variant: "default" },
        { text: "    # Previous unguarded formulation (coordinate singularity risk):", variant: "default" },
        { text: "    t_dilation = 1.0 / math.sqrt(1 - (r_s / r))", variant: "removed" },
        { text: "    # Guarded against coordinate singularity:", variant: "default" },
        { text: "    if r <= r_s:", variant: "added" },
        { text: "        raise ValueError('Coordinate singularity at event horizon r <= Rs')", variant: "added" },
        { text: "    return 1.0 / math.sqrt(1 - (r_s / r))", variant: "added" },
      ],
    };
  }

  if (q.includes("explain") || q.includes("equation") || q.includes("formula")) {
    return {
      checkpoint,
      chainOfThought: finalizedCot,
      subagent: {
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
      },
    };
  }

  if (q.includes("summarize") || q.includes("summary")) {
    return {
      checkpoint,
      chainOfThought: finalizedCot,
      subagent: {
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
      },
    };
  }

  if (q.includes("plot") || q.includes("chart") || q.includes("graph")) {
    return {
      checkpoint,
      chainOfThought: finalizedCot,
      subagent: {
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
      },
    };
  }

  return {
    checkpoint,
    chainOfThought: finalizedCot,
    subagent: {
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
    },
  };
}
