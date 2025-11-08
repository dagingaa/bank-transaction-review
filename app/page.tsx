"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TransactionList } from "@/components/transaction-list";
import { TransactionSummary } from "@/components/transaction-summary";
import { TransactionImport } from "@/components/transaction-import";
import { TransactionFilter } from "@/components/transaction-filter";
import { TransactionActions } from "@/components/transaction-actions";
import { Categories } from "@/components/categories";

interface Transaction {
  id: string;
  date: Date | null;
  description?: string;
  amountOut: number;
  amountIn: number;
  [key: string]: any;
}

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [fileUploaded, setFileUploaded] = useState(false);
  const [categories, setCategories] = useState<Record<string, string>>({});
  const [availableCategories, setAvailableCategories] = useState<string[]>([
    "(Not set)",
  ]);

  const handleFileUpload = async (
    file: File,
    columnMapping: {
      date: string;
      description: string;
      amountIn: string;
      amountOut: string;
      category?: string;
    }
  ) => {
    setIsLoading(true);
    setError("");
    setCategories({}); // Reset transaction-to-category mapping when a new file is uploaded
    // Note: We're not resetting availableCategories to preserve user's custom categories

    try {
      const fileContent = await readFileAsText(file);
      parseTransactionsWithMapping(fileContent, columnMapping);
      setFileUploaded(true);
    } catch (err) {
      setError("Failed to read file: " + (err as Error).message);
      setIsLoading(false);
    }
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error("File reading error"));
      reader.readAsText(file);
    });
  };

  const parseTransactionsWithMapping = (
    content: string,
    columnMapping: {
      date: string;
      description: string;
      amountIn: string;
      amountOut: string;
      category?: string;
    }
  ) => {
    // Use a web worker or delayed execution to avoid blocking the UI
    setTimeout(() => {
      Papa.parse(content, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        transformHeader: (header) => {
          // Remove quotes from headers
          return header.replace(/"/g, "");
        },
        transform: (value) => {
          // Remove quotes from values
          if (typeof value === "string") {
            return value.replace(/"/g, "");
          }
          return value;
        },
        complete: (results) => {
          if (results.data && results.data.length > 0) {
            // Process in chunks to avoid UI freezes
            const processChunk = (
              data: any[],
              startIndex: number,
              chunkSize: number
            ) => {
              const endIndex = Math.min(startIndex + chunkSize, data.length);
              const chunk = data.slice(startIndex, endIndex);

              const processedChunk = chunk.map((item: any) => {
                // Get values from the mapped columns
                const dateValue = item[columnMapping.date];
                const description = item[columnMapping.description];
                // remove commas from amountIn and amountOut
                const amountIn =
                  parseFloat(String(item[columnMapping.amountIn] || "").replace(/,/g, "")) ||
                  0;
                const amountOut =
                  parseFloat(String(item[columnMapping.amountOut] || "").replace(/,/g, "")) ||
                  0;
                const category = columnMapping.category
                  ? item[columnMapping.category]
                  : undefined;

                // Try to parse the date intelligently from common formats
                let date: Date | null = null;

                if (dateValue) {
                  // Try to parse the date intelligently
                  if (typeof dateValue === "string") {
                    // Try DD.MM.YYYY format (common in Europe)
                    const euroFormat = /(\d{1,2})\.(\d{1,2})\.(\d{4})/;
                    const euroMatch = dateValue.match(euroFormat);

                    if (euroMatch) {
                      const [_, day, month, year] = euroMatch;
                      date = new Date(
                        parseInt(year),
                        parseInt(month) - 1,
                        parseInt(day)
                      );
                    } else {
                      // Try YYYY-MM-DD format (ISO)
                      const isoFormat = /(\d{4})-(\d{1,2})-(\d{1,2})/;
                      const isoMatch = dateValue.match(isoFormat);

                      if (isoMatch) {
                        const [_, year, month, day] = isoMatch;
                        date = new Date(
                          parseInt(year),
                          parseInt(month) - 1,
                          parseInt(day)
                        );
                      } else {
                        // Try MM/DD/YYYY format (US)
                        const usFormat = /(\d{1,2})\/(\d{1,2})\/(\d{4})/;
                        const usMatch = dateValue.match(usFormat);

                        if (usMatch) {
                          const [_, month, day, year] = usMatch;
                          date = new Date(
                            parseInt(year),
                            parseInt(month) - 1,
                            parseInt(day)
                          );
                        } else {
                          // Last resort, try using JavaScript's Date parsing
                          const parsedDate = new Date(dateValue);
                          date = isNaN(parsedDate.getTime())
                            ? null
                            : parsedDate;
                        }
                      }
                    }
                  } else if (dateValue instanceof Date) {
                    date = dateValue;
                  }
                }

                // Create a unique ID for each transaction
                const id = `${dateValue || ""}_${description || ""}_${Math.random().toString(36).substr(2, 9)}`;

                // If category was mapped, add it to the categories state
                if (category && category.trim()) {
                  setCategories((prev) => ({
                    ...prev,
                    [id]: category.trim(),
                  }));
                }

                return {
                  ...item,
                  id,
                  date,
                  description, // Use description directly
                  amountOut,
                  amountIn,
                };
              });

              // Update the state with the processed chunk
              setTransactions((prev) => [...prev, ...processedChunk]);

              // Process the next chunk or finish processing
              if (endIndex < data.length) {
                setTimeout(() => processChunk(data, endIndex, chunkSize), 0);
              } else {
                // All chunks processed, finalize
                setTransactions((prev) => {
                  // Sort by date
                  const sortedData = [...prev].sort(
                    (a, b) =>
                      (b.date?.getTime() || 0) - (a.date?.getTime() || 0)
                  );

                  // Find min and max dates
                  if (sortedData.length > 0) {
                    const dates = sortedData
                      .map((t) => t.date)
                      .filter(Boolean) as Date[];
                    if (dates.length > 0) {
                      const minDate = new Date(
                        Math.min(...dates.map((d) => d.getTime()))
                      );
                      const maxDate = new Date(
                        Math.max(...dates.map((d) => d.getTime()))
                      );

                      setStartDate(formatDateForInput(minDate));
                      setEndDate(formatDateForInput(maxDate));
                    }

                    // Extract unique categories from imported data if a category column was mapped
                    if (
                      columnMapping.category &&
                      columnMapping.category.length > 0
                    ) {
                      // Get unique categories from data
                      const importedCategories = new Set<string>();

                      // Make sure we have the default category
                      importedCategories.add("(Not set)");

                      // Add categories from the data
                      for (const transaction of sortedData) {
                        const category = transaction[columnMapping.category];
                        if (
                          category &&
                          typeof category === "string" &&
                          category.trim()
                        ) {
                          importedCategories.add(category.trim());
                        }
                      }

                      // Update availableCategories with imported categories
                      const uniqueCategories = Array.from(importedCategories);
                      setAvailableCategories(uniqueCategories);
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
        error: (error: any) => {
          setError("Error parsing file: " + error.message);
          setIsLoading(false);
        },
      });
    }, 0); // Delay to allow UI to update
  };

  const formatDateForInput = useCallback((date: Date | null) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const formatDateForDisplay = useCallback((date: Date | null) => {
    if (!date) return "";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }, []);

  // Optimize category change handler with useCallback
  const handleCategoryChange = useCallback((id: string, category: string) => {
    setCategories((prev) => ({
      ...prev,
      [id]: category,
    }));
  }, []);

  // Add sorting state
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Handle sorting
  const handleSort = useCallback(
    (field: string) => {
      if (sortField === field) {
        // Toggle direction if clicking on the same field
        setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        // Set new field and default to descending
        setSortField(field);
        setSortDirection("desc");
      }
    },
    [sortField]
  );

  // Memoize filtered and sorted transactions
  const filteredTransactions = useMemo(() => {
    if (transactions.length === 0) return [];

    // Filter first
    let filtered = [...transactions];

    if (startDate) {
      const startDateTime = new Date(startDate).getTime();
      filtered = filtered.filter(
        (t) => t.date && t.date.getTime() >= startDateTime
      );
    }

    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999); // End of the day
      filtered = filtered.filter(
        (t) => t.date && t.date.getTime() <= endDateTime.getTime()
      );
    }

    // Then sort
    if (sortField) {
      filtered.sort((a, b) => {
        let aValue, bValue;

        // Extract the correct field values based on sort field
        switch (sortField) {
          case "date":
            aValue = a.date ? a.date.getTime() : 0;
            bValue = b.date ? b.date.getTime() : 0;
            break;
          case "description":
            aValue = (a.description || "").toLowerCase();
            bValue = (b.description || "").toLowerCase();
            break;
          case "amountOut":
            aValue = a.amountOut || 0;
            bValue = b.amountOut || 0;
            break;
          case "amountIn":
            aValue = a.amountIn || 0;
            bValue = b.amountIn || 0;
            break;
          case "category":
            aValue = (categories[a.id] || "(Not set)").toLowerCase();
            bValue = (categories[b.id] || "(Not set)").toLowerCase();
            break;
          default:
            aValue = a.date ? a.date.getTime() : 0;
            bValue = b.date ? b.date.getTime() : 0;
        }

        // Perform the sort based on direction
        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    } else {
      // Default sort by date if no sort field specified
      filtered.sort(
        (a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0)
      );
    }

    return filtered;
  }, [transactions, startDate, endDate, sortField, sortDirection, categories]);

  const exportToCSV = useCallback(() => {
    if (filteredTransactions.length === 0) {
      setError("No transactions to export");
      return;
    }

    try {
      // Prepare the data with headers
      const headers = [
        "Date",
        "Description",
        "Amount Out",
        "Amount In",
        "Category",
      ];

      // Map transactions to rows
      const rows = filteredTransactions.map((transaction) => [
        formatDateForDisplay(transaction.date),
        transaction.description,
        transaction.amountOut,
        transaction.amountIn,
        categories[transaction.id] || "(Not set)",
      ]);

      // Combine headers and rows
      const csvData = [headers, ...rows];

      // Convert to CSV string
      const csvContent = csvData
        .map((row) =>
          row
            .map((cell) =>
              typeof cell === "string" ? `"${cell.replace(/"/g, '""')}"` : cell
            )
            .join(";")
        )
        .join("\n");

      // Create and trigger download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      // Set the date for the filename
      const today = new Date();
      const dateStr = formatDateForInput(today).replace(/-/g, "");

      link.setAttribute("href", url);
      link.setAttribute("download", `transactions_export_${dateStr}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setError("");
    } catch (err) {
      setError("Failed to export: " + (err as Error).message);
    }
  }, [
    filteredTransactions,
    categories,
    formatDateForDisplay,
    formatDateForInput,
    setError,
  ]);

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
    availableCategories.forEach((category) => {
      totals[category] = { in: 0, out: 0 };
    });

    for (let i = 0; i < filteredTransactions.length; i++) {
      const transaction = filteredTransactions[i];
      const category = categories[transaction.id] || "(Not set)";

      // Ensure the category exists in totals (in case it's used but was removed from availableCategories)
      if (!totals[category]) {
        totals[category] = { in: 0, out: 0 };
      }

      totals[category].in += transaction.amountIn || 0;
      totals[category].out += transaction.amountOut || 0;
    }

    return totals;
  }, [filteredTransactions, categories, availableCategories]);

  // Reset all data and start over
  const resetFile = useCallback(() => {
    setTransactions([]);
    setCategories({});
    setFileUploaded(false);
    setStartDate("");
    setEndDate("");
    setError("");
    setSortField(null);
    setSortDirection("desc");
  }, []);

  return (
    <div className="w-full mx-auto p-4">
      <div className="flex flex-col space-y-4 mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Bank Transaction Review</h1>
          {fileUploaded && (
            <TransactionActions
              exportToCSV={exportToCSV}
              resetFile={resetFile}
            />
          )}
        </div>
        {fileUploaded && (
          <div className="flex justify-end">
            <TransactionFilter
              startDate={startDate}
              endDate={endDate}
              setStartDate={setStartDate}
              setEndDate={setEndDate}
            />
          </div>
        )}
      </div>

      {!fileUploaded && (
        <TransactionImport
          handleFileUpload={handleFileUpload}
          isLoading={isLoading}
          error={error}
        />
      )}

      {fileUploaded && (
        <>
          <div className="mb-4">
            <Categories
              categories={availableCategories}
              onCategoriesChange={setAvailableCategories}
            />
          </div>

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
            CATEGORIES={availableCategories}
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
