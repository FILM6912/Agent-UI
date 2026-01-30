import React, { useState, useEffect } from "react";
import { Camera, Eye, EyeOff, Save, Check } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

const LockIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

export const AccountTab: React.FC = () => {
  const { t } = useLanguage();

  const [profile, setProfile] = useState({
    displayName: "Administrator",
    email: "admin@gmail.com",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load persisted data on mount
  useEffect(() => {
    const savedProfile = localStorage.getItem("user_profile");
    if (savedProfile) {
      setProfile((prev) => ({ ...prev, ...JSON.parse(savedProfile) }));
    }
  }, []);

  const handleSaveProfile = () => {
    setIsSaving(true);
    localStorage.setItem(
      "user_profile",
      JSON.stringify({
        displayName: profile.displayName,
        email: profile.email,
      }),
    );

    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }, 1000);
  };

  return (
    <div className="max-w-4xl">
      <div className="bg-white dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 mb-6 flex flex-col items-center shadow-sm dark:shadow-none">
        <div className="relative group cursor-pointer mb-4">
          <div className="w-24 h-24 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 text-2xl font-bold border-2 border-zinc-200 dark:border-zinc-700 overflow-hidden">
            {profile.displayName
              ? profile.displayName.substring(0, 2).toUpperCase()
              : "AD"}
          </div>
          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="w-6 h-6 text-white" />
          </div>
          <div className="absolute bottom-0 right-0 p-1.5 bg-blue-600 rounded-full border-2 border-white dark:border-[#121212]">
            <Camera className="w-3 h-3 text-white" />
          </div>
        </div>
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
          {profile.displayName}
        </h2>
        <span className="text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded mt-2 border border-zinc-200 dark:border-zinc-700">
          ADMIN
        </span>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {t("settings.displayName")}
            </label>
            <input
              type="text"
              value={profile.displayName}
              onChange={(e) =>
                setProfile({ ...profile, displayName: e.target.value })
              }
              className="w-full bg-white dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 shadow-sm dark:shadow-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {t("settings.email")}
            </label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) =>
                setProfile({ ...profile, email: e.target.value })
              }
              className="w-full bg-white dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 shadow-sm dark:shadow-none"
            />
          </div>
        </div>

        <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800">
          <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-4 flex items-center gap-2">
            <LockIcon className="w-4 h-4" />
            {t("settings.changePassword")}
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="relative">
              <input
                type={showPasswords.current ? "text" : "password"}
                placeholder={t("settings.currentPassword")}
                className="w-full bg-white dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-lg pl-4 pr-10 py-2.5 text-xs text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 shadow-sm dark:shadow-none"
              />
              <button
                onClick={() =>
                  setShowPasswords({
                    ...showPasswords,
                    current: !showPasswords.current,
                  })
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                {showPasswords.current ? (
                  <EyeOff className="w-3.5 h-3.5" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            <div className="relative">
              <input
                type={showPasswords.new ? "text" : "password"}
                placeholder={t("settings.newPassword")}
                className="w-full bg-white dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-lg pl-4 pr-10 py-2.5 text-xs text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 shadow-sm dark:shadow-none"
              />
              <button
                onClick={() =>
                  setShowPasswords({
                    ...showPasswords,
                    new: !showPasswords.new,
                  })
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                {showPasswords.new ? (
                  <EyeOff className="w-3.5 h-3.5" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            <div className="relative">
              <input
                type={showPasswords.confirm ? "text" : "password"}
                placeholder={t("settings.confirmPassword")}
                className="w-full bg-white dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-lg pl-4 pr-10 py-2.5 text-xs text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 shadow-sm dark:shadow-none"
              />
              <button
                onClick={() =>
                  setShowPasswords({
                    ...showPasswords,
                    confirm: !showPasswords.confirm,
                  })
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                {showPasswords.confirm ? (
                  <EyeOff className="w-3.5 h-3.5" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            onClick={handleSaveProfile}
            disabled={isSaving}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all shadow-md ${saveSuccess ? "bg-green-600 text-white" : "bg-blue-600 hover:bg-blue-500 text-white"}`}
          >
            {saveSuccess ? (
              <Check className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saveSuccess ? t("settings.saved") : t("settings.saveChanges")}
          </button>
        </div>
      </div>
    </div>
  );
};
