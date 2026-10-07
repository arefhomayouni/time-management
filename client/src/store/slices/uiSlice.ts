import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { storage } from '../storage';

export type Language = 'en' | 'fa';
export type Theme = 'light' | 'dark';
export type CurrencyMode = 'usd' | 'dual' | 'irr';

interface UiState {
  language: Language;
  theme: Theme;
  currency: CurrencyMode;
}

const initialState: UiState = {
  language: storage.get<Language>('lang', 'en'),
  theme: storage.get<Theme>('theme', 'light'),
  currency: storage.get<CurrencyMode>('currency', 'dual'),
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLanguage: (state, action: PayloadAction<Language>) => {
      state.language = action.payload;
      storage.set('lang', action.payload);
    },
    setTheme: (state, action: PayloadAction<Theme>) => {
      state.theme = action.payload;
      storage.set('theme', action.payload);
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      storage.set('theme', state.theme);
    },
    setCurrency: (state, action: PayloadAction<CurrencyMode>) => {
      state.currency = action.payload;
      storage.set('currency', action.payload);
    },
    cycleCurrency: (state) => {
      const order: CurrencyMode[] = ['dual', 'usd', 'irr'];
      const i = order.indexOf(state.currency);
      state.currency = order[(i + 1) % order.length];
      storage.set('currency', state.currency);
    },
  },
});

export const { setLanguage, setTheme, toggleTheme, setCurrency, cycleCurrency } = uiSlice.actions;
export default uiSlice.reducer;
