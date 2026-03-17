import api from './api';

export const AuthService = {
  async login(email, senha) {
    try {
      const response = await api.post('/auth/login', { email, senha });
      return response.data;
    } catch (error) {
      console.error('Erro detalhado no login:', error.response || error);
      throw error;
    }
  },

  async logout() {
    await api.post('/auth/logout');
  },

  async getMe() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  async alterarSenha(senha_atual, nova_senha) {
    const response = await api.put('/auth/alterar-senha', { senha_atual, nova_senha });
    return response.data;
  }
};