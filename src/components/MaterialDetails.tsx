
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Edit, Trash2, Plus, FileText } from "lucide-react";
import { EvaluationForm } from "./EvaluationForm";

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

interface Material {
  id: number;
  name: string;
  manufacturer: string;
  category: string;
  subcategory: string;
  description: string;
  evaluations: Evaluation[];
}

interface MaterialDetailsProps {
  material: Material;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onOpenFile: (fileName: string) => void;
}

export function MaterialDetails({ 
  material, 
  onClose, 
  onEdit, 
  onDelete,
  onOpenFile
}: MaterialDetailsProps) {
  const [showEvaluationForm, setShowEvaluationForm] = useState(false);
  const [editingEvaluation, setEditingEvaluation] = useState<Evaluation | null>(null);

  const handleSaveEvaluation = (evaluationData: any) => {
    // This would normally save to the database
    console.log('Saving evaluation:', evaluationData);
    setShowEvaluationForm(false);
    setEditingEvaluation(null);
  };

  if (showEvaluationForm) {
    return (
      <EvaluationForm
        evaluation={editingEvaluation}
        onClose={() => {
          setShowEvaluationForm(false);
          setEditingEvaluation(null);
        }}
        onSave={handleSaveEvaluation}
      />
    );
  }

  const getConformityColor = (conformity: number) => {
    if (conformity >= 80) return 'text-green-400';
    if (conformity >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getConformityBadge = (conformity: number) => {
    if (conformity >= 80) return 'bg-green-600';
    if (conformity >= 50) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  return (
    <div className="min-h-screen bg-[#282828] text-white p-6">
      <div className="max-w-4xl mx-auto">
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
              onClick={() => setShowEvaluationForm(true)}
              className="bg-[#358C48] hover:bg-[#4ea045]"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova Avaliação
            </Button>
            <Button 
              onClick={onEdit}
              variant="outline"
              className="bg-[#35568C] hover:bg-[#89A9D2] text-white"
            >
              <Edit className="mr-2 h-4 w-4" />
              Editar Material
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
            <CardTitle className="text-white text-2xl">{material.name}</CardTitle>
            <p className="text-gray-300">ID: {material.id}</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-gray-400 text-sm">Fabricante</p>
                <p className="text-white">{material.manufacturer}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Categoria</p>
                <p className="text-white">{material.category}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Subcategoria</p>
                <p className="text-white">{material.subcategory}</p>
              </div>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Descrição</p>
              <p className="text-white">{material.description}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#323232] border-[#424242]">
          <CardHeader>
            <CardTitle className="text-white">Avaliações ({material.evaluations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {material.evaluations.length === 0 ? (
              <p className="text-gray-400">Nenhuma avaliação encontrada.</p>
            ) : (
              <div className="space-y-4">
                {material.evaluations.map((evaluation, index) => (
                  <Card key={index} className="bg-[#424242] border-[#525252]">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-white font-semibold text-lg">{evaluation.type}</h3>
                          <p className="text-gray-300 text-sm">Versão: {evaluation.version}</p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getConformityBadge(evaluation.conformity)} text-white`}>
                            {evaluation.conformity}% Conformidade
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                        <div>
                          <p className="text-gray-400 text-sm">Data de Emissão</p>
                          <p className="text-white">{evaluation.issueDate}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Válido Até</p>
                          <p className="text-white">{evaluation.validTo}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Área Geográfica</p>
                          <p className="text-white">{evaluation.geographicArea}</p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="flex gap-2">
                          {evaluation.fileName && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-[#35568C] hover:bg-[#89A9D2] text-white"
                              onClick={() => onOpenFile(evaluation.fileName!)}
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              Ver Ficheiro
                            </Button>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-[#358C48] hover:bg-[#4ea045] text-white"
                            onClick={() => {
                              setEditingEvaluation(evaluation);
                              setShowEvaluationForm(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-[#8C3535] hover:bg-[#a04545] text-white"
                            onClick={() => {
                              if (confirm('Tem certeza que deseja excluir esta avaliação?')) {
                                // Handle delete evaluation
                                console.log('Delete evaluation:', evaluation.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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
