import api from './api';

export const AerodromosService = {
  async listar() {
    const response = await api.get('/aerodromos');
    return response.data;
  },

  async buscarPorId(id) {
    const response = await api.get(`/aerodromos/${id}`);
    return response.data;
  },

  async buscarPorCodigo(codigo) {
    const response = await api.get(`/aerodromos/codigo/${codigo}`);
    return response.data;
  },

  async getProvincias() {
    const response = await api.get('/aerodromos/provincias');
    return response.data;
  },

  async getCategorias() {
    const response = await api.get('/aerodromos/categorias');
    return response.data;
  },

  async criar(dados) {
    const response = await api.post('/aerodromos', dados);
    return response.data;
  },

  async atualizar(id, dados) {
    const response = await api.put(`/aerodromos/${id}`, dados);
    return response.data;
  },

  async deletar(id) {
    const response = await api.delete(`/aerodromos/${id}`);
    return response.data;
  },

  async getEstatisticas(id) {
    const response = await api.get(`/aerodromos/${id}/estatisticas`);
    return response.data;
  }
};