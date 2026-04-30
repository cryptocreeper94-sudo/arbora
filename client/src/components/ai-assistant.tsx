import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function AiAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hey there! I'm Evergreen, your outdoor adventure guide. Ask me about trails, camping, wildlife, gear, or anything nature-related!" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = { role: "user", content: trimmed };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await apiRequest("POST", "/api/assistant/chat", {
        messages: updatedMessages,
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Oops! I had a little stumble on the trail. Could you try asking again?" }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            onClick={() => setIsOpen(true)}
            className="fixed right-4 bottom-20 lg:bottom-6 z-[60] w-16 h-16 rounded-full flex items-center justify-center cursor-pointer group"
            data-testid="button-open-assistant"
            style={{ background: "transparent" }}
          >
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              className="relative"
            >
              <img
                src="/images/verdara-assistant.png"
                alt="Evergreen Assistant"
                className="w-16 h-16 object-contain drop-shadow-[0_4px_12px_rgba(16,185,129,0.4)]"
              />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-background animate-pulse" />
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[380px] z-[70] flex flex-col bg-background/95 backdrop-blur-2xl border-l border-white/10 shadow-2xl"
            data-testid="panel-assistant"
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
              <motion.div
                animate={{ y: [0, -3, 0] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              >
                <img
                  src="/images/verdara-assistant.png"
                  alt="Evergreen"
                  className="w-10 h-10 object-contain"
                />
              </motion.div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-foreground">Evergreen</h3>
                <p className="text-[11px] text-emerald-400">Outdoor Adventure Guide</p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground"
                data-testid="button-close-assistant"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <img
                      src="/images/verdara-assistant.png"
                      alt=""
                      className="w-7 h-7 object-contain mr-2 mt-1 flex-shrink-0"
                    />
                  )}
                  <div
                    className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-emerald-500 text-white rounded-br-md"
                        : "bg-white/5 border border-white/10 text-foreground rounded-bl-md"
                    }`}
                    data-testid={`chat-message-${msg.role}-${i}`}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <img
                    src="/images/verdara-assistant.png"
                    alt=""
                    className="w-7 h-7 object-contain mr-2 mt-1 flex-shrink-0"
                  />
                  <div className="bg-white/5 border border-white/10 rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex gap-1.5">
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} className="w-2 h-2 rounded-full bg-emerald-400" />
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 rounded-full bg-emerald-400" />
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 rounded-full bg-emerald-400" />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="px-4 py-3 border-t border-white/10">
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Evergreen anything..."
                  className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground min-w-0"
                  disabled={isLoading}
                  data-testid="input-assistant-message"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  className="text-emerald-400 hover:text-emerald-300 flex-shrink-0"
                  data-testid="button-send-message"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground text-center mt-2">Powered by Verdara AI</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-[65] lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
