// This file configures the testing environment for Jest

// Add testing-library custom matchers
import '@testing-library/jest-dom';

// Configure fetch mock
import fetchMock from 'jest-fetch-mock';
fetchMock.enableMocks();

// Mock TextEncoder/TextDecoder for React Router tests
if (typeof global.TextEncoder === 'undefined') {
  // @ts-ignore
  global.TextEncoder = require('util').TextEncoder;
}

if (typeof global.TextDecoder === 'undefined') {
  // @ts-ignore
  global.TextDecoder = require('util').TextDecoder;
}

// Mock the cn function from utils
jest.mock('@/lib/utils', () => ({
  cn: (...inputs: any[]) => inputs.join(' '),
}));

// Mock React.forwardRef for components that use it
import React from 'react';
const originalForwardRef = React.forwardRef;
if (!originalForwardRef) {
  // @ts-ignore
  React.forwardRef = function forwardRefShim(Component) {
    return Component;
  };
}
