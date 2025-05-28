
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, Edit } from "lucide-react";

interface DatabaseManagementProps {
  materials: any[];
  manufacturers: string[];
  categories: string[];
  subcategories: Record<string, string[]>;
  onEditMaterial: (material: any) => void;
  onDeleteMaterial: (id: number) => void;
  onAddMaterial: () => void;
  onUpdateManufacturers: (manufacturers: string[]) => void;
  onUpdateCategories: (categories: string[]) => void;
  onUpdateSubcategories: (subcategories: Record<string, string[]>) => void;
}

export function DatabaseManagement({
  materials,
  manufacturers,
  categories,
  subcategories,
  onEditMaterial,
  onDeleteMaterial,
  onAddMaterial,
  onUpdateManufacturers,
  onUpdateCategories,
  onUpdateSubcategories
}: DatabaseManagementProps) {
  const [showAddDialog, setShowAddDialog] = useState<string | null>(null);
  const [showEditDialog, setShowEditDialog] = useState<{type: string, item: string, index?: number} | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const handleAddItem = (type: string) => {
    if (!newItemName.trim()) return;

    switch (type) {
      case 'manufacturer':
        if (!manufacturers.includes(newItemName)) {
          onUpdateManufacturers([...manufacturers, newItemName].sort());
        }
        break;
      case 'category':
        if (!categories.includes(newItemName)) {
          onUpdateCategories([...categories, newItemName].sort());
          onUpdateSubcategories({...subcategories, [newItemName]: []});
        }
        break;
      case 'subcategory':
        if (selectedCategory && !subcategories[selectedCategory]?.includes(newItemName)) {
          const newSubcategories = {...subcategories};
          newSubcategories[selectedCategory] = [...(newSubcategories[selectedCategory] || []), newItemName].sort();
          onUpdateSubcategories(newSubcategories);
        }
        break;
    }

    setNewItemName('');
    setSelectedCategory('');
    setShowAddDialog(null);
  };

  const handleEditItem = (type: string, oldName: string, newName: string, categoryForSub?: string) => {
    if (!newName.trim() || newName === oldName) return;

    switch (type) {
      case 'manufacturer':
        const newManufacturers = manufacturers.map(m => m === oldName ? newName : m).sort();
        onUpdateManufacturers(newManufacturers);
        break;
      case 'category':
        const newCategories = categories.map(c => c === oldName ? newName : c).sort();
        const newSubcategoriesForCategory = {...subcategories};
        if (subcategories[oldName]) {
          newSubcategoriesForCategory[newName] = subcategories[oldName];
          delete newSubcategoriesForCategory[oldName];
        }
        onUpdateCategories(newCategories);
        onUpdateSubcategories(newSubcategoriesForCategory);
        break;
      case 'subcategory':
        if (categoryForSub) {
          const newSubcategoriesForSub = {...subcategories};
          newSubcategoriesForSub[categoryForSub] = newSubcategoriesForSub[categoryForSub].map(s => s === oldName ? newName : s).sort();
          onUpdateSubcategories(newSubcategoriesForSub);
        }
        break;
    }

    setShowEditDialog(null);
  };

  const handleDeleteItem = (type: string, name: string, categoryForSub?: string) => {
    if (!confirm(`Tem certeza que deseja excluir ${name}?`)) return;

    switch (type) {
      case 'manufacturer':
        onUpdateManufacturers(manufacturers.filter(m => m !== name));
        break;
      case 'category':
        onUpdateCategories(categories.filter(c => c !== name));
        const newSubcategoriesAfterDelete = {...subcategories};
        delete newSubcategoriesAfterDelete[name];
        onUpdateSubcategories(newSubcategoriesAfterDelete);
        break;
      case 'subcategory':
        if (categoryForSub) {
          const newSubcategoriesForDelete = {...subcategories};
          newSubcategoriesForDelete[categoryForSub] = newSubcategoriesForDelete[categoryForSub].filter(s => s !== name);
          onUpdateSubcategories(newSubcategoriesForDelete);
        }
        break;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Database Management</h2>
        <Button 
          onClick={onAddMaterial}
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
            {materials
              .sort((a, b) => a.name.localeCompare(b.name))
              .map(material => (
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
                      onClick={() => onEditMaterial(material)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="bg-[#8C3535] hover:bg-[#a04545]"
                      onClick={() => onDeleteMaterial(material.id)}
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
          <div className="mb-4">
            <Button 
              onClick={() => setShowAddDialog('manufacturer')}
              className="bg-[#358C48] hover:bg-[#4ea045]"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Manufacturer
            </Button>
          </div>
          <div className="space-y-4">
            {manufacturers.sort().map(manufacturer => (
              <div key={manufacturer} className="bg-[#323232] border border-[#424242] rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold">{manufacturer}</h3>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="bg-[#358C48] hover:bg-[#4ea045]"
                      onClick={() => setShowEditDialog({type: 'manufacturer', item: manufacturer})}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="bg-[#8C3535] hover:bg-[#a04545]"
                      onClick={() => handleDeleteItem('manufacturer', manufacturer)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="categories" className="mt-4">
          <div className="mb-4">
            <Button 
              onClick={() => setShowAddDialog('category')}
              className="bg-[#358C48] hover:bg-[#4ea045]"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </div>
          <div className="space-y-4">
            {categories.sort().map(category => (
              <div key={category} className="bg-[#323232] border border-[#424242] rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold">{category}</h3>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="bg-[#358C48] hover:bg-[#4ea045]"
                      onClick={() => setShowEditDialog({type: 'category', item: category})}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="bg-[#8C3535] hover:bg-[#a04545]"
                      onClick={() => handleDeleteItem('category', category)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="subcategories" className="mt-4">
          <div className="mb-4">
            <Button 
              onClick={() => setShowAddDialog('subcategory')}
              className="bg-[#358C48] hover:bg-[#4ea045]"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Subcategory
            </Button>
          </div>
          <div className="space-y-4">
            {Object.entries(subcategories)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([category, subs]) => (
              <div key={category} className="bg-[#323232] border border-[#424242] rounded-lg p-4">
                <h3 className="font-bold mb-2">{category}</h3>
                <div className="space-y-2">
                  {subs.sort().map(sub => (
                    <div key={sub} className="flex justify-between items-center bg-[#424242] p-2 rounded">
                      <span>{sub}</span>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="bg-[#358C48] hover:bg-[#4ea045]"
                          onClick={() => setShowEditDialog({type: 'subcategory', item: sub})}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="bg-[#8C3535] hover:bg-[#a04545]"
                          onClick={() => handleDeleteItem('subcategory', sub, category)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Item Dialog */}
      {showAddDialog && (
        <Dialog open={true} onOpenChange={() => setShowAddDialog(null)}>
          <DialogContent className="bg-[#282828] border-[#424242] text-white">
            <DialogHeader>
              <DialogTitle>Add New {showAddDialog}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {showAddDialog === 'subcategory' && (
                <div>
                  <Label>Select Category</Label>
                  <select 
                    value={selectedCategory} 
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full p-2 bg-[#323232] border border-[#424242] rounded text-white"
                  >
                    <option value="">Select category...</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <Label>Name</Label>
                <Input
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="bg-[#323232] border-[#424242] text-white"
                  placeholder={`Enter ${showAddDialog} name`}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddDialog(null)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => handleAddItem(showAddDialog)}
                  className="bg-[#358C48] hover:bg-[#4ea045]"
                  disabled={!newItemName.trim() || (showAddDialog === 'subcategory' && !selectedCategory)}
                >
                  Add
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Item Dialog */}
      {showEditDialog && (
        <Dialog open={true} onOpenChange={() => setShowEditDialog(null)}>
          <DialogContent className="bg-[#282828] border-[#424242] text-white">
            <DialogHeader>
              <DialogTitle>Edit {showEditDialog.type}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  defaultValue={showEditDialog.item}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="bg-[#323232] border-[#424242] text-white"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowEditDialog(null)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    const categoryForSub = showEditDialog.type === 'subcategory' 
                      ? Object.keys(subcategories).find(cat => subcategories[cat].includes(showEditDialog.item))
                      : undefined;
                    handleEditItem(showEditDialog.type, showEditDialog.item, newItemName || showEditDialog.item, categoryForSub);
                  }}
                  className="bg-[#358C48] hover:bg-[#4ea045]"
                >
                  Save
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
