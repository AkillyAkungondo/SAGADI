const jwt = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client')
const authConfig = require('../config/auth')

const prisma = new PrismaClient()

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader) {
      return res.status(401).json({ error: 'Token não fornecido' })
    }

    const parts = authHeader.split(' ')

    if (parts.length !== 2) {
      return res.status(401).json({ error: 'Token mal formatado' })
    }

    const [scheme, token] = parts

    if (!/^Bearer$/i.test(scheme)) {
      return res.status(401).json({ error: 'Token mal formatado' })
    }

    const decoded = jwt.verify(token, authConfig.jwt.secret)

    // Buscar utilizador no banco
    const utilizador = await prisma.utilizador.findUnique({
      where: { id: decoded.id },
      include: {
        perfil: true
      }
    })

    if (!utilizador || !utilizador.ativo) {
      return res.status(401).json({ error: 'Utilizador não encontrado ou inativo' })
    }

    // Atualizar último acesso
    await prisma.utilizador.update({
      where: { id: utilizador.id },
      data: { ultimo_acesso: new Date() }
    })

    // Registrar log de acesso
    await prisma.auditoria_log.create({
      data: {
        utilizador_id: utilizador.id,
        acao: 'LOGIN',
        entidade: 'utilizador',
        entidade_id: utilizador.id,
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      }
    })

    req.userId = utilizador.id
    req.userPerfil = utilizador.perfil.nome
    req.user = utilizador

    return next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido' })
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' })
    }
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
}