/**
 * @name GitHubClient
 * @file src/lib/github-client.ts
 * @description Class to manage GitHub operations and repository information
 */

import GitClient from '@lib/git-client';
import { Octokit } from '@octokit/rest';
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

class GitHubClient {
  client: Octokit | null = null;
  gitClient: GitClient;

  constructor({ gitClient }: GitHubClientOptions) {
    this.init();
    this.gitClient = gitClient || new GitClient();
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
    let success = false;
    let message = '';
    let result: GetUserInfoResult = null;

    try {
      if (!this.client) {
        throw new Error('GitHub client is not initialized');
      }

      const response = await this.client.users.getAuthenticated();

      success = true;
      message = 'User information retrieved successfully';
      result = response.data;
    } catch (error) {
      success = false;
      message = 'Failed to retrieve user information';

      if (error instanceof Error) {
        message = error.message;
      }
    }

    return {
      success,
      message,
      data: result,
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
    let success = false;
    let message = '';
    let result: GetRepoInfoResult = null;

    try {
      if (!this.client) {
        throw new Error('GitHub client is not initialized');
      }

      const response = await this.client.repos.get({ owner, repo });

      success = true;
      message = 'Repository information retrieved successfully';
      result = response.data;
    } catch (error) {
      success = false;
      message = 'Failed to retrieve repository information';

      if (error instanceof Error) {
        message = error.message;
      }
    }

    return {
      success,
      message,
      data: result,
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
    let success = false;
    let message = '';
    let result: CreateReleaseResult = null;

    try {
      if (!this.client) {
        throw new Error('GitHub client is not initialized');
      }

      const response = await this.client.repos.createRelease({
        owner,
        repo,
        tag_name: tagName,
        name: releaseName,
        body,
        prerelease,
      });

      success = true;
      message = 'Release created successfully';
      result = response.data;
    } catch (error) {
      success = false;
      message = 'Failed to create release';

      if (error instanceof Error) {
        message = error.message;
      }
    }

    return {
      success,
      message,
      data: result,
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
    let success = false;
    let message = '';
    let result: ListReleasesResult = null;

    try {
      if (!this.client) {
        throw new Error('GitHub client is not initialized');
      }

      const response = await this.client.repos.listReleases({
        owner,
        repo,
      });

      success = true;
      message = 'Releases listed successfully';
      result = response.data;
    } catch (error) {
      success = false;
      message = 'Failed to list releases';

      if (error instanceof Error) {
        message = error.message;
      }
    }

    return {
      success,
      message,
      data: result,
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
    let success = false;
    let message = '';

    try {
      if (!this.client) {
        throw new Error('GitHub client is not initialized');
      }

      await this.client.repos.deleteRelease({
        owner,
        repo,
        release_id: releaseId,
      });

      success = true;
      message = 'Release deleted successfully';
    } catch (error) {
      success = false;
      message = 'Failed to delete release';

      if (error instanceof Error) {
        message = error.message;
      }
    }

    return {
      success,
      message,
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
    let success = false;
    let message = '';
    let result: CheckRepoExistsResult = false;

    try {
      if (!this.client) {
        throw new Error('GitHub client is not initialized');
      }

      await this.client.repos.get({ owner, repo });

      success = true;
      message = 'Repository exists';
      result = true;
    } catch (error) {
      success = false;
      message = 'Repository does not exist';

      if (error instanceof Error) {
        message = error.message;
      }
    }

    return {
      success,
      message,
      data: result,
    };
  }
  // #endregion - @checkRepoExists

  // #region - @getCommitsByType
  /**
   * @description Groups commits by their conventional commit type.
   * @returns Commits grouped by type.
   */
  async groupCommitsByType(): Promise<FunctionResult<GroupCommitsByType>> {
    let success = false;
    let message = '';
    let result: GroupCommitsByType = null;

    try {
      const commits = await this.gitClient.getCommits();

      if (!commits?.data) {
        throw new Error(commits?.message);
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

      result = grouped;
      success = true;
      message = 'Commits grouped by type successfully';
    } catch (error) {
      success = false;
      message = 'Failed to group commits by type';

      if (error instanceof Error) {
        message = error.message;
      }
    }

    return {
      success,
      message,
      data: result,
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
