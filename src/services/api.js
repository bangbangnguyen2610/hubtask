import axios from 'axios';

// Base API instance
const api = axios.create({
  timeout: 30000,
});

// Lark API Service
export const larkApi = {
  baseUrl: '',
  appId: '',
  appSecret: '',

  configure(config) {
    this.baseUrl = config.baseUrl || 'https://open.larksuite.com/open-apis';
    this.appId = config.appId;
    this.appSecret = config.appSecret;
  },

  async getAccessToken() {
    const response = await api.post(`${this.baseUrl}/auth/v3/tenant_access_token/internal`, {
      app_id: this.appId,
      app_secret: this.appSecret,
    });
    return response.data.tenant_access_token;
  },

  async getTasks(token, options = {}) {
    const response = await api.get(`${this.baseUrl}/task/v2/tasks`, {
      headers: { Authorization: `Bearer ${token}` },
      params: options,
    });
    return response.data;
  },

  async getTaskLists(token) {
    const response = await api.get(`${this.baseUrl}/task/v2/tasklists`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};

// Cloudflare API Service
export const cloudflareApi = {
  baseUrl: 'https://api.cloudflare.com/client/v4',
  apiToken: '',
  accountId: '',

  configure(config) {
    this.apiToken = config.apiToken;
    this.accountId = config.accountId;
  },

  async getZones() {
    const response = await api.get(`${this.baseUrl}/zones`, {
      headers: { Authorization: `Bearer ${this.apiToken}` },
    });
    return response.data;
  },

  async getAnalytics(zoneId, since = '-1440') {
    const response = await api.get(`${this.baseUrl}/zones/${zoneId}/analytics/dashboard`, {
      headers: { Authorization: `Bearer ${this.apiToken}` },
      params: { since },
    });
    return response.data;
  },

  async getPagesProjects() {
    const response = await api.get(`${this.baseUrl}/accounts/${this.accountId}/pages/projects`, {
      headers: { Authorization: `Bearer ${this.apiToken}` },
    });
    return response.data;
  },

  async getWorkersScripts() {
    const response = await api.get(`${this.baseUrl}/accounts/${this.accountId}/workers/scripts`, {
      headers: { Authorization: `Bearer ${this.apiToken}` },
    });
    return response.data;
  },
};

// Generic API for custom integrations
export const customApi = {
  endpoints: [],

  addEndpoint(config) {
    this.endpoints.push(config);
  },

  removeEndpoint(id) {
    this.endpoints = this.endpoints.filter(e => e.id !== id);
  },

  async fetchEndpoint(id) {
    const endpoint = this.endpoints.find(e => e.id === id);
    if (!endpoint) throw new Error('Endpoint not found');

    const response = await api({
      method: endpoint.method || 'GET',
      url: endpoint.url,
      headers: endpoint.headers || {},
      data: endpoint.body,
    });
    return response.data;
  },
};

export default api;
