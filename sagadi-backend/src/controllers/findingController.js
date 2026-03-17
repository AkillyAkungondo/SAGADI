const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

class FindingController {
  // Gerar número de processo automático
  async gerarNumeroProcesso(req, res) {
    try {
      const { aerodromo_id, area_inspecao_id } = req.body

      // Validar IDs
      const aerodromoId = parseInt(aerodromo_id)
      const areaId = parseInt(area_inspecao_id)

      if (isNaN(aerodromoId) || isNaN(areaId)) {
        return res.status(400).json({ 
          error: 'IDs de aeródromo e área são obrigatórios e devem ser números válidos' 
        })
      }

      // Buscar códigos
      const aerodromo = await prisma.aerodromo.findUnique({
        where: { id: aerodromoId }
      })

      const area = await prisma.area_inspecao.findUnique({
        where: { id: areaId }
      })

      if (!aerodromo || !area) {
        return res.status(400).json({ 
          error: 'Aeródromo ou área não encontrados' 
        })
      }

      // Encontrar último número do ano
      const ano = new Date().getFullYear()
      const ultimoFinding = await prisma.finding.findFirst({
        where: {
          numero_processo: {
            startsWith: `${area.codigo}-${aerodromo.codigo_oaci}`
          }
        },
        orderBy: {
          id: 'desc'
        }
      })

      let sequencial = 1
      if (ultimoFinding) {
        const partes = ultimoFinding.numero_processo.split('-')
        sequencial = parseInt(partes[2]) + 1
      }

      const numeroProcesso = `${area.codigo}-${aerodromo.codigo_oaci}-${String(sequencial).padStart(3, '0')}-${ano}`
      
      return res.json({ numero_processo: numeroProcesso })
    } catch (error) {
      console.error('Erro ao gerar número:', error)
      return res.status(500).json({ 
        error: 'Erro interno do servidor' 
      })
    }
  }

  // CRIAR FINDING - PARTE 1 (Inspetor)
  async createParte1(req, res) {
    try {
      // Verificar perfil
      if (req.userPerfil !== 'inspetor' && req.userPerfil !== 'admin_nacional') {
        return res.status(403).json({ 
          error: 'Apenas inspetores podem criar findings' 
        })
      }

      const {
        numero_processo,
        aerodromo_id,
        area_inspecao_id,
        data_inspecao,
        finding_level,
        reference_document,
        finding_descricao
      } = req.body

      // Validar campos obrigatórios
      if (!numero_processo || !aerodromo_id || !area_inspecao_id || !data_inspecao || !finding_level) {
        return res.status(400).json({ 
          error: 'Campos obrigatórios: número processo, aeródromo, área, data, nível' 
        })
      }

      // Converter IDs para números
      const aerodromoId = parseInt(aerodromo_id)
      const areaId = parseInt(area_inspecao_id)
      const level = parseInt(finding_level)

      if (isNaN(aerodromoId) || isNaN(areaId) || isNaN(level)) {
        return res.status(400).json({ 
          error: 'IDs devem ser números válidos' 
        })
      }

      // Verificar se número já existe
      const existe = await prisma.finding.findUnique({
        where: { numero_processo }
      })

      if (existe) {
        return res.status(400).json({ 
          error: 'Número de processo já existe' 
        })
      }

      // Calcular data de vencimento (15 dias por padrão)
      const dataInspecao = new Date(data_inspecao)
      const dataVencimento = new Date(dataInspecao)
      dataVencimento.setDate(dataVencimento.getDate() + 15)

      // Criar finding
      const finding = await prisma.finding.create({
        data: {
          numero_processo,
          aerodromo_id: aerodromoId,
          area_inspecao_id: areaId,
          inspetor_id: req.userId,
          data_inspecao: dataInspecao,
          finding_level: level,
          reference_document,
          finding_descricao,
          parte_1_concluida_em: new Date(),
          status: 'parte1_concluida',
          prioridade: level >= 3 ? 'alta' : level === 2 ? 'media' : 'baixa',
          prazo_resposta_dias: 15,
          data_vencimento: dataVencimento
        }
      })

      // Registrar log
      await prisma.auditoria_log.create({
        data: {
          utilizador_id: req.userId,
          acao: 'CREATE',
          entidade: 'finding',
          entidade_id: finding.id,
          dados_depois: finding,
          ip_address: req.ip,
          user_agent: req.headers['user-agent']
        }
      })

      return res.status(201).json(finding)
    } catch (error) {
      console.error('Erro ao criar finding:', error)
      return res.status(500).json({ 
        error: 'Erro interno do servidor' 
      })
    }
  }

