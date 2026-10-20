import { createContext, useContext } from "react";

export const MessageContext = createContext({
  from: "assistant",
  role: "assistant",
  align: "start",
});

export function useMessage() {
  return useContext(MessageContext);
}
