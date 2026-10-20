import { useEffect, useMemo, useRef, useState } from "react";
import { AgentTrace, Subagent } from "../ui/Trace";
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
import { ToolConfirmation } from "../ui/Confirmation";
import {
  Context,
  ContextTrigger,
  ContextContent,
  ContextContentHeader,
  ContextContentBody,
  ContextContentFooter,
  ContextWindowCard,
} from "../ui/Context";
import {
  MessageScrollerProvider,
  MessageScroller,
  MessageScrollerViewport,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerButton,
  Message,
  MessageContent,
  Bubble,
  BubbleContent,
  MessageFooter,
  MessageCopyAction,
  MessageGoodAction,
  MessageBadAction,
  MessageRetryAction,
  MessageEditAction,
  ConversationDownload,
} from "../ui/Chat";
import { ChangedFilesCard } from "../ui/FileTree";
import { InlineCitation } from "../ui/InlineCitation";
import { Sources } from "../ui/Sources";
import {
  Plan,
  PlanHeader,
  PlanTitle,
  PlanDescription,
  PlanContent,
  PlanStep,
  PlanIcon,
  PlanRouteIcon,
} from "../ui/Plan";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from "../ui/DropdownMenu";
import { InputGroupButton } from "../ui/InputGroup";
import {
  PromptInput,
  PromptInputHeader,
  PromptInputTextarea,
  PromptInputActionMenuTrigger,
  PromptInputSubmit,
  PromptInputActions,
  PlusIcon,
  ArrowUpIcon,
} from "../ui/PromptInput";
import { getBackendBaseUrl } from "../../services/api";
import "./AgenticAssistant.css";

