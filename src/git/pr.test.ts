import { describe, expect, test, mock } from "bun:test";
import { searchPullRequestsWithIcon } from "./pr";
import type { Octokit } from "@octokit/rest";

describe("searchPullRequestsWithIcon", () => {
    test("searches for PRs with emoji in title", async () => {
        const mockPRs = [
            {
                number: 123,
                title: "🍒 Fix authentication",
                merged_at: "2024-01-15T10:00:00Z",
                user: { login: "john" },
            },
            {
                number: 456,
                title: "Add feature 🍒",
                merged_at: "2024-01-16T10:00:00Z",
                user: { login: "sarah" },
            },
        ];

        const mockClient = {
            paginate: mock(async () => mockPRs),
            rest: {
                pulls: {
                    get: mock(
                        async ({ pull_number }: { pull_number: number }) => {
                            return {
                                data: mockPRs.find(
                                    (pr) => pr.number === pull_number,
                                ),
                            };
                        },
                    ),
                },
            },
        };

        const result = await searchPullRequestsWithIcon({
            client: mockClient as any,
            owner: "test-org",
            repo: "test-repo",
            icon: "🍒",
            sinceDate: new Date("2024-01-01"),
        });

        expect(result).toHaveLength(2);
        expect(result[0].number).toBe(123);
        expect(result[1].number).toBe(456);
        expect(mockClient.paginate).toHaveBeenCalledTimes(1);
    });

    test("searches with label instead of title", async () => {
        const mockPRs = [
            {
                number: 789,
                title: "Fix bug",
                merged_at: "2024-01-15T10:00:00Z",
                user: { login: "dev" },
            },
        ];

        const mockClient = {
            paginate: mock(async (_: string, params: { q: string }) => {
                expect(params.q).toContain('label:"backport"');
                expect(params.q).not.toContain('"🍒" in:title');
                return mockPRs;
            }),
            rest: {
                pulls: {
                    get: mock(async () => ({
                        data: mockPRs[0],
                    })),
                },
            },
        };

        const result = await searchPullRequestsWithIcon({
            client: mockClient,
            owner: "test-org",
            repo: "test-repo",
            icon: "🍒",
            sinceDate: new Date("2024-01-01"),
            label: "backport",
        });

        expect(result).toHaveLength(1);
        expect(result[0].number).toBe(789);
    });

    test("sorts PRs by merge date", async () => {
        const mockPRs = [
            {
                number: 456,
                title: "🍒 Second",
                merged_at: "2024-01-16T10:00:00Z",
                user: { login: "user2" },
            },
            {
                number: 123,
                title: "🍒 First",
                merged_at: "2024-01-15T10:00:00Z",
                user: { login: "user1" },
            },
            {
                number: 789,
                title: "🍒 Third",
                merged_at: "2024-01-17T10:00:00Z",
                user: { login: "user3" },
            },
        ];

        const mockClient = {
            paginate: mock(async () => mockPRs),
            rest: {
                pulls: {
                    get: mock(
                        async ({ pull_number }: { pull_number: number }) => ({
                            data: mockPRs.find(
                                (pr) => pr.number === pull_number,
                            ),
                        }),
                    ),
                },
            },
        };

        const result = await searchPullRequestsWithIcon({
            client: mockClient as any,
            owner: "test-org",
            repo: "test-repo",
            icon: "🍒",
            sinceDate: new Date("2024-01-01"),
        });

        // Should be sorted by merged_at ascending
        expect(result[0].number).toBe(123);
        expect(result[1].number).toBe(456);
        expect(result[2].number).toBe(789);
    });

    test("formats date correctly for search query", async () => {
        const mockClient = {
            paginate: mock(async (_: string, params: { q: string }) => {
                expect(params.q).toContain("merged:>=2024-01-15");
                return [];
            }),
            rest: {
                pulls: {
                    get: mock(async () => ({ data: {} })),
                },
            },
        };

        await searchPullRequestsWithIcon({
            client: mockClient as any,
            owner: "test-org",
            repo: "test-repo",
            icon: "🍒",
            sinceDate: new Date("2024-01-15T10:30:45Z"),
        });

        expect(mockClient.paginate).toHaveBeenCalled();
    });

    test("returns empty array when no PRs found", async () => {
        const mockClient = {
            paginate: mock(async () => []),
            rest: {
                pulls: {
                    get: mock(async () => ({ data: {} })),
                },
            },
        };

        const result = await searchPullRequestsWithIcon({
            client: mockClient as any,
            owner: "test-org",
            repo: "test-repo",
            icon: "🍒",
            sinceDate: new Date("2024-01-01"),
        });

        expect(result).toHaveLength(0);
    });
});
