import { execSync } from "node:child_process";
import chalk from "chalk";
import { getDefaultBranch } from "../constants";
import {
    cherryPickCommit,
    getAllCommitsFromPullRequest,
    getGithubClient,
    searchPullRequestsWithIcon,
} from "../git";
import { displays, printLogo } from "../ui";
import { getConfigurationFromProject } from "./getConfigurationFromProject";
import { parseTimePeriod } from "../utils/parseTimePeriod";
import { getBranchCreationDate } from "../utils/getBranchCreationDate";

interface CommonCherriOptions {
    interactive?: boolean;
    sourceBranch?: string;
    since?: string;
    sinceBranch?: string;
    failOnConflict?: boolean;
}

export interface CherriCommandProjectFileOptions extends CommonCherriOptions {
    profile: string;
}

export interface CherriCommandWithoutProjectOptions
    extends CommonCherriOptions {
    owner: string;
    repo: string;
    emoji: string;
    label?: string;
}

type CherriCommandOptions =
    | CherriCommandProjectFileOptions
    | CherriCommandWithoutProjectOptions;

const cherriCommand = async (configuration: CherriCommandOptions) => {
    const {
        owner,
        repo,
        emoji,
        interactive: isInteractive,
        sourceBranch,
        since = "1",
        sinceBranch,
        label,
        failOnConflict = false,
    } = "profile" in configuration
        ? getConfigurationFromProject(configuration)
        : configuration;

    await printLogo({ icon: emoji });

    // sinceBranch takes precedence over since if both are provided
    if (sinceBranch && since !== "1") {
        console.log(
            chalk.blue("ℹ Using branch-based cutoff (--since-branch) instead of time-based (--since)")
        );
    }

    if (!process.env.GITHUB_TOKEN) {
        throw new Error("GITHUB_TOKEN environment variable is not set");
    }

    const client = getGithubClient({
        token: process.env.GITHUB_TOKEN,
    });

    const finalBranch = sourceBranch ?? getDefaultBranch() ?? "main";

    console.log(
        `${chalk.cyan("Using branch")} ${chalk.bold.yellow(finalBranch)}\n`,
    );

    const cutoffDate = new Date();
    let cutoffDescription = "";

    if (sinceBranch) {
        const branchCreationDate = getBranchCreationDate(sinceBranch);
        cutoffDate.setTime(branchCreationDate.getTime());
        cutoffDescription = `start of branch '${sinceBranch}' (${branchCreationDate.toDateString()})`;
    } else {
        const timePeriod = parseTimePeriod(since);
        cutoffDate.setTime(cutoffDate.getTime() - timePeriod.milliseconds);
        cutoffDescription = timePeriod.description;
    }

    console.log(
        chalk.cyan(
            `Cutoff date to ${chalk.bold.yellow(cutoffDate.toDateString())} (${cutoffDescription})\n`,
        ),
    );

    const pullRequests = await searchPullRequestsWithIcon({
        client,
        owner,
        repo,
        icon: emoji,
        sinceDate: cutoffDate,
        label,
    });

    if (pullRequests.length === 0) {
        console.log(`\n  ${chalk.yellow("⚠ ")} No PRs found\n`);
        console.log(chalk.green("\n ✓ Everything is up to date!\n"));
        return;
    }

    const initialPrs = pullRequests.map((pr) => ({
        number: pr.number,
        title: pr.title,
        user: pr.user?.login,
        merged_at: pr.merged_at,
    }));

    if (!isInteractive) {
        displays.prSummary(initialPrs);
    }

    const finalSelectedPRs = isInteractive
        ? await displays.interactivePRSelection(pullRequests)
        : pullRequests;

    if (finalSelectedPRs.length === 0) {
        console.log(chalk.yellow("\n  No PRs selected for cherry-picking.\n"));
        return;
    }

    if (finalSelectedPRs.length !== pullRequests.length) {
        console.log(
            chalk.cyan(
                `\n  Processing ${finalSelectedPRs.length} selected PRs...\n`,
            ),
        );
    } else {
        console.log(chalk.cyan("\n  Fetching commits from PRs...\n"));
    }

    const allCommits = [];
    let totalCommits = 0;

    for (const [index, pr] of finalSelectedPRs.entries()) {
        const commits = await getAllCommitsFromPullRequest({
            client,
            owner,
            repo,
            pullNumber: pr.number,
        });

        allCommits.push({ pr, commits });
        totalCommits += commits.length;

        displays.commitInfo(pr, commits, index, finalSelectedPRs.length);
    }

    displays.done(finalSelectedPRs.length, totalCommits);

    console.log(chalk.cyan("\n  Starting cherry-pick process...\n"));

    let successCount = 0;
    let skipCount = 0;
    let shouldStop = false;

    for (const { pr, commits } of allCommits) {
        if (shouldStop) break;

        console.log(chalk.gray(`\n  PR #${pr.number}: ${pr.title}`));

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
                    `    ${chalk.gray("○")} ${chalk.dim(commit.sha.slice(0, 7))} already cherry-picked`,
                );
                skipCount++;
                continue;
            }

            const { success: didPickingSucceed, aborted: isPickingAborted } =
                await cherryPickCommit(commit, finalBranch, { failOnConflict });

            if (didPickingSucceed) {
                successCount++;
                continue;
            }
            if (isPickingAborted) {
                shouldStop = true;
                break;
            }

            skipCount++;
        }
    }

    if (shouldStop) {
        console.log(
            chalk.yellow(
                `\n Reverting ${successCount} successful cherry-picks...`,
            ),
        );
        execSync(`git reset --hard HEAD~${successCount}`, { stdio: "pipe" });
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

export { cherriCommand };
