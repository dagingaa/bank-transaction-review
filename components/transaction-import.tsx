"use client";

import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface TransactionImportProps {
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  isLoading: boolean;
  error: string;
}

export function TransactionImport({
  handleFileUpload,
  isLoading,
  error
}: TransactionImportProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Transaction Import</CardTitle>
        <CardDescription>Upload your bank transaction data in CSV format</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Label htmlFor="file-upload" className="mb-2">
            Upload transaction file (CSV/TXT)
          </Label>
          <Input
            id="file-upload"
            type="file"
            accept=".csv,.txt"
            onChange={handleFileUpload}
            className="cursor-pointer"
          />
        </div>

        {isLoading && <p className="text-muted-foreground">Loading transactions...</p>}
        {error && <p className="text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}