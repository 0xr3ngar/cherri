import type { Endpoints } from "@octokit/types";
import { Octokit } from "@octokit/rest";
import type { Ora } from "ora";
import { formatPrError, formatPrProgress, formatPrSuccess } from "../ui";

type PullsListResponse =
    Endpoints["GET /repos/{owner}/{repo}/pulls"]["response"];

interface GetAllPullRequestsOptions {
    client: Octokit;
    owner: string;
    repo: string;
    monthLimit: number;
    spinner: Ora;
}

type Counters = {
    prLength: number;
    pageCount: number;
};

interface PaginateCallbackOptions {
    cutoffDate: Date;
    counters: Counters;
    spinner: Ora;
    timeframe: string;
}

const createPaginateCallback = ({
    cutoffDate,
    counters,
    spinner,
    timeframe,
}: PaginateCallbackOptions) => {
    return (response: PullsListResponse, done: () => void) => {
        const filteredPRs = response.data.filter(
            (pr) => new Date(pr.created_at) >= cutoffDate,
        );

        counters.prLength += filteredPRs.length;
        counters.pageCount++;

        spinner.text = formatPrProgress({
            fetched: counters.prLength,
            pages: counters.pageCount,
        });

        const isCreatedOverLimit = response.data.find(
            (pr) => new Date(pr.created_at) < cutoffDate,
        );

        if (isCreatedOverLimit) {
            spinner.succeed(
                formatPrSuccess({
                    count: counters.prLength,
                    timeframe,
                }),
            );
            done();
        }

        return filteredPRs;
    };
};

const getAllPullRequests = async ({
    client,
    owner,
    repo,
    monthLimit,
    spinner,
}: GetAllPullRequestsOptions) => {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - monthLimit);

    const monthSuffix = monthLimit > 1 ? "s" : "";
    const timeframe = `${monthLimit} month${monthSuffix}`;

    const counters = { prLength: 0, pageCount: 0 };

    spinner.start();

    try {
        const result = await client.paginate(
            "GET /repos/{owner}/{repo}/pulls",
            {
                owner,
                state: "all",
                sort: "created",
                direction: "desc",
                repo,
                per_page: 100,
            },
            createPaginateCallback({
                cutoffDate,
                counters,
                spinner,
                timeframe,
            }),
        );

        // in case callback never calls done()
        if (spinner.isSpinning) {
            spinner.succeed(
                formatPrSuccess({ count: counters.prLength, timeframe }),
            );
        }

        return result;
    } catch (error) {
        spinner.fail(
            formatPrError({ message: `Failed to fetch PRs: ${error}` }),
        );
        throw error;
    }
};

export { getAllPullRequests };
