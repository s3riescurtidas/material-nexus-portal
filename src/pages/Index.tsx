
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, Eye, Edit, Trash2, Folder, FileText } from "lucide-react";
import { MaterialForm } from "@/components/MaterialForm";
import { MaterialDetails } from "@/components/MaterialDetails";
import { ProjectForm } from "@/components/ProjectForm";
import { ProjectDetails } from "@/components/ProjectDetails";
import { DatabaseManagement } from "@/components/DatabaseManagement";
import { localDB } from "@/lib/database";
import { seedDatabase } from "@/lib/seedData";

interface ProjectMaterial {
  id: string;
  name: string;
  manufacturer: string;
  quantity_m2?: number;
  quantity_m3?: number;
  units?: number;
}

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

interface Project {
  id: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  materials: ProjectMaterial[];
}

export default function Index() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [subcategories, setSubcategories] = useState<Record<string, string[]>>({});
  const [evaluationTypes, setEvaluationTypes] = useState<string[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [selectedManufacturer, setSelectedManufacturer] = useState('');
  const [selectedEvaluationType, setSelectedEvaluationType] = useState('');
  
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  const [activeTab, setActiveTab] = useState('search');
  const [isLoading, setIsLoading] = useState(true);

  // Initialize database and load data
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setIsLoading(true);
      await localDB.init();
      await seedDatabase();
      await loadAllData();
    } catch (error) {
      console.error('Failed to initialize app:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllData = async () => {
    try {
      const [dbMaterials, dbProjects, config] = await Promise.all([
        localDB.getMaterials(),
        localDB.getProjects(),
        localDB.getConfig()
      ]);

      setMaterials(dbMaterials);
      setProjects(dbProjects);
      setManufacturers(config.manufacturers);
      setCategories(config.categories);
      setSubcategories(config.subcategories);
      setEvaluationTypes(config.evaluationTypes || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const handleSaveMaterial = async (materialData: any) => {
    try {
      if (editingMaterial) {
        await localDB.updateMaterial({ ...materialData, id: editingMaterial.id });
      } else {
        await localDB.addMaterial(materialData);
      }
      await loadAllData();
      setShowMaterialForm(false);
      setEditingMaterial(null);
    } catch (error) {
      console.error('Failed to save material:', error);
    }
  };

  const handleDeleteMaterial = async (materialId: number) => {
    if (confirm('Tem certeza que deseja excluir este material?')) {
      try {
        await localDB.deleteMaterial(materialId);
        await loadAllData();
        setSelectedMaterial(null);
      } catch (error) {
        console.error('Failed to delete material:', error);
      }
    }
  };

  const handleSaveProject = async (projectData: any) => {
    try {
      await localDB.addProject(projectData);
      await loadAllData();
      setShowProjectForm(false);
    } catch (error) {
      console.error('Failed to save project:', error);
    }
  };

  const handleDeleteProject = async (projectId: number) => {
    if (confirm('Tem certeza que deseja excluir este projeto?')) {
      try {
        await localDB.deleteProject(projectId);
        await loadAllData();
      } catch (error) {
        console.error('Failed to delete project:', error);
      }
    }
  };

  const updateConfig = async (newManufacturers: string[], newCategories: string[], newSubcategories: Record<string, string[]>) => {
    try {
      const config = {
        manufacturers: newManufacturers,
        categories: newCategories,
        subcategories: newSubcategories,
        evaluationTypes: [
          "EPD", "LCA", "Manufacturer Inventory", "REACH Optimization",
          "Health Product Declaration", "C2C", "Declare", "Product Circularity",
          "Global Green Tag Product Health Declaration", "FSC / PEFC", "ECOLABEL"
        ]
      };
      await localDB.saveConfig(config);
      setManufacturers(newManufacturers);
      setCategories(newCategories);
      setSubcategories(newSubcategories);
    } catch (error) {
      console.error('Failed to update config:', error);
    }
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

  const filteredMaterials = materials.filter(material => {
    const searchTermLower = searchTerm.toLowerCase();
    const matchesSearch = material.name.toLowerCase().includes(searchTermLower) ||
                           material.description.toLowerCase().includes(searchTermLower) ||
                           material.manufacturer.toLowerCase().includes(searchTermLower);

    const matchesCategory = !selectedCategory || material.category === selectedCategory;
    const matchesSubcategory = !selectedSubcategory || material.subcategory === selectedSubcategory;
    const matchesManufacturer = !selectedManufacturer || material.manufacturer === selectedManufacturer;
    const matchesEvaluation = !selectedEvaluationType || 
                              material.evaluations.some(evaluation => evaluation.type === selectedEvaluationType);

    return matchesSearch && matchesCategory && matchesSubcategory && matchesManufacturer && matchesEvaluation;
  });

  const sortedMaterials = [...filteredMaterials].sort((a, b) => a.name.localeCompare(b.name));

  const availableSubcategories = selectedCategory ? subcategories[selectedCategory] || [] : [];

  // Reset subcategory when category changes
  useEffect(() => {
    if (selectedCategory && !availableSubcategories.includes(selectedSubcategory)) {
      setSelectedSubcategory('');
    }
  }, [selectedCategory, availableSubcategories, selectedSubcategory]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#282828] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>A inicializar base de dados...</p>
        </div>
      </div>
    );
  }

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

  if (selectedMaterial) {
    return (
      <MaterialDetails 
        material={selectedMaterial} 
        onClose={() => setSelectedMaterial(null)}
        onEdit={() => {
          setEditingMaterial(selectedMaterial);
          setShowMaterialForm(true);
        }}
        onDelete={() => handleDeleteMaterial(selectedMaterial.id)}
        onOpenFile={openFileExplorer}
      />
    );
  }

  if (showProjectForm) {
    return (
      <ProjectForm
        onClose={() => setShowProjectForm(false)}
        onSave={handleSaveProject}
      />
    );
  }

  if (selectedProject) {
    return (
      <ProjectDetails
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
        materials={materials}
        onDeleteMaterial={handleDeleteMaterial}
        onEditMaterial={(material) => {
          setEditingMaterial(material);
          setShowMaterialForm(true);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#282828] text-white">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Sistema de Gestão de Materiais</h1>
          <div className="flex gap-2">
            <Button 
              onClick={() => setShowProjectForm(true)}
              className="bg-[#358C48] hover:bg-[#4ea045]"
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo Projeto
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-[#323232] mb-6">
            <TabsTrigger value="search" className="data-[state=active]:bg-[#424242] text-white">
              <Search className="mr-2 h-4 w-4" />
              Pesquisar Materiais
            </TabsTrigger>
            <TabsTrigger value="projects" className="data-[state=active]:bg-[#424242] text-white">
              <Folder className="mr-2 h-4 w-4" />
              Projetos
            </TabsTrigger>
            <TabsTrigger value="database" className="data-[state=active]:bg-[#424242] text-white">
              Gestão de Base de Dados
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
              <Input
                type="text"
                placeholder="Pesquisar materiais..."
                className="bg-[#323232] border-[#424242] text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select
                className="bg-[#323232] border-[#424242] text-white rounded p-2"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">Todas as Categorias</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <select
                className="bg-[#323232] border-[#424242] text-white rounded p-2"
                value={selectedSubcategory}
                onChange={(e) => setSelectedSubcategory(e.target.value)}
                disabled={!selectedCategory}
              >
                <option value="">Todas as Subcategorias</option>
                {availableSubcategories.map(subcategory => (
                  <option key={subcategory} value={subcategory}>{subcategory}</option>
                ))}
              </select>
              <select
                className="bg-[#323232] border-[#424242] text-white rounded p-2"
                value={selectedManufacturer}
                onChange={(e) => setSelectedManufacturer(e.target.value)}
              >
                <option value="">Todos os Fabricantes</option>
                {manufacturers.map(manufacturer => (
                  <option key={manufacturer} value={manufacturer}>{manufacturer}</option>
                ))}
              </select>
              <select
                className="bg-[#323232] border-[#424242] text-white rounded p-2"
                value={selectedEvaluationType}
                onChange={(e) => setSelectedEvaluationType(e.target.value)}
              >
                <option value="">Todas as Avaliações</option>
                {evaluationTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('');
                  setSelectedSubcategory('');
                  setSelectedManufacturer('');
                  setSelectedEvaluationType('');
                }}
                className="bg-[#8C3535] hover:bg-[#a04545] text-white"
              >
                Limpar Filtros
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedMaterials.map(material => (
                <Card key={material.id} className="bg-[#323232] border-[#424242]">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">{material.name}</CardTitle>
                    <p className="text-gray-300 text-sm">{material.manufacturer}</p>
                    <p className="text-gray-400 text-xs">{material.category} - {material.subcategory}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <h4 className="text-white font-semibold mb-2">Avaliações:</h4>
                      {material.evaluations.length > 0 ? (
                        <div className="space-y-2">
                          {material.evaluations.map((evaluation, index) => (
                            <div key={index} className="bg-[#424242] p-2 rounded text-sm">
                              <div className="flex justify-between items-center">
                                <span className="text-white font-medium">{evaluation.type}</span>
                                <span className={`px-2 py-1 rounded text-xs ${
                                  evaluation.conformity >= 80 ? 'bg-green-600 text-white' :
                                  evaluation.conformity >= 50 ? 'bg-yellow-600 text-white' :
                                  'bg-red-600 text-white'
                                }`}>
                                  {evaluation.conformity}%
                                </span>
                              </div>
                              <div className="text-gray-300 text-xs mt-1">
                                <p>Versão: {evaluation.version}</p>
                                <p>Válido até: {evaluation.validTo}</p>
                                {evaluation.fileName && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="mt-1 bg-[#35568C] hover:bg-[#89A9D2] text-white text-xs"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openFileExplorer(evaluation.fileName!);
                                    }}
                                  >
                                    <FileText className="mr-1 h-3 w-3" />
                                    Ver Ficheiro
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-400 text-sm">Nenhuma avaliação</p>
                      )}
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full bg-[#35568C] hover:bg-[#89A9D2] text-white"
                      onClick={() => setSelectedMaterial(material)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Ver Detalhes
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="projects">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {projects.map(project => (
                <Card key={project.id} className="bg-[#323232] border-[#424242]">
                  <CardHeader>
                    <CardTitle className="text-white">{project.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-400">{project.description}</p>
                    <Button
                      variant="outline"
                      className="w-full mt-4 bg-[#35568C] hover:bg-[#89A9D2]"
                      onClick={() => setSelectedProject(project)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Ver Detalhes
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full mt-2 bg-[#8C3535] hover:bg-[#a04545]"
                      onClick={() => handleDeleteProject(project.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir Projeto
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="database">
            <DatabaseManagement
              materials={materials}
              manufacturers={manufacturers}
              categories={categories}
              subcategories={subcategories}
              onEditMaterial={(material) => {
                setEditingMaterial(material);
                setShowMaterialForm(true);
              }}
              onDeleteMaterial={handleDeleteMaterial}
              onAddMaterial={() => setShowMaterialForm(true)}
              onUpdateManufacturers={(newManufacturers) => updateConfig(newManufacturers, categories, subcategories)}
              onUpdateCategories={(newCategories) => updateConfig(manufacturers, newCategories, subcategories)}
              onUpdateSubcategories={(newSubcategories) => updateConfig(manufacturers, categories, newSubcategories)}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
