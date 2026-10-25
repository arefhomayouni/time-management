// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// jsdom has no TextEncoder/TextDecoder, and react-router 7 constructs a
// TextEncoder at module load time - without this every test that imports the
// router dies with "TextEncoder is not defined" before it can assert anything.
import { TextDecoder, TextEncoder } from 'util';

const globals = globalThis as unknown as {
  TextEncoder?: typeof TextEncoder;
  TextDecoder?: typeof TextDecoder;
};

if (!globals.TextEncoder) globals.TextEncoder = TextEncoder;
if (!globals.TextDecoder) globals.TextDecoder = TextDecoder;

// jsdom has no IntersectionObserver, which framer-motion's whileInView needs as
// soon as a motion element mounts. A no-op observer keeps renders alive; the
// elements simply never report as in view.
if (typeof globalThis.IntersectionObserver !== 'function') {
  class StubIntersectionObserver implements IntersectionObserver {
    readonly root: Element | Document | null = null;
    readonly rootMargin: string = '0px';
    readonly thresholds: ReadonlyArray<number> = [0];
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }
  globalThis.IntersectionObserver =
    StubIntersectionObserver as unknown as typeof IntersectionObserver;
}

// jsdom's scrollTo is a stub that logs "Not implemented"; the router scrolls to
// the top on every navigation, which would spam the test output.
if (typeof window !== 'undefined') {
  window.scrollTo = (() => {}) as typeof window.scrollTo;
}

// jsdom does not implement matchMedia either, and the install banner asks it
// whether the device has a fine pointer before rendering.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}