  // LISTAR TODOS FINDINGS (COM FILTROS POR PERFIL)
  async index(req, res) {
    try {
      const { status, aerodromo_id, area_id, data_inicio, data_fim, prioridade, keyword } = req.query

      const where = {}

      // Filtros básicos
      if (status) where.status = status
      if (aerodromo_id) {
        const aerodromoId = parseInt(aerodromo_id)
        if (!isNaN(aerodromoId)) where.aerodromo_id = aerodromoId
      }
      if (area_id) {
        const areaId = parseInt(area_id)
        if (!isNaN(areaId)) where.area_inspecao_id = areaId
      }
      if (prioridade) where.prioridade = prioridade
      
      // Filtros de data
      if (data_inicio || data_fim) {
        where.data_inspecao = {}
        if (data_inicio) where.data_inspecao.gte = new Date(data_inicio)
        if (data_fim) where.data_inspecao.lte = new Date(data_fim)
      }

      // Filtro por palavra-chave na descrição
      if (keyword) {
        where.finding_descricao = {
          contains: keyword
        }
      }

      // FILTRAGEM POR PERFIL - CORREÇÃO AQUI
      if (req.userPerfil === 'inspetor') {
        // Inspetor vê apenas os findings que ele criou
        where.inspetor_id = req.userId
      } else if (req.userPerfil === 'operador') {
        // Operador vê findings que:
        // - Estão aguardando resposta (status = 'parte1_concluida' OU 'aguarda_parte2')
        // - OU que ele já respondeu (operador_resposta_id = req.userId)
        where.OR = [
          { status: 'parte1_concluida' },
          { status: 'aguarda_parte2' },
          { operador_resposta_id: req.userId }
        ]
      }
      // Admin não tem filtro - vê tudo

      console.log('Perfil:', req.userPerfil)
      console.log('Where clause:', JSON.stringify(where, null, 2))

      const findings = await prisma.finding.findMany({
        where,
        include: {
          aerodromo: true,
          area_inspecao: true,
          inspetor: {
            select: { id: true, nome_completo: true, email: true }
          },
          operador_resposta: {
            select: { id: true, nome_completo: true, email: true }
          },
          _count: {
            select: {
              plano_acoes: true,
              anexos: true
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        }
      })

      console.log('Findings encontrados:', findings.length)

      return res.json(findings)
    } catch (error) {
      console.error('Erro ao listar findings:', error)
      return res.status(500).json({ 
        error: 'Erro interno do servidor' 
      })
    }
  }

  // BUSCAR FINDING POR ID
  async show(req, res) {
    try {
      const { id } = req.params
      
      // Converter para número e validar
      const findingId = parseInt(id)
      
      if (isNaN(findingId)) {
        return res.status(400).json({ 
          error: 'ID inválido' 
        })
      }

      const finding = await prisma.finding.findUnique({
        where: { 
          id: findingId 
        },
        include: {
          aerodromo: true,
          area_inspecao: true,
          inspetor: {
            select: { 
              id: true, 
              nome_completo: true, 
              email: true 
            }
          },
          operador_resposta: {
            select: { 
              id: true, 
              nome_completo: true, 
              email: true 
            }
          },
          inspector_assinatura: {
            select: { 
              id: true, 
              nome_completo: true 
            }
          },
          plano_acoes: {
            include: {
              responsaveis: {
                include: {
                  utilizador: true
                }
              }
            }
          },
          anexos: {
            include: {
              uploaded_por: {
                select: { id: true, nome_completo: true }
              }
            }
          },
          notificacoes: true
        }
      })

      if (!finding) {
        return res.status(404).json({ 
          error: 'Finding não encontrado' 
        })
      }

      // Verificar permissão de visualização
      if (req.userPerfil === 'inspetor' && finding.inspetor_id !== req.userId) {
        return res.status(403).json({ 
          error: 'Acesso negado. Este finding não foi criado por você.' 
        })
      }

      return res.json(finding)
    } catch (error) {
      console.error('Erro ao buscar finding:', error)
      return res.status(500).json({ 
        error: 'Erro interno do servidor' 
      })
    }
  }

  // PREENCHER PARTE 2 (Operador)
  async updateParte2(req, res) {
    try {
      const { id } = req.params
      
      // Converter para número e validar
      const findingId = parseInt(id)
      
      if (isNaN(findingId)) {
        return res.status(400).json({ 
          error: 'ID inválido' 
        })
      }

      // Verificar perfil
      if (req.userPerfil !== 'operador' && req.userPerfil !== 'admin_nacional') {
        return res.status(403).json({ 
          error: 'Apenas operadores podem preencher a Parte 2' 
        })
      }

      const finding = await prisma.finding.findUnique({
        where: { id: findingId }
      })

      if (!finding) {
        return res.status(404).json({ 
          error: 'Finding não encontrado' 
        })
      }

      // Verificar se já pode preencher Parte 2
      if (finding.status !== 'parte1_concluida' && finding.status !== 'aguarda_parte2') {
        return res.status(400).json({ 
          error: 'Este finding não está pronto para receber a Parte 2' 
        })
      }

      const {
        observacoes_operador,
        root_causes,
        acoes_corretivas
      } = req.body

      // Validar acoes_corretivas se fornecidas
      let acoesCorretivasValidadas = []
      if (acoes_corretivas && Array.isArray(acoes_corretivas)) {
        acoesCorretivasValidadas = acoes_corretivas.slice(0, 4) // Máximo 4 ações
      }

      // Atualizar finding
      const findingAtualizado = await prisma.finding.update({
        where: { id: findingId },
        data: {
          observacoes_operador,
          root_causes,
          acoes_corretivas: acoesCorretivasValidadas,
          operador_resposta_id: req.userId,
          parte_2_concluida_em: new Date(),
          status: 'parte2_concluida'
        }
      })

      // Registrar log
      await prisma.auditoria_log.create({
        data: {
          utilizador_id: req.userId,
          acao: 'UPDATE',
          entidade: 'finding',
          entidade_id: findingId,
          dados_antes: finding,
          dados_depois: findingAtualizado,
          ip_address: req.ip,
          user_agent: req.headers['user-agent']
        }
      })

      return res.json(findingAtualizado)
    } catch (error) {
      console.error('Erro ao atualizar Parte 2:', error)
      return res.status(500).json({ 
        error: 'Erro interno do servidor' 
      })
    }
  }

  // PREENCHER PARTE 3 (Inspetor - Avaliação e Encerramento)
  async updateParte3(req, res) {
    try {
      const { id } = req.params
      
      // Converter para número e validar
      const findingId = parseInt(id)
      
      if (isNaN(findingId)) {
        return res.status(400).json({ 
          error: 'ID inválido' 
        })
      }

      // Verificar perfil
      if (req.userPerfil !== 'inspetor' && req.userPerfil !== 'admin_nacional') {
        return res.status(403).json({ 
          error: 'Apenas inspetores podem avaliar e encerrar findings' 
        })
      }

      const finding = await prisma.finding.findUnique({
        where: { id: findingId }
      })

      if (!finding) {
        return res.status(404).json({ 
          error: 'Finding não encontrado' 
        })
      }

      // Verificar se já pode avaliar
      if (finding.status !== 'parte2_concluida' && finding.status !== 'aguarda_avaliacao') {
        return res.status(400).json({ 
          error: 'Este finding não está pronto para avaliação' 
        })
      }

      // Verificar se é o inspetor correto (opcional)
      if (req.userPerfil === 'inspetor' && finding.inspetor_id !== req.userId) {
        return res.status(403).json({ 
          error: 'Acesso negado. Apenas o inspetor que criou pode avaliar este finding.' 
        })
      }

      const {
        comments_cap,
        progress_documented,
        evaluation_actions,
        data_aplicacao_acoes,
        resolved_satisfactorily
      } = req.body

      // Validar progress_documented se fornecido
      let progressDocumentedValidade = []
      if (progress_documented && Array.isArray(progress_documented)) {
        progressDocumentedValidade = progress_documented.slice(0, 4)
      }

      // Se resolved_satisfactorily for true, encerrar
      const status = resolved_satisfactorily ? 'encerrado' : 'aguarda_correcao'
      const dataEncerramento = resolved_satisfactorily ? new Date() : null

      // Atualizar finding
      const findingAtualizado = await prisma.finding.update({
        where: { id: findingId },
        data: {
          comments_cap,
          progress_documented: progressDocumentedValidade,
          evaluation_actions,
          data_aplicacao_acoes: data_aplicacao_acoes ? new Date(data_aplicacao_acoes) : null,
          resolved_satisfactorily,
          inspector_assinatura_id: resolved_satisfactorily ? req.userId : null,
          data_assinatura: resolved_satisfactorily ? new Date() : null,
          parte_3_concluida_em: new Date(),
          status,
          data_encerramento: dataEncerramento
        }
      })

      // Registrar log
      await prisma.auditoria_log.create({
        data: {
          utilizador_id: req.userId,
          acao: 'UPDATE',
          entidade: 'finding',
          entidade_id: findingId,
          dados_antes: finding,
          dados_depois: findingAtualizado,
          ip_address: req.ip,
          user_agent: req.headers['user-agent']
        }
      })

      return res.json(findingAtualizado)
    } catch (error) {
      console.error('Erro ao atualizar Parte 3:', error)
      return res.status(500).json({ 
        error: 'Erro interno do servidor' 
      })
    }
  }

  // ADICIONAR ANEXO
  async addAnexo(req, res) {
    try {
      const { id } = req.params
      
      // Converter para número e validar
      const findingId = parseInt(id)
      
      if (isNaN(findingId)) {
        return res.status(400).json({ 
          error: 'ID inválido' 
        })
      }

      if (!req.file) {
        return res.status(400).json({ 
          error: 'Nenhum ficheiro enviado' 
        })
      }

      const finding = await prisma.finding.findUnique({
        where: { id: findingId }
      })

      if (!finding) {
        return res.status(404).json({ 
          error: 'Finding não encontrado' 
        })
      }

      const anexo = await prisma.anexo.create({
        data: {
          nome_original: req.file.originalname,
          nome_arquivo: req.file.filename,
          caminho: req.file.path,
          tipo: req.file.mimetype,
          tamanho: req.file.size,
          uploaded_by: req.userId,
          finding_id: findingId
        }
      })

      return res.status(201).json(anexo)
    } catch (error) {
      console.error('Erro ao adicionar anexo:', error)
      return res.status(500).json({ 
        error: 'Erro interno do servidor' 
      })
    }
  }

  // ESTATÍSTICAS / DASHBOARD
  async estatisticas(req, res) {
    try {
      const totalFindings = await prisma.finding.count()
      
      const porStatus = await prisma.finding.groupBy({
        by: ['status'],
        _count: true
      })

      const porPrioridade = await prisma.finding.groupBy({
        by: ['prioridade'],
        _count: true
      })

      const porArea = await prisma.finding.groupBy({
        by: ['area_inspecao_id'],
        _count: true,
        orderBy: {
          _count: {
            area_inspecao_id: 'desc'
          }
        },
        take: 5
      })

      const areasDetalhes = await Promise.all(
        porArea.map(async (item) => {
          const area = await prisma.area_inspecao.findUnique({
            where: { id: item.area_inspecao_id }
          })
          return {
            area: area ? area.codigo : 'Desconhecida',
            total: item._count
          }
        })
      )

      const porAerodromo = await prisma.finding.groupBy({
        by: ['aerodromo_id'],
        _count: true,
        orderBy: {
          _count: {
            aerodromo_id: 'desc'
          }
        },
        take: 5
      })

      const aerodromosDetalhes = await Promise.all(
        porAerodromo.map(async (item) => {
          const aerodromo = await prisma.aerodromo.findUnique({
            where: { id: item.aerodromo_id }
          })
          return {
            aerodromo: aerodromo ? aerodromo.codigo_oaci : 'Desconhecido',
            total: item._count
          }
        })
      )

      const prazoMedio = await prisma.finding.aggregate({
        _avg: {
          prazo_resposta_dias: true
        }
      })

      return res.json({
        total: totalFindings,
        por_status: porStatus,
        por_prioridade: porPrioridade,
        areas_destacadas: areasDetalhes,
        aerodromos_destacados: aerodromosDetalhes,
        prazo_medio_resposta: prazoMedio._avg.prazo_resposta_dias || 0
      })
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
      return res.status(500).json({ 
        error: 'Erro interno do servidor' 
      })
    }
  }

  // BUSCAR POR NÚMERO DE PROCESSO
  async buscarPorNumero(req, res) {
    try {
      const { numero } = req.params

      if (!numero) {
        return res.status(400).json({ 
          error: 'Número de processo é obrigatório' 
        })
      }

      const finding = await prisma.finding.findUnique({
        where: { numero_processo: numero },
        include: {
          aerodromo: true,
          area_inspecao: true,
          inspetor: {
            select: { id: true, nome_completo: true, email: true }
          },
          operador_resposta: {
            select: { id: true, nome_completo: true, email: true }
          },
          plano_acoes: true
        }
      })

      if (!finding) {
        return res.status(404).json({ 
          error: 'Finding não encontrado' 
        })
      }

      return res.json(finding)
    } catch (error) {
      console.error('Erro ao buscar por número:', error)
      return res.status(500).json({ 
        error: 'Erro interno do servidor' 
      })
    }
  }

  // FINDINGS ATRASADOS
  async atrasados(req, res) {
    try {
      const hoje = new Date()

      const atrasados = await prisma.finding.findMany({
        where: {
          status: { not: 'encerrado' },
          data_vencimento: {
            lt: hoje
          }
        },
        include: {
          aerodromo: true,
          area_inspecao: true,
          inspetor: {
            select: { id: true, nome_completo: true }
          }
        },
        orderBy: {
          data_vencimento: 'asc'
        }
      })

      return res.json(atrasados)
    } catch (error) {
      console.error('Erro ao buscar findings atrasados:', error)
      return res.status(500).json({ 
        error: 'Erro interno do servidor' 
      })
    }
  }
}

module.exports = new FindingController()