import path from 'node:path';
import GitClient from '@lib/git-client';
import GitHubClient from '@lib/github-client';
import type { Config } from '@services/config-service';
import { OrbitItError } from '@utils/errors';
import { readJsonFile, writeJsonFile } from '@utils/files';
import { ignorePaths } from '@utils/paths';
import fg from 'fast-glob';
import semver from 'semver';
import type { FunctionResult } from '@/types/functions';
import type { Commit, CommitType } from '@/types/git-client';

const commitMessageRegex =
  /^(feat|fix|docs|style|refactor|perf|test|chore)(\([^)]*\))?:/;

export type ReleaseType = 'major' | 'minor' | 'patch' | 'prerelease';

export interface ReleaseServiceOptions {
  config: Config;
  gitClient?: GitClient;
}

export interface ReleaseOptions {
  release: {
    type: ReleaseType;
    draft?: boolean;
  };
  dryRun?: boolean;
}

export interface ReleaseResult {
  version: string;
  tagName: string;
  releaseNotes: string;
}

class ReleaseService {
  private repoInfo = {
    owner: '',
    repo: '',
  };

  private config: Config;
  private gitClient: GitClient | null = null;
  private githubClient: GitHubClient | null = null;

  constructor(token: string, { config, gitClient }: ReleaseServiceOptions) {
    this.config = config;
    this.gitClient = gitClient || new GitClient();
    this.githubClient = new GitHubClient(token);
  }

  // #region - @execute
  async execute(
    options: ReleaseOptions
  ): Promise<FunctionResult<ReleaseResult>> {
    let error: OrbitItError | undefined;
    let data: ReleaseResult | undefined;

    try {
      if (!this.gitClient) {
        throw new OrbitItError({
          message: 'Git client not initialized',
          content: [{ message: 'Please initialize the Git client.' }],
        });
      }

      const isAuthenticated =
        await this.githubClient.checkUserIsAuthenticated();

      if (!isAuthenticated) {
        throw new OrbitItError({
          message: 'GitHub token is not valid',
          content: [{ message: 'Please check your GitHub token.' }],
        });
      }

      const repoInfo = await this.gitClient.getRepoInfo();
      this.repoInfo = { owner: repoInfo.owner, repo: repoInfo.repo };

      // if the versioning strategy is fixed means all the packages/apps have the same version
      if (this.config.release.versioningStrategy === 'fixed') {
        const releaseResult = await this.versionStrategyFixedRelease(options);

        if (releaseResult.error || !releaseResult.data) {
          throw releaseResult.error;
        }

        data = releaseResult.data;
      } else {
        // if the versioning strategy is independent means each package/app can have its own version
        const releaseResult = await this.versionStrategyIndependentRelease(options);

        if (releaseResult.error || !releaseResult.data) {
          throw releaseResult.error;
        }

        data = releaseResult.data;
      }
    } catch (foundError) {
      if (foundError instanceof OrbitItError) {
        error = foundError;
      } else if (foundError instanceof Error) {
        error = new OrbitItError({
          message: foundError.message,
          content: [{ message: 'Failed to create release.' }],
        });
      }
    }

    return {
      error,
      data,
    };
  }
  // #endregion - @execute

