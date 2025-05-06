const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: "병원 예약 관리 시스템 API",
      version: '1.0.0',
      description: "병원 예약 및 환자 관리를 위한 RESTful API",
      contact: {
        name: '개발팀',
        email: 'dev@example.com'
      }
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "개발 서버"
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      }
    },
    security: [{
      bearerAuth: []
    }]
  },
  apis: ['./routes/*.js', './models/*.js']
};

const specs = swaggerJsdoc(options);

module.exports = specs; 