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

        // TODO: remove cast when github
        const result = (await client.paginate("GET /search/issues", {
            q: `repo:${owner}/${repo} is:pr is:merged "${icon}" in:title merged:>=${dateString}`,
            per_page: 100,
            advanced_search: true,
        })) as PullsListResponse["data"];

        result.sort((a, b) => {
            const dateA = new Date(a.merged_at || 0);
            const dateB = new Date(b.merged_at || 0);
            return dateA.getTime() - dateB.getTime();
        });

        spinner.succeed(
            messages.prSuccess({
                count: result.length,
                timeframe: sinceDate.toLocaleDateString(),
            }),
        );

        return result;
    } catch (error) {
        spinner.fail(
            messages.error({ message: `Failed to fetch PRs: ${error}` }),
        );
        throw error;
    }
};

export { searchPullRequestsWithIcon, type PullsListResponse };
