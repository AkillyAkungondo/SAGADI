const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

class AreaInspecaoController {
  // Listar todas as áreas de inspeção
  async index(req, res) {
    try {
      const areas = await prisma.area_inspecao.findMany({
        orderBy: {
          codigo: 'asc'
        }
      })

      return res.json(areas)
    } catch (error) {
      console.error('Erro ao listar áreas:', error)
      return res.status(500).json({ 
        error: 'Erro interno do servidor' 
      })
    }
  }

  // Buscar área por ID
  async show(req, res) {
    try {
      const { id } = req.params

      const area = await prisma.area_inspecao.findUnique({
        where: { id: parseInt(id) }
      })

      if (!area) {
        return res.status(404).json({ 
          error: 'Área de inspeção não encontrada' 
        })
      }

      return res.json(area)
    } catch (error) {
      console.error('Erro ao buscar área:', error)
      return res.status(500).json({ 
        error: 'Erro interno do servidor' 
      })
    }
  }

  // Buscar área por código
  async showByCode(req, res) {
    try {
      const { codigo } = req.params

      const area = await prisma.area_inspecao.findUnique({
        where: { codigo: codigo.toUpperCase() }
      })

      if (!area) {
        return res.status(404).json({ 
          error: 'Área de inspeção não encontrada' 
        })
      }

      return res.json(area)
    } catch (error) {
      console.error('Erro ao buscar área por código:', error)
      return res.status(500).json({ 
        error: 'Erro interno do servidor' 
      })
    }
  }

  // Criar nova área de inspeção (apenas admin)
  async create(req, res) {
    try {
      if (req.userPerfil !== 'admin_nacional') {
        return res.status(403).json({ 
          error: 'Acesso negado. Apenas administradores podem criar áreas.' 
        })
      }

      const { codigo, nome, descricao } = req.body

      if (!codigo || !nome) {
        return res.status(400).json({ 
          error: 'Código e nome são obrigatórios' 
        })
      }

      const codigoExiste = await prisma.area_inspecao.findUnique({
        where: { codigo: codigo.toUpperCase() }
      })

      if (codigoExiste) {
        return res.status(400).json({ 
          error: 'Código já está em uso' 
        })
      }

      const novaArea = await prisma.area_inspecao.create({
        data: {
          codigo: codigo.toUpperCase(),
          nome,
          descricao,
          ativo: true
        }
      })

      await prisma.auditoria_log.create({
        data: {
          utilizador_id: req.userId,
          acao: 'CREATE',
          entidade: 'area_inspecao',
          entidade_id: novaArea.id,
          dados_depois: novaArea,
          ip_address: req.ip,
          user_agent: req.headers['user-agent']
        }
      })

      return res.status(201).json(novaArea)
    } catch (error) {
      console.error('Erro ao criar área:', error)
      return res.status(500).json({ 
        error: 'Erro interno do servidor' 
      })
    }
  }

  // Atualizar área (apenas admin)
  async update(req, res) {
    try {
      if (req.userPerfil !== 'admin_nacional') {
        return res.status(403).json({ 
          error: 'Acesso negado. Apenas administradores podem atualizar áreas.' 
        })
      }

      const { id } = req.params
      const { codigo, nome, descricao, ativo } = req.body

      const areaAtual = await prisma.area_inspecao.findUnique({
        where: { id: parseInt(id) }
      })

      if (!areaAtual) {
        return res.status(404).json({ 
          error: 'Área não encontrada' 
        })
      }

      if (codigo && codigo.toUpperCase() !== areaAtual.codigo) {
        const codigoExiste = await prisma.area_inspecao.findUnique({
          where: { codigo: codigo.toUpperCase() }
        })
        if (codigoExiste) {
          return res.status(400).json({ 
            error: 'Código já está em uso' 
          })
        }
      }

      const areaAtualizada = await prisma.area_inspecao.update({
        where: { id: parseInt(id) },
        data: {
          codigo: codigo ? codigo.toUpperCase() : undefined,
          nome,
          descricao,
          ativo
        }
      })

      await prisma.auditoria_log.create({
        data: {
          utilizador_id: req.userId,
          acao: 'UPDATE',
          entidade: 'area_inspecao',
          entidade_id: parseInt(id),
          dados_antes: areaAtual,
          dados_depois: areaAtualizada,
          ip_address: req.ip,
          user_agent: req.headers['user-agent']
        }
      })

      return res.json(areaAtualizada)
    } catch (error) {
      console.error('Erro ao atualizar área:', error)
      return res.status(500).json({ 
        error: 'Erro interno do servidor' 
      })
    }
  }

  // Desativar área (apenas admin)
  async delete(req, res) {
    try {
      if (req.userPerfil !== 'admin_nacional') {
        return res.status(403).json({ 
          error: 'Acesso negado. Apenas administradores podem desativar áreas.' 
        })
      }

      const { id } = req.params

      const area = await prisma.area_inspecao.findUnique({
        where: { id: parseInt(id) }
      })

      if (!area) {
        return res.status(404).json({ 
          error: 'Área não encontrada' 
        })
      }

      const areaDesativada = await prisma.area_inspecao.update({
        where: { id: parseInt(id) },
        data: { ativo: false }
      })

      await prisma.auditoria_log.create({
        data: {
          utilizador_id: req.userId,
          acao: 'DELETE',
          entidade: 'area_inspecao',
          entidade_id: parseInt(id),
          dados_antes: area,
          dados_depois: areaDesativada,
          ip_address: req.ip,
          user_agent: req.headers['user-agent']
        }
      })

      return res.json({ 
        message: 'Área desativada com sucesso' 
      })
    } catch (error) {
      console.error('Erro ao desativar área:', error)
      return res.status(500).json({ 
        error: 'Erro interno do servidor' 
      })
    }
  }

  // Áreas mais utilizadas
  async maisUtilizadas(req, res) {
    try {
      const areas = await prisma.finding.groupBy({
        by: ['area_inspecao_id'],
        _count: true,
        orderBy: {
          _count: {
            area_inspecao_id: 'desc'
          }
        },
        take: 5
      })

      const areasComDetalhes = await Promise.all(
        areas.map(async (item) => {
          const area = await prisma.area_inspecao.findUnique({
            where: { id: item.area_inspecao_id }
          })
          return {
            area,
            total: item._count
          }
        })
      )

      return res.json(areasComDetalhes)
    } catch (error) {
      console.error('Erro ao buscar áreas mais utilizadas:', error)
      return res.status(500).json({ 
        error: 'Erro interno do servidor' 
      })
    }
  }
}

module.exports = new AreaInspecaoController()