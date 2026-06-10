import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bot,
  FileText,
  Image as ImageIcon,
  Menu,
  MessageSquare,
  Paperclip,
  Plus,
  Send,
  Sparkles,
  Trash2,
  User,
  X,
} from "lucide-react";
import { deleteConversation, sendChatMessage } from "./api";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
}

interface Attachment {
  id: string;
  name: string;
  type: "file" | "image";
  preview?: string;
}

function createId() {
  return Math.random().toString(36).slice(2, 10);
}

function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-secondary-foreground border border-border"
        }`}
      >
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>
      <div
        className={`flex flex-col gap-1 max-w-[75%] ${
          isUser ? "items-end" : "items-start"
        }`}
      >
        <div
          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-sm"
              : "bg-card text-card-foreground border border-border rounded-tl-sm"
          }`}
        >
          <p style={{ whiteSpace: "pre-wrap" }}>{message.content}</p>
        </div>
        <span className="text-xs text-muted-foreground px-1">
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3 flex-row">
      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-secondary text-secondary-foreground border border-border">
        <Bot size={16} />
      </div>
      <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-card border border-border flex items-center gap-1">
        <span
          className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
          style={{ animationDelay: "0ms" }}
        />
        <span
          className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
          style={{ animationDelay: "150ms" }}
        />
        <span
          className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
          style={{ animationDelay: "300ms" }}
        />
      </div>
    </div>
  );
}

function ChatSidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  isOpen,
  onClose,
}: {
  conversations: Array<{
    id: string;
    title: string;
    lastMessage: string;
    timestamp: Date;
  }>;
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`
          fixed lg:relative inset-y-0 left-0 z-30 lg:z-auto
          flex flex-col w-72 h-full
          bg-sidebar border-r border-sidebar-border
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <MessageSquare size={14} className="text-primary-foreground" />
            </div>
            <span className="text-sm font-medium text-sidebar-foreground">
              Conversations
            </span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-3 py-3">
          <button
            onClick={onNew}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
          >
            <Plus size={16} />
            New conversation
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
          {conversations.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8 px-4">
              No conversations yet. Start a new one!
            </p>
          )}
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`group flex items-start gap-2 w-full px-3 py-2.5 rounded-lg text-left cursor-pointer transition-colors ${
                activeId === conversation.id
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/60"
              }`}
              onClick={() => {
                onSelect(conversation.id);
                onClose();
              }}
            >
              <MessageSquare
                size={15}
                className="mt-0.5 flex-shrink-0 opacity-60"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {conversation.title}
                </p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {conversation.lastMessage}
                </p>
              </div>
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete(conversation.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-destructive transition-all flex-shrink-0"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [error, setError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const attachMenuRef = useRef<HTMLDivElement>(null);

  const activeConversation =
    conversations.find((conversation) => conversation.id === activeId) ?? null;
  const messages = activeConversation?.messages ?? [];

  const sidebarItems = conversations.map((conversation) => {
    const lastMessage =
      conversation.messages[conversation.messages.length - 1];
    return {
      id: conversation.id,
      title: conversation.title,
      lastMessage: lastMessage?.content.slice(0, 60) ?? "",
      timestamp: lastMessage?.timestamp ?? new Date(),
    };
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (!attachMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        attachMenuRef.current &&
        !attachMenuRef.current.contains(event.target as Node)
      ) {
        setAttachMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [attachMenuOpen]);

  const handleNewConversation = useCallback(() => {
    const id = createId();
    const conversation: Conversation = {
      id,
      title: "New conversation",
      messages: [],
    };
    setConversations((current) => [conversation, ...current]);
    setActiveId(id);
    setInput("");
    setError(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const handleDeleteConversation = useCallback(
    async (id: string) => {
      setConversations((current) =>
        current.filter((conversation) => conversation.id !== id),
      );
      if (activeId === id) {
        setActiveId(null);
      }
      try {
        await deleteConversation(id);
      } catch {
        // Local UI state is already updated.
      }
    },
    [activeId],
  );

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;

    let conversationId = activeId;
    if (!conversationId) {
      conversationId = createId();
      const title =
        trimmed.length > 40 ? `${trimmed.slice(0, 40)}...` : trimmed;
      setConversations((current) => [
        { id: conversationId!, title, messages: [] },
        ...current,
      ]);
      setActiveId(conversationId);
    }

    const userMessage: Message = {
      id: createId(),
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    setConversations((current) =>
      current.map((conversation) => {
        if (conversation.id !== conversationId) return conversation;
        const updated = {
          ...conversation,
          messages: [...conversation.messages, userMessage],
        };
        if (conversation.messages.length === 0) {
          updated.title =
            trimmed.length > 40 ? `${trimmed.slice(0, 40)}...` : trimmed;
        }
        return updated;
      }),
    );

    setInput("");
    setAttachments([]);
    setIsTyping(true);
    setError(null);

    try {
      const responseText = await sendChatMessage(conversationId, trimmed);
      const assistantMessage: Message = {
        id: createId(),
        role: "assistant",
        content: responseText,
        timestamp: new Date(),
      };

      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                messages: [...conversation.messages, assistantMessage],
              }
            : conversation,
        ),
      );
    } catch (sendError) {
      const message =
        sendError instanceof Error
          ? sendError.message
          : "Something went wrong.";
      setError(message);
    } finally {
      setIsTyping(false);
    }
  }, [activeId, input, isTyping]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
    event.target.style.height = "auto";
    event.target.style.height = `${Math.min(event.target.scrollHeight, 160)}px`;
  };

  const handleAttachmentChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: "file" | "image",
  ) => {
    Array.from(event.target.files ?? []).forEach((file) => {
      const id = createId();
      if (type === "image" && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (loadEvent) => {
          setAttachments((current) => [
            ...current,
            {
              id,
              name: file.name,
              type: "image",
              preview: loadEvent.target?.result as string,
            },
          ]);
        };
        reader.readAsDataURL(file);
      } else {
        setAttachments((current) => [
          ...current,
          { id, name: file.name, type: "file" },
        ]);
      }
    });
    event.target.value = "";
    setAttachMenuOpen(false);
  };

  const suggestions = [
    "Explain a complex concept simply",
    "Help me brainstorm ideas",
    "Write a short story",
    "Review my code",
  ];

  return (
    <div className="flex h-full bg-background overflow-hidden">
      <ChatSidebar
        conversations={sidebarItems}
        activeId={activeId}
        onSelect={setActiveId}
        onNew={handleNewConversation}
        onDelete={(id) => void handleDeleteConversation(id)}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/50 backdrop-blur-sm flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles size={16} className="text-primary flex-shrink-0" />
            <h1 className="text-sm font-medium truncate">
              {activeConversation?.title ?? "AI Assistant"}
            </h1>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {messages.length === 0 && !isTyping ? (
            <div className="h-full flex flex-col items-center justify-center px-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles size={28} className="text-primary" />
              </div>
              <h2 className="text-foreground mb-2">
                How can I help you today?
              </h2>
              <p className="text-sm text-muted-foreground max-w-sm">
                Start a conversation by typing a message below. I&apos;m here
                to assist with questions, ideas, writing, and more.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-6 w-full max-w-md">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setInput(suggestion);
                      inputRef.current?.focus();
                    }}
                    className="text-left px-4 py-3 rounded-xl border border-border bg-card text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-accent transition-all"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="px-4 py-6 space-y-5 max-w-3xl mx-auto w-full">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isTyping && <TypingIndicator />}
              <div ref={bottomRef} />
            </div>
          )}
        </main>

        <footer className="flex-shrink-0 border-t border-border bg-card/50 backdrop-blur-sm px-4 py-3">
          <div className="max-w-3xl mx-auto">
            {error && (
              <p className="text-xs text-destructive text-center mb-2">
                {error}
              </p>
            )}

            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2 px-1">
                {attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="relative flex items-center gap-1.5 bg-card border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground max-w-[180px]"
                  >
                    {attachment.type === "image" && attachment.preview ? (
                      <img
                        src={attachment.preview}
                        alt={attachment.name}
                        className="w-6 h-6 rounded object-cover flex-shrink-0"
                      />
                    ) : (
                      <FileText
                        size={14}
                        className="text-muted-foreground flex-shrink-0"
                      />
                    )}
                    <span className="truncate">{attachment.name}</span>
                    <button
                      onClick={() =>
                        setAttachments((current) =>
                          current.filter((item) => item.id !== attachment.id),
                        )
                      }
                      className="flex-shrink-0 ml-0.5 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-end gap-2">
              <div className="relative flex-shrink-0 mb-0.5" ref={attachMenuRef}>
                <button
                  onClick={() => setAttachMenuOpen((open) => !open)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${
                    attachMenuOpen
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-input-background text-muted-foreground border-border hover:text-foreground hover:border-primary/40 hover:bg-accent"
                  }`}
                >
                  <Plus
                    size={18}
                    className={`transition-transform duration-200 ${
                      attachMenuOpen ? "rotate-45" : ""
                    }`}
                  />
                </button>
                {attachMenuOpen && (
                  <div className="absolute bottom-11 left-0 bg-card border border-border rounded-xl shadow-lg py-1.5 w-48 z-50 overflow-hidden">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors"
                    >
                      <Paperclip size={15} className="text-muted-foreground" />
                      Attach file
                    </button>
                    <button
                      onClick={() => imageInputRef.current?.click()}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors"
                    >
                      <ImageIcon size={15} className="text-muted-foreground" />
                      Photo / Camera
                    </button>
                  </div>
                )}
              </div>

              <div className="flex-1 flex items-end gap-2 bg-input-background rounded-2xl border border-border px-4 py-2 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Message AI Assistant..."
                  rows={1}
                  disabled={isTyping}
                  className="flex-1 bg-transparent resize-none outline-none text-sm text-foreground placeholder:text-muted-foreground py-1.5 min-h-[36px] max-h-[160px] leading-relaxed disabled:opacity-50"
                  style={{ height: "36px" }}
                />
                <button
                  onClick={() => void handleSend()}
                  disabled={(!input.trim() && attachments.length === 0) || isTyping}
                  className="flex-shrink-0 w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all mb-0.5"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center mt-2">
              Powered by Grok AI
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(event) => handleAttachmentChange(event, "file")}
          />
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            className="hidden"
            onChange={(event) => handleAttachmentChange(event, "image")}
          />
        </footer>
      </div>
    </div>
  );
}
