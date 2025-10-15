import { setupCherriCommand } from "./setup";
import { fetchAndSelectPRs } from "../utils/fetchAndSelectPRs";
import {
    fetchCommitsForPRs,
    selectCommitsInteractively,
} from "../utils/fetchCommitsForPRs";
import {
    handlePRCreationMode,
    handleDirectCherryPickMode,
} from "../utils/handlePRCreationModes";

interface CommonCherriOptions {
    interactive?: boolean;
    sourceBranch?: string;
    since?: string;
    sinceBranch?: string;
    failOnConflict?: boolean;
    createPr?: boolean | string;
    selectCommits?: boolean;
}

export interface CherriCommandProjectFileOptions extends CommonCherriOptions {
    profile: string;
}

export interface CherriCommandWithoutProjectOptions
    extends CommonCherriOptions {
    owner: string;
    repo: string;
    emoji: string;
    label?: string;
    prTitle?: string;
}

type CherriCommandOptions =
    | CherriCommandProjectFileOptions
    | CherriCommandWithoutProjectOptions;

export const cherriCommand = async (configuration: CherriCommandOptions) => {
    const setup = await setupCherriCommand(configuration);
    if (!setup) return;

    const {
        client,
        finalBranch,
        prTargetBranch,
        cutoffDate,
        cutoffDescription,
    } = setup;

    const prSelection = await fetchAndSelectPRs(
        client,
        setup.owner,
        setup.repo,
        setup.emoji,
        cutoffDate,
        cutoffDescription,
        setup.label,
        setup.isInteractive,
    );

    if (!prSelection) return;

    const { finalSelectedPRs } = prSelection;

    let allCommits = await fetchCommitsForPRs(
        client,
        setup.owner,
        setup.repo,
        finalSelectedPRs,
    );

    if (setup.selectCommits) {
        allCommits = await selectCommitsInteractively(allCommits);

        if (allCommits.length === 0) {
            return;
        }
    }

    const result = setup.createPr
        ? await handlePRCreationMode({
              emoji: setup.emoji,
              allCommits,
              finalSelectedPRs,
              finalBranch,
              prTargetBranch,
              failOnConflict: setup.failOnConflict,
              client,
              owner: setup.owner,
              repo: setup.repo,
              prTitle: setup.prTitle,
          })
        : await handleDirectCherryPickMode({
              allCommits,
              finalBranch,
              failOnConflict: setup.failOnConflict,
          });

    return result;
};
