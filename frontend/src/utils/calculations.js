/**
 * Calculate BMI (Body Mass Index)
 * @param {number} height - Height in centimeters
 * @param {number} weight - Weight in kilograms
 * @returns {number} BMI value rounded to 1 decimal place
 */
export const calculateBMI = (height, weight) => {
  if (!height || !weight) return null;
  
  // Convert height to meters
  const heightInMeters = height / 100;
  
  // Calculate BMI: weight (kg) / height² (m²)
  const bmi = weight / (heightInMeters * heightInMeters);
  
  // Round to 1 decimal place
  return Math.round(bmi * 10) / 10;
};

/**
 * Get BMI category based on value
 * @param {number} bmi - BMI value
 * @returns {string} BMI category
 */
export const getBMICategory = (bmi) => {
  if (!bmi) return '';
  if (bmi < 18.5) return '저체중';
  if (bmi < 23) return '정상';
  if (bmi < 25) return '과체중';
  if (bmi < 30) return '비만';
  return '고도비만';
}; 