  // #region - @versionStrategyFixedRelease
  private async versionStrategyFixedRelease({
    release,
    dryRun = false,
  }: ReleaseOptions): Promise<FunctionResult<ReleaseResult>> {
    let error: OrbitItError | undefined;
    let data: ReleaseResult | undefined;

    const { type, draft = false } = release;

    try {
      const currentVersion = this.config.project.version;

      const tags = await this.gitClient.getTags();
      const latestTag = tags.latest || undefined; // first release if undefined

      const commits = await this.gitClient.getCommits({ from: latestTag });

      if (commits.length === 0) {
        throw new OrbitItError({
          message: 'No commits found',
          content: [{ message: 'Please make some changes before releasing.' }],
        });
      }

      const newVersion = semver.inc(currentVersion, type);
      const tagName = `v${newVersion}`;

      const releaseNotes = this.generateReleaseNotes({ tagName, commits });

      if (dryRun) {
        // If dryRun is enabled, return the release information without making any changes
        return {
          data: {
            version: newVersion,
            tagName,
            releaseNotes,
          },
        };
      }

      const isPrerelease = semver.prerelease(newVersion) !== null;

      if (this.config.project.environment === 'nodejs') {
        const workspaces = this.config.project.workspaces.map((workspace) =>
          path.join(workspace, 'package.json')
        );

        await this.nodeJsBumpPackages(newVersion, workspaces);
      }

      if (this.config.project.environment === 'python') {
        const pythonFiles = this.config.project.workspaces.flatMap((workspace) => [
          path.join(workspace, 'pyproject.toml'),
          path.join(workspace, 'setup.py'),
          path.join(workspace, '__init__.py'),
        ]);

        await this.pythonBumpPackages(newVersion, pythonFiles);
      }

      await this.gitClient.createTag({
        tagName,
        tagMessage: `Release ${tagName}`,
      });

      await this.githubClient.createRelease({
        body: releaseNotes,
        releaseName: tagName,
        owner: this.repoInfo.owner,
        repo: this.repoInfo.repo,
        tagName,
        prerelease: isPrerelease,
        draft,
      });

      await this.gitClient.pushTags();

      data = {
        version: newVersion,
        tagName,
        releaseNotes,
      };
    } catch (foundError) {
      if (foundError instanceof OrbitItError) {
        error = foundError;
      } else if (foundError instanceof Error) {
        error = new OrbitItError({
          message: foundError.message,
          content: [{ message: 'Failed to create release.' }],
        });
      }
    }

    return {
      error,
      data,
    };
  }
  // #endregion - @versionStrategyFixedRelease

  // #region - @versionStrategyIndependentRelease
  private async versionStrategyIndependentRelease({
    release,
    dryRun = false,
  }: ReleaseOptions): Promise<FunctionResult<ReleaseResult>> {
    let error: OrbitItError | undefined;
    let data: ReleaseResult | undefined;

    const { type, draft = false } = release;

    try {
      // For independent versioning, we need to determine which packages have changes
      const tags = await this.gitClient.getTags();
      const latestTag = tags.latest || undefined;

      const commits = await this.gitClient.getCommits({ from: latestTag });

      if (commits.length === 0) {
        throw new OrbitItError({
          message: 'No commits found',
          content: [{ message: 'Please make some changes before releasing.' }],
        });
      }

      // Get changed packages by analyzing commit files
      const changedPackages = await this.getChangedPackages(commits);

      if (changedPackages.length === 0) {
        throw new OrbitItError({
          message: 'No packages have changes',
          content: [{ message: 'Please make changes to packages before releasing.' }],
        });
      }

      // For now, just release the first changed package (can be enhanced later)
      const packageToRelease = changedPackages[0];
      const currentVersion = packageToRelease.version;
      const newVersion = semver.inc(currentVersion, type);
      const tagName = `${packageToRelease.name}@${newVersion}`;

      const releaseNotes = this.generateReleaseNotes({ tagName, commits });

      if (dryRun) {
        return {
          data: {
            version: newVersion,
            tagName,
            releaseNotes,
          },
        };
      }

      const isPrerelease = semver.prerelease(newVersion) !== null;

      // Update the specific package version
      if (this.config.project.environment === 'nodejs') {
        await this.nodeJsBumpPackages(newVersion, [packageToRelease.packagePath]);
      }

      if (this.config.project.environment === 'python') {
        const pythonFiles = [
          path.join(path.dirname(packageToRelease.packagePath), 'pyproject.toml'),
          path.join(path.dirname(packageToRelease.packagePath), 'setup.py'),
          path.join(path.dirname(packageToRelease.packagePath), '__init__.py'),
        ];
        await this.pythonBumpPackages(newVersion, pythonFiles);
      }

      await this.gitClient.createTag({
        tagName,
        tagMessage: `Release ${tagName}`,
      });

      await this.githubClient.createRelease({
        body: releaseNotes,
        releaseName: tagName,
        owner: this.repoInfo.owner,
        repo: this.repoInfo.repo,
        tagName,
        prerelease: isPrerelease,
        draft,
      });

      await this.gitClient.pushTags();

      data = {
        version: newVersion,
        tagName,
        releaseNotes,
      };
    } catch (foundError) {
      if (foundError instanceof OrbitItError) {
        error = foundError;
      } else if (foundError instanceof Error) {
        error = new OrbitItError({
          message: foundError.message,
          content: [{ message: 'Failed to create release.' }],
        });
      }
    }

    return {
      error,
      data,
    };
  }

