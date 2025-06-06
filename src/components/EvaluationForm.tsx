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

// Define proper interface for evaluation data
interface EvaluationData {
  type: string;
  version: string;
  issueDate: string;
  validTo: string;
  conformity: number;
  geographicArea: string;
  fileName?: string;
  // EPD specific fields
  epdType?: string;
  documentId?: string;
  epdOwner?: string;
  programOperator?: string;
  referencePcr?: string;
  manufacturerRecognized?: boolean;
  includeFunctionalUnit?: boolean;
  manufacturingLocations?: boolean;
  minimumCradleToGate?: boolean;
  allSixImpactCategories?: boolean;
  lcaVerificationIso14044?: boolean;
  personConductingLca?: boolean;
  lcaSoftware?: boolean;
  iso21930Compliance?: boolean;
  epdVerificationIso14025?: boolean;
  externalIndependentReviewer?: boolean;
  // LCA specific fields
  lcaOptimizationType?: string;
  milestonesForImprovements?: boolean;
  narrativeActions?: boolean;
  targetImpactAreas?: boolean;
  companyExecutiveSignature?: boolean;
  summaryLargestImpacts?: boolean;
  sameOptimizationPcr?: boolean;
  optimizationLcaVerification?: boolean;
  personConductingOptimizationLca?: boolean;
  optimizationLcaSoftware?: boolean;
  comparativeAnalysis?: boolean;
  narrativeReductions?: boolean;
  reductionGwp10?: boolean;
  reductionGwp20?: boolean;
  reductionAdditionalCategories?: boolean;
  [key: string]: any;
}

