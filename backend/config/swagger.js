const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '병원 관리 시스템 API',
      version: '1.0.0',
      description: '병원 관리 시스템의 RESTful API 문서',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      }
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3000',
        description: '개발 서버'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{
      bearerAuth: []
    }]
  },
  apis: [
    './routes/*.js',
    './models/*.js'
  ]
};

module.exports = swaggerOptions; 