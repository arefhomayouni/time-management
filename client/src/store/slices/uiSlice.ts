import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { storage } from '../storage';

export type Language = 'en' | 'fa';
/**
 * 'system' follows the OS preference (prefers-color-scheme) and is the
 * default so an installed PWA matches the phone's own light/dark mode.
 * The other two are explicit user overrides that persist forever.
 */
export type Theme = 'light' | 'dark';
export type ThemePreference = Theme | 'system';
/** Resolved theme written to <html class="dark"> - never 'system'. */
export type ResolvedTheme = Theme;

/** Reads the OS color scheme. Safe on old browsers: defaults to 'light'. */
export const systemPrefersDark = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : false;

/** Turns a stored preference + OS state into the theme to paint. */
export const resolveTheme = (
  pref: ThemePreference,
  systemDark: boolean
): ResolvedTheme => (pref === 'system' ? (systemDark ? 'dark' : 'light') : pref);
export type CurrencyMode = 'usd' | 'dual' | 'irr';
/** Which calendar the UI shows/accepts. The DB always stores Gregorian ISO. */
export type CalendarMode = 'jalali' | 'gregorian';

interface UiState {
  language: Language;
  /** What the user chose: follow the OS, or force light/dark. */
  theme: ThemePreference;
  /**
   * The theme actually painted right now. Only meaningful for 'system'
   * (mirrors the OS); for an explicit choice it equals `theme`. Kept in
   * the store so one selector drives both <html> and the toggle icons.
   */
  resolvedTheme: ResolvedTheme;
  currency: CurrencyMode;
  calendar: CalendarMode;
  /** First-visit calendar chooser has been answered (or skipped). */
  calendarAsked: boolean;
}

const initialThemePref = storage.get<ThemePreference>('theme', 'system');

const initialState: UiState = {
  language: storage.get<Language>('lang', 'en'),
  theme: initialThemePref,
  resolvedTheme: resolveTheme(initialThemePref, systemPrefersDark()),
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
    setTheme: (state, action: PayloadAction<ThemePreference>) => {
      state.theme = action.payload;
      storage.set('theme', action.payload);
      // Resolve immediately for explicit picks; 'system' is resolved by
      // the ThemeSync effect which knows the live OS state.
      if (action.payload !== 'system') state.resolvedTheme = action.payload;
    },
    /**
     * One-tap cycle used by the mobile "More" sheet and the desktop navbar:
     * system -> light -> dark -> system. Keeps a single control honest about
     * all three states instead of silently dropping the OS default.
     */
    cycleTheme: (state) => {
      const order: ThemePreference[] = ['system', 'light', 'dark'];
      const next = order[(order.indexOf(state.theme) + 1) % order.length];
      state.theme = next;
      storage.set('theme', next);
      if (next !== 'system') state.resolvedTheme = next;
    },
    /**
     * Called by ThemeSync whenever the OS reports a new color scheme. No-op
     * unless the user is actually following the system, so an explicit
     * choice is never overwritten by the phone flipping to dark at sunset.
     */
    syncSystemTheme: (state, action: PayloadAction<boolean>) => {
      if (state.theme === 'system') {
        state.resolvedTheme = action.payload ? 'dark' : 'light';
      }
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
  cycleTheme,
  syncSystemTheme,
  setCurrency,
  cycleCurrency,
  setCalendar,
  toggleCalendar,
  dismissCalendarAsk,
} = uiSlice.actions;
export default uiSlice.reducer;
