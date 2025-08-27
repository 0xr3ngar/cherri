import { Octokit } from "@octokit/rest";
import {
    getLatestCommitFromBranch,
    getAllCommitsFromPullRequest,
    cherryPickCommit,
} from "./commit";
import { searchPullRequestsWithIcon } from "./pr";

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
    getLatestCommitFromBranch,
    getAllCommitsFromPullRequest,
};