  private async getChangedPackages(commits: Commit[]): Promise<Array<{name: string; version: string; packagePath: string}>> {
    const changedFiles = new Set<string>();
    
    // Collect all changed files from commits
    const filePromises = commits.map(async (commit) => {
      return await this.gitClient.getCommitFiles(commit.hash);
    });
    
    const allFiles = await Promise.all(filePromises);
    for (const files of allFiles) {
      for (const file of files) {
        changedFiles.add(file);
      }
    }

    const changedPackages: Array<{name: string; version: string; packagePath: string}> = [];

    // Check which workspaces have changes
    const packagePromises = this.config.project.workspaces.map(async (workspace) => {
      const hasChangesInWorkspace = Array.from(changedFiles).some(file => 
        file.startsWith(workspace)
      );

      if (hasChangesInWorkspace) {
        const packageJsonPath = path.join(workspace, 'package.json');
        try {
          const packageJson = await readJsonFile(packageJsonPath);
          return {
            name: packageJson.name || workspace,
            version: packageJson.version || '0.0.0',
            packagePath: packageJsonPath,
          };
        } catch {
          // If package.json doesn't exist, use directory name and default version
          return {
            name: path.basename(workspace),
            version: '0.0.0',
            packagePath: packageJsonPath,
          };
        }
      }
      return null;
    });

    const results = await Promise.all(packagePromises);
    changedPackages.push(...results.filter(Boolean));

    return changedPackages;
  }
  // #endregion - @versionStrategyIndependentRelease

  // #region - @nodeJsBumpPackages
  private async nodeJsBumpPackages(
    newVersion: string,
    workspaces: string[]
  ): Promise<FunctionResult> {
    let error: OrbitItError | undefined;

    try {
      const packageJsonPaths = await fg(workspaces, {
        cwd: process.cwd(),
        absolute: true,
        ignore: ignorePaths,
        onlyFiles: true,
      });

      if (!packageJsonPaths) {
        throw new OrbitItError({
          message: 'No package.json files found.',
          content: [{ message: 'Please check your workspace configuration.' }],
        });
      }

      await Promise.all(
        packageJsonPaths.map(async (packageJsonPath) => {
          const packageJson = await readJsonFile(packageJsonPath);
          packageJson.version = newVersion;
          await writeJsonFile(packageJsonPath, packageJson);
        })
      );
    } catch (foundError) {
      if (foundError instanceof OrbitItError) {
        error = foundError;
      } else if (foundError instanceof Error) {
        error = new OrbitItError({
          message: foundError.message,
          content: [{ message: 'Failed to bump version.' }],
        });
      }
    }

    return {
      error,
    };
  }
  // #endregion - @nodeJsBumpPackages

  // #region - @pythonBumpPackages
  private async pythonBumpPackages(
    newVersion: string,
    pythonFiles: string[]
  ): Promise<FunctionResult> {
    let error: OrbitItError | undefined;

    try {
      const existingFiles = await fg(pythonFiles, {
        cwd: process.cwd(),
        absolute: true,
        ignore: ignorePaths,
        onlyFiles: true,
      });

      if (existingFiles.length === 0) {
        throw new OrbitItError({
          message: 'No Python version files found.',
          content: [{ message: 'Please check your workspace configuration.' }],
        });
      }

      await Promise.all(
        existingFiles.map(async (filePath) => {
          if (filePath.endsWith('pyproject.toml')) {
            await this.updatePyprojectToml(filePath, newVersion);
          } else if (filePath.endsWith('setup.py')) {
            await this.updateSetupPy(filePath, newVersion);
          } else if (filePath.endsWith('__init__.py')) {
            await this.updatePythonInit(filePath, newVersion);
          }
        })
      );
    } catch (foundError) {
      if (foundError instanceof OrbitItError) {
        error = foundError;
      } else if (foundError instanceof Error) {
        error = new OrbitItError({
          message: foundError.message,
          content: [{ message: 'Failed to bump Python version.' }],
        });
      }
    }

    return {
      error,
    };
  }

