import '@testing-library/jest-dom';

// Mock scrollIntoView for Radix UI components
if (typeof window !== 'undefined') {
  window.HTMLElement.prototype.scrollIntoView = function() {};
  window.HTMLElement.prototype.hasPointerCapture = function() { return false; };
  window.HTMLElement.prototype.releasePointerCapture = function() {};
}

// Mock ResizeObserver for Radix UI components
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock IntersectionObserver for Radix UI components
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock PointerEvent for Radix UI components
global.PointerEvent = class PointerEvent extends Event {
  constructor(type: string, props: PointerEventInit = {}) {
    super(type, props);
    this.pointerId = props.pointerId ?? 1;
    this.pointerType = props.pointerType ?? 'mouse';
  }
  pointerId: number;
  pointerType: string;
};
