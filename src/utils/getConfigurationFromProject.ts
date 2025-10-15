import fs from "node:fs";
import chalk from "chalk";
import { z } from "zod";
import { findCherriConfig } from "../utils/findCherriConfig";
import type {
    CherriCommandProjectFileOptions,
    CherriCommandWithoutProjectOptions,
} from "../command/cherri";

const ProjectFileStructure = z.object({
    profiles: z.array(
        z.object({
            name: z.string(),
            configuration: z.object({
                owner: z.string(),
                repo: z.string(),
                emoji: z.string(),
                label: z.string().optional(),
                prTitle: z.string().optional(),
                prBodyTemplate: z.string().optional(),
            }),
        }),
    ),
});

export function getConfigurationFromProject({
    profile: targetProfileName,
    ...rest
}: CherriCommandProjectFileOptions): CherriCommandWithoutProjectOptions {
    const configPath = findCherriConfig();
    if (!configPath) {
        console.log(
            chalk.red(
                "No configuration file found. Add a cherri.json file to the root of your project.",
            ),
        );
        process.exit(1);
    }

    let configurationFile: string;
    try {
        configurationFile = fs.readFileSync(configPath, "utf8");
    } catch (error) {
        console.log(
            chalk.red(
                `Error reading configuration file at ${configPath}: ${error}`,
            ),
        );
        process.exit(1);
    }

    let result: z.infer<typeof ProjectFileStructure>;
    try {
        result = ProjectFileStructure.parse(JSON.parse(configurationFile));
    } catch (error) {
        console.log(chalk.red(`Invalid configuration file: ${error}`));
        process.exit(1);
    }

    const targetProfile = result.profiles.find(
        (profile) => targetProfileName === profile.name,
    );
    if (!targetProfile) {
        console.log(
            chalk.red(
                `Profile ${targetProfileName} not found in configuration file.`,
            ),
        );
        process.exit(1);
    }

    return {
        ...rest,
        owner: targetProfile.configuration.owner,
        repo: targetProfile.configuration.repo,
        emoji: targetProfile.configuration.emoji,
        label: targetProfile.configuration.label,
        prTitle: targetProfile.configuration.prTitle,
        prBodyTemplate: targetProfile.configuration.prBodyTemplate,
    };
}
