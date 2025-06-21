const express = require('express');
const router = express.Router();

const {
    getQueue,
    getTodayQueue,
    registerToQueue,
    updateQueueStatus,
    deleteQueueEntry,
    callPatient,
    getCurrentPatientForDoctor,
    saveQueueNote,
    getQueueStatus,
    createTestData,
} = require('../controllers/queueController');

router.get('/today', getTodayQueue);
router.get('/status', getQueueStatus);
router.get('/current-patient', getCurrentPatientForDoctor);

router.post('/register', registerToQueue);
router.post('/call/:queueId', callPatient);
router.post('/test-data', createTestData);

router.put('/:queueId/status', updateQueueStatus);
router.put('/:queueId/note', saveQueueNote);

router.delete('/:queueId', deleteQueueEntry);
router.delete('/debug/all', deleteAllQueueEntries);

module.exports = router; 