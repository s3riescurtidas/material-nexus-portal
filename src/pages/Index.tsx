import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Edit, Trash2, Eye, Plus, Upload, Menu, X } from "lucide-react";
import { MaterialForm } from "@/components/MaterialForm";
import { ProjectForm } from "@/components/ProjectForm";
import { MaterialDetails } from "@/components/MaterialDetails";
import { ProjectDetails } from "@/components/ProjectDetails";
import { DatabaseManagement } from "@/components/DatabaseManagement";

interface Evaluation {
  id: number;
  type: string;
  version: string;
  issueDate: string;
  validTo: string;
  conformity: number;
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
  materials: any[];
}

export default function Index() {
  const [activeTab, setActiveTab] = useState("search");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  
  // Sample data for demonstration
  const [materials, setMaterials] = useState<Material[]>([
    {
      id: 1,
      name: "Madeira escura vaselinada",
      manufacturer: "Madeiras & madeira",
      category: "Wood",
      subcategory: "Treated Wood",
      description: "High quality treated wood",
      evaluations: [
        { id: 1, type: "EPD", version: "1.0", issueDate: "2021-01-01", validTo: "2026-12-31", conformity: 94 },
        { id: 2, type: "EPD", version: "2.0", issueDate: "2022-06-01", validTo: "2027-05-31", conformity: 87 },
        { id: 3, type: "LCA", version: "1.0", issueDate: "2021-03-01", validTo: "2026-02-28", conformity: 78 }
      ]
    },
    {
      id: 2,
      name: "Betão estrutural",
      manufacturer: "Amorim Cimentos",
      category: "Concrete",
      subcategory: "Standard Concrete",
      description: "High performance structural concrete",
      evaluations: [
        { id: 4, type: "EPD", version: "1.0", issueDate: "2020-01-01", validTo: "2025-12-31", conformity: 92 },
        { id: 5, type: "C2C", version: "1.0", issueDate: "2022-01-01", validTo: "2027-12-31", conformity: 85 }
      ]
    }
  ]);

  const [manufacturers, setManufacturers] = useState(["Madeiras & madeira", "Amorim Cimentos", "Test Manufacturer"]);
  const [categories, setCategories] = useState(["Wood", "Concrete", "Metal", "Glass"]);
  const [subcategories, setSubcategories] = useState<Record<string, string[]>>({
    "Wood": ["Treated Wood", "Natural Wood", "Laminated Wood"],
    "Concrete": ["Standard Concrete", "High Performance Concrete"],
    "Metal": ["Steel", "Aluminum", "Copper"],
    "Glass": ["Standard Glass", "Tempered Glass", "Laminated Glass"]
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedManufacturer, setSelectedManufacturer] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState("all");
  const [certificationFilters, setCertificationFilters] = useState({
    EPD: false,
    LCA: false,
    MI: false,
    REACH: false,
    HPD: false,
    C2C: false,
    Declare: false,
    PC: false,
    GGTPHD: false,
    FSC_PEFC: false,
    ECOLABEL: false
  });

  // Normalize text for search (remove accents and convert to lowercase)
  const normalizeText = (text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  // Filter materials based on search and filters
  const filteredMaterials = useMemo(() => {
    return materials.filter(material => {
      // Search term filter
      if (searchTerm) {
        const normalizedSearch = normalizeText(searchTerm);
        const materialName = normalizeText(material.name);
        if (!materialName.includes(normalizedSearch)) {
          return false;
        }
      }

      // Manufacturer filter
      if (selectedManufacturer !== "all" && material.manufacturer !== selectedManufacturer) {
        return false;
      }

      // Category filter
      if (selectedCategory !== "all" && material.category !== selectedCategory) {
        return false;
      }

      // Subcategory filter
      if (selectedSubcategory !== "all" && material.subcategory !== selectedSubcategory) {
        return false;
      }

      // Certification filters
      const activeCertifications = Object.entries(certificationFilters)
        .filter(([_, active]) => active)
        .map(([cert, _]) => cert);

      if (activeCertifications.length > 0) {
        const materialCertifications = material.evaluations.map(evaluation => {
          if (evaluation.type === "Manufacturer Inventory") return "MI";
          if (evaluation.type === "REACH Optimization") return "REACH";
          if (evaluation.type === "Health Product Declaration") return "HPD";
          if (evaluation.type === "Product Circularity") return "PC";
          if (evaluation.type === "Global Green Tag Product Health Declaration") return "GGTPHD";
          if (evaluation.type === "FSC / PEFC") return "FSC_PEFC";
          return evaluation.type;
        });

        const hasRequiredCertifications = activeCertifications.some(cert => 
          materialCertifications.includes(cert)
        );

        if (!hasRequiredCertifications) {
          return false;
        }
      }

      return true;
    });
  }, [materials, searchTerm, selectedManufacturer, selectedCategory, selectedSubcategory, certificationFilters]);

  const handleCertificationFilter = (certification: string, checked: boolean) => {
    setCertificationFilters(prev => ({
      ...prev,
      [certification]: checked
    }));
  };

  const handleEditMaterial = (material: Material) => {
    setEditingMaterial(material);
    setShowMaterialForm(true);
  };

  const handleDeleteMaterial = (materialId: number) => {
    if (confirm("Tem certeza que deseja excluir este material?")) {
      setMaterials(prev => prev.filter(m => m.id !== materialId));
    }
  };

  const handleViewMaterial = (material: Material) => {
    setSelectedMaterial(material);
  };

  const handleViewProject = (project: Project) => {
    setSelectedProject(project);
  };

  const handleDeleteProject = (projectId: number) => {
    if (confirm("Tem certeza que deseja excluir este projeto?")) {
      setProjects(prev => prev.filter(p => p.id !== projectId));
    }
  };

  // Group evaluations by type for display
  const groupEvaluationsByType = (evaluations: Evaluation[]) => {
    const grouped: Record<string, Evaluation[]> = {};
    evaluations.forEach(evaluation => {
      if (!grouped[evaluation.type]) {
        grouped[evaluation.type] = [];
      }
      grouped[evaluation.type].push(evaluation);
    });
    return grouped;
  };

  const getEvaluationAbbreviation = (type: string) => {
    const abbreviations: Record<string, string> = {
      "EPD": "EPD",
      "LCA": "LCA", 
      "Manufacturer Inventory": "MI",
      "REACH Optimization": "REACH",
      "Health Product Declaration": "HPD",
      "C2C": "C2C",
      "Declare": "Declare",
      "Product Circularity": "PC",
      "Global Green Tag Product Health Declaration": "GGTPHD",
      "FSC / PEFC": "FSC/PEFC",
      "ECOLABEL": "ECOLABEL"
    };
    return abbreviations[type] || type;
  };

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
      />
    );
  }

  if (selectedProject) {
    return (
      <ProjectDetails 
        project={selectedProject} 
        onClose={() => setSelectedProject(null)}
        materials={materials}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#282828] text-white">
      <div className="flex w-full">
        {/* Sidebar */}
        <div className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-[#222222] p-4 min-h-screen transition-all duration-300`}>
          <div className="flex items-center justify-between mb-6">
            {!sidebarCollapsed && <h1 className="text-xl font-bold">Material Database</h1>}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-white hover:bg-[#323232]"
            >
              {sidebarCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
            </Button>
          </div>
          
          <div className="space-y-2">
            <Button 
              variant={activeTab === "search" ? "default" : "ghost"}
              className={`${sidebarCollapsed ? 'px-2' : 'w-full justify-start'}`}
              onClick={() => setActiveTab("search")}
              title="Search Materials"
            >
              <Search className={`h-4 w-4 ${!sidebarCollapsed ? 'mr-2' : ''}`} />
              {!sidebarCollapsed && "Search Materials"}
            </Button>
            
            <Button 
              variant={activeTab === "database" ? "default" : "ghost"}
              className={`${sidebarCollapsed ? 'px-2' : 'w-full justify-start'}`}
              onClick={() => setActiveTab("database")}
              title="Database Management"
            >
              <Edit className={`h-4 w-4 ${!sidebarCollapsed ? 'mr-2' : ''}`} />
              {!sidebarCollapsed && "Database Management"}
            </Button>
            
            <Button 
              variant={activeTab === "projects" ? "default" : "ghost"}
              className={`${sidebarCollapsed ? 'px-2' : 'w-full justify-start'}`}
              onClick={() => setActiveTab("projects")}
              title="Projects"
            >
              <Upload className={`h-4 w-4 ${!sidebarCollapsed ? 'mr-2' : ''}`} />
              {!sidebarCollapsed && "Projects"}
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {activeTab === "search" && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Search Materials</h2>
              
              {/* Search and Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Input
                  placeholder="Search materials..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-[#323232] border-[#424242] text-white"
                />
                
                <Select value={selectedManufacturer} onValueChange={setSelectedManufacturer}>
                  <SelectTrigger className="bg-[#323232] border-[#424242] text-white">
                    <SelectValue placeholder="Manufacturer" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#323232] border-[#424242]">
                    <SelectItem value="all">All Manufacturers</SelectItem>
                    {manufacturers.map(mfg => (
                      <SelectItem key={mfg} value={mfg}>{mfg}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={selectedCategory} onValueChange={(value) => {
                  setSelectedCategory(value);
                  setSelectedSubcategory("all");
                }}>
                  <SelectTrigger className="bg-[#323232] border-[#424242] text-white">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#323232] border-[#424242]">
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory}>
                  <SelectTrigger className="bg-[#323232] border-[#424242] text-white">
                    <SelectValue placeholder="Subcategory" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#323232] border-[#424242]">
                    <SelectItem value="all">All Subcategories</SelectItem>
                    {selectedCategory && selectedCategory !== "all" && subcategories[selectedCategory]?.map(sub => (
                      <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Certification Filters */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Certifications</h3>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                  {Object.entries(certificationFilters).map(([cert, checked]) => (
                    <div key={cert} className="flex items-center space-x-2">
                      <Checkbox
                        id={cert}
                        checked={checked}
                        onCheckedChange={(checked) => handleCertificationFilter(cert, checked as boolean)}
                      />
                      <label htmlFor={cert} className="text-sm">{cert}</label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Materials List */}
              <div className="space-y-4">
                {filteredMaterials.map(material => {
                  const groupedEvaluations = groupEvaluationsByType(material.evaluations);
                  
                  return (
                    <div 
                      key={material.id} 
                      className="bg-[#323232] border border-[#424242] rounded-lg p-4 cursor-pointer hover:bg-[#424242] transition-colors"
                      onClick={() => handleViewMaterial(material)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold">{material.name}</h3>
                          <p className="text-[#B5B5B5]">Manufacturer: {material.manufacturer}</p>
                          <p className="text-[#B5B5B5]">Category: {material.category}</p>
                          <p className="text-[#B5B5B5]">Description: {material.description || "N/A"}</p>
                          <div className="mt-2">
                            {material.evaluations.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                <span className="text-sm text-[#B5B5B5]">Evaluations:</span>
                                {Object.entries(groupedEvaluations).map(([type, typeEvaluations]) => (
                                  <div key={type} className="flex gap-1">
                                    {typeEvaluations.map((evaluation, idx) => (
                                      <span 
                                        key={evaluation.id || idx}
                                        className="text-sm px-2 py-1 rounded bg-[#35568C] text-white"
                                      >
                                        {getEvaluationAbbreviation(type)}
                                        {evaluation.version && ` v${evaluation.version}`}
                                      </span>
                                    ))}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[#B5B5B5]">Evaluations: N/A</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2 ml-4">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="bg-[#35568C] hover:bg-[#89A9D2]"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewMaterial(material);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="bg-[#358C48] hover:bg-[#4ea045]"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditMaterial(material);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="bg-[#8C3535] hover:bg-[#a04545]"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMaterial(material.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {filteredMaterials.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-400">Nenhum material encontrado com os filtros selecionados.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "database" && (
            <DatabaseManagement
              materials={materials}
              manufacturers={manufacturers}
              categories={categories}
              subcategories={subcategories}
              onEditMaterial={handleEditMaterial}
              onDeleteMaterial={handleDeleteMaterial}
              onAddMaterial={() => {
                setEditingMaterial(null);
                setShowMaterialForm(true);
              }}
              onUpdateManufacturers={setManufacturers}
              onUpdateCategories={setCategories}
              onUpdateSubcategories={setSubcategories}
            />
          )}

          {activeTab === "projects" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Projetos</h2>
                <Button 
                  onClick={() => setShowProjectForm(true)}
                  className="bg-[#358C48] hover:bg-[#4ea045]"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Projeto
                </Button>
              </div>
              
              {projects.length === 0 ? (
                <div className="text-center py-12">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-300 mb-2">Nenhum projeto criado</h3>
                  <p className="text-gray-400 mb-4">Comece criando seu primeiro projeto</p>
                  <Button 
                    onClick={() => setShowProjectForm(true)}
                    className="bg-[#358C48] hover:bg-[#4ea045]"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Primeiro Projeto
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {projects.map(project => (
                    <div 
                      key={project.id} 
                      className="bg-[#323232] border border-[#424242] rounded-lg p-6 cursor-pointer hover:bg-[#424242] transition-colors"
                      onClick={() => handleViewProject(project)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white">{project.name}</h3>
                          <p className="text-gray-300 mt-1">{project.description}</p>
                          <div className="mt-3 flex gap-4 text-sm text-gray-400">
                            <span>Início: {new Date(project.startDate).toLocaleDateString()}</span>
                            <span>Fim: {new Date(project.endDate).toLocaleDateString()}</span>
                            <span>Materiais: {project.materials?.length || 0}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="bg-[#35568C] hover:bg-[#89A9D2]"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewProject(project);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="bg-[#358C48] hover:bg-[#4ea045]">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="bg-[#8C3535] hover:bg-[#a04545]"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProject(project.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Material Form Modal */}
      {showMaterialForm && (
        <MaterialForm
          material={editingMaterial}
          onClose={() => {
            setShowMaterialForm(false);
            setEditingMaterial(null);
          }}
          onSave={(material) => {
            if (editingMaterial) {
              setMaterials(prev => prev.map(m => m.id === material.id ? material : m));
            } else {
              setMaterials(prev => [...prev, { ...material, id: Date.now() }]);
            }
            setShowMaterialForm(false);
            setEditingMaterial(null);
          }}
        />
      )}

      {/* Project Form Modal */}
      {showProjectForm && (
        <ProjectForm
          onClose={() => setShowProjectForm(false)}
          onSave={(project) => {
            console.log("Novo projeto criado:", project);
            setProjects(prev => [...prev, project]);
            setShowProjectForm(false);
          }}
        />
      )}
    </div>
  );
}
