const Joi = require('joi');
const { objectId } = require('./custom.validation');

const getQueueById = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required()
  })
};

const getQueueStatus = {
  query: Joi.object().keys({
    patientId: Joi.string().custom(objectId).required(),
    date: Joi.date().required()
  })
};

const postQueueStatus = {
  body: Joi.object().keys({
    patientId: Joi.string().custom(objectId).required(),
    date: Joi.date().required()
  })
};

const registerQueue = {
  body: Joi.object().keys({
    patientId: Joi.string().custom(objectId).required(),
    date: Joi.date().required(),
    priority: Joi.string().valid('normal', 'urgent', 'emergency'),
    notes: Joi.string()
  })
};

const updateQueueStatus = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required()
  }),
  body: Joi.object().keys({
    status: Joi.string().valid('waiting', 'called', 'consulting', 'completed', 'cancelled').required(),
    notes: Joi.string()
  })
};

module.exports = {
  getQueueById,
  getQueueStatus,
  postQueueStatus,
  registerQueue,
  updateQueueStatus
}; 