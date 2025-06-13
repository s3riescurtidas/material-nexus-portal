
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, X } from "lucide-react";

interface EvaluationFormProps {
  evaluation?: any;
  onClose: () => void;
  onSave: (evaluation: any) => void;
}

export function EvaluationForm({ evaluation, onClose, onSave }: EvaluationFormProps) {
  const [formData, setFormData] = useState({
    type: '',
    version: '',
    issueDate: '',
    validTo: '',
    conformity: 0,
    geographicArea: 'Global',
    fileName: '',
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (evaluation) {
      setFormData({
        ...evaluation,
        conformity: evaluation.conformity || 0,
        geographicArea: evaluation.geographicArea || 'Global',
      });
    }
  }, [evaluation]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFormData(prev => ({
        ...prev,
        fileName: file.name
      }));
    }
  };

  const calculateConformity = () => {
    if (formData.conformity > 0) {
      // Don't override custom conformity values
      return;
    }

    const booleanFields = getBooleanFieldsForType(formData.type);
    const validFields = getValidFieldsForSubtype(formData.type, formData);
    
    if (validFields.length === 0) {
      setFormData(prev => ({ ...prev, conformity: 100 }));
      return;
    }
    
    const trueCount = validFields.filter(field => formData[field] === true).length;
    const conformityPercentage = Math.round((trueCount / validFields.length) * 100);
    
    setFormData(prev => ({ ...prev, conformity: conformityPercentage }));
  };

  const getBooleanFieldsForType = (type: string) => {
    const fieldMaps = {
      'EPD': ['documentId', 'epdOwner', 'programOperator', 'referencePcr', 'manufacturerRecognized', 'includeFunctionalUnit', 'manufacturingLocations', 'minimumCradleToGate', 'allSixImpactCategories', 'lcaVerificationIso14044', 'personConductingLca', 'lcaSoftware', 'iso21930Compliance', 'epdVerificationIso14025', 'externalIndependentReviewer'],
      'LCA': ['milestonesForImprovements', 'narrativeActions', 'targetImpactAreas', 'companyExecutiveSignature', 'summaryLargestImpacts', 'sameOptimizationPcr', 'optimizationLcaVerification', 'personConductingOptimizationLca', 'optimizationLcaSoftware', 'comparativeAnalysis', 'narrativeReductions', 'reductionGwp10', 'reductionGwp20', 'reductionAdditionalCategories'],
      'Manufacturer Inventory': ['documentId', 'inventoryAssessed1000ppm', 'inventoryAssessed100ppm', 'allIngredientsName', 'allIngredientsCasrn', 'ingredientRoleAmount', 'hazardScoreClass', 'noGreenScreenLt1', 'greenScreen95wt', 'remaining5Inventoried', 'externalIndependentReviewer'],
      'REACH Optimization': ['documentId', 'inventoryAssessed100ppm', 'noAuthorizationListXiv', 'noAuthorizationListXvii', 'noSvhcCandidateList', 'identificationAuthor'],
      'Health Product Declaration': ['documentId', 'inventoryAssessed1000ppm', 'inventoryAssessed100ppm', 'hazardsFullDisclosed', 'noGreenScreenLt1', 'greenScreen95wt', 'remaining5Inventoried', 'externalIndependentReviewer'],
      'C2C': ['documentId', 'inventoryAssessed1000ppm'],
      'Declare': ['documentId', 'inventoryAssessed1000ppm', 'externalIndependentReviewer']
    };
    
    return fieldMaps[type] || [];
  };

  const getValidFieldsForSubtype = (type: string, data: any) => {
    const allFields = getBooleanFieldsForType(type);
    
    switch (type) {
      case 'EPD':
        if (data.epdType === 'Not compliant') return [];
        return allFields.filter(field => {
          if (field === 'programOperator' || field === 'iso21930Compliance' || field === 'epdVerificationIso14025') {
            return data.epdType !== 'Product specific LCA';
          }
          if (field === 'manufacturerRecognized') {
            return data.epdType === 'Industry-wide/generic EPD';
          }
          if (field === 'externalIndependentReviewer') {
            return data.epdType !== 'Product specific LCA' && data.epdType !== 'Product-specific Type III Internal EPD';
          }
          return true;
        });
        
      case 'LCA':
        if (data.lcaOptimizationType === 'Not compliant') return [];
        return allFields.filter(field => {
          if (['milestonesForImprovements', 'narrativeActions', 'targetImpactAreas', 'companyExecutiveSignature', 'summaryLargestImpacts'].includes(field)) {
            return data.lcaOptimizationType === 'LCA impact reduction action plan';
          }
          if (['sameOptimizationPcr', 'optimizationLcaVerification', 'personConductingOptimizationLca', 'optimizationLcaSoftware', 'comparativeAnalysis', 'narrativeReductions'].includes(field)) {
            return data.lcaOptimizationType !== 'LCA impact reduction action plan';
          }
          if (field === 'reductionGwp10') {
            return data.lcaOptimizationType === 'Verified impact reductions in GWP';
          }
          if (field === 'reductionGwp20' || field === 'reductionAdditionalCategories') {
            return data.lcaOptimizationType === 'Verified impact reduction in GWP > 20% + in two other > 5%';
          }
          return true;
        });
        
      case 'Manufacturer Inventory':
        if (data.manufacturerInventoryType === 'Not compliant') return [];
        return allFields.filter(field => {
          if (field === 'inventoryAssessed1000ppm') {
            return ['Self-declared manufacturer Inventory', 'Verified manufacturer Inventory'].includes(data.manufacturerInventoryType);
          }
          if (field === 'inventoryAssessed100ppm') {
            return ['Verified advanced manufacturer Inventory', 'Verified ingredient optimized manufacturer Inventory'].includes(data.manufacturerInventoryType);
          }
          if (field === 'noGreenScreenLt1') {
            return data.manufacturerInventoryType === 'Verified advanced manufacturer Inventory';
          }
          if (field === 'greenScreen95wt' || field === 'remaining5Inventoried') {
            return data.manufacturerInventoryType === 'Verified ingredient optimized manufacturer Inventory';
          }
          if (field === 'externalIndependentReviewer') {
            return data.manufacturerInventoryType !== 'Self-declared manufacturer Inventory';
          }
          return true;
        });
        
      default:
        return allFields;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    calculateConformity();
    
    const evaluationData = {
      ...formData,
      id: evaluation?.id || Date.now()
    };
    
    onSave(evaluationData);
  };

  const renderSpecificFields = () => {
    switch (formData.type) {
      case 'EPD':
        return (
          <>
            <div>
              <Label htmlFor="epdType">EPD Type</Label>
              <Select value={formData.epdType || ''} onValueChange={(value) => handleInputChange('epdType', value)}>
                <SelectTrigger className="bg-[#323232] border-[#424242] text-white">
                  <SelectValue placeholder="Select EPD Type" />
                </SelectTrigger>
                <SelectContent className="bg-[#323232] border-[#424242] text-white">
                  <SelectItem value="Not compliant">Not compliant</SelectItem>
                  <SelectItem value="Product specific LCA">Product specific LCA</SelectItem>
                  <SelectItem value="Industry-wide/generic EPD">Industry-wide/generic EPD</SelectItem>
                  <SelectItem value="Product-specific Type III Internal EPD">Product-specific Type III Internal EPD</SelectItem>
                  <SelectItem value="Product Specific Type III External EPD">Product Specific Type III External EPD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="documentId"
                  checked={formData.documentId || false}
                  onCheckedChange={(checked) => handleInputChange('documentId', checked)}
                />
                <Label htmlFor="documentId">Document ID</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="epdOwner"
                  checked={formData.epdOwner || false}
                  onCheckedChange={(checked) => handleInputChange('epdOwner', checked)}
                />
                <Label htmlFor="epdOwner">EPD owner</Label>
              </div>
              {formData.epdType !== 'Product specific LCA' && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="programOperator"
                    checked={formData.programOperator || false}
                    onCheckedChange={(checked) => handleInputChange('programOperator', checked)}
                  />
                  <Label htmlFor="programOperator">Program operator</Label>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="referencePcr"
                  checked={formData.referencePcr || false}
                  onCheckedChange={(checked) => handleInputChange('referencePcr', checked)}
                />
                <Label htmlFor="referencePcr">Reference PCR</Label>
              </div>
              {formData.epdType === 'Industry-wide/generic EPD' && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="manufacturerRecognized"
                    checked={formData.manufacturerRecognized || false}
                    onCheckedChange={(checked) => handleInputChange('manufacturerRecognized', checked)}
                  />
                  <Label htmlFor="manufacturerRecognized">Manufacturer recognized as participant</Label>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeFunctionalUnit"
                  checked={formData.includeFunctionalUnit || false}
                  onCheckedChange={(checked) => handleInputChange('includeFunctionalUnit', checked)}
                />
                <Label htmlFor="includeFunctionalUnit">Include functional unit</Label>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="manufacturingLocations"
                  checked={formData.manufacturingLocations || false}
                  onCheckedChange={(checked) => handleInputChange('manufacturingLocations', checked)}
                />
                <Label htmlFor="manufacturingLocations">Manufacturing location(s) indicated</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="minimumCradleToGate"
                  checked={formData.minimumCradleToGate || false}
                  onCheckedChange={(checked) => handleInputChange('minimumCradleToGate', checked)}
                />
                <Label htmlFor="minimumCradleToGate">Minimum cradle to gate scope</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allSixImpactCategories"
                  checked={formData.allSixImpactCategories || false}
                  onCheckedChange={(checked) => handleInputChange('allSixImpactCategories', checked)}
                />
                <Label htmlFor="allSixImpactCategories">All 6 impact categories listed</Label>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="lcaVerificationIso14044"
                  checked={formData.lcaVerificationIso14044 || false}
                  onCheckedChange={(checked) => handleInputChange('lcaVerificationIso14044', checked)}
                />
                <Label htmlFor="lcaVerificationIso14044">LCA verification according to ISO 14044</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="personConductingLca"
                  checked={formData.personConductingLca || false}
                  onCheckedChange={(checked) => handleInputChange('personConductingLca', checked)}
                />
                <Label htmlFor="personConductingLca">Identification of the person conducting the LCA</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="lcaSoftware"
                  checked={formData.lcaSoftware || false}
                  onCheckedChange={(checked) => handleInputChange('lcaSoftware', checked)}
                />
                <Label htmlFor="lcaSoftware">LCA software used</Label>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {formData.epdType !== 'Product specific LCA' && (
                <>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="iso21930Compliance"
                      checked={formData.iso21930Compliance || false}
                      onCheckedChange={(checked) => handleInputChange('iso21930Compliance', checked)}
                    />
                    <Label htmlFor="iso21930Compliance">ISO 21930 or EN 15804 compliance</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="epdVerificationIso14025"
                      checked={formData.epdVerificationIso14025 || false}
                      onCheckedChange={(checked) => handleInputChange('epdVerificationIso14025', checked)}
                    />
                    <Label htmlFor="epdVerificationIso14025">EPD verification according to ISO 14025</Label>
                  </div>
                </>
              )}
              {formData.epdType !== 'Product specific LCA' && formData.epdType !== 'Product-specific Type III Internal EPD' && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="externalIndependentReviewer"
                    checked={formData.externalIndependentReviewer || false}
                    onCheckedChange={(checked) => handleInputChange('externalIndependentReviewer', checked)}
                  />
                  <Label htmlFor="externalIndependentReviewer">Identification of the external independent reviewer</Label>
                </div>
              )}
            </div>
          </>
        );
        
      case 'LCA':
        return (
          <>
            <div>
              <Label htmlFor="lcaOptimizationType">LCA Optimization Type</Label>
              <Select value={formData.lcaOptimizationType || ''} onValueChange={(value) => handleInputChange('lcaOptimizationType', value)}>
                <SelectTrigger className="bg-[#323232] border-[#424242] text-white">
                  <SelectValue placeholder="Select LCA Optimization Type" />
                </SelectTrigger>
                <SelectContent className="bg-[#323232] border-[#424242] text-white">
                  <SelectItem value="Not compliant">Not compliant</SelectItem>
                  <SelectItem value="LCA impact reduction action plan">LCA impact reduction action plan</SelectItem>
                  <SelectItem value="Verified impact reductions in GWP">Verified impact reductions in GWP</SelectItem>
                  <SelectItem value="Verified impact reduction in GWP > 10%">Verified impact reduction in GWP {'>'} 10%</SelectItem>
                  <SelectItem value="Verified impact reduction in GWP > 20% + in two other > 5%">Verified impact reduction in GWP {'>'} 20% + in two other {'>'} 5%</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {formData.lcaOptimizationType === 'LCA impact reduction action plan' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="milestonesForImprovements"
                    checked={formData.milestonesForImprovements || false}
                    onCheckedChange={(checked) => handleInputChange('milestonesForImprovements', checked)}
                  />
                  <Label htmlFor="milestonesForImprovements">Milestones for improvements with timeline</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="narrativeActions"
                    checked={formData.narrativeActions || false}
                    onCheckedChange={(checked) => handleInputChange('narrativeActions', checked)}
                  />
                  <Label htmlFor="narrativeActions">Narrative with actions to be pursued</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="targetImpactAreas"
                    checked={formData.targetImpactAreas || false}
                    onCheckedChange={(checked) => handleInputChange('targetImpactAreas', checked)}
                  />
                  <Label htmlFor="targetImpactAreas">Description of target impact areas</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="companyExecutiveSignature"
                    checked={formData.companyExecutiveSignature || false}
                    onCheckedChange={(checked) => handleInputChange('companyExecutiveSignature', checked)}
                  />
                  <Label htmlFor="companyExecutiveSignature">Signature of company executive</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="summaryLargestImpacts"
                    checked={formData.summaryLargestImpacts || false}
                    onCheckedChange={(checked) => handleInputChange('summaryLargestImpacts', checked)}
                  />
                  <Label htmlFor="summaryLargestImpacts">Table/Summary of largest life cycle impacts</Label>
                </div>
              </div>
            )}
            
            {formData.lcaOptimizationType !== 'LCA impact reduction action plan' && formData.lcaOptimizationType !== 'Not compliant' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sameOptimizationPcr"
                    checked={formData.sameOptimizationPcr || false}
                    onCheckedChange={(checked) => handleInputChange('sameOptimizationPcr', checked)}
                  />
                  <Label htmlFor="sameOptimizationPcr">Same optimization PCR as reference PCR</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="optimizationLcaVerification"
                    checked={formData.optimizationLcaVerification || false}
                    onCheckedChange={(checked) => handleInputChange('optimizationLcaVerification', checked)}
                  />
                  <Label htmlFor="optimizationLcaVerification">Optimization LCA verification according to ISO 14044</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="personConductingOptimizationLca"
                    checked={formData.personConductingOptimizationLca || false}
                    onCheckedChange={(checked) => handleInputChange('personConductingOptimizationLca', checked)}
                  />
                  <Label htmlFor="personConductingOptimizationLca">Identification of the person conducting the optimization LCA</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="optimizationLcaSoftware"
                    checked={formData.optimizationLcaSoftware || false}
                    onCheckedChange={(checked) => handleInputChange('optimizationLcaSoftware', checked)}
                  />
                  <Label htmlFor="optimizationLcaSoftware">Optimization LCA software used</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="comparativeAnalysis"
                    checked={formData.comparativeAnalysis || false}
                    onCheckedChange={(checked) => handleInputChange('comparativeAnalysis', checked)}
                  />
                  <Label htmlFor="comparativeAnalysis">Comparative analysis showing impact reduction in GWP</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="narrativeReductions"
                    checked={formData.narrativeReductions || false}
                    onCheckedChange={(checked) => handleInputChange('narrativeReductions', checked)}
                  />
                  <Label htmlFor="narrativeReductions">Narrative describing how reductions in impacts were achieved</Label>
                </div>
              </div>
            )}
            
            {formData.lcaOptimizationType === 'Verified impact reductions in GWP' && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="reductionGwp10"
                  checked={formData.reductionGwp10 || false}
                  onCheckedChange={(checked) => handleInputChange('reductionGwp10', checked)}
                />
                <Label htmlFor="reductionGwp10">Reduction in GWP against the baseline 10%</Label>
              </div>
            )}
            
            {formData.lcaOptimizationType === 'Verified impact reduction in GWP > 20% + in two other > 5%' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="reductionGwp20"
                    checked={formData.reductionGwp20 || false}
                    onCheckedChange={(checked) => handleInputChange('reductionGwp20', checked)}
                  />
                  <Label htmlFor="reductionGwp20">Reduction in GWP against the baseline 20%</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="reductionAdditionalCategories"
                    checked={formData.reductionAdditionalCategories || false}
                    onCheckedChange={(checked) => handleInputChange('reductionAdditionalCategories', checked)}
                  />
                  <Label htmlFor="reductionAdditionalCategories">Reduction in additional 2 impact categories against the baseline {'>'} 5%</Label>
                </div>
              </div>
            )}
          </>
        );
        
      // Continue with other evaluation types...
      default:
        return (
          <div>
            <Label>Campos específicos para {formData.type} serão implementados em breve</Label>
          </div>
        );
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#282828] border-[#424242] text-white">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {evaluation ? 'Editar Avaliação' : 'Adicionar Avaliação'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Tipo de Avaliação</Label>
              <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                <SelectTrigger className="bg-[#323232] border-[#424242] text-white">
                  <SelectValue placeholder="Selecione o tipo de avaliação" />
                </SelectTrigger>
                <SelectContent className="bg-[#323232] border-[#424242] text-white">
                  <SelectItem value="EPD">EPD</SelectItem>
                  <SelectItem value="LCA">LCA</SelectItem>
                  <SelectItem value="Manufacturer Inventory">Manufacturer Inventory</SelectItem>
                  <SelectItem value="REACH Optimization">REACH Optimization</SelectItem>
                  <SelectItem value="Health Product Declaration">Health Product Declaration</SelectItem>
                  <SelectItem value="C2C">C2C</SelectItem>
                  <SelectItem value="Declare">Declare</SelectItem>
                  <SelectItem value="Product Circularity">Product Circularity</SelectItem>
                  <SelectItem value="Global Green Tag Product Health Declaration">Global Green Tag Product Health Declaration</SelectItem>
                  <SelectItem value="FSC / PEFC">FSC / PEFC</SelectItem>
                  <SelectItem value="ECOLABEL">ECOLABEL</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="version">Versão</Label>
              <Input
                type="text"
                id="version"
                className="bg-[#323232] border-[#424242] text-white"
                value={formData.version}
                onChange={(e) => handleInputChange('version', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="issueDate">Data de Emissão</Label>
              <Input
                type="date"
                id="issueDate"
                className="bg-[#323232] border-[#424242] text-white"
                value={formData.issueDate}
                onChange={(e) => handleInputChange('issueDate', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="validTo">Válido Até</Label>
              <Input
                type="date"
                id="validTo"
                className="bg-[#323232] border-[#424242] text-white"
                value={formData.validTo}
                onChange={(e) => handleInputChange('validTo', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="geographicArea">Área Geográfica</Label>
              <Input
                type="text"
                id="geographicArea"
                className="bg-[#323232] border-[#424242] text-white"
                value={formData.geographicArea}
                onChange={(e) => handleInputChange('geographicArea', e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="conformity">Conformidade (%)</Label>
            <Input
              type="number"
              id="conformity"
              className="bg-[#323232] border-[#424242] text-white"
              value={formData.conformity}
              onChange={(e) => handleInputChange('conformity', parseInt(e.target.value) || 0)}
            />
          </div>

          {renderSpecificFields()}

          <div>
            <Label htmlFor="fileUpload">
              Arquivo de Avaliação
              {formData.fileName && (
                <div className="flex items-center mt-2">
                  <span className="mr-2">{formData.fileName}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, fileName: '' }));
                      setSelectedFile(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </Label>
            <Input
              type="file"
              id="fileUpload"
              className="bg-[#323232] border-[#424242] text-white file:bg-[#525252] file:text-white file:border-0"
              onChange={handleFileSelect}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-[#424242]">
            <Button type="button" variant="outline" onClick={onClose} className="border-[#525252] text-white hover:bg-[#424242]">
              Cancelar
            </Button>
            <Button type="submit" className="bg-[#358C48] hover:bg-[#4ea045]">
              {evaluation ? 'Salvar Avaliação' : 'Adicionar Avaliação'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
