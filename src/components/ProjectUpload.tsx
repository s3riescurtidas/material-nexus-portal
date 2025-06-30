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

  // Normalização de texto extremamente robusta
  const normalizeText = (text: string): string => {
    if (!text || typeof text !== 'string') return '';
    
    return text
      .toLowerCase()
      .trim()
      // Remover acentos portugueses
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      // Caracteres específicos portugueses
      .replace(/ã/g, 'a').replace(/á/g, 'a').replace(/à/g, 'a').replace(/â/g, 'a')
      .replace(/é/g, 'e').replace(/ê/g, 'e').replace(/è/g, 'e')
      .replace(/í/g, 'i').replace(/î/g, 'i').replace(/ì/g, 'i')
      .replace(/ó/g, 'o').replace(/ô/g, 'o').replace(/õ/g, 'o').replace(/ò/g, 'o')
      .replace(/ú/g, 'u').replace(/û/g, 'u').replace(/ù/g, 'u').replace(/ü/g, 'u')
      .replace(/ç/g, 'c')
      // Remover pontuação, manter apenas letras, números e espaços
      .replace(/[^a-z0-9\s]/g, ' ')
      // Normalizar espaços
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Extrair palavras-chave significativas
  const extractKeywords = (text: string): string[] => {
    const normalized = normalizeText(text);
    const words = normalized.split(' ').filter(word => 
      word.length >= 3 && // Palavras com pelo menos 3 caracteres
      !['para', 'com', 'por', 'sem', 'the', 'and', 'for', 'with'].includes(word) // Excluir palavras comuns
    );
    return [...new Set(words)]; // Remover duplicados
  };

  // Calcular similaridade entre duas strings
  const calculateStringSimilarity = (str1: string, str2: string): number => {
    const s1 = normalizeText(str1);
    const s2 = normalizeText(str2);
    
    if (s1 === s2) return 1.0;
    if (!s1 || !s2) return 0;
    
    // Algoritmo de Levenshtein simplificado
    const matrix = [];
    const len1 = s1.length;
    const len2 = s2.length;
    
    for (let i = 0; i <= len2; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len1; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= len2; i++) {
      for (let j = 1; j <= len1; j++) {
        if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    const maxLen = Math.max(len1, len2);
    return maxLen === 0 ? 1 : (maxLen - matrix[len2][len1]) / maxLen;
  };

  // Calcular similaridade entre palavras-chave
  const calculateKeywordSimilarity = (keywords1: string[], keywords2: string[]): number => {
    if (keywords1.length === 0 || keywords2.length === 0) return 0;
    
    let matches = 0;
    const totalKeywords = Math.max(keywords1.length, keywords2.length);
    
    keywords1.forEach(keyword1 => {
      const bestMatch = Math.max(...keywords2.map(keyword2 => {
        // Correspondência exata
        if (keyword1 === keyword2) return 1;
        
        // Uma palavra contém a outra
        if (keyword1.length >= 3 && keyword2.length >= 3) {
          if (keyword1.includes(keyword2) || keyword2.includes(keyword1)) {
            return 0.8;
          }
        }
        
        // Similaridade de string
        return calculateStringSimilarity(keyword1, keyword2);
      }));
      
      if (bestMatch > 0.6) matches += bestMatch;
    });
    
    return totalKeywords > 0 ? matches / totalKeywords : 0;
  };

  // Algoritmo principal de correspondência de materiais
  const findMatchingMaterial = (excelMaterial: any, databaseMaterials: any[]) => {
    if (!databaseMaterials || databaseMaterials.length === 0) {
      console.log('❌ Database materials is empty or undefined');
      return null;
    }

    const excelName = normalizeText(excelMaterial.name || '');
    const excelManufacturer = normalizeText(excelMaterial.manufacturer || '');
    
    console.log('\n🔍 =============================================');
    console.log('🔍 MATERIAL MATCHING ANALYSIS');
    console.log('📋 Excel Material:', {
      original: { name: excelMaterial.name, manufacturer: excelMaterial.manufacturer },
      normalized: { name: excelName, manufacturer: excelManufacturer }
    });
    console.log('📊 Searching in', databaseMaterials.length, 'database materials');
    
    if (!excelName) {
      console.log('❌ Excel material name is empty');
      return null;
    }

    let bestMatch = null;
    let bestScore = 0;
    const MIN_SCORE = 0.5; // Score mínimo para considerar uma correspondência
    
    const excelNameKeywords = extractKeywords(excelName);
    console.log('🔑 Excel keywords:', excelNameKeywords);

    // Iterar por todos os materiais da base de dados
    databaseMaterials.forEach((dbMaterial, index) => {
      const dbName = normalizeText(dbMaterial.name || '');
      const dbManufacturer = normalizeText(dbMaterial.manufacturer || '');
      
      if (!dbName) return; // Skip materiais sem nome
      
      console.log(`\n🔍 [${index + 1}/${databaseMaterials.length}] Analyzing:`, {
        db: { name: dbMaterial.name, manufacturer: dbMaterial.manufacturer },
        normalized: { name: dbName, manufacturer: dbManufacturer }
      });

      let totalScore = 0;
      let matchType = '';

      // 1. CORRESPONDÊNCIA EXATA COMPLETA (100%)
      if (dbName === excelName && dbManufacturer === excelManufacturer) {
        totalScore = 1.0;
        matchType = 'EXACT_COMPLETE';
        console.log('✅ EXACT COMPLETE MATCH (100%)');
      }
      // 2. CORRESPONDÊNCIA EXATA APENAS NO NOME (90%)
      else if (dbName === excelName) {
        totalScore = 0.9;
        matchType = 'EXACT_NAME';
        console.log('✅ EXACT NAME MATCH (90%)');
      }
      // 3. CORRESPONDÊNCIA POR SIMILARIDADE
      else {
        const dbNameKeywords = extractKeywords(dbName);
        console.log('🔑 DB keywords:', dbNameKeywords);
        
        // Similaridade de string direta
        const stringSimilarity = calculateStringSimilarity(excelName, dbName);
        console.log('📊 String similarity:', (stringSimilarity * 100).toFixed(1) + '%');
        
        // Similaridade de palavras-chave
        const keywordSimilarity = calculateKeywordSimilarity(excelNameKeywords, dbNameKeywords);
        console.log('🔑 Keyword similarity:', (keywordSimilarity * 100).toFixed(1) + '%');
        
        // Verificar se uma string contém a outra
        let containsScore = 0;
        if (excelName.includes(dbName) || dbName.includes(excelName)) {
          containsScore = 0.7;
          console.log('📝 Contains match found (70%)');
        }
        
        // Similaridade do fabricante (se disponível)
        let manufacturerSimilarity = 0;
        if (excelManufacturer && dbManufacturer) {
          manufacturerSimilarity = calculateStringSimilarity(excelManufacturer, dbManufacturer);
          console.log('🏭 Manufacturer similarity:', (manufacturerSimilarity * 100).toFixed(1) + '%');
        }
        
        // Score combinado: 60% nome, 20% palavras-chave, 20% fabricante
        totalScore = (stringSimilarity * 0.6) + (keywordSimilarity * 0.2) + (manufacturerSimilarity * 0.2);
        
        // Bonus por correspondência "contains"
        if (containsScore > 0) {
          totalScore = Math.max(totalScore, containsScore);
          matchType = 'CONTAINS';
        } else {
          matchType = 'SIMILARITY';
        }
        
        console.log('📊 Combined score:', (totalScore * 100).toFixed(1) + '%');
      }

      // Atualizar melhor correspondência se o score for superior
      if (totalScore > bestScore && totalScore >= MIN_SCORE) {
        bestMatch = dbMaterial;
        bestScore = totalScore;
        console.log(`⭐ NEW BEST MATCH (${matchType}): ${(totalScore * 100).toFixed(1)}%`);
      }
    });

    if (bestMatch) {
      console.log(`✅ FINAL MATCH FOUND with score ${(bestScore * 100).toFixed(1)}%:`);
      console.log('  -', bestMatch.name, 'by', bestMatch.manufacturer);
    } else {
      console.log('❌ NO SUITABLE MATCH FOUND (minimum score: ' + (MIN_SCORE * 100) + '%)');
    }
    
    console.log('🔍 =============================================\n');
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
      console.log('\n📊 =================== EXCEL PROCESSING START ===================');
      console.log('📊 Database contains', existingMaterials.length, 'materials');
      
      // Log alguns materiais da base para debug
      console.log('📋 Database sample materials:');
      existingMaterials.slice(0, 5).forEach((m, i) => {
        console.log(`  [${i + 1}] "${m.name}" by "${m.manufacturer}"`);
      });
      console.log('📊 ============================================================\n');
      
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // Pular linha de cabeçalho
      const rows = jsonData.slice(1) as any[][];
      
      if (rows.length === 0) {
        throw new Error("Arquivo Excel vazio ou sem dados válidos");
      }

      const processedMaterials: ProjectMaterial[] = [];
      let matchedCount = 0;
      const errors: string[] = [];
      let validRowsCount = 0;

      // Processar cada linha do Excel
      for (let index = 0; index < rows.length; index++) {
        const row = rows[index];
        const rowNumber = index + 2;
        
        try {
          const id = row[0]?.toString().trim() || '';
          const name = row[1]?.toString().trim() || '';
          const manufacturer = row[2]?.toString().trim() || '';
          const m2 = row[3] ? parseFloat(row[3].toString()) : undefined;
          const m3 = row[4] ? parseFloat(row[4].toString()) : undefined;
          const units = row[5] ? parseFloat(row[5].toString()) : undefined;

          // Pular linhas completamente vazias
          if (!id && !name && !manufacturer && !m2 && !m3 && !units) {
            continue;
          }

          validRowsCount++;

          // Validações obrigatórias
          if (!name || !manufacturer) {
            errors.push(`Linha ${rowNumber}: Nome e Fabricante são obrigatórios`);
            continue;
          }

          if (!m2 && !m3 && !units) {
            errors.push(`Linha ${rowNumber}: Pelo menos uma quantidade (M², M³ ou Unidades) deve ser preenchida`);
            continue;
          }

          console.log(`\n📋 Processing Excel row ${rowNumber}:`);
          console.log(`  ID: "${id}"`);
          console.log(`  Name: "${name}"`);
          console.log(`  Manufacturer: "${manufacturer}"`);
          console.log(`  Quantities: M²=${m2}, M³=${m3}, Units=${units}`);

          // Tentar encontrar material correspondente
          const matchingMaterial = findMatchingMaterial(
            { name, manufacturer }, 
            existingMaterials
          );
          
          const projectMaterial: ProjectMaterial = {
            id: id || `ROW_${rowNumber}`,
            name,
            manufacturer,
            quantity_m2: m2 && !isNaN(m2) ? m2 : undefined,
            quantity_m3: m3 && !isNaN(m3) ? m3 : undefined,
            units: units && !isNaN(units) ? units : undefined,
            databaseMaterial: matchingMaterial
          };

          if (matchingMaterial) {
            matchedCount++;
            console.log(`✅ Row ${rowNumber}: MATCHED with database material ID ${matchingMaterial.id}`);
          } else {
            console.log(`❌ Row ${rowNumber}: NO MATCH FOUND in database`);
          }

          processedMaterials.push(projectMaterial);
          
        } catch (err) {
          console.error(`❌ Error processing row ${rowNumber}:`, err);
          errors.push(`Linha ${rowNumber}: Erro ao processar - ${err}`);
        }
      }

      const results = {
        total: validRowsCount,
        processed: processedMaterials.length,
        matched: matchedCount,
        errors: errors
      };

      console.log('\n📊 =================== PROCESSING RESULTS ===================');
      console.log('📊 Valid rows found:', results.total);
      console.log('📊 Materials processed:', results.processed);
      console.log('📊 Materials matched:', results.matched);
      console.log('📊 Materials unmatched:', results.processed - results.matched);
      console.log('📊 Processing errors:', results.errors.length);
      console.log('📊 Match rate:', results.processed > 0 ? ((results.matched / results.processed) * 100).toFixed(1) + '%' : '0%');
      console.log('📊 =========================================================\n');

      setUploadedMaterials(processedMaterials);
      setProcessingResults(results);
      onMaterialsUploaded(processedMaterials);
      
    } catch (err) {
      console.error('❌ Excel processing error:', err);
      setError("Erro ao processar arquivo Excel. Verifique o formato.");
      setProcessingResults({
        total: 0,
        processed: 0,
        matched: 0,
        errors: ["Erro de formato ou leitura do arquivo"]
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
              Formato: Colunas ID, Nome, Fabricante, M², M³, Unidades
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
                <p>Total de materiais válidos: {processingResults.total}</p>
                <p>Materiais processados: {processingResults.processed}</p>
                <p className="text-green-400">Materiais encontrados na base: {processingResults.matched}</p>
                <p className="text-red-400">Materiais não encontrados: {processingResults.processed - processingResults.matched}</p>
                <p>Taxa de correspondência: {processingResults.processed > 0 ? ((processingResults.matched / processingResults.processed) * 100).toFixed(1) + '%' : '0%'}</p>
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
