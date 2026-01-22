
import React, { useState } from 'react';
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
  LogOut
} from 'lucide-react';
import { ChatSession, AIProvider } from '../types';
import { useLanguage } from '../LanguageContext';
import { useTheme } from '../ThemeContext';

interface SidebarProps {
  history: ChatSession[];
  onNewChat: () => void;
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  activeProvider: AIProvider;
  onProviderChange: (provider: AIProvider) => void;
  onOpenSettings: () => void;
  isOpen?: boolean;
  toggleSidebar?: () => void;
  isMobile?: boolean;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  history, 
  onNewChat, 
  activeChatId, 
  onSelectChat,
  onDeleteChat,
  activeProvider,
  onProviderChange,
  onOpenSettings,
  isOpen = true,
  toggleSidebar,
  isMobile = false,
  onLogout
}) => {
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [showMenu, setShowMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLogoHovered, setIsLogoHovered] = useState(false);
  
  // Sidebar expanded state relies purely on isOpen prop now
  const showExpanded = isOpen;

  const filteredHistory = history.filter(session => 
    session.title.toLowerCase().includes(searchQuery.toLowerCase()) && session.messages.length > 0
  );

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'th' : 'en');
  };

  const mobileClasses = `fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-black border-r border-zinc-200 dark:border-zinc-900 flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`;
  
  const providerName = activeProvider === 'google' ? 'Google' : 'OpenAI';

  // Content of the sidebar
  const SidebarContent = (
    <div className="flex flex-col h-full w-full overflow-hidden bg-zinc-50 dark:bg-black">
      {/* Logo Area */}
      <div className={`flex items-center text-zinc-800 dark:text-zinc-100 font-bold tracking-tight w-full flex-shrink-0 h-16 ${showExpanded ? 'px-4 gap-2 justify-between' : 'justify-center'}`}>
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
                <svg className="w-7 h-7 text-zinc-900 dark:text-white flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2-1-10-5-2 1 10 5zm0 2.5l-8-4-2 1 10 5 10-5-2-1-8 4z" />
                </svg>
            )}
            
            {showExpanded && <span className="text-lg whitespace-nowrap animate-in fade-in duration-200">Agent</span>}
        </div>
        
        {showExpanded && toggleSidebar && (
             <button onClick={toggleSidebar} className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors">
                <PanelLeftClose className="w-4 h-4" />
             </button>
        )}
      </div>

      {/* Main Nav */}
      <div className={`flex flex-col w-full ${showExpanded ? 'px-3 space-y-1' : 'items-center space-y-4 mt-2'}`}>
        
        {/* New Chat Button */}
        <button 
          onClick={onNewChat}
          className={showExpanded 
            ? "w-full flex items-center gap-3 px-3 py-2 bg-white dark:bg-zinc-100 hover:bg-zinc-100 dark:hover:bg-white text-zinc-700 dark:text-black rounded-lg transition-colors font-medium mb-3 shadow-lg shadow-zinc-200/50 dark:shadow-zinc-900/20 whitespace-nowrap border border-zinc-200 dark:border-transparent"
            : "w-9 h-9 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl transition-colors"
          }
          title={!showExpanded ? t('sidebar.newTask') : undefined}
        >
          {showExpanded ? (
             <>
               <Plus className="w-4 h-4 flex-shrink-0" />
               <span>{t('sidebar.newTask')}</span>
             </>
          ) : (
             <SquarePen className="w-5 h-5" />
          )}
        </button>
        
        {/* Search */}
        {showExpanded ? (
            <div className="relative mb-2 animate-in fade-in duration-200">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            <input 
                type="text" 
                placeholder={t('sidebar.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-200/50 dark:bg-zinc-900/50 text-zinc-700 dark:text-zinc-300 placeholder-zinc-500 pl-10 pr-3 py-2 rounded-lg outline-none hover:bg-zinc-200 dark:hover:bg-zinc-900 focus:bg-zinc-200 dark:focus:bg-zinc-900 border border-transparent focus:border-zinc-300 dark:focus:border-zinc-800 transition-all text-sm"
            />
            </div>
        ) : (
            <button 
                onClick={toggleSidebar} 
                className="w-9 h-9 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                title={t('sidebar.search')}
            >
                <Search className="w-5 h-5" />
            </button>
        )}

        {/* Gallery */}
        <button className={showExpanded 
            ? "w-full flex items-center gap-3 px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-200 rounded-lg transition-colors whitespace-nowrap"
            : "w-9 h-9 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl transition-colors"
        }>
          <LayoutGrid className={showExpanded ? "w-4 h-4 flex-shrink-0" : "w-5 h-5"} />
          {showExpanded && <span>{t('sidebar.gallery')}</span>}
        </button>
      </div>

      {/* History Section - Only visible when open */}
      <div className={`mt-6 flex-1 overflow-y-auto px-3 scrollbar-hide w-full overflow-x-hidden ${!showExpanded ? 'hidden' : ''}`}>
        <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-600 mb-2 px-3 uppercase tracking-wider flex items-center justify-between animate-in fade-in duration-300">
          <span>{t('sidebar.history')}</span>
          <History className="w-3 h-3" />
        </div>
        <div className="space-y-0.5 animate-in fade-in slide-in-from-left-2 duration-300">
          {filteredHistory.length === 0 ? (
            <div className="px-3 py-4 text-[10px] text-zinc-500 dark:text-zinc-700 text-center italic">
                {searchQuery ? t('sidebar.noMatching') : t('sidebar.noTasks')}
            </div>
          ) : (
            filteredHistory.map(session => (
              <div 
                key={session.id}
                className="group relative flex items-center"
              >
                <button
                  onClick={() => onSelectChat(session.id)}
                  className={`flex-1 text-left px-3 py-2.5 rounded-xl text-xs transition-all duration-200 flex items-center gap-2 pr-10 overflow-hidden ${
                    activeChatId === session.id 
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200 dark:border-zinc-800/50' 
                    : 'hover:bg-zinc-200/50 dark:hover:bg-zinc-900/40 text-zinc-600 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeChatId === session.id ? 'bg-indigo-500' : 'bg-transparent group-hover:bg-zinc-400 dark:group-hover:bg-zinc-700'}`}></div>
                  <span className="truncate flex-1 font-medium">{session.title}</span>
                  {session.messages.length > 0 && activeChatId !== session.id && (
                     <span className="text-[10px] text-zinc-500 dark:text-zinc-700 tabular-nums">
                       {session.messages.length}
                     </span>
                  )}
                </button>
                
                {/* Delete Button - Appears on hover */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteChat(session.id);
                  }}
                  className="absolute right-2 p-1.5 text-zinc-400 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-md hover:bg-red-100 dark:hover:bg-red-400/10"
                  title={t('sidebar.deleteChat')}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className={`border-t border-zinc-200 dark:border-zinc-900 relative w-full overflow-visible ${showExpanded ? 'p-3' : 'p-2 flex justify-center py-4'}`}>
        {/* User Menu Popup */}
        {showMenu && showExpanded && (
            <div className="absolute bottom-[calc(100%+8px)] left-3 right-3 bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl p-1 z-50 animate-in slide-in-from-bottom-2 fade-in duration-200">
               {/* Theme Switching */}
               <div className="px-3 py-1.5">
                 <div className="text-[10px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">{t('sidebar.theme')}</div>
                 <div className="flex bg-zinc-100 dark:bg-zinc-900 rounded-lg p-0.5 border border-zinc-200 dark:border-zinc-800">
                    <button 
                      onClick={() => setTheme('light')} 
                      className={`flex-1 flex items-center justify-center p-1.5 rounded-md transition-all ${theme === 'light' ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'}`}
                      title={t('sidebar.light')}
                    >
                       <Sun className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => setTheme('dark')}
                      className={`flex-1 flex items-center justify-center p-1.5 rounded-md transition-all ${theme === 'dark' ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'}`}
                      title={t('sidebar.dark')}
                    >
                       <Moon className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => setTheme('system')}
                      className={`flex-1 flex items-center justify-center p-1.5 rounded-md transition-all ${theme === 'system' ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'}`}
                      title={t('sidebar.system')}
                    >
                       <Laptop className="w-3.5 h-3.5" />
                    </button>
                 </div>
               </div>
               
               <div className="my-1 border-t border-zinc-200 dark:border-zinc-800/50"></div>
               
               <button 
                  onClick={toggleLanguage}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-colors text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-300"
               >
                  <Languages className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="flex-1 text-left truncate">{language === 'en' ? 'ภาษาไทย' : 'English'}</span>
               </button>

               <div className="my-1 border-t border-zinc-200 dark:border-zinc-800/50"></div>

               <button 
                  onClick={onLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-colors text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10"
               >
                  <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="flex-1 text-left truncate">{t('sidebar.logout')}</span>
               </button>
            </div>
        )}

        {/* User Profile */}
        <div 
            onClick={showExpanded ? () => setShowMenu(!showMenu) : toggleSidebar}
            className={`flex items-center rounded-xl group cursor-pointer transition-colors ${
                showExpanded 
                ? `gap-3 px-2 py-2 ${showMenu ? 'bg-zinc-100 dark:bg-zinc-900' : 'hover:bg-zinc-100 dark:hover:bg-zinc-900/50'}` 
                : 'justify-center w-9 h-9 hover:bg-zinc-200 dark:hover:bg-zinc-800'
            }`}
        >
           <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/10 group-hover:scale-105 transition-transform flex-shrink-0 relative">
              <User className="w-5 h-5 text-white" />
              {!showExpanded && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-black rounded-full"></div>}
           </div>
           
           {showExpanded && (
               <>
                <div className="flex flex-col overflow-hidden flex-1 min-w-0">
                    <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">Watcharaphon Pam...</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium truncate">{providerName} Plan</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                    </div>
                </div>
                
                <button 
                  onClick={(e) => { e.stopPropagation(); onOpenSettings(); }}
                  className={`p-1.5 rounded-lg transition-all duration-200 ${showMenu ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100' : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800'}`}
                >
                    <Settings className="w-3.5 h-3.5" />
                </button>
               </>
           )}
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className={mobileClasses}>
        {SidebarContent}
      </div>
    );
  }

  return (
    <div className={`h-full flex-shrink-0 bg-zinc-50 dark:bg-black border-r border-zinc-200 dark:border-zinc-900 flex flex-col transition-all duration-300 ease-in-out ${isOpen ? 'w-64' : 'w-16'}`}>
      {SidebarContent}
    </div>
  );
};
