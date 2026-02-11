import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
  NavigateFunction,
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
  fetchHistoryFromLangFlow,
  fetchAllSessionsFromLangFlow,
  deleteSession,
} from "@/features/chat/api/langflowService";
import { PanelRight, Trash2 } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { FOLLOW_UPS } from "@/features/chat/data/suggestions";
import { generateUUID } from "@/lib/utils";

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
  navigate: NavigateFunction;
  setIsAuthenticated: (auth: boolean) => void;
  settingsTab: "general" | "account" | "tools" | "agent" | "langflow";
  setModelConfig: React.Dispatch<React.SetStateAction<ModelConfig>>;
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
  chatInputRef: React.RefObject<HTMLTextAreaElement | null>;
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
          steps={currentMessages.length > 0 ? (
            (() => {
              const assistantMessages = [...currentMessages].reverse().filter(m => m.role === 'assistant');
              return assistantMessages.length > 0 ? assistantMessages[0].steps : undefined;
            })()
          ) : undefined}
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
    console.log('>>> URL Sync: pathname changed:', location.pathname);
    const match = location.pathname.match(/\/chat\/([^/]+)/);
    if (match) {
      const id = decodeURIComponent(match[1]);
      console.log('>>> URL Sync: Matched ID:', id, 'Current activeChatId:', activeChatId);
      if (id !== activeChatId) {
        console.log('>>> URL Sync: Updating activeChatId to:', id);
        setActiveChatId(id);
      }
    } else if (location.pathname === "/chat") {
      // On /chat without ID, clear activeChatId
      console.log('>>> URL Sync: /chat detected, clearing activeChatId');
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

  // Sessions now start empty, populated via API
  const [sessions, setSessions] = useState<Record<string, ChatSession>>({});

  // No longer saving sessions to localStorage (User Request: LangFlow source of truth)
  /*
  useEffect(() => {
    try {
      localStorage.setItem("chat_sessions", JSON.stringify(sessions));
    } catch (e) {
      // Quota exceeded is common with large images
      console.warn("Local storage is full. Old data might not be persisted.");
    }
  }, [sessions]);
  */



  const [activeChatId, setActiveChatId] = useState<string>(() => {
    // Get first session ID from sessions
    const sessionIds = Object.keys(sessions);
    return sessionIds.length > 0 ? sessionIds[0] : generateUUID();
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
    let apiType: 'langflow' | 'openai' = 'langflow';

    if (savedLangflowConfig) {
      try {
        const config = JSON.parse(savedLangflowConfig);
        langflowUrl = config.url || "";
        langflowApiKey = config.apiKey || "";
        apiType = config.apiType || "langflow";
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
      apiType,
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

  // Fetch ALL sessions on mount/config change (Replaces local storage logic)
  // Ref for checking streaming status in useEffects without dependency
  const isStreamingRef = useRef(isStreaming);
  useEffect(() => {
    isStreamingRef.current = isStreaming;
  }, [isStreaming]);

  // Fetch ALL sessions on mount/config change (Replaces local storage logic)
  useEffect(() => {
    console.log('>>> App.tsx: useEffect [modelConfig] triggered', modelConfig);

    // Initial load check: ensure we have URL
    if (!modelConfig.langflowUrl) {
      console.warn('>>> App.tsx: Missing LangFlow URL, skipping fetch.');
      return;
    }

    if (!modelConfig.modelId) {
      console.warn('>>> App.tsx: Missing Model ID, skipping fetch.');
      return;
    }

    const loadSessions = async () => {
      console.log('>>> App.tsx: loadSessions starting...');
      // If we are currently streaming, we might not want to fetch right now to avoid state clobbering
      // or we should be very careful about merging.
      // Ideally, we shouldn't act on stale fetches if streaming started.

      const fetchedSessions = await fetchAllSessionsFromLangFlow(modelConfig);
      console.log('>>> App.tsx: fetchedSessions count:', fetchedSessions.length);

      if (fetchedSessions.length > 0) {
        setSessions(prev => {
          const newSessionsMap: Record<string, ChatSession> = {};
          fetchedSessions.forEach(s => newSessionsMap[s.id] = s);

          // If streaming, PRESERVE the active session from local state entirely
          if (isStreamingRef.current && activeChatId && prev[activeChatId]) {
            console.log('>>> App.tsx: Streaming in progress, preserving active session', activeChatId);
            newSessionsMap[activeChatId] = prev[activeChatId];
          }
          // Also preserve local-only sessions (optimistic ones)
          else if (activeChatId && prev[activeChatId] && !newSessionsMap[activeChatId]) {
            newSessionsMap[activeChatId] = prev[activeChatId];
          }

          return newSessionsMap;
        });

        // If active chat is empty or not in list, select latest
        // This relies on state update which hasn't happened yet, so we use fetchedSessions
        if (!activeChatId || !fetchedSessions.find(s => s.id === activeChatId)) {
          if (fetchedSessions.length > 0) {
            // We should probably wait for sessions to update?
            // Or just set it.
            setActiveChatId(fetchedSessions[0].id);
          }
        }
      } else {
        // No sessions from API.
        // If we have nothing locally either, create new.
        setSessions(prev => {
          if (Object.keys(prev).length === 0) {
            const newId = generateUUID();
            // Schedule activeChatId update
            setTimeout(() => setActiveChatId(newId), 0);
            return {
              [newId]: {
                id: newId,
                title: "New Task",
                messages: [],
                updatedAt: Date.now()
              }
            };
          }
          return prev;
        });
      }
    };

    loadSessions();
  }, [activeChatId, modelConfig.langflowUrl, modelConfig.modelId]);

  // Fetch History from LangFlow (Existing one, maybe redundant now?)

  // Fetch History from LangFlow (Existing one, maybe redundant now?)
  // Actually, fetchAllSessionsFromLangFlow gets the *list* and *messages* (if we implemented it to populate messages).
  // My implementation of fetchAllSessionsFromLangFlow DOES populate messages.
  // So the per-chat fetch might be redundant OR useful for refreshing just one chat.
  // The per-chat fetch is triggered by activeChatId change.
  // Let's KEPP it for now to ensure we get fresh messages when switching, 
  // although fetchAllSessions already got them. 
  // Actually, fetchAllSessions is heavy. 
  // Maybe we should ONLY fetch headers in fetchAllSessions? 
  // Current implementation fetches ALL messages and groups them. 
  // So we have the data.
  // But the existing `fetchHistoryFromLangFlow` hook (below) updates `sessions` again.
  // That's fine, it acts as a "refresh on select".
  useEffect(() => {
    if (!activeChatId || !modelConfig.langflowUrl || !modelConfig.modelId) return;

    const loadHistory = async () => {
      // Don't overwrite if we're currently streaming the active chat
      if (isStreamingRef.current) {
        console.log('>>> loadHistory: Skipping sync - streaming in progress');
        return;
      }

      // Create a local variable or ref to avoid race conditions if needed
      // For now, simpler is better.
      const messages = await fetchHistoryFromLangFlow(modelConfig, activeChatId);

        setSessions(prev => {
          const currentSession = prev[activeChatId];

          // If session doesn't exist in our map yet, and we got no messages, ignore.
          if (!currentSession && messages.length === 0) return prev;

          // Merge messages to avoid losing local state
          // Trust server messages but keep unique local messages (e.g. while still optimistic)
          // For now, just trust server if more than 0 messages, but AVOID overwrite if local has more or same
          if (messages.length > 0) {
            // Check if server messages are different from what we have
            const serverCount = messages.length;
            const localCount = currentSession?.messages.length || 0;

            // If we are currently in this chat and local messages are same as server, skip update
            if (currentSession && localCount === serverCount) {
              const lastLocal = currentSession.messages[localCount - 1];
              const lastServer = messages[serverCount - 1];
              if (lastLocal.content === lastServer.content && lastLocal.id === lastServer.id) {
                return prev;
              }
            }

            return {
              ...prev,
              [activeChatId]: {
                ...(currentSession || {
                  id: activeChatId,
                  title: "Chat",
                  updatedAt: Date.now()
                }),
                messages: messages,
                updatedAt: Date.now()
              }
            };
          }

          return prev;
        });
      };

    loadHistory();
  }, [activeChatId, modelConfig.langflowUrl, modelConfig.modelId]);

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

    isStreamingRef.current = true;
    setIsStreaming(true);

    let assistantMsgId = targetMessageId || generateUUID();
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
        sessionId
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
              console.error(`Session ${sessionId} not found in first chunk handler`);
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
            if (chunk.isFullText) {
              accumulatedContent = chunk.content;
            } else {
              accumulatedContent += chunk.content;
            }
          }

          setSessions((prev) => {
            const session = prev[sessionId];
            if (!session) {
              console.warn(`[Stream Update] Session ${sessionId} vanished during streaming.`);
              return prev;
            }

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
      isStreamingRef.current = false;
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

    console.log('>>> handleSend: called with message:', message);



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
    const isAtChatRoot = window.location.pathname === "/chat" || window.location.pathname === "/";
    const isFirstUserMessage = currentMessages.length === 0 || isAtChatRoot;

    // Create new chat ID if this is the first message and no active chat
    let chatId = activeChatId;

    if (isFirstUserMessage && (isAtChatRoot || !activeChatId || !sessions[activeChatId])) {
      chatId = generateUUID();
      console.log('>>> handleSend: New Chat ID generated:', chatId);

      const userMsg: Message = {
        id: generateUUID(),
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

      // Create new session AND add message atomically
      setSessions((prev) => ({
        ...prev,
        [chatId]: {
          id: chatId,
          title: currentPrompt.substring(0, 30),
          messages: [userMsg],
          updatedAt: Date.now(),
        },
      }));

      // Navigate to new chat URL with ID
      console.log('>>> handleSend: Navigating to new chat:', chatId);
      // DEBUG: Alert before navigation


      setActiveChatId(chatId);
      navigate(`/chat/${chatId}`);

      // Fallback: Force navigation again after a short delay if URL hasn't changed
      setTimeout(() => {
        if (!window.location.pathname.includes(chatId)) {
          console.warn('>>> handleSend: Navigation fallback triggered for:', chatId);
          navigate(`/chat/${chatId}`);
        }
      }, 100);

      setInputValue("");
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          chatInputRef.current?.focus();
        });
      });

      // Generate Title Async
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

      // Execute Request (history is empty for new chat)
      await executeChatRequest(
        currentPrompt,
        [],
        undefined,
        attachments,
        chatId,
      );

      return; // Exit here for new chat flow
    }

    // Existing Chat Flow
    const userMsg: Message = {
      id: generateUUID(),
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
      if (!session) return prev;

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
      if (!session) return prev;

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
      if (!session) return prev;

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
    // Navigate to root chat path
    navigate("/chat");

    setPreviewContent(null);
    setIsSettingsOpen(false);
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const confirmDeleteChat = async () => {

    if (!chatToDelete) return;
    const id = chatToDelete;

    // Close the modal immediately
    setChatToDelete(null);

    // Call API to delete from server
    await deleteSession(modelConfig, id);

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
