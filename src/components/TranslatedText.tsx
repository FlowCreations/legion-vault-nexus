import { useTranslation } from 'react-i18next';

interface TranslatedTextProps {
  i18nKey: string;
  className?: string;
}

export function TranslatedText({ i18nKey, className }: TranslatedTextProps) {
  const { t } = useTranslation();
  
  return <span className={className}>{t(i18nKey)}</span>;
}
