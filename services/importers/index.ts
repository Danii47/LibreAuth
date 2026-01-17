import { Importer, ImportResult } from "./interface";
import { AegisImporter } from "./aegis";
import { UriListImporter } from "./uriList";

const REGISTERED_IMPORTERS: Importer[] = [AegisImporter, UriListImporter];

export async function processImportFile(
  content: string,
): Promise<ImportResult> {
  for (const importer of REGISTERED_IMPORTERS) {
    if (importer.canParse(content)) {
      return await importer.parse(content);
    }
  }

  return {
    success: false,
    accounts: [],
    count: 0,
    error: "INVALID_FORMAT",
  };
}
