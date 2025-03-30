"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Papa from 'papaparse';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { TransactionList } from "@/components/transaction-list";
import { TransactionSummary } from "@/components/transaction-summary";
import { TransactionImport } from "@/components/transaction-import";
import { TransactionFilter } from "@/components/transaction-filter";

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

  const formatDateForInput = useCallback((date: Date | null) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const formatDateForDisplay = useCallback((date: Date | null) => {
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }, []);

  // Optimize category change handler with useCallback
  const handleCategoryChange = useCallback((id: string, category: string) => {
    setCategories(prev => ({
      ...prev,
      [id]: category
    }));
  }, []);

  // Add sorting state
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Handle sorting
  const handleSort = useCallback((field: string) => {
    if (sortField === field) {
      // Toggle direction if clicking on the same field
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to descending
      setSortField(field);
      setSortDirection('desc');
    }
  }, [sortField]);

  // Memoize filtered and sorted transactions
  const filteredTransactions = useMemo(() => {
    if (transactions.length === 0) return [];
    
    // Filter first
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
    
    // Then sort
    if (sortField) {
      filtered.sort((a, b) => {
        let aValue, bValue;
        
        // Extract the correct field values based on sort field
        switch (sortField) {
          case 'date':
            aValue = a.date ? a.date.getTime() : 0;
            bValue = b.date ? b.date.getTime() : 0;
            break;
          case 'description':
            aValue = (a.Forklaring || '').toLowerCase();
            bValue = (b.Forklaring || '').toLowerCase();
            break;
          case 'amountOut':
            aValue = a.amountOut || 0;
            bValue = b.amountOut || 0;
            break;
          case 'amountIn':
            aValue = a.amountIn || 0;
            bValue = b.amountIn || 0;
            break;
          case 'category':
            aValue = (categories[a.id] || 'Kategori').toLowerCase();
            bValue = (categories[b.id] || 'Kategori').toLowerCase();
            break;
          default:
            aValue = a.date ? a.date.getTime() : 0;
            bValue = b.date ? b.date.getTime() : 0;
        }
        
        // Perform the sort based on direction
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    } else {
      // Default sort by date if no sort field specified
      filtered.sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));
    }
    
    return filtered;
  }, [transactions, startDate, endDate, sortField, sortDirection, categories]);

  const exportToCSV = useCallback(() => {
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
  }, [filteredTransactions, categories, formatDateForDisplay, formatDateForInput, setError]);

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
    <div className="w-full mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Bank Transaction Viewer</h1>
      
      <TransactionImport 
        handleFileUpload={handleFileUpload}
        isLoading={isLoading}
        error={error}
      />
      
      {fileUploaded && (
        <>
          <TransactionFilter
            startDate={startDate}
            endDate={endDate}
            setStartDate={setStartDate}
            setEndDate={setEndDate}
            exportToCSV={exportToCSV}
          />

          <TransactionSummary
            transactionCount={filteredTransactions.length}
            totalOut={totalOut}
            totalIn={totalIn}
            balance={balance}
            categoryTotals={categoryTotals}
          />

          <TransactionList 
            transactions={filteredTransactions}
            categories={categories}
            handleCategoryChange={handleCategoryChange}
            formatDateForDisplay={formatDateForDisplay}
            CATEGORIES={CATEGORIES}
            handleSort={handleSort}
            sortField={sortField}
            sortDirection={sortDirection}
            totalOut={totalOut}
            totalIn={totalIn}
          />
        </>
      )}
    </div>
  );
}