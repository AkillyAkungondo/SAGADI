const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

class AerodromoController {
  // Listar todos os aeródromos
  async index(req, res) {
    try {
      const aerodromos = await prisma.aerodromo.findMany({
        include: {
          direcao: true
        },
        orderBy: {
          nome: 'asc'
        }
      })

      return res.json(aerodromos)
    } catch (error) {
      console.error('Erro ao listar aeródromos:', error)
      return res.status(500).json({ 
        error: 'Erro interno do servidor' 
      })
    }
  }

  // Buscar aeródromo por ID
  async show(req, res) {
    try {
      const { id } = req.params

      const aerodromo = await prisma.aerodromo.findUnique({
        where: { id: parseInt(id) },
        include: {
          direcao: true,
          findings: {
            take: 10,
            orderBy: {
              created_at: 'desc'
            }
          }
        }
      })

      if (!aerodromo) {
        return res.status(404).json({ 
          error: 'Aeródromo não encontrado' 
        })
      }

      return res.json(aerodromo)
    } catch (error) {
      console.error('Erro ao buscar aeródromo:', error)
      return res.status(500).json({ 
        error: 'Erro interno do servidor' 
      })
    }
  }

  // Buscar aeródromo por código OACI
  async showByCode(req, res) {
    try {
      const { codigo } = req.params

      const aerodromo = await prisma.aerodromo.findUnique({
        where: { codigo_oaci: codigo.toUpperCase() },
        include: {
          direcao: true
        }
      })

      if (!aerodromo) {
        return res.status(404).json({ 
          error: 'Aeródromo não encontrado' 
        })
      }

      return res.json(aerodromo)
    } catch (error) {
      console.error('Erro ao buscar aeródromo por código:', error)
      return res.status(500).json({ 
        error: 'Erro interno do servidor' 
      })
    }
  }

  // Criar novo aeródromo (apenas admin e inspetor)
  async create(req, res) {
    try {
      // Verificar permissão
      if (!['admin_nacional', 'inspetor'].includes(req.userPerfil)) {
        return res.status(403).json({ 
          error: 'Acesso negado. Apenas administradores e inspetores podem criar aeródromos.' 
        })
      }

      const { 
        codigo_oaci, 
        nome, 
        cidade, 
        provincia, 
        categoria, 
        direcao_id 
      } = req.body

      // Validações
      if (!codigo_oaci || !nome || !cidade || !provincia || !categoria || !direcao_id) {
        return res.status(400).json({ 
          error: 'Código OACI, nome, cidade, província, categoria e direção são obrigatórios' 
        })
      }

      // Verificar se código já existe
      const codigoExiste = await prisma.aerodromo.findUnique({
        where: { codigo_oaci: codigo_oaci.toUpperCase() }
      })

      if (codigoExiste) {
        return res.status(400).json({ 
          error: 'Código OACI já está em uso' 
        })
      }

      // Verificar se direção existe
      const direcao = await prisma.direcao.findUnique({
        where: { id: parseInt(direcao_id) }
      })

      if (!direcao) {
        return res.status(400).json({ 
          error: 'Direção não encontrada' 
        })
      }

      // Criar aeródromo
      const novoAerodromo = await prisma.aerodromo.create({
        data: {
          codigo_oaci: codigo_oaci.toUpperCase(),
          nome,
          cidade,
          provincia,
          categoria,
          direcao_id: parseInt(direcao_id),
          ativo: true
        },
        include: {
          direcao: true
        }
      })

      // Log da ação
      await prisma.auditoria_log.create({
        data: {
          utilizador_id: req.userId,
          acao: 'CREATE',
          entidade: 'aerodromo',
          entidade_id: novoAerodromo.id,
          dados_depois: novoAerodromo,
          ip_address: req.ip,
          user_agent: req.headers['user-agent']
        }
      })

      return res.status(201).json(novoAerodromo)
    } catch (error) {
      console.error('Erro ao criar aeródromo:', error)
      return res.status(500).json({ 
        error: 'Erro interno do servidor' 
      })
    }
  }

