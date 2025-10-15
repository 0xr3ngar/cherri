import { describe, expect, test } from "bun:test";
import { generatePrBody } from "./generatePrBody";
import type { PullsListResponse } from "../git";

describe("generatePrBody", () => {
    const mockPRs = [
        {
            number: 123,
            title: "Fix authentication bug",
            user: { login: "john" },
        },
        {
            number: 456,
            title: "Add new feature",
            user: { login: "sarah" },
        },
        {
            number: 789,
            title: "Update dependencies",
            user: { login: "bot" },
        },
    ];

    test("generates default PR body without custom template", () => {
        const result = generatePrBody(
            "🍒",
            mockPRs as PullsListResponse["data"],
            5,
            10,
            2,
        );

        expect(result).toContain("## 🍒 Cherri Summary");
        expect(result).toContain("- #123: Fix authentication bug (@john)");
        expect(result).toContain("- #456: Add new feature (@sarah)");
        expect(result).toContain("- #789: Update dependencies (@bot)");
        expect(result).toContain("**Total PRs selected**: 5");
        expect(result).toContain("**PRs with picked commits**: 3");
        expect(result).toContain("**Commits cherry-picked**: 10");
        expect(result).toContain("**Commits skipped**: 2");
    });

    test("substitutes variables in custom template", () => {
        const template =
            "Backporting {{prCount}} PRs to {{targetBranch}}\n\n{{prList}}";

        const result = generatePrBody(
            "🍒",
            mockPRs as PullsListResponse["data"],
            5,
            10,
            2,
            template,
            "release/v1.0",
            "main",
            "myorg",
            "myrepo",
        );

        expect(result).toContain("Backporting 3 PRs to release/v1.0");
        expect(result).toContain("- #123: Fix authentication bug (@john)");
    });

    test("replaces all template variables correctly", () => {
        const template = `## {{emoji}} Summary
PRs: {{prCount}}/{{totalSelected}}
Commits: {{commitCount}} ({{commitSkipped}} skipped)
Branch: {{sourceBranch}} → {{targetBranch}}
Repo: {{owner}}/{{repo}}
Date: {{date}}
Plain: {{prListPlain}}`;

        const result = generatePrBody(
            "🚀",
            mockPRs as PullsListResponse["data"],
            5,
            10,
            2,
            template,
            "release/v1.0",
            "main",
            "testorg",
            "testrepo",
        );

        expect(result).toContain("## 🚀 Summary");
        expect(result).toContain("PRs: 3/5");
        expect(result).toContain("Commits: 10 (2 skipped)");
        expect(result).toContain("Branch: main → release/v1.0");
        expect(result).toContain("Repo: testorg/testrepo");
        expect(result).toContain("#123, #456, #789");
    });

    test("handles empty PR list", () => {
        const result = generatePrBody(
            "🍒",
            [] as PullsListResponse["data"],
            0,
            0,
            0,
        );

        expect(result).toContain("## 🍒 Cherri Summary");
        expect(result).toContain("**PRs with picked commits**: 0");
        expect(result).toContain("**Commits cherry-picked**: 0");
    });

    test("preserves unrecognized variables", () => {
        const template = "Test {{unknownVar}} variable";

        const result = generatePrBody(
            "🍒",
            mockPRs as PullsListResponse["data"],
            5,
            10,
            2,
            template,
        );

        expect(result).toContain("{{unknownVar}}");
    });

    test("generates correct date format", () => {
        const template = "Date: {{date}}";

        const result = generatePrBody(
            "🍒",
            mockPRs as PullsListResponse["data"],
            5,
            10,
            2,
            template,
        );

        expect(result).toMatch(/Date: \d{4}-\d{2}-\d{2}/);
    });

    test("generates timestamp", () => {
        const template = "Timestamp: {{timestamp}}";

        const result = generatePrBody(
            "🍒",
            mockPRs as PullsListResponse["data"],
            5,
            10,
            2,
            template,
        );

        expect(result).toMatch(/Timestamp: \d+/);
    });

    test("handles PRs without user", () => {
        const prsWithoutUser = [
            {
                number: 123,
                title: "Fix bug",
                user: null,
            },
        ];

        const result = generatePrBody(
            "🍒",
            prsWithoutUser as PullsListResponse["data"],
            1,
            1,
            0,
        );

        expect(result).toContain("- #123: Fix bug (@undefined)");
    });

    test("formats prListPlain correctly", () => {
        const template = "PRs: {{prListPlain}}";

        const result = generatePrBody(
            "🍒",
            mockPRs as PullsListResponse["data"],
            5,
            10,
            2,
            template,
        );

        expect(result).toContain("PRs: #123, #456, #789");
    });

    test("uses default values for missing optional parameters", () => {
        const template =
            "Branch: {{sourceBranch}} → {{targetBranch}}, Repo: {{owner}}/{{repo}}";

        const result = generatePrBody(
            "🍒",
            mockPRs as PullsListResponse["data"],
            5,
            10,
            2,
            template,
        );

        expect(result).toContain("Branch: unknown → unknown");
        expect(result).toContain("Repo: unknown/unknown");
    });
});
