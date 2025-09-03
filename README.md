# 🍒 Cherri

> Cherry-pick PRs with ease! Automatically cherry-pick merged pull requests marked with a specific emoji to your target branch.

## About the Name

Why **Cherri**? It's a blend of "cherry-pick" and the French "chérie" (sweetheart), because let's face it - some commits are just more loveable than others. When you mark a PR with that little cherry emoji, you're essentially saying "this one's my chérie" - it's the commit equivalent of a love letter that deserves to be cherry-picked and brought along to every important branch.

## What is Cherri?

Cherri is a CLI tool that automates the process of cherry-picking commits from merged pull requests. It searches for PRs with a specific emoji (default: 🍒) in their title and cherry-picks all commits from those PRs to your current branch.

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

## Usage

### Basic Command

```bash
cherri -o <owner> -r <repo>
```

### Options

| Option | Alias | Description | Required | Default |
|--------|-------|-------------|----------|---------|
| `--owner` | `-o` | GitHub repository owner | Yes | - |
| `--repo` | `-r` | GitHub repository name | Yes | - |
| `--since` | `-s` | Number of months to look back for PRs | No | `1` |
| `--emoji` | `-e` | Custom emoji to search for in PR titles and display in logo | No | `🍒` |
| `--interactive` | `-i` | Enable interactive mode for PR selection | No | `false` |
| `--source-branch` | `-b` | Source branch, defaults to the default branch | No | Auto-detected |

### Examples

#### Basic usage - cherry-pick all PRs with 🍒
```bash
cherri -o facebook -r react
```

#### Look back 3 months for PRs
```bash
cherri -o microsoft -r vscode -s 3
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

#### Combine options
```bash
cherri -o facebook -r react -s 2 -i -b main
```

## Source Branch Detection

Cherri automatically detects your repository's default branch (main/master) using `git remote show origin`. You can override this with the `--source-branch` option if needed.

## How It Works

1. **Search Phase:**
   - Searches for merged PRs with the specified emoji in the title
   - Filters PRs merged within the specified timeframe (default: 1 month)

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
     - Handles conflicts interactively

5. **Conflict Resolution:**
   When conflicts occur, you'll see:
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

To mark a PR for cherry-picking, simply include the emoji in the PR title:

```
🍒 Fix: Critical bug in authentication flow
feat: Add new dashboard widget 🍒
[🍒] Update dependencies for security patch
```

## Features

✅ **Smart PR selection** - Choose to select specific PRs or process all automatically  
✅ **Interactive checkbox interface** - Easy selection with visual feedback  
✅ **Automatic commit resolution** - Handles rebased and squashed commits by finding matching messages  
✅ **Interactive conflict resolution** - Guides you through fixing conflicts  
✅ **Duplicate detection** - Skips commits that are already in the target branch  
✅ **Progress tracking** - Shows real-time progress with spinners and status updates  
✅ **Safe operation** - Validates repository and branch before making changes  
✅ **Auto version checking** - Notifies when updates are available  
✅ **Graceful interruption handling** - Clean recovery from Ctrl+C or user cancellation  

## Important Notes

⚠️ **Always run from the repository root** - The tool needs to be executed from within the git repository you want to modify

⚠️ **Commit your work first** - Ensure you have no uncommitted changes before running

⚠️ **Test on a feature branch first** - Before cherry-picking to important branches like `main` or `release`

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
- Check that PRs contain the emoji in their titles
- Verify the `--since` timeframe covers when PRs were merged
- Ensure PRs are actually merged (not just closed)

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
