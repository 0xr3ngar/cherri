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
        "-s, --since <months>",
        "Number of months to look back for PRs",
        "1",
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
