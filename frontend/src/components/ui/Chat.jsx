import {
  MessageScrollerProvider,
  MessageScroller,
  MessageScrollerViewport,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerButton,
} from "./MessageScroller";
import {
  Message,
  MessageRoot,
  MessageContent,
  MessageBody,
  Bubble,
  BubbleContent,
  MessageFooter,
  MessageActions,
  MessageAction,
  MessageCopyAction,
  MessageGoodAction,
  MessageBadAction,
  MessageRetryAction,
  MessageEditAction,
  MessageToolbar,
  MessageResponse,
} from "./Message";
import { messagesToMarkdown } from "./chatUtils";
import {
  Plan,
  PlanHeader,
  PlanTitle,
  PlanDescription,
  PlanContent,
  PlanTrigger,
  PlanAction,
  PlanFooter,
  PlanStep,
  PlanIcon,
  TraceIcon,
  PlanRouteIcon,
  PlanCircleCheckIcon,
  PlanCircleDotIcon,
  PlanCircleIcon,
} from "./Plan";
import "./Chat.css";

/**
 * Chat component conforming to shadcn AI Elements Chat specification
 * Provides the conversation thread with Message Scroller anchoring
 */
export function Chat({
  autoScroll = true,
  className = "",
  children,
  ...props
}) {
  return (
    <MessageScrollerProvider autoScroll={autoScroll}>
      <MessageScroller className={`ui-chat ${className}`} {...props}>
        {children}
      </MessageScroller>
    </MessageScrollerProvider>
  );
}

/**
 * Conversation (AI SDK Elements Migration Interface)
 * Renders MessageScrollerProvider with autoScroll and MessageScroller
 */
export function Conversation({
  autoScroll = true,
  className = "",
  children,
  ...props
}) {
  return (
    <MessageScrollerProvider autoScroll={autoScroll}>
      <MessageScroller className={`ui-conversation ${className}`} {...props}>
        {children}
      </MessageScroller>
    </MessageScrollerProvider>
  );
}

/**
 * ConversationContent
 * Renders MessageScrollerViewport and MessageScrollerContent
 */
export function ConversationContent({
  viewportClassName = "",
  contentClassName = "",
  className = "",
  children,
  ...props
}) {
  return (
    <MessageScrollerViewport className={`conversation-viewport ${viewportClassName} ${className}`} {...props}>
      <MessageScrollerContent className={`conversation-content ${contentClassName}`}>
        {children}
      </MessageScrollerContent>
    </MessageScrollerViewport>
  );
}

/**
 * ConversationScrollButton
 * Renders MessageScrollerButton
 */
export function ConversationScrollButton({ className = "", ...props }) {
  return <MessageScrollerButton className={`conversation-scroll-btn ${className}`} {...props} />;
}

/**
 * ConversationEmptyState
 */
export function ConversationEmptyState({ className = "", children, ...props }) {
  return (
    <div className={`conversation-empty-state ${className}`} {...props}>
      {children}
    </div>
  );
}

/**
 * ConversationDownload
 * Button to download the current conversation thread as markdown
 */
export function ConversationDownload({
  messages = [],
  filename = "conversation.md",
  className = "",
  children,
  ...props
}) {
  const handleDownload = () => {
    const md = messagesToMarkdown(messages);
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      type="button"
      className={`conversation-download-btn ${className}`}
      onClick={handleDownload}
      title="Download conversation log"
      aria-label="Download conversation log"
      {...props}
    >
      {children || (
        <>
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
          <span>Export Markdown</span>
        </>
      )}
    </button>
  );
}

export {
  MessageScrollerProvider,
  MessageScroller,
  MessageScrollerViewport,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerButton,
  Message,
  MessageRoot,
  MessageContent,
  MessageBody,
  Bubble,
  BubbleContent,
  MessageFooter,
  MessageActions,
  MessageAction,
  MessageCopyAction,
  MessageGoodAction,
  MessageBadAction,
  MessageRetryAction,
  MessageEditAction,
  MessageToolbar,
  MessageResponse,
  Plan,
  PlanHeader,
  PlanTitle,
  PlanDescription,
  PlanContent,
  PlanTrigger,
  PlanAction,
  PlanFooter,
  PlanStep,
  PlanIcon,
  TraceIcon,
  PlanRouteIcon,
  PlanCircleCheckIcon,
  PlanCircleDotIcon,
  PlanCircleIcon,
};
