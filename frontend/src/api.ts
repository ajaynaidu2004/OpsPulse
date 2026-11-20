import type { Device, Incident, Paginated } from './types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api';

function token(): string | null {
  return localStorage.getItem('opspulse_token');
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  headers.set('Content-Type', 'application/json');

  const accessToken = token();
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);

  const response = await fetch(`${API_URL}${path}`, { ...init, headers });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = payload.message ?? `Request failed (${response.status})`;
    throw new Error(message);
  }

  return payload as T;
}

export async function login(email: string, password: string) {
  return request<{ data: { token: string; user: { name: string; email: string } } }>(
    '/login',
    { method: 'POST', body: JSON.stringify({ email, password }) },
  );
}

export async function getDevices() {
  const result = await request<{ data: Paginated<Device> }>('/devices');
  return result.data.data;
}

export async function getIncidents() {
  const result = await request<{ data: Paginated<Incident> }>('/incidents');
  return result.data.data;
}

export async function createDevice(input: {
  name: string;
  hostname: string;
  check_type: 'http' | 'tcp';
  target: string;
  port?: number;
  interval_seconds: number;
  timeout_seconds: number;
}) {
  return request<{ data: Device }>('/devices', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function logout() {
  return request('/logout', { method: 'POST' });
}
