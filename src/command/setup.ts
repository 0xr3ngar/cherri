import chalk from "chalk";
import { getDefaultBranch } from "../constants";
import { getGithubClient } from "../git";
import { printLogo } from "../ui";
import { parseTimePeriod } from "../utils/parseTimePeriod";
import { getBranchCreationDate } from "../utils/getBranchCreationDate";
import type { Octokit } from "@octokit/rest";
import { getConfigurationFromProject } from "../utils/getConfigurationFromProject";
import { execSync } from "node:child_process";

interface CommonCherriOptions {
    interactive?: boolean;
    sourceBranch?: string;
    since?: string;
    sinceBranch?: string;
    failOnConflict?: boolean;
    createPr?: boolean | string;
    selectCommits?: boolean;
}

interface CherriCommandProjectFileOptions extends CommonCherriOptions {
    profile: string;
}

interface CherriCommandWithoutProjectOptions extends CommonCherriOptions {
    owner: string;
    repo: string;
    emoji: string;
    label?: string;
    prTitle?: string;
    prBodyTemplate?: string;
}

type CherriCommandOptions =
    | CherriCommandProjectFileOptions
    | CherriCommandWithoutProjectOptions;

export interface CherriSetupResult {
    client: Octokit;
    owner: string;
    repo: string;
    emoji: string;
    finalBranch: string;
    prTargetBranch: string;
    cutoffDate: Date;
    cutoffDescription: string;
    label?: string;
    prTitle?: string;
    prBodyTemplate?: string;
    isInteractive: boolean;
    failOnConflict: boolean;
    createPr: boolean | string;
    selectCommits: boolean;
}

export const setupCherriCommand = async (
    configuration: CherriCommandOptions,
): Promise<CherriSetupResult | null> => {
    const {
        owner,
        repo,
        emoji,
        interactive: isInteractive = false,
        sourceBranch,
        since = "1",
        sinceBranch,
        label,
        prTitle,
        prBodyTemplate,
        failOnConflict = false,
        createPr = false,
        selectCommits = false,
    } = "profile" in configuration
        ? getConfigurationFromProject(configuration)
        : configuration;

    await printLogo({ icon: emoji });

    if (selectCommits && !isInteractive) {
        console.log(
            chalk.yellow(
                "⚠️  Warning: --select-commits requires -i/--interactive mode. Ignoring --select-commits.\n",
            ),
        );
    }

    // sinceBranch takes precedence over since if both are provided
    if (sinceBranch && since !== "1") {
        console.log(
            chalk.blue(
                "ℹ Using branch-based cutoff (--since-branch) instead of time-based (--since)",
            ),
        );
    }

    if (!process.env.GITHUB_TOKEN) {
        throw new Error("GITHUB_TOKEN environment variable is not set");
    }

    const client = getGithubClient({
        token: process.env.GITHUB_TOKEN,
    });

    const finalBranch = sourceBranch ?? getDefaultBranch() ?? "main";
    const prTargetBranch =
        typeof createPr === "string" ? createPr : finalBranch;

    if (typeof createPr === "string") {
        execSync(`git checkout ${prTargetBranch}`, { stdio: "pipe" });
    }

    console.log(
        `${chalk.cyan("Using branch")} ${chalk.bold.yellow(finalBranch)}\n`,
    );

    const cutoffDate = new Date();
    let cutoffDescription = "";

    if (sinceBranch) {
        const branchCreationDate = getBranchCreationDate(sinceBranch);
        cutoffDate.setTime(branchCreationDate.getTime());
        cutoffDescription = `start of branch '${sinceBranch}' (${branchCreationDate.toDateString()})`;
    } else {
        const timePeriod = parseTimePeriod(since);
        cutoffDate.setTime(cutoffDate.getTime() - timePeriod.milliseconds);
        cutoffDescription = timePeriod.description;
    }

    console.log(
        chalk.cyan(
            `Cutoff date to ${chalk.bold.yellow(cutoffDate.toDateString())} (${cutoffDescription})\n`,
        ),
    );

    return {
        client,
        owner,
        repo,
        emoji,
        finalBranch,
        prTargetBranch,
        cutoffDate,
        cutoffDescription,
        label,
        prTitle,
        prBodyTemplate,
        isInteractive,
        failOnConflict,
        createPr,
        selectCommits: selectCommits && isInteractive,
    };
};
