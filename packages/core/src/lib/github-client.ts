/**
 * @name GitHubClient
 * @file src/lib/github-client.ts
 * @description Class to manage GitHub operations and repository information
 */

import { GitClient } from '@lib/git-client';
import { Octokit } from '@octokit/rest';
import { OrbitItError } from '@utils/errors';
import type { FunctionResult } from '@/types/functions';
import type { Commit, CommitType } from '@/types/git-client';
import type {
  CheckRepoExistsResult,
  CreateReleaseResult,
  GetRepoInfoResult,
  GetUserInfoResult,
  GitHubClientOptions,
  GroupCommitsByType,
  ListReleasesResult,
} from '@/types/github-client';

const commitMessageRegex =
  /^(feat|fix|docs|style|refactor|perf|test|chore)(\([^)]*\))?:/;

export class GitHubClient {
  client: Octokit | null = null;
  gitClient?: GitClient | null = null;

  constructor({ gitClient }: GitHubClientOptions) {
    this.init();

    // If a GitClient instance is provided, use it
    // Otherwise, it will be null and we can handle it gracefully
    if (gitClient instanceof GitClient) {
      this.gitClient = gitClient;
    }
  }

  // #region - @init
  /**
   * @description Initializes the GitHub client with a personal access token.
   * @param token - The personal access token for GitHub API authentication.
   */
  private init(): void {
    const token = process.env.GITHUB_TOKEN;

    this.client = new Octokit({ auth: token });
  }
  // #endregion - @init

  // #region - @getUserInfo
  /**
   * @description Retrieves the authenticated user's information.
   * @returns A promise that resolves to the user's information.
   */
  async getUserInfo(): Promise<FunctionResult<GetUserInfoResult>> {
    let error: OrbitItError | undefined;
    let data: GetUserInfoResult | undefined;

    try {
      if (!this.client) {
        throw new OrbitItError({
          message: 'GitHub client is not initialized',
          content: [
            {
              message: 'Please ensure a valid GITHUB_TOKEN is provided.',
            },
          ],
        });
      }

      const response = await this.client.users.getAuthenticated();

      data = response.data;
    } catch (foundError) {
      if (foundError instanceof OrbitItError) {
        error = foundError;
      } else if (foundError instanceof Error) {
        error = new OrbitItError({
          message: foundError.message,
          content: [{ message: 'Failed to retrieve user information.' }],
        });
      }
    }

    return {
      error,
      data,
    };
  }
  // #endregion - @getUserInfo

