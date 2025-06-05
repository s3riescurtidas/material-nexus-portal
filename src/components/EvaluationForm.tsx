
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Evaluation {
  id: number;
  type: string;
  version: string;
  issueDate: string;
  validTo: string;
  conformity: number;
  geographicArea: string;
  fileName?: string;
  [key: string]: any;
}

interface EvaluationFormProps {
  evaluation?: Evaluation | null;
  onClose: () => void;
  onSave: (evaluationData: any) => void;
}

export function EvaluationForm({ evaluation, onClose, onSave }: EvaluationFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>({
    type: '',
    version: '',
    issueDate: '',
    validTo: '',
    conformity: 0,
    geographicArea: 'Global',
    fileName: ''
  });

  const [manualConformity, setManualConformity] = useState(false);

  useEffect(() => {
    if (evaluation) {
      console.log('Loading evaluation for editing:', evaluation);
      setFormData({
        type: evaluation.type || '',
        version: evaluation.version || '',
        issueDate: evaluation.issueDate || '',
        validTo: evaluation.validTo || '',
        conformity: evaluation.conformity || 0,
        geographicArea: evaluation.geographicArea || 'Global',
        fileName: evaluation.fileName || '',
        ...Object.fromEntries(
          Object.entries(evaluation).filter(([key]) => 
            !['id', 'type', 'version', 'issueDate', 'validTo', 'conformity', 'geographicArea', 'fileName'].includes(key)
          )
        )
      });
      
      // Check if conformity was manually set
      const hasManualConformity = evaluation.manualConformity === true;
      setManualConformity(hasManualConformity);
    }
  }, [evaluation]);

  const calculateAutoConformity = () => {
    const booleanFields = Object.entries(formData).filter(([key, value]) => 
      typeof value === 'boolean' && !['manualConformity'].includes(key)
    );
    
    if (booleanFields.length === 0) return 100;
    
    const trueCount = booleanFields.filter(([, value]) => value === true).length;
    return Math.round((trueCount / booleanFields.length) * 100);
  };

  useEffect(() => {
    if (!manualConformity) {
      const autoConformity = calculateAutoConformity();
      setFormData(prev => ({
        ...prev,
        conformity: autoConformity
      }));
    }
  }, [formData, manualConformity]);

  const handleInputChange = (field: string, value: any) => {
    console.log(`Updating ${field} to:`, value);
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Saving evaluation with data:', formData);
    
    const evaluationData = {
      ...formData,
      manualConformity,
      id: evaluation?.id || Date.now() + Math.random()
    };
    
    onSave(evaluationData);
  };

  const handleManualConformityChange = (checked: boolean) => {
    setManualConformity(checked);
    if (!checked) {
      // Recalculate conformity automatically
      const autoConformity = calculateAutoConformity();
      setFormData(prev => ({
        ...prev,
        conformity: autoConformity
      }));
    }
  };

  const renderFieldsByType = () => {
    switch (formData.type) {
      case 'EPD':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="epdType">EPD Type</Label>
              <Select value={formData.epdType || ''} onValueChange={(value) => handleInputChange('epdType', value)}>
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
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="documentId" 
                  checked={formData.documentId || false}
                  onCheckedChange={(checked) => handleInputChange('documentId', checked === true)}
                />
                <Label htmlFor="documentId">Document ID</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="epdOwner" 
                  checked={formData.epdOwner || false}
                  onCheckedChange={(checked) => handleInputChange('epdOwner', checked === true)}
                />
                <Label htmlFor="epdOwner">EPD Owner</Label>
              </div>
              
              {formData.epdType !== 'Product specific LCA' && (
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="programOperator" 
                    checked={formData.programOperator || false}
                    onCheckedChange={(checked) => handleInputChange('programOperator', checked === true)}
                  />
                  <Label htmlFor="programOperator">Program Operator</Label>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="referencePcr" 
                  checked={formData.referencePcr || false}
                  onCheckedChange={(checked) => handleInputChange('referencePcr', checked === true)}
                />
                <Label htmlFor="referencePcr">Reference PCR</Label>
              </div>

              {formData.epdType === 'Industry-wide/generic EPD' && (
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="manufacturerRecognized" 
                    checked={formData.manufacturerRecognized || false}
                    onCheckedChange={(checked) => handleInputChange('manufacturerRecognized', checked === true)}
                  />
                  <Label htmlFor="manufacturerRecognized">Manufacturer recognized as participant</Label>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="includeFunctionalUnit" 
                  checked={formData.includeFunctionalUnit || false}
                  onCheckedChange={(checked) => handleInputChange('includeFunctionalUnit', checked === true)}
                />
                <Label htmlFor="includeFunctionalUnit">Include functional unit</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="manufacturingLocations" 
                  checked={formData.manufacturingLocations || false}
                  onCheckedChange={(checked) => handleInputChange('manufacturingLocations', checked === true)}
                />
                <Label htmlFor="manufacturingLocations">Manufacturing location(s) indicated</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="minimumCradleToGate" 
                  checked={formData.minimumCradleToGate || false}
                  onCheckedChange={(checked) => handleInputChange('minimumCradleToGate', checked === true)}
                />
                <Label htmlFor="minimumCradleToGate">Minimum cradle to gate scope</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="allSixImpactCategories" 
                  checked={formData.allSixImpactCategories || false}
                  onCheckedChange={(checked) => handleInputChange('allSixImpactCategories', checked === true)}
                />
                <Label htmlFor="allSixImpactCategories">All 6 impact categories listed</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="lcaVerificationIso14044" 
                  checked={formData.lcaVerificationIso14044 || false}
                  onCheckedChange={(checked) => handleInputChange('lcaVerificationIso14044', checked === true)}
                />
                <Label htmlFor="lcaVerificationIso14044">LCA verification according to ISO 14044</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="personConductingLca" 
                  checked={formData.personConductingLca || false}
                  onCheckedChange={(checked) => handleInputChange('personConductingLca', checked === true)}
                />
                <Label htmlFor="personConductingLca">Identification of the person conducting the LCA</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="lcaSoftware" 
                  checked={formData.lcaSoftware || false}
                  onCheckedChange={(checked) => handleInputChange('lcaSoftware', checked === true)}
                />
                <Label htmlFor="lcaSoftware">LCA software used</Label>
              </div>

              {formData.epdType !== 'Product specific LCA' && (
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="iso21930Compliance" 
                    checked={formData.iso21930Compliance || false}
                    onCheckedChange={(checked) => handleInputChange('iso21930Compliance', checked === true)}
                  />
                  <Label htmlFor="iso21930Compliance">ISO 21930 or EN 15804 compliance</Label>
                </div>
              )}

              {formData.epdType !== 'Product specific LCA' && (
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="epdVerificationIso14025" 
                    checked={formData.epdVerificationIso14025 || false}
                    onCheckedChange={(checked) => handleInputChange('epdVerificationIso14025', checked === true)}
                  />
                  <Label htmlFor="epdVerificationIso14025">EPD verification according to ISO 14025</Label>
                </div>
              )}

              {!['Product specific LCA', 'Product-specific Type III Internal EPD'].includes(formData.epdType || '') && (
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="externalIndependentReviewer" 
                    checked={formData.externalIndependentReviewer || false}
                    onCheckedChange={(checked) => handleInputChange('externalIndependentReviewer', checked === true)}
                  />
                  <Label htmlFor="externalIndependentReviewer">Identification of the external independent reviewer</Label>
                </div>
              )}
            </div>
          </div>
        );

      case 'LCA':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="lcaOptimizationType">LCA Optimization Type</Label>
              <Select value={formData.lcaOptimizationType || ''} onValueChange={(value) => handleInputChange('lcaOptimizationType', value)}>
                <SelectTrigger className="bg-[#323232] border-[#424242] text-white">
                  <SelectValue placeholder="Select LCA optimization type" />
                </SelectTrigger>
                <SelectContent className="bg-[#323232] border-[#424242]">
                  <SelectItem value="Not compliant">Not compliant</SelectItem>
                  <SelectItem value="LCA impact reduction action plan">LCA impact reduction action plan</SelectItem>
                  <SelectItem value="Verified impact reductions in GWP">Verified impact reductions in GWP</SelectItem>
                  <SelectItem value="Verified impact reduction in GWP > 10%">Verified impact reduction in GWP {'>'}10%</SelectItem>
                  <SelectItem value="Verified impact reduction in GWP > 20% + in two other > 5%">Verified impact reduction in GWP {'>'}20% + in two other {'>'}5%</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {formData.lcaOptimizationType === 'LCA impact reduction action plan' && (
                <>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="milestonesForImprovements" 
                      checked={formData.milestonesForImprovements || false}
                      onCheckedChange={(checked) => handleInputChange('milestonesForImprovements', checked === true)}
                    />
                    <Label htmlFor="milestonesForImprovements">Milestones for improvements with timeline (not more than 4 years)</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="narrativeActions" 
                      checked={formData.narrativeActions || false}
                      onCheckedChange={(checked) => handleInputChange('narrativeActions', checked === true)}
                    />
                    <Label htmlFor="narrativeActions">Narrative with actions to be pursued including GWP addressed</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="targetImpactAreas" 
                      checked={formData.targetImpactAreas || false}
                      onCheckedChange={(checked) => handleInputChange('targetImpactAreas', checked === true)}
                    />
                    <Label htmlFor="targetImpactAreas">Description of target impact areas</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="companyExecutiveSignature" 
                      checked={formData.companyExecutiveSignature || false}
                      onCheckedChange={(checked) => handleInputChange('companyExecutiveSignature', checked === true)}
                    />
                    <Label htmlFor="companyExecutiveSignature">Signature of company executive</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="summaryLargestImpacts" 
                      checked={formData.summaryLargestImpacts || false}
                      onCheckedChange={(checked) => handleInputChange('summaryLargestImpacts', checked === true)}
                    />
                    <Label htmlFor="summaryLargestImpacts">Table/Summary of largest life cycle impacts</Label>
                  </div>
                </>
              )}

              {formData.lcaOptimizationType !== 'LCA impact reduction action plan' && formData.lcaOptimizationType !== 'Not compliant' && (
                <>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="sameOptimizationPcr" 
                      checked={formData.sameOptimizationPcr || false}
                      onCheckedChange={(checked) => handleInputChange('sameOptimizationPcr', checked === true)}
                    />
                    <Label htmlFor="sameOptimizationPcr">Same optimization PCR as reference PCR</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="optimizationLcaVerification" 
                      checked={formData.optimizationLcaVerification || false}
                      onCheckedChange={(checked) => handleInputChange('optimizationLcaVerification', checked === true)}
                    />
                    <Label htmlFor="optimizationLcaVerification">Optimization LCA verification according to ISO 14044</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="personConductingOptimizationLca" 
                      checked={formData.personConductingOptimizationLca || false}
                      onCheckedChange={(checked) => handleInputChange('personConductingOptimizationLca', checked === true)}
                    />
                    <Label htmlFor="personConductingOptimizationLca">Identification of the person conducting the optimization LCA</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="optimizationLcaSoftware" 
                      checked={formData.optimizationLcaSoftware || false}
                      onCheckedChange={(checked) => handleInputChange('optimizationLcaSoftware', checked === true)}
                    />
                    <Label htmlFor="optimizationLcaSoftware">Optimization LCA software used</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="comparativeAnalysis" 
                      checked={formData.comparativeAnalysis || false}
                      onCheckedChange={(checked) => handleInputChange('comparativeAnalysis', checked === true)}
                    />
                    <Label htmlFor="comparativeAnalysis">Comparative analysis showing impact reduction in GWP</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="narrativeReductions" 
                      checked={formData.narrativeReductions || false}
                      onCheckedChange={(checked) => handleInputChange('narrativeReductions', checked === true)}
                    />
                    <Label htmlFor="narrativeReductions">Narrative describing how reductions in impacts were achieved</Label>
                  </div>
                </>
              )}

              {formData.lcaOptimizationType === 'Verified impact reductions in GWP' && (
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="reductionGwp10" 
                    checked={formData.reductionGwp10 || false}
                    onCheckedChange={(checked) => handleInputChange('reductionGwp10', checked === true)}
                  />
                  <Label htmlFor="reductionGwp10">Reduction in GWP against the baseline 10%</Label>
                </div>
              )}

              {formData.lcaOptimizationType === 'Verified impact reduction in GWP > 20% + in two other > 5%' && (
                <>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="reductionGwp20" 
                      checked={formData.reductionGwp20 || false}
                      onCheckedChange={(checked) => handleInputChange('reductionGwp20', checked === true)}
                    />
                    <Label htmlFor="reductionGwp20">Reduction in GWP against the baseline 20%</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="reductionAdditional2Categories" 
                      checked={formData.reductionAdditional2Categories || false}
                      onCheckedChange={(checked) => handleInputChange('reductionAdditional2Categories', checked === true)}
                    />
                    <Label htmlFor="reductionAdditional2Categories">Reduction in additional 2 impact categories against the baseline {'>'}5%</Label>
                  </div>
                </>
              )}
            </div>
          </div>
        );

      case 'Manufacturer Inventory':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="manufacturerInventoryType">Manufacturer Inventory Type</Label>
              <Select value={formData.manufacturerInventoryType || ''} onValueChange={(value) => handleInputChange('manufacturerInventoryType', value)}>
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
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="documentId" 
                  checked={formData.documentId || false}
                  onCheckedChange={(checked) => handleInputChange('documentId', checked === true)}
                />
                <Label htmlFor="documentId">Document ID</Label>
              </div>

              {['Self-declared manufacturer Inventory', 'Verified manufacturer Inventory'].includes(formData.manufacturerInventoryType || '') && (
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="inventoryAssessed1000ppm" 
                    checked={formData.inventoryAssessed1000ppm || false}
                    onCheckedChange={(checked) => handleInputChange('inventoryAssessed1000ppm', checked === true)}
                  />
                  <Label htmlFor="inventoryAssessed1000ppm">Inventory assessed at 0,1 wt.% or 1000ppm</Label>
                </div>
              )}

              {['Verified advanced manufacturer Inventory', 'Verified ingredient optimized manufacturer Inventory'].includes(formData.manufacturerInventoryType || '') && (
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="inventoryAssessed100ppm" 
                    checked={formData.inventoryAssessed100ppm || false}
                    onCheckedChange={(checked) => handleInputChange('inventoryAssessed100ppm', checked === true)}
                  />
                  <Label htmlFor="inventoryAssessed100ppm">Inventory assessed at 0,1 wt.% or 100ppm</Label>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="allIngredientsIdentifiedByName" 
                  checked={formData.allIngredientsIdentifiedByName || false}
                  onCheckedChange={(checked) => handleInputChange('allIngredientsIdentifiedByName', checked === true)}
                />
                <Label htmlFor="allIngredientsIdentifiedByName">All ingredients identified by name</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="allIngredientsByCasrn" 
                  checked={formData.allIngredientsByCasrn || false}
                  onCheckedChange={(checked) => handleInputChange('allIngredientsByCasrn', checked === true)}
                />
                <Label htmlFor="allIngredientsByCasrn">All ingredients identified by CASRN or EC Number</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="ingredientRoleAndAmount" 
                  checked={formData.ingredientRoleAndAmount || false}
                  onCheckedChange={(checked) => handleInputChange('ingredientRoleAndAmount', checked === true)}
                />
                <Label htmlFor="ingredientRoleAndAmount">Ingredient / chemical role and amount disclosed</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="hazardScoreDisclosed" 
                  checked={formData.hazardScoreDisclosed || false}
                  onCheckedChange={(checked) => handleInputChange('hazardScoreDisclosed', checked === true)}
                />
                <Label htmlFor="hazardScoreDisclosed">Hazard score / class disclosed</Label>
              </div>

              {formData.manufacturerInventoryType === 'Verified advanced manufacturer Inventory' && (
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="noGreenScreenLt1Hazards" 
                    checked={formData.noGreenScreenLt1Hazards || false}
                    onCheckedChange={(checked) => handleInputChange('noGreenScreenLt1Hazards', checked === true)}
                  />
                  <Label htmlFor="noGreenScreenLt1Hazards">No GreenScreen LT-1 hazards are present</Label>
                </div>
              )}

              {formData.manufacturerInventoryType === 'Verified ingredient optimized manufacturer Inventory' && (
                <>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="greaterThan95wtAssessed" 
                      checked={formData.greaterThan95wtAssessed || false}
                      onCheckedChange={(checked) => handleInputChange('greaterThan95wtAssessed', checked === true)}
                    />
                    <Label htmlFor="greaterThan95wtAssessed">{'>'}95wt.% is assessed using GreenScreen and no BM-1 hazards are present</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="remaining5PercentInventoried" 
                      checked={formData.remaining5PercentInventoried || false}
                      onCheckedChange={(checked) => handleInputChange('remaining5PercentInventoried', checked === true)}
                    />
                    <Label htmlFor="remaining5PercentInventoried">Remaining 5% is inventoried and no GreenScreen LT-1 hazards are present</Label>
                  </div>
                </>
              )}

              {formData.manufacturerInventoryType !== 'Self-declared manufacturer Inventory' && (
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="externalIndependentReviewer" 
                    checked={formData.externalIndependentReviewer || false}
                    onCheckedChange={(checked) => handleInputChange('externalIndependentReviewer', checked === true)}
                  />
                  <Label htmlFor="externalIndependentReviewer">Identification of the external independent reviewer</Label>
                </div>
              )}
            </div>
          </div>
        );

      case 'REACH Optimization':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="reportType">Report Type</Label>
              <Select value={formData.reportType || ''} onValueChange={(value) => handleInputChange('reportType', value)}>
                <SelectTrigger className="bg-[#323232] border-[#424242] text-white">
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent className="bg-[#323232] border-[#424242]">
                  <SelectItem value="Not compliant">Not compliant</SelectItem>
                  <SelectItem value="Manufacturer's report">Manufacturer's report</SelectItem>
                  <SelectItem value="Other report">Other report</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="documentId" 
                  checked={formData.documentId || false}
                  onCheckedChange={(checked) => handleInputChange('documentId', checked === true)}
                />
                <Label htmlFor="documentId">Document ID</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="inventoryAssessed100ppm" 
                  checked={formData.inventoryAssessed100ppm || false}
                  onCheckedChange={(checked) => handleInputChange('inventoryAssessed100ppm', checked === true)}
                />
                <Label htmlFor="inventoryAssessed100ppm">Inventory assessed at 0,01 wt.% or 100ppm</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="noSubstancesAnnexXiv" 
                  checked={formData.noSubstancesAnnexXiv || false}
                  onCheckedChange={(checked) => handleInputChange('noSubstancesAnnexXiv', checked === true)}
                />
                <Label htmlFor="noSubstancesAnnexXiv">No substances found on Authorization list - Annex XIV</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="noSubstancesAnnexXvii" 
                  checked={formData.noSubstancesAnnexXvii || false}
                  onCheckedChange={(checked) => handleInputChange('noSubstancesAnnexXvii', checked === true)}
                />
                <Label htmlFor="noSubstancesAnnexXvii">No substances found on Authorization list - Annex XVII</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="noSubstancesSvhcCandidate" 
                  checked={formData.noSubstancesSvhcCandidate || false}
                  onCheckedChange={(checked) => handleInputChange('noSubstancesSvhcCandidate', checked === true)}
                />
                <Label htmlFor="noSubstancesSvhcCandidate">No substances found on SVHC candidate list</Label>
              </div>

              {formData.reportType !== 'Manufacturer\'s report' && (
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="identificationAuthorReport" 
                    checked={formData.identificationAuthorReport || false}
                    onCheckedChange={(checked) => handleInputChange('identificationAuthorReport', checked === true)}
                  />
                  <Label htmlFor="identificationAuthorReport">Identification of the author of the report</Label>
                </div>
              )}
            </div>
          </div>
        );

      case 'Health Product Declaration':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="hpdType">HPD Type</Label>
              <Select value={formData.hpdType || ''} onValueChange={(value) => handleInputChange('hpdType', value)}>
                <SelectTrigger className="bg-[#323232] border-[#424242] text-white">
                  <SelectValue placeholder="Select HPD type" />
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
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="documentId" 
                  checked={formData.documentId || false}
                  onCheckedChange={(checked) => handleInputChange('documentId', checked === true)}
                />
                <Label htmlFor="documentId">Document ID</Label>
              </div>

              {['Published HPD', 'Verified HPD'].includes(formData.hpdType || '') && (
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="inventoryAssessed1000ppm" 
                    checked={formData.inventoryAssessed1000ppm || false}
                    onCheckedChange={(checked) => handleInputChange('inventoryAssessed1000ppm', checked === true)}
                  />
                  <Label htmlFor="inventoryAssessed1000ppm">Inventory assessed at 0,01 wt.% or 1000ppm</Label>
                </div>
              )}

              {['Verified advanced HPD', 'Verified ingredient optimized HPD'].includes(formData.hpdType || '') && (
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="inventoryAssessed100ppm" 
                    checked={formData.inventoryAssessed100ppm || false}
                    onCheckedChange={(checked) => handleInputChange('inventoryAssessed100ppm', checked === true)}
                  />
                  <Label htmlFor="inventoryAssessed100ppm">Inventory assessed at 0,01 wt.% or 100ppm</Label>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="hazardsFullDisclosed" 
                  checked={formData.hazardsFullDisclosed || false}
                  onCheckedChange={(checked) => handleInputChange('hazardsFullDisclosed', checked === true)}
                />
                <Label htmlFor="hazardsFullDisclosed">Hazards full disclosed in compliance with the HPD Open Standard</Label>
              </div>

              {formData.hpdType === 'Verified advanced HPD' && (
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="noGreenScreenLt1Hazards" 
                    checked={formData.noGreenScreenLt1Hazards || false}
                    onCheckedChange={(checked) => handleInputChange('noGreenScreenLt1Hazards', checked === true)}
                  />
                  <Label htmlFor="noGreenScreenLt1Hazards">No GreenScreen LT-1 hazards are present</Label>
                </div>
              )}

              {formData.hpdType === 'Verified ingredient optimized HPD' && (
                <>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="greaterThan95wtAssessed" 
                      checked={formData.greaterThan95wtAssessed || false}
                      onCheckedChange={(checked) => handleInputChange('greaterThan95wtAssessed', checked === true)}
                    />
                    <Label htmlFor="greaterThan95wtAssessed">{'>'}95wt.% is assessed using GreenScreen and no BM-1 hazards are present</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="remaining5PercentInventoried" 
                      checked={formData.remaining5PercentInventoried || false}
                      onCheckedChange={(checked) => handleInputChange('remaining5PercentInventoried', checked === true)}
                    />
                    <Label htmlFor="remaining5PercentInventoried">Remaining 5% is inventoried and no GreenScreen LT-1 hazards are present</Label>
                  </div>
                </>
              )}

              {formData.hpdType !== 'Published HPD' && (
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="externalIndependentReviewer" 
                    checked={formData.externalIndependentReviewer || false}
                    onCheckedChange={(checked) => handleInputChange('externalIndependentReviewer', checked === true)}
                  />
                  <Label htmlFor="externalIndependentReviewer">Identification of external independent reviewer</Label>
                </div>
              )}
            </div>
          </div>
        );

      case 'C2C':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="c2cType">C2C Type</Label>
              <Select value={formData.c2cType || ''} onValueChange={(value) => handleInputChange('c2cType', value)}>
                <SelectTrigger className="bg-[#323232] border-[#424242] text-white">
                  <SelectValue placeholder="Select C2C type" />
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
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cleanAirClimateProtection">Clean Air and Climate Protection</Label>
                <Select value={formData.cleanAirClimateProtection || ''} onValueChange={(value) => handleInputChange('cleanAirClimateProtection', value)}>
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
                <Label htmlFor="waterSoilStewardship">Water and Soil Stewardship</Label>
                <Select value={formData.waterSoilStewardship || ''} onValueChange={(value) => handleInputChange('waterSoilStewardship', value)}>
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
                <Label htmlFor="socialFearness">Social Fearness</Label>
                <Select value={formData.socialFearness || ''} onValueChange={(value) => handleInputChange('socialFearness', value)}>
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
                <Label htmlFor="productCircularity">Product Circularity</Label>
                <Select value={formData.productCircularity || ''} onValueChange={(value) => handleInputChange('productCircularity', value)}>
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
            </div>

            <div>
              <Label htmlFor="additionalAchievement">Additional Achievement</Label>
              <Textarea
                id="additionalAchievement"
                value={formData.additionalAchievement || ''}
                onChange={(e) => handleInputChange('additionalAchievement', e.target.value)}
                className="bg-[#323232] border-[#424242] text-white"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="documentId" 
                  checked={formData.documentId || false}
                  onCheckedChange={(checked) => handleInputChange('documentId', checked === true)}
                />
                <Label htmlFor="documentId">Document ID</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="inventoryAssessed1000ppm" 
                  checked={formData.inventoryAssessed1000ppm || false}
                  onCheckedChange={(checked) => handleInputChange('inventoryAssessed1000ppm', checked === true)}
                />
                <Label htmlFor="inventoryAssessed1000ppm">Inventory assessed at 0,1wt.% or 1000ppm</Label>
              </div>
            </div>
          </div>
        );

      case 'Declare':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="declareType">Declare Type</Label>
              <Select value={formData.declareType || ''} onValueChange={(value) => handleInputChange('declareType', value)}>
                <SelectTrigger className="bg-[#323232] border-[#424242] text-white">
                  <SelectValue placeholder="Select Declare type" />
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
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="documentId" 
                  checked={formData.documentId || false}
                  onCheckedChange={(checked) => handleInputChange('documentId', checked === true)}
                />
                <Label htmlFor="documentId">Document ID</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="inventoryAssessed1000ppm" 
                  checked={formData.inventoryAssessed1000ppm || false}
                  onCheckedChange={(checked) => handleInputChange('inventoryAssessed1000ppm', checked === true)}
                />
                <Label htmlFor="inventoryAssessed1000ppm">Inventory assessed at 0,1wt.% or 1000ppm</Label>
              </div>

              {['Verified Declared', 'Verified LBC Compliant (aka LBC Red List Approved)', 'Verified Red List Free (aka LBC Red List Free)'].includes(formData.declareType || '') && (
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="externalIndependentReviewer" 
                    checked={formData.externalIndependentReviewer || false}
                    onCheckedChange={(checked) => handleInputChange('externalIndependentReviewer', checked === true)}
                  />
                  <Label htmlFor="externalIndependentReviewer">Identification of external independent reviewer</Label>
                </div>
              )}
            </div>
          </div>
        );

      case 'Product Circularity':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="reusedOrSalvage">Reused or Salvage</Label>
              <Textarea
                id="reusedOrSalvage"
                value={formData.reusedOrSalvage || ''}
                onChange={(e) => handleInputChange('reusedOrSalvage', e.target.value)}
                className="bg-[#323232] border-[#424242] text-white"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="biobasedRecycledContent">Biobased and Recycled Content (%)</Label>
              <Textarea
                id="biobasedRecycledContent"
                value={formData.biobasedRecycledContent || ''}
                onChange={(e) => handleInputChange('biobasedRecycledContent', e.target.value)}
                className="bg-[#323232] border-[#424242] text-white"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="extendedProducerResponsability">Extended Producer Responsibility Program</Label>
              <Textarea
                id="extendedProducerResponsability"
                value={formData.extendedProducerResponsability || ''}
                onChange={(e) => handleInputChange('extendedProducerResponsability', e.target.value)}
                className="bg-[#323232] border-[#424242] text-white"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="bg-[#323232] border-[#424242] text-white"
                rows={3}
              />
            </div>
          </div>
        );

      case 'Global Green Tag Product Health Declaration':
        return (
          <div className="text-gray-400">
            Este tipo de avaliação não possui campos específicos adicionais.
          </div>
        );

      case 'FSC / PEFC':
        return (
          <div className="text-gray-400">
            Este tipo de avaliação não possui campos específicos adicionais.
          </div>
        );

      case 'ECOLABEL':
        return (
          <div className="text-gray-400">
            Este tipo de avaliação não possui campos específicos adicionais.
          </div>
        );
        
      default:
        return (
          <div className="text-gray-400">
            Selecione um tipo de avaliação para ver os campos específicos.
          </div>
        );
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-[#282828] border-[#424242] text-white">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {evaluation ? 'Editar Avaliação' : 'Nova Avaliação'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Tipo de Avaliação</Label>
              <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                <SelectTrigger className="bg-[#323232] border-[#424242] text-white">
                  <SelectValue placeholder="Selecionar tipo" />
                </SelectTrigger>
                <SelectContent className="bg-[#323232] border-[#424242]">
                  <SelectItem value="EPD">EPD</SelectItem>
                  <SelectItem value="LCA">LCA</SelectItem>
                  <SelectItem value="C2C">C2C</SelectItem>
                  <SelectItem value="Declare">Declare</SelectItem>
                  <SelectItem value="Health Product Declaration">Health Product Declaration</SelectItem>
                  <SelectItem value="Manufacturer Inventory">Manufacturer Inventory</SelectItem>
                  <SelectItem value="REACH Optimization">REACH Optimization</SelectItem>
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
                id="version"
                value={formData.version}
                onChange={(e) => handleInputChange('version', e.target.value)}
                className="bg-[#323232] border-[#424242] text-white"
              />
            </div>

            <div>
              <Label htmlFor="issueDate">Data de Emissão</Label>
              <Input
                id="issueDate"
                type="date"
                value={formData.issueDate}
                onChange={(e) => handleInputChange('issueDate', e.target.value)}
                className="bg-[#323232] border-[#424242] text-white"
              />
            </div>

            <div>
              <Label htmlFor="validTo">Válido Até</Label>
              <Input
                id="validTo"
                type="date"
                value={formData.validTo}
                onChange={(e) => handleInputChange('validTo', e.target.value)}
                className="bg-[#323232] border-[#424242] text-white"
              />
            </div>

            <div>
              <Label htmlFor="geographicArea">Área Geográfica</Label>
              <Input
                id="geographicArea"
                value={formData.geographicArea}
                onChange={(e) => handleInputChange('geographicArea', e.target.value)}
                className="bg-[#323232] border-[#424242] text-white"
              />
            </div>

            <div>
              <Label htmlFor="fileName">Nome do Ficheiro</Label>
              <Input
                id="fileName"
                value={formData.fileName}
                onChange={(e) => handleInputChange('fileName', e.target.value)}
                className="bg-[#323232] border-[#424242] text-white"
                placeholder="exemplo.pdf"
              />
            </div>
          </div>

          {/* Conformity Section */}
          <Card className="bg-[#323232] border-[#424242]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-4">
                Conformidade
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="manualConformity" 
                    checked={manualConformity}
                    onCheckedChange={handleManualConformityChange}
                  />
                  <Label htmlFor="manualConformity" className="text-sm">Edição Manual</Label>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.conformity}
                  onChange={(e) => handleInputChange('conformity', parseInt(e.target.value) || 0)}
                  className="bg-[#424242] border-[#525252] text-white w-24"
                  disabled={!manualConformity}
                />
                <span className="text-white">%</span>
                {!manualConformity && (
                  <span className="text-gray-400 text-sm">
                    (Calculado automaticamente baseado nos campos preenchidos)
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Type-specific fields */}
          <Card className="bg-[#323232] border-[#424242]">
            <CardHeader>
              <CardTitle className="text-white">Campos Específicos</CardTitle>
            </CardHeader>
            <CardContent>
              {renderFieldsByType()}
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-2 pt-4 border-t border-[#424242]">
            <Button type="button" variant="outline" onClick={onClose} className="border-[#525252] text-white hover:bg-[#424242]">
              Cancelar
            </Button>
            <Button type="submit" className="bg-[#358C48] hover:bg-[#4ea045]">
              {evaluation ? 'Atualizar Avaliação' : 'Adicionar Avaliação'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
