import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useTranslation(originalText: string): string {
  const { currentLanguage, translationCache, addToCache } = useLanguage();
  const [translatedText, setTranslatedText] = useState(originalText);

  useEffect(() => {
    // If English or no text, just return original
    if (currentLanguage === 'en' || !originalText) {
      setTranslatedText(originalText);
      return;
    }

    // Check cache first
    const cacheKey = `${originalText}:${currentLanguage}`;
    const cached = translationCache.get(cacheKey);
    
    if (cached) {
      setTranslatedText(cached);
      return;
    }

    // Translate
    let cancelled = false;
    
    const translate = async () => {
      try {
        console.log(`Translating "${originalText}" to ${currentLanguage}`);
        
        const { data, error } = await supabase.functions.invoke('translate-text', {
          body: { 
            text: originalText, 
            targetLanguage: currentLanguage 
          }
        });

        if (cancelled) return;

        if (error) {
          console.error('Translation error:', error);
          
          if (error.message?.includes('rate_limit')) {
            toast.error('Translation service is busy. Please try again.');
          } else if (error.message?.includes('payment_required')) {
            toast.error('Translation temporarily unavailable.');
          }
          
          setTranslatedText(originalText);
          return;
        }

        const translation = data?.translation || originalText;
        console.log(`Translated to: "${translation}"`);
        setTranslatedText(translation);
        addToCache(cacheKey, translation);
        
      } catch (err) {
        if (!cancelled) {
          console.error('Translation error:', err);
          setTranslatedText(originalText);
        }
      }
    };

    translate();

    return () => {
      cancelled = true;
    };
  }, [originalText, currentLanguage, translationCache, addToCache]);

  return translatedText;
}
