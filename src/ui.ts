import chalk from "chalk";
import ora from "ora";

const log = console.log;

const printLogo = ({ icon }: { icon: string }) => {
    log(`
    ${chalk.red("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
    ${chalk.red(icon)} ${chalk.bold.red("cherri")} ${chalk.yellow("v0.1.0")}
    ${chalk.italic.white("Cherry-pick PRs with ease")}
    ${chalk.red("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
    `);
};

const formatPrProgress = ({
    fetched,
    pages,
}: {
    fetched: number;
    pages?: number;
}) => {
    const pagesText = pages ? chalk.dim(` (page ${pages})`) : "";
    return `${chalk.cyan("Fetching PRs...")} ${chalk.bold.white(fetched)} found${pagesText}`;
};

const formatPrSuccess = ({
    count,
    timeframe,
}: {
    count: number;
    timeframe: string;
}) => {
    return `Found ${chalk.bold.green(count)} PRs from last ${chalk.yellow(timeframe)}`;
};

const formatPrError = ({ message }: { message: string }) => {
    return `${chalk.red(message)}`;
};

const getPRSpinner = ({ timeframe }: { timeframe: string }) => {
    const spinner = ora({
        text: `${chalk.cyan("Fetching PRs")} from last ${chalk.yellow(timeframe)}...`,
        spinner: "dots",
        indent: 2,
    });
    return spinner;
};

export {
    printLogo,
    formatPrProgress,
    formatPrSuccess,
    formatPrError,
    getPRSpinner,
};
