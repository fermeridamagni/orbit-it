# 🚀 Orbit It

A comprehensive toolkit for managing and interacting with Git and GitHub, including version control, issue tracking, and repository management.

## Features

- 🚀 **Automated Release Management** - Streamlined release processes with semantic versioning
- 📦 **Monorepo Support** - Handle multiple packages with fixed or independent versioning strategies  
- 🔄 **Git Integration** - Comprehensive git operations and repository management
- 🐙 **GitHub API Integration** - Create releases, manage repositories, and more
- 🐍 **Multi-Language Support** - Support for Node.js and Python projects
- ⚙️ **Flexible Configuration** - JSON/JSONC configuration with schema validation

## Installation

```bash
npm install -g orbit-it
# or
pnpm add -g orbit-it
# or  
yarn global add orbit-it
```

## Quick Start

1. **Initialize configuration in your project:**
   ```bash
   orbit-it init
   ```

2. **Create a release:**
   ```bash
   orbit-it release --type patch
   ```

3. **Preview changes with dry run:**
   ```bash
   orbit-it release --type minor --dry-run
   ```

## Configuration

The CLI will generate an `orbit-it.jsonc` configuration file:

```jsonc
{
  "project": {
    "type": "monorepo",
    "environment": "nodejs", 
    "packageManager": "pnpm",
    "workspaces": ["packages/*", "apps/*"],
    "version": "1.0.0"
  },
  "release": {
    "strategy": "auto",
    "versioningStrategy": "fixed",
    "preReleaseIdentifier": "beta"
  }
}
```

## Commands

### `orbit-it init`

Initialize configuration for your project. This will:
- Detect your project environment (Node.js/Python)
- Create configuration file
- Set up GitHub Actions workflow (if auto release strategy is selected)

Options:
- `--dry-run` - Preview the initialization without making changes

### `orbit-it release`

Create a new release for your project.

Options:
- `--type <type>` - Release type: `major`, `minor`, `patch`, or `prerelease`
- `--draft` - Create a draft release  
- `--dry-run` - Preview the release without making changes
- `--ci` - Run in CI mode (non-interactive)

## Environment Variables

Set up a `.env` file in your project root:

```env
GITHUB_TOKEN=your_github_personal_access_token
```

The GitHub token needs the following scopes:
- `repo` - Full repository access
- `workflow` - Workflow access (if using auto release strategy)

## Versioning Strategies

### Fixed Versioning
All packages in the monorepo share the same version number and are released together.

### Independent Versioning  
Each package maintains its own version and can be released independently based on changes.

## Supported Environments

- **Node.js** - Manages `package.json` files
- **Python** - Manages `pyproject.toml`, `setup.py`, and `__init__.py` files

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please see our [contributing guidelines](CONTRIBUTING.md) for details.
