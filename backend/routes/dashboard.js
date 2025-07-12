const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Queue = require('../models/Queue');

router.get('/summary', async (req, res) => {
  try {
    // 오늘 날짜 범위 (00:00 ~ 23:59)
    const today = new Date();
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // 오늘의 대기: Queue에서 오늘 날짜, status: 'waiting'
    const waiting = await Queue.countDocuments({
      date: { $gte: today, $lt: tomorrow },
      status: 'waiting',
      isArchived: false
    });

    // 예약: Appointment에서 오늘 날짜, status: 'scheduled'
    const reservations = await Appointment.countDocuments({
      appointmentDate: { $gte: today, $lt: tomorrow },
      status: 'scheduled'
    });

    // 진료중: Queue에서 오늘 날짜, status: 'consulting'
    const inTreatment = await Queue.countDocuments({
      date: { $gte: today, $lt: tomorrow },
      status: 'consulting',
      isArchived: false
    });

    // 신규환자: Patient에서 오늘 생성된 환자
    const newPatients = await Patient.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow }
    });

    res.json({ waiting, reservations, inTreatment, newPatients });
  } catch (err) {
    console.error('대시보드 요약 오류:', err);
    res.status(500).json({ message: '대시보드 요약 오류' });
  }
});

module.exports = router;
