"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  BookOpen,
  Bot,
  CheckCircle2,
  Copy,
  Cpu,
  Database,
  Eye,
  FileText,
  Filter,
  HeartPulse,
  Radio,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Upload,
  User,
  X,
} from "lucide-react";
import { COPILOT_DEMO_QUESTIONS } from "@/data/copilot-demo";
import { THESSAI_KB_DOCUMENTS, type KbCategory, type ThessaiDocument } from "@/data/thessai-kb";
import { readSse } from "@/lib/stream";
import { pushActivity } from "@/lib/activity-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { M3Card, M3IconBadge } from "@/components/ui/m3-card";
import {
  AIThinking,
  PageTransition,
  Shimmer,
  StreamingText,
} from "@/components/motion/ai-motion";

type SourceRow = {
  id: string;
  title: string;
  chunks: number;
  category?: string;
  fullText?: string;
  tags?: string[];
};

type Cite = { sourceId: string; title?: string; snippet: string; score: number };

type ChatMessage = {
  id: string;
  sender: "user" | "agent";
  text: string;
  timestamp: string;
  citations?: Cite[];
  isStreaming?: boolean;
};

const CATEGORIES: ("All" | KbCategory)[] = [
  "All",
  "Hardware & Gateway",
  "Radar & Fall Sensing",
  "Wearables & SOS",
  "Family & Caregiver Alerts",
  "Compliance & Subscriptions",
];

