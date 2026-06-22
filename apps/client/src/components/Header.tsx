import { type ReactNode } from 'react';
import { LanguageSwitch } from './LanguageSwitch';
import type { Lang } from '../i18n/translations';

interface Props {
  title: string;
  languageLabel: string;
  lang: Lang;
  onLangChange: (lang: Lang) => void;
  syncIndicator?: ReactNode;
}

export function Header({ title, languageLabel, lang, onLangChange, syncIndicator }: Props) {
  return (
    <header className="todoHeader">
      {syncIndicator}
      <h1 className="todoHeader__title">{title}</h1>
      <div className="todoHeader__right">
        <LanguageSwitch
          lang={lang}
          onChange={onLangChange}
          label={languageLabel}
        />
      </div>
    </header>
  );
}
