import React, { useState } from "react";
import { Check, X, Pencil, RotateCw } from "lucide-react";
import { AgentFlow } from "./types";

interface AgentCardProps {
  agent: AgentFlow;
  onToggleEnabled: (id: string) => void;
  onUpdateName: (id: string, name: string | undefined) => void;
  onRequestClearName: (id: string) => void;
  t: (key: string) => string;
}

export const AgentCard: React.FC<AgentCardProps> = ({
  agent,
  onToggleEnabled,
  onUpdateName,
  onRequestClearName,
  t,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");

  const startEditing = () => {
    setIsEditing(true);
    setEditName(agent.customName || agent.name);
  };

  const saveName = () => {
    const newCustomName = editName !== agent.name ? editName : undefined;
    onUpdateName(agent.id, newCustomName);
    setIsEditing(false);
    setEditName("");
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditName("");
  };

  const displayName = agent.customName || agent.name;
  const hasCustomName = agent.customName && agent.customName !== agent.name;

  return (
    <div className="flex items-center justify-between p-4 bg-background border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors group shadow-sm">
      <div className="flex items-center gap-4 flex-1">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
          {displayName.substring(0, 2).toUpperCase()}
        </div>

        {/* Name & Description */}
        <div className="flex-1">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="bg-background border border-primary rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary flex-1"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveName();
                  if (e.key === "Escape") cancelEditing();
                }}
              />
              <button
                onClick={saveName}
                className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-500/10 rounded-lg transition-colors"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={cancelEditing}
                className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <div className="font-semibold text-foreground text-sm">
                  {displayName}
                </div>
                {hasCustomName && (
                  <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-700">
                    Custom
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {agent.description}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* Toggle Switch */}
        <button
          onClick={() => onToggleEnabled(agent.id)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            agent.enabled ? "bg-green-500" : "bg-zinc-300 dark:bg-zinc-700"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              agent.enabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>

        {/* Status Badge */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold border uppercase tracking-wider ${
            agent.enabled
              ? "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-500 border-green-200 dark:border-green-500/20"
              : "bg-muted text-muted-foreground border-border"
          }`}
        >
          {agent.enabled ? (
            <>
              <Check className="w-3 h-3" />
              {t("settings.enabled")}
            </>
          ) : (
            <>
              <X className="w-3 h-3" />
              {t("settings.disabled")}
            </>
          )}
        </div>

        {/* Edit & Clear Buttons */}
        {!isEditing && (
          <>
            <button
              onClick={startEditing}
              className="p-2 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors text-muted-foreground"
              title={t("settings.editName") || "Edit name"}
            >
              <Pencil className="w-4 h-4" />
            </button>

            {hasCustomName && (
              <button
                onClick={() => onRequestClearName(agent.id)}
                className="p-2 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded-lg transition-colors text-muted-foreground"
                title={t("settings.clearCustomName") || "Clear custom name"}
              >
                <RotateCw className="w-4 h-4" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
