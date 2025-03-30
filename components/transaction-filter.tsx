"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface TransactionFilterProps {
  startDate: string;
  endDate: string;
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
  exportToCSV: () => void;
}

export function TransactionFilter({
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  exportToCSV
}: TransactionFilterProps) {
  return (
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
  );
}