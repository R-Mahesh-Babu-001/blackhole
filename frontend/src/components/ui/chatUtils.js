/**
 * Converts conversation messages into formatted markdown text
 * for export and downloading
 */
export function messagesToMarkdown(messages = []) {
  if (!messages || !messages.length) return "# Conversation Log\n\nNo messages.";

  const lines = ["# Conversation Log\n"];

  messages.forEach((msg, idx) => {
    const roleLabel = msg.role === "user" ? "### User" : "### Assistant";
    lines.push(`\n${roleLabel} (Turn ${idx + 1})\n`);

    if (msg.text) {
      lines.push(msg.text);
    }

    if (msg.attachments && msg.attachments.length) {
      lines.push("\n**Attachments:**");
      msg.attachments.forEach((att) => {
        lines.push(`- ${att.name} (${att.description || att.sizeStr || "file"})`);
      });
    }

    if (msg.subagent) {
      lines.push(`\n**Subagent: ${msg.subagent.name}** (${msg.subagent.model})`);
      if (msg.subagent.task) lines.push(`*Task:* ${msg.subagent.task}`);
      if (msg.subagent.result) lines.push(`*Result:* ${msg.subagent.result}`);
      if (msg.subagent.code) {
        lines.push("\n```python\n" + msg.subagent.code + "\n```");
      }
    }

    if (msg.confirmation) {
      lines.push(`\n**Tool Execution: \`${msg.confirmation.command}\`**`);
      lines.push(`- Status: ${msg.confirmation.state}`);
      if (msg.confirmation.output) {
        lines.push("```\n" + msg.confirmation.output + "\n```");
      }
    }

    if (msg.metadata?.usage) {
      const u = msg.metadata.usage;
      lines.push(`\n*Token Usage: ${u.inputTokens || 0} in / ${u.outputTokens || 0} out*`);
    }

    lines.push("\n---");
  });

  return lines.join("\n");
}
