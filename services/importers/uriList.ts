import { Account } from "@/types";
import { Importer, ImportResult } from "./interface";
import { extractOTPParams } from "@/utils/totp";

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
        const params = extractOTPParams(trimmed);

        accounts.push({
          id:
            Date.now().toString() +
            Math.random().toString(36).substring(2, 7) +
            relativeIndex,
          secret: params.secret,
          name: params.accountName || "Importada",
          issuer: params.issuer || "",
          icon: "default",
          color: "#555555",
          createdAt: Date.now(),
          type: params.type,
          position: relativeIndex,
          algorithm: params.algorithm,
          digits: params.digits,
          period: params.period,
          counter: params.counter,
        });

        relativeIndex++;
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
