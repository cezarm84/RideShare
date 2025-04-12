// This file configures the testing environment for Jest

// Add testing-library custom matchers
import '@testing-library/jest-dom';

// Configure fetch mock
import fetchMock from 'jest-fetch-mock';
fetchMock.enableMocks();
