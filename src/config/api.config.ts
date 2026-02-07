// En producción con nginx, usar rutas relativas
// Nginx redirige /api/* a localhost:8080/api/*
const baseUrl = import.meta.env.VITE_API_URL || '';
export const API_BASE_URL = baseUrl ? `${baseUrl}/api` : '/api';
