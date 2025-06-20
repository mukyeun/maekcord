const mongoose = require('mongoose');

const pulseProfileFullSchema = new mongoose.Schema({
  pulseCode: String,
  pvcType: String,
  bvType: String,
  svType: String,
  hrType: String,
  hanja: String,
  reference: {
    document: String,
    pages: {
      start: Number,
      end: Number
    }
  },
  clinical: {
    causes: [String],
    management: [String],
    diseases: [String],
    organSymptoms: mongoose.Schema.Types.Mixed
  }
});

module.exports = mongoose.model('PulseProfileFull', pulseProfileFullSchema); 