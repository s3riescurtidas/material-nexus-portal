
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, AlertCircle, CheckCircle } from "lucide-react";

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
  const [processingResults, setProcessingResults] = useState<{
    total: number;
    processed: number;
    errors: string[];
  } | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setProcessingResults(null);
      setUploadedMaterials([]);
    }
  };

  const processExcelFile = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setProcessingResults(null);

    try {
      // Simulate reading Excel file with correct structure
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock data simulating Excel parsing with correct materials and quantities
      const mockMaterials: ProjectMaterial[] = [
        {
          id: "MAT001",
          name: "Madeira escura vaselinada",
          manufacturer: "Madeiras & madeira",
          quantity_m2: 10.000
        },
        {
          id: "MAT002",
          name: "Betão estrutural", 
          manufacturer: "Amorim Cimentos",
          quantity_m3: 30.000
        },
        {
          id: "MAT003",
          name: "Tijolo cerâmico",
          manufacturer: "Cerâmica Nova",
          units: 2500
        },
        {
          id: "MAT004",
          name: "Vidro temperado",
          manufacturer: "Vidros Tech",
          quantity_m2: 45.500
        },
        {
          id: "MAT005",
          name: "Aço estrutural",
          manufacturer: "MetalCorp",
          units: 150
        }
      ];

      // Simulate processing results
      const results = {
        total: mockMaterials.length,
        processed: mockMaterials.length,
        errors: []
      };

      setUploadedMaterials(mockMaterials);
      setProcessingResults(results);
      onMaterialsUploaded(mockMaterials);
      
    } catch (err) {
      setError("Erro ao processar o arquivo Excel. Verifique se o formato está correto.");
      setProcessingResults({
        total: 0,
        processed: 0,
        errors: ["Formato de arquivo inválido"]
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getQuantityDisplay = (material: ProjectMaterial) => {
    if (material.quantity_m2) return `${material.quantity_m2} m²`;
    if (material.quantity_m3) return `${material.quantity_m3} m³`;
    if (material.units) return `${material.units} unidades`;
    return "N/A";
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
            <p className="text-xs text-gray-400 mt-1">
              Formato esperado: Colunas ID, Name, Manufacturer, M², M³, Unidades
            </p>
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

          {processingResults && (
            <div className="bg-[#424242] rounded p-3">
              <div className="flex items-center gap-2 text-green-400 mb-2">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Processamento Concluído</span>
              </div>
              <div className="text-sm text-gray-300">
                <p>Total de linhas: {processingResults.total}</p>
                <p>Materiais processados: {processingResults.processed}</p>
                {processingResults.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="text-red-400">Erros encontrados:</p>
                    <ul className="list-disc list-inside text-red-300">
                      {processingResults.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
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
            <div className="space-y-3">
              {uploadedMaterials.map((material) => (
                <div key={material.id} className="bg-[#424242] rounded p-4 border border-[#525252]">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="text-white font-medium">{material.name}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 text-sm text-gray-300">
                        <div>
                          <span className="font-medium">ID:</span> {material.id}
                        </div>
                        <div>
                          <span className="font-medium">Fabricante:</span> {material.manufacturer}
                        </div>
                        <div>
                          <span className="font-medium">Quantidade:</span> {getQuantityDisplay(material)}
                        </div>
                      </div>
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
