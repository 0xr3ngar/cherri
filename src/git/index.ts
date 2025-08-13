import { Octokit } from "@octokit/rest";
import { getAllPullRequests } from "./pr";

interface GithubClientOptions {
    token: string;
}

const getGithubClient = ({ token }: GithubClientOptions) => {
    return new Octokit({
        auth: token,
    });
};

export { getGithubClient, getAllPullRequests };