  // #region - @getRepoInfo
  /**
   * @description Retrieves repository information by owner and repo name.
   * @param owner - The owner of the repository.
   * @param repo - The name of the repository.
   * @returns A promise that resolves to the repository information.
   */
  async getRepoInfo(
    owner: string,
    repo: string
  ): Promise<FunctionResult<GetRepoInfoResult>> {
    let error: OrbitItError | undefined;
    let data: GetRepoInfoResult | undefined;

    try {
      if (!this.client) {
        throw new OrbitItError({
          message: 'GitHub client is not initialized',
          content: [
            {
              message: 'Please ensure a valid GITHUB_TOKEN is provided.',
            },
          ],
        });
      }

      const response = await this.client.repos.get({ owner, repo });

      data = response.data;
    } catch (foundError) {
      if (foundError instanceof OrbitItError) {
        error = foundError;
      } else if (foundError instanceof Error) {
        error = new OrbitItError({
          message: foundError.message,
          content: [{ message: 'Failed to retrieve repository information.' }],
        });
      }
    }

    return {
      error,
      data,
    };
  }
  // #endregion - @getRepoInfo
  // #region - @createRelease
  /**
   * @description Creates a new release for a repository.
   * @param owner - The owner of the repository.
   * @param repo - The name of the repository.
   * @param tagName - The name of the tag to create the release for.
   * @param releaseName - The name of the release.
   * @param body - The body content of the release.
   * @param prerelease - Whether this is a prerelease.
   * @returns A promise that resolves to the created release information.
   */
  async createRelease(
    owner: string,
    repo: string,
    tagName: string,
    releaseName: string,
    body: string,
    prerelease = false
  ): Promise<FunctionResult<CreateReleaseResult>> {
    let error: OrbitItError | undefined;
    let data: CreateReleaseResult | undefined;

    try {
      if (!this.client) {
        throw new OrbitItError({
          message: 'GitHub client is not initialized',
          content: [
            {
              message: 'Please ensure a valid GITHUB_TOKEN is provided.',
            },
          ],
        });
      }

      const response = await this.client.repos.createRelease({
        owner,
        repo,
        tag_name: tagName,
        name: releaseName,
        body,
        prerelease,
      });

      data = response.data;
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
  // #endregion - @createRelease

  // #region - @listReleases
  /**
   * @description Lists releases for a repository.
   * @param owner - The owner of the repository.
   * @param repo - The name of the repository.
   * @returns A promise that resolves to the list of releases.
   */
  async listReleases(
    owner: string,
    repo: string
  ): Promise<FunctionResult<ListReleasesResult>> {
    let error: OrbitItError | undefined;
    let data: ListReleasesResult | undefined;

    try {
      if (!this.client) {
        throw new OrbitItError({
          message: 'GitHub client is not initialized',
          content: [
            {
              message: 'Please ensure a valid GITHUB_TOKEN is provided.',
            },
          ],
        });
      }

      const response = await this.client.repos.listReleases({
        owner,
        repo,
      });

      data = response.data;
    } catch (foundError) {
      if (foundError instanceof OrbitItError) {
        error = foundError;
      } else if (foundError instanceof Error) {
        error = new OrbitItError({
          message: foundError.message,
          content: [{ message: 'Failed to list releases.' }],
        });
      }
    }

    return {
      error,
      data,
    };
  }
  // #endregion - @listReleases

  // #region - @deleteRelease
  /**
   * @description Deletes a release by its ID.
   * @param owner - The owner of the repository.
   * @param repo - The name of the repository.
   * @param releaseId - The ID of the release to delete.
   * @returns A promise that resolves when the release is deleted.
   */
  async deleteRelease(
    owner: string,
    repo: string,
    releaseId: number
  ): Promise<FunctionResult> {
    let error: OrbitItError | undefined;

    try {
      if (!this.client) {
        throw new OrbitItError({
          message: 'GitHub client is not initialized',
          content: [
            {
              message: 'Please ensure a valid GITHUB_TOKEN is provided.',
            },
          ],
        });
      }

      await this.client.repos.deleteRelease({
        owner,
        repo,
        release_id: releaseId,
      });
    } catch (foundError) {
      if (foundError instanceof OrbitItError) {
        error = foundError;
      } else if (foundError instanceof Error) {
        error = new OrbitItError({
          message: foundError.message,
          content: [{ message: 'Failed to delete release.' }],
        });
      }
    }

    return {
      error,
    };
  }
  // #endregion - @deleteRelease

  // #region - @checkRepoExists
  /**
   * @description Checks if a repository exists.
   * @param owner - The owner of the repository.
   * @param repo - The name of the repository.
   * @returns A promise that resolves to true if the repository exists, false otherwise.
   */
  async checkRepoExists(
    owner: string,
    repo: string
  ): Promise<FunctionResult<CheckRepoExistsResult>> {
    let error: OrbitItError | undefined;
    let data: CheckRepoExistsResult | undefined;

    try {
      if (!this.client) {
        throw new OrbitItError({
          message: 'GitHub client is not initialized',
          content: [
            {
              message: 'Please ensure a valid GITHUB_TOKEN is provided.',
            },
          ],
        });
      }

      await this.client.repos.get({ owner, repo });

      data = true;
    } catch (foundError) {
      if (foundError instanceof OrbitItError) {
        error = foundError;
      } else if (foundError instanceof Error) {
        // For this function, we don't treat "not found" as an error
        // Instead, we return false to indicate the repo doesn't exist
        if (foundError.message.includes('Not Found')) {
          data = false;
        } else {
          error = new OrbitItError({
            message: foundError.message,
            content: [{ message: 'Failed to check if repository exists.' }],
          });
        }
      }
    }

    return {
      error,
      data,
    };
  }
  // #endregion - @checkRepoExists

  // #region - @getCommitsByType
  /**
   * @description Groups commits by their conventional commit type.
   * @returns Commits grouped by type.
   */
  async groupCommitsByType(): Promise<FunctionResult<GroupCommitsByType>> {
    let error: OrbitItError | undefined;
    let data: GroupCommitsByType | undefined;

    try {
      if (!this.gitClient) {
        throw new OrbitItError({
          message: 'Git client is not initialized',
          content: [
            {
              message: 'Please ensure a valid GitClient instance is provided.',
            },
          ],
        });
      }

      const commits = await this.gitClient.getCommits();

      if (commits.error || !commits.data) {
        throw new OrbitItError({
          message: commits.error?.message || 'Failed to get commits',
          content: commits.error?.content || [
            { message: 'Unable to retrieve commits.' },
          ],
        });
      }

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

      for (const commit of commits.data) {
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

      data = grouped;
    } catch (foundError) {
      if (foundError instanceof OrbitItError) {
        error = foundError;
      } else if (foundError instanceof Error) {
        error = new OrbitItError({
          message: foundError.message,
          content: [{ message: 'Failed to group commits by type.' }],
        });
      }
    }

    return {
      error,
      data,
    };
  }
  // #endregion - @getCommitsByType

  // #region - @getCommitTypeLabel
  /**
   * @description Gets a human-readable label for a commit type.
   * @param type The commit type.
   * @returns The human-readable label.
   */
  getCommitTypeLabel(type: string): string {
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

export default GitHubClient;
