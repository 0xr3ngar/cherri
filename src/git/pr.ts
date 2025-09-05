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
    label?: string;
}

const searchPullRequestsWithIcon = async ({
    client,
    owner,
    repo,
    icon,
    sinceDate,
    label,
}: GetAllPullRequestsOptions) => {
    const spinner = spinners.fetchPRs({
        timeframe: sinceDate.toLocaleDateString(),
    });
    spinner.start();

    try {
        const dateString = sinceDate.toISOString().split("T")[0];

        const titleSearch = `"${icon}" in:title`;
        const labelSearch = label ? `label:"${label}"` : null;

        const searchQuery = labelSearch ? labelSearch : titleSearch;

        const searchResults = (await client.paginate("GET /search/issues", {
            q: `repo:${owner}/${repo} is:pr is:merged ${searchQuery} merged:>=${dateString}`,
            per_page: 100,
            advanced_search: true,
        })) as PullsListResponse["data"];

        const result = await Promise.all(
            searchResults.map(async (issue) => {
                const prNumber = issue.number;
                const { data: pr } = await client.rest.pulls.get({
                    owner,
                    repo,
                    pull_number: prNumber,
                });
                return pr;
            }),
        );

        result.sort((a, b) => {
            if (!a.merged_at && !b.merged_at) return 0;
            if (!a.merged_at) return 1;
            if (!b.merged_at) return -1;
            return (
                new Date(a.merged_at).getTime() -
                new Date(b.merged_at).getTime()
            );
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
