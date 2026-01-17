import { Account, ImportError } from "@/types";

export interface ImportResult {
  success: boolean;
  accounts: Account[];
  error?: ImportError;
  count: number;
}

export interface Importer {
  canParse(content: string): boolean;
  parse(content: string): Promise<ImportResult>;
}
