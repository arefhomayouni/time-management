import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { storage } from '../storage';

export type Language = 'en' | 'fa';
export type Theme = 'light' | 'dark';
export type CurrencyMode = 'usd' | 'dual' | 'irr';
/** Which calendar the UI shows/accepts. The DB always stores Gregorian ISO. */
export type CalendarMode = 'jalali' | 'gregorian';

interface UiState {
  language: Language;
  theme: Theme;
  currency: CurrencyMode;
  calendar: CalendarMode;
  /** First-visit calendar chooser has been answered (or skipped). */
  calendarAsked: boolean;
}

const initialState: UiState = {
  language: storage.get<Language>('lang', 'en'),
  theme: storage.get<Theme>('theme', 'light'),
  currency: storage.get<CurrencyMode>('currency', 'dual'),
  // Default follows the language, but the user can override it anytime.
  calendar: storage.get<CalendarMode>(
    'calendar',
    storage.get<Language>('lang', 'en') === 'fa' ? 'jalali' : 'gregorian'
  ),
  calendarAsked: storage.get<boolean>('calendarAsked', false),
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
    setCalendar: (state, action: PayloadAction<CalendarMode>) => {
      state.calendar = action.payload;
      state.calendarAsked = true;
      storage.set('calendar', action.payload);
      storage.set('calendarAsked', true);
    },
    toggleCalendar: (state) => {
      state.calendar = state.calendar === 'jalali' ? 'gregorian' : 'jalali';
      state.calendarAsked = true;
      storage.set('calendar', state.calendar);
      storage.set('calendarAsked', true);
    },
    dismissCalendarAsk: (state) => {
      state.calendarAsked = true;
      storage.set('calendarAsked', true);
    },
    /**
     * Re-open the chooser on demand (navbar calendar button). Unlike
     * dismissCalendarAsk, this clears the answered flag so the dialog
     * renders again; the choice itself is left untouched until picked.
     */
    openCalendarAsk: (state) => {
      state.calendarAsked = false;
      storage.set('calendarAsked', false);
    },
  },
});

export const {
  setLanguage,
  openCalendarAsk,
  setTheme,
  toggleTheme,
  setCurrency,
  cycleCurrency,
  setCalendar,
  toggleCalendar,
  dismissCalendarAsk,
} = uiSlice.actions;
export default uiSlice.reducer;
