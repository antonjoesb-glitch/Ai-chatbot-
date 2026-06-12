export type ChatRole = "user" | "assistant" | "system";

export interface ChatAttachment {
  type: "image" | "file";
  name: string;
  data?: string;
  content?: string;
}

export async function sendChatMessage(
  conversationId: string,
  message: string,
  attachments: ChatAttachment[] = [],
): Promise<{ response: string; title?: string }> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      conversation_id: conversationId,
      message,
      attachments,
    }),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || "Failed to send message.");
  }

  return { response: data.response as string, title: data.title as string | undefined };
}

export async function deleteConversation(conversationId: string): Promise<void> {
  await fetch(`/api/conversation/${conversationId}`, { method: "DELETE" });
}
