const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Maekcord - 맥진 진단 시스템 API',
      version: '1.0.0',
      description: '의료진을 위한 맥진 진단 및 환자 관리 시스템의 RESTful API 문서',
      contact: {
        name: 'Maekcord Development Team',
        email: 'support@maekcord.com',
        url: 'https://github.com/maekcord/maekcord'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://api.maekcord.com' 
          : process.env.API_URL || 'http://localhost:5000',
        description: process.env.NODE_ENV === 'production' ? '프로덕션 서버' : '개발 서버'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT 토큰을 사용한 인증'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: '에러 메시지'
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'VALIDATION_ERROR'
                },
                details: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      field: {
                        type: 'string'
                      },
                      message: {
                        type: 'string'
                      }
                    }
                  }
                }
              }
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: '성공 메시지'
            },
            data: {
              type: 'object',
              description: '응답 데이터'
            }
          }
        }
      },
      parameters: {
        pageParam: {
          name: 'page',
          in: 'query',
          description: '페이지 번호',
          required: false,
          schema: {
            type: 'integer',
            default: 1,
            minimum: 1
          }
        },
        limitParam: {
          name: 'limit',
          in: 'query',
          description: '페이지당 항목 수',
          required: false,
          schema: {
            type: 'integer',
            default: 10,
            minimum: 1,
            maximum: 100
          }
        },
        searchParam: {
          name: 'search',
          in: 'query',
          description: '검색어',
          required: false,
          schema: {
            type: 'string'
          }
        }
      }
    },
    security: [{
      bearerAuth: []
    }],
    tags: [
      {
        name: 'Authentication',
        description: '사용자 인증 관련 API'
      },
      {
        name: 'Patients',
        description: '환자 관리 API'
      },
      {
        name: 'Queue',
        description: '대기열 관리 API'
      },
      {
        name: 'Appointments',
        description: '예약 관리 API'
      },
      {
        name: 'Pulse',
        description: '맥진 진단 API'
      },
      {
        name: 'Statistics',
        description: '통계 및 분석 API'
      },
      {
        name: 'Monitoring',
        description: '시스템 모니터링 API'
      }
    ]
  },
  apis: [
    './routes/*.js',
    './models/*.js',
    './docs/*.yaml'
  ]
};

module.exports = swaggerOptions; 