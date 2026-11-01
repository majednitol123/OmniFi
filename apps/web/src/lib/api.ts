import { OmniFiClient } from '@omnifi/api-client';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:3001` : 'http://localhost:3001');

export const apiClient = new OmniFiClient({
  baseUrl: API_BASE_URL,
  fetchFn: (input, init) => fetch(input, init),
});

