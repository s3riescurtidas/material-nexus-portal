
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
  databaseMaterial?: any; // Reference to material in database if found
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
    matched: number;
    errors: string[];
  } | null>(null);

  // Normalize text for comparison (remove accents, convert to lowercase)
  const normalizeText = (text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  };

  // Function to find matching material in database
  const findMatchingMaterial = (excelMaterial: any, databaseMaterials: any[]) => {
    const normalizedExcelName = normalizeText(excelMaterial.name);
    const normalizedExcelManufacturer = normalizeText(excelMaterial.manufacturer);

    return databaseMaterials.find(dbMaterial => {
      const normalizedDbName = normalizeText(dbMaterial.name);
      const normalizedDbManufacturer = normalizeText(dbMaterial.manufacturer);
      
      return normalizedDbName === normalizedExcelName && 
             normalizedDbManufacturer === normalizedExcelManufacturer;
    });
  };

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
      // Simulate reading Excel file with actual Excel data structure
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate Excel data - this would come from actual Excel parsing
      const excelData = [
        {
          id: "001",
          name: "Madeira escura vaselinada",
          manufacturer: "Madeiras & madeira",
          quantity_m2: 25.5,
          quantity_m3: undefined,
          units: undefined
        },
        {
          id: "002", 
          name: "Betão estrutural",
          manufacturer: "Amorim Cimentos", 
          quantity_m2: undefined,
          quantity_m3: 15.8,
          units: undefined
        },
        {
          id: "003",
          name: "Tijolo cerâmico furado",
          manufacturer: "Cerâmicas Silva",
          quantity_m2: undefined,
          quantity_m3: undefined,
          units: 1500
        },
        {
          id: "004",
          name: "Vidro temperado duplo",
          manufacturer: "Vidros Premium",
          quantity_m2: 12.3,
          quantity_m3: undefined,
          units: undefined
        },
        {
          id: "005",
          name: "Betao estrutural", // Test case with different spelling/accent
          manufacturer: "amorim cimentos", // Test case with different case
          quantity_m2: undefined,
          quantity_m3: 8.5,
          units: undefined
        }
      ];

      // Get materials from parent component - for now we'll simulate some existing materials
      const existingMaterials = [
        {
          id: 1,
          name: "Madeira escura vaselinada",
          manufacturer: "Madeiras & madeira",
          category: "Wood",
          subcategory: "Treated Wood"
        },
        {
          id: 2,
          name: "Betão estrutural", 
          manufacturer: "Amorim Cimentos",
          category: "Concrete",
          subcategory: "Standard Concrete"
        }
      ];

      // Process each Excel row and try to match with existing materials
      const processedMaterials: ProjectMaterial[] = [];
      let matchedCount = 0;
      const errors: string[] = [];

      excelData.forEach((excelRow, index) => {
        try {
          // Validate required fields
          if (!excelRow.name || !excelRow.manufacturer) {
            errors.push(`Linha ${index + 2}: Nome e Fabricante são obrigatórios`);
            return;
          }

          // Validate that at least one quantity field has a value
          if (!excelRow.quantity_m2 && !excelRow.quantity_m3 && !excelRow.units) {
            errors.push(`Linha ${index + 2}: Pelo menos um campo de quantidade (M², M³ ou Unidades) deve ser preenchido`);
            return;
          }

          // Try to find matching material in database
          const matchingMaterial = findMatchingMaterial(excelRow, existingMaterials);
          
          const projectMaterial: ProjectMaterial = {
            id: excelRow.id || `EXCEL_${index + 1}`,
            name: excelRow.name.trim(),
            manufacturer: excelRow.manufacturer.trim(),
            quantity_m2: excelRow.quantity_m2 || undefined,
            quantity_m3: excelRow.quantity_m3 || undefined,
            units: excelRow.units || undefined,
            databaseMaterial: matchingMaterial || null
          };

          if (matchingMaterial) {
            matchedCount++;
            console.log(`Material correspondente encontrado: ${excelRow.name} - ${excelRow.manufacturer}`);
          } else {
            console.log(`Material não encontrado na base de dados: ${excelRow.name} - ${excelRow.manufacturer}`);
          }

          processedMaterials.push(projectMaterial);
        } catch (err) {
          errors.push(`Linha ${index + 2}: Erro ao processar material - ${err}`);
        }
      });

      // Set processing results
      const results = {
        total: excelData.length,
        processed: processedMaterials.length,
        matched: matchedCount,
        errors: errors
      };

      setUploadedMaterials(processedMaterials);
      setProcessingResults(results);
      onMaterialsUploaded(processedMaterials);
      
    } catch (err) {
      setError("Erro ao processar o arquivo Excel. Verifique se o formato está correto.");
      setProcessingResults({
        total: 0,
        processed: 0,
        matched: 0,
        errors: ["Formato de arquivo inválido"]
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getQuantityDisplay = (material: ProjectMaterial) => {
    const quantities = [];
    if (material.quantity_m2) quantities.push(`${material.quantity_m2} m²`);
    if (material.quantity_m3) quantities.push(`${material.quantity_m3} m³`);
    if (material.units) quantities.push(`${material.units} unidades`);
    return quantities.length > 0 ? quantities.join(', ') : "N/A";
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
              Formato esperado: Colunas ID, Nome, Fabricante, M², M³, Unidades
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
                <p>Total de linhas processadas: {processingResults.total}</p>
                <p>Materiais válidos: {processingResults.processed}</p>
                <p>Materiais encontrados na base de dados: {processingResults.matched}</p>
                <p>Materiais não encontrados: {processingResults.processed - processingResults.matched}</p>
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
                      <div className="flex items-center gap-2">
                        <h4 className="text-white font-medium">{material.name}</h4>
                        {material.databaseMaterial && (
                          <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
                            Encontrado na base
                          </span>
                        )}
                        {!material.databaseMaterial && (
                          <span className="text-xs bg-yellow-600 text-white px-2 py-1 rounded">
                            Novo material
                          </span>
                        )}
                      </div>
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
