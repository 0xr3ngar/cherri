import { execSync } from "node:child_process";
import chalk from "chalk";
import { createPullRequest, type PullsListResponse } from "../git";
import { generatePrBody } from "./generatePrBody";
import { processCommits } from "./processCommits";
import type { Octokit } from "@octokit/rest";
import type { Commit } from "../git/commit";

interface HandlePRCreationModeParams {
    emoji: string;
    allCommits: Array<{ pr: PullsListResponse["data"][0]; commits: Commit[] }>;
    finalSelectedPRs: PullsListResponse["data"];
    finalBranch: string;
    prTargetBranch: string;
    failOnConflict: boolean;
    client: Octokit;
    owner: string;
    repo: string;
}

interface HandleDirectCherryPickModeParams {
    allCommits: Array<{ pr: PullsListResponse["data"][0]; commits: Commit[] }>;
    finalBranch: string;
    failOnConflict: boolean;
}

export const handlePRCreationMode = async ({
    allCommits,
    emoji,
    finalSelectedPRs,
    finalBranch,
    prTargetBranch,
    failOnConflict,
    client,
    owner,
    repo,
}: HandlePRCreationModeParams) => {
    console.log(chalk.cyan("\n  Creating PR with cherry-picked commits...\n"));

    const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .slice(0, 19);
    const prBranchName = `cherri/auto-${timestamp}`;

    console.log(chalk.blue(`  Creating branch: ${prBranchName}`));

    execSync(`git checkout -b ${prBranchName}`, { stdio: "pipe" });
    execSync(`git push -u origin ${prBranchName}`, { stdio: "pipe" });

    const { successCount, skipCount, pickedPRs, shouldStop } =
        await processCommits({
            allCommits,
            targetBranch: prBranchName,
            failOnConflict,
            trackPickedPRs: true,
        });

    if (shouldStop) {
        console.log(
            chalk.yellow(
                `\n Reverting ${successCount} successful cherry-picks...`,
            ),
        );
        execSync(`git reset --hard HEAD~${successCount}`, {
            stdio: "pipe",
        });
        execSync(`git checkout ${finalBranch}`, { stdio: "pipe" });
        execSync(`git branch -D ${prBranchName}`, { stdio: "pipe" });
        console.log(chalk.red("  PR creation aborted by user. Exiting.\n"));
        return;
    }

    console.log(chalk.blue(`  Pushing branch: ${prBranchName}`));

    execSync(`git push -u origin ${prBranchName}`, { stdio: "pipe" });

    const actuallyPickedPRs = finalSelectedPRs.filter(
        (pr: PullsListResponse["data"][0]) => pickedPRs?.has(pr.number),
    );
    const prTitle = `Cherri: ${actuallyPickedPRs.length} PR${actuallyPickedPRs.length > 1 ? "s" : ""} (${finalSelectedPRs.length} selected)`;
    const prBody = generatePrBody(
        emoji,
        actuallyPickedPRs,
        finalSelectedPRs.length,
        successCount,
        skipCount,
    );

    console.log(chalk.blue("  Creating pull request..."));
    const pr = await createPullRequest({
        client,
        owner,
        repo,
        title: prTitle,
        head: prBranchName,
        base: prTargetBranch,
        body: prBody,
    });

    console.log(chalk.bold.cyan("\n  ✅ PR Created Successfully!"));
    console.log(chalk.green(`  PR: ${pr.html_url}`));
    console.log(chalk.green(`  Branch: ${prBranchName}`));
    console.log(chalk.green(`  Target: ${prTargetBranch}`));

    execSync(`git checkout ${finalBranch}`, { stdio: "pipe" });
};

export const handleDirectCherryPickMode = async ({
    allCommits,
    finalBranch,
    failOnConflict,
}: HandleDirectCherryPickModeParams) => {
    console.log(chalk.cyan("\n  Starting cherry-pick process...\n"));

    const { successCount, skipCount, shouldStop } = await processCommits({
        allCommits,
        targetBranch: finalBranch,
        failOnConflict,
        trackPickedPRs: false,
    });

    if (shouldStop) {
        console.log(
            chalk.yellow(
                `\n Reverting ${successCount} successful cherry-picks...`,
            ),
        );
        execSync(`git reset --hard HEAD~${successCount}`, {
            stdio: "pipe",
        });
        console.log(
            chalk.red("  Cherry-pick process aborted by user. Exiting.\n"),
        );
        return;
    }

    console.log(chalk.bold.cyan("\n  Summary:"));
    console.log(
        chalk.green(`✓ ${successCount} commits cherry-picked successfully`),
    );
    if (skipCount > 0) {
        console.log(chalk.gray(`○ ${skipCount} commits skipped`));
    }
};
