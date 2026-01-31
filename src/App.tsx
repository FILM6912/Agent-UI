import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { Sidebar } from "@/features/sidebar";
import { ChatInterface, getPresetModels } from "@/features/chat";
import { PreviewWindow } from "@/features/preview";
import { SettingsView } from "@/features/settings";
import { ErrorModal } from "@/components/ErrorModal";
import { LangFlowConfigModal } from "@/components/LangFlowConfigModal";
import { AuthPage } from "@/features/auth";
import {
  Message,
  ChatSession,
  ModelConfig,
  AIProvider,
  MessageVersion,
  Attachment,
} from "@/types";
import {
  streamMessageFromGemini,
  generateChatTitle,
  generateSuggestions,
} from "@/features/chat/api/geminiService";
import { PanelLeft, PanelRight, Trash2 } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { FOLLOW_UPS } from "@/features/chat/data/suggestions";

// Define AppLayout props interface
interface AppLayoutProps {
  showSettings?: boolean;
  isMobile: boolean;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  history: ChatSession[];
  activeChatId: string;
  handleNewChat: () => void;
  handleSelectChat: (id: string) => void;
  onRequestDeleteChat: (id: string) => void;
  modelConfig: ModelConfig;
  handleProviderChange: (provider: AIProvider) => void;
  navigate: (path: string | number) => void;
  setIsAuthenticated: (auth: boolean) => void;
  settingsTab: "general" | "account" | "tools" | "agent" | "langflow";
  setModelConfig: (config: ModelConfig) => void;
  chatHistory: ChatSession[];
  handleClearAllChats: () => void;
  currentMessages: Message[];
  inputValue: string;
  setInputValue: (value: string) => void;
  handleSend: (message: string, attachments?: Attachment[]) => Promise<void>;
  handleRegenerate: (messageId: string) => Promise<void>;
  handleEditUserMessage: (
    messageId: string,
    newContent: string,
  ) => Promise<void>;
  isLoading: boolean;
  isStreaming: boolean;
  handleVersionChange: (messageId: string, newIndex: number) => void;
  isPreviewOpen: boolean;
  handlePreviewRequest: (html: string) => void;
  setIsPreviewOpen: (open: boolean) => void;
  previewContent: string | null;
  chatToDelete: string | null;
  setChatToDelete: (id: string | null) => void;
  t: (key: string) => string;
  confirmDeleteChat: () => void;
  isLangFlowConfigOpen: boolean;
  setIsLangFlowConfigOpen: (open: boolean) => void;
  chatInputRef: React.RefObject<HTMLTextAreaElement>;
}

