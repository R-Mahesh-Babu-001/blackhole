import { createContext, useContext } from "react";

export const PromptInputContext = createContext({
  status: "idle", // "idle" | "streaming" | "submitting" | "error"
  canSend: false,
  formRef: null,
  text: "",
  setText: () => {},
  attachments: [],
  onRemoveAttachment: () => {},
  onClearAttachments: () => {},
  openFilePicker: () => {},
});

export function usePromptInput() {
  return useContext(PromptInputContext);
}
