"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Papa from 'papaparse';
import { FixedSizeList as List } from 'react-window';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";

interface Transaction {
  id: string;
  date: Date | null;
  Dato?: string;
  Forklaring?: string;
  Rentedato?: string;
  amountOut: number;
  amountIn: number;
  [key: string]: any;
}

const CATEGORIES = [
  "Kategori", // Default/initial value
  "Annet", 
  "Dag-Inge", 
  "Dagligvarer", 
  "Storhandel", 
  "Tur", 
  "Nadia", 
  "Snack", 
  "Spise ute", 
  "Lunch", 
  "Gave", 
  "Trening", 
  "Taxi", 
  "Underholdning"
];

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [fileUploaded, setFileUploaded] = useState(false);
  const [categories, setCategories] = useState<Record<string, string>>({});

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError('');
    setCategories({}); // Reset categories when a new file is uploaded
    
    try {
      const fileContent = await readFileAsText(file);
      parseTransactions(fileContent);
      setFileUploaded(true);
    } catch (err) {
      setError('Failed to read file: ' + (err as Error).message);
      setIsLoading(false);
    }
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('File reading error'));
      reader.readAsText(file);
    });
  };

  const parseTransactions = (content: string) => {
    // Use a web worker or delayed execution to avoid blocking the UI
    setTimeout(() => {
      Papa.parse(content, {
        delimiter: ';',
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        transformHeader: (header) => {
          // Remove quotes from headers
          return header.replace(/"/g, '');
        },
        transform: (value) => {
          // Remove quotes from values
          if (typeof value === 'string') {
            return value.replace(/"/g, '');
          }
          return value;
        },
        complete: (results) => {
          if (results.data && results.data.length > 0) {
            // Process in chunks to avoid UI freezes
            const processChunk = (data: any[], startIndex: number, chunkSize: number) => {
              const endIndex = Math.min(startIndex + chunkSize, data.length);
              const chunk = data.slice(startIndex, endIndex);
              
              const processedChunk = chunk.map((item: any) => {
                // Convert string dates to Date objects
                const dateParts = item.Dato ? item.Dato.split('.') : [];
                const date = dateParts.length === 3 
                  ? new Date(dateParts[2], dateParts[1] - 1, dateParts[0])
                  : null;

                // Create a unique ID for each transaction
                const id = `${item.Dato || ''}_${item.Forklaring || ''}_${Math.random().toString(36).substr(2, 9)}`;

                return {
                  ...item,
                  id,
                  date,
                  amountOut: parseFloat(item['Ut fra konto']) || 0,
                  amountIn: parseFloat(item['Inn på konto']) || 0
                };
              });

              // Update the state with the processed chunk
              setTransactions(prev => [...prev, ...processedChunk]);

              // Process the next chunk or finish processing
              if (endIndex < data.length) {
                setTimeout(() => processChunk(data, endIndex, chunkSize), 0);
              } else {
                // All chunks processed, finalize
                setTransactions(prev => {
                  // Sort by date
                  const sortedData = [...prev].sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));
                  
                  // Find min and max dates
                  if (sortedData.length > 0) {
                    const dates = sortedData.map(t => t.date).filter(Boolean) as Date[];
                    if (dates.length > 0) {
                      const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
                      const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
                      
                      setStartDate(formatDateForInput(minDate));
                      setEndDate(formatDateForInput(maxDate));
                    }
                  }
                  
                  setIsLoading(false);
                  return sortedData;
                });
              }
            };
            
            // Start processing in chunks of 100 (adjust based on performance)
            setTransactions([]); // Clear any existing data
            processChunk(results.data, 0, 100);
          } else {
            setIsLoading(false);
          }
        },
        error: (error) => {
          setError('Error parsing file: ' + error.message);
          setIsLoading(false);
        }
      });
    }, 0); // Delay to allow UI to update
  };

  const formatDateForInput = (date: Date | null) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateForDisplay = (date: Date | null) => {
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  // Optimize category change handler with useCallback
  const handleCategoryChange = useCallback((id: string, category: string) => {
    setCategories(prev => ({
      ...prev,
      [id]: category
    }));
  }, []);

  const exportToCSV = () => {
    if (filteredTransactions.length === 0) {
      setError('No transactions to export');
      return;
    }
    
    try {
      // Prepare the data with headers
      const headers = [
        'Date', 
        'Description', 
        'Interest Date', 
        'Amount Out', 
        'Amount In',
        'Category'
      ];
      
      // Map transactions to rows
      const rows = filteredTransactions.map(transaction => [
        formatDateForDisplay(transaction.date),
        transaction.Forklaring,
        transaction.Rentedato,
        transaction.amountOut,
        transaction.amountIn,
        categories[transaction.id] || 'Kategori'
      ]);
      
      // Combine headers and rows
      const csvData = [headers, ...rows];
      
      // Convert to CSV string
      const csvContent = csvData.map(row => 
        row.map(cell => 
          typeof cell === 'string' ? `"${cell.replace(/"/g, '""')}"` : cell
        ).join(';')
      ).join('\n');
      
      // Create and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      // Set the date for the filename
      const today = new Date();
      const dateStr = formatDateForInput(today).replace(/-/g, '');
      
      link.setAttribute('href', url);
      link.setAttribute('download', `transactions_export_${dateStr}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setError('');
    } catch (err) {
      setError('Failed to export: ' + (err as Error).message);
    }
  };

  // Memoize filtered transactions to avoid unnecessary recalculations
  const filteredTransactions = useMemo(() => {
    if (transactions.length === 0) return [];
    
    let filtered = [...transactions];
    
    if (startDate) {
      const startDateTime = new Date(startDate).getTime();
      filtered = filtered.filter(t => t.date && t.date.getTime() >= startDateTime);
    }
    
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999); // End of the day
      filtered = filtered.filter(t => t.date && t.date.getTime() <= endDateTime.getTime());
    }
    
    return filtered;
  }, [transactions, startDate, endDate]);

  // Calculate totals for the filtered transactions (memoized)
  const { totalOut, totalIn, balance } = useMemo(() => {
    let totalOut = 0;
    let totalIn = 0;
    
    for (let i = 0; i < filteredTransactions.length; i++) {
      totalOut += filteredTransactions[i].amountOut || 0;
      totalIn += filteredTransactions[i].amountIn || 0;
    }
    
    return { totalOut, totalIn, balance: totalIn - totalOut };
  }, [filteredTransactions]);

  // Calculate totals by category (memoized)
  const categoryTotals = useMemo(() => {
    const totals: Record<string, { in: number; out: number }> = {};
    
    // Initialize totals for all categories
    CATEGORIES.forEach(category => {
      totals[category] = { in: 0, out: 0 };
    });
    
    for (let i = 0; i < filteredTransactions.length; i++) {
      const transaction = filteredTransactions[i];
      const category = categories[transaction.id] || 'Kategori';
      totals[category].in += transaction.amountIn || 0;
      totals[category].out += transaction.amountOut || 0;
    }
    
    return totals;
  }, [filteredTransactions, categories]);

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Bank Transaction Viewer</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Transaction Import</CardTitle>
          <CardDescription>Upload your bank transaction data in CSV format</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Label htmlFor="file-upload" className="mb-2">
              Upload transaction file (CSV/TXT)
            </Label>
            <Input
              id="file-upload"
              type="file"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              className="cursor-pointer"
            />
          </div>

          {isLoading && <p className="text-muted-foreground">Loading transactions...</p>}
          {error && <p className="text-destructive">{error}</p>}
        </CardContent>
      </Card>
      
      {fileUploaded && (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filter Transactions</CardTitle>
              <CardDescription>Select date range to filter transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Label htmlFor="end-date">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                onClick={exportToCSV}
                variant="default"
                className="bg-green-600 hover:bg-green-700"
              >
                Export to CSV
              </Button>
            </CardFooter>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Transaction Summary</CardTitle>
              <CardDescription>Overview of your transaction data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="bg-muted p-3 rounded-md">
                  <span className="font-medium block">Total Transactions</span>
                  <span className="text-xl">{filteredTransactions.length}</span>
                </div>
                <div className="bg-muted p-3 rounded-md">
                  <span className="font-medium block">Total Out</span>
                  <span className="text-xl text-red-600 dark:text-red-400">{totalOut.toFixed(2)} NOK</span>
                </div>
                <div className="bg-muted p-3 rounded-md">
                  <span className="font-medium block">Total In</span>
                  <span className="text-xl text-green-600 dark:text-green-400">{totalIn.toFixed(2)} NOK</span>
                </div>
                <div className="bg-muted p-3 rounded-md">
                  <span className="font-medium block">Balance</span>
                  <span className="text-xl">{balance.toFixed(2)} NOK</span>
                </div>
              </div>
              
              <details className="text-sm">
                <summary className="font-medium cursor-pointer p-2 bg-muted rounded-md">
                  Category Summary
                </summary>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {Object.entries(categoryTotals)
                    .filter(([category, totals]) => (totals.in > 0 || totals.out > 0))
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([category, totals]) => (
                      <div key={category} className="p-2 border rounded">
                        <div className="font-medium">{category}</div>
                        <div className="flex justify-between">
                          <span>In: <span className="text-green-600 dark:text-green-400">{totals.in.toFixed(2)}</span></span>
                          <span>Out: <span className="text-red-600 dark:text-red-400">{totals.out.toFixed(2)}</span></span>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </details>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Transaction List</CardTitle>
              <CardDescription>All transactions in the selected date range</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                {/* Table Header */}
                <div className="border-b border-border">
                  <div className="grid grid-cols-5 gap-2 py-3 px-4 bg-muted/50">
                    <div className="font-medium text-sm">Date</div>
                    <div className="font-medium text-sm">Description</div>
                    <div className="font-medium text-sm text-right">Out</div>
                    <div className="font-medium text-sm text-right">In</div>
                    <div className="font-medium text-sm">Category</div>
                  </div>
                </div>
                
                {/* Virtualized Table Body */}
                {filteredTransactions.length > 0 && (
                  <List
                    height={400}
                    width="100%"
                    itemCount={filteredTransactions.length}
                    itemSize={60}
                    itemData={{
                      transactions: filteredTransactions,
                      categories,
                      handleCategoryChange,
                      formatDateForDisplay,
                      CATEGORIES
                    }}
                  >
                    {({ index, style, data }) => {
                      const transaction = data.transactions[index];
                      return (
                        <div 
                          style={style} 
                          className={`grid grid-cols-5 gap-2 px-4 py-2 items-center ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'} hover:bg-muted/50`}
                        >
                          <div className="whitespace-nowrap">
                            {transaction.date ? formatDateForDisplay(transaction.date) : ''}
                          </div>
                          <div className="truncate">
                            {transaction.Forklaring}
                          </div>
                          <div className={`text-right ${transaction.amountOut > 0 ? 'text-red-600 dark:text-red-400' : ''}`}>
                            {transaction.amountOut > 0 ? transaction.amountOut.toFixed(2) : ''}
                          </div>
                          <div className={`text-right ${transaction.amountIn > 0 ? 'text-green-600 dark:text-green-400' : ''}`}>
                            {transaction.amountIn > 0 ? transaction.amountIn.toFixed(2) : ''}
                          </div>
                          <div>
                            <Select
                              value={data.categories[transaction.id] || 'Kategori'}
                              onValueChange={(value) => data.handleCategoryChange(transaction.id, value)}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                {data.CATEGORIES.map(category => (
                                  <SelectItem key={category} value={category}>
                                    {category}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      );
                    }}
                  </List>
                )}
                
                {/* Table Footer */}
                <div className="border-t border-border bg-muted/50">
                  <div className="grid grid-cols-5 gap-2 py-3 px-4">
                    <div className="font-bold">TOTAL</div>
                    <div>{filteredTransactions.length} transactions</div>
                    <div className="text-right font-bold text-red-600 dark:text-red-400">
                      {totalOut.toFixed(2)}
                    </div>
                    <div className="text-right font-bold text-green-600 dark:text-green-400">
                      {totalIn.toFixed(2)}
                    </div>
                    <div></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}