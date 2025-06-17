
interface EvaluationField {
  [key: string]: any;
}

export const calculateConformity = (evaluation: EvaluationField): number => {
  const totalFields = Object.keys(evaluation).filter(key => 
    key !== 'id' && 
    key !== 'type' && 
    key !== 'version' && 
    key !== 'issueDate' && 
    key !== 'validTo' && 
    key !== 'conformity' && 
    key !== 'geographicArea' &&
    !key.endsWith('File')
  );

  const filledFields = totalFields.filter(key => {
    const value = evaluation[key];
    if (typeof value === 'boolean') return value === true;
    if (typeof value === 'string') return value.trim() !== '';
    if (typeof value === 'number') return value > 0;
    return false;
  });

  if (totalFields.length === 0) return 0;
  return Math.round((filledFields.length / totalFields.length) * 100);
};

export const generateVersion = (existingEvaluations: EvaluationField[], type: string): string => {
  const sameTypeEvaluations = existingEvaluations.filter(evaluation => evaluation.type === type);
  const versions = sameTypeEvaluations
    .map(evaluation => evaluation.version)
    .filter(version => version && typeof version === 'string')
    .map(version => {
      const match = version.match(/^(\d+)\.(\d+)$/);
      return match ? { major: parseInt(match[1]), minor: parseInt(match[2]) } : null;
    })
    .filter(version => version !== null)
    .sort((a, b) => {
      if (a!.major !== b!.major) return b!.major - a!.major;
      return b!.minor - a!.minor;
    });

  if (versions.length === 0) return '1.0';
  
  const latest = versions[0]!;
  return `${latest.major}.${latest.minor + 1}`;
};
