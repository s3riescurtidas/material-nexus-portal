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
      console.log('MaterialForm - Loading material for editing:', material);
      // Ensure evaluations is always an array
      const evaluations = Array.isArray(material.evaluations) ? material.evaluations : [];
      setFormData({
        name: material.name || '',
        manufacturer: material.manufacturer || '',
        category: material.category || '',
        subcategory: material.subcategory || '',
        description: material.description || '',
        evaluations: evaluations
      });
      console.log('MaterialForm - Loaded evaluations:', evaluations);
      console.log('MaterialForm - Form data after loading:', {
        name: material.name,
        manufacturer: material.manufacturer,
        category: material.category,
        subcategory: material.subcategory
      });
    } else {
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
      console.log('MaterialForm - Config loaded:', dbConfig);
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('MaterialForm - Submitting material with data:', formData);
    console.log('MaterialForm - Material being edited:', material);
    
    try {
      if (material) {
        // Editing existing material - ensure evaluations is always an array
        const safeEvaluations = Array.isArray(formData.evaluations) ? formData.evaluations : [];
        
        const updatedMaterial = {
          id: material.id,
          name: formData.name,
          manufacturer: formData.manufacturer,
          category: formData.category,
          subcategory: formData.subcategory,
          description: formData.description,
          evaluations: safeEvaluations,
          createdAt: material.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        console.log('MaterialForm - Updating existing material with:', updatedMaterial);
        await localDB.updateMaterial(updatedMaterial);
        console.log('MaterialForm - Material updated successfully in database');
        onSave(updatedMaterial);
        console.log('MaterialForm - onSave called with updated material');
        onClose(); // Close the form after successful save
      } else {
        // Creating new material
        console.log('MaterialForm - Creating new material:', formData);
        const materialId = await localDB.addMaterial(formData);
        const newMaterial = { 
          ...formData, 
          id: materialId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        onSave(newMaterial);
        onClose(); // Close the form after successful save
      }
    } catch (error) {
      console.error('MaterialForm - Error saving material:', error);
    }
  };

  const handleInputChange = (field, value) => {
    console.log(`MaterialForm - Changing ${field} to:`, value);
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addEvaluation = (type) => {
    const newEvaluation = {
      id: Date.now(),
      type,
      version: '',
      issueDate: '',
      validTo: '',
      conformity: 0,
      geographicArea: 'Global',
      ...getInitialEvaluationFields(type)
    };
    
    console.log('MaterialForm - Adding new evaluation:', newEvaluation);
    
    setFormData(prev => {
      const safeEvaluations = Array.isArray(prev.evaluations) ? prev.evaluations : [];
      const updatedEvaluations = [...safeEvaluations, newEvaluation];
      console.log('MaterialForm - Updated evaluations after add:', updatedEvaluations);
      return {
        ...prev,
        evaluations: updatedEvaluations
      };
    });
    
    const currentEvaluationsLength = Array.isArray(formData.evaluations) ? formData.evaluations.length : 0;
    setActiveEvaluationIndex(currentEvaluationsLength);
  };

  const removeEvaluation = (index) => {
    console.log('MaterialForm - Removing evaluation at index:', index);
    console.log('MaterialForm - Current evaluations before remove:', formData.evaluations);
    
    setFormData(prev => {
      const safeEvaluations = Array.isArray(prev.evaluations) ? prev.evaluations : [];
      const updatedEvaluations = safeEvaluations.filter((_, i) => i !== index);
      console.log('MaterialForm - Updated evaluations after remove:', updatedEvaluations);
      return {
        ...prev,
        evaluations: updatedEvaluations
      };
    });
    
    if (activeEvaluationIndex === index) {
      setActiveEvaluationIndex(-1);
    } else if (activeEvaluationIndex > index) {
      setActiveEvaluationIndex(activeEvaluationIndex - 1);
    }
  };

  const updateEvaluation = (index, updatedData) => {
    console.log('MaterialForm - Updating evaluation at index:', index);
    console.log('MaterialForm - Update data received:', updatedData);
    console.log('MaterialForm - Current evaluations before update:', formData.evaluations);
    
    setFormData(prev => {
      const safeEvaluations = Array.isArray(prev.evaluations) ? prev.evaluations : [];
      const updatedEvaluations = [...safeEvaluations];
      updatedEvaluations[index] = {
        ...updatedEvaluations[index],
        ...updatedData
      };
      
      console.log('MaterialForm - Updated evaluation at index', index, ':', updatedEvaluations[index]);
      console.log('MaterialForm - All evaluations after update:', updatedEvaluations);
      
      return {
        ...prev,
        evaluations: updatedEvaluations
      };
    });
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
    const safeEvaluations = Array.isArray(formData.evaluations) ? formData.evaluations : [];
    const sameTypeCount = safeEvaluations.filter((ev, i) => i <= index && ev.type === evaluation.type).length;
    
    if (sameTypeCount > 1 || version) {
      return `${evaluation.type}${version || ` #${sameTypeCount}`}`;
    }
    
    return evaluation.type;
  };

  const handleCategoryChange = (value) => {
    console.log('MaterialForm - Category changed to:', value);
    setFormData(prev => ({
      ...prev,
      category: value,
      subcategory: ''
    }));
  };

  const availableSubcategories = formData.category ? config.subcategories[formData.category] || [] : [];
  const safeEvaluations = Array.isArray(formData.evaluations) ? formData.evaluations : [];

  console.log('MaterialForm - Current form state:', formData);
  console.log('MaterialForm - Current evaluations:', safeEvaluations);
  console.log('MaterialForm - Active evaluation index:', activeEvaluationIndex);
  console.log('MaterialForm - Available subcategories for category', formData.category, ':', availableSubcategories);

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
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#323232] border-[#424242] z-50">
                  {config.manufacturers.map(mfg => (
                    <SelectItem key={mfg} value={mfg} className="text-white hover:bg-[#424242]">{mfg}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={handleCategoryChange}>
                <SelectTrigger className="bg-[#323232] border-[#424242] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#323232] border-[#424242] z-50">
                  {config.categories.map(cat => (
                    <SelectItem key={cat} value={cat} className="text-white hover:bg-[#424242]">{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="subcategory" className="text-white">Subcategoria</Label>
              <Select value={formData.subcategory} onValueChange={(value) => handleInputChange('subcategory', value)}>
                <SelectTrigger className="bg-[#323232] border-[#424242] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#323232] border-[#424242] z-50">
                  {availableSubcategories.map(sub => (
                    <SelectItem key={sub} value={sub} className="text-white hover:bg-[#424242]">{sub}</SelectItem>
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

            {safeEvaluations.length > 0 && (
              <Tabs value={activeEvaluationIndex.toString()} onValueChange={(value) => setActiveEvaluationIndex(parseInt(value))}>
                <TabsList className="bg-[#323232] mb-4 flex-wrap">
                  {safeEvaluations.map((evaluation, index) => (
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

                {safeEvaluations.map((evaluation, index) => (
                  <TabsContent key={evaluation.id || index} value={index.toString()}>
                    <EvaluationForm
                      evaluation={evaluation}
                      onClose={() => setActiveEvaluationIndex(-1)}
                      onSave={(updatedEvaluation) => {
                        console.log('MaterialForm - EvaluationForm onSave called with:', updatedEvaluation);
                        updateEvaluation(index, updatedEvaluation);
                      }}
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
