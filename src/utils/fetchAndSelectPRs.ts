import chalk from "chalk";
import { searchPullRequestsWithIcon, type PullsListResponse } from "../git";
import { displays } from "../ui";
import type { Octokit } from "@octokit/rest";

export const fetchAndSelectPRs = async (
    client: Octokit,
    owner: string,
    repo: string,
    emoji: string,
    cutoffDate: Date,
    _cutoffDescription: string,
    label: string | undefined,
    isInteractive: boolean,
): Promise<{ finalSelectedPRs: PullsListResponse["data"] } | null> => {
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
        return null;
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
        return null;
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

    return { finalSelectedPRs };
};
