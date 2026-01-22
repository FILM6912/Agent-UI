import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface LangFlowConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUrl: string;
  onSave: (url: string) => void;
}

export const LangFlowConfigModal: React.FC<LangFlowConfigModalProps> = ({ 
  isOpen, 
  onClose, 
  currentUrl, 
  onSave 
}) => {
  const [url, setUrl] = useState(currentUrl);

  useEffect(() => {
    if (isOpen) {
        setUrl(currentUrl);
    }
  }, [isOpen, currentUrl]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">LangFlow Configuration</h3>
          <button 
            onClick={onClose}
            className="p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="space-y-3">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">LangFlow URL</label>
            <input 
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="http://localhost:7860"
              className="w-full bg-zinc-100 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
              autoFocus
              onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                      onSave(url);
                      onClose();
                  }
              }}
            />
            <p className="text-[10px] text-zinc-500 dark:text-zinc-500">
              Enter the full URL where your LangFlow instance is running.
            </p>
          </div>
        </div>

        <div className="p-4 bg-zinc-50 dark:bg-[#09090b]/50 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
                onSave(url);
                onClose();
            }}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};
