import chalk from "chalk";
import ora, { type Ora } from "ora";

const LOGO_WIDTH = 38;
const DIVIDER = "━".repeat(LOGO_WIDTH);

const printLogo = ({ icon }: { icon: string }) => {
    console.log(`
    ${chalk.red(DIVIDER)}
    ${chalk.red(icon)} ${chalk.bold.red("cheri")} ${chalk.yellow("v1.0.4")}
    ${chalk.italic.white("Cherry-pick PRs with ease")}
    ${chalk.red(DIVIDER)}
    `);
};

const createSpinner = (text: string): Ora => {
    return ora({
        text,
        indent: 2,
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
    prSummary: (
        prs: Array<{ number: number; title: string; user?: string }>,
        emoji: string,
    ) => {
        if (prs.length === 0) {
            console.log(`\n  ${chalk.yellow("⚠")} No PRs found\n`);
            return;
        }

        console.log(
            chalk.gray(
                `    Found ${chalk.bold.white(prs.length)} PRs with ${emoji}\n`,
            ),
        );

        prs.forEach((pr) => {
            const num = chalk.cyan(`#${pr.number}`);

            const title =
                pr.title.length > 60
                    ? pr.title.substring(0, 57) + "..."
                    : pr.title;

            console.log(`  ${num} ${chalk.gray(title)}`);
        });
    },

    commitInfo: (
        pr: { number: number; title: string },
        commits: any[],
        index: number,
        total: number,
    ) => {
        const progress = chalk.dim(`${index + 1}/${total}`);
        const prNum = chalk.cyan(`#${pr.number}`);
        const commitCount = chalk.green(`${commits.length} commits`);

        console.log(`  ${progress} ${prNum} ${chalk.dim("→")} ${commitCount}`);
    },

    done: (total: number, totalCommits: number) => {
        console.log("");
        console.log(
            chalk.gray(`  ${total} PRs • ${totalCommits} commits ready`),
        );
        console.log("");
    },
};

export { printLogo, spinners, messages, displays };
