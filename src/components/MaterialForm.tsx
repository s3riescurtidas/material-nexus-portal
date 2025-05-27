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

export function MaterialForm({ material, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    manufacturer: '',
    category: '',
    subcategory: '',
    description: '',
    evaluations: []
  });

  const [activeEvaluationIndex, setActiveEvaluationIndex] = useState(-1);

  useEffect(() => {
    if (material) {
      setFormData(material);
    }
  }, [material]);

  const manufacturers = ["Madeiras & madeira", "Amorim Cimentos", "Test Manufacturer"];
  const categories = ["Wood", "Concrete", "Metal", "Glass"];
  const subcategories = {
    "Wood": ["Treated Wood", "Natural Wood", "Laminated Wood"],
    "Concrete": ["Standard Concrete", "High Performance Concrete"],
    "Metal": ["Steel", "Aluminum", "Copper"],
    "Glass": ["Standard Glass", "Tempered Glass", "Laminated Glass"]
  };

  const evaluationTypes = [
    "EPD", "LCA", "Manufacturer Inventory", "REACH Optimization",
    "Health Product Declaration", "C2C", "Declare", "Product Circularity",
    "Global Green Tag Product Health Declaration", "FSC / PEFC", "ECOLABEL"
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addEvaluation = (type) => {
    const newEvaluation = {
      id: Date.now(), // Add unique ID for each evaluation
      type,
      version: '',
      issueDate: '',
      validTo: '',
      conformity: 0,
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
        i === index ? evaluationData : currentEvaluation
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
          <DialogTitle className="text-xl">
            {material ? 'Edit Material' : 'Add New Material'}
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
                  {manufacturers.map(mfg => (
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
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="subcategory">Subcategory</Label>
              <Select value={formData.subcategory} onValueChange={(value) => handleInputChange('subcategory', value)}>
                <SelectTrigger className="bg-[#323232] border-[#424242] text-white">
                  <SelectValue placeholder="Select subcategory" />
                </SelectTrigger>
                <SelectContent className="bg-[#323232] border-[#424242]">
                  {formData.category && subcategories[formData.category]?.map(sub => (
                    <SelectItem key={sub} value={sub}>{sub}</SelectItem>
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

          {/* Enhanced Evaluations Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Evaluations</h3>
              <Select onValueChange={addEvaluation}>
                <SelectTrigger className="w-64 bg-[#323232] border-[#424242] text-white">
                  <SelectValue placeholder="Add evaluation..." />
                </SelectTrigger>
                <SelectContent className="bg-[#323232] border-[#424242]">
                  {evaluationTypes.map(type => (
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
                      onChange={(updatedEvaluation) => updateEvaluation(index, updatedEvaluation)}
                    />
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-[#424242]">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#358C48] hover:bg-[#4ea045]">
              {material ? 'Update Material' : 'Add Material'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
