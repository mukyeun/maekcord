const mongoose = require('mongoose');

// ObjectId 유효성 검사 미들웨어
const validateObjectId = (req, res, next) => {
  const id = req.params.id;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: '유효하지 않은 ID 형식입니다.'
    });
  }
  
  next();
};

module.exports = {
  validateObjectId
}; 