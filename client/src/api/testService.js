import api from './axios';

export const testService = {
  getAllResults: async (params = {}) => {
    const p = new URLSearchParams(params);
    const response = await api.get(`/test/results/all?${p}`);
    return response.data;
  },
  noteSession: async (id) => {
    const response = await api.put(`/test/sessions/${id}/note`);
    return response.data;
  }
};
