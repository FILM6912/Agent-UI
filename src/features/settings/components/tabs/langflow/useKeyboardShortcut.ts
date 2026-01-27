import { useEffect } from "react";

interface UseKeyboardShortcutProps {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  onTrigger: () => void;
}

export const useKeyboardShortcut = ({
  key,
  ctrlKey = false,
  metaKey = false,
  onTrigger,
}: UseKeyboardShortcutProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrMeta = ctrlKey || metaKey;
      const hasModifier = isCtrlOrMeta ? e.ctrlKey || e.metaKey : true;
      const keyMatch =
        e.key.toLowerCase() === key.toLowerCase() ||
        e.code === `Key${key.toUpperCase()}`;

      if (hasModifier && keyMatch) {
        e.preventDefault();
        onTrigger();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [key, ctrlKey, metaKey, onTrigger]);
};
