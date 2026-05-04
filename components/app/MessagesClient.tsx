"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Send, Paperclip, MessageSquare, X, Download, AlertCircle } from "lucide-react";
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

function formatDateLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: "long" });
  return d.toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" });
}

function isSameDay(a: string, b: string) {
  const da = new Date(a);
  const db = new Date(b);
  return da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate();
}

function Avatar({ name, url, size = 10 }: { name: string; url: string | null; size?: number }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";
  return (
    <div className={`w-${size} h-${size} rounded-full bg-[#e5e2e1] flex items-center justify-center font-bold text-[#1c1b1b] overflow-hidden shrink-0`}>
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
  const [msgError, setMsgError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, []);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeConvId) return;
    setLoadingMsgs(true);
    setMsgError(null);
    setMessages([]);

    getMessages(activeConvId).then((result) => {
      if ("messages" in result) {
        setMessages(result.messages);
      } else {
        setMsgError(result.error);
      }
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

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 128) + "px";
  }, [input]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text && !attachment) return;
    if (!activeConvId) return;
    setSending(true);

    let attachmentUrl: string | undefined;
    let attachmentName: string | undefined;

    if (attachment) {
      const path = `${activeConvId}/${Date.now()}_${attachment.name}`;
      const { error } = await supabase.storage.from("message-attachments").upload(path, attachment);
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

  const handleAttachmentDownload = async (url: string, name: string) => {
    const { data } = await supabase.storage.from("message-attachments").createSignedUrl(url, 60);
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
      <div className="w-80 bg-white border-r border-[#f0edec] flex flex-col shrink-0">
        <div className="px-5 pt-6 pb-3 border-b border-[#f0edec]">
          <h1 className="font-headline text-xl font-bold text-[#1c1b1b] mb-3">Messages</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full bg-[#f6f3f2] rounded-lg pl-9 pr-3 py-2 text-sm text-[#1c1b1b] placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#006d43]/20"
            />
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {filteredConvs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-3">
              <MessageSquare className="w-8 h-8 text-neutral-300" />
              <p className="text-sm text-neutral-400">
                {conversations.length === 0 ? "No conversations yet." : "No results found."}
              </p>
            </div>
          ) : (
            filteredConvs.map((conv) => {
              const isActive = conv.id === activeConvId;
              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  className={`flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-colors border-b border-[#f6f3f2] ${
                    isActive ? "bg-[#006d43]/8 border-l-[3px] border-l-[#006d43]" : "hover:bg-[#f9f7f7] border-l-[3px] border-l-transparent"
                  }`}
                >
                  <div className="relative shrink-0 mt-0.5">
                    <Avatar name={conv.other_name} url={conv.other_avatar} size={10} />
                    {conv.unread_count > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#006d43] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                        {conv.unread_count > 9 ? "9+" : conv.unread_count}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className={`text-sm truncate font-semibold ${isActive ? "text-[#006d43]" : "text-[#1c1b1b]"}`}>
                        {conv.other_name}
                      </span>
                      <span className="text-[11px] text-neutral-400 shrink-0 ml-2">
                        {formatTime(conv.last_message_at)}
                      </span>
                    </div>
                    <p className="text-xs text-[#006d43] font-medium truncate mb-0.5">{conv.job_title}</p>
                    <p className={`text-xs truncate ${conv.unread_count > 0 ? "font-semibold text-[#1c1b1b]" : "text-neutral-400"}`}>
                      {conv.last_message || <span className="italic">No messages yet</span>}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Right panel: chat ── */}
      {!activeConvId || !activeConv ? (
        <div className="flex-1 flex items-center justify-center bg-[#fafaf9]">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#f0edec] flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-neutral-400" />
            </div>
            <p className="text-sm font-medium text-neutral-500">Select a conversation to start messaging</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 bg-[#fafaf9] flex flex-col overflow-hidden">
          {/* Chat header */}
          <div className="bg-white border-b border-[#f0edec] flex items-center px-6 py-3.5 gap-3 shrink-0 shadow-sm">
            <Avatar name={activeConv.other_name} url={activeConv.other_avatar} size={10} />
            <div className="min-w-0">
              <h2 className="font-semibold text-[#1c1b1b] text-sm leading-tight truncate">
                {activeConv.other_name}
              </h2>
              <p className="text-xs text-[#006d43] font-medium truncate">{activeConv.job_title}</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-1">
            {loadingMsgs ? (
              <div className="flex items-center justify-center flex-1 py-16">
                <div className="w-5 h-5 border-2 border-[#006d43] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : msgError ? (
              <div className="flex flex-col items-center justify-center flex-1 py-16 gap-2 text-center">
                <AlertCircle className="w-6 h-6 text-red-400" />
                <p className="text-sm text-red-500">Could not load messages.</p>
                <button
                  onClick={() => setActiveConvId(activeConvId)}
                  className="text-xs text-[#006d43] underline underline-offset-2"
                >
                  Try again
                </button>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 py-16 gap-2 text-center">
                <p className="text-sm text-neutral-400">No messages yet — say hello!</p>
              </div>
            ) : (
              <>
                {messages.map((msg, i) => {
                  const isMe = msg.sender_id === currentUserId;
                  const prevMsg = messages[i - 1];
                  const showDateSep = !prevMsg || !isSameDay(prevMsg.created_at, msg.created_at);
                  const prevSame = prevMsg && prevMsg.sender_id === msg.sender_id && !showDateSep;

                  return (
                    <div key={msg.id}>
                      {showDateSep && (
                        <div className="flex items-center gap-3 my-4">
                          <div className="flex-1 h-px bg-[#f0edec]" />
                          <span className="text-[11px] text-neutral-400 font-medium px-2">
                            {formatDateLabel(msg.created_at)}
                          </span>
                          <div className="flex-1 h-px bg-[#f0edec]" />
                        </div>
                      )}
                      <div className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"} ${prevSame ? "mt-0.5" : "mt-3"}`}>
                        {!isMe && (
                          <div className={prevSame ? "w-8 shrink-0" : ""}>
                            {!prevSame && (
                              <Avatar name={activeConv.other_name} url={activeConv.other_avatar} size={8} />
                            )}
                          </div>
                        )}
                        <div className={`flex flex-col gap-0.5 max-w-[65%] ${isMe ? "items-end" : "items-start"}`}>
                          <div
                            className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                              isMe
                                ? "bg-[#006d43] text-white rounded-br-sm"
                                : "bg-white text-[#1c1b1b] rounded-bl-sm shadow-sm border border-[#f0edec]"
                            }`}
                          >
                            {msg.content && <p>{msg.content}</p>}
                            {msg.attachment_url && msg.attachment_name && (
                              <button
                                onClick={() => handleAttachmentDownload(msg.attachment_url!, msg.attachment_name!)}
                                className={`flex items-center gap-1.5 mt-1.5 text-xs font-medium underline underline-offset-2 ${
                                  isMe ? "text-white/80 hover:text-white" : "text-[#006d43] hover:text-[#00a86b]"
                                }`}
                              >
                                <Download className="w-3 h-3 shrink-0" />
                                {msg.attachment_name}
                              </button>
                            )}
                          </div>
                          {(!messages[i + 1] || messages[i + 1].sender_id !== msg.sender_id) && (
                            <span className="text-[10px] text-neutral-400 px-1">
                              {formatTime(msg.created_at)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Attachment preview */}
          {attachment && (
            <div className="px-5 pt-2">
              <div className="inline-flex items-center gap-2 bg-[#f0edec] rounded-lg px-3 py-1.5 text-sm text-[#3d4a41] max-w-xs">
                <Paperclip className="w-3.5 h-3.5 shrink-0 text-[#006d43]" />
                <span className="truncate text-xs">{attachment.name}</span>
                <button onClick={() => setAttachment(null)} className="ml-1 shrink-0 text-neutral-400 hover:text-red-500">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Input */}
          <div className="px-5 py-4 bg-white border-t border-[#f0edec] shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => setAttachment(e.target.files?.[0] ?? null)}
            />
            <div className="flex items-end gap-2 bg-[#f6f3f2] rounded-2xl px-3 py-2 border border-[#e5e2e1] focus-within:border-[#006d43]/40 focus-within:ring-2 focus-within:ring-[#006d43]/10 transition-all">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 text-neutral-400 hover:text-[#006d43] transition-colors shrink-0 mb-0.5"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Type a message..."
                className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-1.5 text-sm text-[#1c1b1b] placeholder-neutral-400 outline-none min-h-[28px] max-h-32"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={sending || (!input.trim() && !attachment)}
                className="p-2 bg-[#006d43] text-white rounded-xl hover:bg-[#005a37] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0 mb-0.5"
              >
                {sending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-[10px] text-neutral-400 mt-1.5 px-1">Press Enter to send · Shift+Enter for new line</p>
          </div>
        </div>
      )}
    </div>
  );
}
