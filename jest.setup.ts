import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

Object.assign(global, { TextDecoder, TextEncoder });

// Polyfill fetch API for Next.js API route testing
if (typeof Request === 'undefined') {
  const { Request, Response, Headers, fetch } = require('cross-fetch');
  Object.assign(global, { Request, Response, Headers, fetch });
}

// polyfill Response.json static method which is missing in cross-fetch but required by Next.js
if (typeof Response !== 'undefined' && typeof Response.json !== 'function') {
  Response.json = function(data: any, init?: ResponseInit) {
    return new Response(JSON.stringify(data), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {})
      }
    });
  };
}

// Note: Mock Redis clearing is handled in individual test files
// to ensure proper test isolation and avoid timing issues
