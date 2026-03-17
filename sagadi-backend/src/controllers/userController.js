const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const authConfig = require('../config/auth')

const prisma = new PrismaClient()

class UserController {
  // Listar todos os utilizadores (apenas admin)
  async index(req, res) {
    try {
      // Verificar se é admin
      if (req.userPerfil !== 'admin_nacional') {
        return res.status(403).json({ 
          error: 'Acesso negado. Apenas administradores podem listar utilizadores.' 
        })
      }

      const utilizadores = await prisma.utilizador.findMany({
        include: {
          perfil: true,
          direcao: true
        },
        orderBy: {
          nome_completo: 'asc'
        }
      })

      // Remover senha_hash de cada utilizador
      const usersWithoutPassword = utilizadores.map(user => {
        const { senha_hash, ...userWithoutPassword } = user
        return userWithoutPassword
      })

      return res.json(usersWithoutPassword)
    } catch (error) {
      console.error('Erro ao listar utilizadores:', error)
      return res.status(500).json({ 
        error: 'Erro interno do servidor' 
      })
    }
  }

  // Buscar um utilizador específico
  async show(req, res) {
    try {
      const { id } = req.params

      // Se não for admin, só pode ver o próprio perfil
      if (req.userPerfil !== 'admin_nacional' && parseInt(id) !== req.userId) {
        return res.status(403).json({ 
          error: 'Acesso negado. Você só pode ver seu próprio perfil.' 
        })
      }

      const utilizador = await prisma.utilizador.findUnique({
        where: { id: parseInt(id) },
        include: {
          perfil: true,
          direcao: true
        }
      })

      if (!utilizador) {
        return res.status(404).json({ 
          error: 'Utilizador não encontrado' 
        })
      }

      const { senha_hash, ...userWithoutPassword } = utilizador
      return res.json(userWithoutPassword)
    } catch (error) {
      console.error('Erro ao buscar utilizador:', error)
      return res.status(500).json({ 
        error: 'Erro interno do servidor' 
      })
    }
  }

  // Criar novo utilizador (apenas admin)
  async create(req, res) {
    try {
      // Verificar se é admin
      if (req.userPerfil !== 'admin_nacional') {
        return res.status(403).json({ 
          error: 'Acesso negado. Apenas administradores podem criar utilizadores.' 
        })
      }

      const { 
        nome_completo, 
        email, 
        senha, 
        perfil_id, 
        direcao_id,
        cargo,
        telefone 
      } = req.body

      // Validações básicas
      if (!nome_completo || !email || !senha || !perfil_id) {
        return res.status(400).json({ 
          error: 'Nome, email, senha e perfil são obrigatórios' 
        })
      }

      // Verificar se email já existe
      const emailExiste = await prisma.utilizador.findUnique({
        where: { email }
      })

      if (emailExiste) {
        return res.status(400).json({ 
          error: 'Email já está em uso' 
        })
      }

      // Hash da senha
      const senha_hash = await bcrypt.hash(senha, authConfig.bcrypt.saltRounds)

      // Criar utilizador
      const novoUtilizador = await prisma.utilizador.create({
        data: {
          nome_completo,
          email,
          senha_hash,
          perfil_id: parseInt(perfil_id),
          direcao_id: direcao_id ? parseInt(direcao_id) : null,
          cargo,
          telefone,
          ativo: true
        },
        include: {
          perfil: true,
          direcao: true
        }
      })

      // Log da ação
      await prisma.auditoria_log.create({
        data: {
          utilizador_id: req.userId,
          acao: 'CREATE',
          entidade: 'utilizador',
          entidade_id: novoUtilizador.id,
          dados_depois: novoUtilizador,
          ip_address: req.ip,
          user_agent: req.headers['user-agent']
        }
      })

      const { senha_hash: _, ...userWithoutPassword } = novoUtilizador
      return res.status(201).json(userWithoutPassword)
    } catch (error) {
      console.error('Erro ao criar utilizador:', error)
      return res.status(500).json({ 
        error: 'Erro interno do servidor' 
      })
    }
  }

