
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Edit, Trash2, FileText, Eye } from "lucide-react";

interface Evaluation {
  id: number;
  type: string;
  version: string;
  issueDate: string;
  validTo: string;
  conformity: number;
  geographicArea: string;
  fileName?: string;
  [key: string]: any; // For specific evaluation type fields
}

interface Material {
  id: number;
  name: string;
  manufacturer: string;
  category: string;
  subcategory: string;
  description: string;
  evaluations: Evaluation[];
}

interface MaterialDetailsProps {
  material: Material;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function MaterialDetails({ material, onClose, onEdit, onDelete }: MaterialDetailsProps) {
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);

  const getEvaluationColor = (evaluation: Evaluation, projectStart = "2023-01-01", projectEnd = "2027-12-31") => {
    const evaluationStart = new Date(evaluation.issueDate);
    const evaluationEnd = new Date(evaluation.validTo);
    const projStart = new Date(projectStart);
    const projEnd = new Date(projectEnd);

    if (evaluationEnd >= projStart && evaluationStart <= projEnd) {
      return "text-green-400"; // Valid during project
    } else if (evaluationEnd < projStart) {
      return "text-red-400"; // Expired before project
    } else if (evaluationStart > projEnd) {
      return "text-blue-400"; // Valid after project
    }
    return "text-purple-400";
  };

  const groupEvaluationsByType = (evaluations: Evaluation[]) => {
    const grouped: Record<string, Evaluation[]> = {};
    evaluations.forEach(evaluation => {
      if (!grouped[evaluation.type]) {
        grouped[evaluation.type] = [];
      }
      grouped[evaluation.type].push(evaluation);
    });
    return grouped;
  };

  const groupedEvaluations = groupEvaluationsByType(material.evaluations);

