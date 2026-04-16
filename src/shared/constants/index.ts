// src/shared/constants/index.ts

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
};