  private async updatePyprojectToml(
    filePath: string,
    newVersion: string
  ): Promise<void> {
    const fs = await import('node:fs/promises');
    const content = await fs.readFile(filePath, 'utf8');
    const updatedContent = content.replace(
      /^version\s*=\s*["'].*?["']/m,
      `version = "${newVersion}"`
    );
    await fs.writeFile(filePath, updatedContent, 'utf8');
  }

  private async updateSetupPy(
    filePath: string,
    newVersion: string
  ): Promise<void> {
    const fs = await import('node:fs/promises');
    const content = await fs.readFile(filePath, 'utf8');
    const updatedContent = content.replace(
      /version\s*=\s*["'].*?["']/g,
      `version="${newVersion}"`
    );
    await fs.writeFile(filePath, updatedContent, 'utf8');
  }

  private async updatePythonInit(
    filePath: string,
    newVersion: string
  ): Promise<void> {
    const fs = await import('node:fs/promises');
    const content = await fs.readFile(filePath, 'utf8');
    const updatedContent = content.replace(
      /^__version__\s*=\s*["'].*?["']/m,
      `__version__ = "${newVersion}"`
    );
    await fs.writeFile(filePath, updatedContent, 'utf8');
  }
  // #endregion - @pythonBumpPackages

  // #region - @generateReleaseNotes
  /**
   * @description Generates release notes based on grouped commits and the authors.
   */
  private generateReleaseNotes({
    tagName,
    commits,
  }: {
    tagName: string;
    commits: Commit[];
  }): string {
    const groupedCommits = this.groupCommitsByType(commits);

    let releaseNotes = `## Release Notes for ${tagName}\n\n`;

    for (const [type, groupCommits] of Object.entries(groupedCommits)) {
      if (groupCommits.length > 0) {
        releaseNotes += `### ${this.getCommitTypeLabel(type)}\n`;

        for (const commit of groupCommits) {
          releaseNotes += `- ${commit.message} by @${commit.author_name || commit.author_email}\n`;
        }
        releaseNotes += '\n';
      }
    }

    return releaseNotes;
  }
  // #endregion - @generateReleaseNotes

  // #region - @groupCommitsByType
  /**
   * @description Groups commits by their conventional commit type.
   */
  private groupCommitsByType(commits: Commit[]): Record<CommitType, Commit[]> {
    const grouped: Record<CommitType, Commit[]> = {
      feat: [],
      fix: [],
      docs: [],
      style: [],
      refactor: [],
      perf: [],
      test: [],
      chore: [],
      revert: [],
      other: [],
    };

    for (const commit of commits) {
      const commitMessage = commit.message;
      const match = commitMessage.match(commitMessageRegex);

      let type: CommitType = 'other';
      if (match) {
        type = match[1] as CommitType;
      }

      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(commit);
    }

    return grouped;
  }
  // #endregion - @groupCommitsByType

  // #region - @getCommitTypeLabel
  /**
   * @description Gets a human-readable label for a commit type.
   * @param type The commit type.
   * @returns The human-readable label.
   */
  private getCommitTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      feat: '🚀 Features',
      fix: '🐛 Bug Fixes',
      perf: '⚡ Performance Improvements',
      refactor: '♻️ Code Refactoring',
      docs: '📚 Documentation',
      style: '💄 Styles',
      test: '🧪 Tests',
      chore: '🔧 Chores',
      other: '📝 Other Changes',
    };

    return labels[type] || '📝 Other Changes';
  }
  // #endregion - @getCommitTypeLabel
}

export default ReleaseService;