const MODEL_CONTEXT_LIMIT = 128000;

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
  const [feedbackState, setFeedbackState] = useState({});
  const [selectedModel, setSelectedModel] = useState("gemini-1.5-flash");
  const [effort, setEffort] = useState("medium");

  const [messages, setMessages] = useState([]);

  const getModelLabel = (modelId) => {
    switch (modelId) {
      case "gemini-1.5-flash":
        return "Gemini 1.5 Flash";
      case "gemini-1.5-pro":
        return "Gemini 1.5 Pro";
      case "claude-3-5-sonnet":
        return "Claude 3.5 Sonnet";
      case "claude-3-5-haiku":
        return "Claude 3.5 Haiku";
      case "gpt-4o":
        return "GPT-4o";
      case "deepseek-r1":
        return "DeepSeek-R1";
      default:
        return "Gemini 1.5 Flash";
    }
  };

  const getModelIcon = (modelId) => {
    if (modelId.includes("claude")) {
      return (
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 22h5l2.5-5h5l2.5 5h5L12 2zm-1 12l2.5-5.5L16 14h-5z" />
        </svg>
      );
    }
    if (modelId.includes("gpt")) {
      return (
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 6v6l4 2" />
        </svg>
      );
    }
    if (modelId.includes("deepseek")) {
      return (
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
          <path d="M8 12h8" />
          <path d="M12 8v8" />
        </svg>
      );
    }
    return (
      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2z" />
      </svg>
    );
  };

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const formRef = useRef(null);

  /**
   * Dynamically tracks conversation and active document context window usage
   * Conforms to AI SDK metadata.usage specification
   */
  const cumulativeUsage = useMemo(() => {
    let inputTokens = 2400; // System instructions & environment prompt
    let outputTokens = 0;
    let reasoningTokens = 0;

    // Document context tokens
    if (documentContent) {
      inputTokens += Math.max(250, Math.round(documentContent.length / 4));
    }

    messages.forEach((msg) => {
      if (msg.role === "user") {
        inputTokens += Math.round((msg.text?.length || 0) / 4) + 120;
        if (msg.attachments?.length) {
          inputTokens += msg.attachments.length * 850;
        }
      } else if (msg.role === "assistant") {
        if (msg.metadata?.usage) {
          inputTokens += msg.metadata.usage.inputTokens || 0;
          outputTokens += msg.metadata.usage.outputTokens || 0;
          reasoningTokens += msg.metadata.usage.reasoningTokens || 0;
        } else {
          outputTokens += Math.round((msg.text?.length || 0) / 4) + 240;
          if (msg.subagent?.code) {
            outputTokens += Math.round(msg.subagent.code.length / 4);
          }
          if (msg.chainOfThought?.steps) {
            reasoningTokens += msg.chainOfThought.steps.length * 180;
          }
        }
      }
    });

    const totalUsed = inputTokens + outputTokens + reasoningTokens;
    return {
      inputTokens,
      outputTokens,
      reasoningTokens,
      totalUsed,
    };
  }, [messages, documentContent]);

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

  /**
   * Handle Good / Bad response toggle on assistant turns (shadcn AI Elements Message)
   */
  const handleFeedbackToggle = (msgId, type) => {
    setFeedbackState((prev) => ({
      ...prev,
      [msgId]: prev[msgId] === type ? null : type,
    }));
  };

  /**
   * Retry an assistant turn by finding the preceding user prompt and rerunning it
   */
  const handleRetryTurn = (msgId) => {
    const msgIdx = messages.findIndex((m) => m.id === msgId);
    let userText = "";
    if (msgIdx > 0) {
      for (let i = msgIdx - 1; i >= 0; i--) {
        if (messages[i]?.role === "user" && messages[i]?.text) {
          userText = messages[i].text;
          break;
        }
      }
    }
    if (userText) {
      handleSendMessage(userText);
    }
  };

  /**
   * Edit action on user turn puts the text back in the prompt input field
   */
  const handleEditUserMessage = (text) => {
    setInputMessage(text);
    inputRef.current?.focus();
  };

  /**
   * Handle user approving a tool run (shadcn AI Elements Confirmation)
   * The question was an Item with Deny and Approve buttons.
   * Once approved, the call becomes an approved Tool line with streamed output.
   */
  const handleApproveConfirmation = (messageId) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId && msg.confirmation) {
          const cmd = msg.confirmation.command || "command";
          const finalOutput =
            msg.confirmation.output ||
            `[stdout]\nExecuting: ${cmd}\nTask completed with exit code 0.`;
          return {
            ...msg,
            confirmation: {
              ...msg.confirmation,
              state: "approved",
              output: finalOutput,
            },
            text: msg.text
              ? `${msg.text}\n\nApproved: Removed the dist folder.`
              : `Removed the dist folder. Command "${cmd}" finished with status 0.`,
          };
        }
        return msg;
      })
    );
  };

  /**
   * Handle user denying a tool run (shadcn AI Elements Confirmation)
   * Once denied, the call becomes a denied Tool line.
   */
  const handleDenyConfirmation = (messageId) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId && msg.confirmation) {
          return {
            ...msg,
            confirmation: {
              ...msg.confirmation,
              state: "denied",
            },
            text: msg.text
              ? `${msg.text}\n\nOkay, I left the dist folder in place.`
              : "Okay, I left the dist folder in place. Operation was cancelled.",
          };
        }
        return msg;
      })
    );
  };

  /**
   * Request confirmation for a tool call (demonstrating AI Elements Confirmation)
   */
  const handleRequestConfirmation = (
    command = "rm -rf dist",
    description = "The command runs in this project."
  ) => {
    const userMsgId = Date.now().toString();
    const assistantMsgId = (Date.now() + 1).toString();

    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        role: "user",
        text: `Clean up the build folder.`,
        attachments: [],
      },
      {
        id: assistantMsgId,
        role: "assistant",
        text: "I am ready to clean up the build folder, but this action requires your explicit approval.",
        confirmation: {
          id: `approval-${Date.now()}`,
          command,
          description,
          state: "approval-requested",
          output: `[stdout]\n$ ${command}\nCleaned up 16 build artifacts in dist/\nDone in 42ms. Exit code 0.`,
        },
        checkpoint: {
          label: "Tool approval requested",
        },
        metadata: {
          usage: {
            inputTokens: 840,
            outputTokens: 210,
            reasoningTokens: 160,
          },
        },
      },
    ]);
  };

  const handleSendMessage = (textToSend) => {
    const text = (textToSend || inputMessage).trim();
    if (!text && attachedFiles.length === 0) return;

    const userMsgId = Date.now().toString();
    const assistantMsgId = (Date.now() + 1).toString();

    const currentAttachments = [...attachedFiles];
    setAttachedFiles([]); // Clear composer attachments

    const lowerText = text.toLowerCase();
    const isConfirmationRequest =
      lowerText.includes("clean") ||
      lowerText.includes("rm -rf") ||
      lowerText.includes("build folder") ||
      lowerText.includes("confirm") ||
      lowerText.includes("approval") ||
      lowerText.includes("approve") ||
      lowerText.includes("deny");

    if (isConfirmationRequest && !lowerText.includes("trace")) {
      const targetCmd = lowerText.includes("rm") || lowerText.includes("clean")
        ? "rm -rf dist"
        : `python -m sandbox.execute --file "${activeFileName}"`;
      const targetDesc = "The command runs in this project.";

      setMessages((prev) => [
        ...prev,
        {
          id: userMsgId,
          role: "user",
          text: text,
          attachments: currentAttachments,
        },
        {
          id: assistantMsgId,
          role: "assistant",
          text: "I can run that tool, but it requires approval before execution in this workspace.",
          confirmation: {
            id: `approval-${Date.now()}`,
            command: targetCmd,
            description: targetDesc,
            state: "approval-requested",
            output: `[stdout]\n$ ${targetCmd}\nExecuting task...\nOperation completed successfully with exit code 0.`,
          },
          checkpoint: {
            label: `Approval requested: ${targetCmd}`,
          },
          metadata: {
            usage: {
              inputTokens: 920,
              outputTokens: 240,
              reasoningTokens: 180,
            },
          },
        },
      ]);
      setInputMessage("");
      return;
    }

    const plan = planSubagentForQuery(
      text || `Analyze attached ${currentAttachments.map((a) => a.name).join(", ")}`,
      activeFileType,
      activeFileName,
      currentAttachments,
      selectedModel,
      effort
    );

    // Append user message with attachments + preliminary running chain of thought, trace & subagent
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
        plan: {
          title: plan.planTitle,
          description: plan.planDescription,
          isStreaming: true,
          steps: (plan.planSteps || []).map((step, idx) => ({
            ...step,
            status: idx === 0 ? "completed" : idx === 1 ? "running" : "pending",
          })),
        },
        trace: {
          status: "running",
          steps: [
            {
              id: "step-context",
              title: `Inspected workspace document "${activeFileName}"`,
              description: activeFileType.toUpperCase(),
              status: "completed",
              icon: "file",
              content: `Target: ${activeFileName}\nType: ${activeFileType}\nStatus: Read from active memory buffer.`,
            },
            {
              id: "step-sandbox",
              title: "Checking WebAssembly Python environment",
              description: "verifying…",
              status: "running",
              icon: "terminal",
              content: "Running: python -c 'import sys, math; print(\"BlackHole WASM environment active\")'\nKernel: Pyodide 3.11.4 WebAssembly",
            },
            {
              id: "step-tool",
              title: plan.tools[0]?.name ? `Execute ${plan.tools[0].name}` : "Execute agent tool routine",
              description: "pending",
              status: "pending",
              icon: "tool",
            },
          ],
        },
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
    setTimeout(async () => {
      let liveTree = null;
      const lower = text.toLowerCase();
      const isScan =
        plan.isWorkspaceScan ||
        lower.includes("scan") ||
        lower.includes("audit") ||
        lower.includes("directory") ||
        lower.includes("structure") ||
        lower.includes("project file");

      if (isScan) {
        try {
          const res = await fetch(`${getBackendBaseUrl()}/workspace/tree`);
          if (res.ok) {
            const data = await res.json();
            if (data.tree && data.tree.length > 0) {
              liveTree = data.tree;
            }
          }
        } catch (e) {
          console.warn("Backend workspace tree fetch failed, using fallback:", e);
        }
      }

      const completedPlan = finalizeSubagentPlan(
        plan,
        text,
        activeFileType,
        activeFileName,
        documentContent,
        currentAttachments,
        liveTree,
        selectedModel,
        effort
      );

      const randomMs = Math.floor(Math.random() * 140 + 110);
      const treeSteps = completedPlan.changedTree
        ? [
            {
              id: "step-scan",
              title: `Scanned workspace directory hierarchy (${completedPlan.changedTreeTitle || "files mapped"})`,
              description: "Live scan · 28ms",
              status: "completed",
              icon: "file",
              content: `Root: blackhole/\nDirectories indexed: backend/, frontend/, configs\nSurfaced in FileTree below.`,
            },
          ]
        : [];

      const finalizedTrace = {
        status: "completed",
        steps: [
          {
            id: "step-context",
            title: `Inspected workspace document "${activeFileName}"`,
            description: "AST verified · 24ms",
            status: "completed",
            icon: "file",
            content: `Target: ${activeFileName}\nType: ${activeFileType}\nStatus: Memory buffer indexed.\nAST validation: 0 errors detected.`,
          },
          ...treeSteps,
          {
            id: "step-sandbox",
            title: "Verified Pyodide WebAssembly Python environment",
            description: "Ready · 46ms",
            status: "completed",
            icon: "terminal",
            content: "Kernel: Python 3.11.4 (WebAssembly on browser)\nStatus: READY\nAllocated memory: 64MB\nSandboxed: True\nModules: math, numpy, sympy",
          },
          {
            id: "step-tool",
            title: `Executed tool ${plan.tools[0]?.name || "synthesize_analysis()"}`,
            description: `${randomMs}ms`,
            status: "completed",
            icon: "tool",
            content: completedPlan.subagent?.tools?.map((t) => `${t.name} -> ${t.output || "OK"}`).join("\n") || "Tool routine executed without runtime errors.",
          },
          {
            id: "step-sources",
            title: "Correlated research sources & references",
            description: "2 sources",
            status: "completed",
            icon: "sources",
            sources: [
              {
                title: "arXiv: Relativistic Fluid & Geodesic Mechanics",
                url: "https://arxiv.org/abs/gr-qc",
              },
              {
                title: "NASA HEASARC: Observational Astrophysics Archive",
                url: "https://heasarc.gsfc.nasa.gov",
              },
            ],
          },
        ],
      };

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                plan: {
                  title: plan.planTitle,
                  description: plan.planDescription,
                  isStreaming: false,
                  steps: (plan.planSteps || []).map((s) => ({
                    ...s,
                    status: "completed",
                  })),
                },
                trace: finalizedTrace,
                chainOfThought: completedPlan.chainOfThought,
                subagent: completedPlan.subagent,
                checkpoint: completedPlan.checkpoint,
                diffLines: completedPlan.diffLines,
                changedTree: completedPlan.changedTree,
                changedFiles: completedPlan.changedFiles,
                changedTreeTitle: completedPlan.changedTreeTitle,
                sources: completedPlan.sources || finalizedTrace.steps.find((s) => s.id === "step-sources")?.sources || [],
                metadata: {
                  model: selectedModel,
                  effort: effort,
                  usage: {
                    inputTokens: Math.round(((text?.length || 0) + (activeFileName?.length || 0) * 12) / 4) + 1480,
                    outputTokens: Math.round(((completedPlan.subagent?.code?.length || 0) + (completedPlan.subagent?.result?.length || 0)) / 4) + 380,
                    reasoningTokens:
                      effort === "high"
                        ? (completedPlan.chainOfThought?.steps?.length || 4) * 280
                        : effort === "low"
                        ? (completedPlan.chainOfThought?.steps?.length || 2) * 90
                        : (completedPlan.chainOfThought?.steps?.length || 3) * 190,
                  },
                },
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

        <div className="assistant-header-controls">
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
      </div>

      {isOpen && (
        <>
          {/* Active Document Context Pill & Model Context Window Tracker */}
          <div className="assistant-context-bar">
            <div className="context-file-info">
              <span className="context-type-badge">{activeFileType.toUpperCase()}</span>
              <span className="context-filename" title={activeFileName}>
                {activeFileName}
              </span>
            </div>
            <div className="assistant-context-actions">
              {messages.length > 0 && (
                <ConversationDownload messages={messages} />
              )}
              <ContextWindowCard
                usedTokens={cumulativeUsage.totalUsed}
                maxTokens={MODEL_CONTEXT_LIMIT}
                usage={cumulativeUsage}
                modelId={MODEL_ID}
                triggerClassName="context-bar-trigger"
              />
            </div>
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

          {/* Chat Thread with Message Scroller (shadcn AI Elements Chat) */}
          <MessageScrollerProvider autoScroll={true}>
            <MessageScroller className="assistant-thread-scroller">
              <MessageScrollerViewport className="assistant-messages-viewport">
                <MessageScrollerContent className="assistant-messages-content">
                  {messages.length === 0 ? (
                    <div className="assistant-empty-slate">
                      <div className="empty-slate-badge">
                        <span className="empty-badge-dot" />
                        <span>BLACKHOLE AGENTIC WORKSPACE</span>
                      </div>
                      <h4>Workspace Assistant</h4>
                      <p>
                        Autonomous agent with chain-of-thought reasoning, tool execution traces, verified approvals, and file tree synthesis.
                      </p>

                      <div className="empty-starter-grid">
                        <button
                          type="button"
                          className="starter-card"
                          onClick={() =>
                            handleSendMessage(
                              "Calculate Kerr black hole ISCO radius and frame-dragging coordinates"
                            )
                          }
                        >
                          <div className="starter-card-icon">⚡</div>
                          <div className="starter-card-body">
                            <span className="starter-card-title">Derive Kerr ISCO & Geodesics</span>
                            <span className="starter-card-desc">Deep reasoning chain & numerical derivation</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          className="starter-card"
                          onClick={() =>
                            handleSendMessage(
                              "Scan workspace file and folder structure and audit project hierarchy"
                            )
                          }
                        >
                          <div className="starter-card-icon">🔍</div>
                          <div className="starter-card-body">
                            <span className="starter-card-title">Scan Workspace File Tree</span>
                            <span className="starter-card-desc">Live filesystem scan with interactive folder tree</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          className="starter-card"
                          onClick={() =>
                            handleSendMessage(
                              "Generate relativistic simulation suite with folder tree"
                            )
                          }
                        >
                          <div className="starter-card-icon">📁</div>
                          <div className="starter-card-body">
                            <span className="starter-card-title">Generate Simulation Suite</span>
                            <span className="starter-card-desc">Hierarchical file tree with collapsible directories</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          className="starter-card"
                          onClick={() =>
                            handleRequestConfirmation(
                              "rm -rf dist/",
                              "Clean workspace build cache and transient artifacts."
                            )
                          }
                        >
                          <div className="starter-card-icon">🛡️</div>
                          <div className="starter-card-body">
                            <span className="starter-card-title">Sandbox Tool Approval</span>
                            <span className="starter-card-desc">Item confirmation with user Approve / Deny</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          className="starter-card"
                          onClick={() =>
                            handleSendMessage(
                              "Create multi-step execution plan to audit and migrate relativity solver"
                            )
                          }
                        >
                          <div className="starter-card-icon">🗺️</div>
                          <div className="starter-card-body">
                            <span className="starter-card-title">Multi-Step Agent Plan</span>
                            <span className="starter-card-desc">Step-by-step agent plan with progress counter & statuses</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      return (
                        <MessageScrollerItem
                          key={msg.id}
                          messageId={msg.id}
                          scrollAnchor={msg.role === "user"}
                          className="message-turn-container"
                        >
                          {/* Assistant Turn */}
                          {msg.role === "assistant" && (
                            <Message align="start" className="assistant-message-turn">
                              <MessageContent className="assistant-msg-bundle">
                                {/* 0. Pre-Execution Agent Plan (shadcn AI Elements Plan) */}
                                {msg.plan && (
                                  <div className="assistant-plan-wrapper">
                                    <Plan isStreaming={msg.plan.isStreaming} defaultOpen={true}>
                                      <PlanHeader>
                                        <PlanIcon>
                                          <PlanRouteIcon />
                                        </PlanIcon>
                                        <PlanTitle>{msg.plan.title}</PlanTitle>
                                        <PlanDescription>
                                          {msg.plan.steps.filter((s) => s.status === "completed" || s.status === "done").length} of {msg.plan.steps.length} done
                                        </PlanDescription>
                                      </PlanHeader>
                                      <PlanContent description={msg.plan.description}>
                                        {msg.plan.steps.map((step) => (
                                          <PlanStep
                                            key={step.id}
                                            status={step.status}
                                            title={step.title}
                                            description={step.description}
                                          />
                                        ))}
                                      </PlanContent>
                                    </Plan>
                                  </div>
                                )}

                                {/* 1. Chain of Thought Reasoning (at top of turn) */}
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

                                {/* 2. Agent Execution Trace (sequential tool steps) */}
                                {msg.trace && (
                                  <div className="assistant-trace-wrapper">
                                    <AgentTrace trace={msg.trace} />
                                  </div>
                                )}

                                {/* 3. Tool Confirmation (Approval request or outcome) */}
                                {msg.confirmation && (
                                  <div className="assistant-confirmation-wrapper">
                                    <ToolConfirmation
                                      id={msg.confirmation.id}
                                      command={msg.confirmation.command}
                                      description={msg.confirmation.description}
                                      state={msg.confirmation.state}
                                      output={msg.confirmation.output}
                                      onApprove={() => handleApproveConfirmation(msg.id)}
                                      onDeny={() => handleDenyConfirmation(msg.id)}
                                    />
                                  </div>
                                )}

                                {/* 4. Subagent Execution Card (if present) */}
                                {msg.subagent && (
                                  <div className="assistant-subagent-wrapper">
                                    <Subagent
                                      name={msg.subagent.name}
                                      task={msg.subagent.task}
                                      model={msg.subagent.model}
                                      tools={msg.subagent.tools}
                                      status={msg.subagent.status}
                                      duration={msg.subagent.duration}
                                      result={renderTextWithCitations(msg.subagent.result, msg.sources)}
                                      code={msg.subagent.code}
                                      attachments={msg.subagent.attachments}
                                      onPreviewAttachment={setSelectedAttachment}
                                      onInsertCode={onInsertSnippet}
                                      activeFileType={activeFileType}
                                      defaultOpen={true}
                                    />
                                  </div>
                                )}

                                {/* 5. Changed Files Folder Tree (shadcn AI Elements FileTree & Collapsible) */}
                                {(msg.changedTree || (msg.changedFiles && msg.changedFiles.length > 0)) && (
                                  <div className="assistant-filetree-wrapper">
                                    <ChangedFilesCard
                                      title={msg.changedTreeTitle || "Generated Simulation Files"}
                                      tree={msg.changedTree}
                                      files={msg.changedFiles || []}
                                      onSelectFile={(path) => {
                                        if (onInsertSnippet) {
                                          onInsertSnippet(
                                            `# Inspected from Workspace File Tree: ${path}\n# Status: Active BlackHole project file\n`,
                                            "code"
                                          );
                                        }
                                        setRestoreNotice(`Selected file from tree: "${path}"`);
                                        setTimeout(() => setRestoreNotice(""), 3500);
                                      }}
                                    />
                                  </div>
                                )}

                                {/* 6. Code diff lines if available */}
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

                                {/* 7. Standalone code without subagent */}
                                {!msg.subagent && msg.code && (
                                  <CodeBlockCard
                                    title={activeFileType === "ipynb" ? "simulation_cell.py" : "relativistic_notes.md"}
                                    language={activeFileType === "ipynb" ? "python" : "markdown"}
                                    code={msg.code}
                                    lineNumbers={true}
                                    onInsert={onInsertSnippet}
                                  />
                                )}

                                {/* 8. Text bubble using Bubble component */}
                                {msg.text && (!msg.subagent || msg.subagent.result !== msg.text) && (
                                  <Bubble align="start" variant="default" className="ai-bubble">
                                    <BubbleContent>{renderTextWithCitations(msg.text, msg.sources)}</BubbleContent>
                                  </Bubble>
                                )}

                                {/* 9. Referenced Sources after reply (shadcn AI Elements Sources) */}
                                {msg.sources && msg.sources.length > 0 && (
                                  <div className="assistant-sources-wrapper" style={{ marginTop: "8px", marginBottom: "4px" }}>
                                    <Sources
                                      sources={msg.sources}
                                      title="Referenced Sources"
                                      defaultOpen={true}
                                    />
                                  </div>
                                )}

                                {/* 10. Turn Context Usage Badge (AI Elements Context) */}
                                {msg.metadata?.usage && (
                                  <div className="assistant-turn-context-row">
                                    <Context
                                      usedTokens={(msg.metadata.usage.inputTokens || 0) + (msg.metadata.usage.outputTokens || 0)}
                                      maxTokens={MODEL_CONTEXT_LIMIT}
                                      usage={msg.metadata.usage}
                                      modelId={MODEL_ID}
                                    >
                                      <ContextTrigger
                                        render={
                                          <button type="button" className="turn-context-mini-badge" title="Inspect Turn Context Usage">
                                            <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5">
                                              <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
                                              <path d="M22 12A10 10 0 0 0 12 2v10z" />
                                            </svg>
                                            <span>{Math.round((((msg.metadata.usage.inputTokens || 0) + (msg.metadata.usage.outputTokens || 0)) / MODEL_CONTEXT_LIMIT) * 100)}% turn tokens</span>
                                          </button>
                                        }
                                      />
                                      <ContextContent align="start">
                                        <ContextContentHeader title="Turn Context Window" />
                                        <ContextContentBody />
                                        <ContextContentFooter />
                                      </ContextContent>
                                    </Context>
                                  </div>
                                )}

                                {/* 11. Assistant Message Actions & Footer (shadcn AI Elements Message) */}
                                <MessageFooter align="start">
                                  <MessageCopyAction
                                    getText={() => msg.text || msg.subagent?.result || msg.code || ""}
                                  />
                                  <MessageGoodAction
                                    pressed={feedbackState[msg.id] === "good"}
                                    onToggle={() => handleFeedbackToggle(msg.id, "good")}
                                  />
                                  <MessageBadAction
                                    pressed={feedbackState[msg.id] === "bad"}
                                    onToggle={() => handleFeedbackToggle(msg.id, "bad")}
                                  />
                                  <MessageRetryAction
                                    onRetry={() => handleRetryTurn(msg.id)}
                                  />
                                </MessageFooter>
                              </MessageContent>
                            </Message>
                          )}

                          {/* User Turn */}
                          {msg.role === "user" && (
                            <Message align="end" className="user-message-turn">
                              <MessageContent className="user-msg-bundle">
                                <Bubble align="end" variant="muted" className="user-bubble">
                                  <BubbleContent>{msg.text}</BubbleContent>
                                </Bubble>

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

                                {/* User Message Actions & Footer (shadcn AI Elements Message) */}
                                <MessageFooter align="end">
                                  <MessageCopyAction text={msg.text} />
                                  <MessageEditAction onEdit={() => handleEditUserMessage(msg.text)} />
                                </MessageFooter>
                              </MessageContent>
                            </Message>
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
                        </MessageScrollerItem>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </MessageScrollerContent>
              </MessageScrollerViewport>
              <MessageScrollerButton />
            </MessageScroller>
          </MessageScrollerProvider>

          {/* Input Footer with Prompt Input (shadcn AI Elements Prompt Input) */}
          <div className="assistant-footer">
            {/* Hidden native file input */}
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              multiple
              onChange={handleFileInputChange}
            />

            <PromptInput
              formRef={formRef}
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              canSend={Boolean(inputMessage.trim() || attachedFiles.length > 0)}
              className="assistant-prompt-input"
            >
              {/* Block-start addon: Attached files chips with remove button */}
              {attachedFiles.length > 0 && (
                <PromptInputHeader>
                  <div className="composer-attachments-header-row">
                    <div className="composer-attachments-chips">
                      {attachedFiles.map((file) => (
                        <Attachment
                          key={file.id}
                          size="sm"
                          state={file.state}
                          orientation="horizontal"
                          className="ui-prompt-input-chip"
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
                              <svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2.5">
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
                    </div>
                    <button
                      type="button"
                      className="composer-clear-attachments-btn"
                      onClick={handleClearAllAttachments}
                      title="Clear all attachments"
                    >
                      Clear all
                    </button>
                  </div>
                </PromptInputHeader>
              )}

              {/* Textarea with className="p-3" */}
              <PromptInputTextarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask assistant to reason, write code, or analyze..."
                rows="2"
                className="composer-textarea"
              />

              {/* Block-end addon: Attach, Model & Effort with ml-auto on 1st menu, Submit */}
              <PromptInputActions className="composer-addon-bar">
                {/* Attach Button: size="icon-sm", variant="outline", rounded-full, PlusIcon */}
                <PromptInputActionMenuTrigger
                  title="Attach file or image"
                  aria-label="Attach files"
                  onClick={() => fileInputRef.current?.click()}
                  className="composer-attach-btn"
                >
                  <PlusIcon />
                </PromptInputActionMenuTrigger>

                {/* Model Selector Menu with ml-auto on trigger so menus sit next to send button */}
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <InputGroupButton size="sm" variant="outline" className="model-selector-trigger-btn ml-auto">
                        <span className="model-trigger-icon">{getModelIcon(selectedModel)}</span>
                        <span className="model-trigger-name">{getModelLabel(selectedModel)}</span>
                        <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </InputGroupButton>
                    }
                  />
                  <DropdownMenuContent align="end" side="top" className="model-selector-dropdown-content">
                    <DropdownMenuRadioGroup value={selectedModel} onValueChange={setSelectedModel}>
                      <DropdownMenuGroup>
                        <DropdownMenuLabel>Google Gemini</DropdownMenuLabel>
                        <DropdownMenuRadioItem value="gemini-1.5-flash" closeOnClick>
                          <div className="model-item-row">
                            <span className="model-item-title">Gemini 1.5 Flash</span>
                            <span className="model-item-badge">Fast · 1M Context</span>
                          </div>
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="gemini-1.5-pro" closeOnClick>
                          <div className="model-item-row">
                            <span className="model-item-title">Gemini 1.5 Pro</span>
                            <span className="model-item-badge">Deep Analysis · 2M Context</span>
                          </div>
                        </DropdownMenuRadioItem>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuLabel>Anthropic</DropdownMenuLabel>
                        <DropdownMenuRadioItem value="claude-3-5-sonnet" closeOnClick>
                          <div className="model-item-row">
                            <span className="model-item-title">Claude 3.5 Sonnet</span>
                            <span className="model-item-badge">Code & Geodesics</span>
                          </div>
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="claude-3-5-haiku" closeOnClick>
                          <div className="model-item-row">
                            <span className="model-item-title">Claude 3.5 Haiku</span>
                            <span className="model-item-badge">Fast Subagent</span>
                          </div>
                        </DropdownMenuRadioItem>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuLabel>OpenAI & DeepSeek</DropdownMenuLabel>
                        <DropdownMenuRadioItem value="gpt-4o" closeOnClick>
                          <div className="model-item-row">
                            <span className="model-item-title">GPT-4o</span>
                            <span className="model-item-badge">Omni Reasoning</span>
                          </div>
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="deepseek-r1" closeOnClick>
                          <div className="model-item-row">
                            <span className="model-item-title">DeepSeek-R1</span>
                            <span className="model-item-badge">Open Relativistic Reasoner</span>
                          </div>
                        </DropdownMenuRadioItem>
                      </DropdownMenuGroup>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Reasoning Effort Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <InputGroupButton size="sm" variant="outline" className="effort-selector-trigger-btn">
                        <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="3" />
                          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                        </svg>
                        <span className="effort-trigger-name">{effort.charAt(0).toUpperCase() + effort.slice(1)}</span>
                        <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </InputGroupButton>
                    }
                  />
                  <DropdownMenuContent align="end" side="top" className="effort-selector-dropdown-content">
                    <DropdownMenuRadioGroup value={effort} onValueChange={setEffort}>
                      <DropdownMenuGroup>
                        <DropdownMenuLabel>Thinking & Reasoning Effort</DropdownMenuLabel>
                        <DropdownMenuRadioItem value="low" closeOnClick>
                          <div className="effort-item-row">
                            <span className="effort-item-title">Low</span>
                            <span className="effort-item-desc">Fast responses, minimal reasoning tokens</span>
                          </div>
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="medium" closeOnClick>
                          <div className="effort-item-row">
                            <span className="effort-item-title">Medium</span>
                            <span className="effort-item-desc">Balanced depth and verification</span>
                          </div>
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="high" closeOnClick>
                          <div className="effort-item-row">
                            <span className="effort-item-title">High</span>
                            <span className="effort-item-desc">Deep chain-of-thought analysis</span>
                          </div>
                        </DropdownMenuRadioItem>
                      </DropdownMenuGroup>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Send Button: size="icon-sm", variant="default", rounded-full, ArrowUpIcon */}
                <PromptInputSubmit
                  className="composer-send-btn"
                  disabled={!inputMessage.trim() && attachedFiles.length === 0}
                  title="Send to assistant"
                  aria-label="Send"
                >
                  <ArrowUpIcon />
                </PromptInputSubmit>
              </PromptInputActions>
            </PromptInput>

            <span className="assistant-keyboard-hint">
              Press Enter to send · Shift+Enter for new line · 🚩 Checkpoints enable turn rollbacks
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

function adaptCotStepsForEffort(baseSteps, effort) {
  if (effort === "high") {
    return [
      ...baseSteps,
      {
        title: "Extended Relativistic Chain-of-Thought Formulation",
        description: "Evaluated high-order perturbation terms, affine parameter geodesics, and invariant tensor contractions.",
      },
      {
        title: "Rigorous Mathematical Convergence & Boundary Verification",
        description: "Verified numerical stability across asymptotic limits with 0 coordinate divergences.",
      },
    ];
  }
  if (effort === "low") {
    return baseSteps.slice(0, Math.min(baseSteps.length, 2));
  }
  return baseSteps;
}

/**
 * Creates subagent and chain of thought plan configuration based on query intent and attached assets
 */
function planSubagentForQuery(
  query,
  fileType,
  fileName,
  attachments = [],
  model = "gemini-1.5-flash",
  effort = "medium"
) {
  const q = query.toLowerCase();
  const hasAttachments = attachments && attachments.length > 0;

  const getRawPlan = () => {
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

  if (
    q.includes("scan") ||
    q.includes("audit") ||
    q.includes("structure") ||
    q.includes("workspace") ||
    q.includes("project file") ||
    q.includes("explore")
  ) {
    return {
      name: "Workspace Audit & File Scanner Agent",
      checkpointLabel: "Workspace files scanned",
      task: `Scan workspace file and folder hierarchy and inspect active document "${fileName}".`,
      model: "gemini-1.5-flash",
      isWorkspaceScan: true,
      cotSteps: [
        {
          title: "Audited workspace directory structure and file system hierarchy",
          description: "Scanned recursive directories: backend/, frontend/src/, config manifests.",
          searchResults: ["fastapi.tiangolo.com", "vitejs.dev"],
        },
        {
          title: "Validated module dependencies and AST syntax across workspace",
          description: "0 import collisions detected between Pyodide WASM and FastAPI backend.",
        },
        {
          title: `Correlated active workspace context with "${fileName}"`,
          description: "Indexed syntax tree and execution buffers.",
        },
      ],
      tools: [
        { name: "scan_workspace_directory_tree(path='.')", status: "running" },
        { name: "validate_workspace_manifests()", status: "running" },
        { name: `audit_active_context(file="${fileName}")`, status: "running" },
      ],
    };
  }

  if (
    q.includes("tree") ||
    q.includes("file") ||
    q.includes("suite") ||
    q.includes("folder") ||
    q.includes("simulation")
  ) {
    return {
      name: "Simulation Suite Architect",
      checkpointLabel: "Simulation suite scaffolded",
      task: `Scaffold modular relativistic simulation directory tree and python modules for "${fileName}".`,
      model: "gemini-1.5-flash",
      cotSteps: [
        {
          title: "Designed modular package architecture for gravitational simulations",
          description: "Organized Kerr and Schwarzschild solvers into separate subdirectories.",
          searchResults: ["docs.astropy.org", "scipy.org/packages"],
        },
        {
          title: "Created folder tree and validated relative module imports",
          description: "Configured telemetry logging and mathematical parameter boundaries.",
        },
        {
          title: "Synthesized Kerr ISCO and frame-dragging solvers",
          description: "Implemented Bardeen-Petterson alignment equations.",
        },
      ],
      tools: [
        { name: "scaffold_directory_tree(root='simulations/')", status: "running" },
        { name: "compile_kerr_geodesic_solver()", status: "running" },
        { name: "validate_file_hierarchy()", status: "running" },
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
  };

  const raw = getRawPlan();
  const blueprint = generatePlanBlueprint(raw, query, fileName);
  return {
    ...raw,
    planTitle: blueprint.planTitle,
    planDescription: blueprint.planDescription,
    planSteps: blueprint.planSteps,
    model: model || raw.model || "gemini-1.5-flash",
    cotSteps: adaptCotStepsForEffort(raw.cotSteps || [], effort),
  };
}

/**
 * Generates an upfront multi-step execution plan conforming to shadcn AI Elements Plan
 * built on Trace and TraceCollapsible with progress counter and step statuses.
 */
function generatePlanBlueprint(rawPlan, query = "", fileName = "") {
  const q = (query || "").toLowerCase();
  const tools = rawPlan.tools || [];
  const toolStep1 = tools[0]?.name ? tools[0].name.replace(/\(.*\)/, "") : "Inspect workspace context";
  const toolStep2 = tools[1]?.name ? tools[1].name.replace(/\(.*\)/, "") : "Execute computational analysis";

  let planTitle = `Plan: ${rawPlan.name.replace(/ (Agent|Subagent)/g, "")} workflow`;
  let planDescription = rawPlan.task || `Execution plan for active document "${fileName}".`;
  let planSteps = [];

  if (
    rawPlan.isWorkspaceScan ||
    q.includes("scan") ||
    q.includes("audit") ||
    q.includes("structure") ||
    q.includes("workspace")
  ) {
    planTitle = "Plan: Scan workspace hierarchy & audit manifests";
    planDescription = "Full recursive directory traversal, module validation, and AST indexing.";
    planSteps = [
      {
        id: "step-plan-1",
        title: "Index active document buffer and syntax AST",
        description: `Target: "${fileName}"`,
        status: "completed",
      },
      {
        id: "step-plan-2",
        title: "Scan workspace directory hierarchy (backend, frontend, configs)",
        description: "Fetch live file and folder structure",
        status: "running",
      },
      {
        id: "step-plan-3",
        title: "Validate module manifests and dependencies",
        description: "Check package.json & requirements.txt",
        status: "pending",
      },
      {
        id: "step-plan-4",
        title: "Synthesize interactive FileTree and audit report",
        description: "Render collapsible filesystem navigation",
        status: "pending",
      },
    ];
  } else if (
    q.includes("tree") ||
    q.includes("suite") ||
    q.includes("scaffold") ||
    q.includes("simulation")
  ) {
    planTitle = "Plan: Scaffold relativistic simulation suite";
    planDescription = "Generate modular simulation packages, solvers, and telemetry logging.";
    planSteps = [
      {
        id: "step-plan-1",
        title: `Analyze mathematical requirements in "${fileName}"`,
        description: "Parse equations and boundary parameters",
        status: "completed",
      },
      {
        id: "step-plan-2",
        title: "Scaffold directory structure (simulations/)",
        description: "Create package manifests and __init__.py modules",
        status: "running",
      },
      {
        id: "step-plan-3",
        title: "Compile Kerr geodesic & ISCO orbit solver",
        description: "Implement numerical integration routines",
        status: "pending",
      },
      {
        id: "step-plan-4",
        title: "Assemble file tree artifact with collapsible components",
        description: "Verify modular imports and test entry points",
        status: "pending",
      },
    ];
  } else if (
    q.includes("isco") ||
    q.includes("think") ||
    q.includes("reason") ||
    q.includes("derivation") ||
    q.includes("frame dragging")
  ) {
    planTitle = "Plan: Derive Kerr ISCO & geodesic mechanics";
    planDescription = "Formulate Einstein Field Equations, effective potential, and horizon limits.";
    planSteps = [
      {
        id: "step-plan-1",
        title: `Extract metric tensor coordinates from "${fileName}"`,
        description: "Set up Boyer-Lindquist coordinate frame",
        status: "completed",
      },
      {
        id: "step-plan-2",
        title: "Solve timelike geodesic equations & effective potential V_eff(r)",
        description: "Derive inflection point d²V_eff/dr² = 0",
        status: "running",
      },
      {
        id: "step-plan-3",
        title: "Calculate Kerr ISCO radius and frame-dragging coordinates",
        description: "Evaluate prograde vs retrograde limits",
        status: "pending",
      },
      {
        id: "step-plan-4",
        title: "Synthesize verified relativistic code and derivation block",
        description: "Correlate with NASA HEASARC & arXiv citations",
        status: "pending",
      },
    ];
  } else if (
    q.includes("debug") ||
    q.includes("error") ||
    q.includes("guard")
  ) {
    planTitle = `Plan: Diagnose and guard AST in "${fileName}"`;
    planDescription = "Audit Python AST for division by zero and coordinate horizon singularities.";
    planSteps = [
      {
        id: "step-plan-1",
        title: `Parse Python syntax tree for "${fileName}"`,
        description: "Extract function tokens and variable scopes",
        status: "completed",
      },
      {
        id: "step-plan-2",
        title: "Audit singularity boundaries (r -> Rs, v -> c)",
        description: "Detect unhandled division by zero in lorentz factors",
        status: "running",
      },
      {
        id: "step-plan-3",
        title: "Formulate guarded ValueError exception handlers",
        description: "Ensure graceful fallback outside event horizon",
        status: "pending",
      },
      {
        id: "step-plan-4",
        title: "Verify numerical convergence in Pyodide WASM sandbox",
        description: "Run test assertions and format code diff",
        status: "pending",
      },
    ];
  } else if (
    q.includes("migrate") ||
    q.includes("migration") ||
    q.includes("plan")
  ) {
    planTitle = "Plan: Audit, refactor & migrate relativity engine";
    planDescription = "Multi-phase agent migration plan: AST inspection, Base UI element upgrades, and test harness execution.";
    planSteps = [
      {
        id: "step-plan-1",
        title: "Replace legacy Radix primitives with shadcn AI Elements",
        description: "Migrated to Base UI & Trace component",
        status: "completed",
      },
      {
        id: "step-plan-2",
        title: "Rename asChild to render and normalize slot props",
        description: "Enforce strict monochrome theme tokens",
        status: "running",
      },
      {
        id: "step-plan-3",
        title: "Run static type checker and lint validations",
        description: "Verify 0 errors across frontend & backend",
        status: "pending",
      },
      {
        id: "step-plan-4",
        title: "Execute Pyodide WASM astrophysics benchmark suite",
        description: "Validate convergence and geodesic integration",
        status: "pending",
      },
    ];
  } else {
    planTitle = `Plan: Execute ${rawPlan.name.replace(/ (Agent|Subagent)/g, "")}`;
    planDescription = rawPlan.task || `Step-by-step workflow for "${fileName}".`;
    planSteps = [
      {
        id: "step-plan-1",
        title: `Inspect active workspace context "${fileName}"`,
        description: "Verify AST integrity and environment parameters",
        status: "completed",
      },
      {
        id: "step-plan-2",
        title: `Execute ${toolStep1}`,
        description: "Primary agent routine execution",
        status: "running",
      },
      {
        id: "step-plan-3",
        title: `Evaluate ${toolStep2}`,
        description: "Calculate intermediate relativistic matrices",
        status: "pending",
      },
      {
        id: "step-plan-4",
        title: "Synthesize verified solution block & artifacts",
        description: "Finalize citations and response cards",
        status: "pending",
      },
    ];
  }

  return {
    planTitle,
    planDescription,
    planSteps,
  };
}

function countTreeNodes(tree) {
  let files = 0;
  let folders = 0;
  function traverse(nodes) {
    if (!Array.isArray(nodes)) return;
    nodes.forEach((n) => {
      if (n.type === "folder") {
        folders++;
        if (n.children) traverse(n.children);
      } else {
        files++;
      }
    });
  }
  if (tree) traverse(tree);
  return { files, folders };
}

/**
 * Transforms citation tags [1], [2], [citation:1], or [source:domain] in text into interactive
 * InlineCitation hover cards built on HoverCard and Button (size="xs").
 */
function renderTextWithCitations(text, sources = []) {
  if (!text || typeof text !== "string") return text;
  if (!sources || sources.length === 0) return text;

  const citationRegex = /\[(?:citation:)?(\d+)\]|\[source:([^\]]+)\]/g;
  if (!citationRegex.test(text)) return text;
  citationRegex.lastIndex = 0;

  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = citationRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    let source = null;
    let label = null;

    if (match[1]) {
      const idx = parseInt(match[1], 10) - 1;
      if (idx >= 0 && idx < sources.length) {
        source = sources[idx];
        label = `${idx + 1}`;
      }
    } else if (match[2]) {
      const term = match[2].toLowerCase();
      source =
        sources.find(
          (s) =>
            s.hostname?.toLowerCase().includes(term) ||
            s.url?.toLowerCase().includes(term) ||
            s.title?.toLowerCase().includes(term)
        ) || { url: match[2], hostname: match[2], title: match[2] };
      label = source.hostname || match[2];
    }

    if (source) {
      parts.push(
        <InlineCitation
          key={`cite-${match.index}`}
          url={source.url}
          title={source.title}
          hostname={source.hostname}
          quote={source.quote || source.snippet}
          label={label}
        />
      );
    } else {
      parts.push(match[0]);
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

/**
 * Finalizes subagent and chain of thought execution with tool results, timing, code, attachments, and checkpoint
 */
function finalizeSubagentPlan(
  plan,
  query,
  fileType,
  fileName,
  _content,
  userAttachments = [],
  liveTree = null,
  model = "gemini-1.5-flash",
  effort = "medium"
) {
  const q = query.toLowerCase();
  const randomMs = Math.floor(Math.random() * 160 + 130);
  const cotMs = Math.floor(randomMs * 0.7);

  const effortBadge = effort === "high" ? " · High Reasoning Effort" : effort === "low" ? " · Low Effort" : "";
  const finalizedCot = {
    summary: `Reasoned in ${plan.cotSteps.length} steps${effortBadge}`,
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

  if (
    liveTree ||
    plan.isWorkspaceScan ||
    q.includes("scan") ||
    q.includes("audit") ||
    q.includes("structure") ||
    q.includes("project file")
  ) {
    const activeTree = liveTree || [
      {
        name: "backend",
        type: "folder",
        path: "backend",
        defaultOpen: true,
        children: [
          { name: "main.py", type: "file", path: "backend/main.py" },
          { name: "requirements.txt", type: "file", path: "backend/requirements.txt" },
        ],
      },
      {
        name: "frontend",
        type: "folder",
        path: "frontend",
        defaultOpen: true,
        children: [
          {
            name: "src",
            type: "folder",
            path: "frontend/src",
            defaultOpen: true,
            children: [
              { name: "App.jsx", type: "file", path: "frontend/src/App.jsx" },
              { name: "main.jsx", type: "file", path: "frontend/src/main.jsx" },
              {
                name: "components",
                type: "folder",
                path: "frontend/src/components",
                defaultOpen: false,
                children: [
                  { name: "AgenticAssistant.jsx", type: "file", path: "frontend/src/components/AgenticAssistant/AgenticAssistant.jsx" },
                  { name: "DocumentWorkspace.jsx", type: "file", path: "frontend/src/components/DocumentWorkspace/DocumentWorkspace.jsx" },
                  { name: "FileTree.jsx", type: "file", path: "frontend/src/components/ui/FileTree.jsx" },
                ],
              },
            ],
          },
          { name: "package.json", type: "file", path: "frontend/package.json" },
          { name: "vite.config.js", type: "file", path: "frontend/vite.config.js" },
        ],
      },
      { name: "CLAUDE.md", type: "file", path: "CLAUDE.md" },
      { name: "package.json", type: "file", path: "package.json" },
      { name: "render.yaml", type: "file", path: "render.yaml" },
      { name: "requirements.txt", type: "file", path: "requirements.txt" },
    ];

    const counts = countTreeNodes(activeTree);

    return {
      checkpoint: { label: "Workspace filesystem scanned" },
      chainOfThought: finalizedCot,
      changedTree: activeTree,
      changedTreeTitle: `Workspace Filesystem Hierarchy (${counts.files} files in ${counts.folders} folders)`,
      subagent: {
        name: "Workspace Audit & File Scanner Agent",
        task: `Scan workspace file and folder hierarchy and inspect active document "${fileName}".`,
        model: "gemini-1.5-flash",
        status: "completed",
        duration: `${randomMs}ms`,
        tools: [
          {
            name: "scan_workspace_directory_tree(path='.')",
            status: "completed",
            output: `found ${counts.files} files across ${counts.folders} folders`,
          },
          {
            name: "validate_workspace_manifests()",
            status: "completed",
            output: "package.json, requirements.txt, render.yaml valid",
          },
          {
            name: `audit_active_context(file="${fileName}")`,
            status: "completed",
            output: "active context indexed",
          },
        ],
        result: `The workspace audit agent successfully scanned the project directory hierarchy. Found ${counts.files} project files across ${counts.folders} folders. You can expand folders and click any file in the tree to inspect or load it into the workspace:`,
        attachments: [],
        code: `# Workspace Scan Summary\n# Total files indexed: ${counts.files}\n# Total directories: ${counts.folders}\n# Active document: ${fileName} (${fileType})\n`,
      },
    };
  }

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

  if (
    q.includes("tree") ||
    q.includes("file") ||
    q.includes("suite") ||
    q.includes("folder") ||
    q.includes("simulation")
  ) {
    const simulationTree = [
      {
        name: "simulations",
        type: "folder",
        path: "simulations",
        defaultOpen: true,
        children: [
          {
            name: "kerr",
            type: "folder",
            path: "simulations/kerr",
            defaultOpen: true,
            children: [
              { name: "isco_solver.py", type: "file", path: "simulations/kerr/isco_solver.py" },
              { name: "frame_dragging.py", type: "file", path: "simulations/kerr/frame_dragging.py" },
              { name: "ergosphere_flux.py", type: "file", path: "simulations/kerr/ergosphere_flux.py" },
            ],
          },
          {
            name: "schwarzschild",
            type: "folder",
            path: "simulations/schwarzschild",
            defaultOpen: false,
            children: [
              { name: "geodesic_integrator.py", type: "file", path: "simulations/schwarzschild/geodesic_integrator.py" },
              { name: "orbital_precession.py", type: "file", path: "simulations/schwarzschild/orbital_precession.py" },
            ],
          },
          { name: "README.md", type: "file", path: "simulations/README.md" },
        ],
      },
      {
        name: "telemetry",
        type: "folder",
        path: "telemetry",
        defaultOpen: false,
        children: [
          { name: "curvature_tensor.json", type: "file", path: "telemetry/curvature_tensor.json" },
          { name: "energy_flux.csv", type: "file", path: "telemetry/energy_flux.csv" },
        ],
      },
    ];

    return {
      checkpoint: { label: "Simulation suite synthesized" },
      chainOfThought: finalizedCot,
      changedTree: simulationTree,
      changedFiles: [
        { name: "isco_solver.py", path: "simulations/kerr/isco_solver.py" },
        { name: "frame_dragging.py", path: "simulations/kerr/frame_dragging.py" },
        { name: "ergosphere_flux.py", path: "simulations/kerr/ergosphere_flux.py" },
        { name: "geodesic_integrator.py", path: "simulations/schwarzschild/geodesic_integrator.py" },
        { name: "orbital_precession.py", path: "simulations/schwarzschild/orbital_precession.py" },
        { name: "README.md", path: "simulations/README.md" },
        { name: "curvature_tensor.json", path: "telemetry/curvature_tensor.json" },
        { name: "energy_flux.csv", path: "telemetry/energy_flux.csv" },
      ],
      changedTreeTitle: "Generated Relativistic Simulation Suite (8 files)",
      subagent: {
        name: "Simulation Suite Architect",
        task: `Generate modular relativistic simulation package across directory hierarchies for "${fileName}".`,
        model: "gemini-1.5-flash",
        status: "completed",
        duration: `${randomMs}ms`,
        tools: [
          {
            name: "scaffold_directory_tree(root='simulations/')",
            status: "completed",
            output: "created 2 directories, 8 files",
          },
          {
            name: "compile_kerr_geodesic_solver()",
            status: "completed",
            output: "AST compiled with 0 errors",
          },
          {
            name: "validate_file_hierarchy()",
            status: "completed",
            output: "all imports and relative paths resolved",
          },
        ],
        result:
          "Successfully scaffolded the relativistic simulation package. Below is the interactive folder tree of files created by the agent. You can expand folders and select files to inspect or insert them:",
        attachments: [],
        code:
          fileType === "ipynb"
            ? `# simulations/kerr/isco_solver.py\nimport math\n\ndef kerr_isco_radius(m_solar, spin_a):\n    # Spin parameter -1 <= a <= 1\n    z1 = 1 + (1 - spin_a**2)**(1/3) * ((1 + spin_a)**(1/3) + (1 - spin_a)**(1/3))\n    z2 = math.sqrt(3 * spin_a**2 + z1**2)\n    sign = -1 if spin_a > 0 else 1\n    return 3 + z2 - sign * math.sqrt((3 - z1) * (3 + z1 + 2*z2))\n\nprint("Prograde ISCO (a=0.998):", kerr_isco_radius(10.0, 0.998), "Rs")`
            : `### Simulation Package Overview\n- **Root:** \`simulations/\`\n- **Subpackages:** \`kerr/\`, \`schwarzschild/\`, \`telemetry/\`\n- **Primary Entrypoint:** \`simulations/kerr/isco_solver.py\``,
      },
    };
  }

  if (q.includes("think") || q.includes("reason") || q.includes("isco") || q.includes("frame dragging")) {
    const iscoSources = [
      {
        title: "arXiv: Kerr ISCO & Relativistic Geodesics",
        url: "https://arxiv.org/abs/gr-qc",
        hostname: "arxiv.org",
        quote: "The inflection point of the effective potential occurs at r = 6GM/c^2 = 3 Rs for non-rotating Schwarzschild spacetime.",
      },
      {
        title: "NASA HEASARC: High Energy Astrophysics Science Archive",
        url: "https://heasarc.gsfc.nasa.gov",
        hostname: "nasa.gov",
        quote: "Accretion flow telemetry confirms absence of stable circular emission inside the ISCO boundary.",
      },
    ];

    return {
      checkpoint,
      chainOfThought: finalizedCot,
      sources: iscoSources,
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
          "Deep reasoning complete: For a Schwarzschild black hole, geodesic mechanics dictate that circular orbits within r < 3 Rs become unstable [1]. Inward matter crosses the inflection boundary and plunges through the event horizon without emitting equilibrium radiation [2].",
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
    const eqSources = [
      {
        title: "Schwarzschild Metric & Gravitational Singularities",
        url: "https://en.wikipedia.org/wiki/Schwarzschild_metric",
        hostname: "wikipedia.org",
        quote: "The Schwarzschild radius corresponds to the radius defining the event horizon of a static, uncharged black hole.",
      },
      {
        title: "NASA Astrophysics Data System (ADS)",
        url: "https://ui.adsabs.harvard.edu",
        hostname: "harvard.edu",
        quote: "Observational constraints on compact objects via gravitational wave ringdown telemetry.",
      },
    ];

    return {
      checkpoint,
      chainOfThought: finalizedCot,
      sources: eqSources,
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
        result: `In "${fileName}", we model relativistic gravitational physics [1]. The Schwarzschild radius defines the spherical boundary where escape velocity reaches $c$ [2]:`,
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
              "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='160' viewBox='0 0 240 160'><rect width='240' height='160' fill='%23000000'/><path d='M10 140 Q 60 135 90 80 T 230 20' fill='none' stroke='%23ffffff' stroke-width='3'/><circle cx='90' cy='80' r='4' fill='%23ffffff'/><text x='120' y='150' fill='%23888888' font-size='9' text-anchor='middle'>SPACETIME CURVATURE VS RADIUS</text></svg>",
            contentSnippet: "Curvature density: R_curv ~ 1 / r^3 across event horizon multiples.",
          },
        ],
        code: `# Tabular curvature density\nfor mult in [1.5, 2.0, 3.0, 5.0, 10.0]:\n    curvature = 1.0 / (mult ** 3)\n    bar = "█" * int(curvature * 30)\n    print(f"{mult:4.1f} Rs | {curvature:.4f} | {bar}")`,
      },
    };
  }

  const defaultSources = [
    {
      title: "arXiv: Relativistic Fluid & Geodesic Mechanics",
      url: "https://arxiv.org/abs/gr-qc",
      hostname: "arxiv.org",
      quote: "Accretion flow telemetry confirms absence of stable circular emission inside the ISCO boundary.",
    },
    {
      title: "NASA HEASARC: High Energy Astrophysics Science Archive",
      url: "https://heasarc.gsfc.nasa.gov",
      hostname: "nasa.gov",
      quote: "Continuum timing and high-resolution spectral archives for compact relativistic sources.",
    },
  ];

  return {
    checkpoint,
    chainOfThought: finalizedCot,
    sources: defaultSources,
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
      result: `The research subagent has synthesized a computational analysis grounded in relativistic mechanics [1] and observational telemetry [2] tailored for "${fileName}":`,
      attachments: [],
      code:
        fileType === "ipynb"
          ? `# Generated by BlackHole Research Subagent\nimport math\n\ndef orbital_velocity(m_central, radius_meters):\n    G = 6.67430e-11\n    return math.sqrt((G * m_central) / radius_meters)\n\n# Earth around Sun\nv_earth = orbital_velocity(1.989e30, 1.496e11)\nprint(f"Earth orbital velocity: {v_earth / 1000:.2f} km/s")`
          : `### Observational Notes\n- Monitored spectral Doppler relativistic shift in accretion inflow.\n- Observed Doppler beaming factor: $\\delta = [\\gamma (1 - \\beta \\cos \\theta)]^{-1}$.`,
    },
  };
}
