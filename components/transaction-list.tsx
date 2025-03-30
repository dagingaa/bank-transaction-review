"use client";

import React from 'react';
import { FixedSizeList as List } from 'react-window';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction List</CardTitle>
        <CardDescription>All transactions in the selected date range</CardDescription>
      </CardHeader>
      <CardContent>
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
              <div>
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
              </div>
            </div>
          </div>

          {/* Virtualized List */}
          {transactions.length > 0 && (
            <List
              height={600}
              width="100%"
              itemCount={transactions.length}
              itemSize={60}
              itemData={{
                transactions,
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
            <div className="grid grid-cols-5 gap-4 p-3">
              <div className="font-bold">TOTAL</div>
              <div>{transactions.length} transactions</div>
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
  );
}