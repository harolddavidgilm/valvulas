// Consolidated Logic and Verification Script
function calculateASMETolerance(setPressure, norm) {
  let toleranceVal;
  let type;

  if (norm === 'ASME VIII') {
    if (setPressure <= 70) {
      toleranceVal = 2;
      type = 'psi';
    } else {
      toleranceVal = 3;
      type = 'percent';
    }
  } else {
    if (setPressure <= 70) {
      toleranceVal = 2;
      type = 'psi';
    } else if (setPressure <= 300) {
      toleranceVal = 3;
      type = 'percent';
    } else if (setPressure <= 1000) {
      toleranceVal = 10;
      type = 'psi';
    } else {
      toleranceVal = 1;
      type = 'percent';
    }
  }

  const offset = type === 'psi' ? toleranceVal : (setPressure * toleranceVal) / 100;
  
  return {
    min: Number((setPressure - offset).toFixed(2)),
    max: Number((setPressure + offset).toFixed(2)),
    tolerance: type === 'psi' ? `±${toleranceVal} psi` : `±${toleranceVal}%`,
  };
}

function getRiskLevel(pof, cof) {
  const score = pof * cof;
  if (score >= 20) return 'Critico';
  if (score >= 12) return 'Alto';
  if (score >= 6) return 'Medio';
  return 'Bajo';
}

function test() {
  const cases = [
    { p: 50, n: 'ASME VIII', expected: '48.00 - 52.00 (±2 psi)' },
    { p: 100, n: 'ASME VIII', expected: '97.00 - 103.00 (±3%)' },
    { p: 100, n: 'ASME I', expected: '97.00 - 103.00 (±3%)' },
    { p: 400, n: 'ASME I', expected: '390.00 - 410.00 (±10 psi)' },
    { p: 1500, n: 'ASME I', expected: '1485.00 - 1515.00 (±1%)' },
  ];

  console.log('--- Testing ASME Tolerances ---');
  let allPass = true;
  cases.forEach(({ p, n, expected }) => {
    const res = calculateASMETolerance(p, n);
    const actualText = `${res.min.toFixed(2)} - ${res.max.toFixed(2)} (${res.tolerance})`;
    const pass = actualText === expected;
    console.log(`P=${p}, Norm=${n} | Expected: ${expected} | Actual: ${actualText} | ${pass ? '✅' : '❌'}`);
    if (!pass) allPass = false;
  });

  console.log('\n--- Testing Risk Matrix ---');
  const level = getRiskLevel(5, 4); // 20 -> Critico
  console.log(`POF: 5, COF: 4 | Level: ${level} | ${level === 'Critico' ? '✅' : '❌'}`);
  if (level !== 'Critico') allPass = false;

  if (allPass) {
    console.log('\n🎉 ALL TESTS PASSED!');
  } else {
    console.log('\n❌ SOME TESTS FAILED!');
    process.exit(1);
  }
}

test();
