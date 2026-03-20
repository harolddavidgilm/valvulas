import { calculateASMETolerance, getRiskLevel, getRecommendedInterval, Normativa } from './src/lib/valve-logic';

function testTolerance() {
  const cases: { p: number; n: Normativa; expected: string }[] = [
    { p: 50, n: 'ASME VIII', expected: '48.00 - 52.00 (±2 psi)' },
    { p: 100, n: 'ASME VIII', expected: '97.00 - 103.00 (±3%)' },
    { p: 100, n: 'ASME I', expected: '97.00 - 103.00 (±3%)' },
    { p: 400, n: 'ASME I', expected: '390.00 - 410.00 (±10 psi)' },
    { p: 1500, n: 'ASME I', expected: '1485.00 - 1515.00 (±1%)' },
  ];

  console.log('--- Testing ASME Tolerances ---');
  cases.forEach(({ p, n, expected }) => {
    const res = calculateASMETolerance(p, n);
    const actual = `${res.min.toFixed(2)} - ${res.max.toFixed(2)} (${res.tolerance})`;
    console.log(`P=${p}, Norm=${n} | Expected: ${expected} | Actual: ${actual} | ${actual === expected ? '✅' : '❌'}`);
  });
}

function testRisk() {
  console.log('\n--- Testing Risk Matrix ---');
  const riskCase = { pof: 5, cof: 4 };
  const level = getRiskLevel(riskCase.pof, riskCase.cof);
  const interval = getRecommendedInterval(level);
  console.log(`POF: ${riskCase.pof}, COF: ${riskCase.cof} | Level: ${level} | Interval: ${interval} months | ${level === 'Critico' ? '✅' : '❌'}`);
}

testTolerance();
testRisk();
