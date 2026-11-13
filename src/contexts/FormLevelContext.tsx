import React, { createContext, useContext, useState } from 'react';
import { FormLevelFilter } from '../types/index.ts';

interface FormLevelContextValue {
  formLevel: FormLevelFilter;
  setFormLevel: (level: FormLevelFilter) => void;
}

const STORAGE_KEY = 'ict_made_easy_form_level';

const FormLevelContext = createContext<FormLevelContextValue | null>(null);

export const FormLevelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [formLevel, setFormLevelState] = useState<FormLevelFilter>(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === '1' || raw === '2' || raw === '3' || raw === '4') {
      return Number(raw) as 1 | 2 | 3 | 4;
    }
    return 'all';
  });

  const setFormLevel = (level: FormLevelFilter) => {
    setFormLevelState(level);
    localStorage.setItem(STORAGE_KEY, String(level));
  };

  return (
    <FormLevelContext.Provider value={{ formLevel, setFormLevel }}>
      {children}
    </FormLevelContext.Provider>
  );
};

export function useFormLevel() {
  const ctx = useContext(FormLevelContext);
  if (!ctx) throw new Error('useFormLevel must be used inside FormLevelProvider');
  return ctx;
}
