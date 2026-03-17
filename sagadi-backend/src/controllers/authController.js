const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const authConfig = require('../config/auth')

const prisma = new PrismaClient()

class AuthController {
  async login(req, res) {
    try {
      const { email, senha } = req.body

      if (!email || !senha) {
        return res.status(400).json({ 
          error: 'Email e senha são obrigatórios' 
        })
      }

      // Buscar utilizador com perfil
      const utilizador = await prisma.utilizador.findUnique({
        where: { email },
        include: {
          perfil: true,
          direcao: true
        }
      })

      if (!utilizador) {
        return res.status(401).json({ 
          error: 'Credenciais inválidas' 
        })
      }

      if (!utilizador.ativo) {
        return res.status(401).json({ 
          error: 'Utilizador inativo. Contacte o administrador.' 
        })
      }

      // Verificar senha
      const senhaValida = await bcrypt.compare(senha, utilizador.senha_hash)

      if (!senhaValida) {
        return res.status(401).json({ 
          error: 'Credenciais inválidas' 
        })
      }

      // Gerar token
      const token = jwt.sign(
        { 
          id: utilizador.id, 
          email: utilizador.email,
          perfil: utilizador.perfil.nome 
        },
        authConfig.jwt.secret,
        { expiresIn: authConfig.jwt.expiresIn }
      )

      // Remover senha_hash do objeto
      const { senha_hash, ...userWithoutPassword } = utilizador

      return res.json({
        user: userWithoutPassword,
        token
      })

    } catch (error) {
      console.error('Erro no login:', error)
      return res.status(500).json({ 
        error: 'Erro interno do servidor' 
      })
    }
  }

  async logout(req, res) {
    try {
      // Registrar logout
      await prisma.auditoria_log.create({
        data: {
          utilizador_id: req.userId,
          acao: 'LOGOUT',
          entidade: 'utilizador',
          entidade_id: req.userId,
          ip_address: req.ip,
          user_agent: req.headers['user-agent']
        }
      })

      return res.json({ 
        message: 'Logout realizado com sucesso' 
      })
    } catch (error) {
      return res.status(500).json({ 
        error: 'Erro interno do servidor' 
      })
    }
  }

  async me(req, res) {
    try {
      const utilizador = await prisma.utilizador.findUnique({
        where: { id: req.userId },
        include: {
          perfil: true,
          direcao: true
        }
      })

      const { senha_hash, ...userWithoutPassword } = utilizador

      return res.json(userWithoutPassword)
    } catch (error) {
      return res.status(500).json({ 
        error: 'Erro interno do servidor' 
      })
    }
  }

  async alterarSenha(req, res) {
    try {
      const { senha_atual, nova_senha } = req.body

      if (!senha_atual || !nova_senha) {
        return res.status(400).json({ 
          error: 'Senha atual e nova senha são obrigatórias' 
        })
      }

      if (nova_senha.length < 6) {
        return res.status(400).json({ 
          error: 'A nova senha deve ter pelo menos 6 caracteres' 
        })
      }

      const utilizador = await prisma.utilizador.findUnique({
        where: { id: req.userId }
      })

      const senhaValida = await bcrypt.compare(senha_atual, utilizador.senha_hash)

      if (!senhaValida) {
        return res.status(401).json({ 
          error: 'Senha atual incorreta' 
        })
      }

      const novaSenhaHash = await bcrypt.hash(nova_senha, authConfig.bcrypt.saltRounds)

      await prisma.utilizador.update({
        where: { id: req.userId },
        data: { senha_hash: novaSenhaHash }
      })

      return res.json({ 
        message: 'Senha alterada com sucesso' 
      })

    } catch (error) {
      return res.status(500).json({ 
        error: 'Erro interno do servidor' 
      })
    }
  }
}

module.exports = new AuthController()