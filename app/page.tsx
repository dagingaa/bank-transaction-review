"use client";

import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';

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
          const processedData = results.data.map((item: any) => {
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

          // Sort transactions by date (newest first)
          const sortedData = processedData.sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));
          setTransactions(sortedData);

          // Find min and max dates for the date picker default values
          if (sortedData.length > 0) {
            const dates = sortedData.map(t => t.date).filter(Boolean) as Date[];
            if (dates.length > 0) {
              const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
              const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
              
              setStartDate(formatDateForInput(minDate));
              setEndDate(formatDateForInput(maxDate));
            }
          }
        }
        setIsLoading(false);
      },
      error: (error: any) => {
        setError('Error parsing file: ' + error.message);
        setIsLoading(false);
      }
    });
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

  const handleCategoryChange = (id: string, category: string) => {
    setCategories(prev => ({
      ...prev,
      [id]: category
    }));
  };

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

  useEffect(() => {
    if (transactions.length > 0) {
      filterTransactions();
    }
  }, [startDate, endDate, transactions]);

  const filterTransactions = () => {
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
    
    setFilteredTransactions(filtered);
  };

  // Calculate totals for the filtered transactions
  const calculateTotals = () => {
    let totalOut = 0;
    let totalIn = 0;
    
    filteredTransactions.forEach(transaction => {
      totalOut += transaction.amountOut || 0;
      totalIn += transaction.amountIn || 0;
    });
    
    return { totalOut, totalIn, balance: totalIn - totalOut };
  };

  // Calculate totals by category
  const calculateCategoryTotals = () => {
    const totals: Record<string, { in: number; out: number }> = {};
    
    // Initialize totals for all categories
    CATEGORIES.forEach(category => {
      totals[category] = { in: 0, out: 0 };
    });
    
    filteredTransactions.forEach(transaction => {
      const category = categories[transaction.id] || 'Kategori';
      totals[category].in += transaction.amountIn || 0;
      totals[category].out += transaction.amountOut || 0;
    });
    
    return totals;
  };
  
  const { totalOut, totalIn, balance } = calculateTotals();
  const categoryTotals = calculateCategoryTotals();

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Bank Transaction Viewer</h1>
      
      <div className="bg-white shadow rounded-lg p-6 mb-6 dark:bg-gray-800">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Upload transaction file (CSV/TXT)
          </label>
          <input
            type="file"
            accept=".csv,.txt"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:text-gray-400 dark:file:bg-gray-700 dark:file:text-gray-200"
          />
        </div>

        {isLoading && <p className="text-gray-600 dark:text-gray-400">Loading transactions...</p>}
        {error && <p className="text-red-600 dark:text-red-400">{error}</p>}
        
        {fileUploaded && (
          <div className="mt-6">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end mb-4">
              <button
                onClick={exportToCSV}
                className="px-4 py-2 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Export to CSV
              </button>
            </div>

            <div className="bg-gray-50 p-4 rounded-md mb-4 dark:bg-gray-700">
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="text-sm">
                  <span className="font-medium">Total Transactions:</span> {filteredTransactions.length}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Total Out:</span> {totalOut.toFixed(2)} NOK
                </div>
                <div className="text-sm">
                  <span className="font-medium">Total In:</span> {totalIn.toFixed(2)} NOK
                </div>
                <div className="text-sm">
                  <span className="font-medium">Balance:</span> {balance.toFixed(2)} NOK
                </div>
              </div>
              
              <details className="text-sm">
                <summary className="font-medium cursor-pointer">
                  Category Summary
                </summary>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {Object.entries(categoryTotals)
                    .filter(([category, totals]) => (totals.in > 0 || totals.out > 0))
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([category, totals]) => (
                      <div key={category} className="p-2 border rounded dark:border-gray-600">
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
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 divide-y divide-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Date
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Description
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Out
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      In
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Category
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                        {transaction.date ? formatDateForDisplay(transaction.date) : ''}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-300">
                        {transaction.Forklaring}
                      </td>
                      <td className={`px-4 py-2 whitespace-nowrap text-sm text-right ${transaction.amountOut > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
                        {transaction.amountOut > 0 ? transaction.amountOut.toFixed(2) : ''}
                      </td>
                      <td className={`px-4 py-2 whitespace-nowrap text-sm text-right ${transaction.amountIn > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                        {transaction.amountIn > 0 ? transaction.amountIn.toFixed(2) : ''}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-300">
                        <select
                          value={categories[transaction.id] || 'Kategori'}
                          onChange={(e) => handleCategoryChange(transaction.id, e.target.value)}
                          className="block w-full text-sm text-gray-700 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                          {CATEGORIES.map(category => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-100 border-t-2 border-gray-300 dark:bg-gray-700 dark:border-gray-600">
                  <tr>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-gray-300">
                      TOTAL
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300">
                      {filteredTransactions.length} transactions
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-right text-red-600 dark:text-red-400">
                      {totalOut.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-right text-green-600 dark:text-green-400">
                      {totalIn.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300">
                      {/* Empty cell for category column */}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
