# Agent-UI

A modern AI chat interface built with React, TypeScript, and Vite, featuring a feature-based architecture for scalability and maintainability.

## 🏗️ Project Structure

This project follows a **feature-based architecture** where code is organized by business domain rather than file type:

```
src/
├── app/                    # App-level providers and configuration
│   └── providers.tsx       # ThemeProvider, LanguageProvider
├── assets/                 # Static assets (images, fonts)
├── components/             # Shared/Generic UI components
│   ├── ui/                 # shadcn/ui components
│   ├── layouts/            # Global layouts
│   ├── ErrorModal.tsx      # Shared error modal
│   ├── LangFlowConfigModal.tsx
│   └── ElectronFileManager.tsx
├── config/                 # Environment variables, constants
├── features/               # ⭐️ DOMAIN MODULES (Feature-based)
│   ├── auth/
│   │   ├── components/     # Auth-specific components
│   │   ├── types/          # Auth-specific types
│   │   └── index.ts        # Public API exports
│   ├── chat/
│   │   ├── api/            # Chat API services (geminiService)
│   │   ├── components/     # Chat components (ChatInterface, CodeBlock)
│   │   ├── types/          # Chat types (Message, Attachment)
│   │   └── index.ts        # Public API exports
│   ├── preview/
│   │   ├── components/     # Preview components
│   │   ├── types/          # Preview types
│   │   └── index.ts        # Public API exports
│   ├── settings/
│   │   ├── components/     # Settings components
│   │   ├── types/          # Settings types
│   │   └── index.ts        # Public API exports
│   └── sidebar/
│       ├── components/     # Sidebar components
│       ├── types/          # Sidebar types
│       └── index.ts        # Public API exports
├── hooks/                  # Global shared hooks
│   ├── useLanguage.tsx     # i18n hook
│   ├── useTheme.tsx        # Theme switching hook
│   └── useElectron.ts      # Electron integration hook
├── lib/                    # Library configurations
│   └── utils.ts            # Utility functions
├── translations.ts         # 🌍 i18n translations (EN/TH)
├── types/                  # Global TypeScript types
│   ├── index.ts            # Shared types
│   └── legacy-types.ts     # Legacy type definitions
└── utils/                  # Global utility functions

```

## 🎯 Key Principles

### Feature-Based Architecture

- **Colocation**: Keep related code close together
- **Encapsulation**: Each feature exports only what's needed via `index.ts`
- **Scalability**: Easy to add new features without affecting existing ones
- **Maintainability**: Clear boundaries between features

### Import Conventions

All imports use the `@/` path alias for consistency:

```typescript
// ✅ Correct
import { ChatInterface } from "@/features/chat";
import { AuthPage } from "@/features/auth";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";

// ❌ Incorrect
import { ChatInterface } from "../../features/chat";
import AuthPage from "../auth/components/AuthPage";
```

## 🛠️ Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS (with dark mode support)
- **UI Library**: shadcn/ui (Headless + Radix UI)
- **Icons**: Lucide React
- **Internationalization**: Custom Context-based (EN/TH)
- **Desktop**: Electron (optional)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Electron Desktop App

```bash
# Run as Electron app
npm run electron:dev

# Build Electron app
npm run electron:build
```

## 🌍 Internationalization

The app supports English (EN) and Thai (TH) languages using a custom context-based system:

```typescript
import { useLanguage } from "@/hooks/useLanguage";

function MyComponent() {
  const { t, language, setLanguage } = useLanguage();

  return <h1>{t('home.welcome')}</h1>;
}
```

All text strings must be wrapped in `t()` - no hardcoded strings allowed.

## 🎨 Theming

Dark/Light mode is supported via `useTheme` hook:

```typescript
import { useTheme } from "@/hooks/useTheme";

function MyComponent() {
  const { theme, setTheme } = useTheme();

  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      Toggle Theme
    </button>
  );
}
```

Use semantic color tokens (e.g., `bg-background`, `text-foreground`) instead of hardcoded colors.

## 📝 Development Guidelines

See `rule-for-ai-dev-react-ts.md` for detailed development rules and best practices.

## 📄 License

MIT
