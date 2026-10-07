import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { storage } from '../storage';

export type Language = 'en' | 'fa';
export type Theme = 'light' | 'dark';

interface UiState {
  language: Language;
  theme: Theme;
}

const initialState: UiState = {
  language: storage.get<Language>('lang', 'en'),
  theme: storage.get<Theme>('theme', 'light'),
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
  },
});

export const { setLanguage, setTheme, toggleTheme } = uiSlice.actions;
export default uiSlice.reducer;
