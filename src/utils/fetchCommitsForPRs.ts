import { getAllCommitsFromPullRequest, type PullsListResponse } from "../git";
import { displays } from "../ui";
import type { Octokit } from "@octokit/rest";
import type { Commit } from "../git/commit";
import chalk from "chalk";

export const fetchCommitsForPRs = async (
    client: Octokit,
    owner: string,
    repo: string,
    finalSelectedPRs: PullsListResponse["data"],
): Promise<Array<{ pr: PullsListResponse["data"][0]; commits: Commit[] }>> => {
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
    return allCommits;
};

export const selectCommitsInteractively = async (
    allCommits: Array<{ pr: PullsListResponse["data"][0]; commits: Commit[] }>,
) => {
    console.log(
        chalk.cyan("\n  Now select specific commits from each PR...\n"),
    );

    const filteredCommits = [];

    for (const [index, { pr, commits }] of allCommits.entries()) {
        const selectedCommits = await displays.interactiveCommitSelection(
            pr,
            commits,
            index,
            allCommits.length,
        );

        if (selectedCommits.length > 0) {
            filteredCommits.push({ pr, commits: selectedCommits });
        }
    }

    if (filteredCommits.length === 0) {
        console.log(
            chalk.yellow("\n  No commits selected for cherry-picking.\n"),
        );
        return [];
    }

    const totalSelectedCommits = filteredCommits.reduce(
        (sum, { commits }) => sum + commits.length,
        0,
    );

    console.log(
        chalk.green(
            `\n  ✓ Ready to cherry-pick ${chalk.bold(totalSelectedCommits)} commits from ${chalk.bold(filteredCommits.length)} PRs\n`,
        ),
    );

    return filteredCommits;
};
