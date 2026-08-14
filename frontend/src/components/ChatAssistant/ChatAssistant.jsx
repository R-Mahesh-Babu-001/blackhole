import {
  useEffect,
  useRef,
  useState,
} from "react";

import "./ChatAssistant.css";


function ChatAssistant({
  open,
  onClose,
}) {
  const [message, setMessage] = useState("");

  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "assistant",
      text: "What are we working on?",
    },
  ]);

  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);


  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [open]);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);


  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape" && open) {
        onClose();
      }
    };

    window.addEventListener(
      "keydown",
      handleEscape,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleEscape,
      );
    };
  }, [open, onClose]);


  const handleSubmit = (event) => {
    event.preventDefault();

    const cleanMessage = message.trim();

    if (!cleanMessage) {
      return;
    }

    setMessages((current) => [
      ...current,
      {
        id: Date.now(),
        role: "user",
        text: cleanMessage,
      },
    ]);

    setMessage("");
  };


  return (
    <aside
      className={
        open
          ? "chat-assistant chat-assistant-open"
          : "chat-assistant"
      }
      aria-hidden={!open}
    >

      <div className="chat-assistant-header">

        <div className="chat-assistant-title-group">
          <span className="assistant-status-dot" />

          <div>
            <h2>BlackHole Assistant</h2>
            <span>Workspace Assistant</span>
          </div>
        </div>


        <button
          className="assistant-close"
          onClick={onClose}
          aria-label="Close assistant"
          title="Close Assistant"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              d="M6 6L18 18M18 6L6 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>

      </div>


      <div className="chat-assistant-body">

        <div className="assistant-intro">

          <div className="assistant-orbit">
            <div className="assistant-core" />
          </div>

          <h3>BlackHole</h3>

          <p>
            Ask about your files, conversions,
            notes or current workspace.
          </p>

        </div>


        <div className="assistant-messages">

          {messages.map((item) => (
            <div
              key={item.id}
              className={
                item.role === "user"
                  ? "assistant-message user-message"
                  : "assistant-message ai-message"
              }
            >
              {item.text}
            </div>
          ))}

          <div ref={messagesEndRef} />

        </div>

      </div>


      <div className="chat-assistant-footer">

        <form
          className="assistant-input-container"
          onSubmit={handleSubmit}
        >

          <textarea
            ref={inputRef}
            value={message}
            onChange={(event) =>
              setMessage(event.target.value)
            }
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey
              ) {
                event.preventDefault();
                handleSubmit(event);
              }
            }}
            placeholder="Ask BlackHole..."
            rows="1"
          />


          <button
            type="submit"
            className="assistant-send"
            disabled={!message.trim()}
            aria-label="Send message"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                d="M5 12H19M13 6L19 12L13 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

        </form>


        <span className="assistant-hint">
          Enter to send · Shift + Enter for new line
        </span>

      </div>

    </aside>
  );
}


export default ChatAssistant;