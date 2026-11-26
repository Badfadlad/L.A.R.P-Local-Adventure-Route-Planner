// Adds matchers like expect(el).toBeInTheDocument() and toHaveAttribute().
import "@testing-library/jest-dom";

// jsdom doesn't have ResizeObserver (used by MapPreview).
global.ResizeObserver =
  global.ResizeObserver ||
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
