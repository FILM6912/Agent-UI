import React from "react";
import { Sparkles } from "lucide-react";


interface WelcomeScreenProps {
  language: string;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  language,
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="w-20 h-20 rounded-full bg-linear-to-br from-[#1447E6] via-[#3d6ff7] to-[#0d35b8] flex items-center justify-center mb-6 shadow-2xl shadow-blue-500/30 animate-in zoom-in duration-500 ring-4 ring-blue-100 dark:ring-blue-900/30">
        <Sparkles className="w-10 h-10 text-white" />
      </div>

      <h1 className="text-3xl md:text-4xl font-bold bg-linear-to-r from-[#1447E6] to-[#0d35b8] dark:from-blue-400 dark:to-blue-500 bg-clip-text text-transparent mb-3 text-center">
        {language === "th"
          ? "สวัสดี! ฉันคือ AI Agent"
          : "Hello! I'm your AI Agent"}
      </h1>

      <p className="text-base md:text-lg text-zinc-600 dark:text-zinc-400 mb-8 text-center max-w-2xl">
        {language === "th"
          ? "ฉันพร้อมช่วยเหลือคุณในการทำงานต่างๆ เริ่มต้นด้วยการพิมพ์คำถามหรือคำสั่งของคุณด้านล่าง"
          : "I'm here to help you with various tasks. Start by typing your question or command below."}
      </p>

      {/* Quick Action Suggestions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
        {[
          {
            icon: "💡",
            title: language === "th" ? "ถามคำถาม" : "Ask a Question",
            desc:
              language === "th"
                ? "ถามอะไรก็ได้ที่อยากรู้"
                : "Ask me anything you want to know",
          },
          {
            icon: "🔧",
            title: language === "th" ? "แก้ปัญหา" : "Solve Problems",
            desc:
              language === "th"
                ? "ช่วยวิเคราะห์และแก้ไขปัญหา"
                : "Help analyze and solve issues",
          },
          {
            icon: "📝",
            title: language === "th" ? "เขียนเนื้อหา" : "Write Content",
            desc:
              language === "th"
                ? "สร้างเนื้อหาและเอกสาร"
                : "Create content and documents",
          },
          {
            icon: "🎨",
            title: language === "th" ? "ออกแบบ" : "Design",
            desc:
              language === "th"
                ? "ออกแบบและพัฒนาไอเดีย"
                : "Design and develop ideas",
          },
        ].map((item, idx) => (
          <div
            key={idx}
            className="group p-4 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl hover:border-blue-200 dark:hover:border-blue-700 hover:shadow-md hover:shadow-blue-100/50 dark:hover:shadow-blue-500/10 hover:bg-blue-50/30 dark:hover:from-blue-950/20 dark:hover:to-blue-900/20 transition-all duration-200 cursor-default"
          >
            <div className="text-2xl mb-2">{item.icon}</div>
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 mb-1 group-hover:text-[#1447E6] dark:group-hover:text-blue-400 transition-colors">
              {item.title}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {item.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Model Info */}

    </div>
  );
};
