import { MessageCircle, Send, X, RotateCcw, FileText, MessageSquare } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ask, QUICK_QUESTIONS, WELCOME_MESSAGE, type QAResult } from "../utils/handbookQA";

interface ChatMessage {
  id: number;
  role: "user" | "bot";
  text: string;
  source?: string;
  needsUserInfo?: boolean;
  followUp?: string;
  unknown?: boolean;
  timestamp: number;
}

let msgIdCounter = 0;

type XiaoyaoCompanionProps = {
  pageTitle?: string;
  voiceAvailable?: boolean;
};

export default function XiaoyaoCompanion({ pageTitle: _pageTitle }: XiaoyaoCompanionProps) {
  void _pageTitle;
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: msgIdCounter++,
      role: "bot",
      text: WELCOME_MESSAGE,
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, isThinking, open]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open]);

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isThinking) return;

      const userMsg: ChatMessage = {
        id: msgIdCounter++,
        role: "user",
        text: trimmed,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsThinking(true);

      setTimeout(() => {
        const result: QAResult = ask(trimmed);
        const botMsg: ChatMessage = {
          id: msgIdCounter++,
          role: "bot",
          text: result.answer,
          source: result.source,
          needsUserInfo: result.needsUserInfo,
          followUp: result.followUp,
          unknown: result.unknown,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, botMsg]);
        setIsThinking(false);
      }, 450 + Math.random() * 350);
    },
    [isThinking],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleReset = () => {
    msgIdCounter = 0;
    setMessages([
      {
        id: msgIdCounter++,
        role: "bot",
        text: WELCOME_MESSAGE,
        timestamp: Date.now(),
      },
    ]);
    setInput("");
    setTimeout(() => inputRef.current?.focus(), 60);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
      {open && (
        <section
          className="xiaoyao-companion-panel w-[380px] overflow-hidden rounded-[22px] border border-white/80 bg-white/95 shadow-[0_24px_70px_rgba(64,42,31,.22)] backdrop-blur-xl content-enter"
          role="dialog"
          aria-label="员工手册助手"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#F0E8DC] bg-gradient-to-r from-[#FBF6EE] to-[#F7EFE3] px-4 py-3.5">
            <div className="flex items-center gap-3">
              <div className="xiaoyao-avatar is-large xiaoyao-avatar--ring" aria-hidden="true" />
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-text-primary">小瑶 · 员工手册助手</h3>
                <p className="mt-0.5 truncate text-[11px] text-text-tertiary">长发小寨员工手册 · 2026年1月1日版</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                onClick={handleReset}
                className="grid h-8 w-8 place-items-center rounded-lg text-text-tertiary transition-colors hover:bg-white/70 hover:text-text-primary"
                aria-label="新对话"
                title="新对话"
              >
                <RotateCcw size={15} />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-text-tertiary transition-colors hover:bg-white/70 hover:text-text-primary"
                aria-label="关闭助手"
              >
                <X size={17} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="xiaoyao-companion-messages overflow-y-auto px-4 py-4"
            style={{ maxHeight: "min(56vh, 460px)" }}
          >
            <div className="space-y-3.5">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} onPickQuestion={sendMessage} />
              ))}
              {isThinking && <ThinkingIndicator />}
            </div>
          </div>

          {/* Quick Questions (only first round) */}
          {messages.length <= 2 && !isThinking && (
            <div className="border-t border-[#F0E8DC] px-4 py-2.5">
              <div className="flex flex-wrap gap-1.5">
                {QUICK_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="rounded-full border border-[#E8DCC8] bg-[#FBF7F0] px-2.5 py-1 text-[11px] leading-snug text-text-secondary transition-all hover:border-[#D9B98E] hover:bg-[#F5E9D2] hover:text-[#8B5A2B]"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t border-[#F0E8DC] bg-white px-3 py-3">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="问小瑶：报销流程、请假规定…"
                rows={1}
                className="xiaoyao-companion-input w-full resize-none rounded-xl border border-[#E8DCC8] bg-[#FBF7F0] px-3 py-2 text-[13px] text-text-primary placeholder:text-text-tertiary/70 focus:border-[#D9B98E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F5E9D2]"
                style={{ maxHeight: "100px" }}
                onInput={(e) => {
                  const el = e.currentTarget;
                  el.style.height = "auto";
                  el.style.height = Math.min(el.scrollHeight, 100) + "px";
                }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isThinking}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand text-white transition-all hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-[#E8DCC8]"
                aria-label="发送"
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </section>
      )}

      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="group flex items-center gap-3 rounded-full border border-white/80 bg-white/90 p-1.5 pr-4 shadow-[0_12px_36px_rgba(64,42,31,.16)] backdrop-blur-xl transition-transform duration-200 hover:-translate-y-1"
          aria-label="打开员工手册助手"
        >
          <div className="xiaoyao-avatar is-large xiaoyao-float" aria-hidden="true" />
          <span className="text-left">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-text-primary">
              <MessageCircle size={14} className="text-brand" />
              小瑶 · 员工手册助手
            </span>
            <span className="block text-[11px] text-text-tertiary">问制度 · 查流程</span>
          </span>
        </button>
      )}
    </div>
  );
}

