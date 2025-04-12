// Add any global test setup here
require('jest-fetch-mock').enableMocks();

// Configure fetch mock
global.fetchMock = global.fetch;
