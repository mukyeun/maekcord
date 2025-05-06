import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchQueueData } from '../store/thunks/queueThunks';

const QueueDisplayPage = () => {
  const dispatch = useDispatch();
  const { waitingList, currentPatient, loading, error } = useSelector((state) => state.queue);

  useEffect(() => {
    const loadQueueData = async () => {
      try {
        await dispatch(fetchQueueData());
      } catch (error) {
        console.error('Failed to load queue data:', error);
      }
    };

    loadQueueData();

    // 실시간 업데이트를 위한 인터벌 설정
    const interval = setInterval(loadQueueData, 30000); // 30초마다 업데이트

    return () => clearInterval(interval);
  }, [dispatch]);

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="queue-display-container">
      <div className="current-patient-section">
        <h2>현재 진료중</h2>
        {currentPatient ? (
          <div className="current-patient-card">
            <div className="room-info">진료실 1</div>
            <div className="patient-number">{currentPatient.waitingNumber}</div>
            <div className="patient-name">
              {currentPatient.name.charAt(0)}*{currentPatient.name.slice(2)}
            </div>
          </div>
        ) : (
          <div className="no-current-patient">
            현재 진료 중인 환자가 없습니다.
          </div>
        )}
      </div>

      <div className="waiting-list-section">
        <h2>대기 순서</h2>
        <div className="waiting-list">
          {waitingList.length > 0 ? (
            waitingList.map((patient, index) => (
              <div key={patient.id} className="waiting-patient-card">
                <div className="order-number">{index + 1}</div>
                <div className="patient-info">
                  <span className="number">{patient.waitingNumber}</span>
                  <span className="name">
                    {patient.name.charAt(0)}*{patient.name.slice(2)}
                  </span>
                </div>
                <div className="status">{patient.status}</div>
              </div>
            ))
          ) : (
            <div className="no-waiting-patients">
              대기 중인 환자가 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QueueDisplayPage;
