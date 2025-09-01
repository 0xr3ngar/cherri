import type { Endpoints } from "@octokit/types";
import { messages, spinners } from "../ui";

type PullsListResponse =
    Endpoints["GET /repos/{owner}/{repo}/pulls"]["response"];

interface GetAllPullRequestsOptions {
    // TODO: replace any with Octokit when github fixes their typing for GET /search/issues
    // https://docs.github.com/rest/search/search#search-issues-and-pull-requests
    // biome-ignore lint/suspicious/noExplicitAny: look above
    client: any;
    owner: string;
    repo: string;
    icon: string;
    sinceDate: Date;
}

const searchPullRequestsWithIcon = async ({
    client,
    owner,
    repo,
    icon,
    sinceDate,
}: GetAllPullRequestsOptions) => {
    const spinner = spinners.fetchPRs({
        timeframe: sinceDate.toLocaleDateString(),
    });
    spinner.start();

    try {
        const dateString = sinceDate.toISOString().split("T")[0];
        const result = await client.paginate("GET /search/issues", {
            q: `repo:${owner}/${repo} is:pr is:merged "${icon}" in:title merged:>=${dateString}`,
            sort: "created",
            order: "desc",
            per_page: 100,
            advanced_search: true,
        });

        spinner.succeed(
            messages.prSuccess({
                count: result.length,
                timeframe: sinceDate.toLocaleDateString(),
            }),
        );

        // TODO: remove cast when github
        return result as PullsListResponse["data"];
    } catch (error) {
        spinner.fail(
            messages.error({ message: `Failed to fetch PRs: ${error}` }),
        );
        throw error;
    }
};

export { searchPullRequestsWithIcon };
