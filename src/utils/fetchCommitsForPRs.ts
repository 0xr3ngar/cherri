import { getAllCommitsFromPullRequest, type PullsListResponse } from "../git";
import { displays } from "../ui";
import type { Octokit } from "@octokit/rest";
import type { Commit } from "../git/commit";

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