export function CopilotBoard() {
  const params = useSearchParams();
  const [activeTab, setActiveTab] = useState<"copilot" | "kb">("copilot");
  const [sources, setSources] = useState<SourceRow[]>([]);
  const [totalChunks, setTotalChunks] = useState(0);
  const [demoLoaded, setDemoLoaded] = useState(true);
  const [demoQuestions, setDemoQuestions] = useState<string[]>([...COPILOT_DEMO_QUESTIONS]);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [questionInput, setQuestionInput] = useState("");
  const [indexing, setIndexing] = useState(false);
  const [indexProgress, setIndexProgress] = useState(0);
  const [running, setRunning] = useState(false);

  // Chat message history
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // KB Tab state
  const [selectedCategory, setSelectedCategory] = useState<"All" | KbCategory>("All");
  const [kbSearchQuery, setKbSearchQuery] = useState("");
  const [viewingDoc, setViewingDoc] = useState<ThessaiDocument | null>(null);
  const [copied, setCopied] = useState(false);

  // Initialize Welcome Message
  useEffect(() => {
    const welcomeMsg: ChatMessage = {
      id: "msg-welcome",
      sender: "agent",
      text: `Hi Maya! I’m **CareOps AI Ops Copilot**, your senior safety support operations teammate.

I can assist you right now with:
• **AI Gateway**: Placement & ~90ft RF indoor coverage rule
• **mmWave Fall Radar**: Camera-free 60GHz vector calibration & room boundary setup
• **Smart Wearable**: Vital sync (BLE 5.3) & emergency SOS button response
• **Gateway LED Diagnostics**: Wi-Fi reconnection & solid red recovery
• **Subscription Billing**: Home Plus vs Essential plan adjustments & promo add-ons
• **Family Communication**: Overnight nocturnal bathroom motion & Quiet Hours tuning

How can I help you with support today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages([welcomeMsg]);
    void refreshSources();
  }, []);

  const sendMessage = useCallback(
    async (textToSend?: string) => {
      const q = (textToSend ?? questionInput).trim();
      if (!q || running) return;

      setQuestionInput("");
      setActiveTab("copilot");

      const userMsgId = `user-${Date.now()}`;
      const agentMsgId = `agent-${Date.now()}`;
      const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      const userMsg: ChatMessage = {
        id: userMsgId,
        sender: "user",
        text: q,
        timestamp: timeStr,
      };

      const initialAgentMsg: ChatMessage = {
        id: agentMsgId,
        sender: "agent",
        text: "",
        timestamp: timeStr,
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMsg, initialAgentMsg]);
      setRunning(true);

      try {
        const res = await fetch("/api/copilot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: q }),
        });

        let currentText = "";
        let retrievedCitations: Cite[] = [];

        await readSse(res, (event, data) => {
          if (event === "sources") {
            const d = data as { citations: Cite[] };
            retrievedCitations = d.citations ?? [];
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === agentMsgId ? { ...msg, citations: retrievedCitations } : msg
              )
            );
          }
          if (event === "token") {
            const d = data as { text: string };
            currentText += d.text;
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === agentMsgId ? { ...msg, text: currentText, isStreaming: true } : msg
              )
            );
          }
          if (event === "result") {
            const d = data as { answer: string; citations?: Cite[] };
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === agentMsgId
                  ? {
                      ...msg,
                      text: d.answer,
                      citations: d.citations?.length ? d.citations : retrievedCitations,
                      isStreaming: false,
                    }
                  : msg
              )
            );
            pushActivity("copilot", "Ops answer grounded in Knowledge Base");
          }
        });
      } finally {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === agentMsgId ? { ...msg, isStreaming: false } : msg))
        );
        setRunning(false);
      }
    },
    [questionInput, running]
  );

  useEffect(() => {
    const q = params.get("q");
    if (q) {
      void sendMessage(q);
    }
    const tab = params.get("tab");
    if (tab === "kb") setActiveTab("kb");
  }, [params, sendMessage]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, running]);

  async function refreshSources() {
    try {
      const res = await fetch("/api/copilot");
      const data = await res.json();
      setSources(data.sources ?? []);
      setTotalChunks(data.totalChunks ?? 0);
      setDemoLoaded(true);
      if (data.demoQuestions?.length) setDemoQuestions(data.demoQuestions);
    } catch {
      // Fallback
    }
  }

  async function loadDemoData() {
    setLoadingDemo(true);
    setIndexing(true);
    setIndexProgress(10);
    const tick = setInterval(() => setIndexProgress((p) => Math.min(p + 16, 92)), 140);
    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "seed-demo" }),
      });
      const data = await res.json();
      setIndexProgress(100);
      setSources(data.sources ?? []);
      setTotalChunks(data.totalChunks ?? 0);
      setDemoLoaded(true);
      if (data.demoQuestions?.length) setDemoQuestions(data.demoQuestions);
      pushActivity("copilot", `Loaded Knowledge Base · ${data.chunksAdded} chunks indexed`);
    } finally {
      clearInterval(tick);
      setLoadingDemo(false);
      setTimeout(() => setIndexing(false), 350);
    }
  }

  async function onUpload(file: File | null) {
    if (!file) return;
    setIndexing(true);
    setIndexProgress(8);
    const tick = setInterval(() => setIndexProgress((p) => Math.min(p + 12, 88)), 200);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/copilot", { method: "POST", body: fd });
      const data = await res.json();
      setIndexProgress(100);
      await refreshSources();
      pushActivity("copilot", `Indexed ${data.chunksAdded} chunks from ${file.name}`);
    } finally {
      clearInterval(tick);
      setTimeout(() => setIndexing(false), 400);
    }
  }

  function handleResetChat() {
    const welcomeMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "agent",
      text: `Chat reset. I’m **CareOps AI Ops Copilot**. How can I help you with support?`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages([welcomeMsg]);
  }

  function handleOpenDocById(id: string) {
    const found = THESSAI_KB_DOCUMENTS.find((d) => d.id === id);
    if (found) {
      setViewingDoc(found);
    } else {
      const src = sources.find((s) => s.id === id);
      if (src) {
        setViewingDoc({
          id: src.id,
          title: src.title,
          category: (src.category as KbCategory) || "Hardware & Gateway",
          version: "v1.0.0",
          lastUpdated: "2026-08-10",
          author: "Support Operations",
          chunks: src.chunks,
          tags: src.tags || ["careops", "support"],
          summary: src.title,
          fullText:
            src.fullText ||
            `DOCUMENT: ${src.title}\n\nIndexed in the Knowledge Base with ${src.chunks} vector chunk(s).`,
        });
      }
    }
  }

  const filteredKbDocs = THESSAI_KB_DOCUMENTS.filter((doc) => {
    const matchesCategory = selectedCategory === "All" || doc.category === selectedCategory;
    const matchesQuery =
      !kbSearchQuery ||
      doc.title.toLowerCase().includes(kbSearchQuery.toLowerCase()) ||
      doc.summary.toLowerCase().includes(kbSearchQuery.toLowerCase()) ||
      doc.tags.some((t) => t.toLowerCase().includes(kbSearchQuery.toLowerCase()));
    return matchesCategory && matchesQuery;
  });

  return (
    <PageTransition>
      <div className="flex h-full flex-col gap-4 p-4 lg:p-6 bg-[#f8fafc]">
        {/* Top Header & Branding */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-teal-800">
                CareOps AI Operations
              </span>
            </div>
            <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Ops Copilot & Knowledge Engine
            </h1>
            <p className="mt-0.5 text-xs text-slate-500 md:text-sm">
              Grounded AI assistant for Senior Safety AI hardware, mmWave fall radar calibration & support ops.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-1.5 text-xs text-slate-600">
              <Database className="h-3.5 w-3.5 text-teal-700" />
              <span className="font-semibold text-slate-800">{THESSAI_KB_DOCUMENTS.length} Real Docs</span>
              <span className="text-slate-400">•</span>
              <span className="tabular-nums font-medium">{totalChunks || 32} chunks indexed</span>
            </div>

            <Button
              type="button"
              variant={demoLoaded ? "outline" : "default"}
              size="sm"
              disabled={loadingDemo}
              onClick={() => void loadDemoData()}
            >
              <Database className="h-4 w-4" />
              {loadingDemo ? "Indexing…" : "Refresh Knowledge Base"}
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200/80">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("copilot")}
              className={cn(
                "flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-all",
                activeTab === "copilot"
                  ? "border-teal-700 text-teal-800"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              )}
            >
              <Sparkles className="h-4 w-4 text-teal-600" />
              Ops Copilot Agent Chat
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("kb")}
              className={cn(
                "flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-all",
                activeTab === "kb"
                  ? "border-teal-700 text-teal-800"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              )}
            >
              <BookOpen className="h-4 w-4 text-sky-600" />
              Knowledge Base Catalog
              <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[11px] font-bold text-teal-800">
                {THESSAI_KB_DOCUMENTS.length}
              </span>
            </button>
          </div>

          <label className="hidden md:flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-teal-300 bg-teal-50/60 px-3 py-1.5 text-xs text-teal-800 transition hover:bg-teal-100/60">
            <Upload className="h-3.5 w-3.5 text-teal-700" />
            <span className="font-semibold">Upload PDF / Manual</span>
            <input
              type="file"
              accept=".pdf,.txt,.md,.text"
              className="hidden"
              onChange={(e) => void onUpload(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        {/* TAB 1: COPILOT BOARD (LEFT: KB SOURCES & PROMPTS | RIGHT: AGENT CHAT) */}
        {activeTab === "copilot" && (
          <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr] h-[calc(100vh-250px)] min-h-[580px]">
            {/* LEFT PANEL: KNOWLEDGE SOURCES & PROMPT LIBRARY */}
            <div className="flex flex-col gap-4 overflow-y-auto pr-1">
              {/* Active Knowledge Sources */}
              <M3Card interactive={false} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <M3IconBadge className="h-8 w-8">
                      <BookOpen className="h-4 w-4" />
                    </M3IconBadge>
                    <div>
                      <h2 className="font-display text-sm font-bold text-slate-900">
                        Senior Safety Vector Sources
                      </h2>
                      <p className="text-[11px] text-slate-500">Official RAG Index</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-teal-700 hover:bg-teal-50"
                    onClick={() => setActiveTab("kb")}
                  >
                    View All <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>

                <ul className="max-h-48 space-y-1.5 overflow-y-auto pr-1 text-xs">
                  {sources.map((s) => (
                    <li
                      key={s.id}
                      className="group flex items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-2 transition hover:bg-white hover:border-teal-300 hover:shadow-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-800 truncate leading-snug">{s.title}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                          {s.category || "CareOps Guide"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenDocById(s.id)}
                        className="inline-flex items-center gap-1 rounded-md bg-teal-50 px-2 py-1 text-[10px] font-bold text-teal-700 hover:bg-teal-700 hover:text-white transition"
                      >
                        <Eye className="h-3 w-3" /> View
                      </button>
                    </li>
                  ))}
                </ul>

                <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-3 text-center hover:bg-slate-100/70 transition">
                  <Upload className="h-4 w-4 text-teal-700" />
                  <span className="text-xs font-semibold text-slate-800">Upload PDF / Technical Manual</span>
                  <input
                    type="file"
                    accept=".pdf,.txt,.md,.text"
                    className="hidden"
                    onChange={(e) => void onUpload(e.target.files?.[0] ?? null)}
                  />
                </label>

                {indexing && (
                  <div className="mt-2">
                    <AIThinking label={`Indexing vector chunks… ${indexProgress}%`} />
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <motion.div
                        className="h-full bg-teal-600"
                        animate={{ width: `${indexProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </M3Card>

              {/* Prompt Suggestions Library */}
              <M3Card interactive={false} className="p-4 flex-1">
                <div className="flex items-center justify-between mb-2.5">
                  <h2 className="font-display text-sm font-bold text-slate-900">
                    Suggested Support Topics
                  </h2>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                    Click to Ask Agent
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-3">
                  Click any support scenario to send it directly into the Agent Chat:
                </p>

                <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
                  {demoQuestions.map((q) => (
                    <button
                      key={q}
                      type="button"
                      disabled={running}
                      onClick={() => void sendMessage(q)}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-2.5 text-left text-xs font-medium text-slate-700 shadow-xs hover:border-teal-400 hover:bg-teal-50/50 hover:text-teal-900 transition group cursor-pointer"
                    >
                      <span className="pr-2">{q}</span>
                      <Sparkles className="h-3.5 w-3.5 shrink-0 text-slate-400 group-hover:text-teal-700 transition" />
                    </button>
                  ))}
                </div>
              </M3Card>
            </div>

            {/* RIGHT PANEL: PROFESSIONAL AGENT CHAT INTERFACE */}
            <M3Card interactive={false} className="flex flex-col h-full overflow-hidden border border-slate-200/90 shadow-md">
              {/* Chat Header */}
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/90 px-4 py-3 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-teal-700 text-white shadow-xs">
                    <Bot className="h-5 w-5" />
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-display text-sm font-bold text-slate-900">
                        CareOps AI Support Agent
                      </h2>
                      <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                        Online RAG
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Grounded in CareOps Knowledge Base v3.2
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetChat}
                    title="Reset Chat Conversation"
                    className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Reset Chat
                  </button>
                </div>
              </div>

              {/* Chat Message Scrollable Container */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/40">
                {messages.map((msg) => {
                  const isUser = msg.sender === "user";
                  return (
                    <div
                      key={msg.id}
                      className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}
                    >
                      {!isUser && (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-700 text-white shadow-xs">
                          <Bot className="h-4 w-4" />
                        </div>
                      )}

                      <div
                        className={cn(
                          "max-w-[84%] rounded-2xl p-4 text-xs leading-relaxed shadow-xs",
                          isUser
                            ? "bg-teal-700 text-white rounded-br-xs"
                            : "bg-white border border-slate-200/90 text-slate-800 rounded-bl-xs"
                        )}
                      >
                        {/* Header Sender Badge */}
                        <div className="flex items-center justify-between gap-3 mb-1.5 border-b pb-1 border-slate-200/40">
                          <span className={cn("font-bold text-[11px]", isUser ? "text-teal-100" : "text-teal-800")}>
                            {isUser ? "You (Maya Torres)" : "CareOps AI Agent"}
                          </span>
                          <span className={cn("text-[10px]", isUser ? "text-teal-200" : "text-slate-400")}>
                            {msg.timestamp}
                          </span>
                        </div>

                        {/* Message Text */}
                        {msg.isStreaming && !msg.text ? (
                          <div className="space-y-2 py-1">
                            <AIThinking label="Searching Knowledge Base & drafting response..." />
                            <Shimmer className="h-14" />
                          </div>
                        ) : (
                          <div className={cn("whitespace-pre-wrap font-sans", isUser ? "text-white" : "text-slate-800")}>
                            {msg.isStreaming ? (
                              <StreamingText text={msg.text} speed={24} />
                            ) : (
                              msg.text
                            )}
                          </div>
                        )}

                        {/* Citations List inside Agent Message */}
                        {!isUser && msg.citations && msg.citations.length > 0 && (
                          <div className="mt-3 border-t border-slate-100 pt-2.5 space-y-1.5">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Retrieved CareOps Grounding Sources:
                            </p>
                            <div className="space-y-1.5">
                              {msg.citations.map((c, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 p-2 border border-slate-200/80 text-[11px]"
                                >
                                  <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-teal-800 truncate">{c.title || c.sourceId}</p>
                                    <p className="text-[10px] text-slate-500 truncate">&ldquo;{c.snippet.slice(0, 90)}...&rdquo;</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenDocById(c.sourceId)}
                                    className="shrink-0 inline-flex items-center gap-1 rounded bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-700 hover:bg-teal-700 hover:text-white transition"
                                  >
                                    <Eye className="h-3 w-3" /> View Doc
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        {!isUser && msg.text && !msg.isStreaming && (
                          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-end">
                            <Button asChild size="sm" variant="secondary" className="text-[11px] h-7 px-2.5">
                              <Link
                                href={`/family?from=copilot&note=${encodeURIComponent(msg.text.slice(0, 280))}`}
                              >
                                Draft as Family Message <ArrowRight className="ml-1 h-3 w-3" />
                              </Link>
                            </Button>
                          </div>
                        )}
                      </div>

                      {isUser && (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-white shadow-xs">
                          <User className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input Bar */}
              <div className="border-t border-slate-200 bg-white p-3 shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void sendMessage();
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={questionInput}
                    onChange={(e) => setQuestionInput(e.target.value)}
                    placeholder="Ask CareOps AI Agent (e.g. Gateway 90ft range, mmWave radar fall setup...)"
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/30 transition"
                  />
                  <Button
                    type="submit"
                    disabled={!questionInput.trim() || running}
                    className="bg-teal-700 hover:bg-teal-800 text-white shrink-0 px-4"
                  >
                    <Send className="h-4 w-4 mr-1" /> Send
                  </Button>
                </form>
                <div className="mt-1.5 flex items-center justify-between px-1 text-[10px] text-slate-400">
                  <span>Press Enter to send message</span>
                  <span>Grounded in official specs</span>
                </div>
              </div>
            </M3Card>
          </div>
        )}

        {/* TAB 2: KNOWLEDGE BASE CATALOG VIEW */}
        {activeTab === "kb" && (
          <div className="space-y-4">
            {/* Search & Filter Bar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl bg-white p-4 shadow-xs border border-slate-200/80">
              <div className="relative min-w-[240px] flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={kbSearchQuery}
                  onChange={(e) => setKbSearchQuery(e.target.value)}
                  placeholder="Search CareOps documents, manuals, specs, or tags..."
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/30"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
                <Filter className="h-4 w-4 text-slate-400 mr-1" />
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                      selectedCategory === cat
                        ? "bg-teal-700 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Document Card Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredKbDocs.map((doc) => {
                const isGateway = doc.category === "Hardware & Gateway";
                const isRadar = doc.category === "Radar & Fall Sensing";
                const isWearable = doc.category === "Wearables & SOS";
                const isAlerts = doc.category === "Family & Caregiver Alerts";
                const CategoryIcon = isGateway
                  ? Cpu
                  : isRadar
                  ? Radio
                  : isWearable
                  ? HeartPulse
                  : isAlerts
                  ? Activity
                  : ShieldCheck;

                return (
                  <M3Card key={doc.id} className="flex flex-col justify-between p-5 hover:border-teal-300">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-bold text-teal-800">
                          <CategoryIcon className="h-3.5 w-3.5" />
                          {doc.category}
                        </span>
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                          {doc.version}
                        </span>
                      </div>

                      <h3 className="font-display text-base font-bold text-slate-900 leading-snug">
                        {doc.title}
                      </h3>

                      <p className="mt-2 text-xs leading-relaxed text-slate-600 line-clamp-3">
                        {doc.summary}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-1">
                        {doc.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                      <span className="text-[11px] text-slate-400">
                        {doc.chunks} vector chunks
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        className="bg-teal-700 text-white hover:bg-teal-800"
                        onClick={() => setViewingDoc(doc)}
                      >
                        <Eye className="mr-1.5 h-3.5 w-3.5" /> View Document
                      </Button>
                    </div>
                  </M3Card>
                );
              })}
            </div>
          </div>
        )}

        {/* MODAL / DRAWER FOR VIEWING FULL DOCUMENT DETAILS */}
        <AnimatePresence>
          {viewingDoc && (
            <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/60 backdrop-blur-xs p-3 md:p-6">
              <motion.div
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
                transition={{ type: "spring", stiffness: 300, damping: 28 }}
                className="flex h-full w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200"
              >
                {/* Modal Header */}
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50 p-5">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-[11px] font-bold text-teal-800">
                        {viewingDoc.category}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">ID: {viewingDoc.id}</span>
                      <span className="text-xs font-semibold text-slate-400">• {viewingDoc.version}</span>
                    </div>
                    <h2 className="font-display text-xl font-bold text-slate-900">
                      {viewingDoc.title}
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Author: <span className="font-semibold text-slate-700">{viewingDoc.author}</span> | Updated: {viewingDoc.lastUpdated}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setViewingDoc(null)}
                    className="rounded-full p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-4">
                  {/* Summary Callout */}
                  <div className="rounded-xl border border-teal-200 bg-teal-50/70 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-teal-900 mb-1">
                      Document Executive Summary
                    </p>
                    <p className="text-xs leading-relaxed text-teal-900 font-medium">
                      {viewingDoc.summary}
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-500 mr-1">Index Tags:</span>
                    {viewingDoc.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>

                  {/* Full Document Text */}
                  <div className="rounded-xl border border-slate-200 bg-slate-900 p-4 text-xs font-mono text-slate-200 leading-relaxed overflow-x-auto whitespace-pre-wrap">
                    {viewingDoc.fullText}
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 p-4">
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard.writeText(viewingDoc.fullText);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                  >
                    {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copied to Clipboard!" : "Copy Document Text"}
                  </button>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="default"
                      className="bg-teal-700 text-white hover:bg-teal-800"
                      onClick={() => {
                        const docPrompt = `Summarize key troubleshooting steps from "${viewingDoc.title}"`;
                        setViewingDoc(null);
                        setActiveTab("copilot");
                        void sendMessage(docPrompt);
                      }}
                    >
                      <Sparkles className="mr-1.5 h-4 w-4" /> Ask Copilot About This Doc
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
