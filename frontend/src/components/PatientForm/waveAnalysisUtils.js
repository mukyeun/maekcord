export const calculatePVC = (data) => {
  const { 'b/a': ba, 'd/a': da, 'a-e': ae, 'c/a': ca } = data;
  return (
    0.2 * Math.abs(ba || 0) +
    0.15 * Math.abs(da || 0) +
    0.1 * (ae || 0) +
    0.05 * Math.abs(ca || 0)
  ).toFixed(2);
};

export const calculateBV = (data) => {
  const { 'c/a': ca, 'a-d': ad, 'a-c': ac, 'a-e': ae, 'a-b': ab } = data;
  return (
    0.15 * Math.abs(ca || 0) +
    0.1 * ((ad || 0) - (ac || 0)) +
    0.1 * ((ae || 0) / (ab || 1)) +
    0.05 * (ab || 0)
  ).toFixed(2);
};

export const calculateSV = (data) => {
  const { 'd/a': da, 'a-e': ae, 'b/a': ba } = data;
  return (
    0.05 * Math.abs(da || 0) +
    0.03 * (ae || 0) +
    0.02 * Math.abs(ba || 0)
  ).toFixed(2);
}; 