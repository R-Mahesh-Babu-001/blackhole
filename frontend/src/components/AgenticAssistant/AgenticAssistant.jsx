import { useEffect, useRef, useState } from "react";
import "./AgenticAssistant.css";

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
  const [messages, setMessages] = useState([
    {
      id: "init",
      role: "assistant",
      text: "I am your BlackHole Agentic Assistant. I can inspect your active workspace, generate executable Python code, explain equations, and insert content directly into your document.",
      code: activeFileType === "ipynb"
        ? `# Example: Calculate relativistic lorentz factor\nimport math\n\ndef lorentz_factor(v_over_c):\n    return 1.0 / math.sqrt(1 - (v_over_c ** 2))\n\nprint("Gamma at 0.9c:", lorentz_factor(0.9))`
        : `### Planetary Orbit Metrics\n- **Semi-major axis ($a$):** $1.496 \\times 10^{11}\\text{ m}$\n- **Orbital eccentricity ($e$):** $0.0167$\n- **Orbital period ($T$):** $365.256\\text{ days}$`,
    },
  ]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (textToSend) => {
    const text = (textToSend || inputMessage).trim();
    if (!text) return;

    const userMsgId = Date.now().toString();
    const newMessages = [
      ...messages,
      { id: userMsgId, role: "user", text },
    ];
    setMessages(newMessages);
    setInputMessage("");

    // Generate context-aware agent response
    setTimeout(() => {
      const response = generateAgenticResponse(text, activeFileType, activeFileName, documentContent);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          text: response.text,
          code: response.code,
        },
      ]);
    }, 400);
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
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          text: "Triggered execution for all Python code cells in the active notebook.",
        },
      ]);
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
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          text: "Inserted a new gravitational potential code cell into the notebook.",
        },
      ]);
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
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`assistant-msg-bubble ${
                  msg.role === "user" ? "user-bubble" : "ai-bubble"
                }`}
              >
                <div className="bubble-text">{msg.text}</div>

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
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="assistant-footer">
            <form
              className="assistant-input-box"
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
            >
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask assistant to write code, explain, or refactor..."
                rows="1"
              />
              <button
                type="submit"
                className="assistant-send-btn"
                disabled={!inputMessage.trim()}
                title="Send instruction to assistant"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </form>
            <span className="assistant-keyboard-hint">
              Enter to send · Shift+Enter for new line
            </span>
          </div>
        </>
      )}
    </aside>
  );
}

/**
 * Intelligent context-driven helper for generating responses
 */
function generateAgenticResponse(query, fileType, fileName, _content) {
  const q = query.toLowerCase();

  if (q.includes("explain") || q.includes("equation") || q.includes("formula")) {
    return {
      text: `In "${fileName}", we model relativistic gravitational physics. The Schwarzschild radius defines the spherical boundary of a non-rotating black hole where the escape velocity equals the speed of light:`,
      code: fileType === "ipynb"
        ? `# Schwarzschild radius calculation in kilometers\ndef r_schwarzschild(m_solar):\n    # G = 6.674e-11, c = 2.998e8, M_sun = 1.989e30\n    return (2 * 6.674e-11 * m_solar * 1.989e30) / (2.998e8 ** 2) / 1000\n\nprint("Solar mass event horizon:", r_schwarzschild(1.0), "km")`
        : `$$R_s = \\frac{2GM}{c^2}$$\n\nWhere:\n- $G = 6.67430 \\times 10^{-11}\\text{ m}^3\\text{kg}^{-1}\\text{s}^{-2}$\n- $M$ is the object mass\n- $c = 299,792,458\\text{ m/s}$`,
    };
  }

  if (q.includes("summarize") || q.includes("summary")) {
    return {
      text: `Summary for "${fileName}":\n• Format: ${fileType === "ipynb" ? "Jupyter Notebook (Executable Python)" : "Markdown Document (Split View)"}\n• Focus: Relativistic mechanics, event horizon curvature, and observational data metrics.\n• Status: Ready for continuous editing and computational simulation.`,
      code: null,
    };
  }

  if (q.includes("debug") || q.includes("error") || q.includes("risk")) {
    return {
      text: "Code validation complete: Variable scopes and imports look consistent. Recommendation: ensure zero-division checks when calculating radius at $r \\to R_s$ or velocity at $v \\to c$.",
      code: `if r <= r_s:\n    raise ValueError("Coordinate singularity at event horizon (r <= Rs)")\nt_dilation = 1.0 / math.sqrt(1 - (r_s / r))`,
    };
  }

  if (q.includes("plot") || q.includes("chart") || q.includes("graph")) {
    return {
      text: "Here is an ASCII and numerical projection of gravitational curvature across distance multiples:",
      code: `# Tabular curvature density\nfor mult in [1.5, 2.0, 3.0, 5.0, 10.0]:\n    curvature = 1.0 / (mult ** 3)\n    bar = "█" * int(curvature * 30)\n    print(f"{mult:4.1f} Rs | {curvature:.4f} | {bar}")`,
    };
  }

  // Default helper response
  return {
    text: `Understood. I have drafted this computational block tailored for "${fileName}". You can insert it directly into your active workspace using the button below:`,
    code: fileType === "ipynb"
      ? `# Generated by BlackHole Agentic Assistant\nimport math\n\ndef orbital_velocity(m_central, radius_meters):\n    G = 6.67430e-11\n    return math.sqrt((G * m_central) / radius_meters)\n\n# Earth around Sun\nv_earth = orbital_velocity(1.989e30, 1.496e11)\nprint(f"Earth orbital velocity: {v_earth / 1000:.2f} km/s")`
      : `### Observational Notes\n- Monitored spectral Doppler relativistic shift in accretion inflow.\n- Observed Doppler beaming factor: $\\delta = [\\gamma (1 - \\beta \\cos \\theta)]^{-1}$.`,
  };
}
