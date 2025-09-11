import { execSync } from "node:child_process";
import chalk from "chalk";
import { cherryPickCommit } from "../git";
import type { PullsListResponse } from "../git";
import type { Commit } from "../git/commit";

export interface ProcessCommitsResult {
    successCount: number;
    skipCount: number;
    pickedPRs?: Set<number>;
    shouldStop: boolean;
}

export interface ProcessCommitsOptions {
    allCommits: Array<{ pr: PullsListResponse["data"][0]; commits: Commit[] }>;
    targetBranch: string;
    failOnConflict: boolean;
    trackPickedPRs?: boolean;
}

export const processCommits = async ({
    allCommits,
    targetBranch,
    failOnConflict,
    trackPickedPRs = false,
}: ProcessCommitsOptions): Promise<ProcessCommitsResult> => {
    let successCount = 0;
    let skipCount = 0;
    let shouldStop = false;
    const pickedPRs = trackPickedPRs ? new Set<number>() : undefined;

    for (const { pr, commits } of allCommits) {
        if (shouldStop) break;

        console.log(chalk.gray(`\n  PR #${pr.number}: ${pr.title}`));

        let prSuccessCount = 0;

        for (const commit of commits) {
            const escapedMessage = commit.commit.message
                .split("\n")[0]
                .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const exists = execSync(
                `git log --grep="${escapedMessage}" --oneline -1`,
                { encoding: "utf8", stdio: "pipe" },
            ).trim();

            if (exists) {
                console.log(
                    `    ${chalk.gray("○")} ${chalk.dim(commit.sha.slice(0, 7))} already exists`,
                );
                skipCount++;
                continue;
            }

            const { success: didPickingSucceed, aborted: isPickingAborted } =
                await cherryPickCommit(commit, targetBranch, {
                    failOnConflict,
                });

            if (didPickingSucceed) {
                successCount++;
                prSuccessCount++;
                continue;
            }
            if (isPickingAborted) {
                shouldStop = true;
                break;
            }

            skipCount++;
        }

        if (trackPickedPRs && pickedPRs && prSuccessCount > 0) {
            pickedPRs.add(pr.number);
        }
    }

    return {
        successCount,
        skipCount,
        pickedPRs,
        shouldStop,
    };
};
