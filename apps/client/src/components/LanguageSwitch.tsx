import { type Lang } from '../i18n/translations';

interface Props {
  lang: Lang;
  onChange: (lang: Lang) => void;
  label: string;
}

export function LanguageSwitch({ lang, onChange, label }: Props) {
  const pos = lang === 'en' ? 0 : 1;

  return (
    <div
      className="langSwitch"
      aria-label={label}
      style={{ '--pos': pos } as React.CSSProperties}
    >
      <span className="langBlob" aria-hidden="true" />
      <button
        type="button"
        className={`langBtn ${lang === 'en' ? 'isActive' : ''}`}
        aria-pressed={lang === 'en'}
        onClick={() => onChange('en')}
      >
        EN
      </button>
      <button
        type="button"
        className={`langBtn ${lang === 'ru' ? 'isActive' : ''}`}
        aria-pressed={lang === 'ru'}
        onClick={() => onChange('ru')}
      >
        RU
      </button>
    </div>
  );
}
