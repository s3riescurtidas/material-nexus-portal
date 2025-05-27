
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

export function EvaluationForm({ evaluation, onChange }) {
  const [formData, setFormData] = useState(evaluation);
  const [enabledFields, setEnabledFields] = useState({});

  useEffect(() => {
    setFormData(evaluation);
    updateEnabledFields(evaluation.type, evaluation);
  }, [evaluation]);

  const updateEnabledFields = (evaluationType, evalData) => {
    let enabled = {};
    
    switch (evaluationType) {
      case 'EPD':
        const epdType = evalData.epdType || '';
        enabled = {
          programOperator: epdType !== 'Product specific LCA',
          manufacturerRecognized: epdType === 'Industry-wide/generic EPD',
          iso21930Compliance: epdType !== 'Product specific LCA',
          epdVerificationIso14025: epdType !== 'Product specific LCA',
          externalIndependentReviewer: epdType !== 'Product specific LCA' && epdType !== 'Product-specific Type III Internal EPD'
        };
        break;
        
      case 'LCA':
        const lcaType = evalData.lcaOptimizationType || '';
        enabled = {
          milestonesForImprovements: lcaType === 'LCA impact reduction action plan',
          narrativeActions: lcaType === 'LCA impact reduction action plan',
          targetImpactAreas: lcaType === 'LCA impact reduction action plan',
          companyExecutiveSignature: lcaType === 'LCA impact reduction action plan',
          summaryLargestImpacts: lcaType === 'LCA impact reduction action plan',
          sameOptimizationPcr: lcaType !== 'LCA impact reduction action plan',
          optimizationLcaVerification: lcaType !== 'LCA impact reduction action plan',
          personConductingOptimizationLca: lcaType !== 'LCA impact reduction action plan',
          optimizationLcaSoftware: lcaType !== 'LCA impact reduction action plan',
          comparativeAnalysis: lcaType !== 'LCA impact reduction action plan',
          narrativeReductions: lcaType !== 'LCA impact reduction action plan',
          reductionGwp10: lcaType === 'Verified impact reductions in GWP',
          reductionGwp20: lcaType === 'Verified impact reduction in GWP > 20% + in two other > 5%',
          reductionAdditional2Categories: lcaType === 'Verified impact reduction in GWP > 20% + in two other > 5%'
        };
        break;
        
      case 'Manufacturer Inventory':
        const miType = evalData.manufacturerInventoryType || '';
        enabled = {
          inventoryAssessed1000ppm: ['Self-declared manufacturer Inventory', 'Verified manufacturer Inventory'].includes(miType),
          inventoryAssessed100ppm: ['Verified advanced manufacturer Inventory', 'Verified ingredient optimized manufacturer Inventory'].includes(miType),
          noGreenScreenLt1: miType === 'Verified advanced manufacturer Inventory',
          assessed95wt: miType === 'Verified ingredient optimized manufacturer Inventory',
          remaining5percent: miType === 'Verified ingredient optimized manufacturer Inventory',
          externalIndependentReviewer: miType !== 'Self-declared manufacturer Inventory'
        };
        break;
        
      case 'REACH Optimization':
        const reachType = evalData.reportType || '';
        enabled = {
          authorIdentification: reachType !== "Manufacturer's report"
        };
        break;
        
      case 'Health Product Declaration':
        const hpdType = evalData.hpdType || '';
        enabled = {
          inventoryAssessed1000ppm: ['Published HPD', 'Verified HPD'].includes(hpdType),
          inventoryAssessed100ppm: ['Verified advanced HPD', 'Verified ingredient optimized HPD'].includes(hpdType),
          noGreenScreenLt1: hpdType === 'Verified advanced HPD',
          assessed95wt: hpdType === 'Verified ingredient optimized HPD',
          remaining5percent: hpdType === 'Verified ingredient optimized HPD',
          externalIndependentReviewer: hpdType !== 'Published HPD'
        };
        break;
        
      case 'Declare':
        const declareType = evalData.declareType || '';
        enabled = {
          externalIndependentReviewer: ['Verified Declared', 'Verified LBC Compliant', 'Verified Red List Free'].includes(declareType)
        };
        break;
        
      default:
        enabled = {};
    }
    
    setEnabledFields(enabled);
  };

  const handleFieldChange = (field, value) => {
    const updatedData = { ...formData, [field]: value };
    setFormData(updatedData);
    
    // Update enabled fields if a type field changed
    if (field.includes('Type') || field.includes('type')) {
      updateEnabledFields(evaluation.type, updatedData);
    }
    
    onChange(updatedData);
  };

  const calculateConformity = () => {
    let totalFields = 0;
    let checkedFields = 0;
    
    // Count fields that contribute to conformity score (marked with 1# in requirements)
    const conformityFields = getConformityFields(evaluation.type);
    
    conformityFields.forEach(field => {
      if (enabledFields[field] !== false) { // Only count if field is enabled
        totalFields++;
        if (formData[field] === true || (typeof formData[field] === 'string' && formData[field] !== '' && formData[field] !== 'Not compliant')) {
          checkedFields++;
        }
      }
    });
    
    if (totalFields === 0) return 0;
    
    const percentage = (checkedFields / totalFields) * 100;
    const conformity = Math.floor(percentage); // Always round down
    
    handleFieldChange('conformity', conformity);
  };

  const getConformityFields = (evaluationType) => {
    switch (evaluationType) {
      case 'EPD':
        return [
          'epdType', 'geographicArea', 'documentId', 'epdOwner', 'programOperator',
          'referencePcr', 'manufacturerRecognized', 'includeFunctionalUnit',
          'manufacturingLocations', 'minimumCradleToGate', 'allSixImpactCategories',
          'lcaVerificationIso14044', 'personConductingLca', 'lcaSoftware',
          'iso21930Compliance', 'epdVerificationIso14025', 'externalIndependentReviewer'
        ];
      case 'LCA':
        return [
          'lcaOptimizationType', 'geographicArea', 'milestonesForImprovements',
          'narrativeActions', 'targetImpactAreas', 'companyExecutiveSignature',
          'summaryLargestImpacts', 'sameOptimizationPcr', 'optimizationLcaVerification',
          'personConductingOptimizationLca', 'optimizationLcaSoftware', 'comparativeAnalysis',
          'narrativeReductions', 'reductionGwp10', 'reductionGwp20', 'reductionAdditional2Categories'
        ];
      // Add other evaluation types...
      default:
        return [];
    }
  };

  const renderEPDFields = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Version</Label>
          <Input
            value={formData.version || ''}
            onChange={(e) => handleFieldChange('version', e.target.value)}
            className="bg-[#323232] border-[#424242] text-white"
          />
        </div>
        
        <div>
          <Label>EPD Type *</Label>
          <Select value={formData.epdType || ''} onValueChange={(value) => handleFieldChange('epdType', value)}>
            <SelectTrigger className="bg-[#323232] border-[#424242] text-white">
              <SelectValue placeholder="Select EPD Type" />
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
          <Label>Geographic Area *</Label>
          <Select value={formData.geographicArea || 'Global'} onValueChange={(value) => handleFieldChange('geographicArea', value)}>
            <SelectTrigger className="bg-[#323232] border-[#424242] text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#323232] border-[#424242]">
              <SelectItem value="Global">Global</SelectItem>
              <SelectItem value="Western">Western</SelectItem>
              <SelectItem value="Eastern">Eastern</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label>Conformity Content</Label>
          <Input
            type="number"
            value={formData.conformity || 0}
            onChange={(e) => handleFieldChange('conformity', parseInt(e.target.value) || 0)}
            className="bg-[#323232] border-[#424242] text-white"
            readOnly
          />
        </div>
        
        <div>
          <Label>Issue Date</Label>
          <Input
            type="date"
            value={formData.issueDate || ''}
            onChange={(e) => handleFieldChange('issueDate', e.target.value)}
            className="bg-[#323232] border-[#424242] text-white"
          />
        </div>
        
        <div>
          <Label>Valid To</Label>
          <Input
            type="date"
            value={formData.validTo || ''}
            onChange={(e) => handleFieldChange('validTo', e.target.value)}
            className="bg-[#323232] border-[#424242] text-white"
          />
        </div>
        
        <div>
          <Label>EPD File</Label>
          <Input
            type="file"
            accept=".pdf,.docx,.doc"
            onChange={(e) => handleFieldChange('epdFile', e.target.files?.[0]?.name || '')}
            className="bg-[#323232] border-[#424242] text-white"
          />
        </div>
      </div>
      
      <div className="space-y-4">
        <h4 className="font-semibold text-lg">Conformity Fields</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { field: 'documentId', label: 'Document ID' },
            { field: 'epdOwner', label: 'EPD owner' },
            { field: 'programOperator', label: 'Program operator', enabled: enabledFields.programOperator !== false },
            { field: 'referencePcr', label: 'Reference PCR' },
            { field: 'manufacturerRecognized', label: 'Manufacturer recognized as participant', enabled: enabledFields.manufacturerRecognized !== false },
            { field: 'includeFunctionalUnit', label: 'Include functional unit' },
            { field: 'manufacturingLocations', label: 'Manufacturing location(s) indicated' },
            { field: 'minimumCradleToGate', label: 'Minimum cradle to gate scope' },
            { field: 'allSixImpactCategories', label: 'All 6 impact categories listed' },
            { field: 'lcaVerificationIso14044', label: 'LCA verification according to ISO 14044' },
            { field: 'personConductingLca', label: 'Identification of the person conducting the LCA' },
            { field: 'lcaSoftware', label: 'LCA software used' },
            { field: 'iso21930Compliance', label: 'ISO 21930 or EN 15804 compliance', enabled: enabledFields.iso21930Compliance !== false },
            { field: 'epdVerificationIso14025', label: 'EPD verification according to ISO 14025', enabled: enabledFields.epdVerificationIso14025 !== false },
            { field: 'externalIndependentReviewer', label: 'Identification of the external independent reviewer', enabled: enabledFields.externalIndependentReviewer !== false }
          ].map(({ field, label, enabled = true }) => (
            <div key={field} className={`flex items-center space-x-2 ${!enabled ? 'opacity-50' : ''}`}>
              <Checkbox
                id={field}
                checked={formData[field] || false}
                onCheckedChange={(checked) => handleFieldChange(field, checked)}
                disabled={!enabled}
              />
              <Label htmlFor={field} className="text-sm">{label}</Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderLCAFields = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Version</Label>
          <Input
            value={formData.version || ''}
            onChange={(e) => handleFieldChange('version', e.target.value)}
            className="bg-[#323232] border-[#424242] text-white"
          />
        </div>
        
        <div>
          <Label>LCA Optimization Type *</Label>
          <Select value={formData.lcaOptimizationType || ''} onValueChange={(value) => handleFieldChange('lcaOptimizationType', value)}>
            <SelectTrigger className="bg-[#323232] border-[#424242] text-white">
              <SelectValue placeholder="Select LCA Type" />
            </SelectTrigger>
            <SelectContent className="bg-[#323232] border-[#424242]">
              <SelectItem value="Not compliant">Not compliant</SelectItem>
              <SelectItem value="LCA impact reduction action plan">LCA impact reduction action plan</SelectItem>
              <SelectItem value="Verified impact reductions in GWP">Verified impact reductions in GWP</SelectItem>
              <SelectItem value="Verified impact reduction in GWP > 10%">Verified impact reduction in GWP > 10%</SelectItem>
              <SelectItem value="Verified impact reduction in GWP > 20% + in two other > 5%">Verified impact reduction in GWP > 20% + in two other > 5%</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label>Geographic Area *</Label>
          <Select value={formData.geographicArea || 'Global'} onValueChange={(value) => handleFieldChange('geographicArea', value)}>
            <SelectTrigger className="bg-[#323232] border-[#424242] text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#323232] border-[#424242]">
              <SelectItem value="Global">Global</SelectItem>
              <SelectItem value="Western">Western</SelectItem>
              <SelectItem value="Eastern">Eastern</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label>Conformity Content</Label>
          <Input
            type="number"
            value={formData.conformity || 0}
            onChange={(e) => handleFieldChange('conformity', parseInt(e.target.value) || 0)}
            className="bg-[#323232] border-[#424242] text-white"
            readOnly
          />
        </div>
        
        <div>
          <Label>Issue Date</Label>
          <Input
            type="date"
            value={formData.issueDate || ''}
            onChange={(e) => handleFieldChange('issueDate', e.target.value)}
            className="bg-[#323232] border-[#424242] text-white"
          />
        </div>
        
        <div>
          <Label>Valid To</Label>
          <Input
            type="date"
            value={formData.validTo || ''}
            onChange={(e) => handleFieldChange('validTo', e.target.value)}
            className="bg-[#323232] border-[#424242] text-white"
          />
        </div>
        
        <div>
          <Label>LCA File</Label>
          <Input
            type="file"
            accept=".pdf,.docx,.doc"
            onChange={(e) => handleFieldChange('lcaFile', e.target.files?.[0]?.name || '')}
            className="bg-[#323232] border-[#424242] text-white"
          />
        </div>
      </div>
      
      <div className="space-y-4">
        <h4 className="font-semibold text-lg">Conformity Fields</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { field: 'milestonesForImprovements', label: 'Milestones for improvements with timeline (not more than 4 years)', enabled: enabledFields.milestonesForImprovements !== false },
            { field: 'narrativeActions', label: 'Narrative with actions to be pursued including GWP addressed', enabled: enabledFields.narrativeActions !== false },
            { field: 'targetImpactAreas', label: 'Description of target impact areas', enabled: enabledFields.targetImpactAreas !== false },
            { field: 'companyExecutiveSignature', label: 'Signature of company executive', enabled: enabledFields.companyExecutiveSignature !== false },
            { field: 'summaryLargestImpacts', label: 'Table/Summary of largest life cycle impacts', enabled: enabledFields.summaryLargestImpacts !== false },
            { field: 'sameOptimizationPcr', label: 'Same optimization PCR as reference PCR', enabled: enabledFields.sameOptimizationPcr !== false },
            { field: 'optimizationLcaVerification', label: 'Optimization LCA verification according to ISO 14044', enabled: enabledFields.optimizationLcaVerification !== false },
            { field: 'personConductingOptimizationLca', label: 'Identification of the person conducting the optimization LCA', enabled: enabledFields.personConductingOptimizationLca !== false },
            { field: 'optimizationLcaSoftware', label: 'Optimization LCA software used', enabled: enabledFields.optimizationLcaSoftware !== false },
            { field: 'comparativeAnalysis', label: 'Comparative analysis showing impact reduction in GWP', enabled: enabledFields.comparativeAnalysis !== false },
            { field: 'narrativeReductions', label: 'Narrative describing how reductions in impacts were achieved', enabled: enabledFields.narrativeReductions !== false },
            { field: 'reductionGwp10', label: 'Reduction in GWP against the baseline 10%', enabled: enabledFields.reductionGwp10 !== false },
            { field: 'reductionGwp20', label: 'Reduction in GWP against the baseline 20%', enabled: enabledFields.reductionGwp20 !== false },
            { field: 'reductionAdditional2Categories', label: 'Reduction in additional 2 impact categories against the baseline >5%', enabled: enabledFields.reductionAdditional2Categories !== false }
          ].map(({ field, label, enabled = true }) => (
            <div key={field} className={`flex items-center space-x-2 ${!enabled ? 'opacity-50' : ''}`}>
              <Checkbox
                id={field}
                checked={formData[field] || false}
                onCheckedChange={(checked) => handleFieldChange(field, checked)}
                disabled={!enabled}
              />
              <Label htmlFor={field} className="text-sm">{label}</Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderGenericFields = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Version</Label>
          <Input
            value={formData.version || ''}
            onChange={(e) => handleFieldChange('version', e.target.value)}
            className="bg-[#323232] border-[#424242] text-white"
          />
        </div>
        
        <div>
          <Label>Geographic Area</Label>
          <Select value={formData.geographicArea || 'Global'} onValueChange={(value) => handleFieldChange('geographicArea', value)}>
            <SelectTrigger className="bg-[#323232] border-[#424242] text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#323232] border-[#424242]">
              <SelectItem value="Global">Global</SelectItem>
              <SelectItem value="Western">Western</SelectItem>
              <SelectItem value="Eastern">Eastern</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label>Conformity Content</Label>
          <Input
            type="number"
            value={formData.conformity || 0}
            onChange={(e) => handleFieldChange('conformity', parseInt(e.target.value) || 0)}
            className="bg-[#323232] border-[#424242] text-white"
          />
        </div>
        
        <div>
          <Label>Issue Date</Label>
          <Input
            type="date"
            value={formData.issueDate || ''}
            onChange={(e) => handleFieldChange('issueDate', e.target.value)}
            className="bg-[#323232] border-[#424242] text-white"
          />
        </div>
        
        <div>
          <Label>Valid To</Label>
          <Input
            type="date"
            value={formData.validTo || ''}
            onChange={(e) => handleFieldChange('validTo', e.target.value)}
            className="bg-[#323232] border-[#424242] text-white"
          />
        </div>
      </div>
    </div>
  );

  const renderFields = () => {
    switch (evaluation.type) {
      case 'EPD':
        return renderEPDFields();
      case 'LCA':
        return renderLCAFields();
      default:
        return renderGenericFields();
    }
  };

  return (
    <div className="space-y-6">
      {renderFields()}
      
      <div className="flex justify-end">
        <Button 
          type="button" 
          onClick={calculateConformity}
          className="bg-[#358C48] hover:bg-[#4ea045]"
        >
          <Save className="mr-2 h-4 w-4" />
          Calculate Conformity
        </Button>
      </div>
    </div>
  );
}
