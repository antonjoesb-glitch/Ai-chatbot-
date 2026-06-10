export type ChatRole = "user" | "assistant" | "system";

export interface ApiMessage {
  role: ChatRole;
  content: string;
}

export async function sendChatMessage(
  conversationId: string,
  message: string,
): Promise<string> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conversation_id: conversationId, message }),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || "Failed to send message.");
  }

  return data.response as string;
}

export async function deleteConversation(conversationId: string): Promise<void> {
  await fetch(`/api/conversation/${conversationId}`, { method: "DELETE" });
}
