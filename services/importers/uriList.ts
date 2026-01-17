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

        const labelMatch = trimmed.match(/otpauth:\/\/[a-z]+\/([^?]+)/i);

        let name = "Importada";
        let issuerFromLabel = "";

        if (labelMatch) {
          const fullLabel = decodeURIComponent(labelMatch[1]);

          if (fullLabel.includes(":")) {
            const parts = fullLabel.split(":");
            issuerFromLabel = parts[0].trim();
            name = parts.slice(1).join(":").trim();
          } else {
            name = fullLabel;
          }
        }

        const issuerParamMatch = trimmed.match(/issuer=([^&]+)/i);
        const issuer = issuerParamMatch
          ? decodeURIComponent(issuerParamMatch[1])
          : issuerFromLabel;

        if (secretMatch) {
          accounts.push({
            id:
              Date.now().toString() +
              Math.random().toString(36).substring(2, 7) +
              relativeIndex,
            secret: secretMatch[1],
            name: name,
            issuer: issuer,
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
