# 🍒 Cherri

> Cherry-pick PRs with ease! Automatically cherry-pick merged pull requests marked with a specific emoji in their title or with a specific label.

## About the Name

Why **Cherri**? It's a blend of "cherry-pick" and the French "chérie" (sweetheart), because let's face it - some commits are just more loveable than others. When you mark a PR with that little cherry emoji, you're essentially saying "this one's my chérie" - it's the commit equivalent of a love letter that deserves to be cherry-picked and brought along to every important branch.

## What is Cherri?

Cherri is a CLI tool that automates the process of cherry-picking commits from merged pull requests. It searches for PRs with a specific emoji (default: 🍒) in their title OR PRs with a specific label, and cherry-picks all commits from those PRs to your current branch.

Perfect for:
- Backporting features to release branches
- Maintaining LTS versions
- Selective feature deployment
- Managing hotfixes across multiple branches

## Installation

Install Cherri globally using npm:

```bash
npm install -g cherri
```

## Prerequisites

- **Node.js** (v16 or higher)
- **Git** installed and configured
- **GitHub Personal Access Token** with repo access
- You must be in the target git repository when running the command

## Setup

### 1. GitHub Personal Access Token

1. **Create a GitHub Personal Access Token:**
   - Go to GitHub Settings → Developer settings → Personal access tokens
   - Generate a new token with `repo` scope
   - Copy the token

2. **Set the environment variable:**
   ```bash
   export GITHUB_TOKEN="your_github_token_here"
   ```

   Or add it to your `.bashrc`/`.zshrc`:
   ```bash
   echo 'export GITHUB_TOKEN="your_github_token_here"' >> ~/.bashrc
   ```

### 2. Git Merge Tool Configuration

Before running Cherri, please set up your merge tool for automatic conflict resolution. When conflicts occur during cherry-picking, they will be handled **one by one**, opening your configured editor for each conflicted file individually.

Add one of these configurations to your global `~/.gitconfig` file:

**For Cursor:**
```ini
[merge]
    tool = cursor
[mergetool "cursor"]
    cmd = cursor --reuse-window --wait $MERGED
```

**For VS Code:**
```ini
[merge]
    tool = vscode
[mergetool "vscode"]
    cmd = code --wait $MERGED
```

**For other popular editors:**
```ini
# For Vim 🗿
[merge]
    tool = vimdiff

# For Emacs 🤓 ( only tsoding 🗿 uses this lol )
[merge]
    tool = emerge
```

After adding this configuration, git will automatically open your editor when conflicts need to be resolved during cherry-picking.

## Project Configuration

Instead of specifying repository details via command-line flags each time, you can create a `cherri.json` configuration file in your project root to define reusable profiles.

### Configuration File Structure

Create a `cherri.json` file in your project root:

```json
{
  "profiles": [
    {
      "name": "main",
      "configuration": {
        "owner": "your-org",
        "repo": "your-repo",
        "emoji": "🍒",
        "label": "cherry-pick"
      }
    },
    {
      "name": "staging",
      "configuration": {
        "owner": "your-org", 
        "repo": "your-repo",
        "emoji": "🚀",
        "label": "hotfix"
      }
    }
  ]
}
```

### Using Profiles

Use the `-p` or `--profile` flag to specify which profile to use:

```bash
# Use the "main" profile configuration
cherri -p main

# Use the "staging" profile configuration  
cherri -p staging

# You can still override specific options when using a profile
cherri -p main --interactive --since 2
```

### Configuration Options

Each profile's `configuration` object supports:

| Field | Description | Required | Default |
|-------|-------------|----------|---------|
| `owner` | GitHub repository owner | Yes | - |
| `repo` | GitHub repository name | Yes | - |
| `emoji` | Emoji to search for in PR titles | No | `🍒` |
| `label` | Search for PRs with this label | No | - |

**Notes:**
- When using `-p`, you cannot specify `--owner` or `--repo` flags (they come from the profile)
- Other command-line options can still be used and will override profile settings
- The configuration file is searched in the current directory and parent directories up to the git root

## Usage

### Basic Command

```bash
cherri -o <owner> -r <repo>
```

### Using Configuration File

```bash
cherri -p <profile-name>
```

### Options

| Option | Alias | Description | Required | Default |
|--------|-------|-------------|----------|---------|
| `--profile` | `-p` | Profile name from cherri.json configuration file | No | - |
| `--owner` | `-o` | GitHub repository owner | Yes* | - |
| `--repo` | `-r` | GitHub repository name | Yes* | - |
| `--since` | `-s` | Time period to look back for PRs (e.g., '1w3d4h', '7d', '2' for 2 months) | No | `1` |
| `--since-branch` | - | Use branch creation date as cutoff (e.g., 'main', 'release/v1.0') - alternative to --since | No | - |
| `--emoji` | `-e` | Custom emoji to search for in PR titles and display in logo | No | `🍒` |
| `--interactive` | `-i` | Enable interactive mode for PR selection | No | `false` |
| `--source-branch` | `-b` | Source branch, defaults to the default branch | No | Auto-detected |
| `--label` | `-l` | Search for PRs with this exact label (replaces title search) | No | - |
| `--fail-on-conflict` | - | Exit with error when conflicts are detected instead of prompting for resolution | No | `false` |

