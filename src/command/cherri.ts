import { execSync } from "node:child_process";
import chalk from "chalk";
import {
    cherryPickCommit,
    getAllCommitsFromPullRequest,
    getGithubClient,
    searchPullRequestsWithIcon,
} from "../git";
import { displays, printLogo } from "../ui";

interface CherriCommandOptions {
    owner: string;
    repo: string;
    icon: string;
    since?: string;
}

const cherriCommand = async ({
    owner,
    repo,
    icon,
    since = "1",
}: CherriCommandOptions) => {
    await printLogo({ icon });

    if (!process.env.GITHUB_TOKEN) {
        throw new Error("GITHUB_TOKEN environment variable is not set");
    }

    const client = getGithubClient({
        token: process.env.GITHUB_TOKEN,
    });

    const cutoffDate = new Date();
    const sinceMonths = Number.parseInt(since, 10);
    cutoffDate.setMonth(cutoffDate.getMonth() - sinceMonths);

    console.log(
        chalk.cyan(`Cutoff date to ${chalk.bold(cutoffDate.toDateString())}\n`),
    );

    const pullRequests = await searchPullRequestsWithIcon({
        client,
        owner,
        repo,
        icon,
        sinceDate: cutoffDate,
    });

    const prs = pullRequests.map((pr) => ({
        number: pr.number,
        title: pr.title,
        user: pr.user?.login,
    }));

    displays.prSummary(prs, icon);

    if (pullRequests.length === 0) {
        console.log(chalk.green("\n  ✓ Everything is up to date!\n"));
        return;
    }

    console.log(chalk.cyan("\n  Fetching commits from PRs...\n"));

    const allCommits = [];
    let totalCommits = 0;

    for (const [index, pr] of pullRequests.entries()) {
        const commits = await getAllCommitsFromPullRequest({
            client,
            owner,
            repo,
            pullNumber: pr.number,
        });

        allCommits.push({ pr, commits });
        totalCommits += commits.length;

        displays.commitInfo(pr, commits, index, pullRequests.length);
    }

    displays.done(pullRequests.length, totalCommits);

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
                await cherryPickCommit(commit);

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
