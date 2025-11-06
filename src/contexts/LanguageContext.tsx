import React, { createContext, useContext, useState, useEffect } from 'react';

interface LanguageContextType {
  currentLanguage: string;
  changeLanguage: (language: string) => void;
  translationCache: Map<string, string>;
  addToCache: (key: string, translation: string) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const CACHE_KEY = 'translation_cache';
const CACHE_EXPIRY_KEY = 'translation_cache_expiry';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<string>(() => {
    return localStorage.getItem('preferred_language') || 'en';
  });
  
  const [translationCache, setTranslationCache] = useState<Map<string, string>>(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    const expiry = localStorage.getItem(CACHE_EXPIRY_KEY);
    
    if (cached && expiry && Date.now() < parseInt(expiry)) {
      return new Map(JSON.parse(cached));
    }
    return new Map();
  });

  useEffect(() => {
    localStorage.setItem('preferred_language', currentLanguage);
  }, [currentLanguage]);

  useEffect(() => {
    localStorage.setItem(CACHE_KEY, JSON.stringify(Array.from(translationCache.entries())));
    localStorage.setItem(CACHE_EXPIRY_KEY, (Date.now() + CACHE_DURATION).toString());
  }, [translationCache]);

  const changeLanguage = (language: string) => {
    setCurrentLanguage(language);
  };

  const addToCache = (key: string, translation: string) => {
    setTranslationCache(prev => new Map(prev).set(key, translation));
  };

  return (
    <LanguageContext.Provider value={{ currentLanguage, changeLanguage, translationCache, addToCache }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
