
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, AlertCircle } from "lucide-react";

interface ProjectMaterial {
  id: string;
  name: string;
  manufacturer: string;
  quantity_m2?: number;
  quantity_m3?: number;
  units?: number;
}

interface ProjectUploadProps {
  onMaterialsUploaded: (materials: ProjectMaterial[]) => void;
}

export function ProjectUpload({ onMaterialsUploaded }: ProjectUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedMaterials, setUploadedMaterials] = useState<ProjectMaterial[]>([]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const processExcelFile = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Simulate Excel file processing
      // In a real implementation, you would use a library like xlsx to parse the Excel file
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock data that would come from Excel parsing
      const mockMaterials: ProjectMaterial[] = [
        {
          id: "MAT001",
          name: "Madeira escura vaselinada",
          manufacturer: "Madeiras & madeira",
          quantity_m2: 150,
          quantity_m3: 12,
          units: 50
        },
        {
          id: "MAT002",
          name: "Betão estrutural",
          manufacturer: "Amorim Cimentos",
          quantity_m3: 200,
          units: 100
        }
      ];

      setUploadedMaterials(mockMaterials);
      onMaterialsUploaded(mockMaterials);
      
    } catch (err) {
      setError("Erro ao processar o arquivo Excel. Verifique se o formato está correto.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-[#323232] border-[#424242]">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload de Materiais do Projeto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="excel-file" className="text-white">
              Arquivo Excel (ID, Nome, Fabricante, M², M³, Unidades)
            </Label>
            <Input
              id="excel-file"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="bg-[#424242] border-[#525252] text-white file:bg-[#525252] file:text-white file:border-0"
            />
          </div>

          {file && (
            <div className="flex items-center gap-2 text-green-400">
              <FileText className="h-4 w-4" />
              <span className="text-sm">{file.name}</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <Button
            onClick={processExcelFile}
            disabled={!file || isProcessing}
            className="bg-[#358C48] hover:bg-[#4ea045] disabled:bg-[#525252]"
          >
            {isProcessing ? "Processando..." : "Processar Arquivo"}
          </Button>
        </CardContent>
      </Card>

      {uploadedMaterials.length > 0 && (
        <Card className="bg-[#323232] border-[#424242]">
          <CardHeader>
            <CardTitle className="text-white">Materiais Carregados ({uploadedMaterials.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {uploadedMaterials.map((material) => (
                <div key={material.id} className="bg-[#424242] rounded p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-white font-medium">{material.name}</h4>
                      <p className="text-gray-300 text-sm">ID: {material.id}</p>
                      <p className="text-gray-300 text-sm">Fabricante: {material.manufacturer}</p>
                    </div>
                    <div className="text-right text-sm text-gray-300">
                      {material.quantity_m2 && <div>M²: {material.quantity_m2}</div>}
                      {material.quantity_m3 && <div>M³: {material.quantity_m3}</div>}
                      {material.units && <div>Unidades: {material.units}</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
