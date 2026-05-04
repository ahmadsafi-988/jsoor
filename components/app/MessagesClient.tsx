"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Search, Send, Paperclip, MessageSquare, X, Download } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  getMessages,
  sendMessage,
  markConversationRead,
  type ConversationSummary,
  type MessageRow,
} from "@/lib/messages/actions";

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function Avatar({
  name,
  url,
  size = 10,
}: {
  name: string;
  url: string | null;
  size?: number;
}) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const cls = `w-${size} h-${size} rounded-full bg-[#e5e2e1] flex items-center justify-center font-headline font-bold text-[#1c1b1b] overflow-hidden shrink-0`;
  return (
    <div className={cls}>
      {url ? (
        <img src={url} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span className={size <= 8 ? "text-xs" : "text-sm"}>{initials}</span>
      )}
    </div>
  );
}

export default function MessagesClient({
  conversations: initialConversations,
  initialConvId,
}: {
  conversations: ConversationSummary[];
  initialConvId?: string;
}) {
  const supabase = createClient();
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [conversations, setConversations] = useState(initialConversations);
  const [activeConvId, setActiveConvId] = useState<string | null>(
    initialConvId ?? initialConversations[0]?.id ?? null
  );
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [input, setInput] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get current user ID
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, []);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeConvId) return;
    setLoadingMsgs(true);
    getMessages(activeConvId).then((result) => {
      if ("messages" in result) setMessages(result.messages);
      setLoadingMsgs(false);
    });
    markConversationRead(activeConvId).then(() => {
      setConversations((prev) =>
        prev.map((c) => (c.id === activeConvId ? { ...c, unread_count: 0 } : c))
      );
    });
  }, [activeConvId]);

  // Realtime subscription
  useEffect(() => {
    if (!activeConvId) return;
    const channel = supabase
      .channel(`messages-${activeConvId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${activeConvId}`,
        },
        (payload) => {
          const newMsg = payload.new as MessageRow;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          setConversations((prev) =>
            prev.map((c) =>
              c.id === activeConvId
                ? {
                    ...c,
                    last_message: newMsg.content || `📎 ${newMsg.attachment_name ?? "attachment"}`,
                    last_message_at: newMsg.created_at,
                  }
                : c
            )
          );
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeConvId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text && !attachment) return;
    if (!activeConvId) return;
    setSending(true);

    let attachmentUrl: string | undefined;
    let attachmentName: string | undefined;

    if (attachment) {
      const path = `${activeConvId}/${Date.now()}_${attachment.name}`;
      const { error } = await supabase.storage
        .from("message-attachments")
        .upload(path, attachment);
      if (!error) {
        attachmentUrl = path;
        attachmentName = attachment.name;
      }
      setAttachment(null);
    }

    const result = await sendMessage(activeConvId, text, attachmentUrl, attachmentName);
    if ("message" in result) {
      setMessages((prev) =>
        prev.some((m) => m.id === result.message.id) ? prev : [...prev, result.message]
      );
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConvId
            ? {
                ...c,
                last_message: text || `📎 ${attachmentName ?? "attachment"}`,
                last_message_at: result.message.created_at,
              }
            : c
        )
      );
    }

    setInput("");
    setSending(false);
  };

  const handleAttachmentDownload = async (attachmentUrl: string, attachmentName: string) => {
    const { data } = await supabase.storage
      .from("message-attachments")
      .createSignedUrl(attachmentUrl, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  const activeConv = conversations.find((c) => c.id === activeConvId);
  const filteredConvs = conversations.filter(
    (c) =>
      c.other_name.toLowerCase().includes(search.toLowerCase()) ||
      c.job_title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 64px)" }}>
      {/* ── Left panel: conversation list ── */}
      <div className="w-80 bg-[#fcf9f8] border-r border-[#f0edec] flex flex-col shrink-0">
        <div className="p-6 pb-4">
          <h1 className="font-headline text-3xl font-bold text-[#1c1b1b] tracking-tight mb-4">
            Messages
          </h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3d4a41]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-[#f6f3f2] border-b-2 border-transparent focus:border-[#006d43] pl-10 pr-4 py-3 rounded-lg text-sm text-[#1c1b1b] placeholder-[#3d4a41] focus:outline-none transition-all"
            />
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-4 pb-4 space-y-2">
          {filteredConvs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-3 px-4">
              <MessageSquare className="w-8 h-8 text-[#3d4a41]/40" />
              <p className="text-sm text-[#3d4a41]">
                {conversations.length === 0
                  ? "No conversations yet."
                  : "No results found."}
              </p>
            </div>
          )}
          {filteredConvs.map((conv) => (
            <div
              key={conv.id}
              onClick={() => setActiveConvId(conv.id)}
              className={`p-4 rounded-xl cursor-pointer transition-colors border-l-4 ${
                conv.id === activeConvId
                  ? "bg-[#e5e2e1] border-[#006d43]"
                  : "bg-[#fcf9f8] border-transparent hover:bg-[#f6f3f2]"
              }`}
            >
              <div className="flex items-center gap-3">
                <Avatar name={conv.other_name} url={conv.other_avatar} size={12} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h3 className="font-semibold text-[#1c1b1b] truncate text-sm">
                      {conv.other_name}
                    </h3>
                    <span
                      className={`text-xs shrink-0 ml-2 ${
                        conv.unread_count > 0 ? "text-[#006d43] font-medium" : "text-[#3d4a41]"
                      }`}
                    >
                      {formatTime(conv.last_message_at)}
                    </span>
                  </div>
                  <p className="text-xs text-[#3d4a41] truncate mb-0.5">{conv.job_title}</p>
                  <p
                    className={`text-sm truncate ${
                      conv.unread_count > 0
                        ? "font-medium text-[#1c1b1b]"
                        : "text-[#3d4a41]"
                    }`}
                  >
                    {conv.last_message || <span className="italic opacity-60">No messages yet</span>}
                  </p>
                </div>
                {conv.unread_count > 0 && (
                  <span className="min-w-[20px] h-5 px-1.5 bg-[#006d43] text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">
                    {conv.unread_count}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel: chat ── */}
      {!activeConvId || !activeConv ? (
        <div className="flex-1 flex items-center justify-center bg-[#fcf9f8]">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-[#f0edec] flex items-center justify-center">
              <MessageSquare className="w-7 h-7 text-[#3d4a41]" />
            </div>
            <p className="text-[#3d4a41] font-medium">Select a conversation</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 bg-[#fcf9f8] flex flex-col overflow-hidden">
          {/* Chat header */}
          <div className="h-20 bg-[#f6f3f2] border-b border-[#f0edec] flex items-center px-8 shrink-0 gap-4">
            <Avatar name={activeConv.other_name} url={activeConv.other_avatar} size={10} />
            <div>
              <h2 className="font-headline font-bold text-lg text-[#1c1b1b] leading-tight">
                {activeConv.other_name}
              </h2>
              <p className="text-sm text-[#3d4a41]">{activeConv.job_title}</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-4">
            {loadingMsgs ? (
              <div className="flex items-center justify-center flex-1">
                <div className="w-6 h-6 border-2 border-[#006d43] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center">
                <p className="text-sm text-[#3d4a41]">No messages yet. Say hello!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender_id === currentUserId;
                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-3 ${isMe ? "justify-end" : "justify-start"} max-w-[78%] ${isMe ? "ml-auto" : ""}`}
                  >
                    {!isMe && (
                      <Avatar name={activeConv.other_name} url={activeConv.other_avatar} size={8} />
                    )}
                    <div className={`flex flex-col gap-1 ${isMe ? "items-end" : "items-start"}`}>
                      {(msg.content || msg.attachment_url) && (
                        <div
                          className={`p-4 rounded-2xl shadow-sm ${
                            isMe
                              ? "bg-gradient-to-br from-[#006d43] to-[#00a86b] text-white rounded-tr-sm shadow-[0_8px_20px_rgba(0,109,67,0.15)]"
                              : "bg-[#ebe7e7] text-[#1c1b1b] rounded-tl-sm"
                          }`}
                        >
                          {msg.content && (
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                              {msg.content}
                            </p>
                          )}
                          {msg.attachment_url && msg.attachment_name && (
                            <button
                              onClick={() =>
                                handleAttachmentDownload(msg.attachment_url!, msg.attachment_name!)
                              }
                              className={`flex items-center gap-2 mt-2 text-xs font-medium underline underline-offset-2 ${
                                isMe ? "text-white/80 hover:text-white" : "text-[#006d43] hover:text-[#00a86b]"
                              }`}
                            >
                              <Download className="w-3.5 h-3.5 shrink-0" />
                              {msg.attachment_name}
                            </button>
                          )}
                        </div>
                      )}
                      <span className="text-xs text-[#3d4a41]">{formatTime(msg.created_at)}</span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Attachment preview */}
          {attachment && (
            <div className="px-6 pt-2">
              <div className="flex items-center gap-2 bg-[#f0edec] rounded-lg px-4 py-2 text-sm text-[#3d4a41] max-w-sm">
                <Paperclip className="w-4 h-4 shrink-0 text-[#006d43]" />
                <span className="truncate">{attachment.name}</span>
                <button
                  onClick={() => setAttachment(null)}
                  className="ml-auto shrink-0 text-[#3d4a41] hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-6 bg-[#f6f3f2] border-t border-[#f0edec] shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => setAttachment(e.target.files?.[0] ?? null)}
            />
            <div className="flex items-end gap-3 bg-white rounded-xl p-2 shadow-sm border border-[#f0edec]">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 text-[#3d4a41] hover:text-[#006d43] hover:bg-[#f6f3f2] rounded-full transition-colors"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              <textarea
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Type your message..."
                className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-3 text-sm text-[#1c1b1b] placeholder-[#3d4a41] min-h-[44px] max-h-32 outline-none"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={sending || (!input.trim() && !attachment)}
                className="p-3 bg-gradient-to-br from-[#006d43] to-[#00a86b] text-white rounded-xl shadow-[0_8px_16px_rgba(0,109,67,0.15)] hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {sending ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