  // Atualizar utilizador
  async update(req, res) {
    try {
      const { id } = req.params

      // Verificar permissão
      if (req.userPerfil !== 'admin_nacional' && parseInt(id) !== req.userId) {
        return res.status(403).json({ 
          error: 'Acesso negado. Você só pode editar seu próprio perfil.' 
        })
      }

      const { 
        nome_completo, 
        email, 
        cargo,
        telefone,
        perfil_id,
        direcao_id,
        ativo 
      } = req.body

      // Se não for admin, não pode alterar perfil, direção ou status
      if (req.userPerfil !== 'admin_nacional') {
        if (perfil_id || direcao_id || ativo !== undefined) {
          return res.status(403).json({ 
            error: 'Acesso negado. Você não pode alterar perfil, direção ou status.' 
          })
        }
      }

      // Buscar dados atuais para o log
      const utilizadorAtual = await prisma.utilizador.findUnique({
        where: { id: parseInt(id) }
      })

      if (!utilizadorAtual) {
        return res.status(404).json({ 
          error: 'Utilizador não encontrado' 
        })
      }

      // Se email foi alterado, verificar se já existe
      if (email && email !== utilizadorAtual.email) {
        const emailExiste = await prisma.utilizador.findUnique({
          where: { email }
        })
        if (emailExiste) {
          return res.status(400).json({ 
            error: 'Email já está em uso' 
          })
        }
      }

      // Atualizar utilizador
      const utilizadorAtualizado = await prisma.utilizador.update({
        where: { id: parseInt(id) },
        data: {
          nome_completo,
          email,
          cargo,
          telefone,
          perfil_id: perfil_id ? parseInt(perfil_id) : undefined,
          direcao_id: direcao_id ? parseInt(direcao_id) : null,
          ativo
        },
        include: {
          perfil: true,
          direcao: true
        }
      })

      // Log da ação
      await prisma.auditoria_log.create({
        data: {
          utilizador_id: req.userId,
          acao: 'UPDATE',
          entidade: 'utilizador',
          entidade_id: parseInt(id),
          dados_antes: utilizadorAtual,
          dados_depois: utilizadorAtualizado,
          ip_address: req.ip,
          user_agent: req.headers['user-agent']
        }
      })

      const { senha_hash, ...userWithoutPassword } = utilizadorAtualizado
      return res.json(userWithoutPassword)
    } catch (error) {
      console.error('Erro ao atualizar utilizador:', error)
      return res.status(500).json({ 
        error: 'Erro interno do servidor' 
      })
    }
  }

  // Desativar utilizador (apenas admin)
  async delete(req, res) {
    try {
      const { id } = req.params

      // Verificar se é admin
      if (req.userPerfil !== 'admin_nacional') {
        return res.status(403).json({ 
          error: 'Acesso negado. Apenas administradores podem desativar utilizadores.' 
        })
      }

      // Não permitir desativar a si mesmo
      if (parseInt(id) === req.userId) {
        return res.status(400).json({ 
          error: 'Você não pode desativar seu próprio utilizador' 
        })
      }

      const utilizador = await prisma.utilizador.findUnique({
        where: { id: parseInt(id) }
      })

      if (!utilizador) {
        return res.status(404).json({ 
          error: 'Utilizador não encontrado' 
        })
      }

      // Desativar (soft delete) em vez de deletar
      const utilizadorDesativado = await prisma.utilizador.update({
        where: { id: parseInt(id) },
        data: { ativo: false }
      })

      // Log da ação
      await prisma.auditoria_log.create({
        data: {
          utilizador_id: req.userId,
          acao: 'DELETE',
          entidade: 'utilizador',
          entidade_id: parseInt(id),
          dados_antes: utilizador,
          dados_depois: utilizadorDesativado,
          ip_address: req.ip,
          user_agent: req.headers['user-agent']
        }
      })

      return res.json({ 
        message: 'Utilizador desativado com sucesso' 
      })
    } catch (error) {
      console.error('Erro ao desativar utilizador:', error)
      return res.status(500).json({ 
        error: 'Erro interno do servidor' 
      })
    }
  }

  // Listar perfis (para selects)
  async listarPerfis(req, res) {
    try {
      const perfis = await prisma.perfil.findMany({
        orderBy: {
          nivel_acesso: 'asc'
        }
      })
      return res.json(perfis)
    } catch (error) {
      return res.status(500).json({ 
        error: 'Erro interno do servidor' 
      })
    }
  }

  // Listar direções (para selects)
  async listarDirecoes(req, res) {
    try {
      const direcoes = await prisma.direcao.findMany({
        orderBy: {
          nome: 'asc'
        }
      })
      return res.json(direcoes)
    } catch (error) {
      return res.status(500).json({ 
        error: 'Erro interno do servidor' 
      })
    }
  }
}

module.exports = new UserController()