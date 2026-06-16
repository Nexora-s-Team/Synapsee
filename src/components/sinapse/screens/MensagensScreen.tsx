import { ArrowRight, MessageSquare } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TopBar } from "../TopBar";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const formatAiAnswer = (text: string) => {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/(^|\n)[ \t]*[-*+][ \t]*/g, "$1• ")
    .replace(/(^|\n)\s*(\d+)\.\s*/g, "$1$2. ")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

export const MensagensScreen = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Olá! Sou o assistente Synapsia. Pergunte sobre o app, notas, avisos ou funcionalidades.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);
  const typingIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) {
        window.clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }
    };
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.content }),
      });

      const data = await response.json();
      const answer = data.answer ?? "Desculpe, não consegui responder agora.";
      const formattedAnswer = formatAiAnswer(answer);
      console.log("IA raw answer:", answer);
      console.log("IA formatted answer:", formattedAnswer);

      // Add placeholder assistant message and reveal text progressively
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
      setTyping(true);

      // reveal in chunks to keep it responsive for long answers
      const total = formattedAnswer.length;
      let index = 0;
      const chunkSize = total > 800 ? 3 : 1;
      const intervalMs = 18; // typing speed

      if (typingIntervalRef.current) {
        window.clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }

      typingIntervalRef.current = window.setInterval(() => {
        index = Math.min(total, index + chunkSize);
        const current = formattedAnswer.slice(0, index);
        setMessages((prev) => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          updated[lastIndex] = { ...updated[lastIndex], content: current };
          return updated;
        });
        endRef.current?.scrollIntoView({ behavior: "smooth" });

        if (index >= total) {
          if (typingIntervalRef.current) {
            window.clearInterval(typingIntervalRef.current);
            typingIntervalRef.current = null;
          }
          setTyping(false);
          setLoading(false);
        }
      }, intervalMs);
    } catch (error) {
      if (typingIntervalRef.current) {
        window.clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }
      setTyping(false);
      setLoading(false);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Erro ao conectar com a IA. Tente novamente." },
      ]);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full flex-col">
      <TopBar
        showLogo={false}
        title="synapsIA"
        rightSlot={<MessageSquare className="h-5 w-5" />}
      />

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`max-w-[80%] rounded-2xl p-3 text-sm break-words whitespace-pre-wrap ${
              message.role === "user"
                ? "ml-auto bg-primary text-primary-foreground"
                : "mr-auto bg-muted text-foreground"
            }`}
          >
            {message.content}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="border-t border-border bg-background px-4 py-3">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte sobre notas, avisos, uso do app..."
            className="min-h-[72px]"
            disabled={loading || typing}
          />
          <Button
            onClick={handleSend}
            disabled={loading || typing || !input.trim()}
            className="whitespace-nowrap"
          >
            {typing ? "Digitando..." : loading ? "Enviando..." : <ArrowRight className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};
