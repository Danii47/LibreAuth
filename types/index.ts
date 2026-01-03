// TOTP: Time-based, HOTP: Counter-based
export type AccountType = "totp" | "hotp";

export interface Account {
  id: string;
  secret: string; // Seed
  name: string; // Custom name
  issuer?: string;
  type: AccountType;

  // Personalization
  color?: string; // Hex color string
  icon?: string;

  // Organization
  folderId?: string; // null or id of the folder
  createdAt: number;

  position: number; // For ordering within folder or root
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
