'use client';

import styles from './RiskMatrix.module.css';

interface RiskMatrixProps {
  valvulas: any[];
}

export default function RiskMatrix({ valvulas }: RiskMatrixProps) {
  const pofLabels = [5, 4, 3, 2, 1];
  const cofLabels = [1, 2, 3, 4, 5];

  // Map to store counts per cell (POF-COF)
  const cellCounts: Record<string, number> = {};
  
  valvulas.forEach(v => {
    // If valve has RBI analysis, use its scores, otherwise ignore or use default
    // For now, let's assume we have pof_score and cof_score in the valve data
    const pof = v.pof_score || 0;
    const cof = v.cof_score || 0;
    if (pof > 0 && cof > 0) {
      const key = `${pof}-${cof}`;
      cellCounts[key] = (cellCounts[key] || 0) + 1;
    }
  });

  return (
    <div className={`${styles.matrixWrapper}`}>
      <div className={styles.yLabel}>Probabilidad de Falla (POF) →</div>
      
      <div className={styles.container}>
        <div className={styles.yAxis}>
          {pofLabels.map(l => <span key={l}>{l}</span>)}
        </div>
        
        <div className={styles.matrixGrid}>
          {pofLabels.map((pof) => (
            cofLabels.map((cof) => {
              const count = cellCounts[`${pof}-${cof}`] || 0;
              const riskValue = pof * cof;
              
              // Matrix 5x5 Standard Risk Calculation
              let level = 'bajo';
              if (riskValue >= 20 || (pof === 5 && cof >= 4)) level = 'critico';
              else if (riskValue >= 12 || (pof >= 4 && cof >= 3)) level = 'alto';
              else if (riskValue >= 6) level = 'medio';

              return (
                <div 
                  key={`${pof}-${cof}`} 
                  className={`${styles.cell} ${styles[level]}`}
                  title={`POF: ${pof}, COF: ${cof} | Válvulas: ${count}`}
                >
                  {count > 0 && <span className={styles.bubble}>{count}</span>}
                </div>
              );
            })
          ))}
        </div>
        
        <div className={styles.xAxis}>
          {cofLabels.map(l => <span key={l}>{l}</span>)}
        </div>
        <div className={styles.xLabel}>← Consecuencia de Falla (COF)</div>
      </div>
    </div>
  );
}
