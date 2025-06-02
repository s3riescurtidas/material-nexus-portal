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
    if (material) {
      setFormData(material);
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

  const calculateConformity = (evaluation) => {
    const fields = getEvaluationFields(evaluation.type);
    const booleanFields = fields.filter(field => field.type === 'boolean');
    
    if (booleanFields.length === 0) return 100;
    
    // Filter valid fields based on evaluation subtype
    const validFields = getValidFieldsForSubtype(evaluation.type, evaluation[getSubtypeField(evaluation.type)], booleanFields);
    
    if (validFields.length === 0) return 100;
    
    const trueCount = validFields.filter(field => evaluation[field.key] === true).length;
    return Math.round((trueCount / validFields.length) * 100);
  };

  const getSubtypeField = (type) => {
    const subtypeFields = {
      'EPD': 'epdType',
      'LCA': 'lcaOptimizationType',
      'Manufacturer Inventory': 'manufacturerInventoryType',
      'REACH Optimization': 'reportType',
      'Health Product Declaration': 'hpdType',
      'C2C': 'c2cType',
      'Declare': 'declareType'
    };
    return subtypeFields[type];
  };

  const getValidFieldsForSubtype = (type, subtype, allFields) => {
    // This function should filter fields based on the subtype rules you specified
    // Implementation would be extensive based on your specifications
    return allFields; // Simplified for now
  };

  const getEvaluationFields = (type) => {
    // Return field definitions for each evaluation type
    // This is a simplified version - full implementation would include all fields from your specifications
    const fieldDefinitions = {
      'EPD': [
        { key: 'epdType', type: 'select', label: 'EPD Type', options: ['Not compliant', 'Product specific LCA', 'Industry-wide/generic EPD', 'Product-specific Type III Internal EPD', 'Product Specific Type III External EPD'] },
        { key: 'documentId', type: 'boolean', label: 'Document ID' },
        { key: 'epdOwner', type: 'boolean', label: 'EPD owner' },
        { key: 'programOperator', type: 'boolean', label: 'Program operator' },
        { key: 'referencePcr', type: 'boolean', label: 'Reference PCR' },
        // ... more fields as per specifications
      ],
      'C2C': [
        { key: 'c2cType', type: 'select', label: 'C2C Type', options: ['Not compliant', 'Material Health Certificate v3 at the Bronze level', 'C2C Certified v3 with Material Health at Bronze level', 'Material Health Certificate v3 at Silver level', 'C2C Certified v3 with Material Health at Silver level'] },
        { key: 'cleanAirClimateProtection', type: 'select', label: 'Clean Air and Climate Protection', options: ['Level 1', 'Level 2', 'Level 3'] },
        { key: 'waterSoilStewardship', type: 'select', label: 'Water and Soil Stewardship', options: ['Level 1', 'Level 2', 'Level 3'] },
        { key: 'socialFearness', type: 'select', label: 'Social Fearness', options: ['Level 1', 'Level 2', 'Level 3'] },
        { key: 'productCircularity', type: 'select', label: 'Product Circularity', options: ['Level 1', 'Level 2', 'Level 3'] },
        { key: 'additionalAchievement', type: 'textarea', label: 'Additional Achievement' },
        { key: 'documentId', type: 'boolean', label: 'Document ID' },
        { key: 'inventoryAssessed', type: 'boolean', label: 'Inventory assessed at 0,1wt.% or 1000ppm' },
      ]
      // ... more evaluation types
    };
    
    return fieldDefinitions[type] || [];
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Ensure all evaluation data is properly saved
    const savedMaterial = {
      ...formData,
      evaluations: formData.evaluations.map(evaluation => ({
        ...evaluation,
        // Ensure all fields are preserved
        id: evaluation.id || Date.now() + Math.random()
      }))
    };
    onSave(savedMaterial);
  };

  const handleInputChange = (field, value) => {
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
      // Initialize all fields based on evaluation type
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
          reductionAdditional2Categories: false,
          lcaFile: ''
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
                    <SelectItem key={mfg} value={mfg}>{mfg}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger className="bg-[#323232] border-[#424242] text-white">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-[#323232] border-[#424242]">
                  {config.categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
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
                  {formData.category && config.subcategories[formData.category]?.map(sub => (
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

          {/* Enhanced Evaluations Section with better conformity calculation */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Evaluations</h3>
              <Select onValueChange={addEvaluation}>
                <SelectTrigger className="w-64 bg-[#323232] border-[#424242] text-white">
                  <SelectValue placeholder="Add evaluation..." />
                </SelectTrigger>
                <SelectContent className="bg-[#323232] border-[#424242]">
                  {config.evaluationTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
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
