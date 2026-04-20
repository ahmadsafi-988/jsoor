"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Send, Paperclip, MoreVertical } from "lucide-react";

type Message = {
  id: string;
  text: string;
  sender: "me" | "them";
  time: string;
};

type Conversation = {
  id: string;
  name: string;
  company: string;
  time: string;
  preview: string;
  unread: boolean;
  online: boolean;
  initials?: string;
  role: string;
  messages: Message[];
};

const CONVERSATIONS: Conversation[] = [
  {
    id: "1",
    name: "Sarah Jenkins",
    company: "TechNova Solutions",
    role: "Recruiting Manager at TechNova Solutions",
    time: "10:42 AM",
    preview: "We'd love to schedule a second round interview with you this week.",
    unread: true,
    online: true,
    messages: [
      { id: "m1", text: "Hi there! We reviewed your profile and were very impressed with your background in UI/UX design.", sender: "them", time: "10:30 AM" },
      { id: "m2", text: "We'd love to schedule a second round interview with you this week. Are you available on Thursday morning?", sender: "them", time: "10:42 AM" },
      { id: "m3", text: "Hi Sarah, thank you for reaching out! I'm thrilled to hear back from the team.", sender: "me", time: "11:15 AM" },
      { id: "m4", text: "Thursday morning works perfectly for me. Would 10:00 AM AST suit your schedule?", sender: "me", time: "11:16 AM" },
    ],
  },
  {
    id: "2",
    name: "David Chen",
    company: "Global Finance Corp",
    role: "Senior Recruiter at Global Finance Corp",
    time: "Yesterday",
    preview: "Thank you for your application. We will be in touch shortly.",
    unread: false,
    online: false,
    messages: [
      { id: "m1", text: "Thank you for applying to the Data Analyst role.", sender: "them", time: "Yesterday, 2:00 PM" },
      { id: "m2", text: "We have reviewed your application and will be in touch shortly.", sender: "them", time: "Yesterday, 2:05 PM" },
    ],
  },
  {
    id: "3",
    name: "Alex El-Khoury",
    company: "Creative Hub Dubai",
    role: "Head of Design at Creative Hub Dubai",
    time: "Mon",
    preview: "Could you send over a link to your portfolio?",
    unread: false,
    online: false,
    initials: "AE",
    messages: [
      { id: "m1", text: "Hey! We came across your profile — really impressive work.", sender: "them", time: "Mon, 11:00 AM" },
      { id: "m2", text: "Could you send over a link to your portfolio?", sender: "them", time: "Mon, 11:02 AM" },
    ],
  },
];

