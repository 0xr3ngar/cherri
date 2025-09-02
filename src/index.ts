#!/usr/bin/env node
import { Command } from "commander";
import { cherriCommand } from "./command/cherri";
import { PACKAGE_VERSION } from "./constants";

const program = new Command();

program
    .name("cherri")
    .description("Automated cherry-picking for PRs marked with 🍒")
    .version(PACKAGE_VERSION);

program
    .requiredOption("-o, --owner <owner>", "GitHub repository owner")
    .requiredOption("-r, --repo <repo>", "GitHub repository")
    .option(
        "-s, --since <months>",
        "Number of months to look back for PRs",
        "1",
    )
    .option("-i, --icon <icon>", "Custom icon for the logo", "🍒")
    .action(cherriCommand);

program.parseAsync();
