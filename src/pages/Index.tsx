
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Edit, Trash2, Eye, Plus, Upload } from "lucide-react";
import { MaterialForm } from "@/components/MaterialForm";
import { ProjectForm } from "@/components/ProjectForm";

interface Evaluation {
  id: number;
  type: string;
  version: string;
  issueDate: string;
  validTo: string;
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

export default function Index() {
  const [activeTab, setActiveTab] = useState("search");
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [showProjectForm, setShowProjectForm] = useState(false);
  
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
        { id: 1, type: "EPD", version: "1.0", issueDate: "2021-01-01", validTo: "2026-12-31" },
        { id: 2, type: "EPD", version: "2.0", issueDate: "2022-06-01", validTo: "2027-05-31" },
        { id: 3, type: "LCA", version: "1.0", issueDate: "2021-03-01", validTo: "2026-02-28" }
      ]
    }
  ]);

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

  const manufacturers = ["Madeiras & madeira", "Amorim Cimentos", "Test Manufacturer"];
  const categories = ["Wood", "Concrete", "Metal", "Glass"];
  const subcategories: Record<string, string[]> = {
    "Wood": ["Treated Wood", "Natural Wood", "Laminated Wood"],
    "Concrete": ["Standard Concrete", "High Performance Concrete"],
    "Metal": ["Steel", "Aluminum", "Copper"],
    "Glass": ["Standard Glass", "Tempered Glass", "Laminated Glass"]
  };

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

  const checkEvaluationStatus = (evaluationData: Evaluation, projectStart = "2023-01-01", projectEnd = "2027-12-31") => {
    const evaluationStart = new Date(evaluationData.issueDate);
    const evaluationEnd = new Date(evaluationData.validTo);
    const projStart = new Date(projectStart);
    const projEnd = new Date(projectEnd);

    if (evaluationEnd >= projStart && evaluationStart <= projEnd) {
      return "green"; // Valid during project
    } else if (evaluationEnd < projStart) {
      return "red"; // Expired before project
    } else if (evaluationStart > projEnd) {
      return "blue"; // Valid after project
    }
    return "purple";
  };

  const getEvaluationDisplayText = (evaluation: Evaluation) => {
    const version = evaluation.version ? ` v${evaluation.version}` : '';
    return `${evaluation.type}${version}`;
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

  return (
    <div className="min-h-screen bg-[#282828] text-white">
      <div className="flex w-full">
        {/* Sidebar */}
        <div className="w-64 bg-[#222222] p-4 min-h-screen">
          <h1 className="text-xl font-bold mb-6">Material Database</h1>
          
          <div className="space-y-2">
            <Button 
              variant={activeTab === "search" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("search")}
            >
              <Search className="mr-2 h-4 w-4" />
              Search Materials
            </Button>
            
            <Button 
              variant={activeTab === "database" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("database")}
            >
              <Edit className="mr-2 h-4 w-4" />
              Database Management
            </Button>
            
            <Button 
              variant={activeTab === "projects" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("projects")}
            >
              <Upload className="mr-2 h-4 w-4" />
              Projects
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
                
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
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

              {/* Enhanced Materials List */}
              <div className="space-y-4">
                {materials.map(material => {
                  const groupedEvaluations = groupEvaluationsByType(material.evaluations);
                  
                  return (
                    <div key={material.id} className="bg-[#323232] border border-[#424242] rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold">{material.name}</h3>
                          <p className="text-[#B5B5B5]">Manufacturer: {material.manufacturer}</p>
                          <p className="text-[#B5B5B5]">Category: {material.category}</p>
                          <p className="text-[#B5B5B5]">Description: {material.description || "N/A"}</p>
                          <div className="mt-2">
                            {material.evaluations.length > 0 ? (
                              <div className="space-y-1">
                                {Object.entries(groupedEvaluations).map(([type, typeEvaluations]) => (
                                  <div key={type} className="flex flex-wrap gap-2">
                                    <span className="text-sm font-medium text-[#B5B5B5] min-w-[50px]">{type}:</span>
                                    <div className="flex flex-wrap gap-2">
                                      {typeEvaluations.map((evaluation, idx) => (
                                        <span 
                                          key={evaluation.id || idx}
                                          className="text-sm px-2 py-1 rounded bg-[#424242]"
                                          style={{ color: checkEvaluationStatus(evaluation) }}
                                        >
                                          {getEvaluationDisplayText(evaluation)}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[#B5B5B5]">N/A</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2 ml-4">
                          <Button size="sm" variant="outline" className="bg-[#35568C] hover:bg-[#89A9D2]">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="bg-[#358C48] hover:bg-[#4ea045]"
                            onClick={() => handleEditMaterial(material)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="bg-[#8C3535] hover:bg-[#a04545]"
                            onClick={() => handleDeleteMaterial(material.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "database" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Database Management</h2>
                <Button 
                  onClick={() => {
                    setEditingMaterial(null);
                    setShowMaterialForm(true);
                  }}
                  className="bg-[#358C48] hover:bg-[#4ea045]"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Material
                </Button>
              </div>
              
              <Tabs defaultValue="materials" className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-[#323232]">
                  <TabsTrigger value="materials" className="data-[state=active]:bg-[#424242]">Materials</TabsTrigger>
                  <TabsTrigger value="manufacturers" className="data-[state=active]:bg-[#424242]">Manufacturers</TabsTrigger>
                  <TabsTrigger value="categories" className="data-[state=active]:bg-[#424242]">Categories</TabsTrigger>
                  <TabsTrigger value="subcategories" className="data-[state=active]:bg-[#424242]">Subcategories</TabsTrigger>
                </TabsList>
                
                <TabsContent value="materials" className="mt-4">
                  <div className="space-y-4">
                    {materials.map(material => (
                      <div key={material.id} className="bg-[#323232] border border-[#424242] rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-bold">{material.name}</h3>
                            <p className="text-[#B5B5B5]">{material.manufacturer}</p>
                            <p className="text-xs text-[#B5B5B5]">
                              {material.evaluations.length} evaluation(s)
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="bg-[#358C48] hover:bg-[#4ea045]"
                              onClick={() => handleEditMaterial(material)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="bg-[#8C3535] hover:bg-[#a04545]"
                              onClick={() => handleDeleteMaterial(material.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="manufacturers" className="mt-4">
                  <p className="text-[#B5B5B5]">Manufacturer management coming soon...</p>
                </TabsContent>
                
                <TabsContent value="categories" className="mt-4">
                  <p className="text-[#B5B5B5]">Category management coming soon...</p>
                </TabsContent>
                
                <TabsContent value="subcategories" className="mt-4">
                  <p className="text-[#B5B5B5]">Subcategory management coming soon...</p>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {activeTab === "projects" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Projects</h2>
                <Button 
                  onClick={() => setShowProjectForm(true)}
                  className="bg-[#358C48] hover:bg-[#4ea045]"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New Project
                </Button>
              </div>
              <p className="text-[#B5B5B5]">Project management coming soon...</p>
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
            console.log("New project:", project);
            setShowProjectForm(false);
          }}
        />
      )}
    </div>
  );
}
