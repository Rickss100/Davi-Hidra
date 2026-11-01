/**
 * Especificação Oficial OpenAPI 3.0.3 da API Norte Invest (Método DAVI & Hydra)
 * Mapeamento estrito das rotas autenticadas, modelos Zod e parâmetros de DevSecOps.
 */

export const NORTE_INVEST_OPENAPI_SPEC = {
  openapi: '3.0.3',
  info: {
    title: 'Norte Invest API — Método DAVI & Mecanismo Hydra',
    version: '2.0.0',
    description: `
API RESTful corporativa para gestão patrimonial, curadoria fundamentalista e alocação automática de investimentos.
Desenvolvida sob as diretrizes **Zero-Trust (DevSecOps)** com cookies assinados HttpOnly, proteção anti-IDOR e validação de esquemas via Zod.

### Principais Módulos:
* **Autenticação & 2FA:** Gestão de sessões, criptografia AES-256 e autenticação de dois fatores RFC 6238 TOTP.
* **Radar Fundamentalista:** Peneira de ações e FIIs com os filtros do Método DAVI (Setores BEST, Novo Mercado, P/VP Inteligente e Multiativo).
* **Mecanismo Onde Aportar:** Motor de alocação AM2O (*Always Move to Objective*) e cálculo do Ponto Mágico (*Magic Number*).
* **Objetivos & Reserva:** Calibração da Carteira Hydra e estratégias de blindagem patrimonial.
* **Governança & TI:** Auditoria de acessos e gestão de investidores autorizados.
    `,
    contact: {
      name: 'Suporte Técnico Norte Invest',
      email: 'suporte@norteinvest.com',
      url: 'https://norteinvest.com'
    }
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Servidor Local de Desenvolvimento / Staging'
    }
  ],
  tags: [
    { name: 'Autenticação & Sessão', description: 'Login, logout, 2FA e renovação de credenciais' },
    { name: 'Radar de Ativos (Método DAVI)', description: 'Filtros fundamentalistas, cotações e curadoria' },
    { name: 'Mecanismo Onde Aportar (AM2O)', description: 'Algoritmo de rebalanceamento por novos aportes e Ponto Mágico' },
    { name: 'Definir Objetivos & Reserva', description: 'Metas patrimoniais, carteira Hydra e Reserva de Emergência' },
    { name: 'Gestão & TI (Administração)', description: 'Governança, controle de investidores e trilha de auditoria' }
  ],
  paths: {
    '/api/auth/login': {
      post: {
        tags: ['Autenticação & Sessão'],
        summary: 'Autenticar investidor ou colaborador',
        description: 'Valida as credenciais com bcrypt e cria cookie seguro HttpOnly vinculado à tabela user_sessions.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'investidor@norteinvest.com' },
                  password: { type: 'string', format: 'password', example: 'SenhaSegura123!' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Login efetuado com sucesso (cookie de sessão emitido)',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    requires2FA: { type: 'boolean', example: false },
                    user: {
                      type: 'object',
                      properties: {
                        id: { type: 'integer', example: 1000000 },
                        email: { type: 'string', example: 'investidor@norteinvest.com' },
                        name: { type: 'string', example: 'Carlos Silva' },
                        role: { type: 'string', enum: ['admin', 'collaborator', 'user'], example: 'user' }
                      }
                    }
                  }
                }
              }
            }
          },
          '401': { description: 'Credenciais inválidas ou e-mail/senha incorretos' },
          '429': { description: 'Rate limit excedido por segurança (proteção contra brute-force)' }
        }
      }
    },
    '/api/auth/logout': {
      post: {
        tags: ['Autenticação & Sessão'],
        summary: 'Encerrar sessão ativa',
        description: 'Revoga o ID da sessão no banco de dados e limpa os cookies HttpOnly.',
        responses: {
          '200': { description: 'Sessão encerrada com sucesso' }
        }
      }
    },
    '/api/radar': {
      get: {
        tags: ['Radar de Ativos (Método DAVI)'],
        summary: 'Consultar catálogo de ativos com indicadores fundamentalistas',
        description: 'Retorna a lista de Ações, FIIs, Renda Fixa e Ativos Internacionais com métricas de valuation, eficiência e governança.',
        parameters: [
          {
            name: 'type',
            in: 'query',
            description: 'Classe de ativos a filtrar',
            required: false,
            schema: { type: 'string', enum: ['all', 'acoes', 'fiis', 'fixed', 'stocks', 'reits'], default: 'all' }
          },
          {
            name: 'q',
            in: 'query',
            description: 'Termo de busca textual por código, nome da empresa ou setor',
            required: false,
            schema: { type: 'string', example: 'BBAS3' }
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Limite máximo de registros',
            required: false,
            schema: { type: 'integer', default: 1500 }
          }
        ],
        responses: {
          '200': {
            description: 'Catálogo de ativos retornado com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    totalCatalog: { type: 'integer', example: 414 },
                    items: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          code: { type: 'string', example: 'BBAS3' },
                          name: { type: 'string', example: 'Banco do Brasil' },
                          type: { type: 'string', example: 'Ações' },
                          price: { type: 'number', example: 28.5 },
                          peRatio: { type: 'number', nullable: true, example: 4.8 },
                          pbRatio: { type: 'number', nullable: true, example: 0.85 },
                          dividendYield: { type: 'number', nullable: true, example: 9.8 },
                          roe: { type: 'number', nullable: true, example: 21.5 },
                          isNovoMercado: { type: 'boolean', example: true },
                          isBestSector: { type: 'boolean', example: true }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/portfolio/suggestions': {
      post: {
        tags: ['Mecanismo Onde Aportar (AM2O)'],
        summary: 'Calcular sugestões de novos aportes pelo algoritmo AM2O',
        description: 'Cruza a custódia atual do investidor com suas metas e com a Reserva de Emergência, calculando distâncias sem vendas e o impacto no Ponto Mágico.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['availableAmountBrl'],
                properties: {
                  availableAmountBrl: { type: 'number', minimum: 0.01, example: 5000 },
                  numAssets: { type: 'integer', minimum: 1, maximum: 10, default: 3, example: 3 },
                  reserveStrategy: {
                    type: 'string',
                    enum: ['focus_100', 'hybrid_70_30', 'hybrid_50_50', 'free'],
                    default: 'hybrid_70_30',
                    example: 'hybrid_70_30'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Sugestões geradas com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    suggestions: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          ticker: { type: 'string', example: 'BBAS3' },
                          assetName: { type: 'string', example: 'Banco do Brasil' },
                          categoria: { type: 'string', example: 'acoes' },
                          cotas: { type: 'number', example: 45 },
                          currentPrice: { type: 'number', example: 28.5 },
                          valorTotal: { type: 'number', example: 1282.5 },
                          reason: { type: 'string', example: 'Desconto de Alocação Hydra: 8.2% atual vs 15.0% meta.' },
                          magicNumberText: { type: 'string', example: 'Faltam 75 cotas para o Ponto Mágico (37% concluído).' }
                        }
                      }
                    },
                    totalSuggestedBrl: { type: 'number', example: 5000 },
                    whatsappSummary: { type: 'string', description: 'Texto formatado para envio direto via WhatsApp' }
                  }
                }
              }
            }
          },
          '400': { description: 'Parâmetros de aporte inválidos' },
          '401': { description: 'Sessão não autorizada ou expirada' }
        }
      }
    },
    '/api/portfolio/objectives': {
      get: {
        tags: ['Definir Objetivos & Reserva'],
        summary: 'Obter configuração de metas macro e alocação alvo',
        responses: {
          '200': {
            description: 'Metas recuperadas com sucesso'
          },
          '401': { description: 'Não autorizado' }
        }
      },
      put: {
        tags: ['Definir Objetivos & Reserva'],
        summary: 'Salvar metas macro, pesos individuais ou Reserva de Emergência',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  macroAllocation: {
                    type: 'object',
                    properties: {
                      fixed: { type: 'number', example: 15 },
                      acoes: { type: 'number', example: 40 },
                      fiis: { type: 'number', example: 30 },
                      stocks: { type: 'number', example: 15 }
                    }
                  },
                  emergencyConfig: {
                    type: 'object',
                    properties: {
                      monthlyExpense: { type: 'number', example: 3000 },
                      monthsTarget: { type: 'number', example: 6 },
                      strategyMode: { type: 'string', enum: ['focus_100', 'hybrid_70_30', 'hybrid_50_50'], example: 'hybrid_70_30' }
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Metas atualizadas com sucesso' },
          '401': { description: 'Não autorizado' }
        }
      }
    },
    '/api/admin/users': {
      get: {
        tags: ['Gestão & TI (Administração)'],
        summary: 'Listar usuários cadastrados (Exclusivo Admin/Colaborador)',
        responses: {
          '200': { description: 'Lista de usuários retornada' },
          '403': { description: 'Acesso negado: perfil de investidor comum' }
        }
      }
    },
    '/api/admin/impersonate': {
      post: {
        tags: ['Gestão & TI (Administração)'],
        summary: 'Iniciar auditoria assistida na carteira de um investidor',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['targetUserId'],
                properties: {
                  targetUserId: { type: 'integer', example: 4 }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Sessão de auditoria configurada com log de conformidade' },
          '403': { description: 'Acesso restrito' }
        }
      }
    }
  }
};
