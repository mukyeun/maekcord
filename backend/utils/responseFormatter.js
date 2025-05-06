const moment = require('moment-timezone');
moment.tz.setDefault('Asia/Seoul');

const formatAppointment = (appointment) => {
  const scheduledMoment = moment(appointment.scheduledAt);
  const createdMoment = moment(appointment.createdAt);
  const updatedMoment = moment(appointment.updatedAt);
  const cancelledMoment = appointment.cancellation?.cancelledAt ? 
    moment(appointment.cancellation.cancelledAt) : null;

  return {
    id: appointment._id,
    appointmentId: appointment.appointmentId,
    patient: {
      id: appointment.patientId,
      name: appointment.patientName,
      patientNumber: appointment.patientNumber
    },
    doctor: {
      id: appointment.doctorId,
      name: appointment.doctorName
    },
    schedule: {
      date: scheduledMoment.format('YYYY-MM-DD'),
      time: scheduledMoment.format('HH:mm:ss'),
      duration: appointment.duration
    },
    status: appointment.status,
    symptoms: appointment.symptoms,
    notes: appointment.notes,
    cancellation: appointment.cancellation ? {
      reason: appointment.cancellation.reason,
      reasonCategory: appointment.cancellation.reasonCategory,
      cancelledAt: cancelledMoment.format('YYYY-MM-DD HH:mm:ss')
    } : null,
    timestamps: {
      created: createdMoment.format('YYYY-MM-DD HH:mm:ss'),
      updated: updatedMoment.format('YYYY-MM-DD HH:mm:ss')
    }
  };
};

module.exports = {
  formatAppointment
}; 