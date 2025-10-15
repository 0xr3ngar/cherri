import { describe, expect, test, mock } from "bun:test";
import {
    fetchCommitsForPRs,
    selectCommitsInteractively,
} from "./fetchCommitsForPRs";
import type { Octokit } from "@octokit/rest";
import type { PullsListResponse } from "../git";
import type { Commit } from "../git/commit";

mock.module("../ui", () => ({
    displays: {
        commitInfo: mock(() => {}),
        done: mock(() => {}),
        interactiveCommitSelection: mock(async () => []),
    },
}));

mock.module("../git", () => ({
    getAllCommitsFromPullRequest: mock(async ({ pullNumber }) => {
        if (pullNumber === 123) {
            return [
                { sha: "abc123", commit: { message: "First commit" } },
                { sha: "def456", commit: { message: "Second commit" } },
            ];
        }
        if (pullNumber === 456) {
            return [{ sha: "ghi789", commit: { message: "Third commit" } }];
        }
        return [];
    }),
}));

describe("fetchCommitsForPRs", () => {
    test("fetches commits for all PRs", async () => {
        const mockPRs = [
            { number: 123, title: "Fix bug" },
            { number: 456, title: "Add feature" },
        ];

        const mockClient = {} as Octokit;

        const result = await fetchCommitsForPRs(
            mockClient,
            "test-org",
            "test-repo",
            mockPRs as PullsListResponse["data"],
        );

        expect(result).toHaveLength(2);
        expect(result[0].pr.number).toBe(123);
        expect(result[0].commits).toHaveLength(2);
        expect(result[1].pr.number).toBe(456);
        expect(result[1].commits).toHaveLength(1);
    });

    test("returns correct structure with PR and commits", async () => {
        const mockPRs = [{ number: 123, title: "Test PR" }];
        const mockClient = {} as Octokit;

        const result = await fetchCommitsForPRs(
            mockClient,
            "test-org",
            "test-repo",
            mockPRs as PullsListResponse["data"],
        );

        expect(result[0]).toHaveProperty("pr");
        expect(result[0]).toHaveProperty("commits");
        expect(result[0].pr.number).toBe(123);
        expect(result[0].commits[0]).toHaveProperty("sha");
        expect(result[0].commits[0]).toHaveProperty("commit");
    });
});

describe("selectCommitsInteractively", () => {
    test("filters out PRs with no selected commits", async () => {
        const { displays } = await import("../ui");

        let callCount = 0;
        displays.interactiveCommitSelection = mock(async (_pr, commits) => {
            callCount++;
            if (callCount === 1) return [];
            return commits;
        });

        const allCommits = [
            {
                pr: { number: 123, title: "PR 1" },
                commits: [
                    { sha: "abc", commit: { message: "commit 1" } },
                ] as Commit[],
            },
            {
                pr: { number: 456, title: "PR 2" },
                commits: [
                    { sha: "def", commit: { message: "commit 2" } },
                ] as Commit[],
            },
        ];

        const result = await selectCommitsInteractively(
            allCommits as Array<{
                pr: PullsListResponse["data"][0];
                commits: Commit[];
            }>,
        );

        expect(result).toHaveLength(1);
        expect(result[0].pr.number).toBe(456);
    });

    test("returns empty array if no commits selected from any PR", async () => {
        const { displays } = await import("../ui");

        displays.interactiveCommitSelection = mock(async () => []);

        const allCommits = [
            {
                pr: { number: 123, title: "PR 1" },
                commits: [
                    { sha: "abc", commit: { message: "commit 1" } },
                ] as Commit[],
            },
        ];

        const result = await selectCommitsInteractively(
            allCommits as Array<{
                pr: PullsListResponse["data"][0];
                commits: Commit[];
            }>,
        );

        expect(result).toHaveLength(0);
    });

    test("calls interactiveCommitSelection for each PR", async () => {
        const { displays } = await import("../ui");

        displays.interactiveCommitSelection = mock(
            async (_pr, commits) => commits,
        );

        const allCommits = [
            {
                pr: { number: 123, title: "PR 1" },
                commits: [{ sha: "abc" }] as Commit[],
            },
            {
                pr: { number: 456, title: "PR 2" },
                commits: [{ sha: "def" }] as Commit[],
            },
            {
                pr: { number: 789, title: "PR 3" },
                commits: [{ sha: "ghi" }] as Commit[],
            },
        ];

        await selectCommitsInteractively(
            allCommits as Array<{
                pr: PullsListResponse["data"][0];
                commits: Commit[];
            }>,
        );

        expect(displays.interactiveCommitSelection).toHaveBeenCalledTimes(3);
    });

    test("preserves PR association with filtered commits", async () => {
        const { displays } = await import("../ui");

        displays.interactiveCommitSelection = mock(async (_pr, commits) => [
            commits[0],
        ]);

        const allCommits = [
            {
                pr: { number: 123, title: "PR 1" },
                commits: [
                    { sha: "abc", commit: { message: "commit 1" } },
                    { sha: "def", commit: { message: "commit 2" } },
                ] as Commit[],
            },
        ];

        const result = await selectCommitsInteractively(
            allCommits as Array<{
                pr: PullsListResponse["data"][0];
                commits: Commit[];
            }>,
        );

        expect(result[0].pr.number).toBe(123);
        expect(result[0].commits).toHaveLength(1);
        expect(result[0].commits[0].sha).toBe("abc");
    });
});
