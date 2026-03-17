import api from './api';

export const AreasInspecaoService = {
  async listar() {
    const response = await api.get('/areas-inspecao');
    return response.data;
  },

  async buscarPorId(id) {
    const response = await api.get(`/areas-inspecao/${id}`);
    return response.data;
  },

  async buscarPorCodigo(codigo) {
    const response = await api.get(`/areas-inspecao/codigo/${codigo}`);
    return response.data;
  },

  async getMaisUtilizadas() {
    try {
      const response = await api.get('/areas-inspecao/mais-utilizadas');
      // Garantir que retorna apenas os dados necessários
      return response.data.map(item => ({
        area: item.area?.codigo || item.area || 'Desconhecida',
        total: item.total || 0
      }));
    } catch (error) {
      console.error('Erro ao buscar áreas mais utilizadas:', error);
      return [];
    }
  },

  async criar(dados) {
    const response = await api.post('/areas-inspecao', dados);
    return response.data;
  },

  async atualizar(id, dados) {
    const response = await api.put(`/areas-inspecao/${id}`, dados);
    return response.data;
  },

  async deletar(id) {
    const response = await api.delete(`/areas-inspecao/${id}`);
    return response.data;
  }
};