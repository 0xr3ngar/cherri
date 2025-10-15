#!/usr/bin/env node
import chalk from "chalk";
import { Command } from "commander";
import { cherriCommand } from "./command/cherri";
import { PACKAGE_VERSION } from "./constants";
import { printError } from "./ui";

const program = new Command();

program
    .name("cherri")
    .description("Automated cherry-picking for PRs marked with 🍒")
    .version(PACKAGE_VERSION);

program
    .option(
        "-p, --profile <profile>",
        "The project to run from the cherri.json configuration file",
    )
    .option("-o, --owner <owner>", "GitHub repository owner")
    .option("-r, --repo <repo>", "GitHub repository")
    .option(
        "-s, --since <period>",
        "Time period to look back for PRs (e.g., '1w3d4h', '7d', '2' for 2 months) - alternative to --since-branch",
        "1",
    )
    .option(
        "--since-branch <branch>",
        "Use branch creation date as cutoff (e.g., 'main', 'release/v1.0') - alternative to --since",
    )
    .option("-e, --emoji <emoji>", "Custom emoji for the logo", "🍒")
    .option("-i, --interactive", "Enable interactive mode", false)
    .option(
        "-b, --source-branch <branch>",
        "Source branch, defaults to the default branch",
    )
    .option(
        "-l, --label <label>",
        "Search for PRs with this exact label (in addition to title search)",
    )
    .option(
        "--fail-on-conflict",
        "Exit with error when conflicts are detected instead of prompting for resolution",
        false,
    )
    .option(
        "--create-pr [target]",
        "Create a PR instead of direct cherry-picking (creates new branch and PR for review). Optionally specify target branch",
    )
    .option(
        "--select-commits",
        "Interactively select individual commits from each PR (requires -i/--interactive)",
        false,
    )
    .action((options) => {
        if (options.profile) {
            if (options.owner || options.repo) {
                console.error(
                    `${chalk.red("Error:")} When using --project-file (-p), do not specify --owner or --repo`,
                );
                process.exit(1);
            }
            return cherriCommand(options);
        }

        if (!options.owner || !options.repo) {
            console.error(
                `${chalk.red("Error:")} Either --project-file (-p) or both --owner and --repo are required`,
            );
            process.exit(1);
        }

        return cherriCommand(options);
    });

program.parseAsync();

process.on("SIGINT", () => {
    printError();
    process.exit(130);
});

process.on("uncaughtException", (error) => {
    if (error instanceof Error && error.name === "ExitPromptError") {
        printError();
        process.exit(0);
    } else {
        printError(error.message);
        throw error;
    }
});
