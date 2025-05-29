
import { localDB } from './database';

export async function seedDatabase() {
  // Check if data already exists
  const existingMaterials = await localDB.getMaterials();
  if (existingMaterials.length > 0) {
    console.log('Database already seeded');
    return;
  }

  console.log('Seeding database with test data...');

  // Save default config
  const config = {
    manufacturers: ["Madeiras & madeira", "Amorim Cimentos", "Test Manufacturer", "Silva Wood Industries", "EcoMaterials Ltd", "GreenBuild Corp", "Sustainable Materials Co", "TechBuild Solutions"],
    categories: ["Wood", "Concrete", "Metal", "Glass", "Plastic", "Ceramic", "Composite", "Insulation"],
    subcategories: {
      "Wood": ["Treated Wood", "Natural Wood", "Laminated Wood", "Engineered Wood", "Bamboo", "Cork"],
      "Concrete": ["Standard Concrete", "High Performance Concrete", "Lightweight Concrete", "Precast Concrete", "Reinforced Concrete"],
      "Metal": ["Steel", "Aluminum", "Copper", "Iron", "Titanium", "Stainless Steel"],
      "Glass": ["Standard Glass", "Tempered Glass", "Laminated Glass", "Double Glazed", "Smart Glass"],
      "Plastic": ["PVC", "Polyethylene", "Polypropylene", "Acrylic", "Polycarbonate"],
      "Ceramic": ["Floor Tiles", "Wall Tiles", "Porcelain", "Terracotta", "Technical Ceramics"],
      "Composite": ["Fiber Reinforced", "Carbon Fiber", "Glass Fiber", "Natural Fiber"],
      "Insulation": ["Mineral Wool", "Foam", "Natural Fiber", "Reflective"]
    },
    evaluationTypes: [
      "EPD", "LCA", "Manufacturer Inventory", "REACH Optimization",
      "Health Product Declaration", "C2C", "Declare", "Product Circularity",
      "Global Green Tag Product Health Declaration", "FSC / PEFC", "ECOLABEL"
    ]
  };

  await localDB.saveConfig(config);

  // Seed materials with various evaluations
  const testMaterials = [
    {
      name: "European Oak Flooring",
      manufacturer: "Silva Wood Industries",
      category: "Wood",
      subcategory: "Natural Wood",
      description: "Premium European oak flooring with natural finish",
      evaluations: [
        {
          id: 1,
          type: "EPD",
          version: "1.2",
          issueDate: "2023-01-15",
          validTo: "2028-01-15",
          conformity: 95,
          geographicArea: "Europe",
          epdType: "Product specific LCA",
          documentId: true,
          epdOwner: true,
          referencePcr: true,
          manufacturerRecognized: false,
          includeFunctionalUnit: true,
          manufacturingLocations: true,
          minimumCradleToGate: true,
          allSixImpactCategories: true,
          lcaVerificationIso14044: true,
          personConductingLca: true,
          lcaSoftware: true,
          epdFile: "1EPDv1.2.pdf"
        },
        {
          id: 2,
          type: "FSC / PEFC",
          version: "1.0",
          issueDate: "2023-03-01",
          validTo: "2026-03-01",
          conformity: 100,
          geographicArea: "Global"
        }
      ]
    },
    {
      name: "High Performance Concrete Mix",
      manufacturer: "Amorim Cimentos",
      category: "Concrete",
      subcategory: "High Performance Concrete",
      description: "Advanced concrete mix for structural applications",
      evaluations: [
        {
          id: 3,
          type: "EPD",
          version: "2.1",
          issueDate: "2023-06-01",
          validTo: "2028-06-01",
          conformity: 88,
          geographicArea: "Europe",
          epdType: "Product-specific Type III External EPD",
          documentId: true,
          epdOwner: true,
          programOperator: true,
          referencePcr: true,
          manufacturerRecognized: false,
          includeFunctionalUnit: true,
          manufacturingLocations: true,
          minimumCradleToGate: true,
          allSixImpactCategories: false,
          lcaVerificationIso14044: true,
          personConductingLca: true,
          lcaSoftware: true,
          iso21930Compliance: true,
          epdVerificationIso14025: true,
          externalIndependentReviewer: true,
          epdFile: "2EPDv2.1.pdf"
        },
        {
          id: 4,
          type: "LCA",
          version: "1.0",
          issueDate: "2023-04-15",
          validTo: "2027-04-15",
          conformity: 75,
          geographicArea: "Europe",
          lcaOptimizationType: "Verified impact reductions in GWP",
          sameOptimizationPcr: true,
          optimizationLcaVerification: true,
          personConductingOptimizationLca: true,
          optimizationLcaSoftware: true,
          comparativeAnalysis: true,
          narrativeReductions: true,
          reductionGwp10: true,
          lcaFile: "2LCAv1.0.pdf"
        }
      ]
    },
    {
      name: "Recycled Aluminum Panel",
      manufacturer: "EcoMaterials Ltd",
      category: "Metal",
      subcategory: "Aluminum",
      description: "Sustainable aluminum panels made from recycled content",
      evaluations: [
        {
          id: 5,
          type: "C2C",
          version: "3.1",
          issueDate: "2023-02-20",
          validTo: "2026-02-20",
          conformity: 92,
          geographicArea: "Global",
          c2cType: "C2C Certified v3 with Material Health at Silver level",
          cleanAirClimateProtection: "Level 2",
          waterSoilStewardship: "Level 3",
          socialFearness: "Level 2",
          productCircularity: "Level 3",
          additionalAchievement: "Exceeds industry standards for recycled content",
          documentId: true,
          inventoryAssessed: true,
          c2cFile: "3C2Cv3.1.pdf"
        },
        {
          id: 6,
          type: "Product Circularity",
          version: "1.5",
          issueDate: "2023-05-10",
          validTo: "2027-05-10",
          conformity: 85,
          geographicArea: "Global",
          reusedOrSalvage: "Contains 80% recycled aluminum content",
          biobasedRecycledContent: "80% recycled content verified by third party",
          extendedProducerResponsability: "Active EPR program with take-back services"
        }
      ]
    },
    {
      name: "Low-E Double Glazed Window",
      manufacturer: "GreenBuild Corp",
      category: "Glass",
      subcategory: "Double Glazed",
      description: "Energy efficient double glazed windows with low emissivity coating",
      evaluations: [
        {
          id: 7,
          type: "Health Product Declaration",
          version: "2.0",
          issueDate: "2023-07-01",
          validTo: "2026-07-01",
          conformity: 78,
          geographicArea: "North America",
          hpdType: "Verified advanced HPD",
          documentId: true,
          inventoryAssessed100ppm: true,
          hazardsFullDisclosed: true,
          noLt1Hazards: true,
          externalReviewer: true,
          hpdFile: "4HPDv2.0.pdf"
        }
      ]
    },
    {
      name: "Eco-Friendly PVC Flooring",
      manufacturer: "Sustainable Materials Co",
      category: "Plastic",
      subcategory: "PVC",
      description: "Environmentally conscious PVC flooring with reduced chemical emissions",
      evaluations: [
        {
          id: 8,
          type: "REACH Optimization",
          version: "1.1",
          issueDate: "2023-08-15",
          validTo: "2026-08-15",
          conformity: 100,
          geographicArea: "Europe",
          reportType: "Manufacturer's report",
          documentId: true,
          inventoryAssessed100ppm: true,
          noAnnexXiv: true,
          noAnnexXvii: true,
          noSvhcList: true,
          reachFile: "5REACHv1.1.pdf"
        },
        {
          id: 9,
          type: "Declare",
          version: "1.0",
          issueDate: "2023-09-01",
          validTo: "2026-09-01",
          conformity: 95,
          geographicArea: "Global",
          declareType: "Verified Red List Free",
          documentId: true,
          inventoryAssessed1000ppm: true,
          externalReviewer: true,
          declareFile: "5DECLAREv1.0.pdf"
        }
      ]
    }
  ];

  for (const material of testMaterials) {
    await localDB.addMaterial(material);
  }

  console.log('Database seeded successfully with', testMaterials.length, 'materials');
}
