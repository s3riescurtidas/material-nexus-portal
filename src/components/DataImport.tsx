
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Upload, FileText } from "lucide-react";
import { localDB } from "@/lib/database";

interface DataImportProps {
  onClose: () => void;
  onImportComplete: () => void;
}

export function DataImport({ onClose, onImportComplete }: DataImportProps) {
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('merge');
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const normalizeString = (str: string): string => {
    return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  };

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    
    try {
      const text = await file.text();
      const importedData = JSON.parse(text);
      
      console.log('DataImport - Imported data:', importedData);
      
      if (importMode === 'replace') {
        // Replace all data
        if (importedData.materials) {
          // Clear existing materials and add new ones
          const existingMaterials = await localDB.getMaterials();
          for (const material of existingMaterials) {
            await localDB.deleteMaterial(material.id);
          }
          
          for (const material of importedData.materials) {
            const { id, ...materialData } = material;
            await localDB.addMaterial(materialData);
          }
        }
        
        if (importedData.config) {
          await localDB.saveConfig(importedData.config);
        }
        
        console.log('DataImport - Data replaced successfully');
      } else {
        // Merge data
        const currentConfig = await localDB.getConfig();
        const existingMaterials = await localDB.getMaterials();
        
        // Merge materials
        if (importedData.materials) {
          for (const importedMaterial of importedData.materials) {
            const normalizedImportedName = normalizeString(importedMaterial.name);
            const normalizedImportedManufacturer = normalizeString(importedMaterial.manufacturer);
            
            const existingMaterial = existingMaterials.find(m => 
              normalizeString(m.name) === normalizedImportedName && 
              normalizeString(m.manufacturer) === normalizedImportedManufacturer
            );
            
            if (existingMaterial) {
              // Update existing material with new evaluations
              const mergedEvaluations = [...(existingMaterial.evaluations || [])];
              
              if (importedMaterial.evaluations) {
                for (const importedEval of importedMaterial.evaluations) {
                  const existingEvalIndex = mergedEvaluations.findIndex(e => 
                    e.type === importedEval.type && e.version === importedEval.version
                  );
                  
                  if (existingEvalIndex >= 0) {
                    mergedEvaluations[existingEvalIndex] = importedEval;
                  } else {
                    mergedEvaluations.push(importedEval);
                  }
                }
              }
              
              const updatedMaterial = {
                ...existingMaterial,
                ...importedMaterial,
                id: existingMaterial.id,
                evaluations: mergedEvaluations,
                updatedAt: new Date().toISOString()
              };
              
              await localDB.updateMaterial(updatedMaterial);
            } else {
              // Add new material
              const { id, ...materialData } = importedMaterial;
              await localDB.addMaterial(materialData);
            }
          }
        }
        
        // Merge config
        if (importedData.config) {
          const mergedConfig = {
            manufacturers: [...new Set([...currentConfig.manufacturers, ...(importedData.config.manufacturers || [])])],
            categories: [...new Set([...currentConfig.categories, ...(importedData.config.categories || [])])],
            subcategories: { ...currentConfig.subcategories, ...(importedData.config.subcategories || {}) },
            evaluationTypes: [...new Set([...currentConfig.evaluationTypes, ...(importedData.config.evaluationTypes || [])])]
          };
          
          await localDB.saveConfig(mergedConfig);
        }
        
        console.log('DataImport - Data merged successfully');
      }
      
      onImportComplete();
      onClose();
    } catch (error) {
      console.error('DataImport - Error importing data:', error);
      alert('Erro ao importar dados. Verifique se o ficheiro está no formato correto.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-[#282828] border-[#424242] text-white">
        <DialogHeader>
          <DialogTitle className="text-xl">Importar Dados</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <Label className="text-white mb-3 block">Modo de Importação:</Label>
            <RadioGroup value={importMode} onValueChange={(value: 'replace' | 'merge') => setImportMode(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="merge" id="merge" />
                <Label htmlFor="merge" className="text-white">Adicionar dados (manter existentes)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="replace" id="replace" />
                <Label htmlFor="replace" className="text-white">Substituir todos os dados</Label>
              </div>
            </RadioGroup>
          </div>

          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-[#358C48] bg-[#358C48]/10' 
                : 'border-[#424242] hover:border-[#525252]'
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={() => setDragActive(true)}
            onDragLeave={() => setDragActive(false)}
          >
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-300 mb-4">
              Arraste um ficheiro JSON aqui ou clique para selecionar
            </p>
            <input
              type="file"
              accept=".json"
              onChange={handleFileInput}
              className="hidden"
              id="file-input"
            />
            <Button
              type="button"
              variant="outline"
              className="bg-[#358C48] hover:bg-[#4ea045] text-white"
              onClick={() => document.getElementById('file-input')?.click()}
              disabled={isProcessing}
            >
              <Upload className="mr-2 h-4 w-4" />
              {isProcessing ? 'A processar...' : 'Selecionar Ficheiro'}
            </Button>
          </div>

          <div className="flex justify-end space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="border-[#525252] text-white hover:bg-[#424242]"
              disabled={isProcessing}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
