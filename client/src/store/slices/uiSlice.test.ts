import reducer, {
  cycleTheme,
  resolveTheme,
  setTheme,
  syncSystemTheme,
} from './uiSlice';

/**
 * Theme rules under test:
 *  - 'system' follows the OS and is the default (an installed PWA should match
 *    the phone without anybody touching a setting);
 *  - an explicit light/dark pick survives the OS flipping, because a user who
 *    chose dark once does not want it silently undone at sunset;
 *  - the one-tap cycle exposes all three states.
 */
describe('resolveTheme', () => {
  it('follows the OS when the preference is system', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
  });

  it('honours an explicit preference regardless of the OS', () => {
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });
});

describe('theme reducer', () => {
  const base = { theme: 'system' as const, resolvedTheme: 'light' as const };

  it('lets the OS drive the painted theme while following the system', () => {
    const next = reducer(base as any, syncSystemTheme(true));
    expect(next.resolvedTheme).toBe('dark');
  });

  it('ignores OS changes after an explicit pick', () => {
    const dark = reducer(base as any, setTheme('dark'));
    expect(dark.resolvedTheme).toBe('dark');

    const afterSunrise = reducer(dark, syncSystemTheme(false));
    expect(afterSunrise.theme).toBe('dark');
    expect(afterSunrise.resolvedTheme).toBe('dark');
  });

  it('cycles system -> light -> dark -> system', () => {
    let state: any = base;
    state = reducer(state, cycleTheme());
    expect(state.theme).toBe('light');
    state = reducer(state, cycleTheme());
    expect(state.theme).toBe('dark');
    state = reducer(state, cycleTheme());
    expect(state.theme).toBe('system');
  });
});
