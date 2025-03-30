"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

interface TransactionActionsProps {
  exportToCSV: () => void;
  resetFile: () => void;
}

export function TransactionActions({
  exportToCSV,
  resetFile
}: TransactionActionsProps) {
  return (
    <div className="flex items-center space-x-2">
      <Button
        onClick={exportToCSV}
        variant="default"
        className="bg-green-600 hover:bg-green-700 h-8 text-sm"
        size="sm"
      >
        Export CSV
      </Button>
      <Button
        onClick={resetFile}
        variant="outline"
        className="h-8 text-sm"
        size="sm"
      >
        <Upload className="h-4 w-4 mr-1" />
        Upload New File
      </Button>
    </div>
  );
}