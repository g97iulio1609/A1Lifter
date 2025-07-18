import React, { useState, useRef } from 'react';
import { Upload, Download, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useImportAthletes } from '@/hooks/useAthletes';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

interface CSVImportProps {
  onImportComplete: () => void;
}

interface ParsedAthlete {
  name: string;
  email: string;
  birthDate: Date;
  gender: 'M' | 'F';
  weightClass: string;
  federation: string;
  valid: boolean;
  errors: string[];
}

export const CSVImport: React.FC<CSVImportProps> = ({ onImportComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedAthletes, setParsedAthletes] = useState<ParsedAthlete[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const importMutation = useImportAthletes();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv') && !selectedFile.name.endsWith('.xlsx')) {
      toast.error('Formato file non supportato. Utilizzare CSV o Excel.');
      return;
    }

    setFile(selectedFile);
    parseFile(selectedFile);
  };

  const parseFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        let workbook;
        
        if (file.name.endsWith('.csv')) {
          workbook = XLSX.read(data, { type: 'binary' });
        } else {
          workbook = XLSX.read(data, { type: 'array' });
        }

        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const parsed = parseAthletes(jsonData as string[][]);
        setParsedAthletes(parsed);
      } catch (error) {
        toast.error('Errore durante la lettura del file');
        console.error('Parse error:', error);
      }
    };

    if (file.name.endsWith('.csv')) {
      reader.readAsBinaryString(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  };

  const parseAthletes = (data: string[][]): ParsedAthlete[] => {
    if (data.length < 2) return [];

    const headers = data[0];
    const rows = data.slice(1);

    return rows.map((row) => {
      const athlete: ParsedAthlete = {
        name: '',
        email: '',
        birthDate: new Date(),
        gender: 'M',
        weightClass: '',
        federation: '',
        valid: true,
        errors: [],
      };

      // Mappa le colonne (assumendo ordine standard)
      const nameIndex = headers.findIndex(h => h.toLowerCase().includes('nome'));
      const emailIndex = headers.findIndex(h => h.toLowerCase().includes('email'));
      const birthDateIndex = headers.findIndex(h => h.toLowerCase().includes('nascita') || h.toLowerCase().includes('data'));
      const genderIndex = headers.findIndex(h => h.toLowerCase().includes('genere') || h.toLowerCase().includes('sesso'));
      const weightClassIndex = headers.findIndex(h => h.toLowerCase().includes('peso') || h.toLowerCase().includes('categoria'));
      const federationIndex = headers.findIndex(h => h.toLowerCase().includes('federazione'));

      // Validazione e assegnazione valori
      if (nameIndex >= 0 && row[nameIndex]) {
        athlete.name = row[nameIndex].trim();
      } else {
        athlete.errors.push('Nome mancante');
        athlete.valid = false;
      }

      if (emailIndex >= 0 && row[emailIndex]) {
        const email = row[emailIndex].trim();
        if (email.includes('@')) {
          athlete.email = email;
        } else {
          athlete.errors.push('Email non valida');
          athlete.valid = false;
        }
      } else {
        athlete.errors.push('Email mancante');
        athlete.valid = false;
      }

      if (birthDateIndex >= 0 && row[birthDateIndex]) {
        const dateStr = row[birthDateIndex];
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          athlete.birthDate = date;
        } else {
          athlete.errors.push('Data di nascita non valida');
          athlete.valid = false;
        }
      } else {
        athlete.errors.push('Data di nascita mancante');
        athlete.valid = false;
      }

      if (genderIndex >= 0 && row[genderIndex]) {
        const gender = row[genderIndex].trim().toUpperCase();
        if (gender === 'M' || gender === 'F' || gender === 'MASCHIO' || gender === 'FEMMINA') {
          athlete.gender = gender.startsWith('M') ? 'M' : 'F';
        } else {
          athlete.errors.push('Genere non valido (M/F)');
          athlete.valid = false;
        }
      } else {
        athlete.errors.push('Genere mancante');
        athlete.valid = false;
      }

      if (weightClassIndex >= 0 && row[weightClassIndex]) {
        athlete.weightClass = row[weightClassIndex].trim();
      } else {
        athlete.errors.push('Categoria peso mancante');
        athlete.valid = false;
      }

      if (federationIndex >= 0 && row[federationIndex]) {
        athlete.federation = row[federationIndex].trim();
      } else {
        athlete.federation = 'Non specificata';
      }

      return athlete;
    });
  };

  const handleImport = async () => {
    const validAthletes = parsedAthletes.filter(a => a.valid);
    
    if (validAthletes.length === 0) {
      toast.error('Nessun atleta valido da importare');
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    try {
      const athletesData = validAthletes.map(athlete => ({
        name: athlete.name,
        email: athlete.email,
        birthDate: athlete.birthDate,
        gender: athlete.gender,
        weightClass: athlete.weightClass,
        federation: athlete.federation,
        personalRecords: {},
      }));

      // Simula progresso
      const progressInterval = setInterval(() => {
        setImportProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      await importMutation.mutateAsync(athletesData);
      
      clearInterval(progressInterval);
      setImportProgress(100);
      
      toast.success(`${validAthletes.length} atleti importati con successo`);
      onImportComplete();
      
      // Reset
      setFile(null);
      setParsedAthletes([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      toast.error('Errore durante l\'importazione');
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
  };

  const downloadTemplate = () => {
    const template = [
      ['Nome', 'Email', 'Data Nascita', 'Genere', 'Categoria Peso', 'Federazione'],
      ['Mario Rossi', 'mario.rossi@email.com', '1990-01-15', 'M', '83kg', 'FIPL'],
      ['Anna Verdi', 'anna.verdi@email.com', '1995-05-20', 'F', '63kg', 'FIPL'],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
    XLSX.writeFile(workbook, 'template_atleti.xlsx');
  };

  const validCount = parsedAthletes.filter(a => a.valid).length;
  const invalidCount = parsedAthletes.filter(a => !a.valid).length;

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Importazione Atleti
        </CardTitle>
        <CardDescription>
          Importa atleti da file CSV o Excel
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="mr-2 h-4 w-4" />
            Scarica Template
          </Button>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <FileText className="mr-2 h-4 w-4" />
            Seleziona File
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx"
          onChange={handleFileSelect}
          className="hidden"
        />

        {file && (
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              File selezionato: {file.name}
            </AlertDescription>
          </Alert>
        )}

        {parsedAthletes.length > 0 && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Badge variant="default">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                {validCount} validi
              </Badge>
              {invalidCount > 0 && (
                <Badge variant="destructive">
                  <AlertCircle className="mr-1 h-3 w-3" />
                  {invalidCount} con errori
                </Badge>
              )}
            </div>

            {invalidCount > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {invalidCount} atleti presentano errori e non verranno importati.
                  Controlla i dati e riprova.
                </AlertDescription>
              </Alert>
            )}

            <div className="max-h-60 overflow-y-auto space-y-2">
              {parsedAthletes.slice(0, 10).map((athlete, index) => (
                <div key={index} className={`p-3 rounded border ${athlete.valid ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{athlete.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {athlete.email} • {athlete.gender} • {athlete.weightClass}
                      </div>
                    </div>
                    <div>
                      {athlete.valid ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                  </div>
                  {!athlete.valid && (
                    <div className="mt-2 text-sm text-red-600">
                      {athlete.errors.join(', ')}
                    </div>
                  )}
                </div>
              ))}
              {parsedAthletes.length > 10 && (
                <div className="text-center text-sm text-muted-foreground">
                  ... e altri {parsedAthletes.length - 10} atleti
                </div>
              )}
            </div>

            {isImporting && (
              <div className="space-y-2">
                <Progress value={importProgress} />
                <div className="text-sm text-center text-muted-foreground">
                  Importazione in corso... {importProgress}%
                </div>
              </div>
            )}

            <Button 
              onClick={handleImport} 
              disabled={validCount === 0 || isImporting}
              className="w-full"
            >
              <Upload className="mr-2 h-4 w-4" />
              {isImporting ? 'Importando...' : `Importa ${validCount} Atleti`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};