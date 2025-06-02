import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

interface EvaluationFormProps {
  evaluation?: Evaluation | null;
  onClose: () => void;
  onSave: (evaluationData: any) => void;
}

export function EvaluationForm({ evaluation, onClose, onSave }: EvaluationFormProps) {
  const [notes, setNotes] = useState(evaluation?.notes || '');

  const handleInputChange = (field: string, value: any) => {
    const updatedEvaluation = { ...evaluation, [field]: value };
    
    // Auto-calculate conformity when boolean fields change
    if (typeof value === 'boolean') {
      updatedEvaluation.conformity = calculateConformity(updatedEvaluation);
    }
    
    onSave(updatedEvaluation);
  };

  const calculateConformity = (evaluationData: any) => {
    if (!evaluationData.type) return 0;

    let totalFields = 0;
    let checkedFields = 0;

    // Get the fields that count for conformity calculation based on evaluation type
    const fieldsToCount = getFieldsForConformityCalculation(evaluationData);
    
    fieldsToCount.forEach(field => {
      if (evaluationData[field] !== undefined && !isFieldDisabled(field, evaluationData)) {
        totalFields++;
        if (evaluationData[field] === true) {
          checkedFields++;
        }
      }
    });

    if (totalFields === 0) return 100;
    return Math.floor((checkedFields / totalFields) * 100);
  };

  const getFieldsForConformityCalculation = (evaluationData: any) => {
    const baseFields = [];
    
    switch (evaluationData.type) {
      case 'EPD':
        return [
          'documentId', 'epdOwner', 'programOperator', 'referencePcr', 
          'manufacturerRecognized', 'includeFunctionalUnit', 'manufacturingLocations', 
          'minimumCradleToGate', 'allSixImpactCategories', 'lcaVerificationIso14044', 
          'personConductingLca', 'lcaSoftware', 'iso21930Compliance', 
          'epdVerificationIso14025', 'externalIndependentReviewer'
        ];
        
      case 'LCA':
        return [
          'milestonesForImprovements', 'narrativeActions', 'targetImpactAreas', 
          'companyExecutiveSignature', 'summaryLargestImpacts', 'sameOptimizationPcr', 
          'optimizationLcaVerification', 'personConductingOptimizationLca',
          'optimizationLcaSoftware', 'comparativeAnalysis', 'narrativeReductions', 
          'reductionGwp10', 'reductionGwp20', 'reductionAdditional2Categories'
        ];
        
      case 'Manufacturer Inventory':
        return [
          'documentId', 'inventoryAssessed1000ppm', 'inventoryAssessed100ppm',
          'allIngredientsName', 'allIngredientsCasrn', 'ingredientRoleAmount',
          'hazardScoreClass', 'noLt1Hazards', 'greenScreen95wt', 'remaining5Percent',
          'externalReviewer'
        ];

      case 'REACH Optimization':
        return [
          'documentId', 'inventoryAssessed100ppm', 'noAnnexXiv', 'noAnnexXvii',
          'noSvhcList', 'authorIdentification'
        ];

      case 'Health Product Declaration':
        return [
          'documentId', 'inventoryAssessed1000ppm', 'inventoryAssessed100ppm',
          'hazardsFullDisclosed', 'noLt1Hazards', 'greenScreen95wt', 'remaining5Percent',
          'externalReviewer'
        ];

      case 'C2C':
        return ['documentId', 'inventoryAssessed'];

      case 'Declare':
        return ['documentId', 'inventoryAssessed1000ppm', 'externalReviewer'];
        
      default:
        return baseFields;
    }
  };

  const isFieldDisabled = (fieldName: string, evaluationData: any) => {
    if (!evaluationData.type) return true;
    
    switch (evaluationData.type) {
      case 'EPD':
        if (evaluationData.epdType === 'Product specific LCA') {
          return ['programOperator', 'iso21930Compliance', 'epdVerificationIso14025', 'externalIndependentReviewer'].includes(fieldName);
        }
        if (evaluationData.epdType === 'Product-specific Type III Internal EPD') {
          return ['externalIndependentReviewer'].includes(fieldName);
        }
        if (evaluationData.epdType !== 'Industry-wide/generic EPD') {
          return ['manufacturerRecognized'].includes(fieldName);
        }
        break;
        
      case 'LCA':
        if (evaluationData.lcaOptimizationType === 'LCA impact reduction action plan') {
          return ['sameOptimizationPcr', 'optimizationLcaVerification', 'personConductingOptimizationLca',
                  'optimizationLcaSoftware', 'comparativeAnalysis', 'narrativeReductions', 
                  'reductionGwp10', 'reductionGwp20', 'reductionAdditional2Categories'].includes(fieldName);
        }
        if (evaluationData.lcaOptimizationType !== 'LCA impact reduction action plan') {
          return ['milestonesForImprovements', 'narrativeActions', 'targetImpactAreas',
                  'companyExecutiveSignature', 'summaryLargestImpacts'].includes(fieldName);
        }
        if (evaluationData.lcaOptimizationType !== 'Verified impact reductions in GWP' && 
            evaluationData.lcaOptimizationType !== 'Verified impact reduction in GWP > 10%' &&
            evaluationData.lcaOptimizationType !== 'Verified impact reduction in GWP > 20% + in two other > 5%') {
          return ['reductionGwp10'].includes(fieldName);
        }
        if (evaluationData.lcaOptimizationType !== 'Verified impact reduction in GWP > 20% + in two other > 5%') {
          return ['reductionGwp20', 'reductionAdditional2Categories'].includes(fieldName);
        }
        break;

      case 'Manufacturer Inventory':
        if (['Self-declared manufacturer Inventory', 'Verified manufacturer Inventory'].includes(evaluationData.manufacturerInventoryType)) {
          if (['inventoryAssessed100ppm', 'noLt1Hazards', 'greenScreen95wt', 'remaining5Percent'].includes(fieldName)) return true;
        }
        if (['Verified advanced manufacturer Inventory', 'Verified ingredient optimized manufacturer Inventory'].includes(evaluationData.manufacturerInventoryType)) {
          if (['inventoryAssessed1000ppm'].includes(fieldName)) return true;
        }
        if (evaluationData.manufacturerInventoryType === 'Verified advanced manufacturer Inventory') {
          if (['greenScreen95wt', 'remaining5Percent'].includes(fieldName)) return true;
        }
        if (evaluationData.manufacturerInventoryType !== 'Verified ingredient optimized manufacturer Inventory') {
          if (['greenScreen95wt', 'remaining5Percent'].includes(fieldName)) return true;
        }
        if (evaluationData.manufacturerInventoryType === 'Self-declared manufacturer Inventory') {
          return ['externalReviewer'].includes(fieldName);
        }
        break;

      case 'REACH Optimization':
        if (evaluationData.reportType === "Manufacturer's report") {
          return ['authorIdentification'].includes(fieldName);
        }
        break;

      case 'Health Product Declaration':
        if (['Published HPD', 'Verified HPD'].includes(evaluationData.hpdType)) {
          if (['inventoryAssessed100ppm', 'noLt1Hazards', 'greenScreen95wt', 'remaining5Percent'].includes(fieldName)) return true;
        }
        if (['Verified advanced HPD', 'Verified ingredient optimized HPD'].includes(evaluationData.hpdType)) {
          if (['inventoryAssessed1000ppm'].includes(fieldName)) return true;
        }
        if (evaluationData.hpdType === 'Verified advanced HPD') {
          if (['greenScreen95wt', 'remaining5Percent'].includes(fieldName)) return true;
        }
        if (evaluationData.hpdType !== 'Verified ingredient optimized HPD') {
          if (['greenScreen95wt', 'remaining5Percent'].includes(fieldName)) return true;
        }
        if (evaluationData.hpdType === 'Published HPD') {
          return ['externalReviewer'].includes(fieldName);
        }
        break;

      case 'Declare':
        if (!['Verified Declared', 'Verified LBC Compliant', 'Verified Red List Free'].includes(evaluation.declareType)) {
          return ['externalReviewer'].includes(fieldName);
        }
        break;
    }
    
    return false;
  };

  const renderCommonFields = () => (
    <>
      <div>
        <Label className="text-white">Version</Label>
        <Input
          value={evaluation.version || ''}
          onChange={(e) => handleInputChange('version', e.target.value)}
          className="bg-[#323232] border-[#424242] text-white"
        />
      </div>

      <div>
        <Label className="text-white">Geographic Area</Label>
        <Select value={evaluation.geographicArea || 'Global'} onValueChange={(value) => handleInputChange('geographicArea', value)}>
          <SelectTrigger className="bg-[#323232] border-[#424242] text-white">
            <SelectValue placeholder="Select geographic area" />
          </SelectTrigger>
          <SelectContent className="bg-[#323232] border-[#424242]">
            <SelectItem value="Global">Global</SelectItem>
            <SelectItem value="Europe">Europe</SelectItem>
            <SelectItem value="North America">North America</SelectItem>
            <SelectItem value="Asia">Asia</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-white">Content Conformity (%)</Label>
        <Input
          type="number"
          value={evaluation.conformity || 0}
          onChange={(e) => handleInputChange('conformity', parseInt(e.target.value) || 0)}
          className="bg-[#323232] border-[#424242] text-white"
          min="0"
          max="100"
          readOnly
        />
      </div>

      <div>
        <Label className="text-white">Issue Date</Label>
        <Input
          type="date"
          value={evaluation.issueDate || ''}
          onChange={(e) => handleInputChange('issueDate', e.target.value)}
          className="bg-[#323232] border-[#424242] text-white"
        />
      </div>

      <div>
        <Label className="text-white">Valid To</Label>
        <Input
          type="date"
          value={evaluation.validTo || ''}
          onChange={(e) => handleInputChange('validTo', e.target.value)}
          className="bg-[#323232] border-[#424242] text-white"
        />
      </div>

      <div>
        <Label className="text-white">Notes</Label>
        <Textarea
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            handleInputChange('notes', e.target.value);
          }}
          className="bg-[#323232] border-[#424242] text-white"
          placeholder="Add notes about this evaluation..."
          rows={3}
        />
      </div>
    </>
  );

  const renderEPDForm = () => (
    <div className="space-y-4">
      <div>
        <Label className="text-white">EPD Type</Label>
        <Select value={evaluation.epdType || ''} onValueChange={(value) => handleInputChange('epdType', value)}>
          <SelectTrigger className="bg-[#323232] border-[#424242] text-white">
            <SelectValue placeholder="Select EPD type" />
          </SelectTrigger>
          <SelectContent className="bg-[#323232] border-[#424242]">
            <SelectItem value="Not compliant">Not compliant</SelectItem>
            <SelectItem value="Product specific LCA">Product specific LCA</SelectItem>
            <SelectItem value="Industry-wide/generic EPD">Industry-wide/generic EPD</SelectItem>
            <SelectItem value="Product-specific Type III Internal EPD">Product-specific Type III Internal EPD</SelectItem>
            <SelectItem value="Product Specific Type III External EPD">Product Specific Type III External EPD</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {renderCommonFields()}

      {/* Boolean fields */}
      {[
        { key: 'documentId', label: 'Document ID' },
        { key: 'epdOwner', label: 'EPD owner' },
        { key: 'programOperator', label: 'Program operator' },
        { key: 'referencePcr', label: 'Reference PCR' },
        { key: 'manufacturerRecognized', label: 'Manufacturer recognized as participant' },
        { key: 'includeFunctionalUnit', label: 'Include functional unit' },
        { key: 'manufacturingLocations', label: 'Manufacturing location(s) indicated' },
        { key: 'minimumCradleToGate', label: 'Minimum cradle to gate scope' },
        { key: 'allSixImpactCategories', label: 'All 6 impact categories listed' },
        { key: 'lcaVerificationIso14044', label: 'LCA verification according to ISO 14044' },
        { key: 'personConductingLca', label: 'Identification of the person conducting the LCA' },
        { key: 'lcaSoftware', label: 'LCA software used' },
        { key: 'iso21930Compliance', label: 'ISO 21930 or EN 15804 compliance' },
        { key: 'epdVerificationIso14025', label: 'EPD verification according to ISO 14025' },
        { key: 'externalIndependentReviewer', label: 'Identification of the external independent reviewer' }
      ].map(field => (
        <div key={field.key} className="flex items-center space-x-2">
          <Checkbox
            checked={evaluation[field.key] === true}
            onCheckedChange={(checked) => handleInputChange(field.key, checked === true)}
            disabled={isFieldDisabled(field.key, evaluation)}
          />
          <Label className={`text-white ${isFieldDisabled(field.key, evaluation) ? 'opacity-50' : ''}`}>{field.label}</Label>
        </div>
      ))}

      <div>
        <Label className="text-white">EPD File</Label>
        <Input
          type="file"
          accept=".pdf,.docx,.doc"
          onChange={(e) => handleInputChange('epdFile', e.target.files?.[0]?.name || '')}
          className="bg-[#323232] border-[#424242] text-white"
        />
      </div>
    </div>
  );

  const renderLCAForm = () => (
    <div className="space-y-4">
      <div>
        <Label className="text-white">LCA Optimization Type</Label>
        <Select value={evaluation.lcaOptimizationType || ''} onValueChange={(value) => handleInputChange('lcaOptimizationType', value)}>
          <SelectTrigger className="bg-[#323232] border-[#424242] text-white">
            <SelectValue placeholder="Select LCA type" />
          </SelectTrigger>
          <SelectContent className="bg-[#323232] border-[#424242]">
            <SelectItem value="Not compliant">Not compliant</SelectItem>
            <SelectItem value="LCA impact reduction action plan">LCA impact reduction action plan</SelectItem>
            <SelectItem value="Verified impact reductions in GWP">Verified impact reductions in GWP</SelectItem>
            <SelectItem value="Verified impact reduction in GWP > 10%">Verified impact reduction in GWP {'>'} 10%</SelectItem>
            <SelectItem value="Verified impact reduction in GWP > 20% + in two other > 5%">Verified impact reduction in GWP {'>'} 20% + in two other {'>'} 5%</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {renderCommonFields()}

      {/* Boolean fields */}
      {[
        { key: 'milestonesForImprovements', label: 'Milestones for improvements with timeline (not more than 4 years)' },
        { key: 'narrativeActions', label: 'Narrative with actions to be pursued including GWP addressed' },
        { key: 'targetImpactAreas', label: 'Description of target impact areas' },
        { key: 'companyExecutiveSignature', label: 'Signature of company executive' },
        { key: 'summaryLargestImpacts', label: 'Table/Summary of largest life cycle impacts' },
        { key: 'sameOptimizationPcr', label: 'Same optimization PCR as reference PCR' },
        { key: 'optimizationLcaVerification', label: 'Optimization LCA verification according to ISO 14044' },
        { key: 'personConductingOptimizationLca', label: 'Identification of the person conducting the optimization LCA' },
        { key: 'optimizationLcaSoftware', label: 'Optimization LCA software used' },
        { key: 'comparativeAnalysis', label: 'Comparative analysis showing impact reduction in GWP' },
        { key: 'narrativeReductions', label: 'Narrative describing how reductions in impacts were achieved' },
        { key: 'reductionGwp10', label: 'Reduction in GWP against the baseline 10%' },
        { key: 'reductionGwp20', label: 'Reduction in GWP against the baseline 20%' },
        { key: 'reductionAdditional2Categories', label: 'Reduction in additional 2 impact categories against the baseline >5%' }
      ].map(field => (
        <div key={field.key} className="flex items-center space-x-2">
          <Checkbox
            checked={evaluation[field.key] === true}
            onCheckedChange={(checked) => handleInputChange(field.key, checked === true)}
            disabled={isFieldDisabled(field.key, evaluation)}
          />
          <Label className={`text-white ${isFieldDisabled(field.key, evaluation) ? 'opacity-50' : ''}`}>{field.label}</Label>
        </div>
      ))}

      <div>
        <Label className="text-white">LCA File</Label>
        <Input
          type="file"
          accept=".pdf,.docx,.doc"
          onChange={(e) => handleInputChange('lcaFile', e.target.files?.[0]?.name || '')}
          className="bg-[#323232] border-[#424242] text-white"
        />
      </div>
    </div>
  );

  const renderManufacturerInventoryForm = () => (
    <div className="space-y-4">
      <div>
        <Label className="text-white">Manufacturer Inventory Type</Label>
        <Select value={evaluation.manufacturerInventoryType || ''} onValueChange={(value) => handleInputChange('manufacturerInventoryType', value)}>
          <SelectTrigger className="bg-[#323232] border-[#424242] text-white">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent className="bg-[#323232] border-[#424242]">
            <SelectItem value="Not compliant">Not compliant</SelectItem>
            <SelectItem value="Self-declared manufacturer Inventory">Self-declared manufacturer Inventory</SelectItem>
            <SelectItem value="Verified manufacturer Inventory">Verified manufacturer Inventory</SelectItem>
            <SelectItem value="Verified advanced manufacturer Inventory">Verified advanced manufacturer Inventory</SelectItem>
            <SelectItem value="Verified ingredient optimized manufacturer Inventory">Verified ingredient optimized manufacturer Inventory</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {renderCommonFields()}

      {[
        { key: 'documentId', label: 'Document ID' },
        { key: 'inventoryAssessed1000ppm', label: 'Inventory assessed at 0,1 wt.% or 1000ppm' },
        { key: 'inventoryAssessed100ppm', label: 'Inventory assessed at 0,1 wt.% or 100ppm' },
        { key: 'allIngredientsName', label: 'All ingredients identified by name' },
        { key: 'allIngredientsCasrn', label: 'All ingredients identified by CASRN or EC Number' },
        { key: 'ingredientRoleAmount', label: 'Ingredient / chemical role and amount disclosed' },
        { key: 'hazardScoreClass', label: 'Hazard score / class disclosed' },
        { key: 'noLt1Hazards', label: 'No GreenScreen LT-1 hazards are present' },
        { key: 'greenScreen95wt', label: '>95wt.% is assessed using GreenScreen and no BM-1 hazards are present' },
        { key: 'remaining5Percent', label: 'Remaining 5% is inventoried and no GreenScreen LT-1 hazards are present' },
        { key: 'externalReviewer', label: 'Identification of the external independent reviewer' }
      ].map(field => (
        <div key={field.key} className="flex items-center space-x-2">
          <Checkbox
            checked={evaluation[field.key] === true}
            onCheckedChange={(checked) => handleInputChange(field.key, checked === true)}
            disabled={isFieldDisabled(field.key, evaluation)}
          />
          <Label className={`text-white ${isFieldDisabled(field.key, evaluation) ? 'opacity-50' : ''}`}>{field.label}</Label>
        </div>
      ))}

      <div>
        <Label className="text-white">MI File</Label>
        <Input
          type="file"
          accept=".pdf,.docx,.doc"
          onChange={(e) => handleInputChange('miFile', e.target.files?.[0]?.name || '')}
          className="bg-[#323232] border-[#424242] text-white"
        />
      </div>
    </div>
  );

  const renderREACHForm = () => (
    <div className="space-y-4">
      <div>
        <Label className="text-white">Report Type</Label>
        <Select value={evaluation.reportType || ''} onValueChange={(value) => handleInputChange('reportType', value)}>
          <SelectTrigger className="bg-[#323232] border-[#424242] text-white">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent className="bg-[#323232] border-[#424242]">
            <SelectItem value="Not compliant">Not compliant</SelectItem>
            <SelectItem value="Manufacturer's report">Manufacturer's report</SelectItem>
            <SelectItem value="Other report">Other report</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {renderCommonFields()}

      {[
        { key: 'documentId', label: 'Document ID' },
        { key: 'inventoryAssessed100ppm', label: 'Inventory assessed at 0,01 wt.% or 100ppm' },
        { key: 'noAnnexXiv', label: 'No substances found on the Authorization list - Annex XIV' },
        { key: 'noAnnexXvii', label: 'No substances found on the Authorization list - Annex XVII' },
        { key: 'noSvhcList', label: 'No substances found on the SVHC candidate list' },
        { key: 'authorIdentification', label: 'Identification of the author of the report' }
      ].map(field => (
        <div key={field.key} className="flex items-center space-x-2">
          <Checkbox
            checked={evaluation[field.key] === true}
            onCheckedChange={(checked) => handleInputChange(field.key, checked === true)}
            disabled={isFieldDisabled(field.key, evaluation)}
          />
          <Label className={`text-white ${isFieldDisabled(field.key, evaluation) ? 'opacity-50' : ''}`}>{field.label}</Label>
        </div>
      ))}

      <div>
        <Label className="text-white">REACH File</Label>
        <Input
          type="file"
          accept=".pdf,.docx,.doc"
          onChange={(e) => handleInputChange('reachFile', e.target.files?.[0]?.name || '')}
          className="bg-[#323232] border-[#424242] text-white"
        />
      </div>
    </div>
  );

  const renderHPDForm = () => (
    <div className="space-y-4">
      <div>
        <Label className="text-white">HPD Type</Label>
        <Select value={evaluation.hpdType || ''} onValueChange={(value) => handleInputChange('hpdType', value)}>
          <SelectTrigger className="bg-[#323232] border-[#424242] text-white">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent className="bg-[#323232] border-[#424242]">
            <SelectItem value="Not compliant">Not compliant</SelectItem>
            <SelectItem value="Published HPD">Published HPD</SelectItem>
            <SelectItem value="Verified HPD">Verified HPD</SelectItem>
            <SelectItem value="Verified advanced HPD">Verified advanced HPD</SelectItem>
            <SelectItem value="Verified ingredient optimized HPD">Verified ingredient optimized HPD</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {renderCommonFields()}

      {[
        { key: 'documentId', label: 'Document ID' },
        { key: 'inventoryAssessed1000ppm', label: 'Inventory assessed at 0,01 wt.% or 1000ppm' },
        { key: 'inventoryAssessed100ppm', label: 'Inventory assessed at 0,01 wt.% or 100ppm' },
        { key: 'hazardsFullDisclosed', label: 'Hazards full disclosed in compliance with the HPD Open Standard' },
        { key: 'noLt1Hazards', label: 'No GreenScreen LT-1 hazards are present' },
        { key: 'greenScreen95wt', label: '>95wt.% is assessed using GreenScreen and no BM-1 hazards are present' },
        { key: 'remaining5Percent', label: 'Remaining 5% is inventoried and no GreenScreen LT-1 hazards are present' },
        { key: 'externalReviewer', label: 'Identification of external independent reviewer' }
      ].map(field => (
        <div key={field.key} className="flex items-center space-x-2">
          <Checkbox
            checked={evaluation[field.key] === true}
            onCheckedChange={(checked) => handleInputChange(field.key, checked === true)}
            disabled={isFieldDisabled(field.key, evaluation)}
          />
          <Label className={`text-white ${isFieldDisabled(field.key, evaluation) ? 'opacity-50' : ''}`}>{field.label}</Label>
        </div>
      ))}

      <div>
        <Label className="text-white">HPD File</Label>
        <Input
          type="file"
          accept=".pdf,.docx,.doc"
          onChange={(e) => handleInputChange('hpdFile', e.target.files?.[0]?.name || '')}
          className="bg-[#323232] border-[#424242] text-white"
        />
      </div>
    </div>
  );

  const renderC2CForm = () => (
    <div className="space-y-4">
      <div>
        <Label className="text-white">C2C Type</Label>
        <Select value={evaluation.c2cType || ''} onValueChange={(value) => handleInputChange('c2cType', value)}>
          <SelectTrigger className="bg-[#323232] border-[#424242] text-white">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent className="bg-[#323232] border-[#424242]">
            <SelectItem value="Not compliant">Not compliant</SelectItem>
            <SelectItem value="Material Health Certificate v3 at the Bronze level">Material Health Certificate v3 at the Bronze level</SelectItem>
            <SelectItem value="C2C Certified v3 with Material Health at Bronze level">C2C Certified v3 with Material Health at Bronze level</SelectItem>
            <SelectItem value="Material Health Certificate v3 at Silver level">Material Health Certificate v3 at Silver level</SelectItem>
            <SelectItem value="C2C Certified v3 with Material Health at Silver level">C2C Certified v3 with Material Health at Silver level</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {renderCommonFields()}

      <div>
        <Label className="text-white">Clean Air and Climate Protection</Label>
        <Select value={evaluation.cleanAirClimateProtection || ''} onValueChange={(value) => handleInputChange('cleanAirClimateProtection', value)}>
          <SelectTrigger className="bg-[#323232] border-[#424242] text-white">
            <SelectValue placeholder="Select level" />
          </SelectTrigger>
          <SelectContent className="bg-[#323232] border-[#424242]">
            <SelectItem value="Level 1">Level 1</SelectItem>
            <SelectItem value="Level 2">Level 2</SelectItem>
            <SelectItem value="Level 3">Level 3</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-white">Water and Soil Stewardship</Label>
        <Select value={evaluation.waterSoilStewardship || ''} onValueChange={(value) => handleInputChange('waterSoilStewardship', value)}>
          <SelectTrigger className="bg-[#323232] border-[#424242] text-white">
            <SelectValue placeholder="Select level" />
          </SelectTrigger>
          <SelectContent className="bg-[#323232] border-[#424242]">
            <SelectItem value="Level 1">Level 1</SelectItem>
            <SelectItem value="Level 2">Level 2</SelectItem>
            <SelectItem value="Level 3">Level 3</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-white">Social Fearness</Label>
        <Select value={evaluation.socialFearness || ''} onValueChange={(value) => handleInputChange('socialFearness', value)}>
          <SelectTrigger className="bg-[#323232] border-[#424242] text-white">
            <SelectValue placeholder="Select level" />
          </SelectTrigger>
          <SelectContent className="bg-[#323232] border-[#424242]">
            <SelectItem value="Level 1">Level 1</SelectItem>
            <SelectItem value="Level 2">Level 2</SelectItem>
            <SelectItem value="Level 3">Level 3</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-white">Product Circularity</Label>
        <Select value={evaluation.productCircularity || ''} onValueChange={(value) => handleInputChange('productCircularity', value)}>
          <SelectTrigger className="bg-[#323232] border-[#424242] text-white">
            <SelectValue placeholder="Select level" />
          </SelectTrigger>
          <SelectContent className="bg-[#323232] border-[#424242]">
            <SelectItem value="Level 1">Level 1</SelectItem>
            <SelectItem value="Level 2">Level 2</SelectItem>
            <SelectItem value="Level 3">Level 3</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-white">Additional Achievement</Label>
        <Textarea
          value={evaluation.additionalAchievement || ''}
          onChange={(e) => handleInputChange('additionalAchievement', e.target.value)}
          className="bg-[#323232] border-[#424242] text-white"
          placeholder="Describe additional achievements..."
          rows={3}
        />
      </div>

      {[
        { key: 'documentId', label: 'Document ID' },
        { key: 'inventoryAssessed', label: 'Inventory assessed at 0,1wt.% or 1000ppm' }
      ].map(field => (
        <div key={field.key} className="flex items-center space-x-2">
          <Checkbox
            checked={evaluation[field.key] === true}
            onCheckedChange={(checked) => handleInputChange(field.key, checked === true)}
          />
          <Label className="text-white">{field.label}</Label>
        </div>
      ))}

      <div>
        <Label className="text-white">C2C File</Label>
        <Input
          type="file"
          accept=".pdf,.docx,.doc"
          onChange={(e) => handleInputChange('c2cFile', e.target.files?.[0]?.name || '')}
          className="bg-[#323232] border-[#424242] text-white"
        />
      </div>
    </div>
  );

  const renderDeclareForm = () => (
    <div className="space-y-4">
      <div>
        <Label className="text-white">Declare Type</Label>
        <Select value={evaluation.declareType || ''} onValueChange={(value) => handleInputChange('declareType', value)}>
          <SelectTrigger className="bg-[#323232] border-[#424242] text-white">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent className="bg-[#323232] border-[#424242]">
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

      {renderCommonFields()}

      {[
        { key: 'documentId', label: 'Document ID' },
        { key: 'inventoryAssessed1000ppm', label: 'Inventory assessed at 0,1wt.% or 1000ppm' },
        { key: 'externalReviewer', label: 'Identification of the external independent reviewer' }
      ].map(field => (
        <div key={field.key} className="flex items-center space-x-2">
          <Checkbox
            checked={evaluation[field.key] === true}
            onCheckedChange={(checked) => handleInputChange(field.key, checked === true)}
            disabled={isFieldDisabled(field.key, evaluation)}
          />
          <Label className={`text-white ${isFieldDisabled(field.key, evaluation) ? 'opacity-50' : ''}`}>{field.label}</Label>
        </div>
      ))}

      <div>
        <Label className="text-white">Declare File</Label>
        <Input
          type="file"
          accept=".pdf,.docx,.doc"
          onChange={(e) => handleInputChange('declareFile', e.target.files?.[0]?.name || '')}
          className="bg-[#323232] border-[#424242] text-white"
        />
      </div>
    </div>
  );

  const renderProductCircularityForm = () => (
    <div className="space-y-4">
      {renderCommonFields()}

      <div>
        <Label className="text-white">Reused or Salvage</Label>
        <Textarea
          value={evaluation.reusedOrSalvage || ''}
          onChange={(e) => handleInputChange('reusedOrSalvage', e.target.value)}
          className="bg-[#323232] border-[#424242] text-white"
          placeholder="Describe reused or salvage content..."
          rows={3}
        />
      </div>

      <div>
        <Label className="text-white">Biobased and Recycled Content (%)</Label>
        <Textarea
          value={evaluation.biobasedRecycledContent || ''}
          onChange={(e) => handleInputChange('biobasedRecycledContent', e.target.value)}
          className="bg-[#323232] border-[#424242] text-white"
          placeholder="Describe biobased and recycled content..."
          rows={3}
        />
      </div>

      <div>
        <Label className="text-white">Extended Producer Responsibility Program</Label>
        <Textarea
          value={evaluation.extendedProducerResponsability || ''}
          onChange={(e) => handleInputChange('extendedProducerResponsability', e.target.value)}
          className="bg-[#323232] border-[#424242] text-white"
          placeholder="Describe EPR program..."
          rows={3}
        />
      </div>

      <div>
        <Label className="text-white">Product Circularity File</Label>
        <Input
          type="file"
          accept=".pdf,.docx,.doc"
          onChange={(e) => handleInputChange('productCircularityFile', e.target.files?.[0]?.name || '')}
          className="bg-[#323232] border-[#424242] text-white"
        />
      </div>
    </div>
  );

  const renderGenericForm = () => (
    <div className="space-y-4">
      {renderCommonFields()}

      <div>
        <Label className="text-white">File Upload</Label>
        <Input
          type="file"
          accept=".pdf,.docx,.doc"
          onChange={(e) => handleInputChange('file', e.target.files?.[0]?.name || '')}
          className="bg-[#323232] border-[#424242] text-white"
        />
      </div>
    </div>
  );

  if (!evaluation.type) {
    return <div className="text-center text-gray-400 py-8">Select an evaluation type to configure</div>;
  }

  return (
    <div className="space-y-6">
      {evaluation.type === 'EPD' && renderEPDForm()}
      {evaluation.type === 'LCA' && renderLCAForm()}
      {evaluation.type === 'Manufacturer Inventory' && renderManufacturerInventoryForm()}
      {evaluation.type === 'REACH Optimization' && renderREACHForm()}
      {evaluation.type === 'Health Product Declaration' && renderHPDForm()}
      {evaluation.type === 'C2C' && renderC2CForm()}
      {evaluation.type === 'Declare' && renderDeclareForm()}
      {evaluation.type === 'Product Circularity' && renderProductCircularityForm()}
      {['Global Green Tag Product Health Declaration', 'FSC / PEFC', 'ECOLABEL'].includes(evaluation.type) && renderGenericForm()}
    </div>
  );
}
