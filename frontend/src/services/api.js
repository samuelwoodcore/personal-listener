import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getWebhooks = async () => {
  const response = await api.get('/webhooks');
  return response.data;
};

export const getWebhook = async (id) => {
  const response = await api.get(`/webhooks/${id}`);
  return response.data;
};

export const createWebhook = async (name, responseCode, responseBody) => {
  const response = await api.post('/webhooks', {
    name,
    responseCode,
    responseBody,
  });
  return response.data;
};

export const updateWebhook = async (id, name, responseCode, responseBody) => {
  const response = await api.put(`/webhooks/${id}`, {
    name,
    responseCode,
    responseBody,
  });
  return response.data;
};

export const deleteWebhook = async (id) => {
  const response = await api.delete(`/webhooks/${id}`);
  return response.data;
};

export const getWebhookEvents = async (id, page = 1, limit = 20) => {
  const response = await api.get(`/webhooks/${id}/events`, {
    params: { page, limit },
  });
  return response.data;
};

export const searchEventsByReference = async (reference) => {
  const response = await api.get('/events/search', {
    params: { reference },
  });
  return response.data;
};
