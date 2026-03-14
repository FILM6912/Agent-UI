import React, { useState, useRef, useEffect } from "react";
import {
  Plus,
  Search,
  LayoutGrid,
  History,
  User,
  Trash2,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Languages,
  SquarePen,
  Sun,
  Moon,
  Laptop,
  LogOut,
  Loader2,
  Check,
  ChevronDown,
} from "lucide-react";
import { AIProvider, ChatSession, ModelConfig } from "@/types";
import { useLanguage } from "@/hooks/useLanguage";
import { useTheme } from "@/hooks/useTheme";

interface SidebarProps {
  history: ChatSession[];
  activeChatId: string | null;
  loadingChatId: string | null;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  activeProvider: AIProvider;
  onProviderChange: (provider: AIProvider) => void;
  onOpenSettings: () => void;
  isOpen?: boolean;
  toggleSidebar?: () => void;
  isMobile?: boolean;
  onLogout?: () => void;
  modelConfig?: ModelConfig;
  onModelConfigChange?: (config: ModelConfig) => void;
  mcpServers?: string[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  history,
  activeChatId,
  loadingChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  activeProvider,
  onProviderChange,
  onOpenSettings,
  isOpen = true,
  toggleSidebar,
  isMobile = false,
  onLogout,
  modelConfig,
  onModelConfigChange,
  mcpServers = [],
}) => {
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isUserHovered, setIsUserHovered] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const enableHover = import.meta.env.VITE_ENABLE_HOVER !== "false";

  // Click outside handler for user menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (showUserMenu && userMenuRef.current && !userMenuRef.current.contains(target)) {
        setShowUserMenu(false);
        setShowLanguageDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUserMenu]);

  // Sidebar expanded state relies purely on isOpen prop now
  const showExpanded = isOpen;

  const filteredHistory = history.filter(
    (session) =>
      session &&
      session.id &&
      !session.id.startsWith("suggestion") &&
      (session.title || "").toLowerCase().includes(searchQuery.toLowerCase()) &&
      (session.messages || []).length > 0,
  );

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "th" : "en");
  };

  const mobileClasses = `fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-black border-r border-zinc-200 dark:border-zinc-900 flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${isOpen ? "translate-x-0" : "-translate-x-full"}`;

  const providerName = activeProvider === "google" ? "Google" : "OpenAI";

  // Content of the sidebar (overflow-visible so user menu dropdown can extend outside)
  const SidebarContent = (
    <div className="flex flex-col h-full w-full overflow-visible bg-zinc-50 dark:bg-black">
      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-modal-backdrop">
          <div className="bg-white dark:bg-[#18181b] rounded-2xl shadow-2xl p-6 max-w-sm mx-4 animate-modal-content border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              {t("sidebar.logout")}
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
              {language === "th"
                ? "คุณแน่ใจหรือไม่ว่าต้องการออกจากระบบ?"
                : "Are you sure you want to log out?"}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                {language === "th" ? "ยกเลิก" : "Cancel"}
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  onLogout?.();
                }}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
              >
                {t("sidebar.logout")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logo Area */}
      <div
        className={`flex items-center text-zinc-800 dark:text-zinc-100 font-bold tracking-tight w-full flex-shrink-0 h-16 ${showExpanded ? "px-4 gap-2 justify-between" : "justify-center"}`}
      >
        <div
          className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          onClick={toggleSidebar}
          onMouseEnter={() => setIsLogoHovered(true)}
          onMouseLeave={() => setIsLogoHovered(false)}
          title={!isOpen ? "Expand Sidebar" : undefined}
        >
          {!isOpen && isLogoHovered ? (
            // Show PanelLeftOpen icon when collapsed and hovered
            <PanelLeftOpen className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
          ) : (
            // Show Default Logo
            <svg
              className="w-7 h-7 text-zinc-900 dark:text-white flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2-1-10-5-2 1 10 5zm0 2.5l-8-4-2 1 10 5 10-5-2-1-8 4z" />
            </svg>
          )}

          {showExpanded && (
            <span className="text-lg whitespace-nowrap animate-in fade-in duration-200">
              Agent
            </span>
          )}
        </div>

        {showExpanded && toggleSidebar && (
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Nav */}
      <div
        className={`flex flex-col w-full ${showExpanded ? "px-3 space-y-1" : "items-center space-y-4 mt-2"}`}
      >
        {/* New Chat Button */}
        <button
          onClick={onNewChat}
          className={
            showExpanded
              ? "w-full flex items-center gap-3 px-3 py-2 bg-white dark:bg-zinc-100 hover:bg-zinc-100 dark:hover:bg-white text-zinc-700 dark:text-black rounded-lg transition-colors font-medium mb-3 shadow-lg shadow-zinc-200/50 dark:shadow-zinc-900/20 whitespace-nowrap border border-zinc-200 dark:border-transparent"
              : "w-9 h-9 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl transition-colors"
          }
          title={!showExpanded ? t("sidebar.newTask") : undefined}
        >
          {showExpanded ? (
            <>
              <Plus className="w-4 h-4 flex-shrink-0" />
              <span>{t("sidebar.newTask")}</span>
            </>
          ) : (
            <SquarePen className="w-5 h-5" />
          )}
        </button>

        {/* Search */}
        {showExpanded ? (
          <div className="relative mb-2 animate-in fade-in duration-200">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-black/70 dark:text-white/70 pointer-events-none" />
            <input
              type="text"
              placeholder={t("sidebar.search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-200/50 dark:bg-zinc-900/50 text-black dark:text-white placeholder-black/50 dark:placeholder-white/50 pl-10 pr-3 py-2 rounded-lg outline-none hover:bg-zinc-200 dark:hover:bg-zinc-900 focus:bg-zinc-200 dark:focus:bg-zinc-900 border border-transparent focus:border-zinc-300 dark:focus:border-zinc-800 transition-all text-sm"
            />
          </div>
        ) : (
          <button
            onClick={toggleSidebar}
            className="w-9 h-9 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl transition-colors"
            title={t("sidebar.search")}
          >
            <Search className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* History Section - Only visible when open */}
      <div
        className={`mt-6 flex-1 overflow-y-auto px-3 scrollbar-hide w-full overflow-x-hidden ${!showExpanded ? "invisible" : ""}`}
      >
        <div className="text-xs font-semibold text-black/80 dark:text-white/80 mb-2 px-3 uppercase tracking-wider flex items-center justify-between animate-in fade-in duration-300">
          <span>{t("sidebar.history")}</span>
          <History className="w-3 h-3" />
        </div>
        <div className="space-y-0.5 animate-in fade-in slide-in-from-left-2 duration-300">
          {filteredHistory.length === 0 ? (
            <div className="px-3 py-4 text-[10px] text-black/60 dark:text-white/60 text-center italic">
              {searchQuery ? t("sidebar.noMatching") : t("sidebar.noTasks")}
            </div>
          ) : (
            filteredHistory.map((session) => (
              <div
                key={session.id}
                className="sidebar-item group relative flex items-center"
              >
                <button
                  onClick={() => onSelectChat(session.id)}
                  className={`flex-1 text-left px-3 py-2.5 rounded-xl text-xs transition-all duration-200 flex items-center gap-2 pr-10 overflow-hidden ${activeChatId === session.id
                    ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200 dark:border-zinc-800/50"
                    : "hover:bg-zinc-200/50 dark:hover:bg-zinc-900/40 text-zinc-600 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                    }`}
                >
                  {loadingChatId === session.id ? (
                    <Loader2 className="w-3 h-3 animate-spin text-[#1447E6] flex-shrink-0" />
                  ) : (
                    <div
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeChatId === session.id ? "bg-[#1447E6]" : "bg-transparent group-hover:bg-zinc-400 dark:group-hover:bg-zinc-700"}`}
                    ></div>
                  )}
                  <span className="truncate flex-1 font-medium">
                    {session.title || "Untitled Chat"}
                  </span>
                  {(session.messages || []).length > 0 &&
                    activeChatId !== session.id && (
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-700 tabular-nums">
                        {session.messages.length}
                      </span>
                    )}
                </button>

                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteChat(session.id);
                  }}
                  className="sidebar-delete absolute right-2 p-1.5 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-all duration-200 rounded-md hover:bg-red-500/10 dark:hover:bg-red-400/20 cursor-pointer"
                  title={t("sidebar.deleteChat")}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Bottom Actions */}
      <div
        className={`border-t border-zinc-200 dark:border-zinc-900 relative w-full overflow-visible ${showExpanded ? "p-3" : "p-2 flex justify-center py-4"}`}
      >
        <div
          className={`flex items-center ${showExpanded ? "gap-2" : "flex-col gap-2"}`}
        >
          {showExpanded ? (
            <div ref={userMenuRef} className="relative flex-1 flex">
              {/* Settings Button - Expanded */}
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center rounded-xl gap-3 px-3 py-2.5 cursor-pointer flex-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors text-zinc-700 dark:text-zinc-300"
                title={t("sidebar.settings")}
              >
                <div className="w-9 h-9 rounded-xl bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                  <Settings className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                </div>
                <span className="text-sm font-medium flex-1 text-left truncate">{t("sidebar.settings")}</span>
                <ChevronDown className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform ${showUserMenu ? "rotate-180" : ""}`} />
              </button>

              {/* Settings Menu Dropdown - Expanded */}
              {showUserMenu && (
                <div
                  className="absolute bottom-full left-0 right-0 mb-2 min-w-[280px] bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl p-3 z-50 animate-in slide-in-from-top-2 fade-in duration-200"
                >
                  {/* Theme Section */}
                  <div className="mb-3">
                    <div className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider px-1">
                      {t("sidebar.theme")}
                    </div>
                    <div className="flex bg-zinc-100 dark:bg-zinc-900 rounded-lg p-1 border border-zinc-200 dark:border-zinc-800">
                      <button
                        onClick={() => setTheme("light")}
                        className={`flex-1 flex items-center justify-center gap-1.5 p-2 rounded-md transition-all text-xs font-medium ${
                          theme === "light"
                            ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-100"
                            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                        }`}
                      >
                        <Sun className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setTheme("dark")}
                        className={`flex-1 flex items-center justify-center gap-1.5 p-2 rounded-md transition-all text-xs font-medium ${
                          theme === "dark"
                            ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-100"
                            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                        }`}
                      >
                        <Moon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setTheme("system")}
                        className={`flex-1 flex items-center justify-center gap-1.5 p-2 rounded-md transition-all text-xs font-medium ${
                          theme === "system"
                            ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-100"
                            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                        }`}
                      >
                        <Laptop className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="my-2 border-t border-zinc-200 dark:border-zinc-800/50"></div>

                  {/* Language Dropdown */}
                  <div className="px-1 py-1" ref={languageDropdownRef}>
                    <div className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
                      {t("sidebar.language")}
                    </div>
                    <div className="relative">
                      <button
                        onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                        className="w-full flex items-center justify-between bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-200 text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Languages className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                          <span>{language === "en" ? "English" : "ไทย"}</span>
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 text-zinc-500 transition-transform ${showLanguageDropdown ? "rotate-180" : ""}`}
                        />
                      </button>

                      {showLanguageDropdown && (
                        <div className="absolute bottom-full left-0 right-0 mb-1 bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-1 duration-150">
                          <button
                            onClick={() => {
                              setLanguage("en");
                              setShowLanguageDropdown(false);
                            }}
                            className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm transition-colors ${
                              language === "en"
                                ? "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-medium"
                                : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            }`}
                          >
                            <span className="flex-1 text-left">English</span>
                            {language === "en" && <Check className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => {
                              setLanguage("th");
                              setShowLanguageDropdown(false);
                            }}
                            className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm transition-colors ${
                              language === "th"
                                ? "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-medium"
                                : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            }`}
                          >
                            <span className="flex-1 text-left">ไทย</span>
                            {language === "th" && <Check className="w-4 h-4" />}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="my-2 border-t border-zinc-200 dark:border-zinc-800/50"></div>

                  {/* Go to Settings Page */}
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenSettings();
                    }}
                    className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm transition-colors text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 font-medium"
                  >
                    <Settings className="w-4 h-4 shrink-0 text-zinc-500 dark:text-zinc-400" />
                    <span className="flex-1 text-left">{t("settings.title")}</span>
                  </button>

                  {/* Logout Button */}
                  {onLogout && (
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        setShowLogoutConfirm(true);
                      }}
                      className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm transition-colors text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium"
                    >
                      <LogOut className="w-4 h-4 shrink-0" />
                      <span className="flex-1 text-left">{t("sidebar.logout")}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div ref={userMenuRef} className="relative">
              {/* Settings Button - Collapsed */}
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center justify-center w-10 h-10 rounded-xl cursor-pointer transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                title={t("sidebar.settings")}
              >
                <Settings className="w-5 h-5" />
              </button>
              {/* Settings Menu Dropdown - Collapsed */}
              {showUserMenu && (
                <div
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-[240px] bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl p-3 z-50 animate-in slide-in-from-top-2 fade-in duration-200"
                >
                  {/* Theme Section */}
                  <div className="mb-3">
                    <div className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider px-1">
                      {t("sidebar.theme")}
                    </div>
                    <div className="flex bg-zinc-100 dark:bg-zinc-900 rounded-lg p-1 border border-zinc-200 dark:border-zinc-800">
                      <button
                        onClick={() => setTheme("light")}
                        className={`flex-1 flex items-center justify-center gap-1.5 p-2 rounded-md transition-all text-xs font-medium ${
                          theme === "light"
                            ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-100"
                            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                        }`}
                      >
                        <Sun className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setTheme("dark")}
                        className={`flex-1 flex items-center justify-center gap-1.5 p-2 rounded-md transition-all text-xs font-medium ${
                          theme === "dark"
                            ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-100"
                            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                        }`}
                      >
                        <Moon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setTheme("system")}
                        className={`flex-1 flex items-center justify-center gap-1.5 p-2 rounded-md transition-all text-xs font-medium ${
                          theme === "system"
                            ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-100"
                            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                        }`}
                      >
                        <Laptop className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="my-2 border-t border-zinc-200 dark:border-zinc-800/50"></div>

                  {/* Language Buttons */}
                  <div className="flex gap-2 mb-2">
                    <button
                      onClick={() => setLanguage("en")}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                        language === "en"
                          ? "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-medium"
                          : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      }`}
                    >
                      <Languages className="w-4 h-4" />
                      EN
                    </button>
                    <button
                      onClick={() => setLanguage("th")}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                        language === "th"
                          ? "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-medium"
                          : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      }`}
                    >
                      <Languages className="w-4 h-4" />
                      ไทย
                    </button>
                  </div>

                  <div className="my-2 border-t border-zinc-200 dark:border-zinc-800/50"></div>

                  {/* Settings Button */}
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenSettings();
                    }}
                    className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm transition-colors text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 font-medium"
                  >
                    <Settings className="w-4 h-4 shrink-0 text-zinc-500 dark:text-zinc-400" />
                    <span className="flex-1 text-left">{t("settings.title")}</span>
                  </button>

                  {/* Logout Button */}
                  {onLogout && (
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        setShowLogoutConfirm(true);
                      }}
                      className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm transition-colors text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium"
                    >
                      <LogOut className="w-4 h-4 shrink-0" />
                      <span className="flex-1 text-left">{t("sidebar.logout")}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return <div className={mobileClasses}>{SidebarContent}</div>;
  }

  return (
    <div
      className={`h-full flex-shrink-0 bg-zinc-50 dark:bg-black border-r border-zinc-200 dark:border-zinc-900 flex flex-col transition-all duration-300 ease-in-out ${isOpen ? "w-64" : "w-[50px]"}`}
    >
      {SidebarContent}
    </div>
  );
};
