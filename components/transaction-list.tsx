"use client";

import React, { useState, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { ArrowUpDown, ArrowUp, ArrowDown, Search, CheckCircle, Filter, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

// Special filter value for uncategorized transactions
const NOT_SET_CATEGORY = '(not set)';

interface Transaction {
  id: string;
  date: Date | null;
  description?: string;
  amountOut: number;
  amountIn: number;
  [key: string]: any;
}

interface TransactionListProps {
  transactions: Transaction[];
  categories: Record<string, string>;
  handleCategoryChange: (id: string, category: string) => void;
  formatDateForDisplay: (date: Date | null) => string;
  CATEGORIES: string[];
  handleSort: (field: string) => void;
  sortField: string | null;
  sortDirection: 'asc' | 'desc';
  totalOut: number;
  totalIn: number;
}

export function TransactionList({
  transactions,
  categories,
  handleCategoryChange,
  formatDateForDisplay,
  CATEGORIES,
  handleSort,
  sortField,
  sortDirection,
  totalOut,
  totalIn
}: TransactionListProps) {
  const [descriptionFilter, setDescriptionFilter] = useState('');
  const [selectedBulkCategory, setSelectedBulkCategory] = useState('');
  const [selectedCategoryFilters, setSelectedCategoryFilters] = useState<string[]>([]);
  
  // Get list of all categories currently in use
  const usedCategories = useMemo(() => {
    const uniqueCategories = new Set<string>();
    Object.values(categories).forEach(category => {
      if (category) uniqueCategories.add(category);
    });
    return Array.from(uniqueCategories).sort();
  }, [categories]);
  
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;
    
    // Apply description filter
    if (descriptionFilter) {
      filtered = filtered.filter(transaction => 
        transaction.description?.toLowerCase().includes(descriptionFilter.toLowerCase())
      );
    }
    
    // Apply category filters
    if (selectedCategoryFilters.length > 0) {
      filtered = filtered.filter(transaction => {
        const transactionCategory = categories[transaction.id];
        
        // Check if we're filtering for uncategorized transactions
        if (selectedCategoryFilters.includes(NOT_SET_CATEGORY)) {
          // If transaction has no category and we're filtering for uncategorized
          if (!transactionCategory || transactionCategory === '(Not set)') {
            return true;
          }
        }
        
        // Standard category filtering
        return transactionCategory && selectedCategoryFilters.includes(transactionCategory);
      });
    }
    
    return filtered;
  }, [transactions, descriptionFilter, categories, selectedCategoryFilters]);
  
  const handleApplyAllCategories = () => {
    if (!selectedBulkCategory) return;
    
    filteredTransactions.forEach(transaction => {
      handleCategoryChange(transaction.id, selectedBulkCategory);
    });
  };
  
  const toggleCategoryFilter = (category: string) => {
    setSelectedCategoryFilters(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };
  
  const clearAllCategoryFilters = () => {
    setSelectedCategoryFilters([]);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction List</CardTitle>
        <CardDescription>All transactions in the selected date range</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Filter by description..."
                value={descriptionFilter}
                onChange={(e) => setDescriptionFilter(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Select value={selectedBulkCategory} onValueChange={setSelectedBulkCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleApplyAllCategories}
                disabled={!selectedBulkCategory || filteredTransactions.length === 0}
                className="whitespace-nowrap"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Apply to {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
          
          {/* Active filters display */}
          {selectedCategoryFilters.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              <div className="text-sm text-muted-foreground py-1">Active filters:</div>
              {selectedCategoryFilters.map(category => (
                <Badge key={category} variant="secondary" className="gap-1 px-2 py-1">
                  {category}
                  <button 
                    onClick={() => toggleCategoryFilter(category)}
                    className="ml-1 rounded-full hover:bg-muted"
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Remove {category} filter</span>
                  </button>
                </Badge>
              ))}
              <Button
                variant="ghost" 
                size="sm" 
                onClick={clearAllCategoryFilters}
                className="h-6 px-2 text-xs"
              >
                Clear all
              </Button>
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          {/* Table header - separate from virtualized list */}
          <div className="border-b border-border">
            <div className="grid grid-cols-7 gap-4 p-3 bg-muted/50">
              <div>
                <button 
                  onClick={() => handleSort('date')} 
                  className="flex items-center gap-1 font-medium text-sm hover:text-primary"
                >
                  Date
                  {sortField === 'date' ? (
                    sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                  ) : (
                    <ArrowUpDown className="w-4 h-4 opacity-50" />
                  )}
                </button>
              </div>
              <div className="col-span-3">
                <button 
                  onClick={() => handleSort('description')} 
                  className="flex items-center gap-1 font-medium text-sm hover:text-primary text-left"
                >
                  Description
                  {sortField === 'description' ? (
                    sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                  ) : (
                    <ArrowUpDown className="w-4 h-4 opacity-50" />
                  )}
                </button>
              </div>
              <div>
                <button 
                  onClick={() => handleSort('amountOut')} 
                  className="flex items-center gap-1 font-medium text-sm hover:text-primary justify-end w-full"
                >
                  Out
                  {sortField === 'amountOut' ? (
                    sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                  ) : (
                    <ArrowUpDown className="w-4 h-4 opacity-50" />
                  )}
                </button>
              </div>
              <div>
                <button 
                  onClick={() => handleSort('amountIn')} 
                  className="flex items-center gap-1 font-medium text-sm hover:text-primary justify-end w-full"
                >
                  In
                  {sortField === 'amountIn' ? (
                    sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                  ) : (
                    <ArrowUpDown className="w-4 h-4 opacity-50" />
                  )}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <button 
                  onClick={() => handleSort('category')} 
                  className="flex items-center gap-1 font-medium text-sm hover:text-primary text-left"
                >
                  Category
                  {sortField === 'category' ? (
                    sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                  ) : (
                    <ArrowUpDown className="w-4 h-4 opacity-50" />
                  )}
                </button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button 
                      className={`p-1 rounded-md transition-colors ${selectedCategoryFilters.length > 0 ? 'text-primary bg-muted hover:bg-muted/80' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                      aria-label="Filter by category"
                    >
                      <Filter className="w-4 h-4" />
                      {selectedCategoryFilters.length > 0 && (
                        <span className="sr-only">
                          {selectedCategoryFilters.length} {selectedCategoryFilters.length === 1 ? 'filter' : 'filters'} active
                        </span>
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="flex items-center justify-between">
                      <span>Filter by Category</span>
                      {selectedCategoryFilters.length > 0 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={clearAllCategoryFilters}
                          className="h-auto p-1 text-xs"
                        >
                          Clear all
                        </Button>
                      )}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem
                      checked={selectedCategoryFilters.includes(NOT_SET_CATEGORY)}
                      onCheckedChange={() => toggleCategoryFilter(NOT_SET_CATEGORY)}
                      className="font-medium text-muted-foreground"
                    >
                      {NOT_SET_CATEGORY}
                    </DropdownMenuCheckboxItem>
                    
                    {usedCategories.length > 0 && <DropdownMenuSeparator />}
                    
                    {usedCategories.map(category => (
                      <DropdownMenuCheckboxItem
                        key={category}
                        checked={selectedCategoryFilters.includes(category)}
                        onCheckedChange={() => toggleCategoryFilter(category)}
                      >
                        {category}
                      </DropdownMenuCheckboxItem>
                    ))}
                    
                    {usedCategories.length === 0 && (
                      <div className="px-2 py-4 text-sm text-center text-muted-foreground">
                        No categories assigned yet
                      </div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Virtualized List */}
          {filteredTransactions.length > 0 && (
            <List
              height={600}
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
                    className={`grid grid-cols-7 gap-4 p-3 items-center ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'} hover:bg-muted/50`}
                  >
                    <div className="whitespace-nowrap">
                      {transaction.date ? data.formatDateForDisplay(transaction.date) : ''}
                    </div>
                    <div className="truncate max-w-md col-span-3">
                      {transaction.description}
                    </div>
                    <div className={`text-right ${transaction.amountOut > 0 ? 'text-red-600 dark:text-red-400' : ''}`}>
                      {transaction.amountOut > 0 ? transaction.amountOut.toFixed(2) : ''}
                    </div>
                    <div className={`text-right ${transaction.amountIn > 0 ? 'text-green-600 dark:text-green-400' : ''}`}>
                      {transaction.amountIn > 0 ? transaction.amountIn.toFixed(2) : ''}
                    </div>
                    <div>
                      <Select
                        value={data.categories[transaction.id] || '(Not set)'}
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
            <div className="grid grid-cols-5 gap-4 p-3">
              <div className="font-bold">TOTAL</div>
              <div>
                {filteredTransactions.length} 
                {filteredTransactions.length !== transactions.length && (
                  <span className="text-muted-foreground text-xs ml-1">
                    (filtered from {transactions.length})
                  </span>
                )}
                {" transactions"}
              </div>
              <div className="text-right font-bold text-red-600 dark:text-red-400">
                {filteredTransactions.reduce((sum, t) => sum + t.amountOut, 0).toFixed(2)}
              </div>
              <div className="text-right font-bold text-green-600 dark:text-green-400">
                {filteredTransactions.reduce((sum, t) => sum + t.amountIn, 0).toFixed(2)}
              </div>
              <div></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}