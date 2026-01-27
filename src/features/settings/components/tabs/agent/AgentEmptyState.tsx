import React from "react";
import { Bot } from "lucide-react";

interface AgentEmptyStateProps {
  onFetch: () => void;
  fetchText: string;
  emptyText: string;
}

export const AgentEmptyState: React.FC<AgentEmptyStateProps> = ({
  onFetch,
  fetchText,
  emptyText,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-sm border border-dashed border-border rounded-xl bg-muted/30">
      <Bot className="w-8 h-8 mb-3 opacity-50" />
      <span>{emptyText}</span>
      <button
        onClick={onFetch}
        className="mt-4 text-primary hover:underline text-xs"
      >
        {fetchText}
      </button>
    </div>
  );
};
