/**
 * Core business logic for PSV/PRV valve management.
 * Based on ASME Section I/VIII and industrial RBI standards.
 */

export type Normativa = 'ASME I' | 'ASME VIII';

export interface ToleranceResult {
  min: number;
  max: number;
  tolerance: string;
}

/**
 * Calculates the allowed tolerance for a given set pressure and normative.
 */
export function calculateASMETolerance(
  setPressure: number,
  norm: Normativa
): ToleranceResult {
  let toleranceVal: number;
  let type: 'psi' | 'percent';

  if (norm === 'ASME VIII') {
    if (setPressure <= 70) {
      toleranceVal = 2;
      type = 'psi';
    } else {
      toleranceVal = 3;
      type = 'percent';
    }
  } else {
    // ASME I (Calderas)
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

/**
 * Calculates the risk level based on Probability of Failure (POF) 
 * and Consequence of Failure (COF) (1-5 scales).
 */
export function getRiskLevel(pof: number, cof: number): 'Bajo' | 'Medio' | 'Alto' | 'Critico' {
  const score = pof * cof;
  
  if (score >= 20) return 'Critico';
  if (score >= 12) return 'Alto';
  if (score >= 6) return 'Medio';
  return 'Bajo';
}

/**
 * Recommends an inspection interval in months based on risk level.
 */
export function getRecommendedInterval(risk: 'Bajo' | 'Medio' | 'Alto' | 'Critico'): number {
  switch (risk) {
    case 'Critico': return 12;
    case 'Alto': return 24;
    case 'Medio': return 48;
    case 'Bajo': return 60;
    default: return 36;
  }
}
