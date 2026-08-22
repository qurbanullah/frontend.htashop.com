import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { isRTL } from '@/i18n/config';

interface Language {
  code: string;
  name: string;
  flag: string;
}

const languages: Language[] = [
  { code: 'en', name: 'English', flag: 'GB' },
  { code: 'ur', name: 'اردو', flag: 'PK' },
  { code: 'de', name: 'Deutsch', flag: 'DE' },
];

// Helper component to render flag
function FlagIcon({ countryCode, className = "" }: { countryCode: string; className?: string }) {
  return (
    <img
      src={`https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`}
      srcSet={`https://flagcdn.com/w80/${countryCode.toLowerCase()}.png 2x`}
      alt={`${countryCode} flag`}
      className={`inline-block ${className}`}
      style={{ width: '24px', height: '18px' }}
    />
  );
}

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language;
  const [isOpen, setIsOpen] = useState(false);

  // Update document attributes when language changes
  useEffect(() => {
    const htmlElement = document.documentElement;
    const dir = isRTL(currentLanguage) ? 'rtl' : 'ltr';
    
    htmlElement.setAttribute('lang', currentLanguage);
    htmlElement.setAttribute('dir', dir);
    
    // Update body class for RTL-specific styling
    if (isRTL(currentLanguage)) {
      document.body.classList.add('rtl');
    } else {
      document.body.classList.remove('rtl');
    }
  }, [currentLanguage]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setIsOpen(false);
    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  const changeLanguage = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    setIsOpen(false);
  };

  const getCurrentLanguage = (): Language => {
    return languages.find(lang => lang.code === currentLanguage) ?? languages[0]!;
  };

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="flex items-center gap-2 px-3 py-2 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        aria-label="Change language"
        title={getCurrentLanguage().name}
      >
        <FlagIcon countryCode={getCurrentLanguage().flag} />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 z-50 w-40 mt-2 overflow-hidden bg-white border border-gray-200 rounded-lg shadow-lg top-full dark:bg-gray-800 dark:border-gray-700">
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => changeLanguage(language.code)}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                currentLanguage === language.code
                  ? 'bg-blue-50 dark:bg-blue-900/30'
                  : 'dark:text-gray-100'
              }`}
              title={language.name}
            >
              <FlagIcon countryCode={language.flag} />
              <span className="flex-1 text-sm font-medium text-left dark:text-gray-100">{language.name}</span>
              {currentLanguage === language.code && (
                <span className="text-blue-600 dark:text-blue-400">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Simple language switcher without dropdown (alternative)
export function SimpleLanguageSwitcher() {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language;

  useEffect(() => {
    const htmlElement = document.documentElement;
    const dir = isRTL(currentLanguage) ? 'rtl' : 'ltr';
    
    htmlElement.setAttribute('lang', currentLanguage);
    htmlElement.setAttribute('dir', dir);
    
    if (isRTL(currentLanguage)) {
      document.body.classList.add('rtl');
    } else {
      document.body.classList.remove('rtl');
    }
  }, [currentLanguage]);

  const changeLanguage = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
  };

  return (
    <div className="flex items-center gap-2">
      {languages.map((language) => (
        <button
          key={language.code}
          onClick={() => changeLanguage(language.code)}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            currentLanguage === language.code
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
          title={language.name}
        >
          <FlagIcon countryCode={language.flag} />
        </button>
      ))}
    </div>
  );
}
