import { useEffect, useRef, useState } from "react";
import { Subagent } from "../ui/Trace";
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
        code:
          activeFileType === "ipynb"
            ? `# Example: Calculate relativistic lorentz factor\nimport math\n\ndef lorentz_factor(v_over_c):\n    return 1.0 / math.sqrt(1 - (v_over_c ** 2))\n\nprint("Gamma at 0.9c:", lorentz_factor(0.9))`
            : `### Planetary Orbit Metrics\n- **Semi-major axis ($a$):** $1.496 \\times 10^{11}\\text{ m}$\n- **Orbital eccentricity ($e$):** $0.0167$\n- **Orbital period ($T$):** $365.256\\text{ days}$`,
      },
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
    const subagentMsgId = (Date.now() + 1).toString();

    const plan = planSubagentForQuery(text, activeFileType, activeFileName);

    // Append user message + preliminary running subagent message
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: "user", text },
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
        documentContent
      );

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === subagentMsgId
            ? { ...msg, subagent: completedPlan }
            : msg
        )
      );
    }, 480);
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
          },
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
                placeholder="Ask subagent to research, write code, or analyze..."
                rows="1"
              />
              <button
                type="submit"
                className="assistant-send-btn"
                disabled={!inputMessage.trim()}
                title="Send instruction to subagent"
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
 * Creates subagent plan configuration based on query intent
 */
function planSubagentForQuery(query, fileType, fileName) {
  const q = query.toLowerCase();

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
 * Finalizes subagent execution with tool results, timing, and code
 */
function finalizeSubagentPlan(plan, query, fileType, fileName, _content) {
  const q = query.toLowerCase();
  const randomMs = Math.floor(Math.random() * 160 + 130);

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
    code:
      fileType === "ipynb"
        ? `# Generated by BlackHole Research Subagent\nimport math\n\ndef orbital_velocity(m_central, radius_meters):\n    G = 6.67430e-11\n    return math.sqrt((G * m_central) / radius_meters)\n\n# Earth around Sun\nv_earth = orbital_velocity(1.989e30, 1.496e11)\nprint(f"Earth orbital velocity: {v_earth / 1000:.2f} km/s")`
        : `### Observational Notes\n- Monitored spectral Doppler relativistic shift in accretion inflow.\n- Observed Doppler beaming factor: $\\delta = [\\gamma (1 - \\beta \\cos \\theta)]^{-1}$.`,
  };
}
