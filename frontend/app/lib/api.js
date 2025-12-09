// app/lib/api.js
import axios from 'axios';
import { getIdTokenForCurrentUser, getCurrentUser } from '../../lib/firebaseClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
export const apiClient = axios.create({ baseURL: API_URL });

// Add request interceptor to include auth token in all requests
apiClient.interceptors.request.use(
  async (config) => {
    const idToken = await getIdTokenForCurrentUser();
    if (idToken) {
      config.headers.Authorization = `Bearer ${idToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- Main App Functions ---
export async function uploadDocumentCollection(files, collectionName, persona, jobToBeDone) {
  const formData = new FormData();
  formData.append('collectionName', collectionName);
  formData.append('personaRole', persona);
  formData.append('jobTask', jobToBeDone);
  files.forEach(function(file) { formData.append('pdfs', file); });

  // new: attach idToken and userId when available so backend can persist user
  const idToken = await getIdTokenForCurrentUser();
  const currentUser = getCurrentUser();
  if (idToken) {
    formData.append('idToken', idToken); // backend helper also checks body.idToken
  }
  if (currentUser && currentUser.uid) {
    formData.append('userId', currentUser.uid);
  }

  const headers = { 'Content-Type': 'multipart/form-data' };
  if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

  const response = await apiClient.post('/api/upload', formData, { headers });
  return response.data.analysisData;
}

export async function getInsights(text_content) {
  const response = await apiClient.post('/api/insights', { text_content });
  return response.data;
}

export async function getHistory() {
  const currentUser = getCurrentUser();
  if (!currentUser || !currentUser.uid) {
    throw new Error('User must be authenticated to view history');
  }
  const res = await apiClient.get('/api/history', {
    params: { userId: currentUser.uid }
  });
  return res.data;
}

export async function getCollectionDetails(collectionId) {
  if (!collectionId) throw new Error('collectionId is required');
  const currentUser = getCurrentUser();
  if (!currentUser || !currentUser.uid) {
    throw new Error('User must be authenticated to view a collection');
  }
  const res = await apiClient.get('/api/history', {
    params: { userId: currentUser.uid, collectionId }
  });
  return res.data;
}

export async function getLatestOutput() {
  const res = await apiClient.get('/api/output');
  return res.data;
}

// Related content based on selected text
export async function getRelated(text, topK = 8) {
  const res = await apiClient.post('/api/related', { text, top_k: topK });
  return res.data;
}

// Add files to an existing collection
export async function addFilesToCollection(collectionId, files) {
  if (!collectionId) throw new Error('collectionId is required');
  const currentUser = getCurrentUser();
  if (!currentUser || !currentUser.uid) {
    throw new Error('User must be authenticated to add files to a collection');
  }

  const formData = new FormData();
  files.forEach(function(file) { formData.append('pdfs', file); });
  formData.append('userId', currentUser.uid);

  const idToken = await getIdTokenForCurrentUser();
  const headers = { 'Content-Type': 'multipart/form-data' };
  if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

  const res = await apiClient.post(`/api/collections/${collectionId}/add-files`, formData, { headers });
  return res.data;
}

export async function deleteCollection(collectionId) {
  if (!collectionId) throw new Error('collectionId is required');
  const currentUser = getCurrentUser();
  if (!currentUser || !currentUser.uid) {
    throw new Error('User must be authenticated to delete a collection');
  }
  
  const idToken = await getIdTokenForCurrentUser();
  const headers = {};
  if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

  const res = await apiClient.delete(`/api/collections/${collectionId}`, {
    headers,
    params: { userId: currentUser.uid }
  });
  return res.data;
}