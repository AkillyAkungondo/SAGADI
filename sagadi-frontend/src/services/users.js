import api from './api';

export const UsersService = {
  async listar() {
    const response = await api.get('/users');
    return response.data;
  },

  async buscarPorId(id) {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  async getPerfis() {
    const response = await api.get('/users/perfis');
    return response.data;
  },

  async getDirecoes() {
    const response = await api.get('/users/direcoes');
    return response.data;
  },

  async criar(dados) {
    const response = await api.post('/users', dados);
    return response.data;
  },

  async atualizar(id, dados) {
    const response = await api.put(`/users/${id}`, dados);
    return response.data;
  },

  async deletar(id) {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  }
};