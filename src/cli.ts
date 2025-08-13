#!/usr/bin/env bun
import { Command } from "commander";
import chalk from "chalk";

const program = new Command();

program
    .name("cherri")
    .description("Automated cherry-picking for PRs marked with 🍒")
    .version("0.1.0");

program
    .option("-r, --repo <repo>", "GitHub repository")
    .option("-t, --target <branch>", "Target branch")
    .option("-f, --from <commit>", "Starting commit SHA")
    .action(async (options) => {
        console.log(chalk.red("🍒 cherri"));
        console.log("Options:", options);
    });

program.parse();
