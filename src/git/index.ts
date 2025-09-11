import { Octokit } from "@octokit/rest";
import { cherryPickCommit, getAllCommitsFromPullRequest } from "./commit";
import { type PullsListResponse, searchPullRequestsWithIcon } from "./pr";

interface GithubClientOptions {
    token: string;
}

const getGithubClient = ({ token }: GithubClientOptions) => {
    return new Octokit({
        auth: token,
    });
};

const createPullRequest = async ({
    client,
    owner,
    repo,
    title,
    head,
    base,
    body,
}: {
    client: Octokit;
    owner: string;
    repo: string;
    title: string;
    head: string;
    base: string;
    body: string;
}) => {
    const response = await client.pulls.create({
        owner,
        repo,
        title,
        body,
        head,
        base,
    });

    return response.data;
};

export {
    getGithubClient,
    createPullRequest,
    searchPullRequestsWithIcon,
    cherryPickCommit,
    getAllCommitsFromPullRequest,
    type PullsListResponse,
};
