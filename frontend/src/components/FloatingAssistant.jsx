import { useEffect, useMemo, useState } from "react";
import { askAssistant, fetchAssistantStatus } from "../services/reconApi";

function AssistantBubble({ onClick }) {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="pointer-events-none absolute -inset-2 rounded-full bg-cyan-400/20 blur-md" />
      <button
        onClick={onClick}
        className="relative flex h-14 w-14 items-center justify-center rounded-full border border-cyan-300/40 bg-[radial-gradient(circle_at_30%_30%,#1d4f5f_0%,#0b2030_55%,#081521_100%)] text-cyan-100 shadow-[0_10px_28px_rgba(0,0,0,0.4),0_0_22px_rgba(34,211,238,0.35)] transition duration-200 hover:-translate-y-0.5 hover:border-cyan-200/70 hover:shadow-[0_12px_34px_rgba(0,0,0,0.45),0_0_30px_rgba(34,211,238,0.45)] focus:outline-none focus:ring-2 focus:ring-cyan-300/40"
        aria-label="Open AI assistant"
        title="AI Assistant"
      >
        <span className="absolute inset-1 rounded-full border border-cyan-200/20" />
        <svg
          viewBox="0 0 24 24"
          className="relative h-6 w-6"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M8 10.5a.75.75 0 0 1 .75-.75h.01a.75.75 0 0 1 0 1.5h-.01A.75.75 0 0 1 8 10.5Zm3.25 0a.75.75 0 0 1 .75-.75h.01a.75.75 0 0 1 0 1.5H12a.75.75 0 0 1-.75-.75Zm4 0a.75.75 0 0 1 .75-.75h.01a.75.75 0 0 1 0 1.5H16a.75.75 0 0 1-.75-.75Z"
            fill="currentColor"
          />
          <path
            d="M12 3.75c-4.97 0-9 3.24-9 7.25 0 2.08 1.1 3.95 2.88 5.26v3.74l3.62-2.12c.49.08.99.12 1.5.12 4.97 0 9-3.24 9-7.25s-4.03-7.25-9-7.25Z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}

export default function FloatingAssistant({ currentUser }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [modelError, setModelError] = useState("");
  const [assistantState, setAssistantState] = useState("loading");
  const [assistantModel, setAssistantModel] = useState("fallback");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi, I am your ReconPlus assistant. Ask me about risk score, vulnerabilities, or remediation from your latest scan.",
    },
  ]);

  const modelHint = useMemo(() => {
    const modelMessage = messages.find((m) => m.role === "meta");
    return modelMessage ? modelMessage.text : "";
  }, [messages]);

  useEffect(() => {
    if (!open) {
      return;
    }

    let active = true;

    const refreshStatus = async () => {
      try {
        const status = await fetchAssistantStatus(currentUser);
        if (!active) return;
        setAssistantState(status?.state || "fallback");
        setAssistantModel(status?.model || "fallback");
        setModelError(status?.model_error || "");
      } catch (_error) {
        if (!active) return;
        setAssistantState("fallback");
      }
    };

    refreshStatus();

    // Keep active polling only while model is loading.
    if (assistantState !== "loading") {
      return () => {
        active = false;
      };
    }

    const timer = setInterval(refreshStatus, 5000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [currentUser, open, assistantState]);

  const stateBadgeClass =
    assistantState === "ready"
      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40"
      : assistantState === "loading"
        ? "bg-amber-500/20 text-amber-300 border border-amber-400/40"
        : "bg-slate-500/20 text-slate-300 border border-slate-400/40";

  const stateLabel =
    assistantState === "ready"
      ? "Model Ready"
      : assistantState === "loading"
        ? "Model Loading"
        : "Fallback Mode";

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", text }]);
    setLoading(true);

    try {
      const response = await askAssistant(text, currentUser);
      const reply = response?.reply || "No response from assistant.";
      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
      setModelError(response?.model_error || "");

      if (response?.model || response?.source) {
        const modeText = `Mode: ${response?.source || "fallback"} | Model: ${response?.model || "fallback"}`;
        setMessages((prev) => {
          const withoutMeta = prev.filter((m) => m.role !== "meta");
          return [...withoutMeta, { role: "meta", text: modeText }];
        });
      }
    } catch (error) {
      setModelError("");
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: error.message || "Assistant request failed." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <AssistantBubble onClick={() => setOpen((prev) => !prev)} />

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[min(92vw,400px)] h-[min(78vh,560px)] bg-[linear-gradient(180deg,#0d1426_0%,#07101d_100%)] border border-cyan-500/40 rounded-2xl shadow-[0_0_24px_rgba(6,182,212,0.35)] overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-cyan-500/30 flex items-center justify-between">
            <div>
              <h3 className="text-cyan-300 font-semibold">ReconPlus AI Assistant</h3>
              <span className={`inline-block mt-1 text-[11px] px-2 py-0.5 rounded-full ${stateBadgeClass}`}>
                {stateLabel}
              </span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-slate-300 hover:text-white"
              aria-label="Close AI assistant"
            >
              ×
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
            {messages
              .filter((message) => message.role !== "meta")
              .map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`rounded-xl px-3 py-2 text-sm leading-relaxed ${
                    message.role === "user"
                      ? "ml-8 bg-cyan-500/20 border border-cyan-400/30"
                      : "mr-8 bg-slate-800/70 border border-slate-600/40"
                  }`}
                >
                  {message.text}
                </div>
              ))}

            {loading && (
              <div className="mr-8 bg-slate-800/70 border border-slate-600/40 rounded-xl px-3 py-2 text-sm text-slate-300">
                Thinking...
              </div>
            )}
          </div>

          <div className="border-t border-cyan-500/30 p-3 bg-[#07101d]">
            {modelHint && <p className="text-[11px] text-slate-400 mb-2">{modelHint}</p>}
            {modelError && (
              <p className="text-[11px] text-amber-300 mb-2">
                Model note: {modelError}
              </p>
            )}
            <p className="text-[11px] text-slate-500 mb-2">
              Backend state: {assistantState} | Model: {assistantModel}
            </p>
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={onKeyDown}
                rows={2}
                placeholder="Ask about latest scan findings..."
                className="flex-1 resize-none bg-[#0b1321] border border-cyan-500/30 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
              />
              <button
                onClick={handleSend}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 text-[#03141a] font-semibold"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
