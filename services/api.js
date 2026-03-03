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

async function get(path, token) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, { headers });
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

async function post(path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
  return res.json();
}

export const api = {
  hello: () => get('/'),
  getPosts: () => get('/posts'),
  getUser: (id) => get(`/users/${id}`),

  login: (email, password) => post('/auth/login', { email, password }),
  signup: (username, email, password) => post('/auth/signup', { username, email, password }),

  getPresignedUrl: (filename, token) =>
    get(
      `/sign-s3?fileName=${encodeURIComponent(filename)}&fileType=${encodeURIComponent('image/png')}`,
      token
    ),
  uploadToS3: async (presignedUrl, base64Data) => {
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const uploadRes = await fetch(presignedUrl, {
      method: 'PUT',
      body: bytes.buffer,
      headers: {
        'Content-Type': 'image/png',
      },
    });

    if (!uploadRes.ok) {
      const errorBody = await uploadRes.text().catch(() => '');
      throw new Error(
        `S3 Upload failed: ${uploadRes.status} ${uploadRes.statusText}${errorBody ? ` - ${errorBody}` : ''}`
      );
    }

    return uploadRes;
  },
};
