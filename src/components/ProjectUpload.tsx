
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, AlertCircle, CheckCircle } from "lucide-react";
import * as XLSX from 'xlsx';

interface ProjectMaterial {
  id: string;
  name: string;
  manufacturer: string;
  quantity_m2?: number;
  quantity_m3?: number;
  units?: number;
  databaseMaterial?: any;
}

interface ProjectUploadProps {
  onMaterialsUploaded: (materials: ProjectMaterial[]) => void;
  existingMaterials?: any[];
}

export function ProjectUpload({ onMaterialsUploaded, existingMaterials = [] }: ProjectUploadProps) {
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

  const normalizeText = (text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  };

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
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // Skip header row and process data
      const rows = jsonData.slice(1) as any[][];
      
      if (rows.length === 0) {
        throw new Error("Arquivo Excel vazio ou sem dados válidos");
      }

      const processedMaterials: ProjectMaterial[] = [];
      let matchedCount = 0;
      const errors: string[] = [];
      let validRowsCount = 0;

      rows.forEach((row, index) => {
        try {
          const rowNumber = index + 2; // +2 because we skipped header and arrays are 0-indexed
          
          // Extract data from Excel columns (A=0, B=1, C=2, D=3, E=4, F=5)
          const id = row[0]?.toString().trim() || '';
          const name = row[1]?.toString().trim() || '';
          const manufacturer = row[2]?.toString().trim() || '';
          const m2 = row[3] ? parseFloat(row[3].toString()) : undefined;
          const m3 = row[4] ? parseFloat(row[4].toString()) : undefined;
          const units = row[5] ? parseFloat(row[5].toString()) : undefined;

          // Skip completely empty rows
          if (!id && !name && !manufacturer && !m2 && !m3 && !units) {
            return;
          }

          validRowsCount++;

          // Validate required fields only for non-empty rows
          if (!name || !manufacturer) {
            errors.push(`Linha ${rowNumber}: Nome e Fabricante são obrigatórios`);
            return;
          }

          // Validate that at least one quantity field has a value
          if (!m2 && !m3 && !units) {
            errors.push(`Linha ${rowNumber}: Pelo menos um campo de quantidade (M², M³ ou Unidades) deve ser preenchido`);
            return;
          }

          // Try to find matching material in database
          const matchingMaterial = findMatchingMaterial({ name, manufacturer }, existingMaterials);
          
          const projectMaterial: ProjectMaterial = {
            id: id || `ROW_${rowNumber}`,
            name: name,
            manufacturer: manufacturer,
            quantity_m2: m2 && !isNaN(m2) ? m2 : undefined,
            quantity_m3: m3 && !isNaN(m3) ? m3 : undefined,
            units: units && !isNaN(units) ? units : undefined,
            databaseMaterial: matchingMaterial || null
          };

          if (matchingMaterial) {
            matchedCount++;
            console.log(`Material correspondente encontrado: ${name} - ${manufacturer}`);
          } else {
            console.log(`Material não encontrado na base de dados: ${name} - ${manufacturer}`);
          }

          processedMaterials.push(projectMaterial);
        } catch (err) {
          errors.push(`Linha ${index + 2}: Erro ao processar material - ${err}`);
        }
      });

      const results = {
        total: validRowsCount,
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
        errors: ["Formato de arquivo inválido ou erro de leitura"]
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

  const getEvaluationsDisplay = (material: any) => {
    if (!material || !material.evaluations || material.evaluations.length === 0) {
      return null;
    }

    const evaluations = material.evaluations.slice(0, 3);
    const hasMore = material.evaluations.length > 3;

    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {evaluations.map((evaluation: any, index: number) => (
          <span 
            key={evaluation.id || index}
            className="text-xs px-2 py-1 rounded bg-[#35568C] text-white"
          >
            {evaluation.type}
            {evaluation.version && ` v${evaluation.version}`}
          </span>
        ))}
        {hasMore && (
          <span className="text-xs px-2 py-1 rounded bg-[#525252] text-gray-300">
            ...
          </span>
        )}
      </div>
    );
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
                <p>Total de materiais válidos no Excel: {processingResults.total}</p>
                <p>Materiais processados: {processingResults.processed}</p>
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
                <div key={material.id} className={`rounded p-4 border ${
                  material.databaseMaterial 
                    ? 'bg-[#424242] border-[#525252]' 
                    : 'bg-[#8C3535] border-[#a04545]'
                }`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-white font-medium">{material.name}</h4>
                        {material.databaseMaterial ? (
                          <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
                            Encontrado na base
                          </span>
                        ) : (
                          <span className="text-xs bg-red-600 text-white px-2 py-1 rounded">
                            Não pertence à base de dados
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
                      {material.databaseMaterial && (
                        <div className="mt-2">
                          <span className="text-gray-300 text-sm">Avaliações:</span>
                          {getEvaluationsDisplay(material.databaseMaterial)}
                        </div>
                      )}
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
