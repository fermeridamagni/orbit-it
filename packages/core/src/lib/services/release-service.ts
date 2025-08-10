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

  constructor(token: string, { config }: ReleaseServiceOptions) {
    this.config = config;
    this.gitClient = new GitClient();
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

      const repoInfo = await this.gitClient.getRepoInfo();

      if (repoInfo.error || !repoInfo.data) {
        throw new OrbitItError({
          message: 'Failed to get repository information.',
          content: [{ message: 'Please check your git configuration.' }],
        });
      }

      this.repoInfo = {
        owner: repoInfo.data.owner,
        repo: repoInfo.data.repo,
      };

      // if the versioning strategy is fixed means all the packages/apps have the same version
      if (this.config.release.versioningStrategy === 'fixed') {
        const releaseResult = await this.versionStrategyFixedRelease(options);

        if (releaseResult.error || !releaseResult.data) {
          throw releaseResult.error;
        }

        data = releaseResult.data;
      } else {
        // if the versioning strategy is independent means each package/app can have its own version
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

      // if there are no tags, means this is the first release
      const latestTag = tags.data?.latest || undefined;

      const commits = await this.gitClient.getCommits({
        from: latestTag,
      });

      if (commits.error || !commits.data) {
        throw new OrbitItError({
          message: 'No commits found',
          content: [{ message: 'Please make some changes before releasing.' }],
        });
      }

      const newVersion = semver.inc(currentVersion, type);
      const tagName = `v${newVersion}`;

      const releaseNotes = this.generateReleaseNotes({
        tagName,
        commits: commits.data,
      });

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

        const bumpResult = await this.nodeJsBumpPackages(
          newVersion,
          workspaces
        );

        if (bumpResult.error) {
          throw bumpResult.error;
        }
      }

      if (this.config.project.environment === 'python') {
        // TODO: Implement Python package version update logic
      }

      const releaseResult = await this.githubClient.createRelease({
        body: releaseNotes,
        releaseName: tagName,
        owner: this.repoInfo.owner,
        repo: this.repoInfo.repo,
        tagName,
        prerelease: isPrerelease,
        draft,
      });

      if (releaseResult.error || !releaseResult.data) {
        throw new OrbitItError({
          message: 'Failed to create release.',
          content: [{ message: 'Please check your GitHub configuration.' }],
        });
      }

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
