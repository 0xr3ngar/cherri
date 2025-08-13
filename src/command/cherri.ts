import { getAllPullRequests, getGithubClient } from "../git";
import { getPRSpinner, printLogo } from "../ui";

interface CherriCommandOptions {
    owner: string;
    repo: string;
    target: string;
    from: string;
    icon: string;
    since: string;
}

const cherriCommand = async ({
    owner,
    repo,
    target,
    from,
    icon,
    since,
}: CherriCommandOptions) => {
    printLogo({
        icon,
    });

    const client = getGithubClient({
        token: process.env.GITHUB_TOKEN || "",
    });

    const pullRequests = await getAllPullRequests({
        client,
        owner,
        repo,
        monthLimit: Number.parseInt(since),
        spinner: getPRSpinner({
            timeframe: `${since} month${Number.parseInt(since) > 1 ? "s" : ""}`,
        }),
    });
};

export { cherriCommand, type CherriCommandOptions };
