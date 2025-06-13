
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
  const [formData, setFormData] = useState<any>({
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
      const initialFields = getInitialEvaluationFields(evaluation.type);
      setFormData({
        ...initialFields,
        ...evaluation,
        conformity: evaluation.conformity || (evaluation.type === 'Global Green Tag Product Health Declaration' || evaluation.type === 'FSC / PEFC' || evaluation.type === 'ECOLABEL' ? 100 : 0),
        geographicArea: evaluation.geographicArea || 'Global',
      });
    }
  }, [evaluation]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));
    
    // If changing type, reset type-specific fields
    if (field === 'type') {
      const newFields = getInitialEvaluationFields(value);
      setFormData((prev: any) => ({
        ...prev,
        ...newFields,
        [field]: value
      }));
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFormData((prev: any) => ({
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

    const validFields = getValidFieldsForSubtype(formData.type, formData);
    
    if (validFields.length === 0) {
      const defaultConformity = formData.type === 'Global Green Tag Product Health Declaration' || 
                               formData.type === 'FSC / PEFC' || 
                               formData.type === 'ECOLABEL' ? 100 : 0;
      setFormData((prev: any) => ({ ...prev, conformity: defaultConformity }));
      return;
    }
    
    let totalPoints = 0;
    let achievedPoints = 0;

    validFields.forEach(field => {
      totalPoints++;
      if (field.startsWith('c2c') && field.includes('Score')) {
        // C2C score fields give 1 point if not "None"
        if (formData[field] && formData[field] !== 'None') {
          achievedPoints++;
        }
      } else if (formData[field] === true) {
        achievedPoints++;
      }
    });
    
    const conformityPercentage = totalPoints > 0 ? Math.round((achievedPoints / totalPoints) * 100) : 0;
    
    setFormData((prev: any) => ({ ...prev, conformity: conformityPercentage }));
  };

  const getBooleanFieldsForType = (type: string) => {
    const fieldMaps: { [key: string]: string[] } = {
      'EPD': ['documentId', 'epdOwner', 'programOperator', 'referencePcr', 'manufacturerRecognized', 'includeFunctionalUnit', 'manufacturingLocations', 'minimumCradleToGate', 'allSixImpactCategories', 'lcaVerificationIso14044', 'personConductingLca', 'lcaSoftware', 'iso21930Compliance', 'epdVerificationIso14025', 'externalIndependentReviewer'],
      'LCA': ['milestonesForImprovements', 'narrativeActions', 'targetImpactAreas', 'companyExecutiveSignature', 'summaryLargestImpacts', 'sameOptimizationPcr', 'optimizationLcaVerification', 'personConductingOptimizationLca', 'optimizationLcaSoftware', 'comparativeAnalysis', 'narrativeReductions', 'reductionGwp10', 'reductionGwp20', 'reductionAdditionalCategories'],
      'Manufacturer Inventory': ['documentId', 'inventoryAssessed1000ppm', 'inventoryAssessed100ppm', 'allIngredientsName', 'allIngredientsCasrn', 'ingredientRoleAmount', 'hazardScoreClass', 'noGreenScreenLt1', 'greenScreen95wt', 'remaining5Inventoried', 'externalIndependentReviewer'],
      'REACH Optimization': ['documentId', 'inventoryAssessed100ppm', 'noAuthorizationListXiv', 'noAuthorizationListXvii', 'noSvhcCandidateList', 'identificationAuthor'],
      'Health Product Declaration': ['documentId', 'inventoryAssessed1000ppm', 'inventoryAssessed100ppm', 'hazardsFullDisclosed', 'noGreenScreenLt1', 'greenScreen95wt', 'remaining5Inventoried', 'externalIndependentReviewer'],
      'C2C': ['documentId', 'inventoryAssessed1000ppm', 'c2cCleanAirScore', 'c2cWaterSoilScore', 'c2cSocialFairnessScore', 'c2cProductCircularityScore'],
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
            return data.manufacturerInventoryType === 'Self-declared manufacturer Inventory' || data.manufacturerInventoryType === 'Verified manufacturer Inventory';
          }
          if (field === 'inventoryAssessed100ppm') {
            return data.manufacturerInventoryType === 'Verified advanced manufacturer Inventory' || data.manufacturerInventoryType === 'Verified ingredient optimized manufacturer Inventory';
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

      case 'REACH Optimization':
        if (data.reportType === 'Not compliant') return [];
        return allFields.filter(field => {
          if (field === 'identificationAuthor') {
            return data.reportType !== "Manufacturer's report";
          }
          return true;
        });

      case 'Health Product Declaration':
        if (data.hpdType === 'Not compliant') return [];
        return allFields.filter(field => {
          if (field === 'inventoryAssessed1000ppm') {
            return data.hpdType === 'Published HPD' || data.hpdType === 'Verified HPD';
          }
          if (field === 'inventoryAssessed100ppm') {
            return data.hpdType === 'Verified advanced HPD' || data.hpdType === 'Verified ingredient optimized HPD';
          }
          if (field === 'noGreenScreenLt1') {
            return data.hpdType === 'Verified advanced HPD';
          }
          if (field === 'greenScreen95wt' || field === 'remaining5Inventoried') {
            return data.hpdType === 'Verified ingredient optimized HPD';
          }
          if (field === 'externalIndependentReviewer') {
            return data.hpdType !== 'Published HPD';
          }
          return true;
        });

      case 'C2C':
        if (data.c2cType === 'Not compliant') return [];
        return allFields;

      case 'Declare':
        if (data.declareType === 'Not compliant') return [];
        return allFields.filter(field => {
          if (field === 'externalIndependentReviewer') {
            return ['Verified Declared', 'Verified LBC Compliant (aka LBC Red List Approved)', 'Verified Red List Free (aka LBC Red List Free)'].includes(data.declareType);
          }
          return true;
        });
        
      default:
        return allFields;
    }
  };

  const getInitialEvaluationFields = (type: string) => {
    const baseFields = {
      geographicArea: 'Global',
      conformity: 0
    };

    switch (type) {
      case 'EPD':
        return {
          ...baseFields,
          epdType: '',
          documentId: false,
          epdOwner: false,
          programOperator: false,
          referencePcr: false,
          manufacturerRecognized: false,
          includeFunctionalUnit: false,
          manufacturingLocations: false,
          minimumCradleToGate: false,
          allSixImpactCategories: false,
          lcaVerificationIso14044: false,
          personConductingLca: false,
          lcaSoftware: false,
          iso21930Compliance: false,
          epdVerificationIso14025: false,
          externalIndependentReviewer: false,
          epdFile: ''
        };
      case 'LCA':
        return {
          ...baseFields,
          lcaOptimizationType: '',
          milestonesForImprovements: false,
          narrativeActions: false,
          targetImpactAreas: false,
          companyExecutiveSignature: false,
          summaryLargestImpacts: false,
          sameOptimizationPcr: false,
          optimizationLcaVerification: false,
          personConductingOptimizationLca: false,
          optimizationLcaSoftware: false,
          comparativeAnalysis: false,
          narrativeReductions: false,
          reductionGwp10: false,
          reductionGwp20: false,
          reductionAdditionalCategories: false,
          lcaFile: ''
        };
      case 'Manufacturer Inventory':
        return {
          ...baseFields,
          manufacturerInventoryType: '',
          documentId: false,
          inventoryAssessed1000ppm: false,
          inventoryAssessed100ppm: false,
          allIngredientsName: false,
          allIngredientsCasrn: false,
          ingredientRoleAmount: false,
          hazardScoreClass: false,
          noGreenScreenLt1: false,
          greenScreen95wt: false,
          remaining5Inventoried: false,
          externalIndependentReviewer: false,
          miFile: ''
        };
      case 'REACH Optimization':
        return {
          ...baseFields,
          reportType: '',
          documentId: false,
          inventoryAssessed100ppm: false,
          noAuthorizationListXiv: false,
          noAuthorizationListXvii: false,
          noSvhcCandidateList: false,
          identificationAuthor: false,
          reachFile: ''
        };
      case 'Health Product Declaration':
        return {
          ...baseFields,
          hpdType: '',
          documentId: false,
          inventoryAssessed1000ppm: false,
          inventoryAssessed100ppm: false,
          hazardsFullDisclosed: false,
          noGreenScreenLt1: false,
          greenScreen95wt: false,
          remaining5Inventoried: false,
          externalIndependentReviewer: false,
          hpdFile: ''
        };
      case 'C2C':
        return {
          ...baseFields,
          c2cType: '',
          c2cCleanAirScore: 'None',
          c2cWaterSoilScore: 'None',
          c2cSocialFairnessScore: 'None',
          c2cProductCircularityScore: 'None',
          c2cAdditionalAchievement: '',
          documentId: false,
          inventoryAssessed1000ppm: false,
          c2cFile: ''
        };
      case 'Declare':
        return {
          ...baseFields,
          declareType: '',
          documentId: false,
          inventoryAssessed1000ppm: false,
          externalIndependentReviewer: false,
          declareFile: ''
        };
      case 'Product Circularity':
        return {
          ...baseFields,
          reusedSalvage: '',
          biobasedRecycledContent: '',
          extendedProducerResponsability: '',
          productCircularityFile: ''
        };
      case 'Global Green Tag Product Health Declaration':
        return {
          ...baseFields,
          conformity: 100,
          ggtphdFile: ''
        };
      case 'FSC / PEFC':
        return {
          ...baseFields,
          conformity: 100,
          fscPefcFile: ''
        };
      case 'ECOLABEL':
        return {
          ...baseFields,
          conformity: 100,
          ecolabelFile: ''
        };
      default:
        return baseFields;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Only calculate conformity if it's 0 or not set for types that have scoring
    if (formData.conformity === 0 && !['Global Green Tag Product Health Declaration', 'FSC / PEFC', 'ECOLABEL'].includes(formData.type)) {
      calculateConformity();
    }
    
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

      case 'Manufacturer Inventory':
        return (
          <>
            <div>
              <Label htmlFor="manufacturerInventoryType">Manufacturer Inventory Type</Label>
              <Select value={formData.manufacturerInventoryType || ''} onValueChange={(value) => handleInputChange('manufacturerInventoryType', value)}>
                <SelectTrigger className="bg-[#323232] border-[#424242] text-white">
                  <SelectValue placeholder="Select Manufacturer Inventory Type" />
                </SelectTrigger>
                <SelectContent className="bg-[#323232] border-[#424242] text-white">
                  <SelectItem value="Not compliant">Not compliant</SelectItem>
                  <SelectItem value="Self-declared manufacturer Inventory">Self-declared manufacturer Inventory</SelectItem>
                  <SelectItem value="Verified manufacturer Inventory">Verified manufacturer Inventory</SelectItem>
                  <SelectItem value="Verified advanced manufacturer Inventory">Verified advanced manufacturer Inventory</SelectItem>
                  <SelectItem value="Verified ingredient optimized manufacturer Inventory">Verified ingredient optimized manufacturer Inventory</SelectItem>
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
              {(formData.manufacturerInventoryType === 'Self-declared manufacturer Inventory' || formData.manufacturerInventoryType === 'Verified manufacturer Inventory') && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="inventoryAssessed1000ppm"
                    checked={formData.inventoryAssessed1000ppm || false}
                    onCheckedChange={(checked) => handleInputChange('inventoryAssessed1000ppm', checked)}
                  />
                  <Label htmlFor="inventoryAssessed1000ppm">Inventory assessed at 0,1 wt.% or 1000ppm</Label>
                </div>
              )}
              {(formData.manufacturerInventoryType === 'Verified advanced manufacturer Inventory' || formData.manufacturerInventoryType === 'Verified ingredient optimized manufacturer Inventory') && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="inventoryAssessed100ppm"
                    checked={formData.inventoryAssessed100ppm || false}
                    onCheckedChange={(checked) => handleInputChange('inventoryAssessed100ppm', checked)}
                  />
                  <Label htmlFor="inventoryAssessed100ppm">Inventory assessed at 0,1 wt.% or 100ppm</Label>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allIngredientsName"
                  checked={formData.allIngredientsName || false}
                  onCheckedChange={(checked) => handleInputChange('allIngredientsName', checked)}
                />
                <Label htmlFor="allIngredientsName">All ingredients identified by name</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allIngredientsCasrn"
                  checked={formData.allIngredientsCasrn || false}
                  onCheckedChange={(checked) => handleInputChange('allIngredientsCasrn', checked)}
                />
                <Label htmlFor="allIngredientsCasrn">All ingredients identified by CASRN or EC Number</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ingredientRoleAmount"
                  checked={formData.ingredientRoleAmount || false}
                  onCheckedChange={(checked) => handleInputChange('ingredientRoleAmount', checked)}
                />
                <Label htmlFor="ingredientRoleAmount">Ingredient / chemical role and amount disclosed</Label>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hazardScoreClass"
                  checked={formData.hazardScoreClass || false}
                  onCheckedChange={(checked) => handleInputChange('hazardScoreClass', checked)}
                />
                <Label htmlFor="hazardScoreClass">Hazard score / class disclosed</Label>
              </div>
              {formData.manufacturerInventoryType === 'Verified advanced manufacturer Inventory' && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="noGreenScreenLt1"
                    checked={formData.noGreenScreenLt1 || false}
                    onCheckedChange={(checked) => handleInputChange('noGreenScreenLt1', checked)}
                  />
                  <Label htmlFor="noGreenScreenLt1">No GreenScreen LT-1 hazards are present</Label>
                </div>
              )}
              {formData.manufacturerInventoryType === 'Verified ingredient optimized manufacturer Inventory' && (
                <>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="greenScreen95wt"
                      checked={formData.greenScreen95wt || false}
                      onCheckedChange={(checked) => handleInputChange('greenScreen95wt', checked)}
                    />
                    <Label htmlFor="greenScreen95wt">{'>'}95wt.% is assessed using GreenScreen and no BM-1 hazards are present</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remaining5Inventoried"
                      checked={formData.remaining5Inventoried || false}
                      onCheckedChange={(checked) => handleInputChange('remaining5Inventoried', checked)}
                    />
                    <Label htmlFor="remaining5Inventoried">Remaining 5% is inventoried and no GreenScreen LT-1 hazards are present</Label>
                  </div>
                </>
              )}
            </div>
            
            {formData.manufacturerInventoryType !== 'Self-declared manufacturer Inventory' && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="externalIndependentReviewer"
                  checked={formData.externalIndependentReviewer || false}
                  onCheckedChange={(checked) => handleInputChange('externalIndependentReviewer', checked)}
                />
                <Label htmlFor="externalIndependentReviewer">Identification of the external independent reviewer</Label>
              </div>
            )}
          </>
        );

      case 'REACH Optimization':
        return (
          <>
            <div>
              <Label htmlFor="reportType">Report Type</Label>
              <Select value={formData.reportType || ''} onValueChange={(value) => handleInputChange('reportType', value)}>
                <SelectTrigger className="bg-[#323232] border-[#424242] text-white">
                  <SelectValue placeholder="Select Report Type" />
                </SelectTrigger>
                <SelectContent className="bg-[#323232] border-[#424242] text-white">
                  <SelectItem value="Not compliant">Not compliant</SelectItem>
                  <SelectItem value="Manufacturer's report">Manufacturer's report</SelectItem>
                  <SelectItem value="Other report">Other report</SelectItem>
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
                  id="inventoryAssessed100ppm"
                  checked={formData.inventoryAssessed100ppm || false}
                  onCheckedChange={(checked) => handleInputChange('inventoryAssessed100ppm', checked)}
                />
                <Label htmlFor="inventoryAssessed100ppm">Inventory assessed at 0,01 wt.% or 100ppm</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="noAuthorizationListXiv"
                  checked={formData.noAuthorizationListXiv || false}
                  onCheckedChange={(checked) => handleInputChange('noAuthorizationListXiv', checked)}
                />
                <Label htmlFor="noAuthorizationListXiv">No substances found on the Authorization list - Annex XIV</Label>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="noAuthorizationListXvii"
                  checked={formData.noAuthorizationListXvii || false}
                  onCheckedChange={(checked) => handleInputChange('noAuthorizationListXvii', checked)}
                />
                <Label htmlFor="noAuthorizationListXvii">No substances found on the Authorization list - Annex XVII</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="noSvhcCandidateList"
                  checked={formData.noSvhcCandidateList || false}
                  onCheckedChange={(checked) => handleInputChange('noSvhcCandidateList', checked)}
                />
                <Label htmlFor="noSvhcCandidateList">No substances found on the SVHC candidate list</Label>
              </div>
              {formData.reportType !== "Manufacturer's report" && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="identificationAuthor"
                    checked={formData.identificationAuthor || false}
                    onCheckedChange={(checked) => handleInputChange('identificationAuthor', checked)}
                  />
                  <Label htmlFor="identificationAuthor">Identification of the author of the report</Label>
                </div>
              )}
            </div>
          </>
        );

      case 'Health Product Declaration':
        return (
          <>
            <div>
              <Label htmlFor="hpdType">HPD Type</Label>
              <Select value={formData.hpdType || ''} onValueChange={(value) => handleInputChange('hpdType', value)}>
                <SelectTrigger className="bg-[#323232] border-[#424242] text-white">
                  <SelectValue placeholder="Select HPD Type" />
                </SelectTrigger>
                <SelectContent className="bg-[#323232] border-[#424242] text-white">
                  <SelectItem value="Not compliant">Not compliant</SelectItem>
                  <SelectItem value="Published HPD">Published HPD</SelectItem>
                  <SelectItem value="Verified HPD">Verified HPD</SelectItem>
                  <SelectItem value="Verified advanced HPD">Verified advanced HPD</SelectItem>
                  <SelectItem value="Verified ingredient optimized HPD">Verified ingredient optimized HPD</SelectItem>
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
              {(formData.hpdType === 'Published HPD' || formData.hpdType === 'Verified HPD') && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="inventoryAssessed1000ppm"
                    checked={formData.inventoryAssessed1000ppm || false}
                    onCheckedChange={(checked) => handleInputChange('inventoryAssessed1000ppm', checked)}
                  />
                  <Label htmlFor="inventoryAssessed1000ppm">Inventory assessed at 0,01 wt.% or 1000ppm</Label>
                </div>
              )}
              {(formData.hpdType === 'Verified advanced HPD' || formData.hpdType === 'Verified ingredient optimized HPD') && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="inventoryAssessed100ppm"
                    checked={formData.inventoryAssessed100ppm || false}
                    onCheckedChange={(checked) => handleInputChange('inventoryAssessed100ppm', checked)}
                  />
                  <Label htmlFor="inventoryAssessed100ppm">Inventory assessed at 0,01 wt.% or 100ppm</Label>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hazardsFullDisclosed"
                  checked={formData.hazardsFullDisclosed || false}
                  onCheckedChange={(checked) => handleInputChange('hazardsFullDisclosed', checked)}
                />
                <Label htmlFor="hazardsFullDisclosed">Hazards full disclosed in compliance with the HPD Open Standard</Label>
              </div>
              {formData.hpdType === 'Verified advanced HPD' && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="noGreenScreenLt1"
                    checked={formData.noGreenScreenLt1 || false}
                    onCheckedChange={(checked) => handleInputChange('noGreenScreenLt1', checked)}
                  />
                  <Label htmlFor="noGreenScreenLt1">No GreenScreen LT-1 hazards are present</Label>
                </div>
              )}
              {formData.hpdType === 'Verified ingredient optimized HPD' && (
                <>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="greenScreen95wt"
                      checked={formData.greenScreen95wt || false}
                      onCheckedChange={(checked) => handleInputChange('greenScreen95wt', checked)}
                    />
                    <Label htmlFor="greenScreen95wt">{'>'}95wt.% is assessed using GreenScreen and no BM-1 hazards are present</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remaining5Inventoried"
                      checked={formData.remaining5Inventoried || false}
                      onCheckedChange={(checked) => handleInputChange('remaining5Inventoried', checked)}
                    />
                    <Label htmlFor="remaining5Inventoried">Remaining 5% is inventoried and no GreenScreen LT-1 hazards are present</Label>
                  </div>
                </>
              )}
            </div>
            
            {formData.hpdType !== 'Published HPD' && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="externalIndependentReviewer"
                  checked={formData.externalIndependentReviewer || false}
                  onCheckedChange={(checked) => handleInputChange('externalIndependentReviewer', checked)}
                />
                <Label htmlFor="externalIndependentReviewer">Identification of external independent reviewer</Label>
              </div>
            )}
          </>
        );

      case 'C2C':
        return (
          <>
            <div>
              <Label htmlFor="c2cType">C2C Type</Label>
              <Select value={formData.c2cType || ''} onValueChange={(value) => handleInputChange('c2cType', value)}>
                <SelectTrigger className="bg-[#323232] border-[#424242] text-white">
                  <SelectValue placeholder="Select C2C Type" />
                </SelectTrigger>
                <SelectContent className="bg-[#323232] border-[#424242] text-white">
                  <SelectItem value="Not compliant">Not compliant</SelectItem>
                  <SelectItem value="Material Health Certificate v3 at the Bronze level">Material Health Certificate v3 at the Bronze level</SelectItem>
                  <SelectItem value="C2C Certified v3 with Material Health at Bronze level">C2C Certified v3 with Material Health at Bronze level</SelectItem>
                  <SelectItem value="Material Health Certificate v3 at Silver level">Material Health Certificate v3 at Silver level</SelectItem>
                  <SelectItem value="C2C Certified v3 with Material Health at Silver level">C2C Certified v3 with Material Health at Silver level</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="c2cCleanAirScore">Clean Air and Climate Protection</Label>
                <Select value={formData.c2cCleanAirScore || 'None'} onValueChange={(value) => handleInputChange('c2cCleanAirScore', value)}>
                  <SelectTrigger className="bg-[#323232] border-[#424242] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#323232] border-[#424242] text-white">
                    <SelectItem value="None">None</SelectItem>
                    <SelectItem value="Score 1">Score 1</SelectItem>
                    <SelectItem value="Score 2">Score 2</SelectItem>
                    <SelectItem value="Score 3">Score 3</SelectItem>
                    <SelectItem value="Score 4">Score 4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="c2cWaterSoilScore">Water and Soil Stewardship</Label>
                <Select value={formData.c2cWaterSoilScore || 'None'} onValueChange={(value) => handleInputChange('c2cWaterSoilScore', value)}>
                  <SelectTrigger className="bg-[#323232] border-[#424242] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#323232] border-[#424242] text-white">
                    <SelectItem value="None">None</SelectItem>
                    <SelectItem value="Score 1">Score 1</SelectItem>
                    <SelectItem value="Score 2">Score 2</SelectItem>
                    <SelectItem value="Score 3">Score 3</SelectItem>
                    <SelectItem value="Score 4">Score 4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="c2cSocialFairnessScore">Social Fairness</Label>
                <Select value={formData.c2cSocialFairnessScore || 'None'} onValueChange={(value) => handleInputChange('c2cSocialFairnessScore', value)}>
                  <SelectTrigger className="bg-[#323232] border-[#424242] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#323232] border-[#424242] text-white">
                    <SelectItem value="None">None</SelectItem>
                    <SelectItem value="Score 1">Score 1</SelectItem>
                    <SelectItem value="Score 2">Score 2</SelectItem>
                    <SelectItem value="Score 3">Score 3</SelectItem>
                    <SelectItem value="Score 4">Score 4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="c2cProductCircularityScore">Product Circularity</Label>
                <Select value={formData.c2cProductCircularityScore || 'None'} onValueChange={(value) => handleInputChange('c2cProductCircularityScore', value)}>
                  <SelectTrigger className="bg-[#323232] border-[#424242] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#323232] border-[#424242] text-white">
                    <SelectItem value="None">None</SelectItem>
                    <SelectItem value="Score 1">Score 1</SelectItem>
                    <SelectItem value="Score 2">Score 2</SelectItem>
                    <SelectItem value="Score 3">Score 3</SelectItem>
                    <SelectItem value="Score 4">Score 4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="c2cAdditionalAchievement">Additional Achievement</Label>
              <Input
                type="text"
                id="c2cAdditionalAchievement"
                className="bg-[#323232] border-[#424242] text-white"
                value={formData.c2cAdditionalAchievement || ''}
                onChange={(e) => handleInputChange('c2cAdditionalAchievement', e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  id="inventoryAssessed1000ppm"
                  checked={formData.inventoryAssessed1000ppm || false}
                  onCheckedChange={(checked) => handleInputChange('inventoryAssessed1000ppm', checked)}
                />
                <Label htmlFor="inventoryAssessed1000ppm">Inventory assessed at 0,1wt.% or 1000ppm</Label>
              </div>
            </div>
          </>
        );

      case 'Declare':
        return (
          <>
            <div>
              <Label htmlFor="declareType">Declare Type</Label>
              <Select value={formData.declareType || ''} onValueChange={(value) => handleInputChange('declareType', value)}>
                <SelectTrigger className="bg-[#323232] border-[#424242] text-white">
                  <SelectValue placeholder="Select Declare Type" />
                </SelectTrigger>
                <SelectContent className="bg-[#323232] border-[#424242] text-white">
                  <SelectItem value="Not compliant">Not compliant</SelectItem>
                  <SelectItem value="Declared">Declared</SelectItem>
                  <SelectItem value="LBC Compliant (aka LBC Red List Approved)">LBC Compliant (aka LBC Red List Approved)</SelectItem>
                  <SelectItem value="Red List Free (aka LBC Red List Free)">Red List Free (aka LBC Red List Free)</SelectItem>
                  <SelectItem value="Verified Declared">Verified Declared</SelectItem>
                  <SelectItem value="Verified LBC Compliant (aka LBC Red List Approved)">Verified LBC Compliant (aka LBC Red List Approved)</SelectItem>
                  <SelectItem value="Verified Red List Free (aka LBC Red List Free)">Verified Red List Free (aka LBC Red List Free)</SelectItem>
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
                  id="inventoryAssessed1000ppm"
                  checked={formData.inventoryAssessed1000ppm || false}
                  onCheckedChange={(checked) => handleInputChange('inventoryAssessed1000ppm', checked)}
                />
                <Label htmlFor="inventoryAssessed1000ppm">Inventory assessed at 0,1wt.% or 1000ppm</Label>
              </div>
              {['Verified Declared', 'Verified LBC Compliant (aka LBC Red List Approved)', 'Verified Red List Free (aka LBC Red List Free)'].includes(formData.declareType) && (
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

      case 'Product Circularity':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="reusedSalvage">Reused or Salvage</Label>
                <Input
                  type="text"
                  id="reusedSalvage"
                  className="bg-[#323232] border-[#424242] text-white"
                  value={formData.reusedSalvage || ''}
                  onChange={(e) => handleInputChange('reusedSalvage', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="biobasedRecycledContent">Biobased and Recycled Content (%)</Label>
                <Input
                  type="text"
                  id="biobasedRecycledContent"
                  className="bg-[#323232] border-[#424242] text-white"
                  value={formData.biobasedRecycledContent || ''}
                  onChange={(e) => handleInputChange('biobasedRecycledContent', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="extendedProducerResponsability">Extended Producer Responsibility Program</Label>
                <Input
                  type="text"
                  id="extendedProducerResponsability"
                  className="bg-[#323232] border-[#424242] text-white"
                  value={formData.extendedProducerResponsability || ''}
                  onChange={(e) => handleInputChange('extendedProducerResponsability', e.target.value)}
                />
              </div>
            </div>
          </>
        );

      case 'Global Green Tag Product Health Declaration':
      case 'FSC / PEFC':
      case 'ECOLABEL':
        return (
          <div>
            <Label>Esta avaliação tem conformidade automática de 100%</Label>
          </div>
        );
        
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
                      setFormData((prev: any) => ({ ...prev, fileName: '' }));
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
