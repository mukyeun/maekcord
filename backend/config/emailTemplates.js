const formatDate = (date) => {
  return new Date(date).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
    hour: 'numeric',
    minute: 'numeric'
  });
};

const styles = {
  container: 'font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;',
  header: 'background-color: #4A90E2; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;',
  content: 'background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px;',
  infoBox: 'background-color: white; padding: 15px; margin: 10px 0; border-radius: 5px; border: 1px solid #eee;',
  footer: 'text-align: center; padding: 20px; color: #666; font-size: 12px;'
};

const emailTemplates = {
  appointmentCreated: (appointment, patient, doctor) => ({
    subject: '[매크병원] 진료 예약이 완료되었습니다',
    html: `
      <div style="${styles.container}">
        <div style="${styles.header}">
          <h2>진료 예약 확인</h2>
        </div>
        <div style="${styles.content}">
          <p>안녕하세요, <strong>${patient.name}</strong>님.</p>
          <p>진료 예약이 완료되었습니다.</p>
          
          <div style="${styles.infoBox}">
            <h3>📅 예약 정보</h3>
            <ul style="list-style: none; padding-left: 0;">
              <li>🔸 예약 번호: ${appointment.appointmentId}</li>
              <li>🔸 담당 의사: ${doctor.name}</li>
              <li>🔸 진료 일시: ${formatDate(appointment.appointmentDate)}</li>
              <li>🔸 진료 유형: ${appointment.visitType}</li>
              <li>🔸 증상: ${appointment.symptoms.join(', ')}</li>
            </ul>
          </div>

          <p style="color: #666; font-size: 14px;">
            * 예약 변경이나 취소는 진료일 24시간 전까지 가능합니다.<br>
            * 예약 시간 10분 전까지 내원해 주시기 바랍니다.
          </p>
        </div>
        <div style="${styles.footer}">
          <p>문의사항: 02-XXX-XXXX (평일 09:00-18:00)</p>
          <p>매크병원 예약시스템</p>
        </div>
      </div>
    `
  }),

  appointmentCancelled: (appointment, patient, doctor) => ({
    subject: '[매크병원] 진료 예약이 취소되었습니다',
    html: `
      <div style="${styles.container}">
        <div style="${styles.header}">
          <h2>진료 예약 취소 확인</h2>
        </div>
        <div style="${styles.content}">
          <p>안녕하세요, <strong>${patient.name}</strong>님.</p>
          <p>진료 예약이 취소되었습니다.</p>
          
          <div style="${styles.infoBox}">
            <h3>❌ 취소된 예약 정보</h3>
            <ul style="list-style: none; padding-left: 0;">
              <li>🔸 예약 번호: ${appointment.appointmentId}</li>
              <li>🔸 담당 의사: ${doctor.name}</li>
              <li>🔸 진료 일시: ${formatDate(appointment.appointmentDate)}</li>
              <li>🔸 취소 사유: ${appointment.cancellationReason}</li>
              <li>🔸 취소 시각: ${formatDate(appointment.cancellationDate)}</li>
            </ul>
          </div>

          <p>다시 예약을 원하시면 아래 연락처로 문의해 주시기 바랍니다.</p>
        </div>
        <div style="${styles.footer}">
          <p>문의사항: 02-XXX-XXXX (평일 09:00-18:00)</p>
          <p>매크병원 예약시스템</p>
        </div>
      </div>
    `
  }),

  appointmentReminder: (appointment, patient, doctor) => ({
    subject: '[매크병원] 내일 진료 예약이 있습니다',
    html: `
      <div style="${styles.container}">
        <div style="${styles.header}">
          <h2>진료 예약 알림</h2>
        </div>
        <div style="${styles.content}">
          <p>안녕하세요, <strong>${patient.name}</strong>님.</p>
          <p>내일 진료 예약이 있음을 알려드립니다.</p>
          
          <div style="${styles.infoBox}">
            <h3>⏰ 예약 정보</h3>
            <ul style="list-style: none; padding-left: 0;">
              <li>🔸 예약 번호: ${appointment.appointmentId}</li>
              <li>🔸 담당 의사: ${doctor.name}</li>
              <li>🔸 진료 일시: ${formatDate(appointment.appointmentDate)}</li>
              <li>🔸 진료 유형: ${appointment.visitType}</li>
            </ul>
          </div>

          <p style="color: #666; font-size: 14px;">
            * 예약 시간 10분 전까지 내원해 주시기 바랍니다.<br>
            * 부득이한 사정으로 내원이 어려운 경우, 미리 연락 부탁드립니다.
          </p>
        </div>
        <div style="${styles.footer}">
          <p>문의사항: 02-XXX-XXXX (평일 09:00-18:00)</p>
          <p>매크병원 예약시스템</p>
        </div>
      </div>
    `
  }),

  appointmentUpdated: (appointment, patient, doctor, changes) => ({
    subject: '[매크병원] 진료 예약이 변경되었습니다',
    html: `
      <div style="${styles.container}">
        <div style="${styles.header}">
          <h2>진료 예약 변경 확인</h2>
        </div>
        <div style="${styles.content}">
          <p>안녕하세요, <strong>${patient.name}</strong>님.</p>
          <p>진료 예약이 변경되었습니다.</p>
          
          <div style="${styles.infoBox}">
            <h3>📝 변경된 예약 정보</h3>
            <ul style="list-style: none; padding-left: 0;">
              <li>🔸 예약 번호: ${appointment.appointmentId}</li>
              <li>🔸 담당 의사: ${doctor.name}</li>
              <li>🔸 진료 일시: ${formatDate(appointment.appointmentDate)}</li>
              <li>🔸 진료 유형: ${appointment.visitType}</li>
            </ul>
          </div>

          <div style="${styles.infoBox}">
            <h3>📋 변경 내역</h3>
            <ul style="list-style: none; padding-left: 0;">
              ${Array.from(changes.entries()).map(([field, value]) => `
                <li>🔸 ${field}: ${formatChange(field, value)}</li>
              `).join('')}
            </ul>
          </div>

          <p style="color: #666; font-size: 14px;">
            * 추가 변경이나 취소는 진료일 24시간 전까지 가능합니다.<br>
            * 예약 시간 10분 전까지 내원해 주시기 바랍니다.
          </p>
        </div>
        <div style="${styles.footer}">
          <p>문의사항: 02-XXX-XXXX (평일 09:00-18:00)</p>
          <p>매크병원 예약시스템</p>
        </div>
      </div>
    `
  })
};

module.exports = emailTemplates; 