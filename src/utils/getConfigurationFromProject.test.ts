import { describe, expect, test, mock, beforeEach, afterEach } from "bun:test";
import { getConfigurationFromProject } from "./getConfigurationFromProject";
import fs from "node:fs";

mock.module("./findCherriConfig", () => ({
    findCherriConfig: mock(() => "/fake/path/cherri.json"),
}));

describe("getConfigurationFromProject", () => {
    const mockConfig = {
        profiles: [
            {
                name: "main",
                configuration: {
                    owner: "test-owner",
                    repo: "test-repo",
                    emoji: "🍒",
                    label: "backport",
                    prTitle: "Custom PR Title",
                    prBodyTemplate: "Custom body {{prCount}}",
                },
            },
            {
                name: "staging",
                configuration: {
                    owner: "staging-owner",
                    repo: "staging-repo",
                    emoji: "🚀",
                },
            },
        ],
    };

    let originalReadFileSync: typeof fs.readFileSync;
    let originalExit: typeof process.exit;

    beforeEach(() => {
        originalReadFileSync = fs.readFileSync;
        originalExit = process.exit;

        fs.readFileSync = mock(() => JSON.stringify(mockConfig) as any);

        process.exit = mock(() => {
            throw new Error("process.exit called");
        }) as any;
    });

    afterEach(() => {
        fs.readFileSync = originalReadFileSync;
        process.exit = originalExit;
    });

    test("reads and parses configuration file", () => {
        const result = getConfigurationFromProject({
            profile: "main",
        });

        expect(result.owner).toBe("test-owner");
        expect(result.repo).toBe("test-repo");
        expect(result.emoji).toBe("🍒");
        expect(result.label).toBe("backport");
        expect(result.prTitle).toBe("Custom PR Title");
        expect(result.prBodyTemplate).toBe("Custom body {{prCount}}");
    });

    test("finds correct profile by name", () => {
        const result = getConfigurationFromProject({
            profile: "staging",
        });

        expect(result.owner).toBe("staging-owner");
        expect(result.repo).toBe("staging-repo");
        expect(result.emoji).toBe("🚀");
    });

    test("passes through additional options", () => {
        const result = getConfigurationFromProject({
            profile: "main",
            interactive: true,
            since: "2w",
            failOnConflict: true,
        });

        expect(result.interactive).toBe(true);
        expect(result.since).toBe("2w");
        expect(result.failOnConflict).toBe(true);
    });

    test("handles profile without optional fields", () => {
        const result = getConfigurationFromProject({
            profile: "staging",
        });

        expect(result.label).toBeUndefined();
        expect(result.prTitle).toBeUndefined();
        expect(result.prBodyTemplate).toBeUndefined();
    });

    test("throws error for non-existent profile", () => {
        expect(() => {
            getConfigurationFromProject({
                profile: "non-existent",
            });
        }).toThrow("process.exit called");
    });

    test("validates config structure with Zod", () => {
        fs.readFileSync = mock(
            () =>
                JSON.stringify({
                    profiles: [
                        {
                            name: "main",
                            configuration: {
                                emoji: "🍒",
                            },
                        },
                    ],
                }) as any,
        );

        expect(() => {
            getConfigurationFromProject({
                profile: "main",
            });
        }).toThrow("process.exit called");
    });
});