**\* Required unless using `--profile` with a configuration file**

**Note:** Use either `--since` OR `--since-branch`, not both. They serve the same purpose but use different methods to determine the cutoff date for PRs.

### Examples

#### Basic usage - search for PRs with 🍒 in title
```bash
cherri -o facebook -r react
```

#### Look back 3 months for PRs
```bash
cherri -o microsoft -r vscode -s 3
```

#### Look back 1 week and 2 days for PRs
```bash
cherri -o microsoft -r vscode -s 1w2d
```

#### Look back 7 days for PRs
```bash
cherri -o microsoft -r vscode -s 7d
```

#### Look back 2 hours for PRs
```bash
cherri -o microsoft -r vscode -s 2h
```

#### Alternative: Use branch creation date as cutoff
```bash
# Use either --since OR --since-branch, not both
cherri -o your-org -r your-repo --since-branch main
```

#### Get all PRs since a release branch was created
```bash
cherri -o your-org -r your-repo --since-branch release/v2.0
```

#### Use a custom emoji marker
```bash
cherri -o your-org -r your-repo -e "🚀"
```

#### Interactive mode - manually select PRs
```bash
cherri -o microsoft -r vscode -i
```

#### Specify custom source branch
```bash
cherri -o your-org -r your-repo -b release/1.0
```

#### Search by exact label only (replaces title search)
```bash
cherri -o your-org -r your-repo -l "cherry-pick"
```

#### Fail on conflict instead of prompting for resolution
```bash
cherri -o your-org -r your-repo --fail-on-conflict
```

#### Combine all options
```bash
cherri -o facebook -r react -s 2 -i -b main -l "hotfix" --fail-on-conflict
```

## Time Period Formats

The `--since` flag supports flexible time period specifications. **Alternatively**, you can use `--since-branch` to use a branch's creation date as the cutoff.

### Supported Units
- `w` = weeks
- `d` = days
- `h` = hours
- `m` = minutes

### Examples
```bash
# Complex combinations
cherri -s 1w3d4h    # 1 week, 3 days, 4 hours ago
cherri -s 2d12h     # 2 days, 12 hours ago
cherri -s 30m       # 30 minutes ago

# Individual units
cherri -s 7d        # 7 days ago
cherri -s 2h        # 2 hours ago
cherri -s 45m       # 45 minutes ago

# Backward compatible (bare numbers = months)
cherri -s 2         # 2 months ago (same as before)
cherri -s 1         # 1 month ago (default)

# Alternative: Branch-based cutoff
cherri --since-branch main        # Since main branch was created
cherri --since-branch release/v1.0  # Since release branch was created
```

### Notes
- **Backward Compatible**: Bare numbers without units still work as months
- **Flexible**: Mix and match any combination of time units
- **Precise**: Calculations use milliseconds for accuracy
- **Alternative**: Use `--since-branch` for branch-based cutoffs instead of time calculations

## Search Methods: Title or Labels

Cherri uses one of two search methods (not both simultaneously):

- **Title Search (default)**: Looks for the emoji in PR titles
- **Label Search**: When using `--label`, searches only by the exact label (ignores titles)

**Search behavior:**
```bash
# Title search - finds PRs with 🍒 in title
cherri -o org -r repo

# Label search - finds PRs with "cherry-pick" label (ignores titles completely)  
cherri -o org -r repo -l "cherry-pick"
```

## Source Branch Detection

Cherri automatically detects your repository's default branch (main/master) using `git remote show origin`. You can override this with the `--source-branch` option if needed.

## How It Works

1. **Search Phase:**
   - **Without `--label`**: Searches for merged PRs with the specified emoji in the title
   - **With `--label`**: Searches for merged PRs with the specified label (ignores titles)
   - **Time-based cutoff**: Parses the `--since` time period (supports complex formats like '1w3d4h', '7d', or '2' for months)
   - **Branch-based cutoff**: When using `--since-branch`, uses the creation date of the specified branch as the cutoff date
   - **Note**: Use either `--since` OR `--since-branch`, not both - they serve the same purpose
   - Filters PRs merged within the specified timeframe

2. **Selection Phase:**
   - **Interactive mode** (`-i`): Opens checkbox interface to select specific PRs
   - **Non-interactive mode** (default): Processes all found PRs automatically

3. **Collection Phase:**
   - Retrieves all commits from each selected PR
   - Shows a summary of PRs and total commits to be processed

4. **Cherry-pick Phase:**
   - For each commit:
     - Checks if it already exists (by commit message)
     - Attempts to cherry-pick
     - If the commit SHA doesn't exist (rebased/squashed PRs), automatically finds the equivalent commit by message
     - Handles conflicts by automatically opening your configured merge tool

