import { API_BASE_URL } from './config/api.config';

type Json = any;

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }

  return res.status !== 204 ? (res.json() as Promise<Json>) : null;
}

export const api = {
  listProviders: () => request('/providers'),
  getProvider: (id: number) => request(`/providers/${id}`),
  createProvider: (data: object) => request('/providers', { method: 'POST', body: JSON.stringify(data) }),
  updateProvider: (id: number, data: object) => request(`/providers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteProvider: (id: number) => request(`/providers/${id}`, { method: 'DELETE' }),
  checkProviderName: (name: string, excludeId?: number) => {
    const params = excludeId ? `?excludeId=${excludeId}` : '';
    return request(`/providers/check-name/${encodeURIComponent(name)}${params}`);
  },
};

export default api;
