import fs from "node:fs";
import path from "node:path";

export function findCherriConfig(
    startDir: string = process.cwd(),
): string | null {
    let currentDir = startDir;

    while (true) {
        const configPath = path.join(currentDir, "cherri.json");

        if (fs.existsSync(configPath)) {
            return configPath;
        }

        const parentDir = path.dirname(currentDir);
        if (parentDir === currentDir) {
            break;
        }
        currentDir = parentDir;
    }

    return null;
}
