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

  // Função de normalização melhorada
  const normalizeText = (text: string) => {
    if (!text) return '';
    
    console.log('🔧 Normalizing text:', text);
    
    // Converter para lowercase e remover acentos
    let normalized = text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    
    // Remover caracteres especiais, manter apenas letras, números e espaços
    normalized = normalized.replace(/[^a-z0-9\s]/g, ' ');
    
    // Normalizar espaços múltiplos para espaços únicos
    normalized = normalized.replace(/\s+/g, ' ');
    
    // Remover espaços no início e fim
    normalized = normalized.trim();
    
    console.log('✅ Normalized result:', normalized);
    
    return normalized;
  };

  // Função de correspondência completamente reescrita
  const findMatchingMaterial = (excelMaterial: any, databaseMaterials: any[]) => {
    const excelName = normalizeText(excelMaterial.name);
    const excelManufacturer = normalizeText(excelMaterial.manufacturer);

    console.log('\n🔍 ===========================================');
    console.log('🔍 SEARCHING FOR MATERIAL:');
    console.log('📋 Excel Material:', {
      original: { name: excelMaterial.name, manufacturer: excelMaterial.manufacturer },
      normalized: { name: excelName, manufacturer: excelManufacturer }
    });
    console.log('📊 Database has', databaseMaterials.length, 'materials to search');

    // 1. CORRESPONDÊNCIA EXATA (nome e fabricante)
    console.log('\n🎯 Step 1: Trying EXACT MATCH (name + manufacturer)...');
    for (let i = 0; i < databaseMaterials.length; i++) {
      const dbMaterial = databaseMaterials[i];
      const dbName = normalizeText(dbMaterial.name);
      const dbManufacturer = normalizeText(dbMaterial.manufacturer);
      
      console.log(`  Checking DB[${i}]: "${dbName}" by "${dbManufacturer}"`);
      
      if (dbName === excelName && dbManufacturer === excelManufacturer) {
        console.log('✅ EXACT MATCH FOUND!', dbMaterial);
        return dbMaterial;
      }
    }

    // 2. CORRESPONDÊNCIA POR NOME EXATO (ignora fabricante)
    console.log('\n🎯 Step 2: Trying EXACT NAME MATCH (ignore manufacturer)...');
    for (let i = 0; i < databaseMaterials.length; i++) {
      const dbMaterial = databaseMaterials[i];
      const dbName = normalizeText(dbMaterial.name);
      
      console.log(`  Checking DB[${i}]: "${dbName}"`);
      
      if (dbName === excelName) {
        console.log('✅ EXACT NAME MATCH FOUND!', dbMaterial);
        return dbMaterial;
      }
    }

    // 3. CORRESPONDÊNCIA PARCIAL (contém palavras-chave)
    console.log('\n🎯 Step 3: Trying PARTIAL MATCH (contains keywords)...');
    const excelWords = excelName.split(' ').filter(word => word.length > 2);
    console.log('📝 Excel keywords:', excelWords);
    
    for (let i = 0; i < databaseMaterials.length; i++) {
      const dbMaterial = databaseMaterials[i];
      const dbName = normalizeText(dbMaterial.name);
      const dbWords = dbName.split(' ').filter(word => word.length > 2);
      
      console.log(`  Checking DB[${i}]: "${dbName}" (keywords: [${dbWords.join(', ')}])`);
      
      // Verifica se pelo menos 70% das palavras do Excel estão no nome da DB
      let matchingWords = 0;
      excelWords.forEach(excelWord => {
        const found = dbWords.some(dbWord => 
          dbWord.includes(excelWord) || excelWord.includes(dbWord)
        );
        if (found) {
          matchingWords++;
          console.log(`    ✓ Word "${excelWord}" matches`);
        }
      });
      
      const matchPercentage = excelWords.length > 0 ? (matchingWords / excelWords.length) : 0;
      console.log(`    Match percentage: ${(matchPercentage * 100).toFixed(1)}%`);
      
      if (matchPercentage >= 0.7) {
        console.log('✅ PARTIAL MATCH FOUND!', dbMaterial);
        return dbMaterial;
      }
    }

    // 4. CORRESPONDÊNCIA FLEXÍVEL (busca por similaridade)
    console.log('\n🎯 Step 4: Trying FLEXIBLE MATCH (similarity search)...');
    for (let i = 0; i < databaseMaterials.length; i++) {
      const dbMaterial = databaseMaterials[i];
      const dbName = normalizeText(dbMaterial.name);
      
      console.log(`  Checking DB[${i}]: "${dbName}"`);
      
      // Verifica se o nome do Excel contém parte do nome da DB ou vice-versa
      if ((excelName.includes(dbName) && dbName.length > 5) || 
          (dbName.includes(excelName) && excelName.length > 5)) {
        console.log('✅ FLEXIBLE MATCH FOUND!', dbMaterial);
        return dbMaterial;
      }
    }

    console.log('❌ NO MATCH FOUND for:', excelMaterial.name, 'by', excelMaterial.manufacturer);
    console.log('🔍 ===========================================\n');
    return null;
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
      console.log('\n📊 ===========================================');
      console.log('📊 STARTING EXCEL PROCESSING');
      console.log('📊 Database has', existingMaterials.length, 'materials');
      console.log('📋 Database materials preview:');
      existingMaterials.slice(0, 5).forEach((m, i) => {
        console.log(`  DB[${i}]: "${m.name}" by "${m.manufacturer}"`);
      });
      console.log('📊 ===========================================\n');
      
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
          const rowNumber = index + 2;
          
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

          if (!name || !manufacturer) {
            errors.push(`Linha ${rowNumber}: Nome e Fabricante são obrigatórios`);
            return;
          }

          if (!m2 && !m3 && !units) {
            errors.push(`Linha ${rowNumber}: Pelo menos um campo de quantidade (M², M³ ou Unidades) deve ser preenchido`);
            return;
          }

          console.log(`\n📋 Processing Excel row ${rowNumber}:`);
          console.log(`  Name: "${name}"`);
          console.log(`  Manufacturer: "${manufacturer}"`);

          // Try to find matching material in database
          const matchingMaterial = findMatchingMaterial({ name, manufacturer }, existingMaterials);
          
          const projectMaterial: ProjectMaterial = {
            id: id || `ROW_${rowNumber}`,
            name: name,
            manufacturer: manufacturer,
            quantity_m2: m2 && !isNaN(m2) ? m2 : undefined,
            quantity_m3: m3 && !isNaN(m3) ? m3 : undefined,
            units: units && !isNaN(units) ? units : undefined,
            databaseMaterial: matchingMaterial
          };

          if (matchingMaterial) {
            matchedCount++;
            console.log(`✅ Row ${rowNumber}: MATCHED with DB ID ${matchingMaterial.id}`);
          } else {
            console.log(`❌ Row ${rowNumber}: NO MATCH FOUND`);
          }

          processedMaterials.push(projectMaterial);
        } catch (err) {
          console.error(`❌ Error processing row ${index + 2}:`, err);
          errors.push(`Linha ${index + 2}: Erro ao processar material - ${err}`);
        }
      });

      const results = {
        total: validRowsCount,
        processed: processedMaterials.length,
        matched: matchedCount,
        errors: errors
      };

      console.log('\n📊 ===========================================');
      console.log('📊 FINAL PROCESSING RESULTS:');
      console.log('📊 Total valid rows:', results.total);
      console.log('📊 Processed materials:', results.processed);
      console.log('📊 Matched materials:', results.matched);
      console.log('📊 Unmatched materials:', results.processed - results.matched);
      console.log('📊 Errors:', results.errors.length);
      console.log('📊 ===========================================\n');

      setUploadedMaterials(processedMaterials);
      setProcessingResults(results);
      onMaterialsUploaded(processedMaterials);
      
    } catch (err) {
      console.error('❌ Error processing Excel file:', err);
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
            +{material.evaluations.length - 3} mais
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
                            Encontrado na base (ID: {material.databaseMaterial.id})
                          </span>
                        ) : (
                          <span className="text-xs bg-red-600 text-white px-2 py-1 rounded">
                            Não encontrado na base
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
                      {material.databaseMaterial ? (
                        <div className="mt-2">
                          <span className="text-gray-300 text-sm">Avaliações:</span>
                          {getEvaluationsDisplay(material.databaseMaterial)}
                        </div>
                      ) : (
                        <div className="mt-2 text-red-300 text-sm">
                          <span className="font-medium">Material do Excel (não encontrado na base):</span>
                          <div className="ml-2 mt-1">
                            <p>Nome: {material.name}</p>
                            <p>Fabricante: {material.manufacturer}</p>
                            <p>Quantidades: {getQuantityDisplay(material)}</p>
                          </div>
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
