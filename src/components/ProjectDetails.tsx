

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Edit, Trash2, Plus, FileText, Download } from "lucide-react";
import { MaterialForm } from "./MaterialForm";
import { EvaluationDetails } from "./EvaluationDetails";
import { localDB } from "@/lib/database";

interface Evaluation {
  id: string;
  type: string;
  version: string;
  issueDate: string;
  validTo: string;
  conformity: number;
  geographicArea: string;
  fileName?: string;
  [key: string]: any;
}

interface Material {
  id: number;
  name: string;
  manufacturer: string;
  category: string;
  subcategory: string;
  description: string;
  evaluations: Evaluation[];
  createdAt?: string;
  updatedAt?: string;
}

interface Project {
  id: number;
  name: string;
  description: string;
  materials: Material[];
  createdAt: string;
  updatedAt: string;
  startDate?: string;
  endDate?: string;
}

interface ProjectDetailsProps {
  project: Project;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onProjectUpdate: (updatedProject: Project) => void;
}

export function ProjectDetails({ 
  project, 
  onClose, 
  onEdit, 
  onDelete,
  onProjectUpdate
}: ProjectDetailsProps) {
  const [currentProject, setCurrentProject] = useState<Project>(project);
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);

  const handleAddMaterial = () => {
    setEditingMaterial(null);
    setShowMaterialForm(true);
  };

  const handleEditMaterial = (material: Material) => {
    setEditingMaterial(material);
    setShowMaterialForm(true);
  };

  const handleDeleteMaterial = async (materialId: number) => {
    if (confirm('Tem certeza que deseja excluir este material?')) {
      try {
        const updatedMaterials = currentProject.materials.filter(m => m.id !== materialId);
        const updatedProject = {
          ...currentProject,
          materials: updatedMaterials,
          updatedAt: new Date().toISOString()
        };
        
        // Convert to DB format with required fields
        const dbProject = {
          id: updatedProject.id,
          name: updatedProject.name,
          description: updatedProject.description,
          startDate: updatedProject.startDate || new Date().toISOString(),
          endDate: updatedProject.endDate || new Date().toISOString(),
          createdAt: updatedProject.createdAt,
          updatedAt: updatedProject.updatedAt,
          materials: updatedProject.materials.map(m => ({
            id: String(m.id),
            name: m.name,
            manufacturer: m.manufacturer,
            quantity_m2: 0,
            quantity_m3: 0,
            units: 0
          }))
        };
        
        await localDB.updateProject(dbProject);
        
        setCurrentProject(updatedProject);
        onProjectUpdate(updatedProject);
      } catch (error) {
        console.error('Error deleting material:', error);
      }
    }
  };

  const handleSaveMaterial = async (materialData: any) => {
    try {
      let updatedMaterials;
      
      if (editingMaterial) {
        // Update existing material
        const materialIndex = currentProject.materials.findIndex(m => m.id === editingMaterial.id);
        updatedMaterials = [...currentProject.materials];
        updatedMaterials[materialIndex] = {
          ...editingMaterial,
          ...materialData,
          updatedAt: new Date().toISOString()
        };
      } else {
        // Add new material
        const newMaterial = {
          ...materialData,
          id: Date.now(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        updatedMaterials = [...currentProject.materials, newMaterial];
      }
      
      const updatedProject = {
        ...currentProject,
        materials: updatedMaterials,
        updatedAt: new Date().toISOString()
      };
      
      // Convert to DB format with required fields
      const dbProject = {
        id: updatedProject.id,
        name: updatedProject.name,
        description: updatedProject.description,
        startDate: updatedProject.startDate || new Date().toISOString(),
        endDate: updatedProject.endDate || new Date().toISOString(),
        createdAt: updatedProject.createdAt,
        updatedAt: updatedProject.updatedAt,
        materials: updatedProject.materials.map(m => ({
          id: String(m.id),
          name: m.name,
          manufacturer: m.manufacturer,
          quantity_m2: 0,
          quantity_m3: 0,
          units: 0
        }))
      };
      
      await localDB.updateProject(dbProject);
      
      setCurrentProject(updatedProject);
      onProjectUpdate(updatedProject);
      setShowMaterialForm(false);
      setEditingMaterial(null);
    } catch (error) {
      console.error('Error saving material:', error);
    }
  };

  const handleMaterialUpdate = (updatedMaterial: Material) => {
    const materialIndex = currentProject.materials.findIndex(m => m.id === updatedMaterial.id);
    if (materialIndex >= 0) {
      const updatedMaterials = [...currentProject.materials];
      updatedMaterials[materialIndex] = updatedMaterial;
      const updatedProject = {
        ...currentProject,
        materials: updatedMaterials,
        updatedAt: new Date().toISOString()
      };
      setCurrentProject(updatedProject);
      onProjectUpdate(updatedProject);
    }
  };

  const handleEvaluationClick = (evaluation: Evaluation) => {
    setSelectedEvaluation(evaluation);
  };

  const handleExportProject = () => {
    const dataStr = JSON.stringify(currentProject, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentProject.name.replace(/\s+/g, '_')}_project.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (showMaterialForm) {
    return (
      <MaterialForm
        material={editingMaterial}
        onClose={() => {
          setShowMaterialForm(false);
          setEditingMaterial(null);
        }}
        onSave={handleSaveMaterial}
      />
    );
  }

  if (selectedEvaluation) {
    return (
      <EvaluationDetails
        evaluation={selectedEvaluation}
        onClose={() => setSelectedEvaluation(null)}
      />
    );
  }

  const getConformityBadge = (conformity: number) => {
    if (conformity >= 80) return 'bg-green-600';
    if (conformity >= 50) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  const totalMaterials = currentProject.materials.length;
  const totalEvaluations = currentProject.materials.reduce((sum, material) => sum + material.evaluations.length, 0);
  const avgConformity = totalEvaluations > 0 
    ? Math.round(currentProject.materials.reduce((sum, material) => 
        sum + material.evaluations.reduce((evalSum, evaluation) => evalSum + evaluation.conformity, 0), 0) / totalEvaluations)
    : 0;

  return (
    <div className="min-h-screen bg-[#282828] text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button 
            onClick={onClose}
            variant="outline"
            className="bg-[#323232] border-[#424242] text-white hover:bg-[#424242]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div className="flex gap-2">
            <Button 
              onClick={handleExportProject}
              variant="outline"
              className="bg-[#358C48] hover:bg-[#4ea045] text-white"
            >
              <Download className="mr-2 h-4 w-4" />
              Exportar Projeto
            </Button>
            <Button 
              onClick={handleAddMaterial}
              className="bg-[#358C48] hover:bg-[#4ea045]"
            >
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Material
            </Button>
            <Button 
              onClick={onEdit}
              variant="outline"
              className="bg-[#35568C] hover:bg-[#89A9D2] text-white"
            >
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
            <Button 
              onClick={onDelete}
              variant="outline"
              className="bg-[#8C3535] hover:bg-[#a04545] text-white"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </Button>
          </div>
        </div>

        <Card className="bg-[#323232] border-[#424242] mb-6">
          <CardHeader>
            <CardTitle className="text-white text-2xl">{currentProject.name}</CardTitle>
            <p className="text-gray-300">ID: {currentProject.id}</p>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 mb-4">{currentProject.description}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{totalMaterials}</p>
                <p className="text-gray-400">Materiais</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{totalEvaluations}</p>
                <p className="text-gray-400">Avaliações</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{avgConformity}%</p>
                <p className="text-gray-400">Conformidade Média</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#323232] border-[#424242]">
          <CardHeader>
            <CardTitle className="text-white">Materiais do Projeto</CardTitle>
          </CardHeader>
          <CardContent>
            {currentProject.materials.length === 0 ? (
              <p className="text-gray-400">Nenhum material encontrado.</p>
            ) : (
              <div className="space-y-4">
                {currentProject.materials.map((material) => (
                  <Card key={material.id} className="bg-[#424242] border-[#525252]">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-white font-semibold text-lg">{material.name}</h3>
                          <p className="text-gray-300">{material.manufacturer}</p>
                          <p className="text-gray-400 text-sm">{material.category} - {material.subcategory}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-[#358C48] hover:bg-[#4ea045] text-white"
                            onClick={() => handleEditMaterial(material)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-[#8C3535] hover:bg-[#a04545] text-white"
                            onClick={() => handleDeleteMaterial(material.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-gray-300 text-sm mb-3">{material.description}</p>
                      
                      <div>
                        <p className="text-gray-400 text-sm mb-2">Avaliações ({material.evaluations.length})</p>
                        {material.evaluations.length === 0 ? (
                          <p className="text-gray-500 text-sm">Nenhuma avaliação</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {material.evaluations.map((evaluation) => (
                              <button
                                key={evaluation.id}
                                onClick={() => handleEvaluationClick(evaluation)}
                                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getConformityBadge(evaluation.conformity)} text-white hover:opacity-80 transition-opacity`}
                              >
                                {evaluation.type} - {evaluation.conformity}%
                                {evaluation.fileName && (
                                  <FileText className="ml-1 h-3 w-3" />
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
