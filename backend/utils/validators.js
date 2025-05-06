const validateDate = (dateString) => {
  // YYYY-MM-DD 형식 검사
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) return false;

  // 유효한 날짜인지 검사
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return false;

  return true;
};

module.exports = {
  validateDate
}; 