"use client";

import { useState, useRef } from "react";
import { Upload, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { parseCSV } from "@/lib/csv-utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function CSVImportDialog({ open, onOpenChange, onImport, moduleLabel }) {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [recordCount, setRecordCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv")) {
      toast.error("Please select a CSV file");
      return;
    }

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const data = parseCSV(text);
        setRecordCount(data.length);
      } catch (err) {
        toast.error("Failed to parse CSV file");
        setFile(null);
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Please select a file");
      return;
    }

    setIsProcessing(true);
    try {
      const text = await file.text();
      const data = parseCSV(text);
      await onImport(data);
      toast.success(`${data.length} records imported successfully`);
      handleClose();
    } catch (err) {
      toast.error(err?.message || "Import failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setRecordCount(0);
    fileInputRef.current.value = "";
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import {moduleLabel}</DialogTitle>
          <DialogDescription>
            Upload a CSV file to import {moduleLabel.toLowerCase()}. The file must contain headers matching your data fields.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "w-full py-8 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors",
              file ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
            )}
          >
            <Upload className="size-6 text-muted-foreground" />
            <div className="text-sm text-center">
              <p className="font-medium text-foreground">
                {file ? file.name : "Click to select CSV file"}
              </p>
              {!file && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  or drag and drop
                </p>
              )}
            </div>
          </button>

          {/* Record count */}
          {recordCount > 0 && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="text-sm font-medium text-foreground">
                ✓ {recordCount} record{recordCount !== 1 ? "s" : ""} ready to import
              </p>
            </div>
          )}

          {/* Info message */}
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 flex gap-2">
            <AlertCircle className="size-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Make sure your CSV file has headers that match the field names exactly.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!file || isProcessing}>
            {isProcessing ? "Importing…" : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
