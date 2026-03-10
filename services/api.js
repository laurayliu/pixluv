
function getBaseUrl() {
  return 'https://project-api-pixluv.onrender.com/api';
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

async function put(path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PUT ${path} failed: ${res.status}`);
  return res.json();
}

export const api = {
  hello: () => get('/'),
  getPostsByUser: (userId, token) => get(`/posts/user/${userId}`, token),
  getPosts: (userId, token) => get(`/posts${userId ? `?userId=${encodeURIComponent(userId)}` : ''}`, token),
  getUser: (id) => get(`/users/${id}`),
  updateUser: (id, data, token) => put(`/users/${id}`, data, token),
  searchUsers: (query, token) => get(`/users?search=${encodeURIComponent(query)}`, token),

  login: (email, password) => post('/auth/login', { email, password }),
  signup: (username, email, password) => post('/auth/signup', { username, email, password }),
  createPost: (data, token) => post('/posts', data, token),

  likePost: (postId, token) => post(`/posts/${postId}/like`, {}, token),

  getComments: (postId) => get(`/posts/${postId}/comments`),
  createComment: (postId, body, token) => post(`/posts/${postId}/comments`, {body}, token),

  getInbox: (token) => get('/pixing', token),
  getConversation: (otherUserId, token) => get(`/pixing/${otherUserId}`, token),
  sendPix: (receiverId, message, imageUrl, token) =>
    post('/pixing', { receiverId, ...(message ? { message } : {}), ...(imageUrl ? { imageUrl } : {}) }, token),

  getChallenges: () => get('/challenges'),
  getTodayChallenge: () => get('/challenges/today'),
  getTodayChallengePosts: (token) => get('/posts/challenge/today', token),
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
