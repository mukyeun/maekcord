// backend/tools/cleanupPatients.js
const mongoose = require('mongoose');
const Patient = require('../models/Patient');
mongoose.connect('mongodb://localhost:27017/maekcode');

(async () => {
  const patients = await Patient.find({});
  for (const patient of patients) {
    if (Array.isArray(patient.records)) {
      const validRecords = [];
      for (const record of patient.records) {
        try {
          if (!record.visitDateTime || !record.createdAt || !record.updatedAt) continue;
          if (!record.pulseWave || !record.pulseWave.lastUpdated) continue;
          if (!record.stress || !record.stress.measuredAt) continue;
          if (record.stress && typeof record.stress.items === 'string') {
            try {
              const parsed = JSON.parse(record.stress.items);
              if (!Array.isArray(parsed)) continue;
            } catch { continue; }
          }
          validRecords.push(record);
        } catch { continue; }
      }
      patient.records = validRecords;
      await patient.save();
    }
  }
  console.log('환자 데이터 클린업 완료');
  process.exit();
})();