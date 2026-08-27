"use client";

import { useRef, useState } from "react";
import { MessageCircle, Mic, Send, Square, Volume2, X } from "lucide-react";
import { api, ApiRequestError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { SpeechRecognitionLike } from "@/lib/speech";

type ChatMessage = { id: string; role: "user" | "assistant"; content: string };

export function FloatingAIChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [listening, setListening] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  async function sendMessage() {
    const message = input.trim();
    if (!message || sending) return;
    setInput("");
    setSending(true);
    const userMessage = { id: `user-${Date.now()}`, role: "user" as const, content: message };
    setMessages((current) => [...current, userMessage]);
    try {
      const response = await api.post<{
        conversationId: string;
        message: { id: string; role: "assistant"; content: string };
      }>("/api/ai/chat", { message, conversationId: conversationId ?? undefined });
      setConversationId(response.conversationId);
      setMessages((current) => [...current, response.message]);
    } catch (error) {
      setMessages((current) => current.filter((item) => item.id !== userMessage.id));
      toast.error(error instanceof ApiRequestError ? error.message : "Could not send your message.");
    } finally {
      setSending(false);
    }
  }

  function toggleListening() {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Recognition) {
      toast.error("Speech-to-text is not supported in this browser.");
      return;
    }
    const recognition = new Recognition();
    recognition.lang = "en-IN";
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const text = Array.from(event.results)
        .slice(event.resultIndex)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ");
      setInput((current) => `${current}${current ? " " : ""}${text}`);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => {
      setListening(false);
      toast.error("Speech recognition stopped.");
    };
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  function speak(message: ChatMessage) {
    if (!window.speechSynthesis) {
      toast.error("Text-to-speech is not supported in this browser.");
      return;
    }
    if (speakingId === message.id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message.content);
    utterance.lang = "en-IN";
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    window.speechSynthesis.speak(utterance);
    setSpeakingId(message.id);
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open && (
        <section className="flex h-[min(520px,calc(100vh-120px))] w-[min(360px,calc(100vw-32px))] flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#1d256f]/95 text-white shadow-2xl backdrop-blur-xl" aria-label="CRPF MHS AI companion">
          <header className="flex items-center justify-between border-b border-white/15 px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold">AI Companion</h2>
              <p className="text-xs text-white/65">Private support between check-ins</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close AI companion" className="rounded-md p-1.5 text-white/75 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80">
              <X className="h-4 w-4" />
            </button>
          </header>
          <div className="flex-1 space-y-3 overflow-y-auto p-3" aria-live="polite">
            {messages.length === 0 && <p className="mt-8 text-center text-sm text-white/70">What is on your mind today?</p>}
            {messages.map((message) => (
              <div key={message.id} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[88%] rounded-xl px-3 py-2 text-sm", message.role === "user" ? "bg-white text-[#1d256f]" : "bg-white/12 text-white")}>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  {message.role === "assistant" && (
                    <button type="button" onClick={() => speak(message)} aria-label={speakingId === message.id ? "Stop reading response" : "Read response aloud"} className="mt-2 inline-flex items-center gap-1 text-xs text-white/70 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80">
                      <Volume2 className="h-3.5 w-3.5" /> {speakingId === message.id ? "Stop" : "Read aloud"}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {sending && <p className="text-xs text-white/65">Thinking...</p>}
          </div>
          <div className="border-t border-white/15 p-3">
            <Textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage(); } }} placeholder="Type or speak a message..." aria-label="Message AI companion" className="min-h-16 resize-none border-white/20 bg-white/10 text-white placeholder:text-white/50" />
            <div className="mt-2 flex justify-between gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={toggleListening} aria-label={listening ? "Stop speaking" : "Speak message"} className={cn("text-white hover:bg-white/10 hover:text-white", listening && "text-red-200")}>
                {listening ? <Square className="mr-1.5 h-3.5 w-3.5" /> : <Mic className="mr-1.5 h-3.5 w-3.5" />}
                {listening ? "Stop" : "Speak"}
              </Button>
              <Button type="button" size="sm" onClick={() => void sendMessage()} disabled={sending || !input.trim()} className="bg-white text-[#1d256f] hover:bg-white/90">
                <Send className="mr-1.5 h-3.5 w-3.5" /> Send
              </Button>
            </div>
          </div>
        </section>
      )}
      <button type="button" onClick={() => setOpen((current) => !current)} aria-label={open ? "Close AI companion" : "Open AI companion"} aria-expanded={open} className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#1d256f] text-white shadow-xl ring-2 ring-white/30 transition hover:scale-105 hover:bg-[#151b58] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#d6b45a]">
        <span className="absolute inset-0 rounded-full bg-[#d6b45a]/30 animate-ping motion-reduce:animate-none" aria-hidden="true" />
        {open ? <X className="relative h-6 w-6" /> : <MessageCircle className="relative h-6 w-6" />}
      </button>
    </div>
  );
}
