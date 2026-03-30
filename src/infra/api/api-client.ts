// src/infra/api/api-client.ts

import axios from 'axios';
import { API_URL } from '@/shared/constants';
import { useAuthStore } from '@/application/stores/auth.store';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async (config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
