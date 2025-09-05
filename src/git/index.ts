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

export {
    getGithubClient,
    searchPullRequestsWithIcon,
    cherryPickCommit,
    getAllCommitsFromPullRequest,
    type PullsListResponse,
};