5. **Conflict Resolution:**
   **Default behavior**: When conflicts occur, your configured merge tool will automatically open **one conflict at a time**. Each conflicted file will be processed individually, allowing you to focus on resolving one conflict before moving to the next. If no merge tool is configured, you'll see:
   ```
   📝 Please resolve conflicts in your editor
      1. Fix the conflicted files
      2. Save the files
      3. Stage changes: git add .
   
   Then press:
      y - to continue after fixing conflicts
      s - to skip this commit
      q - to quit the process
   ```
   
   **With `--fail-on-conflict`**: The process will immediately exit with an error when any conflict is detected, without prompting for resolution. This is useful for automated environments like CI/CD where you want the process to fail fast on conflicts.

## Interactive Selection

When you use the `-i` or `--interactive` flag, you'll see a checkbox interface:

```
🍒 Found 12 PRs with 🍒. Select specific PRs? Yes

? Select PRs to cherry-pick:
❯◯ #1234 Fix authentication bug (john) • 12/1/2024
 ◉ #1235 Add new feature (sarah) • 12/2/2024  
 ◯ #1236 Update dependencies (bot) • 12/3/2024

Selected 1 PRs:
  #1235 Add new feature
```

**Controls:**
- Use **SPACE** to select/deselect PRs
- Use **ENTER** to confirm selection
- Use arrow keys to navigate

## Marking PRs for Cherry-picking

Choose one of these two methods to mark PRs for cherry-picking:

**Method 1: Via Title (default behavior)**
Add the emoji to PR titles:
```
🍒 Fix: Critical bug in authentication flow
feat: Add new dashboard widget 🍒
[🍒] Update dependencies for security patch
```

**Method 2: Via Labels (use `--label` flag)**
- Create a label in your repository (e.g., "cherry-pick", "backport", "hotfix")
- Apply the label to PRs you want to cherry-pick
- Use the `--label` flag to search for that specific label (this will ignore titles)

```bash
# Search for PRs with "cherry-pick" label (ignores titles)
cherri -o your-org -r your-repo -l "cherry-pick"
```

## Features

✅ **Smart PR selection** - Choose to select specific PRs or process all automatically \
✅ **Interactive checkbox interface** - Easy selection with visual feedback \
✅ **Flexible search methods** - Search by emoji in titles OR by exact labels \
✅ **Branch-based timeframes** - Use branch creation dates instead of calculating time periods \
✅ **Automatic conflict resolution** - Automatically opens your configured merge tool for conflicts \
✅ **One-by-one conflict handling** - Processes conflicts individually for focused resolution \
✅ **Automatic commit resolution** - Handles rebased and squashed commits by finding matching messages \
✅ **Interactive conflict resolution** - Guides you through fixing conflicts when merge tool isn't configured \
✅ **Fail-fast on conflicts** - Option to exit immediately on conflicts for automated environments \
✅ **Duplicate detection** - Skips commits that are already in the target branch \
✅ **Progress tracking** - Shows real-time progress with spinners and status updates \
✅ **Safe operation** - Validates repository and branch before making changes \
✅ **Auto version checking** - Notifies when updates are available \
✅ **Graceful interruption handling** - Clean recovery from Ctrl+C or user cancellation \

## Important Notes

⚠️ **Always run from the repository root** - The tool needs to be executed from within the git repository you want to modify

⚠️ **Commit your work first** - Ensure you have no uncommitted changes before running

⚠️ **Test on a feature branch first** - Before cherry-picking to important branches like `main` or `release`

⚠️ **Configure your merge tool** - Set up your preferred merge tool before running to ensure smooth conflict resolution

## Troubleshooting

### "GITHUB_TOKEN environment variable is not set"
Set your GitHub token:
```bash
export GITHUB_TOKEN="ghp_yourtoken"
```

### Process interrupted
If you interrupt the process (Ctrl+C), check your git status:
```bash
git status
# If needed, abort any in-progress cherry-pick:
git cherry-pick --abort
```

### "No PRs found"
- **Title search**: Check that PRs contain the emoji in their titles
- **Label search**: Verify PRs have the exact label you're searching for
- **Time/Branch filters**: Verify the `--since` timeframe or `--since-branch` branch covers when PRs were merged
- **Note**: Remember to use either `--since` OR `--since-branch`, not both
- Ensure PRs are actually merged (not just closed)

### Conflict resolution
- **`merge-tool` not configured**: Run `git config merge.tool <tool>` to set your preferred merge tool
- **Merge tool fails**: The tool will fall back to manual conflict resolution

## Upcoming Features

🚧 **In Development:**
- **Dry run mode** - Test cherry-picks without making changes, detect conflicts early
- **PR creation mode** - Create pull requests instead of direct cherry-picking  
- **Slack notifications** - Get notified when cherry-picks complete or have conflicts
- **Auto-generated release notes** - Generate release notes from cherry-picked PRs
- **Workflow profiles** - Save configurations for different scenarios (staging, prod, etc.)

## License

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. Just remember to mark it with 🍒 if you want it cherry-picked!

---

Made with ❤️ and 🍒
