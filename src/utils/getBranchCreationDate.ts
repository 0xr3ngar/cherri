import { execSync } from "node:child_process";
import { getDefaultBranch } from "../constants";

export const getBranchCreationDate = (branchName: string): Date => {
    try {
        const defaultBranch = getDefaultBranch();

        if (!defaultBranch) {
            throw new Error("Could not determine default branch");
        }

        const firstCommit = execSync(
            `git merge-base --fork-point ${branchName} ${defaultBranch}`,
            { encoding: "utf8", stdio: "pipe" },
        ).trim();

        if (!firstCommit) {
            throw new Error(
                `Could not find first commit for branch ${branchName}`,
            );
        }

        const commitDate = execSync(`git show -s --format=%ci ${firstCommit}`, {
            encoding: "utf8",
            stdio: "pipe",
        }).trim();

        return new Date(commitDate);
    } catch (_error) {
        // Fallback: try to get the branch creation date using reflog
        try {
            const reflogOutput = execSync("git reflog --date=iso --all", {
                encoding: "utf8",
                stdio: "pipe",
            });

            const reflogLines = reflogOutput.split("\n");
            const checkoutLine = reflogLines.find(
                (line) =>
                    line.includes(`checkout: moving from`) &&
                    line.includes(branchName),
            );

            if (checkoutLine) {
                const datePart = checkoutLine.split(" ")[0];
                return new Date(datePart);
            }
        } catch (_reflogError) {}

        throw new Error(
            `Could not determine creation date for branch '${branchName}'. Make sure the branch exists and you're in a git repository.`,
        );
    }
};
