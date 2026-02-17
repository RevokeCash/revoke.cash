export const bigintMax = (...nums: bigint[]) => nums.reduce((a, b) => (a > b ? a : b));
export const bigintMin = (...nums: bigint[]) => nums.reduce((a, b) => (a < b ? a : b));

export const fixedPointMultiply = (a: bigint, b: number, decimals: number): bigint => {
  return (a * BigInt(Math.round(b * 10 ** decimals))) / BigInt(10 ** decimals);
};
