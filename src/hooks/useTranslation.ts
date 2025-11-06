import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useTranslation(originalText: string): string {
  const { currentLanguage, translationCache, addToCache } = useLanguage();
  const [translatedText, setTranslatedText] = useState(originalText);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    // If English, just return original text
    if (currentLanguage === 'en') {
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

    // If not in cache and not already translating, translate
    if (!isTranslating) {
      setIsTranslating(true);
      
      const translateText = async () => {
        try {
          const { data, error } = await supabase.functions.invoke('translate-text', {
            body: { 
              text: originalText, 
              targetLanguage: currentLanguage 
            }
          });

          if (error) {
            console.error('Translation error:', error);
            
            if (error.message?.includes('rate_limit')) {
              toast.error('Translation service is busy. Please try again in a moment.');
            } else if (error.message?.includes('payment_required')) {
              toast.error('Translation temporarily unavailable. Showing original text.');
            }
            
            setTranslatedText(originalText);
            setIsTranslating(false);
            return;
          }

          const translation = data.translation || originalText;
          setTranslatedText(translation);
          addToCache(cacheKey, translation);
          
        } catch (err) {
          console.error('Translation error:', err);
          setTranslatedText(originalText);
        } finally {
          setIsTranslating(false);
        }
      };

      // Debounce to avoid excessive calls
      const timeout = setTimeout(translateText, 100);
      return () => clearTimeout(timeout);
    }
  }, [originalText, currentLanguage, translationCache, addToCache, isTranslating]);

  return translatedText;
}
