// TOTP: Time-based, HOTP: Counter-based
export type AccountType = "totp" | "hotp";
export type AccountAlgorithm = "SHA1" | "SHA256" | "SHA512" | "STEAM";

export interface Account {
  id: string;
  name: string;
  issuer?: string;
  secret: string;
  icon?: string;
  color?: string;
  createdAt: number;
  position?: number;

  type?: AccountType; // Default: 'totp'
  algorithm?: AccountAlgorithm; // Default: 'SHA1'
  digits?: number; // Default: 6
  period?: number; // Default: 30 (only TOTP)
  counter?: number; // Default: 0 (only HOTP)

  folderId?: string;
}

export interface Folder {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  createdAt: number;

  position: number;
}

// Root object
export interface AuthData {
  accounts: Account[];
  folders: Folder[];
}

// Error types for export and import operations
export type ExportError = "NO_DATA" | "CANCELLED" | "SHARING_UNAVAILABLE" | "UNKNOWN";

export type ImportError = "CANCELLED" | "INVALID_FORMAT" | "UNKNOWN";