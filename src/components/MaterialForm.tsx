
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EvaluationForm } from "@/components/EvaluationForm";
import { Plus, Trash2 } from "lucide-react";
import { localDB } from "@/lib/database";

export function MaterialForm({ material, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    manufacturer: '',
    category: '',
    subcategory: '',
    description: '',
    evaluations: []
  });

  const [config, setConfig] = useState({
    manufacturers: [],
    categories: [],
    subcategories: {},
    evaluationTypes: []
  });

  const [activeEvaluationIndex, setActiveEvaluationIndex] = useState(-1);

  useEffect(() => {
    loadConfig();
  }, []);

  useEffect(() => {
    if (material) {
      console.log('Loading material for editing:', material);
      // Ensure all fields are populated, including fallbacks for undefined values
      setFormData({
        name: material.name || '',
        manufacturer: material.manufacturer || '',
        category: material.category || '',
        subcategory: material.subcategory || '',
        description: material.description || '',
        evaluations: material.evaluations || []
      });
    } else {
      // Reset form for new material
      setFormData({
        name: '',
        manufacturer: '',
        category: '',
        subcategory: '',
        description: '',
        evaluations: []
      });
    }
  }, [material]);

  const loadConfig = async () => {
    try {
      const dbConfig = await localDB.getConfig();
      setConfig(dbConfig);
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Saving material with data:', formData);
    
    const savedMaterial = {
      ...formData,
      evaluations: formData.evaluations.map(evaluation => ({
        ...evaluation,
        id: evaluation.id || Date.now() + Math.random()
      }))
    };
    onSave(savedMaterial);
  };

  const handleInputChange = (field, value) => {
    console.log(`Updating ${field} to:`, value);
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addEvaluation = (type) => {
    const newEvaluation = {
      id: Date.now() + Math.random(),
      type,
      version: '',
      issueDate: '',
      validTo: '',
      conformity: 0,
      geographicArea: 'Global',
      ...getInitialEvaluationFields(type)
    };
    
    setFormData(prev => ({
      ...prev,
      evaluations: [...prev.evaluations, newEvaluation]
    }));
    setActiveEvaluationIndex(formData.evaluations.length);
  };

  const removeEvaluation = (index) => {
    setFormData(prev => ({
      ...prev,
      evaluations: prev.evaluations.filter((_, i) => i !== index)
    }));
    setActiveEvaluationIndex(-1);
  };

  const updateEvaluation = (index, evaluationData) => {
    console.log('Updating evaluation at index', index, 'with data:', evaluationData);
    setFormData(prev => ({
      ...prev,
      evaluations: prev.evaluations.map((currentEvaluation, i) => 
        i === index ? { ...currentEvaluation, ...evaluationData } : currentEvaluation
      )
    }));
  };

  const getInitialEvaluationFields = (type) => {
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
          inventoryAssessed01Wt1000ppm: false,
          inventoryAssessed01Wt100ppm: false,
          allIngredientsIdentifiedByName: false,
          allIngredientsIdentifiedByCasrn: false,
          ingredientChemicalRoleAndAmount: false,
          hazardScoreClassDisclosed: false,
          noGreenScreenLt1Hazards: false,
          greaterThan95wtAssessed: false,
          remaining5PercentInventoried: false,
          externalIndependentReviewer: false,
          miFile: ''
        };
      case 'REACH Optimization':
        return {
          ...baseFields,
          reportType: '',
          documentId: false,
          inventoryAssessed001Wt100ppm: false,
          noSubstancesAuthorizationListAnnexXIV: false,
          noSubstancesAuthorizationListAnnexXVII: false,
          noSubstancesSvhcCandidateList: false,
          identificationAuthorReport: false,
          reachFile: ''
        };
      case 'Health Product Declaration':
        return {
          ...baseFields,
          hpdType: '',
          documentId: false,
          inventoryAssessed001Wt1000ppm: false,
          inventoryAssessed001Wt100ppm: false,
          hazardsFullDisclosed: false,
          noGreenScreenLt1Hazards: false,
          greaterThan95wtAssessed: false,
          remaining5PercentInventoried: false,
          externalIndependentReviewer: false,
          hpdFile: ''
        };
      case 'C2C':
        return {
          ...baseFields,
          c2cType: '',
          cleanAirClimateProtectionScore: '',
          waterSoilStewardshipScore: '',
          socialFairnessScore: '',
          productCircularityScore: '',
          additionalAchievement: '',
          documentId: false,
          inventoryAssessed01Wt1000ppm: false,
          c2cFile: ''
        };
      case 'Declare':
        return {
          ...baseFields,
          declareType: '',
          documentId: false,
          inventoryAssessed01Wt1000ppm: false,
          externalIndependentReviewer: false,
          declareFile: ''
        };
      case 'Product Circularity':
        return {
          ...baseFields,
          reusedOrSalvage: '',
          biobasedAndRecycledContent: '',
          extendedProducerResponsabilityProgram: '',
          productCircularityFile: ''
        };
      case 'Global Green Tag Product Health Declaration':
        return {
          ...baseFields,
          geographicArea: '100%',
          conformity: 100,
          ggtphdFile: ''
        };
      case 'FSC / PEFC':
        return {
          ...baseFields,
          geographicArea: '100%',
          conformity: 100,
          fscPefcFile: ''
        };
      case 'ECOLABEL':
        return {
          ...baseFields,
          geographicArea: '100%',
          conformity: 100,
          ecolabelFile: ''
        };
      default:
        return baseFields;
    }
  };

  const getEvaluationDisplayName = (evaluation, index) => {
    const version = evaluation.version ? ` v${evaluation.version}` : '';
    const sameTypeCount = formData.evaluations.filter((ev, i) => i <= index && ev.type === evaluation.type).length;
    
    if (sameTypeCount > 1 || version) {
      return `${evaluation.type}${version || ` #${sameTypeCount}`}`;
    }
    
    return evaluation.type;
  };

  const handleCategoryChange = (value) => {
    setFormData(prev => ({
      ...prev,
      category: value,
      subcategory: ''
    }));
  };

  const availableSubcategories = formData.category ? config.subcategories[formData.category] || [] : [];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#282828] border-[#424242] text-white">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            {material ? 'Editar Material' : 'Adicionar Novo Material'}
            {material && (
              <span className="text-sm bg-[#424242] px-2 py-1 rounded">ID: {material.id}</span>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Material Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="bg-[#323232] border-[#424242] text-white"
                required
              />
            </div>

            <div>
              <Label htmlFor="manufacturer">Manufacturer</Label>
              <Select value={formData.manufacturer} onValueChange={(value) => handleInputChange('manufacturer', value)}>
                <SelectTrigger className="bg-[#323232] border-[#424242] text-white">
                  <SelectValue placeholder="Select manufacturer" />
                </SelectTrigger>
                <SelectContent className="bg-[#323232] border-[#424242]">
                  {config.manufacturers.map(mfg => (
                    <SelectItem key={mfg} value={mfg} className="text-white">{mfg}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={handleCategoryChange}>
                <SelectTrigger className="bg-[#323232] border-[#424242] text-white">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-[#323232] border-[#424242]">
                  {config.categories.map(cat => (
                    <SelectItem key={cat} value={cat} className="text-white">{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="subcategory" className="text-white">Subcategoria</Label>
              <Select value={formData.subcategory} onValueChange={(value) => handleInputChange('subcategory', value)}>
                <SelectTrigger className="bg-[#323232] border-[#424242] text-white">
                  <SelectValue placeholder="Selecionar subcategoria" />
                </SelectTrigger>
                <SelectContent className="bg-[#323232] border-[#424242]">
                  {availableSubcategories.map(sub => (
                    <SelectItem key={sub} value={sub} className="text-white">{sub}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Short Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="bg-[#323232] border-[#424242] text-white"
              rows={3}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Evaluations</h3>
              <Select onValueChange={addEvaluation}>
                <SelectTrigger className="w-64 bg-[#323232] border-[#424242] text-white">
                  <SelectValue placeholder="Add evaluation..." />
                </SelectTrigger>
                <SelectContent className="bg-[#323232] border-[#424242]">
                  {config.evaluationTypes.map(type => (
                    <SelectItem key={type} value={type} className="text-white">{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.evaluations.length > 0 && (
              <Tabs value={activeEvaluationIndex.toString()} onValueChange={(value) => setActiveEvaluationIndex(parseInt(value))}>
                <TabsList className="bg-[#323232] mb-4 flex-wrap">
                  {formData.evaluations.map((evaluation, index) => (
                    <TabsTrigger 
                      key={evaluation.id || index} 
                      value={index.toString()}
                      className="data-[state=active]:bg-[#424242] relative group"
                    >
                      {getEvaluationDisplayName(evaluation, index)}
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="ml-2 h-4 w-4 p-0 hover:bg-[#8C3535] opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeEvaluation(index);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TabsTrigger>
                  ))}
                </TabsList>

                {formData.evaluations.map((evaluation, index) => (
                  <TabsContent key={evaluation.id || index} value={index.toString()}>
                    <EvaluationForm
                      evaluation={evaluation}
                      onClose={() => setActiveEvaluationIndex(-1)}
                      onSave={(updatedEvaluation) => updateEvaluation(index, updatedEvaluation)}
                    />
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-[#424242]">
            <Button type="button" variant="outline" onClick={onClose} className="border-[#525252] text-white hover:bg-[#424242]">
              Cancelar
            </Button>
            <Button type="submit" className="bg-[#358C48] hover:bg-[#4ea045]">
              {material ? 'Atualizar Material' : 'Adicionar Material'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
