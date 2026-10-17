import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Language, Translations } from './types';
import { zh } from './locales/zh';
import { en } from './locales/en';

interface I18nStoreState {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

const getInitialLanguage = (): Language => {
  if (typeof window !== 'undefined' && window.navigator) {
    const navLang = window.navigator.language.toLowerCase();
    if (navLang.startsWith('zh')) return 'zh';
  }
  return 'en';
};

export const useI18nStore = create<I18nStoreState>()(
  persist(
    (set, get) => ({
      language: getInitialLanguage(),
      setLanguage: (lang) => {
        if (typeof document !== 'undefined') {
          document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
        }
        set({ language: lang });
      },
      toggleLanguage: () => {
        const next = get().language === 'zh' ? 'en' : 'zh';
        get().setLanguage(next);
      },
    }),
    {
      name: 'tools-local-i18n-lang',
    }
  )
);

export function useI18n(): {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: Translations;
} {
  const { language, setLanguage, toggleLanguage } = useI18nStore();
  const t = language === 'zh' ? zh : en;
  return { language, setLanguage, toggleLanguage, t };
}
