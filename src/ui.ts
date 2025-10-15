import { checkbox } from "@inquirer/prompts";
import chalk from "chalk";
import ora, { type Ora } from "ora";
import semver from "semver";
import { PACKAGE_NAME, PACKAGE_VERSION } from "./constants";
import type { PullsListResponse } from "./git";
import type { Commit } from "./git/commit";

const LOGO_WIDTH = 38;
const DIVIDER = "━".repeat(LOGO_WIDTH);
const MAX_TITLE_LENGTH = 50;
const TRUNCATION_LENGTH = 47;

const checkForUpdates = async (packageName: string, currentVersion: string) => {
    try {
        const response = await fetch(
            `https://registry.npmjs.org/${packageName}`,
        );

        if (!response.ok) return null;

        const data = await response.json();
        const latestVersion = data["dist-tags"]?.latest.toString();

        if (semver.gt(latestVersion, currentVersion)) {
            return latestVersion;
        }

        return null;
    } catch {
        return null;
    }
};

const printLogo = async ({ icon }: { icon: string }) => {
    console.log(`
${chalk.red(DIVIDER)}
${chalk.red(icon)} ${chalk.bold.red(PACKAGE_NAME)} ${chalk.yellow(`v${PACKAGE_VERSION}`)}
${chalk.italic.white("Cherry-pick PRs with ease")}
${chalk.red(DIVIDER)}
`);

    const latestVersion = await checkForUpdates(PACKAGE_NAME, PACKAGE_VERSION);
    if (latestVersion) {
        console.log(`
${chalk.yellow("⚠️  Update available:")} ${chalk.dim(PACKAGE_VERSION)} → ${chalk.green(latestVersion)}
${chalk.dim("Run")} ${chalk.cyan(`npm install -g ${PACKAGE_NAME}`)} ${chalk.dim("to update")}
`);
    }
};

const printError = (message?: string) => {
    console.log(`
    ${chalk.red("🍒")} ${chalk.bold.yellow("Cherri interrupted!")}
    ${chalk.dim("Your repository may be in an incomplete state.")}

    ${chalk.dim("Check current status:")}
    ${chalk.cyan("    git status")}

    ${chalk.dim("If needed, abort in-progress cherry-pick:")}
    ${chalk.cyan("    git cherry-pick --abort")}
    `);
    message ? console.error(`${chalk.red("✗ Error:")} ${message}\n`) : null;
};

const createSpinner = (text: string): Ora => {
    return ora({
        text,
    });
};

const spinners = {
    fetchPRs: ({ timeframe }: { timeframe: string }) =>
        createSpinner(
            `${chalk.cyan("Fetching PRs")} from last ${chalk.yellow(timeframe)}...`,
        ),

    fetchCommit: ({ branch }: { branch: string }) =>
        createSpinner(
            `${chalk.cyan("Fetching latest commit")} from branch ${chalk.yellow(branch)}...`,
        ),

    fetchCommitsFromPR: ({ name }: { name: string }) =>
        createSpinner(
            `${chalk.cyan("Fetching commits from PR")} ${chalk.bold.white(name)}...`,
        ),

    cherryPick: ({ sha }: { sha: string }) =>
        createSpinner(
            `${chalk.cyan("Cherry-picking")} ${chalk.gray(sha.slice(0, 7))}...`,
        ),
};

const messages = {
    prProgress: ({ fetched, page }: { fetched: number; page?: number }) => {
        const pageText = page ? chalk.dim(` (page ${page})`) : "";
        return `${chalk.cyan("Fetching PRs...")} ${chalk.bold.white(fetched)} found${pageText}`;
    },

    prSuccess: ({ count, timeframe }: { count: number; timeframe: string }) =>
        `Found ${chalk.bold.green(count)} PRs since ${chalk.yellow(timeframe)}`,

    findCommitSuccess: ({
        sha,
        branch,
        date,
    }: {
        sha: string;
        branch: string;
        date: string;
    }) =>
        `Found commit ${chalk.bold.green(sha.slice(0, 7))} merged on ${date} in the ${chalk.yellow(branch)} branch`,

    error: ({ message }: { message: string }) => chalk.red(`${message}`),

    success: ({ message }: { message: string }) => chalk.green(`${message}`),

    warning: ({ message }: { message: string }) => chalk.yellow(`${message}`),
};