  // Atualizar aeródromo (apenas admin e inspetor)
  async update(req, res) {
    try {
      // Verificar permissão
      if (!['admin_nacional', 'inspetor'].includes(req.userPerfil)) {
        return res.status(403).json({ 
          error: 'Acesso negado. Apenas administradores e inspetores podem atualizar aeródromos.' 
        })
      }

      const { id } = req.params
      const { 
        codigo_oaci, 
        nome, 
        cidade, 
        provincia, 
        categoria, 
        direcao_id,
        ativo 
      } = req.body

      // Buscar aeródromo atual
      const aerodromoAtual = await prisma.aerodromo.findUnique({
        where: { id: parseInt(id) }
      })

      if (!aerodromoAtual) {
        return res.status(404).json({ 
          error: 'Aeródromo não encontrado' 
        })
      }

      // Se código foi alterado, verificar se já existe
      if (codigo_oaci && codigo_oaci.toUpperCase() !== aerodromoAtual.codigo_oaci) {
        const codigoExiste = await prisma.aerodromo.findUnique({
          where: { codigo_oaci: codigo_oaci.toUpperCase() }
        })
        if (codigoExiste) {
          return res.status(400).json({ 
            error: 'Código OACI já está em uso' 
          })
        }
      }

      // Atualizar aeródromo
      const aerodromoAtualizado = await prisma.aerodromo.update({
        where: { id: parseInt(id) },
        data: {
          codigo_oaci: codigo_oaci ? codigo_oaci.toUpperCase() : undefined,
          nome,
          cidade,
          provincia,
          categoria,
          direcao_id: direcao_id ? parseInt(direcao_id) : undefined,
          ativo
        },
        include: {
          direcao: true
        }
      })

      // Log da ação
      await prisma.auditoria_log.create({
        data: {
          utilizador_id: req.userId,
          acao: 'UPDATE',
          entidade: 'aerodromo',
          entidade_id: parseInt(id),
          dados_antes: aerodromoAtual,
          dados_depois: aerodromoAtualizado,
          ip_address: req.ip,
          user_agent: req.headers['user-agent']
        }
      })

      return res.json(aerodromoAtualizado)
    } catch (error) {
      console.error('Erro ao atualizar aeródromo:', error)
      return res.status(500).json({ 
        error: 'Erro interno do servidor' 
      })
    }
  }

  // Desativar aeródromo (apenas admin)
  async delete(req, res) {
    try {
      // Verificar permissão
      if (req.userPerfil !== 'admin_nacional') {
        return res.status(403).json({ 
          error: 'Acesso negado. Apenas administradores podem desativar aeródromos.' 
        })
      }

      const { id } = req.params

      const aerodromo = await prisma.aerodromo.findUnique({
        where: { id: parseInt(id) },
        include: {
          findings: {
            where: {
              status: { not: 'encerrado' }
            }
          }
        }
      })

      if (!aerodromo) {
        return res.status(404).json({ 
          error: 'Aeródromo não encontrado' 
        })
      }

      // Verificar se há findings ativos
      if (aerodromo.findings.length > 0) {
        return res.status(400).json({ 
          error: 'Não é possível desativar aeródromo com findings ativos' 
        })
      }

      // Desativar (soft delete)
      const aerodromoDesativado = await prisma.aerodromo.update({
        where: { id: parseInt(id) },
        data: { ativo: false }
      })

      // Log da ação
      await prisma.auditoria_log.create({
        data: {
          utilizador_id: req.userId,
          acao: 'DELETE',
          entidade: 'aerodromo',
          entidade_id: parseInt(id),
          dados_antes: aerodromo,
          dados_depois: aerodromoDesativado,
          ip_address: req.ip,
          user_agent: req.headers['user-agent']
        }
      })

      return res.json({ 
        message: 'Aeródromo desativado com sucesso' 
      })
    } catch (error) {
      console.error('Erro ao desativar aeródromo:', error)
      return res.status(500).json({ 
        error: 'Erro interno do servidor' 
      })
    }
  }

  // Listar províncias (para selects)
  async listarProvincias(req, res) {
    try {
      const provincias = [
        'Maputo', 'Maputo Cidade', 'Gaza', 'Inhambane', 
        'Sofala', 'Manica', 'Tete', 'Zambézia', 
        'Nampula', 'Cabo Delgado', 'Niassa'
      ]
      return res.json(provincias)
    } catch (error) {
      return res.status(500).json({ 
        error: 'Erro interno do servidor' 
      })
    }
  }

  // Listar categorias
  async listarCategorias(req, res) {
    try {
      const categorias = [
        'Internacional',
        'Doméstico',
        'Aeródromo'
      ]
      return res.json(categorias)
    } catch (error) {
      return res.status(500).json({ 
        error: 'Erro interno do servidor' 
      })
    }
  }

  // Estatísticas por aeródromo
  async estatisticas(req, res) {
    try {
      const { id } = req.params

      const estatisticas = await prisma.finding.groupBy({
        by: ['status'],
        where: {
          aerodromo_id: parseInt(id)
        },
        _count: true
      })

      const total = await prisma.finding.count({
        where: {
          aerodromo_id: parseInt(id)
        }
      })

      return res.json({
        total,
        porStatus: estatisticas
      })
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
      return res.status(500).json({ 
        error: 'Erro interno do servidor' 
      })
    }
  }
}

module.exports = new AerodromoController()