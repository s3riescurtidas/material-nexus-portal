import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, Filter, Eye, Edit, Trash2, FileText, Download, Upload, Settings } from "lucide-react";
import { MaterialForm } from "@/components/MaterialForm";
import { MaterialDetails } from "@/components/MaterialDetails";
import { ProjectForm } from "@/components/ProjectForm";
import { ProjectDetails } from "@/components/ProjectDetails";
import { ProjectUpload } from "@/components/ProjectUpload";
import { EvaluationDetails } from "@/components/EvaluationDetails";
import { DatabaseManagement } from "@/components/DatabaseManagement";
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

export default function Index() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedManufacturer, setSelectedManufacturer] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showProjectUpload, setShowProjectUpload] = useState(false);
  const [showDatabaseManagement, setShowDatabaseManagement] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState('materials');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);

  // Convert database material to component material
  const convertFromDBMaterial = (dbMaterial: any): Material => ({
    ...dbMaterial,
    evaluations: dbMaterial.evaluations.map((dbEval: any) => ({
      ...dbEval,
      id: String(dbEval.id)
    }))
  });

  // Convert database project to component project
  const convertFromDBProject = (dbProject: any): Project => ({
    ...dbProject,
    materials: dbProject.materials?.map((dbMaterial: any) => convertFromDBMaterial(dbMaterial)) || []
  });

  // Initialize database and load data
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setIsLoading(true);
      
      // Load data directly since initializeDatabase might not exist
      await loadData();
      
    } catch (error) {
      console.error('Failed to initialize app:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadData = async () => {
    try {
      const [dbMaterials, dbProjects, config] = await Promise.all([
        localDB.getMaterials(),
        localDB.getProjects(),
        localDB.getConfig()
      ]);

      // Convert database materials to component materials
      const convertedMaterials = dbMaterials.map(convertFromDBMaterial);
      setMaterials(convertedMaterials);
      
      // Convert database projects to component projects
      const convertedProjects = dbProjects.map(convertFromDBProject);
      setProjects(convertedProjects);
      
      setManufacturers(config.manufacturers);
      setCategories(config.categories);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  // Filter materials based on search criteria
  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesManufacturer = !selectedManufacturer || material.manufacturer === selectedManufacturer;
    const matchesCategory = !selectedCategory || material.category === selectedCategory;
    
    return matchesSearch && matchesManufacturer && matchesCategory;
  });

  // Filter projects based on search criteria
  const filteredProjects = projects.filter(project => {
    return project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           project.description.toLowerCase().includes(searchTerm.toLowerCase());
  });

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
        await localDB.deleteMaterial(materialId);
        setMaterials(materials.filter(m => m.id !== materialId));
      } catch (error) {
        console.error('Error deleting material:', error);
      }
    }
  };

  const handleSaveMaterial = async (materialData: any) => {
    try {
      if (editingMaterial) {
        // Update existing material
        const updatedMaterial = await localDB.updateMaterial({
          ...editingMaterial,
          ...materialData
        });
        setMaterials(materials.map(m => 
          m.id === editingMaterial.id ? convertFromDBMaterial(updatedMaterial) : m
        ));
      } else {
        // Add new material
        const materialId = await localDB.addMaterial(materialData);
        const newMaterial = convertFromDBMaterial({ ...materialData, id: materialId });
        setMaterials([...materials, newMaterial]);
      }
      
      setShowMaterialForm(false);
      setEditingMaterial(null);
    } catch (error) {
      console.error('Error saving material:', error);
    }
  };

  const handleAddProject = () => {
    setEditingProject(null);
    setShowProjectForm(true);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setShowProjectForm(true);
  };

  const handleDeleteProject = async (projectId: number) => {
    if (confirm('Tem certeza que deseja excluir este projeto?')) {
      try {
        await localDB.deleteProject(projectId);
        setProjects(projects.filter(p => p.id !== projectId));
      } catch (error) {
        console.error('Error deleting project:', error);
      }
    }
  };

  const handleSaveProject = async (projectData: any) => {
    try {
      if (editingProject) {
        // Update existing project
        const updatedProject = {
          ...editingProject,
          ...projectData,
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
          materials: updatedProject.materials?.map((m: Material) => ({
            id: String(m.id),
            name: m.name,
            manufacturer: m.manufacturer,
            quantity_m2: 0,
            quantity_m3: 0,
            units: 0
          })) || []
        };
        
        await localDB.updateProject(dbProject);
        
        setProjects(projects.map(p => 
          p.id === editingProject.id ? updatedProject : p
        ));
      } else {
        // Add new project
        const newProjectData = {
          name: projectData.name,
          description: projectData.description,
          startDate: projectData.startDate || new Date().toISOString(),
          endDate: projectData.endDate || new Date().toISOString(),
          materials: []
        };
        
        const projectId = await localDB.addProject(newProjectData);
        const newProject = { 
          ...projectData, 
          id: projectId, 
          materials: [], 
          createdAt: new Date().toISOString(), 
          updatedAt: new Date().toISOString() 
        };
        setProjects([...projects, newProject]);
      }
      
      setShowProjectForm(false);
      setEditingProject(null);
    } catch (error) {
      console.error('Error saving project:', error);
    }
  };

  const handleMaterialUpdate = (updatedMaterial: Material) => {
    setMaterials(materials.map(m => 
      m.id === updatedMaterial.id ? updatedMaterial : m
    ));
  };

  const handleProjectUpdate = (updatedProject: Project) => {
    setProjects(projects.map(p => 
      p.id === updatedProject.id ? updatedProject : p
    ));
  };

  const handleEvaluationClick = (evaluation: Evaluation) => {
    setSelectedEvaluation(evaluation);
  };

  const handleOpenFile = (fileName: string) => {
    console.log('Opening file:', fileName);
    // TODO: Implement file opening logic
  };

  const getConformityBadge = (conformity: number) => {
    if (conformity >= 80) return 'bg-green-600';
    if (conformity >= 50) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  const handleExportData = () => {
    const data = {
      materials,
      projects,
      exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `materials_database_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#282828] flex items-center justify-center">
        <div className="text-white text-lg">Carregando...</div>
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

  if (showProjectForm) {
    return (
      <ProjectForm
        onClose={() => {
          setShowProjectForm(false);
          setEditingProject(null);
        }}
        onSave={handleSaveProject}
      />
    );
  }

  if (showProjectUpload) {
    return (
      <ProjectUpload />
    );
  }

  if (showDatabaseManagement) {
    return (
      <DatabaseManagement />
    );
  }

  if (selectedMaterial) {
    return (
      <MaterialDetails
        material={selectedMaterial}
        onClose={() => setSelectedMaterial(null)}
        onEdit={() => {
          setEditingMaterial(selectedMaterial);
          setSelectedMaterial(null);
          setShowMaterialForm(true);
        }}
        onDelete={() => {
          handleDeleteMaterial(selectedMaterial.id);
          setSelectedMaterial(null);
        }}
        onOpenFile={handleOpenFile}
        onMaterialUpdate={handleMaterialUpdate}
      />
    );
  }

  if (selectedProject) {
    return (
      <ProjectDetails
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
        onEdit={() => {
          setEditingProject(selectedProject);
          setSelectedProject(null);
          setShowProjectForm(true);
        }}
        onDelete={() => {
          handleDeleteProject(selectedProject.id);
          setSelectedProject(null);
        }}
        onProjectUpdate={handleProjectUpdate}
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

  return (
    <div className="min-h-screen bg-[#282828] text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Material Database</h1>
          <div className="flex gap-2">
            <Button 
              onClick={handleExportData}
              variant="outline"
              className="bg-[#35568C] hover:bg-[#89A9D2] text-white"
            >
              <Download className="mr-2 h-4 w-4" />
              Exportar Dados
            </Button>
            <Button 
              onClick={() => setShowProjectUpload(true)}
              variant="outline"
              className="bg-[#8C5535] hover:bg-[#D2A489] text-white"
            >
              <Upload className="mr-2 h-4 w-4" />
              Importar Projetos
            </Button>
            <Button 
              onClick={() => setShowDatabaseManagement(true)}
              variant="outline"
              className="bg-[#424242] hover:bg-[#525252] text-white"
            >
              <Settings className="mr-2 h-4 w-4" />
              Gestão de Base de Dados
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-[#323232] mb-6">
            <TabsTrigger value="materials" className="data-[state=active]:bg-[#424242]">
              Materiais ({materials.length})
            </TabsTrigger>
            <TabsTrigger value="projects" className="data-[state=active]:bg-[#424242]">
              Projetos ({projects.length})
            </TabsTrigger>
          </TabsList>

          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Pesquisar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-[#323232] border-[#424242] text-white"
                />
              </div>
            </div>
            
            {activeTab === 'materials' && (
              <>
                <Select value={selectedManufacturer} onValueChange={setSelectedManufacturer}>
                  <SelectTrigger className="w-48 bg-[#323232] border-[#424242] text-white">
                    <SelectValue placeholder="Fabricante" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#323232] border-[#424242]">
                    <SelectItem value="all" className="text-white">Todos os Fabricantes</SelectItem>
                    {manufacturers.map(mfg => (
                      <SelectItem key={mfg} value={mfg} className="text-white">{mfg}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48 bg-[#323232] border-[#424242] text-white">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#323232] border-[#424242]">
                    <SelectItem value="all" className="text-white">Todas as Categorias</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat} className="text-white">{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}

            <Button 
              onClick={activeTab === 'materials' ? handleAddMaterial : handleAddProject}
              className="bg-[#358C48] hover:bg-[#4ea045]"
            >
              <Plus className="mr-2 h-4 w-4" />
              Adicionar {activeTab === 'materials' ? 'Material' : 'Projeto'}
            </Button>
          </div>

          <TabsContent value="materials">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMaterials.map((material) => (
                <Card key={material.id} className="bg-[#323232] border-[#424242] hover:border-[#525252] transition-colors">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">{material.name}</CardTitle>
                    <p className="text-gray-400 text-sm">ID: {material.id}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      <p className="text-gray-300 text-sm"><strong>Fabricante:</strong> {material.manufacturer}</p>
                      <p className="text-gray-300 text-sm"><strong>Categoria:</strong> {material.category}</p>
                      <p className="text-gray-300 text-sm"><strong>Subcategoria:</strong> {material.subcategory}</p>
                      <p className="text-gray-300 text-sm">{material.description}</p>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-gray-400 text-sm mb-2">Avaliações ({material.evaluations.length})</p>
                      <div className="flex flex-wrap gap-1">
                        {material.evaluations.slice(0, 3).map((evaluation) => (
                          <button
                            key={evaluation.id}
                            onClick={() => handleEvaluationClick(evaluation)}
                            className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getConformityBadge(evaluation.conformity)} text-white hover:opacity-80 transition-opacity`}
                          >
                            {evaluation.type}
                            {evaluation.fileName && (
                              <FileText className="ml-1 h-3 w-3" />
                            )}
                          </button>
                        ))}
                        {material.evaluations.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{material.evaluations.length - 3} mais
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-[#35568C] hover:bg-[#89A9D2] text-white"
                        onClick={() => setSelectedMaterial(material)}
                      >
                        <Eye className="mr-1 h-4 w-4" />
                        Ver
                      </Button>
                      <div className="flex gap-1">
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
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredMaterials.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg mb-4">Nenhum material encontrado</p>
                <Button onClick={handleAddMaterial} className="bg-[#358C48] hover:bg-[#4ea045]">
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Primeiro Material
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="projects">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => {
                const totalMaterials = project.materials.length;
                const totalEvaluations = project.materials.reduce((sum, material) => sum + material.evaluations.length, 0);
                const avgConformity = totalEvaluations > 0 
                  ? Math.round(project.materials.reduce((sum, material) => 
                      sum + material.evaluations.reduce((evalSum, evaluation) => evalSum + evaluation.conformity, 0), 0) / totalEvaluations)
                  : 0;

                return (
                  <Card key={project.id} className="bg-[#323232] border-[#424242] hover:border-[#525252] transition-colors">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">{project.name}</CardTitle>
                      <p className="text-gray-400 text-sm">ID: {project.id}</p>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-300 text-sm mb-4">{project.description}</p>
                      
                      <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                        <div>
                          <p className="text-lg font-bold text-white">{totalMaterials}</p>
                          <p className="text-xs text-gray-400">Materiais</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-white">{totalEvaluations}</p>
                          <p className="text-xs text-gray-400">Avaliações</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-white">{avgConformity}%</p>
                          <p className="text-xs text-gray-400">Conformidade</p>
                        </div>
                      </div>

                      <div className="flex justify-between">
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-[#35568C] hover:bg-[#89A9D2] text-white"
                          onClick={() => setSelectedProject(project)}
                        >
                          <Eye className="mr-1 h-4 w-4" />
                          Ver
                        </Button>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-[#358C48] hover:bg-[#4ea045] text-white"
                            onClick={() => handleEditProject(project)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-[#8C3535] hover:bg-[#a04545] text-white"
                            onClick={() => handleDeleteProject(project.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredProjects.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg mb-4">Nenhum projeto encontrado</p>
                <Button onClick={handleAddProject} className="bg-[#358C48] hover:bg-[#4ea045]">
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Primeiro Projeto
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
