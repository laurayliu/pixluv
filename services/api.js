import { Platform } from 'react-native';
import Constants from 'expo-constants';

function getBaseUrl() {
  if (Platform.OS === 'web') return 'http://localhost:9090/api';
  if (Platform.OS === 'android' && !Constants.expoConfig?.hostUri) {
    return 'http://10.0.2.2:9090/api'; // android emulator
  }
  const host = Constants.expoConfig?.hostUri?.split(':')[0]; // ip from hostUri
  if (host) return `http://${host}:9090/api`;
  return 'http://localhost:9090/api';
}

const BASE_URL = getBaseUrl();

async function get(path) {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

async function post(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
  return res.json();
}

export const api = {
  hello: () => get('/'),
  getPosts: () => get('/posts'),
  createUser: (data) => post('/users', data),
  getUser: (id) => get(`/users/${id}`),
};
