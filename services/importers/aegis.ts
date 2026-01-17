import { Account } from "@/types";
import { Importer, ImportResult } from "./interface";

export const AegisImporter: Importer = {
  canParse(content: string): boolean {
    try {
      const json = JSON.parse(content);
      return json.db && Array.isArray(json.db.entries);
    } catch {
      return false;
    }
  },

  async parse(content: string): Promise<ImportResult> {
    try {
      const json = JSON.parse(content);
      const accounts: Account[] = [];

      json.db.entries.forEach((entry: any, index: number) => {
        if (entry.type !== "totp" && entry.type !== "hotp") return;

        const newAccount: Account = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          name: entry.name || "Sin nombre",
          issuer: entry.issuer || "",
          secret: entry.info.secret.replace(/\s/g, "").toUpperCase(),
          icon: "default",
          color: "#2e78b7",
          createdAt: Date.now(),
          type: entry.type as "totp" | "hotp",
          position: index

          // digits: entry.info.digits,
          // period: entry.info.period,
          // algorithm: entry.info.algo
        };

        if (newAccount.secret.length >= 1) {
          accounts.push(newAccount);
        }
      });

      return {
        success: true,
        accounts,
        count: accounts.length,
      };
    } catch {
      return {
        success: false,
        accounts: [],
        count: 0,
        error: "INVALID_FORMAT",
      };
    }
  },
};
