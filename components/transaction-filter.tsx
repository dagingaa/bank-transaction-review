"use client";

import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TransactionFilterProps {
  startDate: string;
  endDate: string;
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
}

export function TransactionFilter({
  startDate,
  endDate,
  setStartDate,
  setEndDate
}: TransactionFilterProps) {
  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center">
        <Label htmlFor="start-date" className="mr-1 text-sm whitespace-nowrap">Start:</Label>
        <Input
          id="start-date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="h-8 w-auto text-sm"
        />
      </div>
      <div className="flex items-center">
        <Label htmlFor="end-date" className="mr-1 text-sm whitespace-nowrap">End:</Label>
        <Input
          id="end-date"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="h-8 w-auto text-sm"
        />
      </div>
    </div>
  );
}