const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

async function main() {
  console.log('Iniciando seed do banco de dados...')
  
  try {
    // 1. Verificar conexão
    await prisma.$connect()
    console.log('Conectado ao banco de dados')

    // 2. Criar Perfis
    console.log('Criando perfis...')
    const perfis = await Promise.all([
      prisma.perfil.upsert({
        where: { nome: 'admin_nacional' },
        update: {},
        create: {
          nome: 'admin_nacional',
          descricao: 'Administrador Nacional do Sistema',
          nivel_acesso: 4
        }
      }),
      prisma.perfil.upsert({
        where: { nome: 'inspetor' },
        update: {},
        create: {
          nome: 'inspetor',
          descricao: 'Inspetor do IACM',
          nivel_acesso: 3
        }
      }),
      prisma.perfil.upsert({
        where: { nome: 'operador' },
        update: {},
        create: {
          nome: 'operador',
          descricao: 'Operador de Aeródromo',
          nivel_acesso: 2
        }
      }),
      prisma.perfil.upsert({
        where: { nome: 'auditor' },
        update: {},
        create: {
          nome: 'auditor',
          descricao: 'Auditor do Sistema',
          nivel_acesso: 3
        }
      })
    ])
    console.log('Perfis criados:', perfis.map(p => p.nome).join(', '))

    // 3. Criar Direções
    console.log('Criando direções...')
    const direcoes = await Promise.all([
      prisma.direcao.upsert({
        where: { sigla: 'DA' },
        update: {},
        create: {
          nome: 'Direção de Aeródromos',
          sigla: 'DA',
          descricao: 'Direção responsável pelos aeródromos nacionais'
        }
      }),
      prisma.direcao.upsert({
        where: { sigla: 'DNS' },
        update: {},
        create: {
          nome: 'Direção de Navegação Aérea',
          sigla: 'DNS',
          descricao: 'Direção responsável pela navegação aérea'
        }
      }),
      prisma.direcao.upsert({
        where: { sigla: 'DSE' },
        update: {},
        create: {
          nome: 'Direção de Segurança e Emergência',
          sigla: 'DSE',
          descricao: 'Direção responsável pela segurança e emergência'
        }
      })
    ])
    console.log('Direções criadas:', direcoes.map(d => d.sigla).join(', '))

    // 4. Criar Aeródromos Principais
    console.log('Criando aeródromos...')
    const aerodromos = await Promise.all([
      prisma.aerodromo.upsert({
        where: { codigo_oaci: 'FQMA' },
        update: {},
        create: {
          codigo_oaci: 'FQMA',
          nome: 'Aeroporto Internacional de Maputo',
          cidade: 'Maputo',
          provincia: 'Maputo',
          categoria: 'Internacional',
          direcao_id: direcoes[0].id
        }
      }),
      prisma.aerodromo.upsert({
        where: { codigo_oaci: 'FQMP' },
        update: {},
        create: {
          codigo_oaci: 'FQMP',
          nome: 'Aeroporto da Beira',
          cidade: 'Beira',
          provincia: 'Sofala',
          categoria: 'Internacional',
          direcao_id: direcoes[0].id
        }
      }),
      prisma.aerodromo.upsert({
        where: { codigo_oaci: 'FQNC' },
        update: {},
        create: {
          codigo_oaci: 'FQNC',
          nome: 'Aeroporto de Nacala',
          cidade: 'Nacala',
          provincia: 'Nampula',
          categoria: 'Internacional',
          direcao_id: direcoes[0].id
        }
      }),
      prisma.aerodromo.upsert({
        where: { codigo_oaci: 'FQPB' },
        update: {},
        create: {
          codigo_oaci: 'FQPB',
          nome: 'Aeroporto de Pemba',
          cidade: 'Pemba',
          provincia: 'Cabo Delgado',
          categoria: 'Doméstico',
          direcao_id: direcoes[0].id
        }
      }),
      prisma.aerodromo.upsert({
        where: { codigo_oaci: 'FQCH' },
        update: {},
        create: {
          codigo_oaci: 'FQCH',
          nome: 'Aeroporto de Chimoio',
          cidade: 'Chimoio',
          provincia: 'Manica',
          categoria: 'Doméstico',
          direcao_id: direcoes[0].id
        }
      }),
      prisma.aerodromo.upsert({
        where: { codigo_oaci: 'FQIN' },
        update: {},
        create: {
          codigo_oaci: 'FQIN',
          nome: 'Aeroporto de Inhambane',
          cidade: 'Inhambane',
          provincia: 'Inhambane',
          categoria: 'Doméstico',
          direcao_id: direcoes[0].id
        }
      })
    ])
    console.log('Aeródromos criados:', aerodromos.map(a => a.codigo_oaci).join(', '))

    // 5. Criar Áreas de Inspeção
    console.log('Criando áreas de inspeção...')
    const areas = await Promise.all([
      prisma.area_inspecao.upsert({
        where: { codigo: 'AGA' },
        update: {},
        create: {
          codigo: 'AGA',
          nome: 'Aeródromos e Auxílios à Navegação',
          descricao: 'Inspeção de infraestruturas de aeródromos'
        }
      }),
      prisma.area_inspecao.upsert({
        where: { codigo: 'PANS' },
        update: {},
        create: {
          codigo: 'PANS',
          nome: 'Procedimentos de Navegação Aérea',
          descricao: 'Inspeção de procedimentos operacionais'
        }
      }),
      prisma.area_inspecao.upsert({
        where: { codigo: 'MET' },
        update: {},
        create: {
          codigo: 'MET',
          nome: 'Meteorologia',
          descricao: 'Inspeção de serviços meteorológicos'
        }
      }),
      prisma.area_inspecao.upsert({
        where: { codigo: 'SAR' },
        update: {},
        create: {
          codigo: 'SAR',
          nome: 'Busca e Salvamento',
          descricao: 'Inspeção de serviços de emergência'
        }
      }),
      prisma.area_inspecao.upsert({
        where: { codigo: 'CNS' },
        update: {},
        create: {
          codigo: 'CNS',
          nome: 'Comunicações, Navegação e Vigilância',
          descricao: 'Inspeção de equipamentos CNS'
        }
      })
    ])
    console.log('Áreas de inspeção criadas:', areas.map(a => a.codigo).join(', '))

    // 6. Criar Utilizador Admin
    console.log('Criando utilizador admin...')
    const senhaHashAdmin = await bcrypt.hash('Admin@2026', 10)
    
    const admin = await prisma.utilizador.upsert({
      where: { email: 'admin@sagadi.gov.mz' },
      update: {},
      create: {
        nome_completo: 'Administrador do Sistema',
        email: 'admin@sagadi.gov.mz',
        senha_hash: senhaHashAdmin,
        perfil_id: perfis.find(p => p.nome === 'admin_nacional').id,
        direcao_id: direcoes[0].id,
        cargo: 'Administrador Nacional',
        telefone: '+258 823456789',
        ativo: true
      }
    })
    console.log('Admin criado:', admin.email)

    // 7. Criar Inspetores de Exemplo
    console.log('Criando inspetores...')
    const senhaInspetor = await bcrypt.hash('Inspetor@2026', 10)
    
    const inspetor1 = await prisma.utilizador.upsert({
      where: { email: 'joao.silva@iacm.gov.mz' },
      update: {},
      create: {
        nome_completo: 'João Silva',
        email: 'joao.silva@iacm.gov.mz',
        senha_hash: senhaInspetor,
        perfil_id: perfis.find(p => p.nome === 'inspetor').id,
        direcao_id: direcoes[0].id,
        cargo: 'Inspetor Chefe',
        telefone: '+258 823456790',
        ativo: true
      }
    })

    const inspetor2 = await prisma.utilizador.upsert({
      where: { email: 'maria.rodrigues@iacm.gov.mz' },
      update: {},
      create: {
        nome_completo: 'Maria Rodrigues',
        email: 'maria.rodrigues@iacm.gov.mz',
        senha_hash: senhaInspetor,
        perfil_id: perfis.find(p => p.nome === 'inspetor').id,
        direcao_id: direcoes[1].id,
        cargo: 'Inspetora de Navegação',
        telefone: '+258 823456791',
        ativo: true
      }
    })
    console.log('Inspetores criados:', inspetor1.email, inspetor2.email)

    // 8. Criar Operadores de Exemplo
    console.log('Criando operadores...')
    const senhaOperador = await bcrypt.hash('Operador@2026', 10)
    
    const operador1 = await prisma.utilizador.upsert({
      where: { email: 'carlos.matusse@aeroportos.co.mz' },
      update: {},
      create: {
        nome_completo: 'Carlos Matusse',
        email: 'carlos.matusse@aeroportos.co.mz',
        senha_hash: senhaOperador,
        perfil_id: perfis.find(p => p.nome === 'operador').id,
        direcao_id: direcoes[0].id,
        cargo: 'Gestor de Operações - Maputo',
        telefone: '+258 823456792',
        ativo: true
      }
    })

    const operador2 = await prisma.utilizador.upsert({
      where: { email: 'ana.bila@aeroportos.co.mz' },
      update: {},
      create: {
        nome_completo: 'Ana Bila',
        email: 'ana.bila@aeroportos.co.mz',
        senha_hash: senhaOperador,
        perfil_id: perfis.find(p => p.nome === 'operador').id,
        direcao_id: direcoes[0].id,
        cargo: 'Gestora de Operações - Beira',
        telefone: '+258 823456793',
        ativo: true
      }
    })
    console.log('Operadores criados:', operador1.email, operador2.email)

    // 9. Criar um Finding de Exemplo (opcional)
    console.log('Criando finding de exemplo...')
    
    // Primeiro, encontrar IDs necessários
    const aerodromoMaputo = await prisma.aerodromo.findUnique({
      where: { codigo_oaci: 'FQMA' }
    })
    
    const areaAGA = await prisma.area_inspecao.findUnique({
      where: { codigo: 'AGA' }
    })
    
    const inspetorJoao = await prisma.utilizador.findUnique({
      where: { email: 'joao.silva@iacm.gov.mz' }
    })

    if (aerodromoMaputo && areaAGA && inspetorJoao) {
      const findingExample = await prisma.finding.create({
        data: {
          numero_processo: 'AGA-FQMA-001-2026',
          aerodromo_id: aerodromoMaputo.id,
          area_inspecao_id: areaAGA.id,
          inspetor_id: inspetorJoao.id,
          data_inspecao: new Date('2026-03-10'),
          finding_level: 2,
          reference_document: 'Anexo 14 - Volume I, Capítulo 3',
          finding_descricao: 'Rachadura na pista principal, secção B, aproximadamente 5 metros de comprimento.',
          status: 'rascunho',
          prioridade: 'alta',
          prazo_resposta_dias: 15,
          data_vencimento: new Date('2026-03-25')
        }
      })
      console.log('Finding de exemplo criado:', findingExample.numero_processo)
    }

    console.log('Seed concluído com sucesso!')
    
  } catch (error) {
    console.error('Erro durante o seed:')
    console.error(error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error('Erro fatal:')
    console.error(e)
    process.exit(1)
  })