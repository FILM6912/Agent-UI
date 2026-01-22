import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { translations as initialTranslations, Language } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: string) => string;
  updateTranslations: (newTranslations: Record<string, any>) => void;
  exportTranslations: () => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [translations, setTranslations] = useState(initialTranslations);

  const t = (path: string): string => {
    const keys = path.split('.');
    let current: any = translations[language];
    
    for (const key of keys) {
      if (current === undefined || current[key] === undefined) {
        // Fallback to initial translations if key missing in updates
        let fallback: any = initialTranslations[language];
        for (const k of keys) {
           if(fallback && fallback[k]) fallback = fallback[k];
           else return path;
        }
        return fallback as string;
      }
      current = current[key];
    }
    
    return current as string;
  };

  const updateTranslations = (newTranslations: Record<string, any>) => {
      setTranslations(prev => ({
          ...prev,
          ...newTranslations
      }));
  };

  const exportTranslations = (): string => {
      const flatten = (obj: any, prefix = ''): Record<string, string> => {
          let acc: Record<string, string> = {};
          for (const k in obj) {
              if (typeof obj[k] === 'object') {
                  Object.assign(acc, flatten(obj[k], prefix ? `${prefix}.${k}` : k));
              } else {
                  acc[prefix ? `${prefix}.${k}` : k] = obj[k];
              }
          }
          return acc;
      };

      const enFlat = flatten(translations.en);
      const thFlat = flatten(translations.th);
      
      let csv = 'key,en,th\n';
      const allKeys = new Set([...Object.keys(enFlat), ...Object.keys(thFlat)]);
      
      allKeys.forEach(key => {
          const enVal = (enFlat[key] || '').replace(/"/g, '""');
          const thVal = (thFlat[key] || '').replace(/"/g, '""');
          csv += `${key},"${enVal}","${thVal}"\n`;
      });
      
      return csv;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, updateTranslations, exportTranslations }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};