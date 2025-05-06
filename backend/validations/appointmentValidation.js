const Joi = require('joi');

const appointmentValidation = {
  create: Joi.object({
    doctorId: Joi.string().required().messages({
      'string.empty': '의사 ID는 필수입니다.',
      'any.required': '의사 ID는 필수입니다.'
    }),
    patientId: Joi.string().required().messages({
      'string.empty': '환자 ID는 필수입니다.',
      'any.required': '환자 ID는 필수입니다.'
    }),
    startTime: Joi.date().iso().required().messages({
      'date.base': '올바른 시작 시간 형식이 아닙니다.',
      'any.required': '시작 시간은 필수입니다.'
    }),
    endTime: Joi.date().iso().greater(Joi.ref('startTime')).required().messages({
      'date.base': '올바른 종료 시간 형식이 아닙니다.',
      'date.greater': '종료 시간은 시작 시간보다 늦어야 합니다.',
      'any.required': '종료 시간은 필수입니다.'
    }),
    status: Joi.string().valid('scheduled', 'confirmed', 'completed', 'cancelled').default('scheduled').messages({
      'string.base': '올바른 상태값이 아닙니다.',
      'any.only': '허용되지 않는 상태값입니다.'
    }),
    waitlistId: Joi.string().optional(),
    notes: Joi.string().max(500).optional().messages({
      'string.max': '메모는 500자를 초과할 수 없습니다.'
    })
  }),

  update: Joi.object({
    startTime: Joi.date().iso().optional().messages({
      'date.base': '올바른 시작 시간 형식이 아닙니다.'
    }),
    endTime: Joi.date().iso().when('startTime', {
      is: Joi.exist(),
      then: Joi.date().greater(Joi.ref('startTime')).required().messages({
        'date.greater': '종료 시간은 시작 시간보다 늦어야 합니다.',
        'any.required': '종료 시간은 필수입니다.'
      }),
      otherwise: Joi.date().optional()
    }),
    status: Joi.string().valid('scheduled', 'confirmed', 'completed', 'cancelled').messages({
      'string.base': '올바른 상태값이 아닙니다.',
      'any.only': '허용되지 않는 상태값입니다.'
    }),
    notes: Joi.string().max(500).optional().messages({
      'string.max': '메모는 500자를 초과할 수 없습니다.'
    })
  })
};

module.exports = appointmentValidation; 