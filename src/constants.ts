import { execSync } from "node:child_process";
import packageJson from "../package.json";

export const PACKAGE_NAME = packageJson.name;
export const PACKAGE_VERSION = packageJson.version;

export const getDefaultBranch = () => {
    try {
        return execSync("git remote show origin", {
            encoding: "utf8",
            stdio: "pipe",
        })
            .split("\n")
            .find((line) => line.includes("HEAD branch:"))
            ?.replace("HEAD branch:", "")
            .trim();
    } catch {
        return undefined;
    }
};

export const WELL_KNOWN_BRANCHES = [
    "main",
    "master",
    "develop",
    "dev",
] as const;