const displays = {
    interactiveCommitSelection: async (
        pr: { number: number; title: string },
        commits: Commit[],
        prIndex: number,
        totalPRs: number,
    ) => {
        const progress = chalk.dim(`[PR ${prIndex + 1}/${totalPRs}]`);
        const prTitle =
            pr.title.length > MAX_TITLE_LENGTH
                ? `${pr.title.substring(0, TRUNCATION_LENGTH)}...`
                : pr.title;

        console.log(
            `\n${progress} ${chalk.cyan(`#${pr.number}`)}: ${prTitle} ${chalk.dim(`(${commits.length} commits)`)}`,
        );

        const choices = commits.map((commit) => {
            const sha = chalk.gray(commit.sha.slice(0, 7));
            const message = commit.commit.message.split("\n")[0];
            const truncatedMessage =
                message.length > 60
                    ? `${message.substring(0, 57)}...`
                    : message;

            const author = commit.commit.author?.name
                ? ` ${chalk.dim(`(${commit.commit.author.name})`)}`
                : "";

            return {
                name: `${sha} ${truncatedMessage}${author}`,
                value: commit,
                checked: true,
            };
        });

        const selectedCommits = await checkbox(
            {
                message: "Select commits to cherry-pick:",
                choices,
            },
            {
                clearPromptOnDone: true,
            },
        );

        if (selectedCommits.length === 0) {
            console.log(
                chalk.yellow(
                    `  ⊘ Skipped PR #${pr.number} (no commits selected)\n`,
                ),
            );
        } else if (selectedCommits.length < commits.length) {
            console.log(
                chalk.green(
                    `  ✓ Selected ${chalk.bold(selectedCommits.length)}/${commits.length} commits from PR #${pr.number}\n`,
                ),
            );
        } else {
            console.log(
                chalk.green(
                    `  ✓ Selected all ${chalk.bold(commits.length)} commits from PR #${pr.number}\n`,
                ),
            );
        }

        return selectedCommits;
    },

    interactivePRSelection: async (prs: PullsListResponse["data"]) => {
        const choices = prs.map((pr) => {
            const title =
                pr.title.length > MAX_TITLE_LENGTH
                    ? `${pr.title.substring(0, TRUNCATION_LENGTH)}...`
                    : pr.title;

            const author = pr.user?.login ? ` (${pr.user.login})` : "";

            const date = pr.merged_at
                ? ` • ${new Date(pr.merged_at).toLocaleDateString()}`
                : "";

            return {
                name: `${chalk.cyan(`#${pr.number}`)} ${title}${chalk.dim(author + date)}`,
                value: pr,
                checked: false,
            };
        });

        const selectedPRs = await checkbox(
            {
                message: "Select PRs to cherry-pick:",
                choices,
            },
            {
                clearPromptOnDone: true,
            },
        );

        console.log(
            chalk.green(`\n  Selected ${chalk.bold(selectedPRs.length)} PRs:`),
        );

        selectedPRs.forEach((pr) => {
            const prTitle =
                pr.title.length > MAX_TITLE_LENGTH ? chalk.dim("...") : "";
            const prTitleTrimmed = pr.title.substring(0, MAX_TITLE_LENGTH);
            console.log(
                `    ${chalk.cyan(`#${pr.number}`)} ${chalk.dim(prTitleTrimmed)}${prTitle}`,
            );
        });

        return selectedPRs;
    },
    prSummary: (
        prs: Array<{ number: number; title: string; user?: string }>,
    ) => {
        if (prs.length === 0) {
            console.log(`\n  ${chalk.yellow("⚠")} No PRs found\n`);
            return;
        }

        for (const pr of prs) {
            const num = chalk.cyan(`#${pr.number}`);

            const title =
                pr.title.length > MAX_TITLE_LENGTH
                    ? `${pr.title.substring(0, TRUNCATION_LENGTH)}...`
                    : pr.title;

            console.log(`  ${num} ${chalk.gray(title)}`);
        }
    },

    commitInfo: (
        pr: { number: number; title: string },
        commits: Commit[],
        index: number,
        total: number,
    ) => {
        const progress = chalk.dim(`${index + 1}/${total}`);
        const prNum = chalk.cyan(`#${pr.number}`);
        const commitCount = chalk.green(`${commits.length} commits`);

        console.log(
            `    ${progress} ${prNum} ${chalk.dim("→")} ${commitCount}`,
        );
    },

    done: (total: number, totalCommits: number) => {
        console.log("");
        console.log(
            chalk.gray(`  ${total} PRs • ${totalCommits} commits ready`),
        );
        console.log("");
    },
};

export { printLogo, printError, spinners, messages, displays };