  const renderEvaluationDetails = (evaluation: Evaluation) => {
    const fields = getEvaluationDisplayFields(evaluation);
    
    return (
      <Dialog open={!!selectedEvaluation} onOpenChange={() => setSelectedEvaluation(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-[#282828] border-[#424242] text-white">
          <DialogHeader>
            <DialogTitle className="text-xl text-white">
              Detalhes da Avaliação: {evaluation.type} v{evaluation.version}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={index} className="grid grid-cols-3 gap-4 py-2 border-b border-[#424242]">
                <div className="text-gray-300 font-medium">{field.label}:</div>
                <div className="col-span-2 text-white">
                  {typeof field.value === 'boolean' 
                    ? (field.value ? '✓ Sim' : '✗ Não')
                    : field.value || 'N/A'
                  }
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const getEvaluationDisplayFields = (evaluation: Evaluation) => {
    // Return formatted fields for display based on evaluation type
    const commonFields = [
      { label: 'Versão', value: evaluation.version },
      { label: 'Área Geográfica', value: evaluation.geographicArea },
      { label: 'Data de Emissão', value: new Date(evaluation.issueDate).toLocaleDateString() },
      { label: 'Válido até', value: new Date(evaluation.validTo).toLocaleDateString() },
      { label: 'Conformidade', value: `${evaluation.conformity}%` }
    ];

    // Add type-specific fields
    const typeSpecificFields = [];
    
    if (evaluation.type === 'EPD') {
      typeSpecificFields.push(
        { label: 'Tipo EPD', value: evaluation.epdType },
        { label: 'Document ID', value: evaluation.documentId },
        { label: 'EPD owner', value: evaluation.epdOwner },
        { label: 'Program operator', value: evaluation.programOperator },
        { label: 'Reference PCR', value: evaluation.referencePcr },
        { label: 'Manufacturer recognized as participant', value: evaluation.manufacturerRecognized },
        { label: 'Include functional unit', value: evaluation.includeFunctionalUnit },
        { label: 'Manufacturing location(s) indicated', value: evaluation.manufacturingLocations },
        { label: 'Minimum cradle to gate scope', value: evaluation.minimumCradleToGate },
        { label: 'All 6 impact categories listed', value: evaluation.allSixImpactCategories },
        { label: 'LCA verification according to ISO 14044', value: evaluation.lcaVerificationIso14044 },
        { label: 'Identification of the person conducting the LCA', value: evaluation.personConductingLca },
        { label: 'LCA software used', value: evaluation.lcaSoftware },
        { label: 'ISO 21930 or EN 15804 compliance', value: evaluation.iso21930Compliance },
        { label: 'EPD verification according to ISO 14025', value: evaluation.epdVerificationIso14025 },
        { label: 'Identification of the external independent reviewer', value: evaluation.externalIndependentReviewer }
      );
    }
    
    if (evaluation.type === 'LCA') {
      typeSpecificFields.push(
        { label: 'LCA optimization type', value: evaluation.lcaOptimizationType },
        { label: 'Milestones for improvements with timeline', value: evaluation.milestonesForImprovements },
        { label: 'Narrative with actions to be pursued', value: evaluation.narrativeActions },
        { label: 'Description of target impact areas', value: evaluation.targetImpactAreas },
        { label: 'Signature of company executive', value: evaluation.companyExecutiveSignature },
        { label: 'Table/Summary of largest life cycle impacts', value: evaluation.summaryLargestImpacts },
        { label: 'Same optimization PCR as reference PCR', value: evaluation.sameOptimizationPcr },
        { label: 'Optimization LCA verification according to ISO 14044', value: evaluation.optimizationLcaVerification },
        { label: 'Identification of the person conducting the optimization LCA', value: evaluation.personConductingOptimizationLca },
        { label: 'Optimization LCA software used', value: evaluation.optimizationLcaSoftware },
        { label: 'Comparative analysis showing impact reduction in GWP', value: evaluation.comparativeAnalysis },
        { label: 'Narrative describing how reductions in impacts were achieved', value: evaluation.narrativeReductions },
        { label: 'Reduction in GWP against the baseline 10%', value: evaluation.reductionGwp10 },
        { label: 'Reduction in GWP against the baseline 20%', value: evaluation.reductionGwp20 },
        { label: 'Reduction in additional 2 impact categories', value: evaluation.reductionAdditional2Categories }
      );
    }

    if (evaluation.type === 'C2C') {
      typeSpecificFields.push(
        { label: 'Tipo C2C', value: evaluation.c2cType },
        { label: 'Clean Air and Climate Protection', value: evaluation.cleanAirClimateProtection },
        { label: 'Water and Soil Stewardship', value: evaluation.waterSoilStewardship },
        { label: 'Social Fearness', value: evaluation.socialFearness },
        { label: 'Product Circularity', value: evaluation.productCircularity },
        { label: 'Additional Achievement', value: evaluation.additionalAchievement },
        { label: 'Document ID', value: evaluation.documentId },
        { label: 'Inventory assessed at 0,1wt.% or 1000ppm', value: evaluation.inventoryAssessed }
      );
    }

    if (evaluation.type === 'Manufacturer Inventory') {
      typeSpecificFields.push(
        { label: 'Manufacturer Inventory type', value: evaluation.manufacturerInventoryType },
        { label: 'Document ID', value: evaluation.documentId },
        { label: 'Inventory assessed at 0,1 wt.% or 1000ppm', value: evaluation.inventoryAssessed1000ppm },
        { label: 'Inventory assessed at 0,1 wt.% or 100ppm', value: evaluation.inventoryAssessed100ppm },
        { label: 'All ingredients identified by name', value: evaluation.allIngredientsName },
        { label: 'All ingredients identified by CASRN or EC Number', value: evaluation.allIngredientsCasrn },
        { label: 'Ingredient / chemical role and amount disclosed', value: evaluation.ingredientRoleAmount },
        { label: 'Hazard score / class disclosed', value: evaluation.hazardScoreClass },
        { label: 'No GreenScreen LT-1 hazards are present', value: evaluation.noLt1Hazards },
        { label: '>95wt.% is assessed using GreenScreen and no BM-1 hazards', value: evaluation.greenScreen95wt },
        { label: 'Remaining 5% is inventoried and no GreenScreen LT-1 hazards', value: evaluation.remaining5Percent },
        { label: 'Identification of the external independent reviewer', value: evaluation.externalReviewer }
      );
    }

    if (evaluation.type === 'REACH Optimization') {
      typeSpecificFields.push(
        { label: 'Report Type', value: evaluation.reportType },
        { label: 'Document ID', value: evaluation.documentId },
        { label: 'Inventory assessed at 0,01 wt.% or 100ppm', value: evaluation.inventoryAssessed100ppm },
        { label: 'No substances found on the Authorization list - Annex XIV', value: evaluation.noAnnexXiv },
        { label: 'No substances found on the Authorization list - Annex XVII', value: evaluation.noAnnexXvii },
        { label: 'No substances found on the SVHC candidate list', value: evaluation.noSvhcList },
        { label: 'Identification of the author of the report', value: evaluation.authorIdentification }
      );
    }

    if (evaluation.type === 'Health Product Declaration') {
      typeSpecificFields.push(
        { label: 'HPD type', value: evaluation.hpdType },
        { label: 'Document ID', value: evaluation.documentId },
        { label: 'Inventory assessed at 0,01 wt.% or 1000ppm', value: evaluation.inventoryAssessed1000ppm },
        { label: 'Inventory assessed at 0,01 wt.% or 100ppm', value: evaluation.inventoryAssessed100ppm },
        { label: 'Hazards full disclosed in compliance with the HPD Open Standard', value: evaluation.hazardsFullDisclosed },
        { label: 'No GreenScreen LT-1 hazards are present', value: evaluation.noLt1Hazards },
        { label: '>95wt.% is assessed using GreenScreen and no BM-1 hazards', value: evaluation.greenScreen95wt },
        { label: 'Remaining 5% is inventoried and no GreenScreen LT-1 hazards', value: evaluation.remaining5Percent },
        { label: 'Identification of external independent reviewer', value: evaluation.externalReviewer }
      );
    }

    if (evaluation.type === 'Declare') {
      typeSpecificFields.push(
        { label: 'Declare type', value: evaluation.declareType },
        { label: 'Document ID', value: evaluation.documentId },
        { label: 'Inventory assessed at 0,1wt.% or 1000ppm', value: evaluation.inventoryAssessed1000ppm },
        { label: 'Identification of the external independent reviewer', value: evaluation.externalReviewer }
      );
    }

    if (evaluation.type === 'Product Circularity') {
      typeSpecificFields.push(
        { label: 'Reused or Salvage', value: evaluation.reusedOrSalvage },
        { label: 'Biobased and Recycled Content (%)', value: evaluation.biobasedRecycledContent },
        { label: 'Extended Producer Responsibility Program', value: evaluation.extendedProducerResponsability }
      );
    }

    return [...commonFields, ...typeSpecificFields];
  };

  return (
    <div className="min-h-screen bg-[#282828] text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="bg-[#323232] border-[#424242] hover:bg-[#424242] text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">{material.name}</h1>
              <span className="text-sm bg-[#424242] px-2 py-1 rounded text-white">ID: {material.id}</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={onEdit}
              className="bg-[#358C48] hover:bg-[#4ea045] text-white"
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
            <Button 
              onClick={onDelete}
              className="bg-[#8C3535] hover:bg-[#a04545] text-white"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          </div>
        </div>

        {/* Material Information */}
        <Card className="bg-[#323232] border-[#424242] mb-6">
          <CardHeader>
            <CardTitle className="text-white">Informações do Material</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-300">Nome</label>
                <p className="text-white">{material.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300">Fabricante</label>
                <p className="text-white">{material.manufacturer}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300">Categoria</label>
                <p className="text-white">{material.category}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300">Subcategoria</label>
                <p className="text-white">{material.subcategory}</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">Descrição</label>
              <p className="text-white">{material.description || "N/A"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Evaluations with enhanced details */}
        <Card className="bg-[#323232] border-[#424242]">
          <CardHeader>
            <CardTitle className="text-white">Avaliações ({material.evaluations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {material.evaluations.length === 0 ? (
              <p className="text-gray-400">Nenhuma avaliação disponível</p>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedEvaluations).map(([type, evaluations]) => (
                  <div key={type}>
                    <h3 className="text-lg font-semibold text-white mb-3">{type}</h3>
                    <div className="grid gap-4">
                      {evaluations.map((evaluation) => (
                        <div 
                          key={evaluation.id} 
                          className="bg-[#424242] rounded-lg p-4 border border-[#525252]"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-medium text-white">
                                {type} {evaluation.version && `v${evaluation.version}`}
                              </h4>
                              <p className={`text-sm ${getEvaluationColor(evaluation)}`}>
                                Status: Válido de {new Date(evaluation.issueDate).toLocaleDateString()} até {new Date(evaluation.validTo).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-white">
                                {evaluation.conformity}%
                              </div>
                              <div className="text-xs text-gray-400">Conformidade</div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-300">Data de Emissão:</span>
                              <span className="text-white ml-2">
                                {new Date(evaluation.issueDate).toLocaleDateString()}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-300">Válido até:</span>
                              <span className="text-white ml-2">
                                {new Date(evaluation.validTo).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          
                          <div className="mt-3 pt-3 border-t border-[#525252] flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="bg-[#35568C] hover:bg-[#89A9D2] border-[#35568C] text-white"
                              onClick={() => setSelectedEvaluation(evaluation)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalhes
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="bg-[#35568C] hover:bg-[#89A9D2] border-[#35568C] text-white"
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Ver Arquivo
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Evaluation Details Dialog */}
        {selectedEvaluation && renderEvaluationDetails(selectedEvaluation)}
      </div>
    </div>
  );
}
