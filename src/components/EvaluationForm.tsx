
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
  const [formData, setFormData] = useState({
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
    }
  }, [evaluation]);

  const calculateAutoConformity = () => {
    // Simplified conformity calculation based on boolean fields
    const booleanFields = Object.entries(formData).filter(([key, value]) => 
      typeof value === 'boolean' && !['manualConformity'].includes(key)
    );
    
    if (booleanFields.length === 0) return 100;
    
    const trueCount = booleanFields.filter(([key, value]) => value === true).length;
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
      id: evaluation?.id || Date.now() + Math.random()
    };
    
    onSave(evaluationData);
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
                <Label htmlFor="epdOwner">EPD Owner</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="programOperator" 
                  checked={formData.programOperator || false}
                  onCheckedChange={(checked) => handleInputChange('programOperator', checked)}
                />
                <Label htmlFor="programOperator">Program Operator</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="referencePcr" 
                  checked={formData.referencePcr || false}
                  onCheckedChange={(checked) => handleInputChange('referencePcr', checked)}
                />
                <Label htmlFor="referencePcr">Reference PCR</Label>
              </div>
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
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
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
                  id="inventoryAssessed" 
                  checked={formData.inventoryAssessed || false}
                  onCheckedChange={(checked) => handleInputChange('inventoryAssessed', checked)}
                />
                <Label htmlFor="inventoryAssessed">Inventory assessed at 0,1wt.% or 1000ppm</Label>
              </div>
            </div>
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
                    onCheckedChange={setManualConformity}
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
