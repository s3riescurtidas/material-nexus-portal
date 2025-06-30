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

  // Função de normalização melhorada para lidar com caracteres especiais portugueses
  const normalizeText = (text: string) => {
    if (!text) return '';
    
    let normalized = text
      .toLowerCase()
      .trim()
      // Normalizar caracteres portugueses específicos
      .replace(/ã/g, 'a')
      .replace(/á/g, 'a')
      .replace(/à/g, 'a')
      .replace(/â/g, 'a')
      .replace(/é/g, 'e')
      .replace(/ê/g, 'e')
      .replace(/í/g, 'i')
      .replace(/ó/g, 'o')
      .replace(/ô/g, 'o')
      .replace(/õ/g, 'o')
      .replace(/ú/g, 'u')
      .replace(/ü/g, 'u')
      .replace(/ç/g, 'c')
      // Remover pontuação e caracteres especiais, manter espaços
      .replace(/[^\w\s]/g, ' ')
      // Normalizar espaços múltiplos
      .replace(/\s+/g, ' ')
      .trim();
    
    return normalized;
  };

  // Função para calcular similaridade entre strings
  const calculateSimilarity = (str1: string, str2: string) => {
    const s1 = normalizeText(str1);
    const s2 = normalizeText(str2);
    
    if (s1 === s2) return 1;
    
    const words1 = s1.split(' ').filter(w => w.length > 1);
    const words2 = s2.split(' ').filter(w => w.length > 1);
    
    let matches = 0;
    const totalWords = Math.max(words1.length, words2.length);
    
    words1.forEach(word1 => {
      const found = words2.some(word2 => {
        // Correspondência exata
        if (word1 === word2) return true;
        // Uma palavra contém a outra (mínimo 3 caracteres)
        if (word1.length >= 3 && word2.length >= 3) {
          return word1.includes(word2) || word2.includes(word1);
        }
        return false;
      });
      if (found) matches++;
    });
    
    return totalWords > 0 ? matches / totalWords : 0;
  };

  // Função de correspondência completamente reescrita e melhorada
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

    let bestMatch = null;
    let bestScore = 0;

    // Procurar em todos os materiais da base de dados
    for (let i = 0; i < databaseMaterials.length; i++) {
      const dbMaterial = databaseMaterials[i];
      const dbName = normalizeText(dbMaterial.name);
      const dbManufacturer = normalizeText(dbMaterial.manufacturer);
      
      console.log(`\n🔍 Checking DB[${i}]: "${dbMaterial.name}" by "${dbMaterial.manufacturer}"`);
      console.log(`  Normalized: "${dbName}" by "${dbManufacturer}"`);

      // 1. CORRESPONDÊNCIA EXATA (100%)
      if (dbName === excelName && dbManufacturer === excelManufacturer) {
        console.log('✅ PERFECT MATCH FOUND (100%)!');
        return dbMaterial;
      }

      // 2. CORRESPONDÊNCIA EXATA APENAS NO NOME (95%)
      if (dbName === excelName) {
        console.log('✅ EXACT NAME MATCH (95%)!');
        if (bestScore < 0.95) {
          bestMatch = dbMaterial;
          bestScore = 0.95;
        }
        continue;
      }

      // 3. CORRESPONDÊNCIA POR SIMILARIDADE NO NOME
      const nameSimilarity = calculateSimilarity(excelName, dbName);
      let manufacturerSimilarity = 0;
      
      if (excelManufacturer && dbManufacturer) {
        manufacturerSimilarity = calculateSimilarity(excelManufacturer, dbManufacturer);
      }

      // Score combinado: 70% nome, 30% fabricante
      const combinedScore = (nameSimilarity * 0.7) + (manufacturerSimilarity * 0.3);
      
      console.log(`  Name similarity: ${(nameSimilarity * 100).toFixed(1)}%`);
      console.log(`  Manufacturer similarity: ${(manufacturerSimilarity * 100).toFixed(1)}%`);
      console.log(`  Combined score: ${(combinedScore * 100).toFixed(1)}%`);

      // Aceitar se a similaridade for alta o suficiente
      if (combinedScore > bestScore && combinedScore >= 0.6) {
        bestMatch = dbMaterial;
        bestScore = combinedScore;
        console.log(`  ⭐ New best match with score ${(combinedScore * 100).toFixed(1)}%`);
      }

      // 4. CORRESPONDÊNCIA FLEXÍVEL - verifica se uma string contém a outra
      if (bestScore < 0.5) {
        const excelWords = excelName.split(' ').filter(w => w.length > 2);
        const dbWords = dbName.split(' ').filter(w => w.length > 2);
        
        let containsMatches = 0;
        excelWords.forEach(excelWord => {
          dbWords.forEach(dbWord => {
            if (excelWord.includes(dbWord) || dbWord.includes(excelWord)) {
              containsMatches++;
            }
          });
        });
        
        const containsScore = excelWords.length > 0 ? containsMatches / excelWords.length : 0;
        
        if (containsScore > bestScore && containsScore >= 0.4) {
          bestMatch = dbMaterial;
          bestScore = containsScore;
          console.log(`  📝 Flexible match with score ${(containsScore * 100).toFixed(1)}%`);
        }
      }
    }

    if (bestMatch) {
      console.log(`✅ BEST MATCH FOUND with score ${(bestScore * 100).toFixed(1)}%:`, bestMatch.name);
    } else {
      console.log('❌ NO SUITABLE MATCH FOUND');
    }
    
    console.log('🔍 ===========================================\n');
    return bestMatch;
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
      existingMaterials.slice(0, 10).forEach((m, i) => {
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
