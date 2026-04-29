import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to headers if available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authAPI = {
  register: (email: string, password: string, name: string) =>
    apiClient.post('/auth/register', { email, password, name }),
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),
  getCurrentUser: () => apiClient.get('/auth/me'),
  logout: () => apiClient.post('/auth/logout'),
};

export const documentAPI = {
  create: (title: string, content: string) =>
    apiClient.post('/documents', { title, content }),
  getAll: () => apiClient.get('/documents'),
  getOne: (id: string) => apiClient.get(`/documents/${id}`),
  update: (id: string, title: string, content: string) =>
    apiClient.put(`/documents/${id}`, { title, content }),
  delete: (id: string) => apiClient.delete(`/documents/${id}`),
  uploadFile: (file: File, customTitle?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (customTitle) {
      formData.append('title', customTitle);
    }
    return apiClient.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getFileMetadata: (id: string) => apiClient.get(`/documents/${id}/file-metadata`),
};

export const commentAPI = {
  create: (documentId: string, content: string, startPos: number, endPos: number) =>
    apiClient.post(`/documents/${documentId}/comments`, {
      content,
      startPos,
      endPos,
    }),
  getAll: (documentId: string) =>
    apiClient.get(`/documents/${documentId}/comments`),
  update: (documentId: string, commentId: string, content: string) =>
    apiClient.put(`/documents/${documentId}/comments/${commentId}`, {
      content,
    }),
  delete: (documentId: string, commentId: string) =>
    apiClient.delete(`/documents/${documentId}/comments/${commentId}`),
  reply: (documentId: string, commentId: string, content: string) =>
    apiClient.post(`/documents/${documentId}/comments/${commentId}/replies`, {
      content,
    }),
};

export const sharingAPI = {
  shareDocument: (documentId: string, userId: string, role: string) =>
    apiClient.post(`/documents/${documentId}/share`, {
      userId,
      role,
    }),
  removeAccess: (documentId: string, userId: string) =>
    apiClient.delete(`/documents/${documentId}/share/${userId}`),
  getSharedWith: (documentId: string) =>
    apiClient.get(`/documents/${documentId}/shared`),
};

export const versionAPI = {
  getHistory: (documentId: string) =>
    apiClient.get(`/documents/${documentId}/versions`),
  getVersion: (documentId: string, versionId: string) =>
    apiClient.get(`/documents/${documentId}/versions/${versionId}`),
  restore: (documentId: string, versionId: string) =>
    apiClient.post(`/documents/${documentId}/versions/${versionId}/restore`),
};

export const searchAPI = {
  search: (query: string) =>
    apiClient.get('/documents/search', { params: { q: query } }),
};

export default apiClient;
