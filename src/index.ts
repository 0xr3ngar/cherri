#!/usr/bin/env node
import { Command } from "commander";
import { cherriCommand } from "./command/cherri";

const program = new Command();

program
    .name("cherri")
    .description("Automated cherry-picking for PRs marked with 🍒")
    .version("1.0.4");

program
    .requiredOption("-o, --owner <owner>", "GitHub repository owner")
    .requiredOption("-r, --repo <repo>", "GitHub repository")
    .requiredOption("-t, --target <branch>", "Target branch")
    .option(
        "-s, --since <months>",
        "Number of months to look back for PRs",
        "1",
    )
    .option("-i, --icon <icon>", "Custom icon for the logo", "🍒")
    .action(cherriCommand);

program.parseAsync();
