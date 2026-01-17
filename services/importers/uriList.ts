import { Account } from "@/types";
import { Importer, ImportResult } from "./interface";

export const UriListImporter: Importer = {
  canParse(content: string): boolean {
    return content.includes("otpauth://");
  },

  async parse(content: string): Promise<ImportResult> {
    const lines = content.split("\n");
    const accounts: Account[] = [];
    let relativeIndex = 0; 

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("otpauth://")) continue;

      try {
        // Structure: otpauth://TYPE/LABEL?PARAMETERS

        const typeMatch = trimmed.match(/otpauth:\/\/([a-z]+)\//i);
        const type =
          typeMatch && (typeMatch[1] === "hotp" || typeMatch[1] === "totp")
            ? (typeMatch[1] as "totp" | "hotp")
            : "totp";

        const secretMatch = trimmed.match(/secret=([A-Z0-9]+)/i);
        const issuerMatch =
          trimmed.match(/issuer=([^&]+)/) || trimmed.match(/\/([^:]+):/);
        const nameMatch = trimmed.match(/:([^?]+)\?/);

        if (secretMatch) {
          accounts.push({
            id:
              Date.now().toString() +
              Math.random().toString(36).substr(2, 5) +
              relativeIndex,
            secret: secretMatch[1],
            name: nameMatch ? decodeURIComponent(nameMatch[1]) : "Importada",
            issuer: issuerMatch ? decodeURIComponent(issuerMatch[1]) : "",
            icon: "default",
            color: "#555555",
            createdAt: Date.now(),
            type: type,
            position: relativeIndex,
          });

          relativeIndex++;
        }
      } catch {
        console.log("Error parsing line:", line);
      }
    }

    return {
      success: true,
      accounts,
      count: accounts.length,
    };
  },
};
