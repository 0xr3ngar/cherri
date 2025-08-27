# 🍒 Cherri

> Cherry-pick PRs with ease! Automatically cherry-pick merged pull requests marked with a specific emoji to your target branch.

## About the Name

**Cherri**, a variant of the French *chérie* ("darling" or "to cherish"), also evokes the cherry fruit, symbolizing good fortune and new beginnings—perfect for a tool that seamlessly integrates valuable changes into your project.

## What is Cherri?

Cherri is a CLI tool that automates the process of cherry-picking commits from merged pull requests. It searches for PRs with a specific emoji (default: 🍒) in their title and cherry-picks all commits from those PRs to your target branch.

Perfect for:
- Backporting features to release branches
- Maintaining LTS versions
- Selective feature deployment
- Managing hotfixes across multiple branches

## Installation

Install Cheri globally using your preferred package manager:

```bash
# Using Bun
bun install -g cherri

# Using npm
npm install -g cherri

# Using Deno
deno install -g cherri
```

Or, clone and set up manually:

```bash
# Clone the repository
git clone https://www.github.com/bnn16/cherri
cd cherri

# Install dependencies (using Bun)
bun install

# Make it executable
chmod +x ./index.ts
```

## Prerequisites

- **Bun** runtime (or Node.js with tsx)
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
cherri -o <owner> -r <repo> -t <target-branch>
```

### Options

| Option | Alias | Description | Required | Default |
|--------|-------|-------------|----------|---------|
| `--owner` | `-o` | GitHub repository owner | Yes | - |
| `--repo` | `-r` | GitHub repository name | Yes | - |
| `--target` | `-t` | Target branch to cherry-pick to | Yes | - |
| `--since` | `-s` | Number of months to look back for PRs | No | `1` |
| `--icon` | `-i` | Custom icon to search for in PR titles | No | `🍒` |

### Examples

#### Basic usage - cherry-pick to release branch
```bash
cherri -o facebook -r react -t release-18.x
```

#### Look back 3 months for PRs
```bash
cherri -o microsoft -r vscode -t release/1.85 -s 3
```

#### Use a custom emoji marker
```bash
cherri -o your-org -r your-repo -t stable --icon "🚀"
```

## How It Works

1. **Search Phase:**
   - Fetches the latest commit from your target branch
   - Searches for merged PRs with the specified emoji in the title
   - Filters PRs merged after the target branch's latest commit or within the specified timeframe

2. **Collection Phase:**
   - Retrieves all commits from each matching PR
   - Shows a summary of found PRs and total commits

3. **Cherry-pick Phase:**
   - Switches to the target branch locally
   - For each commit:
     - Checks if it already exists (by commit message)
     - Attempts to cherry-pick
     - If the commit SHA doesn't exist (rebased/squashed PRs), automatically finds the equivalent commit by message
     - Handles conflicts interactively

4. **Conflict Resolution:**
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

## Marking PRs for Cherry-picking

To mark a PR for cherry-picking, simply include the emoji in the PR title:

```
🍒 Fix: Critical bug in authentication flow
feat: Add new dashboard widget 🍒
[🍒] Update dependencies for security patch
```

## Features

✅ **Automatic commit resolution** - Handles rebased and squashed commits by finding matching messages  
✅ **Interactive conflict resolution** - Guides you through fixing conflicts  
✅ **Duplicate detection** - Skips commits that are already in the target branch  
✅ **Progress tracking** - Shows real-time progress with spinners and status updates  
✅ **Safe operation** - Validates repository and branch before making changes  
✅ **Batch processing** - Processes multiple PRs and commits in one run  

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

### "Not in the correct repository!"
Make sure you're in the right git repository and the remote origin matches the owner/repo you specified.

### "Failed to switch to target branch"
Ensure:
- The target branch exists locally or can be fetched from origin
- You have no uncommitted changes

## License

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. Just remember to mark it with 🍒 if you want it cherry-picked! 😉

## Roadmap

- [ ] Add caching to reduce API calls (v2)
- [ ] Support for multiple target branches
- [ ] Dry-run mode
- [ ] Custom commit message templates
- [ ] Integration with CI/CD pipelines
- [ ] Web UI for managing cherry-picks

---

Made with ❤️ and 🍒
