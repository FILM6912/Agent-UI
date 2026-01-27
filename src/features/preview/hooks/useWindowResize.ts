import { useState, useEffect } from "react";

export const useWindowResize = (
  initialWidth: number,
  isSidebarOpen: boolean,
) => {
  const [width, setWidth] = useState(initialWidth);
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  const stopResizing = () => {
    setIsResizing(false);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const rawWidth = window.innerWidth - e.clientX;
      const sidebarW = isSidebarOpen ? 260 : 60;
      const minChatW = 380;
      const minPreviewW = 300;
      const maxAllowedWidth = window.innerWidth - sidebarW - minChatW;
      let newWidth = rawWidth;
      if (newWidth < minPreviewW) newWidth = minPreviewW;
      if (newWidth > maxAllowedWidth) newWidth = maxAllowedWidth;
      setWidth(newWidth);
    };

    if (isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", stopResizing);
      document.body.style.userSelect = "none";
      document.body.style.cursor = "col-resize";
    } else {
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stopResizing);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [isResizing, isSidebarOpen]);

  return { width, isResizing, startResizing };
};
