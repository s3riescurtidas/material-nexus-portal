import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export function EvaluationForm({ evaluation, onChange }) {
  const handleInputChange = (field, value) => {
    const updatedEvaluation = { ...evaluation, [field]: value };
    
    // Auto-calculate conformity when boolean fields change
    if (typeof value === 'boolean') {
      updatedEvaluation.conformity = calculateConformity(updatedEvaluation);
    }
    
    onChange(updatedEvaluation);
  };

  const calculateConformity = (evaluationData) => {
    if (!evaluationData.type) return 0;

    let totalFields = 0;
    let checkedFields = 0;

    // Get the fields that count for conformity calculation based on evaluation type
    const fieldsToCount = getFieldsForConformityCalculation(evaluationData);
    
    fieldsToCount.forEach(field => {
      if (evaluationData[field] !== undefined) {
        totalFields++;
        if (evaluationData[field] === true) {
          checkedFields++;
        }
      }
    });

    if (totalFields === 0) return 0;
    return Math.floor((checkedFields / totalFields) * 100);
  };

  const getFieldsForConformityCalculation = (evaluationData) => {
    const baseFields = ['geographicArea'];
    
    switch (evaluationData.type) {
      case 'EPD':
        const epdFields = [
          'epdType', 'documentId', 'epdOwner', 'referencePcr', 
          'includeFunctionalUnit', 'manufacturingLocations', 'minimumCradleToGate',
          'allSixImpactCategories', 'lcaVerificationIso14044', 'personConductingLca',
          'lcaSoftware'
        ];
        
        // Add conditional fields based on EPD type
        if (evaluationData.epdType !== 'Product specific LCA') {
          epdFields.push('programOperator', 'iso21930Compliance', 'epdVerificationIso14025');
        }
        
        if (evaluationData.epdType === 'Industry-wide/generic EPD') {
          epdFields.push('manufacturerRecognized');
        }
        
        if (evaluationData.epdType !== 'Product specific LCA' && evaluationData.epdType !== 'Product-specific Type III Internal EPD') {
          epdFields.push('externalIndependentReviewer');
        }
        
        return [...baseFields, ...epdFields];
        
      case 'LCA':
        const lcaFields = ['lcaOptimizationType'];
        
        // Add conditional fields based on LCA type
        if (evaluationData.lcaOptimizationType === 'LCA impact reduction action plan') {
          lcaFields.push('milestonesForImprovements', 'narrativeActions', 'targetImpactAreas', 
                         'companyExecutiveSignature', 'summaryLargestImpacts');
        } else if (evaluationData.lcaOptimizationType !== 'LCA impact reduction action plan') {
          lcaFields.push('sameOptimizationPcr', 'optimizationLcaVerification', 
                         'personConductingOptimizationLca', 'optimizationLcaSoftware',
                         'comparativeAnalysis', 'narrativeReductions');
        }
        
        if (evaluationData.lcaOptimizationType === 'Verified impact reductions in GWP') {
          lcaFields.push('reductionGwp10');
        }
        
        if (evaluationData.lcaOptimizationType === 'Verified impact reduction in GWP > 20% + in two other > 5%') {
          lcaFields.push('reductionGwp20', 'reductionAdditional2Categories');
        }
        
        return [...baseFields, ...lcaFields];
        
      default:
        return baseFields;
    }
  };

  const isFieldDisabled = (fieldName) => {
    if (!evaluation.type) return true;
    
    switch (evaluation.type) {
      case 'EPD':
        if (evaluation.epdType === 'Product specific LCA') {
          return ['programOperator', 'iso21930Compliance', 'epdVerificationIso14025', 'externalIndependentReviewer'].includes(fieldName);
        }
        if (evaluation.epdType === 'Product-specific Type III Internal EPD') {
          return ['externalIndependentReviewer'].includes(fieldName);
        }
        if (evaluation.epdType !== 'Industry-wide/generic EPD') {
          return ['manufacturerRecognized'].includes(fieldName);
        }
        break;
        
      case 'LCA':
        if (evaluation.lcaOptimizationType === 'LCA impact reduction action plan') {
          return ['sameOptimizationPcr', 'optimizationLcaVerification', 'personConductingOptimizationLca',
                  'optimizationLcaSoftware', 'comparativeAnalysis', 'narrativeReductions', 
                  'reductionGwp10', 'reductionGwp20', 'reductionAdditional2Categories'].includes(fieldName);
        }
        if (evaluation.lcaOptimizationType !== 'LCA impact reduction action plan') {
          return ['milestonesForImprovements', 'narrativeActions', 'targetImpactAreas',
                  'companyExecutiveSignature', 'summaryLargestImpacts'].includes(fieldName);
        }
        if (evaluation.lcaOptimizationType !== 'Verified impact reductions in GWP' && 
            evaluation.lcaOptimizationType !== 'Verified impact reduction in GWP > 20% + in two other > 5%') {
          return ['reductionGwp10'].includes(fieldName);
        }
        if (evaluation.lcaOptimizationType !== 'Verified impact reduction in GWP > 20% + in two other > 5%') {
          return ['reductionGwp20', 'reductionAdditional2Categories'].includes(fieldName);
        }
        break;
    }
    
    return false;
  };

  const renderEPDForm = () => (
    <div className="space-y-4">
      <div>
        <Label>Version</Label>
        <Input
          value={evaluation.version || ''}
          onChange={(e) => handleInputChange('version', e.target.value)}
          className="bg-[#323232] border-[#424242] text-white"
        />
      </div>

      <div>
        <Label>EPD Type</Label>
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

      <div>
        <Label>Geographic Area</Label>
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
        <Label>Content Conformity (%)</Label>
        <Input
          type="number"
          value={evaluation.conformity || 0}
          onChange={(e) => handleInputChange('conformity', parseInt(e.target.value) || 0)}
          className="bg-[#323232] border-[#424242] text-white"
          min="0"
          max="100"
        />
      </div>

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
            checked={evaluation[field.key] || false}
            onCheckedChange={(checked) => handleInputChange(field.key, checked)}
            disabled={isFieldDisabled(field.key)}
          />
          <Label className={isFieldDisabled(field.key) ? 'text-gray-500' : ''}>{field.label}</Label>
        </div>
      ))}

      <div>
        <Label>Issue Date</Label>
        <Input
          type="date"
          value={evaluation.issueDate || ''}
          onChange={(e) => handleInputChange('issueDate', e.target.value)}
          className="bg-[#323232] border-[#424242] text-white"
        />
      </div>

      <div>
        <Label>Valid To</Label>
        <Input
          type="date"
          value={evaluation.validTo || ''}
          onChange={(e) => handleInputChange('validTo', e.target.value)}
          className="bg-[#323232] border-[#424242] text-white"
        />
      </div>

      <div>
        <Label>EPD File</Label>
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
        <Label>Version</Label>
        <Input
          value={evaluation.version || ''}
          onChange={(e) => handleInputChange('version', e.target.value)}
          className="bg-[#323232] border-[#424242] text-white"
        />
      </div>

      <div>
        <Label>LCA Optimization Type</Label>
        <Select value={evaluation.lcaOptimizationType || ''} onValueChange={(value) => handleInputChange('lcaOptimizationType', value)}>
          <SelectTrigger className="bg-[#323232] border-[#424242] text-white">
            <SelectValue placeholder="Select LCA type" />
          </SelectTrigger>
          <SelectContent className="bg-[#323232] border-[#424242]">
            <SelectItem value="Not compliant">Not compliant</SelectItem>
            <SelectItem value="LCA impact reduction action plan">LCA impact reduction action plan</SelectItem>
            <SelectItem value="Verified impact reductions in GWP">Verified impact reductions in GWP</SelectItem>
            <SelectItem value="Verified impact reduction in GWP > 10%">Verified impact reduction in GWP {'{>}'} 10%</SelectItem>
            <SelectItem value="Verified impact reduction in GWP > 20% + in two other > 5%">Verified impact reduction in GWP {'{>}'} 20% + in two other {'{>}'} 5%</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Geographic Area</Label>
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
        <Label>Content Conformity (%)</Label>
        <Input
          type="number"
          value={evaluation.conformity || 0}
          onChange={(e) => handleInputChange('conformity', parseInt(e.target.value) || 0)}
          className="bg-[#323232] border-[#424242] text-white"
          min="0"
          max="100"
        />
      </div>

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
            checked={evaluation[field.key] || false}
            onCheckedChange={(checked) => handleInputChange(field.key, checked)}
            disabled={isFieldDisabled(field.key)}
          />
          <Label className={isFieldDisabled(field.key) ? 'text-gray-500' : ''}>{field.label}</Label>
        </div>
      ))}

      <div>
        <Label>Issue Date</Label>
        <Input
          type="date"
          value={evaluation.issueDate || ''}
          onChange={(e) => handleInputChange('issueDate', e.target.value)}
          className="bg-[#323232] border-[#424242] text-white"
        />
      </div>

      <div>
        <Label>Valid To</Label>
        <Input
          type="date"
          value={evaluation.validTo || ''}
          onChange={(e) => handleInputChange('validTo', e.target.value)}
          className="bg-[#323232] border-[#424242] text-white"
        />
      </div>

      <div>
        <Label>LCA File</Label>
        <Input
          type="file"
          accept=".pdf,.docx,.doc"
          onChange={(e) => handleInputChange('lcaFile', e.target.files?.[0]?.name || '')}
          className="bg-[#323232] border-[#424242] text-white"
        />
      </div>
    </div>
  );

  const renderGenericForm = () => (
    <div className="space-y-4">
      <div>
        <Label>Version</Label>
        <Input
          value={evaluation.version || ''}
          onChange={(e) => handleInputChange('version', e.target.value)}
          className="bg-[#323232] border-[#424242] text-white"
        />
      </div>

      <div>
        <Label>Geographic Area</Label>
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
        <Label>Content Conformity (%)</Label>
        <Input
          type="number"
          value={evaluation.conformity || 0}
          onChange={(e) => handleInputChange('conformity', parseInt(e.target.value) || 0)}
          className="bg-[#323232] border-[#424242] text-white"
          min="0"
          max="100"
        />
      </div>

      <div>
        <Label>Issue Date</Label>
        <Input
          type="date"
          value={evaluation.issueDate || ''}
          onChange={(e) => handleInputChange('issueDate', e.target.value)}
          className="bg-[#323232] border-[#424242] text-white"
        />
      </div>

      <div>
        <Label>Valid To</Label>
        <Input
          type="date"
          value={evaluation.validTo || ''}
          onChange={(e) => handleInputChange('validTo', e.target.value)}
          className="bg-[#323232] border-[#424242] text-white"
        />
      </div>

      <div>
        <Label>File Upload</Label>
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
      {!['EPD', 'LCA'].includes(evaluation.type) && renderGenericForm()}
    </div>
  );
}
