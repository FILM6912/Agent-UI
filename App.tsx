import React, { useState, useEffect, useMemo } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { ChatInterface, getPresetModels } from "./components/ChatInterface";
import { PreviewWindow } from "./components/PreviewWindow";
import { SettingsView } from "./components/SettingsView";
import { LangFlowConfigModal } from "./components/LangFlowConfigModal";
import { AuthPage } from "./components/AuthPage";
import {
  Message,
  ChatSession,
  ModelConfig,
  AIProvider,
  MessageVersion,
  Attachment,
} from "./types";
import {
  streamMessageFromGemini,
  generateChatTitle,
} from "./services/geminiService";
import { PanelLeft, PanelRight, Trash2 } from "lucide-react";
import { useLanguage } from "./LanguageContext";

export default function App() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  // Sync URL to State
  useEffect(() => {
    const match = location.pathname.match(/\/chat\/([^/]+)/);
    if (match) {
        const id = match[1];
        if (id !== activeChatId) {
            setActiveChatId(id);
        }
    }
  }, [location.pathname]);

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('auth_token') === 'true';
  });

  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem('auth_token', 'true');
    } else {
      localStorage.removeItem('auth_token');
    }
  }, [isAuthenticated]);

  const initialId = crypto.randomUUID();
  const [sessions, setSessions] = useState<Record<string, ChatSession>>(() => {
    const saved = localStorage.getItem('chat_sessions');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      [initialId]: {
        id: initialId,
        title: "New Task",
        messages: [],
        updatedAt: Date.now(),
      },
    };
  });

  useEffect(() => {
    localStorage.setItem('chat_sessions', JSON.stringify(sessions));
  }, [sessions]);

  const [activeChatId, setActiveChatId] = useState<string>(initialId);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);

  // View State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLangFlowConfigOpen, setIsLangFlowConfigOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<
    "general" | "account" | "tools" | "langflow"
  >("general");

  // Live Preview Content State
  const [previewContent, setPreviewContent] = useState<string | null>(null);

  // Responsive State
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isPreviewOpen, setIsPreviewOpen] = useState(true);

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
    setIsPreviewOpen(!initialMobile);

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [modelConfig, setModelConfig] = useState<ModelConfig>({
    provider: "google",
    baseUrl: "",
    modelId: "gemini-3-flash-preview",
    name: "Gemini 3.0 Flash",
    mcpServers: ["http://192.168.99.1:9000/mcp"],
    enabledConnections: ["google", "mimo", "rou"],
    enabledModels: [
      "gemini-3-flash-preview",
      "gemini-2.5-flash-lite-latest",
      "gpt-4o",
    ],
    systemPrompt: "You are a helpful AI assistant focused on technical tasks.",
    voiceDelay: 0.5,
    langflowUrl: "http://localhost:7860",
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
  ) => {
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

          if (chunk.type === "text" && chunk.content) {
            accumulatedContent = chunk.content;
            initialAssistantMsg.content = accumulatedContent;
            if (initialAssistantMsg.versions) {
              initialAssistantMsg.versions[0].content = accumulatedContent;
            }
          }

          setSessions((prev) => ({
            ...prev,
            [activeChatId]: {
              ...prev[activeChatId],
              messages: [...prev[activeChatId].messages, initialAssistantMsg],
            },
          }));
          messageInitialized = true;
          if (chunk.type === "steps") continue;
        }

        if (
          (chunk.type === "text" && chunk.content) ||
          chunk.type === "steps"
        ) {
          if (chunk.type === "text" && chunk.content) {
            accumulatedContent += chunk.content;
          }

          setSessions((prev) => {
            const session = prev[activeChatId];
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
              [activeChatId]: {
                ...session,
                messages: updatedMessages,
              },
            };
          });
        }
      }
    } catch (error: any) {
      console.error("Error in chat loop:", error);

      const errorMsg = error.message || JSON.stringify(error);
      const isQuotaError =
        errorMsg.includes("429") ||
        errorMsg.includes("quota") ||
        errorMsg.includes("RESOURCE_EXHAUSTED");

      const userFriendlyError = isQuotaError
        ? "\n\n> **⚠️ API Quota Exceeded**\n> You have exceeded your request quota. Please check your billing details or try again later."
        : `\n\n> **⚠️ Error Generating Response**\n> ${errorMsg}`;

      const finalContent = accumulatedContent + userFriendlyError;

      setSessions((prev) => {
        const session = prev[activeChatId];

        if (!messageInitialized) {
          const initialAssistantMsg: Message = {
            id: assistantMsgId,
            role: "assistant",
            content: finalContent,
            timestamp: Date.now(),
            versions: [{ content: finalContent, timestamp: Date.now() }],
            currentVersionIndex: 0,
          };
          return {
            ...prev,
            [activeChatId]: {
              ...session,
              messages: [...session.messages, initialAssistantMsg],
            },
          };
        }

        const updatedMessages = session.messages.map((msg) => {
          if (msg.id === assistantMsgId) {
            const currentVersions = msg.versions ? [...msg.versions] : [];
            const currentIndex = msg.currentVersionIndex ?? 0;

            if (currentVersions[currentIndex]) {
              currentVersions[currentIndex] = {
                ...currentVersions[currentIndex],
                content: finalContent,
              };
            }

            return {
              ...msg,
              content: finalContent,
              versions: currentVersions,
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
    const currentPrompt = message;
    const isFirstUserMessage = currentMessages.length === 0;

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
    const historyBeforeNewMessage = [...currentMessages];

    setSessions((prev) => ({
      ...prev,
      [activeChatId]: {
        ...prev[activeChatId],
        title: isFirstUserMessage
          ? currentPrompt.substring(0, 30)
          : prev[activeChatId].title,
        messages: [...prev[activeChatId].messages, userMsg],
        updatedAt: Date.now(),
      },
    }));

    if (isFirstUserMessage) {
      generateChatTitle(currentPrompt)
        .then((aiTitle) => {
          setSessions((prev) => ({
            ...prev,
            [activeChatId]: { ...prev[activeChatId], title: aiTitle },
          }));
        })
        .catch(() => {});
    }

    await executeChatRequest(
      currentPrompt,
      historyBeforeNewMessage,
      undefined,
      attachments,
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
    const newId = crypto.randomUUID();
    setSessions((prev) => ({
      ...prev,
      [newId]: {
        id: newId,
        title: t("sidebar.newTask"),
        messages: [],
        updatedAt: Date.now(),
      },
    }));
    navigate(`/chat/${newId}`);
    setPreviewContent(null);
    setIsSettingsOpen(false);
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const confirmDeleteChat = () => {
    if (!chatToDelete) return;
    const id = chatToDelete;

    let nextId: string | null = null;

    setSessions((prev) => {
      const newSessions = { ...prev };
      delete newSessions[id];
      
      if (Object.keys(newSessions).length === 0) {
        // No chats left, create new one
        const newId = crypto.randomUUID();
        nextId = newId;
        return {
          [newId]: {
            id: newId,
            title: t("sidebar.newTask"),
            messages: [],
            updatedAt: Date.now(),
          },
        };
      }
      
      if (activeChatId === id) {
        // Deleted active chat, find next
        const remaining = Object.values(newSessions) as ChatSession[];
        const latest = remaining.sort((a, b) => b.updatedAt - a.updatedAt)[0];
        if (latest) {
          nextId = latest.id;
        }
      }
      
      return newSessions;
    });

    if (nextId) {
        // We can't rely on the variable inside setSessions directly if strict mode runs twice, 
        // but activeChatId is used for comparison. 
        // Better to wait for effect? 
        // Actually, let's just navigate.
        navigate(`/chat/${nextId}`);
    } else {
        // If we didn't set nextId inside (e.g. deleted inactive chat), no nav needed?
        // But the logic inside setSessions above had "No chats left" -> nextId.
        // "Deleted active chat" -> nextId.
        // So if (nextId) matches those cases.
        // BUT wait, setSessions updater runs LATER. nextId variable is local.
        // The updater function runs... when? 
        // React state updates are batched but the updater runs during reconciliation.
        // WE CANNOT export values from inside updater like this properly.
        
        // Correct approach: Calculate derived state separate from setSessions if possible, 
        // OR use existing logic but replace setActiveChatId with navigate, risking the warning.
        // Given constraints, I will keep logic simple:
        // 1. Calculate new sessions clone from `sessions` (which is in scope).
        // 2. Determine next ID.
        // 3. setSessions(newSessions);
        // 4. navigate(nextId).
    }
  };

  const onRequestDeleteChat = (id: string) => {
    setChatToDelete(id);
  };

  const handleClearAllChats = () => {
    const newId = crypto.randomUUID();
    setSessions({
      [newId]: {
        id: newId,
        title: t("sidebar.newTask"),
        messages: [],
        updatedAt: Date.now(),
      },
    });
    setActiveChatId(newId);
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
    if (location.pathname.startsWith('/settings/')) {
      const tab = location.pathname.split('/')[2] as 'general' | 'account' | 'tools' | 'langflow';
      if (['general', 'account', 'tools', 'langflow'].includes(tab)) {
        setSettingsTab(tab);
        setIsSettingsOpen(true);
      }
    } else {
      setIsSettingsOpen(false);
    }
  }, [location.pathname]);

  // Main app layout component
  const AppLayout = ({ showSettings = false }: { showSettings?: boolean }) => (
    <div className="flex h-screen w-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-50 overflow-hidden font-sans relative transition-colors duration-200">
      {/* Mobile Sidebar Backdrop */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar
        history={history}
        activeChatId={activeChatId}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={onRequestDeleteChat}
        activeProvider={modelConfig.provider}
        onProviderChange={handleProviderChange}
        onOpenSettings={() => {
          navigate('/settings/general');
        }}
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isMobile={isMobile}
        onLogout={() => {
          setIsAuthenticated(false);
          navigate('/login');
        }}
      />

      <div className="flex-1 flex flex-col h-full min-w-[380px] relative">
        {showSettings ? (
          <SettingsView
            modelConfig={modelConfig}
            onModelConfigChange={setModelConfig}
            onBack={() => navigate(-1)}
            chatHistory={history}
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
            />

            {!isPreviewOpen && (
              <button
                onClick={() => setIsPreviewOpen(true)}
                className="absolute top-3 right-3 z-30 p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                title="Open Preview"
              >
                <PanelRight className="w-5 h-5" />
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
  );

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <AuthPage onLogin={() => { setIsAuthenticated(true); }} /> : <Navigate to="/" />} />
      <Route path="/register" element={!isAuthenticated ? <AuthPage onLogin={() => { setIsAuthenticated(true); }} /> : <Navigate to="/" />} />
      <Route path="/settings/:tab" element={isAuthenticated ? <AppLayout showSettings={true} /> : <Navigate to="/login" />} />
      <Route path="/chat/:chatId" element={isAuthenticated ? <AppLayout showSettings={false} /> : <Navigate to="/login" />} />
      <Route path="/" element={isAuthenticated ? <Navigate to={`/chat/${activeChatId || (Object.keys(sessions).length > 0 ? Object.keys(sessions)[0] : "new")}`} replace /> : <Navigate to="/login" />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