// AppLayout component extracted outside to prevent recreation
const AppLayout: React.FC<AppLayoutProps> = React.memo(
  ({
    showSettings = false,
    isMobile,
    isSidebarOpen,
    setIsSidebarOpen,
    history,
    activeChatId,
    handleNewChat,
    handleSelectChat,
    onRequestDeleteChat,
    modelConfig,
    handleProviderChange,
    navigate,
    setIsAuthenticated,
    settingsTab,
    setModelConfig,
    chatHistory,
    handleClearAllChats,
    currentMessages,
    inputValue,
    setInputValue,
    handleSend,
    handleRegenerate,
    handleEditUserMessage,
    isLoading,
    isStreaming,
    handleVersionChange,
    isPreviewOpen,
    handlePreviewRequest,
    setIsPreviewOpen,
    previewContent,
    chatToDelete,
    setChatToDelete,
    t,
    confirmDeleteChat,
    isLangFlowConfigOpen,
    setIsLangFlowConfigOpen,
    chatInputRef,
  }) => (
    <div className="flex h-screen w-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-50 overflow-hidden font-sans relative transition-colors duration-200">
      {/* Mobile Sidebar Backdrop */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Hide main Sidebar when Settings is open */}
      {!showSettings && (
        <Sidebar
          history={history}
          activeChatId={activeChatId}
          onNewChat={handleNewChat}
          onSelectChat={handleSelectChat}
          onDeleteChat={onRequestDeleteChat}
          activeProvider={modelConfig.provider}
          onProviderChange={handleProviderChange}
          onOpenSettings={() => {
            navigate("/settings/general");
          }}
          isOpen={isSidebarOpen}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isMobile={isMobile}
          onLogout={() => {
            setIsAuthenticated(false);
            navigate("/login");
          }}
        />
      )}

      <div className="flex-1 flex flex-col h-full min-w-[380px] relative">
        {showSettings ? (
          <SettingsView
            modelConfig={modelConfig}
            onModelConfigChange={setModelConfig}
            onBack={() => navigate("/chat")}
            chatHistory={chatHistory}
            onDeleteChat={onRequestDeleteChat}
            onClearAllChats={handleClearAllChats}
            initialTab={settingsTab}
            onTabChange={(tab) => navigate(`/settings/${tab}`)}
          />
        ) : (
          <>
            <ChatInterface
              messages={currentMessages}
              input={inputValue}
              setInput={setInputValue}
              onSend={handleSend}
              onRegenerate={handleRegenerate}
              onEdit={handleEditUserMessage}
              isLoading={isLoading}
              isStreaming={isStreaming}
              modelConfig={modelConfig}
              onModelConfigChange={setModelConfig}
              onProviderChange={handleProviderChange}
              onVersionChange={handleVersionChange}
              isPreviewOpen={isPreviewOpen}
              onPreviewRequest={handlePreviewRequest}
              onOpenSettings={() => navigate("/settings/general")}
              onLogout={() => {
                setIsAuthenticated(false);
                navigate("/login");
              }}
              textareaRef={chatInputRef}
            />

            {!isPreviewOpen && (
              <button
                onClick={() => setIsPreviewOpen(true)}
                className="absolute top-4 right-3 z-30 p-2.5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                title="Open Preview"
              >
                <PanelRight className="w-4 h-4" />
              </button>
            )}
          </>
        )}
      </div>

      {/* Only show PreviewWindow if Settings are NOT open */}
      {!showSettings && (
        <PreviewWindow
          isOpen={isPreviewOpen}
          onToggle={() => setIsPreviewOpen(!isPreviewOpen)}
          isMobile={isMobile}
          isSidebarOpen={isSidebarOpen}
          previewContent={previewContent}
          isLoading={isLoading || isStreaming}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {chatToDelete && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setChatToDelete(null)}
        >
          <div
            className="bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 w-full max-w-sm rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                {t("common.deleteTitle")}
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
                {t("common.deleteWarning")}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setChatToDelete(null)}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  {t("common.cancel")}
                </button>
                <button
                  onClick={confirmDeleteChat}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-colors"
                >
                  {t("common.delete")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <LangFlowConfigModal
        isOpen={isLangFlowConfigOpen}
        onClose={() => setIsLangFlowConfigOpen(false)}
        currentUrl={modelConfig.langflowUrl || ""}
        onSave={(url) =>
          setModelConfig((prev) => ({ ...prev, langflowUrl: url }))
        }
      />
    </div>
  ),
);

export default function App() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  // Sync URL to State
  useEffect(() => {
    const match = location.pathname.match(/\/chat\/([^/]+)/);
    if (match) {
      const id = match[1];
      if (id !== activeChatId) {
        setActiveChatId(id);
      }
    } else if (location.pathname === "/chat") {
      // On /chat without ID, clear activeChatId
      setActiveChatId("");
    }
  }, [location.pathname]);

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("auth_token") === "true";
  });

  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem("auth_token", "true");
    } else {
      localStorage.removeItem("auth_token");
    }
  }, [isAuthenticated]);

  const initialId = crypto.randomUUID();
  const [sessions, setSessions] = useState<Record<string, ChatSession>>(() => {
    const saved = localStorage.getItem("chat_sessions");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure sessions is valid
        if (
          parsed &&
          typeof parsed === "object" &&
          Object.keys(parsed).length > 0
        ) {
          return parsed;
        }
      } catch (error) {
        console.error("Failed to parse chat sessions:", error);
      }
    }
    // Create initial session
    const newId = crypto.randomUUID();
    return {
      [newId]: {
        id: newId,
        title: "New Task",
        messages: [],
        updatedAt: Date.now(),
      },
    };
  });

  useEffect(() => {
    localStorage.setItem("chat_sessions", JSON.stringify(sessions));
  }, [sessions]);

  const [activeChatId, setActiveChatId] = useState<string>(() => {
    // Get first session ID from sessions
    const sessionIds = Object.keys(sessions);
    return sessionIds.length > 0 ? sessionIds[0] : crypto.randomUUID();
  });
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);

  // Error Modal State
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalConfig, setErrorModalConfig] = useState({
    title: "",
    message: "",
    type: "error" as "error" | "warning",
  });

  // View State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLangFlowConfigOpen, setIsLangFlowConfigOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<
    "general" | "account" | "tools" | "agent" | "langflow"
  >("general");

  // Live Preview Content State
  const [previewContent, setPreviewContent] = useState<string | null>(null);

  // Responsive State
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Initialize responsive state
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        // Don't auto-close if already interacting, but good for initial load
      }
    };

    // Set initial
    const initialMobile = window.innerWidth < 1024;
    setIsMobile(initialMobile);
    setIsSidebarOpen(!initialMobile);
    setIsPreviewOpen(false); // Default to closed

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [modelConfig, setModelConfig] = useState<ModelConfig>(() => {
    // Load LangFlow config from localStorage
    const savedLangflowConfig = localStorage.getItem("langflow_config");
    let langflowUrl = "";
    let langflowApiKey = "";

    if (savedLangflowConfig) {
      try {
        const config = JSON.parse(savedLangflowConfig);
        langflowUrl = config.url || "";
        langflowApiKey = config.apiKey || "";
      } catch (error) {
        console.error("Failed to load LangFlow config:", error);
      }
    }

    return {
      provider: "google",
      baseUrl: "",
      modelId: "", // No default model
      name: "Select Agent", // Placeholder name
      mcpServers: [],
      enabledConnections: [],
      enabledModels: [],
      systemPrompt:
        "You are a helpful AI assistant focused on technical tasks.",
      voiceDelay: 0.5,
      langflowUrl,
      langflowApiKey,
    };
  });

  // Update "New Task" title when language changes for empty sessions
  useEffect(() => {
    setSessions((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((key) => {
        if (updated[key].messages.length === 0) {
          updated[key].title = t("sidebar.newTask");
        }
      });
      return updated;
    });
  }, [t]);

  const history = useMemo(() => {
    return (Object.values(sessions) as ChatSession[]).sort(
      (a: ChatSession, b: ChatSession) => b.updatedAt - a.updatedAt,
    );
  }, [sessions]);

  const currentMessages = useMemo(() => {
    return sessions[activeChatId]?.messages || [];
  }, [sessions, activeChatId]);

  const handleProviderChange = (newProvider: AIProvider) => {
    const models = getPresetModels(t);
    const defaultModel = models[newProvider][0];
    setModelConfig((prev) => ({
      ...prev,
      provider: newProvider,
      modelId: defaultModel.id,
      name: defaultModel.name,
      baseUrl: newProvider === "openai" ? "https://api.openai.com/v1" : "",
    }));
  };

  const handlePreviewRequest = (html: string) => {
    setPreviewContent(html);
    if (!isPreviewOpen && !isSettingsOpen) {
      setIsPreviewOpen(true);
    }
  };

  const executeChatRequest = async (
    prompt: string,
    historyToUse: Message[],
    targetMessageId?: string,
    attachments?: Attachment[],
    chatId?: string,
  ) => {
    // Use provided chatId or fall back to activeChatId
    const sessionId = chatId || activeChatId;

    if (!targetMessageId) {
      setIsLoading(true);
    }

    setIsStreaming(true);

    let assistantMsgId = targetMessageId || crypto.randomUUID();
    let messageInitialized = !!targetMessageId;
    let accumulatedContent = "";

    if (targetMessageId) {
      const existingMsg = historyToUse.find((m) => m.id === targetMessageId);
      if (existingMsg) {
        accumulatedContent = existingMsg.content;
      }
    }

    try {
      // Validate modelConfig before making API call
      if (!modelConfig.modelId) {
        throw new Error(
          "No model selected. Please select a model before sending a message.",
        );
      }

      const stream = streamMessageFromGemini(
        historyToUse,
        prompt,
        modelConfig,
        attachments,
      );
      let isFirstChunk = true;

      for await (const chunk of stream) {
        if (isFirstChunk) {
          setIsLoading(false);
          isFirstChunk = false;
        }

        if (!messageInitialized) {
          const initialAssistantMsg: Message = {
            id: assistantMsgId,
            role: "assistant",
            content: "",
            timestamp: Date.now(),
            steps: chunk.type === "steps" ? chunk.steps : undefined,
            versions: [
              {
                content: "",
                steps: chunk.type === "steps" ? chunk.steps : undefined,
                timestamp: Date.now(),
              },
            ],
            currentVersionIndex: 0,
          };

          // Set initial content if it's a text chunk
          if (chunk.type === "text" && chunk.content) {
            accumulatedContent += chunk.content;
            initialAssistantMsg.content = accumulatedContent;
            if (initialAssistantMsg.versions) {
              initialAssistantMsg.versions[0].content = accumulatedContent;
            }
          }

          setSessions((prev) => {
            // Ensure session exists before updating
            if (!prev[sessionId]) {
              console.error(`Session ${sessionId} not found`);
              return prev;
            }

            return {
              ...prev,
              [sessionId]: {
                ...prev[sessionId],
                messages: [...prev[sessionId].messages, initialAssistantMsg],
              },
            };
          });
          messageInitialized = true;
          // Skip the rest of the loop for this chunk since we already handled it
          continue;
        }

        if (
          (chunk.type === "text" && chunk.content) ||
          chunk.type === "steps"
        ) {
          if (chunk.type === "text" && chunk.content) {
            accumulatedContent += chunk.content;
          }

          setSessions((prev) => {
            const session = prev[sessionId];
            const updatedMessages = session.messages.map((msg) => {
              if (msg.id === assistantMsgId) {
                const updatedVersions = msg.versions ? [...msg.versions] : [];
                const currentIndex = msg.currentVersionIndex ?? 0;

                if (updatedVersions[currentIndex]) {
                  if (chunk.type === "text") {
                    updatedVersions[currentIndex] = {
                      ...updatedVersions[currentIndex],
                      content: accumulatedContent,
                    };
                  } else if (chunk.type === "steps") {
                    updatedVersions[currentIndex] = {
                      ...updatedVersions[currentIndex],
                      steps: chunk.steps,
                    };
                  }
                }

                return {
                  ...msg,
                  content:
                    chunk.type === "text" ? accumulatedContent : msg.content,
                  steps: chunk.type === "steps" ? chunk.steps : msg.steps,
                  versions: updatedVersions,
                };
              }
              return msg;
            });

            return {
              ...prev,
              [sessionId]: {
                ...session,
                messages: updatedMessages,
              },
            };
          });
        }
      }

      // Add suggestions after streaming is complete
      const language = localStorage.getItem("language") === "th" ? "th" : "en";
      let suggestions: string[] = [];

      try {
        // Try AI generation first
        suggestions = await generateSuggestions(historyToUse, prompt, accumulatedContent, modelConfig);
      } catch (e) {
        console.warn("AI generation failed, falling back to random", e);
      }

      // Fallback to random if empty
      if (suggestions.length === 0) {
        const pool = FOLLOW_UPS[language];
        suggestions = [...pool].sort(() => 0.5 - Math.random()).slice(0, 3);
      }

      setSessions((prev) => {
        const session = prev[sessionId];
        if (!session) return prev;

        const updatedMessages = session.messages.map((msg) => {
          if (msg.id === assistantMsgId) {
            return { ...msg, suggestions };
          }
          return msg;
        });

        return {
          ...prev,
          [sessionId]: {
            ...session,
            messages: updatedMessages,
          },
        };
      });

    } catch (error: any) {
      console.error("Error in chat loop:", error);

      const errorMsg = error.message || JSON.stringify(error);
      const isQuotaError =
        errorMsg.includes("429") ||
        errorMsg.includes("quota") ||
        errorMsg.includes("RESOURCE_EXHAUSTED");

      const isModelError =
        errorMsg.includes("model is required") ||
        errorMsg.includes("No model selected");

      // Show error modal instead of alert
      if (isModelError) {
        setErrorModalConfig({
          title: "กรุณาเลือก Model",
          message: "คุณยังไม่ได้เลือก model กรุณาเลือก model ก่อนส่งข้อความ",
          type: "warning",
        });
        setShowErrorModal(true);
      } else if (isQuotaError) {
        setErrorModalConfig({
          title: "API Quota Exceeded",
          message:
            "You have exceeded your request quota. Please check your billing details or try again later.",
          type: "error",
        });
        setShowErrorModal(true);
      } else {
        setErrorModalConfig({
          title: "Error Generating Response",
          message: errorMsg,
          type: "error",
        });
        setShowErrorModal(true);
      }

      // Remove the assistant message if it was initialized but failed
      if (messageInitialized) {
        setSessions((prev) => {
          const session = prev[activeChatId];
          if (!session) return prev;

          return {
            ...prev,
            [activeChatId]: {
              ...session,
              messages: session.messages.filter(
                (msg) => msg.id !== assistantMsgId,
              ),
            },
          };
        });
      }
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const handleSend = async (
    message: string,
    attachments: Attachment[] = [],
  ) => {
    if (
      (!message.trim() && attachments.length === 0) ||
      isLoading ||
      isStreaming
    )
      return;

    // Check if model is selected before sending
    if (!modelConfig.modelId) {
      setErrorModalConfig({
        title: "กรุณาเลือก Model",
        message: "คุณยังไม่ได้เลือก model กรุณาเลือก model ก่อนส่งข้อความ",
        type: "warning",
      });
      setShowErrorModal(true);
      return;
    }

    const currentPrompt = message;
    const isFirstUserMessage = currentMessages.length === 0;

    // Create new chat ID if this is the first message and no active chat
    let chatId = activeChatId;
    if (isFirstUserMessage && (!activeChatId || !sessions[activeChatId])) {
      chatId = crypto.randomUUID();

      // Create new session
      setSessions((prev) => ({
        ...prev,
        [chatId]: {
          id: chatId,
          title: currentPrompt.substring(0, 30),
          messages: [],
          updatedAt: Date.now(),
        },
      }));

      // Navigate to new chat URL with ID
      navigate(`/chat/${chatId}`);
    }

    // Ensure active session exists
    if (!sessions[chatId] && chatId !== activeChatId) {
      // Session was just created, wait for state update
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: currentPrompt,
      attachments: attachments,
      timestamp: Date.now(),
      versions: [
        {
          content: currentPrompt,
          attachments: attachments,
          timestamp: Date.now(),
        },
      ],
      currentVersionIndex: 0,
    };

    setInputValue("");
    // Focus back to textarea after clearing input
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        chatInputRef.current?.focus();
      });
    });
    const historyBeforeNewMessage = [...currentMessages];

    setSessions((prev) => {
      const currentSession = prev[chatId];
      if (!currentSession) {
        console.error("Session not found in setSessions:", chatId);
        return prev;
      }

      return {
        ...prev,
        [chatId]: {
          ...currentSession,
          title: isFirstUserMessage
            ? currentPrompt.substring(0, 30)
            : currentSession.title,
          messages: [...currentSession.messages, userMsg],
          updatedAt: Date.now(),
        },
      };
    });

    if (isFirstUserMessage) {
      generateChatTitle(currentPrompt, modelConfig)
        .then((aiTitle) => {
          setSessions((prev) => {
            if (!prev[chatId]) return prev;
            return {
              ...prev,
              [chatId]: { ...prev[chatId], title: aiTitle },
            };
          });
        })
        .catch(() => { });
    }

    await executeChatRequest(
      currentPrompt,
      historyBeforeNewMessage,
      undefined,
      attachments,
      chatId,
    );
  };

  const handleEditUserMessage = async (
    messageId: string,
    newContent: string,
  ) => {
    if (isLoading || isStreaming) return;

    const msgIndex = currentMessages.findIndex((m) => m.id === messageId);
    if (msgIndex === -1) return;

    const historyToUse = currentMessages.slice(0, msgIndex);
    const originalMsg = currentMessages[msgIndex];

    const nextMsg = currentMessages[msgIndex + 1];
    const targetAssistantId =
      nextMsg && nextMsg.role === "assistant" ? nextMsg.id : undefined;

    setSessions((prev) => {
      const session = prev[activeChatId];
      const updatedMessages = session.messages.map((msg) => {
        if (msg.id === messageId) {
          const currentVersions = msg.versions || [
            {
              content: msg.content,
              attachments: msg.attachments,
              timestamp: msg.timestamp,
            },
          ];
          const newVersion: MessageVersion = {
            content: newContent,
            attachments: msg.attachments,
            timestamp: Date.now(),
          };

          return {
            ...msg,
            content: newContent,
            versions: [...currentVersions, newVersion],
            currentVersionIndex: currentVersions.length,
          };
        }
        if (msg.id === targetAssistantId) {
          const currentVersions = msg.versions || [
            {
              content: msg.content,
              steps: msg.steps,
              timestamp: msg.timestamp,
            },
          ];
          const newVersion: MessageVersion = {
            content: "",
            timestamp: Date.now(),
          };

          return {
            ...msg,
            content: "",
            steps: undefined,
            versions: [...currentVersions, newVersion],
            currentVersionIndex: currentVersions.length,
          };
        }
        return msg;
      });

      return {
        ...prev,
        [activeChatId]: {
          ...session,
          messages: updatedMessages,
        },
      };
    });

    await executeChatRequest(
      newContent,
      historyToUse,
      targetAssistantId,
      originalMsg.attachments,
    );
  };

  const handleRegenerate = async (messageId: string) => {
    if (isLoading || isStreaming) return;

    const msgIndex = currentMessages.findIndex((m) => m.id === messageId);
    if (msgIndex === -1) return;

    const historyToUse = currentMessages.slice(0, msgIndex);
    const lastUserMsg = [...historyToUse]
      .reverse()
      .find((m) => m.role === "user");

    if (!lastUserMsg) return;

    setSessions((prev) => {
      const session = prev[activeChatId];
      const updatedMessages = session.messages.map((msg) => {
        if (msg.id === messageId) {
          const currentVersions = msg.versions || [
            {
              content: msg.content,
              steps: msg.steps,
              timestamp: msg.timestamp,
            },
          ];

          const newVersion: MessageVersion = {
            content: "",
            timestamp: Date.now(),
          };

          return {
            ...msg,
            content: "",
            steps: undefined,
            versions: [...currentVersions, newVersion],
            currentVersionIndex: currentVersions.length,
          };
        }
        return msg;
      });

      return {
        ...prev,
        [activeChatId]: {
          ...session,
          messages: updatedMessages,
        },
      };
    });

    await executeChatRequest(
      lastUserMsg.content,
      historyToUse,
      messageId,
      lastUserMsg.attachments,
    );
  };

  const handleVersionChange = (messageId: string, newIndex: number) => {
    setSessions((prev) => {
      const session = prev[activeChatId];
      const msgIndex = session.messages.findIndex((m) => m.id === messageId);
      if (msgIndex === -1) return prev;

      const targetMsg = session.messages[msgIndex];
      const updates = new Map<string, number>();
      updates.set(messageId, newIndex);

      if (targetMsg.role === "user") {
        const nextMsg = session.messages[msgIndex + 1];
        if (nextMsg && nextMsg.role === "assistant" && nextMsg.versions) {
          if (nextMsg.versions[newIndex]) {
            updates.set(nextMsg.id, newIndex);
          }
        }
      }

      const updatedMessages = session.messages.map((msg) => {
        if (updates.has(msg.id)) {
          const indexToUse = updates.get(msg.id)!;
          if (msg.versions && msg.versions[indexToUse]) {
            const targetVersion = msg.versions[indexToUse];
            return {
              ...msg,
              content: targetVersion.content,
              steps: targetVersion.steps,
              attachments: targetVersion.attachments || msg.attachments,
              currentVersionIndex: indexToUse,
            };
          }
        }
        return msg;
      });

      return {
        ...prev,
        [activeChatId]: {
          ...session,
          messages: updatedMessages,
        },
      };
    });
  };

  const handleNewChat = () => {
    // Navigate to /chat without ID
    navigate("/chat");
    setPreviewContent(null);
    setIsSettingsOpen(false);
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const confirmDeleteChat = () => {
    if (!chatToDelete) return;
    const id = chatToDelete;

    // Close the modal immediately
    setChatToDelete(null);

    setSessions((prev) => {
      const newSessions = { ...prev };
      delete newSessions[id];

      return newSessions;
    });

    // If deleted the active chat, navigate to /chat or another chat
    if (activeChatId === id) {
      const remainingSessions = Object.values(sessions).filter(
        (s) => s.id !== id,
      ) as ChatSession[];

      if (remainingSessions.length === 0) {
        // No chats left, go to /chat
        navigate("/chat");
      } else {
        // Navigate to the most recent chat
        const latest = remainingSessions.sort(
          (a, b) => b.updatedAt - a.updatedAt,
        )[0];
        if (latest) {
          navigate(`/chat/${latest.id}`);
        } else {
          navigate("/chat");
        }
      }
    }
  };

  const onRequestDeleteChat = (id: string) => {
    setChatToDelete(id);
  };

  const handleClearAllChats = () => {
    // Clear all chats and navigate to /chat
    setSessions({});
    navigate("/chat");
    setPreviewContent(null);
  };

  const handleSelectChat = (id: string) => {
    navigate(`/chat/${id}`);
    setPreviewContent(null); // Reset preview on chat switch
    setIsSettingsOpen(false);
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  // If not authenticated, show Auth Page
  // Sync route params to settings state
  useEffect(() => {
    if (location.pathname.startsWith("/settings/")) {
      const tab = location.pathname.split("/")[2] as
        | "general"
        | "account"
        | "tools"
        | "agent"
        | "langflow";
      if (["general", "account", "tools", "agent", "langflow"].includes(tab)) {
        setSettingsTab(tab);
        setIsSettingsOpen(true);
      }
    } else {
      setIsSettingsOpen(false);
    }
  }, [location.pathname]);

  return (
    <>
      <Routes>
        <Route
          path="/login"
          element={
            !isAuthenticated ? (
              <AuthPage
                onLogin={() => {
                  setIsAuthenticated(true);
                }}
              />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/register"
          element={
            !isAuthenticated ? (
              <AuthPage
                onLogin={() => {
                  setIsAuthenticated(true);
                }}
              />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/settings/:tab"
          element={
            isAuthenticated ? (
              <AppLayout
                showSettings={true}
                isMobile={isMobile}
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
                history={history}
                activeChatId={activeChatId}
                handleNewChat={handleNewChat}
                handleSelectChat={handleSelectChat}
                onRequestDeleteChat={onRequestDeleteChat}
                modelConfig={modelConfig}
                handleProviderChange={handleProviderChange}
                navigate={navigate}
                setIsAuthenticated={setIsAuthenticated}
                settingsTab={settingsTab}
                setModelConfig={setModelConfig}
                chatHistory={history}
                handleClearAllChats={handleClearAllChats}
                currentMessages={currentMessages}
                inputValue={inputValue}
                setInputValue={setInputValue}
                handleSend={handleSend}
                handleRegenerate={handleRegenerate}
                handleEditUserMessage={handleEditUserMessage}
                isLoading={isLoading}
                isStreaming={isStreaming}
                handleVersionChange={handleVersionChange}
                isPreviewOpen={isPreviewOpen}
                handlePreviewRequest={handlePreviewRequest}
                setIsPreviewOpen={setIsPreviewOpen}
                previewContent={previewContent}
                chatToDelete={chatToDelete}
                setChatToDelete={setChatToDelete}
                t={t}
                confirmDeleteChat={confirmDeleteChat}
                isLangFlowConfigOpen={isLangFlowConfigOpen}
                setIsLangFlowConfigOpen={setIsLangFlowConfigOpen}
                chatInputRef={chatInputRef}
              />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/chat/:chatId"
          element={
            isAuthenticated ? (
              <AppLayout
                showSettings={false}
                isMobile={isMobile}
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
                history={history}
                activeChatId={activeChatId}
                handleNewChat={handleNewChat}
                handleSelectChat={handleSelectChat}
                onRequestDeleteChat={onRequestDeleteChat}
                modelConfig={modelConfig}
                handleProviderChange={handleProviderChange}
                navigate={navigate}
                setIsAuthenticated={setIsAuthenticated}
                settingsTab={settingsTab}
                setModelConfig={setModelConfig}
                chatHistory={history}
                handleClearAllChats={handleClearAllChats}
                currentMessages={currentMessages}
                inputValue={inputValue}
                setInputValue={setInputValue}
                handleSend={handleSend}
                handleRegenerate={handleRegenerate}
                handleEditUserMessage={handleEditUserMessage}
                isLoading={isLoading}
                isStreaming={isStreaming}
                handleVersionChange={handleVersionChange}
                isPreviewOpen={isPreviewOpen}
                handlePreviewRequest={handlePreviewRequest}
                setIsPreviewOpen={setIsPreviewOpen}
                previewContent={previewContent}
                chatToDelete={chatToDelete}
                setChatToDelete={setChatToDelete}
                t={t}
                confirmDeleteChat={confirmDeleteChat}
                isLangFlowConfigOpen={isLangFlowConfigOpen}
                setIsLangFlowConfigOpen={setIsLangFlowConfigOpen}
                chatInputRef={chatInputRef}
              />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/chat"
          element={
            isAuthenticated ? (
              <AppLayout
                showSettings={false}
                isMobile={isMobile}
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
                history={history}
                activeChatId=""
                handleNewChat={handleNewChat}
                handleSelectChat={handleSelectChat}
                onRequestDeleteChat={onRequestDeleteChat}
                modelConfig={modelConfig}
                handleProviderChange={handleProviderChange}
                navigate={navigate}
                setIsAuthenticated={setIsAuthenticated}
                settingsTab={settingsTab}
                setModelConfig={setModelConfig}
                chatHistory={history}
                handleClearAllChats={handleClearAllChats}
                currentMessages={[]}
                inputValue={inputValue}
                setInputValue={setInputValue}
                handleSend={handleSend}
                handleRegenerate={handleRegenerate}
                handleEditUserMessage={handleEditUserMessage}
                isLoading={isLoading}
                isStreaming={isStreaming}
                handleVersionChange={handleVersionChange}
                isPreviewOpen={isPreviewOpen}
                handlePreviewRequest={handlePreviewRequest}
                setIsPreviewOpen={setIsPreviewOpen}
                previewContent={previewContent}
                chatToDelete={chatToDelete}
                setChatToDelete={setChatToDelete}
                t={t}
                confirmDeleteChat={confirmDeleteChat}
                isLangFlowConfigOpen={isLangFlowConfigOpen}
                setIsLangFlowConfigOpen={setIsLangFlowConfigOpen}
                chatInputRef={chatInputRef}
              />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/chat" replace />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      {/* Error Modal - Outside Routes */}
      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title={errorModalConfig.title}
        message={errorModalConfig.message}
        type={errorModalConfig.type}
      />
    </>
  );
}