export function EvaluationForm({ evaluation, onClose, onSave }: EvaluationFormProps) {
  const [formData, setFormData] = useState<EvaluationData>({
    type: '',
    version: '',
    issueDate: '',
    validTo: '',
    conformity: 0,
    geographicArea: '',
    fileName: '',
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (evaluation) {
      setFormData({
        type: evaluation.type || '',
        version: evaluation.version || '',
        issueDate: evaluation.issueDate || '',
        validTo: evaluation.validTo || '',
        conformity: evaluation.conformity || 0,
        geographicArea: evaluation.geographicArea || '',
        fileName: evaluation.fileName || '',
        ...evaluation // Spread all other properties
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
    if (formData.type === 'EPD' || formData.type === 'LCA' || formData.type === 'Manufacturer Inventory' || 
        formData.type === 'REACH Optimization' || formData.type === 'Health Product Declaration' || 
        formData.type === 'C2C' || formData.type === 'Declare') {
      
      // Get all boolean fields for this evaluation type
      const booleanFields = Object.keys(formData).filter(key => 
        typeof formData[key] === 'boolean' && 
        key !== 'conformity' && 
        shouldShowField(key, formData.type, formData)
      );
      
      if (booleanFields.length > 0) {
        const trueFields = booleanFields.filter(key => formData[key] === true);
        const conformityPercentage = Math.round((trueFields.length / booleanFields.length) * 100);
        setFormData(prev => ({
          ...prev,
          conformity: conformityPercentage
        }));
      }
    }
  };

  const shouldShowField = (fieldName: string, evaluationType: string, currentFormData: any): boolean => {
    switch (evaluationType) {
      case 'EPD':
        if (fieldName === 'programOperator' || fieldName === 'iso21930Compliance' || fieldName === 'epdVerificationIso14025') {
          return currentFormData.epdType !== 'Product-specific LCA';
        }
        if (fieldName === 'manufacturerRecognized') {
          return currentFormData.epdType === 'Industry-wide/generic EPD';
        }
        if (fieldName === 'externalIndependentReviewer') {
          return currentFormData.epdType !== 'Product-specific LCA' && currentFormData.epdType !== 'Product-specific Type III Internal EPD';
        }
        return true;
        
      case 'LCA':
        if (fieldName === 'milestonesForImprovements' || fieldName === 'narrativeActions' || 
            fieldName === 'targetImpactAreas' || fieldName === 'companyExecutiveSignature' || 
            fieldName === 'summaryLargestImpacts') {
          return currentFormData.lcaOptimizationType === 'LCA impact reduction action plan';
        }
        if (fieldName === 'sameOptimizationPcr' || fieldName === 'optimizationLcaVerification' || 
            fieldName === 'personConductingOptimizationLca' || fieldName === 'optimizationLcaSoftware' || 
            fieldName === 'comparativeAnalysis' || fieldName === 'narrativeReductions') {
          return currentFormData.lcaOptimizationType !== 'LCA impact reduction action plan';
        }
        if (fieldName === 'reductionGwp10') {
          return currentFormData.lcaOptimizationType === 'Verified impact reductions in GWP';
        }
        if (fieldName === 'reductionGwp20' || fieldName === 'reductionAdditionalCategories') {
          return currentFormData.lcaOptimizationType === 'Verified impact reduction in GWP {\'>\'}20% + in two other {\'>\'}5%';
        }
        return true;
        
      default:
        return true;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calculate conformity before saving
    calculateConformity();
    
    // Create the final evaluation data
    const evaluationData = {
      ...formData,
      id: evaluation?.id || Date.now()
    };
    
    console.log('Saving evaluation data:', evaluationData);
    onSave(evaluationData);
  };

  const renderSpecificFields = () => {
    switch (formData.type) {
      case 'EPD':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="epdType">EPD Type</Label>
                <Select onValueChange={(value) => handleInputChange('epdType', value)} defaultValue={formData.epdType || ''}>
                  <SelectTrigger className="bg-[#323232] border-[#424242] text-white">
                    <SelectValue placeholder="Select EPD Type" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#323232] border-[#424242] text-white">
                    <SelectItem value="Product-specific LCA">Product-specific LCA</SelectItem>
                    <SelectItem value="Product-specific Type III Internal EPD">Product-specific Type III Internal EPD</SelectItem>
                    <SelectItem value="Industry-wide/generic EPD">Industry-wide/generic EPD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="documentId">Document ID</Label>
                <Input
                  type="text"
                  id="documentId"
                  className="bg-[#323232] border-[#424242] text-white"
                  value={formData.documentId || ''}
                  onChange={(e) => handleInputChange('documentId', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {shouldShowField('epdOwner', formData.type, formData) && (
                <div>
                  <Label htmlFor="epdOwner">EPD Owner</Label>
                  <Input
                    type="text"
                    id="epdOwner"
                    className="bg-[#323232] border-[#424242] text-white"
                    value={formData.epdOwner || ''}
                    onChange={(e) => handleInputChange('epdOwner', e.target.value)}
                  />
                </div>
              )}
              {shouldShowField('programOperator', formData.type, formData) && (
                <div>
                  <Label htmlFor="programOperator">Program Operator</Label>
                  <Input
                    type="text"
                    id="programOperator"
                    className="bg-[#323232] border-[#424242] text-white"
                    value={formData.programOperator || ''}
                    onChange={(e) => handleInputChange('programOperator', e.target.value)}
                  />
                </div>
              )}
              {shouldShowField('referencePcr', formData.type, formData) && (
                <div>
                  <Label htmlFor="referencePcr">Reference PCR</Label>
                  <Input
                    type="text"
                    id="referencePcr"
                    className="bg-[#323232] border-[#424242] text-white"
                    value={formData.referencePcr || ''}
                    onChange={(e) => handleInputChange('referencePcr', e.target.value)}
                  />
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {shouldShowField('manufacturerRecognized', formData.type, formData) && (
                <div>
                  <Label htmlFor="manufacturerRecognized">Manufacturer Recognized</Label>
                  <Checkbox
                    id="manufacturerRecognized"
                    checked={formData.manufacturerRecognized || false}
                    onCheckedChange={(checked) => handleInputChange('manufacturerRecognized', checked)}
                  />
                </div>
              )}
              <div>
                <Label htmlFor="includeFunctionalUnit">Include Functional Unit</Label>
                <Checkbox
                  id="includeFunctionalUnit"
                  checked={formData.includeFunctionalUnit || false}
                  onCheckedChange={(checked) => handleInputChange('includeFunctionalUnit', checked)}
                />
              </div>
              <div>
                <Label htmlFor="manufacturingLocations">Manufacturing Locations</Label>
                <Checkbox
                  id="manufacturingLocations"
                  checked={formData.manufacturingLocations || false}
                  onCheckedChange={(checked) => handleInputChange('manufacturingLocations', checked)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="minimumCradleToGate">Minimum Cradle To Gate</Label>
                <Checkbox
                  id="minimumCradleToGate"
                  checked={formData.minimumCradleToGate || false}
                  onCheckedChange={(checked) => handleInputChange('minimumCradleToGate', checked)}
                />
              </div>
              <div>
                <Label htmlFor="allSixImpactCategories">All Six Impact Categories</Label>
                <Checkbox
                  id="allSixImpactCategories"
                  checked={formData.allSixImpactCategories || false}
                  onCheckedChange={(checked) => handleInputChange('allSixImpactCategories', checked)}
                />
              </div>
              <div>
                <Label htmlFor="lcaVerificationIso14044">LCA Verification ISO 14044</Label>
                <Checkbox
                  id="lcaVerificationIso14044"
                  checked={formData.lcaVerificationIso14044 || false}
                  onCheckedChange={(checked) => handleInputChange('lcaVerificationIso14044', checked)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="personConductingLca">Person Conducting LCA</Label>
                <Checkbox
                  id="personConductingLca"
                  checked={formData.personConductingLca || false}
                  onCheckedChange={(checked) => handleInputChange('personConductingLca', checked)}
                />
              </div>
              <div>
                <Label htmlFor="lcaSoftware">LCA Software</Label>
                <Checkbox
                  id="lcaSoftware"
                  checked={formData.lcaSoftware || false}
                  onCheckedChange={(checked) => handleInputChange('lcaSoftware', checked)}
                />
              </div>
              {shouldShowField('iso21930Compliance', formData.type, formData) && (
                <div>
                  <Label htmlFor="iso21930Compliance">ISO 21930 Compliance</Label>
                  <Checkbox
                    id="iso21930Compliance"
                    checked={formData.iso21930Compliance || false}
                    onCheckedChange={(checked) => handleInputChange('iso21930Compliance', checked)}
                  />
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {shouldShowField('epdVerificationIso14025', formData.type, formData) && (
                <div>
                  <Label htmlFor="epdVerificationIso14025">EPD Verification ISO 14025</Label>
                  <Checkbox
                    id="epdVerificationIso14025"
                    checked={formData.epdVerificationIso14025 || false}
                    onCheckedChange={(checked) => handleInputChange('epdVerificationIso14025', checked)}
                  />
                </div>
              )}
              {shouldShowField('externalIndependentReviewer', formData.type, formData) && (
                <div>
                  <Label htmlFor="externalIndependentReviewer">External Independent Reviewer</Label>
                  <Checkbox
                    id="externalIndependentReviewer"
                    checked={formData.externalIndependentReviewer || false}
                    onCheckedChange={(checked) => handleInputChange('externalIndependentReviewer', checked)}
                  />
                </div>
              )}
            </div>
          </>
        );
      case 'LCA':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lcaOptimizationType">LCA Optimization Type</Label>
                <Select onValueChange={(value) => handleInputChange('lcaOptimizationType', value)} defaultValue={formData.lcaOptimizationType || ''}>
                  <SelectTrigger className="bg-[#323232] border-[#424242] text-white">
                    <SelectValue placeholder="Select LCA Optimization Type" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#323232] border-[#424242] text-white">
                    <SelectItem value="LCA impact reduction action plan">LCA impact reduction action plan</SelectItem>
                    <SelectItem value="Verified impact reductions in GWP">Verified impact reductions in GWP</SelectItem>
                    <SelectItem value="Verified impact reduction in GWP {'>'}20% + in two other {'>'}5%">Verified impact reduction in GWP {'>'}20% + in two other {'>'}5%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {shouldShowField('milestonesForImprovements', formData.type, formData) && (
                <div>
                  <Label htmlFor="milestonesForImprovements">Milestones For Improvements</Label>
                  <Checkbox
                    id="milestonesForImprovements"
                    checked={formData.milestonesForImprovements || false}
                    onCheckedChange={(checked) => handleInputChange('milestonesForImprovements', checked)}
                  />
                </div>
              )}
              {shouldShowField('narrativeActions', formData.type, formData) && (
                <div>
                  <Label htmlFor="narrativeActions">Narrative Actions</Label>
                  <Checkbox
                    id="narrativeActions"
                    checked={formData.narrativeActions || false}
                    onCheckedChange={(checked) => handleInputChange('narrativeActions', checked)}
                  />
                </div>
              )}
              {shouldShowField('targetImpactAreas', formData.type, formData) && (
                <div>
                  <Label htmlFor="targetImpactAreas">Target Impact Areas</Label>
                  <Checkbox
                    id="targetImpactAreas"
                    checked={formData.targetImpactAreas || false}
                    onCheckedChange={(checked) => handleInputChange('targetImpactAreas', checked)}
                  />
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {shouldShowField('companyExecutiveSignature', formData.type, formData) && (
                <div>
                  <Label htmlFor="companyExecutiveSignature">Company Executive Signature</Label>
                  <Checkbox
                    id="companyExecutiveSignature"
                    checked={formData.companyExecutiveSignature || false}
                    onCheckedChange={(checked) => handleInputChange('companyExecutiveSignature', checked)}
                  />
                </div>
              )}
              {shouldShowField('summaryLargestImpacts', formData.type, formData) && (
                <div>
                  <Label htmlFor="summaryLargestImpacts">Summary Largest Impacts</Label>
                  <Checkbox
                    id="summaryLargestImpacts"
                    checked={formData.summaryLargestImpacts || false}
                    onCheckedChange={(checked) => handleInputChange('summaryLargestImpacts', checked)}
                  />
                </div>
              )}
              {shouldShowField('sameOptimizationPcr', formData.type, formData) && (
                <div>
                  <Label htmlFor="sameOptimizationPcr">Same Optimization PCR</Label>
                  <Checkbox
                    id="sameOptimizationPcr"
                    checked={formData.sameOptimizationPcr || false}
                    onCheckedChange={(checked) => handleInputChange('sameOptimizationPcr', checked)}
                  />
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {shouldShowField('optimizationLcaVerification', formData.type, formData) && (
                <div>
                  <Label htmlFor="optimizationLcaVerification">Optimization LCA Verification</Label>
                  <Checkbox
                    id="optimizationLcaVerification"
                    checked={formData.optimizationLcaVerification || false}
                    onCheckedChange={(checked) => handleInputChange('optimizationLcaVerification', checked)}
                  />
                </div>
              )}
              {shouldShowField('personConductingOptimizationLca', formData.type, formData) && (
                <div>
                  <Label htmlFor="personConductingOptimizationLca">Person Conducting Optimization LCA</Label>
                  <Checkbox
                    id="personConductingOptimizationLca"
                    checked={formData.personConductingOptimizationLca || false}
                    onCheckedChange={(checked) => handleInputChange('personConductingOptimizationLca', checked)}
                  />
                </div>
              )}
              {shouldShowField('optimizationLcaSoftware', formData.type, formData) && (
                <div>
                  <Label htmlFor="optimizationLcaSoftware">Optimization LCA Software</Label>
                  <Checkbox
                    id="optimizationLcaSoftware"
                    checked={formData.optimizationLcaSoftware || false}
                    onCheckedChange={(checked) => handleInputChange('optimizationLcaSoftware', checked)}
                  />
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {shouldShowField('comparativeAnalysis', formData.type, formData) && (
                <div>
                  <Label htmlFor="comparativeAnalysis">Comparative Analysis</Label>
                  <Checkbox
                    id="comparativeAnalysis"
                    checked={formData.comparativeAnalysis || false}
                    onCheckedChange={(checked) => handleInputChange('comparativeAnalysis', checked)}
                  />
                </div>
              )}
              {shouldShowField('narrativeReductions', formData.type, formData) && (
                <div>
                  <Label htmlFor="narrativeReductions">Narrative Reductions</Label>
                  <Checkbox
                    id="narrativeReductions"
                    checked={formData.narrativeReductions || false}
                    onCheckedChange={(checked) => handleInputChange('narrativeReductions', checked)}
                  />
                </div>
              )}
              {shouldShowField('reductionGwp10', formData.type, formData) && (
                <div>
                  <Label htmlFor="reductionGwp10">Reduction GWP 10</Label>
                  <Checkbox
                    id="reductionGwp10"
                    checked={formData.reductionGwp10 || false}
                    onCheckedChange={(checked) => handleInputChange('reductionGwp10', checked)}
                  />
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {shouldShowField('reductionGwp20', formData.type, formData) && (
                <div>
                  <Label htmlFor="reductionGwp20">Reduction GWP 20</Label>
                  <Checkbox
                    id="reductionGwp20"
                    checked={formData.reductionGwp20 || false}
                    onCheckedChange={(checked) => handleInputChange('reductionGwp20', checked)}
                  />
                </div>
              )}
              {shouldShowField('reductionAdditionalCategories', formData.type, formData) && (
                <div>
                  <Label htmlFor="reductionAdditionalCategories">Reduction Additional Categories</Label>
                  <Checkbox
                    id="reductionAdditionalCategories"
                    checked={formData.reductionAdditionalCategories || false}
                    onCheckedChange={(checked) => handleInputChange('reductionAdditionalCategories', checked)}
                  />
                </div>
              )}
            </div>
          </>
        );
      case 'Manufacturer Inventory':
        return (
          <>
            <div>
              <Label htmlFor="inventoryDetails">Inventory Details</Label>
              <Textarea
                id="inventoryDetails"
                className="bg-[#323232] border-[#424242] text-white"
                value={formData.inventoryDetails || ''}
                onChange={(e) => handleInputChange('inventoryDetails', e.target.value)}
              />
            </div>
          </>
        );
      case 'REACH Optimization':
        return (
          <>
            <div>
              <Label htmlFor="reachDetails">REACH Details</Label>
              <Textarea
                id="reachDetails"
                className="bg-[#323232] border-[#424242] text-white"
                value={formData.reachDetails || ''}
                onChange={(e) => handleInputChange('reachDetails', e.target.value)}
              />
            </div>
          </>
        );
      case 'Health Product Declaration':
        return (
          <>
            <div>
              <Label htmlFor="hpdDetails">HPD Details</Label>
              <Textarea
                id="hpdDetails"
                className="bg-[#323232] border-[#424242] text-white"
                value={formData.hpdDetails || ''}
                onChange={(e) => handleInputChange('hpdDetails', e.target.value)}
              />
            </div>
          </>
        );
      case 'C2C':
        return (
          <>
            <div>
              <Label htmlFor="c2cDetails">C2C Details</Label>
              <Textarea
                id="c2cDetails"
                className="bg-[#323232] border-[#424242] text-white"
                value={formData.c2cDetails || ''}
                onChange={(e) => handleInputChange('c2cDetails', e.target.value)}
              />
            </div>
          </>
        );
      case 'Declare':
        return (
          <>
            <div>
              <Label htmlFor="declareDetails">Declare Details</Label>
              <Textarea
                id="declareDetails"
                className="bg-[#323232] border-[#424242] text-white"
                value={formData.declareDetails || ''}
                onChange={(e) => handleInputChange('declareDetails', e.target.value)}
              />
            </div>
          </>
        );
      case 'Product Circularity':
        return (
          <>
            <div>
              <Label htmlFor="circularityDetails">Circularity Details</Label>
              <Textarea
                id="circularityDetails"
                className="bg-[#323232] border-[#424242] text-white"
                value={formData.circularityDetails || ''}
                onChange={(e) => handleInputChange('circularityDetails', e.target.value)}
              />
            </div>
          </>
        );
      case 'Global Green Tag Product Health Declaration':
        return (
          <>
            <div>
              <Label htmlFor="ggtDetails">GGT Details</Label>
              <Textarea
                id="ggtDetails"
                className="bg-[#323232] border-[#424242] text-white"
                value={formData.ggtDetails || ''}
                onChange={(e) => handleInputChange('ggtDetails', e.target.value)}
              />
            </div>
          </>
        );
      case 'FSC / PEFC':
        return (
          <>
            <div>
              <Label htmlFor="fscDetails">FSC Details</Label>
              <Textarea
                id="fscDetails"
                className="bg-[#323232] border-[#424242] text-white"
                value={formData.fscDetails || ''}
                onChange={(e) => handleInputChange('fscDetails', e.target.value)}
              />
            </div>
          </>
        );
      case 'ECOLABEL':
        return (
          <>
            <div>
              <Label htmlFor="ecolabelDetails">Ecolabel Details</Label>
              <Textarea
                id="ecolabelDetails"
                className="bg-[#323232] border-[#424242] text-white"
                value={formData.ecolabelDetails || ''}
                onChange={(e) => handleInputChange('ecolabelDetails', e.target.value)}
              />
            </div>
          </>
        );
      default:
        return null;
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
              <Select onValueChange={(value) => handleInputChange('type', value)} defaultValue={formData.type}>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="conformity">Conformidade (%)</Label>
              <Input
                type="number"
                id="conformity"
                className="bg-[#323232] border-[#424242] text-white"
                value={formData.conformity}
                onChange={(e) => handleInputChange('conformity', parseInt(e.target.value))}
                readOnly
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
