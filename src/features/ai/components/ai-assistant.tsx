"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AnimatePresence, motion } from "framer-motion";

import {
  Check,
  Copy,
  Plus,
  RotateCcw,
  Send,
  Sparkles,
  X,
} from "lucide-react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  isError?: boolean;
  suggestions?: string[];
};

type AIAssistantProps = {
  open: boolean;
  onClose: () => void;
};

const INITIAL_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi, I'm your Warehouse AI Assistant. I can search inventory, find where items are stored, list stock still waiting to be allocated, and explain warehouse capacity. I only read data; I never change it.",
};

const SUGGESTED_QUESTIONS = [
  "Where are the laptops stored?",
  "Which items are unallocated?",
  "Which items are fully stored?",
  "Which storage spaces have available capacity?",
];

export function AIAssistant({
  open,
  onClose,
}: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    INITIAL_MESSAGE,
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedMessageId, setCopiedMessageId] =
    useState<string | null>(null);

  const inputRef =
    useRef<HTMLTextAreaElement>(null);

  const messagesRef =
    useRef<HTMLDivElement>(null);

  // Scroll the list itself: scrollIntoView would also scroll the page behind the drawer.
  const scrollToBottom = useCallback(() => {
    const list = messagesRef.current;

    if (!list) {
      return;
    }

    list.scrollTo({
      top: list.scrollHeight,
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  // Lock page scroll while the drawer is open.
  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const timeout = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 150);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (
      event: globalThis.KeyboardEvent,
    ) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [open, onClose]);

  const startNewConversation = () => {
    if (loading) {
      return;
    }

    setMessages([INITIAL_MESSAGE]);
    setInput("");
    setCopiedMessageId(null);

    window.setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();

    if (!trimmed || loading) {
      return;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };

    const conversation = [
      ...messages
        .filter(
          (message) => !message.isError,
        )
        .map((message) => ({
          role: message.role,
          content: message.content,
        })),
      {
        role: userMessage.role,
        content: userMessage.content,
      },
    ];

    setMessages((current) => [
      ...current,
      userMessage,
    ]);

    setInput("");
    setLoading(true);

    try {
      const response = await fetch(
        "/api/ai/chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: conversation,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Something went wrong while contacting the AI.",
        );
      }

      if (
        !data?.response ||
        typeof data.response !== "string"
      ) {
        throw new Error(
          "The AI returned an empty response.",
        );
      }

      const suggestions = Array.isArray(
        data.suggestions,
      )
        ? data.suggestions
            .filter(
              (entry: unknown): entry is string =>
                typeof entry === "string" &&
                entry.trim().length > 0,
            )
            .slice(0, 3)
        : [];

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.response,
        suggestions,
      };

      setMessages((current) => [
        ...current,
        assistantMessage,
      ]);
    } catch (error) {
      console.error(
        "AI assistant error:",
        error,
      );

      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          error instanceof Error
            ? error.message
            : "I couldn't process that request. Please try again.",
        isError: true,
      };

      setMessages((current) => [
        ...current,
        errorMessage,
      ]);
    } finally {
      setLoading(false);

      window.setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const retryLastMessage = () => {
    if (loading) {
      return;
    }

    const lastUserMessage = [...messages]
      .reverse()
      .find(
        (message) =>
          message.role === "user",
      );

    if (!lastUserMessage) {
      return;
    }

    const lastErrorIndex = [...messages]
      .map((message, index) => ({
        message,
        index,
      }))
      .reverse()
      .find(
        ({ message }) =>
          message.isError &&
          message.role === "assistant",
      )?.index;

    if (lastErrorIndex !== undefined) {
      setMessages((current) =>
        current.filter(
          (_, index) =>
            index !== lastErrorIndex,
        ),
      );
    }

    sendMessage(lastUserMessage.content);
  };

  const copyMessage = async (
    message: Message,
  ) => {
    try {
      await navigator.clipboard.writeText(
        message.content,
      );

      setCopiedMessageId(message.id);

      window.setTimeout(() => {
        setCopiedMessageId(null);
      }, 1500);
    } catch (error) {
      console.error(
        "Failed to copy message:",
        error,
      );
    }
  };

  const handleInputKeyDown = (
    event: ReactKeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      if (!loading) {
        sendMessage(input);
      }
    }
  };

  /** The newest successful answer; only it shows follow-up suggestions. */
  const latestAnswerId = [...messages]
    .reverse()
    .find(
      (message) =>
        message.role === "assistant" &&
        !message.isError &&
        message.id !== INITIAL_MESSAGE.id,
    )?.id;

  const handleSuggestedQuestion = (
    question: string,
  ) => {
    sendMessage(question);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[80] bg-black/20 backdrop-blur-[2px] lg:bg-black/10"
          />

          <motion.aside
            data-ai-drawer
            initial={{
              x: "100%",
              opacity: 0.8,
            }}
            animate={{
              x: 0,
              opacity: 1,
            }}
            exit={{
              x: "100%",
              opacity: 0.8,
            }}
            transition={{
              type: "spring",
              stiffness: 380,
              damping: 38,
            }}
            className="fixed right-0 top-0 z-[90] flex h-dvh w-full flex-col border-l border-slate-200 bg-white shadow-2xl sm:w-[480px] lg:w-[520px] dark:border-slate-800 dark:bg-slate-950"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-muted text-accent">
                  <Sparkles className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                      Warehouse AI
                    </h2>

                    <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Online
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Ask about your warehouse
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={
                    startNewConversation
                  }
                  disabled={loading}
                  title="New conversation"
                  aria-label="Start new conversation"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  <Plus className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  title="Close assistant"
                  aria-label="Close assistant"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div
              ref={messagesRef}
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
            >
              <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 py-5">
                {messages.map((message) => {
                  const isUser =
                    message.role === "user";

                  return (
                    <div
                      key={message.id}
                      className={`group flex ${
                        isUser
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`flex max-w-[92%] gap-2.5 ${
                          isUser
                            ? "flex-row-reverse"
                            : "flex-row"
                        }`}
                      >
                        <div
                          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                            isUser
                              ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                              : message.isError
                                ? "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400"
                                : "bg-accent-muted text-accent"
                          }`}
                        >
                          {isUser ? (
                            <span className="text-xs font-semibold">
                              You
                            </span>
                          ) : (
                            <Sparkles className="h-4 w-4" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div
                            className={`rounded-2xl px-4 py-3 ${
                              isUser
                                ? "rounded-tr-md bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                                : message.isError
                                  ? "rounded-tl-md border border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300"
                                  : "rounded-tl-md bg-slate-50 text-slate-800 dark:bg-slate-900 dark:text-slate-200"
                            }`}
                          >
                            {isUser ? (
                              <p className="whitespace-pre-wrap text-sm leading-6">
                                {message.content}
                              </p>
                            ) : (
                              <div className="prose prose-sm max-w-none break-words dark:prose-invert">
                                <ReactMarkdown
                                  remarkPlugins={[
                                    remarkGfm,
                                  ]}
                                  components={{
                                    table({
                                      children,
                                    }) {
                                      return (
                                        <div className="my-3 w-full overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                                          <table className="min-w-full border-collapse text-left text-xs">
                                            {children}
                                          </table>
                                        </div>
                                      );
                                    },

                                    thead({
                                      children,
                                    }) {
                                      return (
                                        <thead className="bg-slate-100 dark:bg-slate-800">
                                          {children}
                                        </thead>
                                      );
                                    },

                                    th({
                                      children,
                                    }) {
                                      return (
                                        <th className="whitespace-nowrap border-b border-slate-200 px-3 py-2 font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">
                                          {children}
                                        </th>
                                      );
                                    },

                                    td({
                                      children,
                                    }) {
                                      return (
                                        <td className="whitespace-nowrap border-b border-slate-100 px-3 py-2 dark:border-slate-800">
                                          {children}
                                        </td>
                                      );
                                    },

                                    p({
                                      children,
                                    }) {
                                      return (
                                        <p className="mb-2 last:mb-0 leading-6">
                                          {children}
                                        </p>
                                      );
                                    },

                                    ul({
                                      children,
                                    }) {
                                      return (
                                        <ul className="my-2 list-disc space-y-1 pl-5">
                                          {children}
                                        </ul>
                                      );
                                    },

                                    ol({
                                      children,
                                    }) {
                                      return (
                                        <ol className="my-2 list-decimal space-y-1 pl-5">
                                          {children}
                                        </ol>
                                      );
                                    },

                                    code({
                                      children,
                                    }) {
                                      return (
                                        <code className="rounded bg-slate-200 px-1.5 py-0.5 text-[11px] dark:bg-slate-800">
                                          {children}
                                        </code>
                                      );
                                    },
                                  }}
                                >
                                  {message.content}
                                </ReactMarkdown>
                              </div>
                            )}
                          </div>

                          {!isUser &&
                            !message.isError && (
                              <div className="mt-1 flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                                <button
                                  type="button"
                                  onClick={() =>
                                    copyMessage(
                                      message,
                                    )
                                  }
                                  className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                >
                                  {copiedMessageId ===
                                  message.id ? (
                                    <>
                                      <Check className="h-3 w-3" />
                                      Copied
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-3 w-3" />
                                      Copy
                                    </>
                                  )}
                                </button>
                              </div>
                            )}

                          {!isUser &&
                            !message.isError &&
                            !loading &&
                            message.id ===
                              latestAnswerId &&
                            message.suggestions &&
                            message.suggestions.length >
                              0 && (
                              <div className="mt-3">
                                <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                  <Sparkles className="h-3 w-3" />
                                  You might also ask
                                </p>

                                <div className="flex flex-wrap gap-1.5">
                                  {message.suggestions.map(
                                    (suggestion) => (
                                      <button
                                        key={suggestion}
                                        type="button"
                                        onClick={() =>
                                          handleSuggestedQuestion(
                                            suggestion,
                                          )
                                        }
                                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-left text-xs text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:hover:text-white"
                                      >
                                        {suggestion}
                                      </button>
                                    ),
                                  )}
                                </div>
                              </div>
                            )}

                          {message.isError && (
                            <button
                              type="button"
                              onClick={
                                retryLastMessage
                              }
                              disabled={loading}
                              className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                              <RotateCcw className="h-3 w-3" />
                              Try again
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {loading && (
                  <div className="flex justify-start">
                    <div className="flex max-w-[92%] gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-muted text-accent">
                        <Sparkles className="h-4 w-4" />
                      </div>

                      <div className="rounded-2xl rounded-tl-md bg-slate-50 px-4 py-3 dark:bg-slate-900">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-3.5 w-3.5 animate-pulse text-slate-500" />

                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            Checking warehouse data...
                          </span>

                          <div className="flex gap-1">
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {messages.length === 1 &&
              !loading && (
                <div className="shrink-0 border-t border-slate-100 px-4 py-3 dark:border-slate-800">
                  <div className="mb-2 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-slate-500" />

                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Try asking
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {SUGGESTED_QUESTIONS.map(
                      (question) => (
                        <button
                          key={question}
                          type="button"
                          onClick={() =>
                            handleSuggestedQuestion(
                              question,
                            )
                          }
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-xs text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:hover:text-white"
                        >
                          {question}
                        </button>
                      ),
                    )}
                  </div>
                </div>
              )}

            <div className="shrink-0 border-t border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2 transition focus-within:border-slate-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:focus-within:border-slate-500 dark:focus-within:bg-slate-950 dark:focus-within:ring-slate-800">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(event) =>
                    setInput(event.target.value)
                  }
                  onKeyDown={
                    handleInputKeyDown
                  }
                  disabled={loading}
                  rows={1}
                  placeholder="Ask about your warehouse..."
                  aria-label="Ask Warehouse AI"
                  className="max-h-32 min-h-[44px] w-full resize-none bg-transparent px-2 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50 dark:text-white"
                />

                <div className="flex items-center justify-between px-1 pt-1">
                  <span className="text-[10px] text-slate-400">
                    Enter to send · Shift + Enter for new line
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      sendMessage(input)
                    }
                    disabled={
                      loading ||
                      !input.trim()
                    }
                    aria-label="Send message"
                    title="Send message"
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}