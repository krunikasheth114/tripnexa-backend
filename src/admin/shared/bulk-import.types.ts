export interface BulkRowError {
  row: number;
  field?: string;
  message: string;
}

export interface BulkImportResult {
  imported: number;
  skipped: number;
  failed: number;
  errors: BulkRowError[];
}
