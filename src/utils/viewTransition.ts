import { flushSync } from 'react-dom';

/**
 * Wraps UI state updates with the native Same-Document View Transitions API
 * (GoogleChrome/modern-web-guidance Baseline standard) while respecting
 * `prefers-reduced-motion: reduce` and falling back cleanly when unsupported.
 */
export function runWithViewTransition(update: () => void): void {
  if (typeof document === 'undefined') {
    update();
    return;
  }

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const doc = document as Document & {
    startViewTransition?: (callback: () => void) => { finished: Promise<void> };
  };

  if (prefersReducedMotion || typeof doc.startViewTransition !== 'function') {
    update();
    return;
  }

  try {
    doc.startViewTransition(() => {
      flushSync(() => {
        update();
      });
    });
  } catch {
    update();
  }
}
