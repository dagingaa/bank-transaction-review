"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Cell, Legend, Pie, PieChart } from "recharts";

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
  // Color palettes for charts
  const greenShades = [
    '#4ade80', '#22c55e', '#16a34a', '#15803d', '#166534',
    '#059669', '#10b981', '#34d399', '#14b8a6', '#0f766e'
  ];
  
  const redShades = [
    '#f87171', '#ef4444', '#dc2626', '#b91c1c', '#991b1b',
    '#f43f5e', '#e11d48', '#be123c', '#9f1239', '#881337'
  ];

  // Use React.useMemo to ensure consistent colors between renders
  const inData = React.useMemo(() => {
    const categoryNames = Object.keys(categoryTotals)
      .filter(name => categoryTotals[name].in > 0)
      .sort((a, b) => a.localeCompare(b));
      
    return categoryNames.map((name, index) => ({
      name,
      value: categoryTotals[name].in,
      fill: greenShades[index % greenShades.length]
    }));
  }, [categoryTotals, greenShades]);

  const outData = React.useMemo(() => {
    const categoryNames = Object.keys(categoryTotals)
      .filter(name => categoryTotals[name].out > 0)
      .sort((a, b) => a.localeCompare(b));
      
    return categoryNames.map((name, index) => ({
      name,
      value: categoryTotals[name].out,
      fill: redShades[index % redShades.length]
    }));
  }, [categoryTotals, redShades]);
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
          {/* Income Pie Chart */}
          <div>
            <ChartContainer 
              className="w-full h-[250px]"
              config={{
                income: { 
                  theme: { 
                    light: 'hsl(142, 71%, 45%)', 
                    dark: 'hsl(142, 71%, 45%)' 
                  }
                }
              }}
            >
              <PieChart>
                <Pie
                  data={inData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  innerRadius={60}
                  outerRadius={80}
                  dataKey="value"
                >
                  {inData.map((entry, index) => (
                    <Cell key={`cell-in-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <g>
                  <text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle" className="text-lg font-bold fill-current">
                    {totalIn.toFixed(0)} NOK
                  </text>
                  <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" className="text-xs fill-muted-foreground">
                    Total Income
                  </text>
                </g>
                <ChartTooltip
                  content={<ChartTooltipContent />}
                />
              </PieChart>
            </ChartContainer>
          </div>
          
          {/* Expense Pie Chart */}
          <div>
            <ChartContainer 
              className="w-full h-[250px]"
              config={{
                expense: { 
                  theme: { 
                    light: 'hsl(0, 84%, 60%)', 
                    dark: 'hsl(0, 84%, 60%)' 
                  }
                }
              }}
            >
              <PieChart>
                <Pie
                  data={outData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  innerRadius={60}
                  outerRadius={80}
                  dataKey="value"
                >
                  {outData.map((entry, index) => (
                    <Cell key={`cell-out-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <g>
                  <text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle" className="text-lg font-bold fill-current">
                    {totalOut.toFixed(0)} NOK
                  </text>
                  <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" className="text-xs fill-muted-foreground">
                    Total Expenses
                  </text>
                </g>
                <ChartTooltip
                  content={<ChartTooltipContent />}
                />
              </PieChart>
            </ChartContainer>
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