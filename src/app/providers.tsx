import { HashRouter } from "react-router-dom";
import { ThemeProvider } from "@/hooks/useTheme";
import { LanguageProvider } from "@/hooks/useLanguage";
import { AppearanceProvider } from "@/hooks/useAppearance";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <AppearanceProvider>
        <LanguageProvider>
          <HashRouter>{children}</HashRouter>
        </LanguageProvider>
      </AppearanceProvider>
    </ThemeProvider>
  );
}
