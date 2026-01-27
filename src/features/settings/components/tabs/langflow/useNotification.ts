import { useState } from "react";
import { NotificationConfig } from "./types";

export const useNotification = () => {
  const [showModal, setShowModal] = useState(false);
  const [config, setConfig] = useState<NotificationConfig>({
    type: "success",
    title: "",
    message: "",
  });

  const showNotification = (
    type: NotificationConfig["type"],
    title: string,
    message: string,
  ) => {
    setConfig({ type, title, message });
    setShowModal(true);
  };

  const hideNotification = () => {
    setShowModal(false);
  };

  return {
    showModal,
    config,
    showNotification,
    hideNotification,
  };
};
