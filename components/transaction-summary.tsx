"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface CategoryTotal {
  in: number;
  out: number;
}

interface TransactionSummaryProps {
  transactionCount: number;
  totalOut: number;
  totalIn: number;
  balance: number;
  categoryTotals: Record<string, CategoryTotal>;
}

export function TransactionSummary({
  transactionCount,
  totalOut,
  totalIn,
  balance,
  categoryTotals
}: TransactionSummaryProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Transaction Summary</CardTitle>
        <CardDescription>Overview of your transaction data</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="bg-muted p-3 rounded-md">
            <span className="font-medium block">Total Transactions</span>
            <span className="text-xl">{transactionCount}</span>
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
                <div 
                  key={category} 
                  className={`p-2 rounded ${
                    totals.in - totals.out < 0 
                      ? 'border-2 border-red-500 dark:border-red-400' 
                      : 'border'
                  }`}
                >
                  <div className="font-medium">{category}</div>
                  <div className="flex justify-between">
                    <span>In: <span className="text-green-600 dark:text-green-400">{totals.in.toFixed(2)}</span></span>
                    <span>Out: <span className="text-red-600 dark:text-red-400">{totals.out.toFixed(2)}</span></span>
                  </div>
                  <div className="mt-1 text-right font-bold">
                    Balance: <span className={totals.in - totals.out < 0 ? "text-red-700 dark:text-red-500" : "text-green-700 dark:text-green-500"}>
                      {(totals.in - totals.out).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))
            }
          </div>
        </details>
      </CardContent>
    </Card>
  );
}