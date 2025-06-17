
// Utility functions for evaluation auto-completion

export const calculateConformity = (evaluation: any): number => {
  const { type } = evaluation;
  
  switch (type) {
    case 'EPD':
      return calculateEPDConformity(evaluation);
    case 'LCA':
      return calculateLCAConformity(evaluation);
    case 'Manufacturer Inventory':
      return calculateManufacturerInventoryConformity(evaluation);
    case 'REACH Optimization':
      return calculateREACHConformity(evaluation);
    case 'Health Product Declaration':
      return calculateHPDConformity(evaluation);
    case 'C2C':
      return calculateC2CConformity(evaluation);
    case 'Declare':
      return calculateDeclareConformity(evaluation);
    case 'Product Circularity':
      return calculateProductCircularityConformity(evaluation);
    case 'Global Green Tag Product Health Declaration':
    case 'FSC / PEFC':
    case 'ECOLABEL':
      return 100; // These are always 100% when present
    default:
      return 0;
  }
};

export const generateVersion = (type: string, existingEvaluations: any[] = []): string => {
  const sameTypeEvaluations = existingEvaluations.filter(eval => eval.type === type);
  
  if (sameTypeEvaluations.length === 0) {
    return '1.0';
  }
  
  // Find the highest version number
  const versions = sameTypeEvaluations
    .map(eval => eval.version || '1.0')
    .map(version => {
      const parts = version.split('.');
      return {
        major: parseInt(parts[0]) || 1,
        minor: parseInt(parts[1]) || 0
      };
    });
  
  const highestVersion = versions.reduce((max, current) => {
    if (current.major > max.major) return current;
    if (current.major === max.major && current.minor > max.minor) return current;
    return max;
  }, { major: 1, minor: 0 });
  
  // Increment minor version
  return `${highestVersion.major}.${highestVersion.minor + 1}`;
};

const calculateEPDConformity = (evaluation: any): number => {
  const requiredFields = [
    'documentId', 'epdOwner', 'programOperator', 'referencePcr',
    'manufacturerRecognized', 'includeFunctionalUnit', 'manufacturingLocations',
    'minimumCradleToGate', 'allSixImpactCategories', 'lcaVerificationIso14044',
    'personConductingLca', 'lcaSoftware', 'iso21930Compliance',
    'epdVerificationIso14025', 'externalIndependentReviewer'
  ];
  
  const trueCount = requiredFields.filter(field => evaluation[field] === true).length;
  return Math.round((trueCount / requiredFields.length) * 100);
};

const calculateLCAConformity = (evaluation: any): number => {
  const requiredFields = [
    'milestonesForImprovements', 'narrativeActions', 'targetImpactAreas',
    'companyExecutiveSignature', 'summaryLargestImpacts', 'sameOptimizationPcr',
    'optimizationLcaVerification', 'personConductingOptimizationLca',
    'optimizationLcaSoftware', 'comparativeAnalysis', 'narrativeReductions',
    'reductionGwp10', 'reductionGwp20', 'reductionAdditionalCategories'
  ];
  
  const trueCount = requiredFields.filter(field => evaluation[field] === true).length;
  return Math.round((trueCount / requiredFields.length) * 100);
};

const calculateManufacturerInventoryConformity = (evaluation: any): number => {
  const requiredFields = [
    'documentId', 'inventoryAssessed01Wt1000ppm', 'inventoryAssessed01Wt100ppm',
    'allIngredientsIdentifiedByName', 'allIngredientsIdentifiedByCasrn',
    'ingredientChemicalRoleAndAmount', 'hazardScoreClassDisclosed',
    'noGreenScreenLt1Hazards', 'greaterThan95wtAssessed',
    'remaining5PercentInventoried', 'externalIndependentReviewer'
  ];
  
  const trueCount = requiredFields.filter(field => evaluation[field] === true).length;
  return Math.round((trueCount / requiredFields.length) * 100);
};

const calculateREACHConformity = (evaluation: any): number => {
  const requiredFields = [
    'documentId', 'inventoryAssessed001Wt100ppm',
    'noSubstancesAuthorizationListAnnexXIV', 'noSubstancesAuthorizationListAnnexXVII',
    'noSubstancesSvhcCandidateList', 'identificationAuthorReport'
  ];
  
  const trueCount = requiredFields.filter(field => evaluation[field] === true).length;
  return Math.round((trueCount / requiredFields.length) * 100);
};

const calculateHPDConformity = (evaluation: any): number => {
  const requiredFields = [
    'documentId', 'inventoryAssessed001Wt1000ppm', 'inventoryAssessed001Wt100ppm',
    'hazardsFullDisclosed', 'noGreenScreenLt1Hazards',
    'greaterThan95wtAssessed', 'remaining5PercentInventoried',
    'externalIndependentReviewer'
  ];
  
  const trueCount = requiredFields.filter(field => evaluation[field] === true).length;
  return Math.round((trueCount / requiredFields.length) * 100);
};

const calculateC2CConformity = (evaluation: any): number => {
  const requiredFields = ['documentId', 'inventoryAssessed01Wt1000ppm'];
  let score = 0;
  
  // Base requirements
  const trueCount = requiredFields.filter(field => evaluation[field] === true).length;
  score += (trueCount / requiredFields.length) * 50; // 50% for base requirements
  
  // Scoring categories (50% total)
  const scores = [
    evaluation.cleanAirClimateProtectionScore,
    evaluation.waterSoilStewardshipScore,
    evaluation.socialFairnessScore,
    evaluation.productCircularityScore
  ].filter(s => s && s !== '');
  
  if (scores.length > 0) {
    score += 50; // Full score if any categories are filled
  }
  
  return Math.round(score);
};

const calculateDeclareConformity = (evaluation: any): number => {
  const requiredFields = [
    'documentId', 'inventoryAssessed01Wt1000ppm', 'externalIndependentReviewer'
  ];
  
  const trueCount = requiredFields.filter(field => evaluation[field] === true).length;
  return Math.round((trueCount / requiredFields.length) * 100);
};

const calculateProductCircularityConformity = (evaluation: any): number => {
  const fields = [
    evaluation.reusedOrSalvage || evaluation.reusedSalvage,
    evaluation.biobasedAndRecycledContent || evaluation.biobasedRecycledContent,
    evaluation.extendedProducerResponsabilityProgram || evaluation.extendedProducerResponsability
  ].filter(field => field && field.trim() !== '');
  
  return Math.round((fields.length / 3) * 100);
};
