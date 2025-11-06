import { useTranslation } from '@/hooks/useTranslation';

interface TranslatedTextProps {
  children: string;
  className?: string;
}

export function TranslatedText({ children, className }: TranslatedTextProps) {
  const translatedText = useTranslation(children);
  
  return <span className={className}>{translatedText}</span>;
}
