import api from './api';

export const FindingsService = {
  async listar(filtros = {}) {
    const params = new URLSearchParams(filtros).toString();
    const response = await api.get(`/findings?${params}`);
    return response.data;
  },

  async buscarPorId(id) {
    const response = await api.get(`/findings/${id}`);
    return response.data;
  },

  async buscarPorNumero(numero) {
    const response = await api.get(`/findings/numero/${numero}`);
    return response.data;
  },

  async gerarNumero(dados) {
    const response = await api.post('/findings/gerar-numero', dados);
    return response.data;
  },

  async criarParte1(dados) {
    const response = await api.post('/findings', dados);
    return response.data;
  },

  async updateParte2(id, dados) {
    const response = await api.put(`/findings/${id}/parte2`, dados);
    return response.data;
  },

  async updateParte3(id, dados) {
    const response = await api.put(`/findings/${id}/parte3`, dados);
    return response.data;
  },

  async getEstatisticas() {
    const response = await api.get('/findings/estatisticas');
    return response.data;
  },

  async getAtrasados() {
    const response = await api.get('/findings/atrasados');
    return response.data;
  },

  async uploadAnexo(id, file) {
    const formData = new FormData();
    formData.append('anexo', file);
    const response = await api.post(`/findings/${id}/anexos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }
};