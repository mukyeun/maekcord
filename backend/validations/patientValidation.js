const Joi = require('joi');

const patientValidation = {
  // 환자 생성 스키마
  create: Joi.object({
    name: Joi.string()
      .required()
      .trim()
      .messages({
        'string.empty': '이름은 필수 입력 항목입니다.',
        'any.required': '이름은 필수 입력 항목입니다.'
      }),

    birthDate: Joi.date()
      .required()
      .max('now')
      .messages({
        'date.base': '올바른 생년월일 형식이 아닙니다.',
        'date.max': '생년월일은 현재 날짜보다 이전이어야 합니다.',
        'any.required': '생년월일은 필수 입력 항목입니다.'
      }),

    gender: Joi.string()
      .valid('male', 'female', 'other')
      .required()
      .messages({
        'any.only': '올바른 성별을 선택해주세요.',
        'any.required': '성별은 필수 입력 항목입니다.'
      }),

    contact: Joi.object({
      phone: Joi.string()
        .required()
        .pattern(/^[0-9]{2,3}-[0-9]{3,4}-[0-9]{4}$/)
        .messages({
          'string.pattern.base': '올바른 전화번호 형식이 아닙니다. (예: 010-1234-5678)',
          'any.required': '전화번호는 필수 입력 항목입니다.'
        }),
      email: Joi.string()
        .email()
        .allow('')
        .messages({
          'string.email': '올바른 이메일 형식이 아닙니다.'
        }),
      address: Joi.string().allow('')
    }),

    emergencyContact: Joi.object({
      name: Joi.string().allow(''),
      phone: Joi.string()
        .pattern(/^[0-9]{2,3}-[0-9]{3,4}-[0-9]{4}$/)
        .allow('')
        .messages({
          'string.pattern.base': '올바른 전화번호 형식이 아닙니다. (예: 010-1234-5678)'
        }),
      relationship: Joi.string().allow('')
    }),

    medicalHistory: Joi.object({
      allergies: Joi.array().items(Joi.string()),
      chronicConditions: Joi.array().items(Joi.string()),
      medications: Joi.array().items(Joi.string()),
      surgeries: Joi.array().items(
        Joi.object({
          name: Joi.string().required(),
          date: Joi.date().required(),
          notes: Joi.string().allow('')
        })
      )
    }),

    insuranceInfo: Joi.object({
      provider: Joi.string().allow(''),
      policyNumber: Joi.string().allow(''),
      validUntil: Joi.date().allow(null)
    })
  }),

  // 환자 정보 수정 스키마
  update: Joi.object({
    name: Joi.string().trim(),
    birthDate: Joi.date().max('now'),
    gender: Joi.string().valid('male', 'female', 'other'),
    contact: Joi.object({
      phone: Joi.string().pattern(/^[0-9]{2,3}-[0-9]{3,4}-[0-9]{4}$/),
      email: Joi.string().email().allow(''),
      address: Joi.string().allow('')
    }),
    emergencyContact: Joi.object({
      name: Joi.string().allow(''),
      phone: Joi.string().pattern(/^[0-9]{2,3}-[0-9]{3,4}-[0-9]{4}$/).allow(''),
      relationship: Joi.string().allow('')
    }),
    medicalHistory: Joi.object({
      allergies: Joi.array().items(Joi.string()),
      chronicConditions: Joi.array().items(Joi.string()),
      medications: Joi.array().items(Joi.string()),
      surgeries: Joi.array().items(
        Joi.object({
          name: Joi.string().required(),
          date: Joi.date().required(),
          notes: Joi.string().allow('')
        })
      )
    }),
    insuranceInfo: Joi.object({
      provider: Joi.string().allow(''),
      policyNumber: Joi.string().allow(''),
      validUntil: Joi.date().allow(null)
    })
  }),

  // 환자 상태 변경 스키마
  updateStatus: Joi.object({
    status: Joi.string()
      .valid('active', 'inactive')
      .required()
      .messages({
        'any.only': '유효하지 않은 상태값입니다.',
        'any.required': '상태값은 필수 입력 항목입니다.'
      }),
    reason: Joi.string()
      .when('status', {
        is: 'inactive',
        then: Joi.string().required().messages({
          'any.required': '비활성화 사유는 필수 입력 항목입니다.'
        }),
        otherwise: Joi.string().allow('')
      })
  })
};

module.exports = patientValidation; 