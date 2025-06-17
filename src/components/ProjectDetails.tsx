import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Eye, FileText } from "lucide-react";
import { MaterialDetails } from "@/components/MaterialDetails";
import { EvaluationDetails } from "@/components/EvaluationDetails";

interface ProjectMaterial {
  id: string;
  name: string;
  manufacturer: string;
  quantity_m2?: number;
  quantity_m3?: number;
  units?: number;
}

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
  startDate: string;
  endDate: string;
  materials: ProjectMaterial[];
}

interface ProjectDetailsProps {
  project: Project;
  onClose: () => void;
  materials: Material[];
  onEditMaterial?: (material: Material) => void;
  onDeleteMaterial?: (materialId: number) => void;
}

export function ProjectDetails({ project, onClose, materials, onEditMaterial, onDeleteMaterial }: ProjectDetailsProps) {
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);

  const normalizeText = (text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, '')
      .trim();
  };

  const findMaterialInDatabase = (projectMaterial: ProjectMaterial) => {
    return materials.find(material => {
      const normalizedProjectName = normalizeText(projectMaterial.name);
      const normalizedProjectManufacturer = normalizeText(projectMaterial.manufacturer);
      const normalizedMaterialName = normalizeText(material.name);
      const normalizedMaterialManufacturer = normalizeText(material.manufacturer);
      
      return normalizedProjectName === normalizedMaterialName && 
             normalizedProjectManufacturer === normalizedMaterialManufacturer;
    });
  };

  const getEvaluationColor = (evaluation: Evaluation, projectStart: string, projectEnd: string) => {
    const evaluationStart = new Date(evaluation.issueDate);
    const evaluationEnd = new Date(evaluation.validTo);
    const projStart = new Date(projectStart);
    const projEnd = new Date(projectEnd);

    if (evaluationEnd >= projStart && evaluationStart <= projEnd) {
      return "text-green-400"; // Valid during project
    } else if (evaluationEnd < projStart) {
      return "text-red-400"; // Expired before project
    } else if (evaluationStart > projEnd) {
      return "text-blue-400"; // Valid after project
    }
    return "text-purple-400";
  };

  const getQuantityDisplay = (material: ProjectMaterial) => {
    if (material.quantity_m2) return `${material.quantity_m2} m²`;
    if (material.quantity_m3) return `${material.quantity_m3} m³`;
    if (material.units) return `${material.units} unidades`;
    return "N/A";
  };

  const openFileExplorer = (fileName: string) => {
    try {
      // For web applications, we'll try to download the file
      const link = document.createElement('a');
      link.href = `/evaluations/${fileName}`;
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erro ao abrir ficheiro:', error);
      alert('Erro ao abrir o ficheiro. Verifique se o ficheiro existe.');
    }
  };

  const sortedProjectMaterials = [...project.materials].sort((a, b) => a.id.localeCompare(b.id));

  if (selectedEvaluation) {
    return (
      <EvaluationDetails
        evaluation={selectedEvaluation}
        onClose={() => setSelectedEvaluation(null)}
        onOpenFile={openFileExplorer}
      />
    );
  }

  if (selectedMaterial) {
    return (
      <MaterialDetails 
        material={selectedMaterial} 
        onClose={() => setSelectedMaterial(null)}
        onEdit={() => {
          if (onEditMaterial) {
            onEditMaterial(selectedMaterial);
          }
          setSelectedMaterial(null);
        }}
        onDelete={() => {
          if (onDeleteMaterial) {
            onDeleteMaterial(selectedMaterial.id);
          }
          setSelectedMaterial(null);
        }}
        onOpenFile={openFileExplorer}
        onMaterialUpdate={(updatedMaterial) => {
          setSelectedMaterial(updatedMaterial);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#282828] text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="bg-[#323232] border-[#424242] hover:bg-[#424242]"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-3xl font-bold">{project.name}</h1>
          </div>
        </div>

        {/* Project Information */}
        <Card className="bg-[#323232] border-[#424242] mb-6">
          <CardHeader>
            <CardTitle className="text-white">Informações do Projeto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-300">Nome</label>
                <p className="text-white">{project.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300">Data de Início</label>
                <p className="text-white">{new Date(project.startDate).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300">Descrição</label>
                <p className="text-white">{project.description}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300">Data de Fim</label>
                <p className="text-white">{new Date(project.endDate).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Project Materials */}
        <Card className="bg-[#323232] border-[#424242]">
          <CardHeader>
            <CardTitle className="text-white">Materiais do Projeto ({project.materials.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {project.materials.length === 0 ? (
              <p className="text-gray-400">Nenhum material no projeto</p>
            ) : (
              <div className="space-y-4">
                {sortedProjectMaterials.map((projectMaterial) => {
                  const dbMaterial = findMaterialInDatabase(projectMaterial);
                  const isInDatabase = !!dbMaterial;
                  
                  return (
                    <div 
                      key={projectMaterial.id}
                      className={`rounded-lg p-4 border ${
                        isInDatabase 
                          ? 'bg-[#424242] border-[#525252]' 
                          : 'bg-[#8C3535] border-[#a04545]'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-bold text-white">{projectMaterial.name}</h3>
                            {!isInDatabase && (
                              <span className="text-xs bg-red-600 text-white px-2 py-1 rounded">
                                Não encontrado na base de dados
                              </span>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-300">ID:</span>
                              <span className="text-white ml-2">{projectMaterial.id}</span>
                            </div>
                            <div>
                              <span className="text-gray-300">Fabricante:</span>
                              <span className="text-white ml-2">{projectMaterial.manufacturer}</span>
                            </div>
                            <div>
                              <span className="text-gray-300">Quantidade:</span>
                              <span className="text-white ml-2">{getQuantityDisplay(projectMaterial)}</span>
                            </div>
                            {isInDatabase && dbMaterial && (
                              <div>
                                <span className="text-gray-300">Categoria:</span>
                                <span className="text-white ml-2">{dbMaterial.category}</span>
                              </div>
                            )}
                          </div>

                          {isInDatabase && dbMaterial && dbMaterial.description && (
                            <div className="mt-2">
                              <span className="text-gray-300 text-sm">Descrição:</span>
                              <span className="text-white ml-2 text-sm">{dbMaterial.description}</span>
                            </div>
                          )}

                          {/* Evaluations */}
                          {isInDatabase && dbMaterial && dbMaterial.evaluations.length > 0 && (
                            <div className="mt-3">
                              <span className="text-gray-300 text-sm">Avaliações:</span>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {dbMaterial.evaluations.map((evaluation) => (
                                  <button
                                    key={evaluation.id}
                                    onClick={() => setSelectedEvaluation(evaluation)}
                                    className={`text-xs px-2 py-1 rounded bg-[#525252] hover:bg-[#626262] transition-colors ${getEvaluationColor(evaluation, project.startDate, project.endDate)} cursor-pointer`}
                                  >
                                    {evaluation.type} v{evaluation.version}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {isInDatabase && dbMaterial && (
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="bg-[#35568C] hover:bg-[#89A9D2]"
                              onClick={() => setSelectedMaterial(dbMaterial)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
