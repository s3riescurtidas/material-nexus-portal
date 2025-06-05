
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, FileText } from "lucide-react";

interface Evaluation {
  id: number;
  type: string;
  version: string;
  issueDate: string;
  validTo: string;
  conformity: number;
  geographicArea: string;
  fileName?: string;
  [key: string]: any;
}

interface EvaluationDetailsProps {
  evaluation: Evaluation;
  onClose: () => void;
  onOpenFile?: (fileName: string) => void;
}

export function EvaluationDetails({ evaluation, onClose, onOpenFile }: EvaluationDetailsProps) {
  const getConformityColor = (conformity: number) => {
    if (conformity >= 80) return 'text-green-400';
    if (conformity >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getConformityBadge = (conformity: number) => {
    if (conformity >= 80) return 'bg-green-600';
    if (conformity >= 50) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#282828] border-[#424242] text-white">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            Detalhes da Avaliação
            <Button 
              onClick={onClose}
              variant="outline"
              size="sm"
              className="bg-[#323232] border-[#424242] text-white hover:bg-[#424242]"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <Card className="bg-[#323232] border-[#424242]">
          <CardHeader>
            <CardTitle className="text-white text-xl flex items-center justify-between">
              {evaluation.type}
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getConformityBadge(evaluation.conformity)} text-white`}>
                {evaluation.conformity}% Conformidade
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-sm">Versão</p>
                <p className="text-white">{evaluation.version}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Data de Emissão</p>
                <p className="text-white">{evaluation.issueDate}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Válido Até</p>
                <p className="text-white">{evaluation.validTo}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Área Geográfica</p>
                <p className="text-white">{evaluation.geographicArea}</p>
              </div>
            </div>

            {evaluation.fileName && (
              <div className="pt-4 border-t border-[#424242]">
                <Button
                  variant="outline"
                  className="bg-[#35568C] hover:bg-[#89A9D2] text-white"
                  onClick={() => onOpenFile && onOpenFile(evaluation.fileName!)}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Ver Ficheiro
                </Button>
              </div>
            )}

            {/* Show additional evaluation-specific fields */}
            <div className="pt-4 border-t border-[#424242]">
              <h4 className="text-white font-semibold mb-2">Campos Específicos</h4>
              <div className="space-y-2">
                {Object.entries(evaluation).map(([key, value]) => {
                  // Skip common fields that are already displayed
                  if (['id', 'type', 'version', 'issueDate', 'validTo', 'conformity', 'geographicArea', 'fileName'].includes(key)) {
                    return null;
                  }
                  
                  if (value !== null && value !== undefined && value !== '') {
                    return (
                      <div key={key} className="grid grid-cols-2 gap-2">
                        <p className="text-gray-400 text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                        <p className="text-white text-sm">{typeof value === 'boolean' ? (value ? 'Sim' : 'Não') : String(value)}</p>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