function MessageBubble({ msg, onPickQuestion }: { msg: ChatMessage; onPickQuestion: (q: string) => void }) {
  const isUser = msg.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-brand px-3.5 py-2 text-[13px] leading-relaxed text-white">
          {msg.text}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2.5">
      {/* Bot Avatar */}
      <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-full border border-[#F0E8DC] bg-[#FBF6EE]">
        <span className="xiaoyao-avatar-mini" aria-hidden="true" />
      </div>
      {/* Message Content */}
      <div className="min-w-0 max-w-[88%] flex-1">
        <div
          className={`rounded-2xl rounded-tl-md px-3.5 py-2.5 text-[13px] leading-relaxed ${
            msg.unknown ? "bg-[#FDF2EA] text-text-primary ring-1 ring-[#F5D6BD]" : "bg-[#FBF7F0] text-text-primary ring-1 ring-[#F0E8DC]"
          }`}
        >
          <div className="whitespace-pre-wrap break-words">{msg.text}</div>
        </div>
        {/* Source citation */}
        {msg.source && (
          <div className="mt-1 flex items-center gap-1 text-[10.5px] leading-tight text-text-tertiary/85">
            <FileText size={10} className="shrink-0" />
            <span className="break-words">{msg.source}</span>
          </div>
        )}
        {/* Follow-up prompt */}
        {msg.followUp && (
          <div className="mt-1.5 rounded-lg bg-[#FBF1E2] px-2.5 py-1.5 text-[11.5px] leading-relaxed text-[#8B5A2B]">
            <MessageSquare size={10} className="mr-1 inline shrink-0" />
            {msg.followUp}
          </div>
        )}
        {/* Quick reply chips when more info needed */}
        {msg.needsUserInfo && (
          <div className="mt-2 flex flex-wrap gap-1">
            {["标准工作制", "综合工作制", "其他情况"].map((q) => (
              <button
                key={q}
                onClick={() => onPickQuestion(q)}
                className="rounded-full border border-[#E8DCC8] bg-white px-2 py-0.5 text-[11px] text-text-secondary transition-colors hover:border-[#D9B98E] hover:bg-[#FBF7F0]"
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ThinkingIndicator() {
  return (
    <div className="flex gap-2.5">
      <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-full border border-[#F0E8DC] bg-[#FBF6EE]">
        <span className="xiaoyao-avatar-mini" aria-hidden="true" />
      </div>
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-md bg-[#FBF7F0] px-3.5 py-2.5 ring-1 ring-[#F0E8DC]">
        <span className="handbook-dot h-1.5 w-1.5 rounded-full bg-text-tertiary/40" />
        <span className="handbook-dot h-1.5 w-1.5 rounded-full bg-text-tertiary/40" style={{ animationDelay: "0.15s" }} />
        <span className="handbook-dot h-1.5 w-1.5 rounded-full bg-text-tertiary/40" style={{ animationDelay: "0.3s" }} />
      </div>
    </div>
  );
}