export default function MessagesPage() {
  const [activeId, setActiveId] = useState("1");
  const [conversations, setConversations] = useState(CONVERSATIONS);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const active = conversations.find((c) => c.id === activeId)!;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active.messages]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? {
              ...c,
              messages: [
                ...c.messages,
                { id: Date.now().toString(), text, sender: "me", time: "Just now" },
              ],
              preview: text,
            }
          : c
      )
    );
    setInput("");
  };

  return (
    <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 64px)" }}>
      {/* Left panel */}
      <div className="w-1/3 bg-[#fcf9f8] border-r border-[#f0edec] flex flex-col shadow-[4px_0_20px_rgba(0,0,0,0.02)]">
        <div className="p-6 pb-4">
          <h1 className="font-headline text-3xl font-bold text-[#1c1b1b] tracking-tight mb-4">
            Messages
          </h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3d4a41]" />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full bg-[#f6f3f2] border-b-2 border-transparent focus:border-[#006d43] pl-10 pr-4 py-3 rounded-lg text-sm text-[#1c1b1b] placeholder-[#3d4a41] focus:outline-none transition-all"
            />
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-4 pb-4 space-y-2">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => {
                setActiveId(conv.id);
                setConversations((prev) =>
                  prev.map((c) => c.id === conv.id ? { ...c, unread: false } : c)
                );
              }}
              className={`p-4 rounded-xl cursor-pointer transition-colors border-l-4 ${
                conv.id === activeId
                  ? "bg-[#e5e2e1] border-[#006d43]"
                  : "bg-[#fcf9f8] border-transparent hover:bg-[#f6f3f2]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full bg-[#e5e2e1] flex items-center justify-center text-[#1c1b1b] font-headline font-bold text-base overflow-hidden">
                    {conv.initials ? (
                      <span>{conv.initials}</span>
                    ) : (
                      <span>{conv.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</span>
                    )}
                  </div>
                  {conv.online && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#006d43] rounded-full border-2 border-[#e5e2e1]" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h3 className="font-semibold text-[#1c1b1b] truncate text-sm">{conv.name}</h3>
                    <span className={`text-xs shrink-0 ml-2 ${conv.unread ? "text-[#006d43] font-medium" : "text-[#3d4a41]"}`}>
                      {conv.time}
                    </span>
                  </div>
                  <p className="text-xs text-[#3d4a41] truncate mb-0.5">{conv.company}</p>
                  <p className={`text-sm truncate ${conv.unread ? "font-medium text-[#1c1b1b]" : "text-[#3d4a41]"}`}>
                    {conv.preview}
                  </p>
                </div>

                {conv.unread && (
                  <div className="w-2 h-2 bg-[#006d43] rounded-full shrink-0" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 bg-[#fcf9f8] flex flex-col">
        {/* Chat header */}
        <div className="h-20 bg-[#f6f3f2] border-b border-[#f0edec] flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#e5e2e1] flex items-center justify-center font-headline font-bold text-sm text-[#1c1b1b]">
              {active.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <div>
              <h2 className="font-headline font-bold text-lg text-[#1c1b1b] leading-tight">
                {active.name}
              </h2>
              <p className="text-sm text-[#3d4a41]">{active.role}</p>
            </div>
          </div>
          <button className="p-2 text-[#3d4a41] hover:bg-[#e5e2e1] rounded-full transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6">
          <div className="flex justify-center">
            <span className="bg-[#f0edec] text-xs text-[#3d4a41] px-3 py-1 rounded-full font-medium">
              Today
            </span>
          </div>

          {active.messages.map((msg) =>
            msg.sender === "them" ? (
              <div key={msg.id} className="flex items-start gap-3 max-w-[80%]">
                <div className="w-8 h-8 rounded-full bg-[#e5e2e1] flex items-center justify-center font-headline font-bold text-xs text-[#1c1b1b] shrink-0 mt-1">
                  {active.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex flex-col gap-1">
                  <div className="bg-[#ebe7e7] text-[#1c1b1b] p-4 rounded-2xl rounded-tl-sm shadow-sm">
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                  </div>
                  <span className="text-xs text-[#3d4a41] ml-1">{msg.time}</span>
                </div>
              </div>
            ) : (
              <div key={msg.id} className="flex items-start justify-end gap-3 max-w-[80%] ml-auto">
                <div className="flex flex-col gap-1 items-end">
                  <div className="bg-gradient-to-br from-[#006d43] to-[#00a86b] text-white p-4 rounded-2xl rounded-tr-sm shadow-[0_8px_20px_rgba(0,109,67,0.15)]">
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                  </div>
                  <span className="text-xs text-[#3d4a41] mr-1">{msg.time}</span>
                </div>
              </div>
            )
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="p-6 bg-[#f6f3f2] border-t border-[#f0edec] shrink-0">
          <div className="flex items-end gap-3 bg-white rounded-xl p-2 shadow-sm border border-[#f0edec]">
            <button className="p-3 text-[#3d4a41] hover:text-[#006d43] hover:bg-[#f6f3f2] rounded-full transition-colors">
              <Paperclip className="w-5 h-5" />
            </button>
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Type your message..."
              className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-3 text-sm text-[#1c1b1b] placeholder-[#3d4a41] min-h-[44px] max-h-32 outline-none"
            />
            <button
              onClick={sendMessage}
              className="p-3 bg-gradient-to-br from-[#006d43] to-[#00a86b] text-white rounded-xl shadow-[0_8px_16px_rgba(0,109,67,0.15)] hover:brightness-110 transition-all flex items-center justify-center"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
