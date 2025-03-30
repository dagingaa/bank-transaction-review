"use client";

import React, { useState } from 'react';
import Papa from 'papaparse';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ColumnMapping {
  date: string;
  description: string;
  amountIn: string;
  amountOut: string;
  category?: string;
}

interface TransactionImportProps {
  handleFileUpload: (file: File, columnMapping: ColumnMapping) => Promise<void>;
  isLoading: boolean;
  error: string;
}

export function TransactionImport({
  handleFileUpload,
  isLoading,
  error
}: TransactionImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    date: '',
    description: '',
    amountIn: '',
    amountOut: '',
    category: ''
  });
  const [mappingStep, setMappingStep] = useState(false);

  const handleFileSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    processFile(selectedFile);
  };
  
  const processFile = async (selectedFile: File) => {
    setFile(selectedFile);
    
    try {
      const fileContent = await readFileAsText(selectedFile);
      parsePreview(fileContent);
    } catch (err) {
      console.error('Failed to read file:', err);
    }
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const droppedFile = files[0];
      
      // Check file type
      if (droppedFile.name.endsWith('.csv') || droppedFile.name.endsWith('.txt')) {
        processFile(droppedFile);
      } else {
        console.error('Invalid file type. Please upload a CSV or TXT file.');
      }
    }
  };
  
  const handleDropzoneClick = () => {
    fileInputRef.current?.click();
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('File reading error'));
      reader.readAsText(file);
    });
  };

  const parsePreview = (content: string) => {
    Papa.parse(content, {
      delimiter: '',  // Auto-detect delimiter
      preview: 5,     // Parse only first 5 rows for preview
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          // Get headers (first row)
          const headers = results.data[0] as string[];
          setHeaders(headers);
          
          // Get data for preview (rest of rows)
          const preview = results.data.slice(0, 5) as string[][];
          setFilePreview(preview);
          
          // Move to mapping step
          setMappingStep(true);
          
          // Set initial mapping based on common header naming patterns
          const initialMapping: ColumnMapping = {
            date: '',
            description: '',
            amountIn: '',
            amountOut: '',
            category: ''
          };
          
          // Try to auto-detect columns based on common names
          headers.forEach(header => {
            const lowerHeader = header.toLowerCase();
            
            // Date detection
            if (lowerHeader.includes('date') || lowerHeader.includes('dato') || lowerHeader.includes('time')) {
              initialMapping.date = header;
            }
            
            // Description detection
            if (lowerHeader.includes('description') || lowerHeader.includes('desc') || 
                lowerHeader.includes('narrative') || lowerHeader.includes('details') || 
                lowerHeader.includes('text')) {
              initialMapping.description = header;
            }
            
            // Amount In detection
            if (lowerHeader.includes('in') || lowerHeader.includes('credit') || 
                lowerHeader.includes('inn') || lowerHeader.includes('deposit')) {
              initialMapping.amountIn = header;
            }
            
            // Amount Out detection
            if (lowerHeader.includes('out') || lowerHeader.includes('debit') || 
                lowerHeader.includes('ut') || lowerHeader.includes('withdrawal')) {
              initialMapping.amountOut = header;
            }
            
            // Category detection
            if (lowerHeader.includes('category') || lowerHeader.includes('type') || 
                lowerHeader.includes('kategori') || lowerHeader.includes('group')) {
              initialMapping.category = header;
            }
          });
          
          setColumnMapping(initialMapping);
        }
      },
      error: (error: any) => {
        console.error('Error parsing file:', error);
      }
    });
  };

  const handleMappingChange = (field: keyof ColumnMapping, value: string) => {
    setColumnMapping(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImport = async () => {
    if (!file) return;
    
    // Validate the mapping - required fields
    if (!columnMapping.date || !columnMapping.description || 
        !columnMapping.amountIn || !columnMapping.amountOut) {
      console.error('Required fields not mapped');
      return;
    }
    
    // Call the parent handler with the file and column mapping directly
    await handleFileUpload(file, columnMapping);
  };

  const resetMapping = () => {
    setFile(null);
    setFilePreview([]);
    setHeaders([]);
    setColumnMapping({
      date: '',
      description: '',
      amountIn: '',
      amountOut: '',
      category: ''
    });
    setMappingStep(false);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Transaction Import</CardTitle>
        <CardDescription>Upload your bank transaction data in CSV format</CardDescription>
      </CardHeader>
      <CardContent>
        {!mappingStep ? (
          <div className="mb-4">
            <Label htmlFor="file-upload" className="mb-2">
              Upload transaction file (CSV/TXT)
            </Label>
            <div
              className={`border-2 border-dashed rounded-md p-6 transition-colors ${
                isDragging ? 'border-primary bg-primary/10' : 'border-muted-foreground/25'
              } cursor-pointer flex flex-col items-center justify-center text-center`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleDropzoneClick}
            >
              <div className="mb-2 text-3xl text-muted-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <p className="mb-1 text-sm font-medium">
                {isDragging ? 'Drop your file here' : 'Drag and drop your file here'}
              </p>
              <p className="text-xs text-muted-foreground">
                or click to browse files (CSV/TXT only)
              </p>
            </div>
            <input
              ref={fileInputRef}
              id="file-upload"
              type="file"
              accept=".csv,.txt"
              onChange={handleFileSelection}
              className="hidden"
            />
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Map Your CSV Columns</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Please map the columns from your file to the required fields.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date-column">Date <span className="text-destructive">*</span></Label>
                  <Select 
                    value={columnMapping.date} 
                    onValueChange={(value) => handleMappingChange('date', value)}
                  >
                    <SelectTrigger id="date-column">
                      <SelectValue placeholder="Select date column" />
                    </SelectTrigger>
                    <SelectContent>
                      {headers.map((header, index) => (
                        <SelectItem key={index} value={header}>{header}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description-column">Description <span className="text-destructive">*</span></Label>
                  <Select 
                    value={columnMapping.description} 
                    onValueChange={(value) => handleMappingChange('description', value)}
                  >
                    <SelectTrigger id="description-column">
                      <SelectValue placeholder="Select description column" />
                    </SelectTrigger>
                    <SelectContent>
                      {headers.map((header, index) => (
                        <SelectItem key={index} value={header}>{header}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="amount-in-column">Amount In <span className="text-destructive">*</span></Label>
                  <Select 
                    value={columnMapping.amountIn} 
                    onValueChange={(value) => handleMappingChange('amountIn', value)}
                  >
                    <SelectTrigger id="amount-in-column">
                      <SelectValue placeholder="Select amount in column" />
                    </SelectTrigger>
                    <SelectContent>
                      {headers.map((header, index) => (
                        <SelectItem key={index} value={header}>{header}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="amount-out-column">Amount Out <span className="text-destructive">*</span></Label>
                  <Select 
                    value={columnMapping.amountOut} 
                    onValueChange={(value) => handleMappingChange('amountOut', value)}
                  >
                    <SelectTrigger id="amount-out-column">
                      <SelectValue placeholder="Select amount out column" />
                    </SelectTrigger>
                    <SelectContent>
                      {headers.map((header, index) => (
                        <SelectItem key={index} value={header}>{header}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category-column">Category (Optional)</Label>
                  <Select 
                    value={columnMapping.category || "none"} 
                    onValueChange={(value) => handleMappingChange('category', value === "none" ? "" : value)}
                  >
                    <SelectTrigger id="category-column">
                      <SelectValue placeholder="Select category column (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {headers.map((header, index) => (
                        <SelectItem key={index} value={header}>{header}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <h4 className="text-md font-medium mb-2">Data Preview</h4>
              <div className="border rounded-md overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {headers.map((header, index) => (
                        <TableHead key={index}>
                          {header}
                          {columnMapping.date === header && " (Date)"}
                          {columnMapping.description === header && " (Description)"}
                          {columnMapping.amountIn === header && " (Amount In)"}
                          {columnMapping.amountOut === header && " (Amount Out)"}
                          {columnMapping.category === header && " (Category)"}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filePreview.slice(1).map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {row.map((cell, cellIndex) => (
                          <TableCell key={cellIndex}>{cell}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}

        {isLoading && <p className="text-muted-foreground">Loading transactions...</p>}
        {error && <p className="text-destructive">{error}</p>}
      </CardContent>
      
      {mappingStep && (
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={resetMapping}>
            Back
          </Button>
          <Button 
            onClick={handleImport}
            disabled={!columnMapping.date || !columnMapping.description || !columnMapping.amountIn || !columnMapping.amountOut}
          >
            Import Transactions
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}