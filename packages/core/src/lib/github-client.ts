/**
 * @name GitHubClient
 * @file src/lib/github-client.ts
 * @description Class to manage GitHub operations and repository information
 */

import { Octokit } from '@octokit/rest';
import { OrbitItError } from '@utils/errors';
import type {
  CheckRepoExistsResult,
  CreateReleaseOptions,
  CreateReleaseResult,
  GetRepoInfoResult,
  GetUserInfoResult,
  ListReleasesResult,
} from '@/types/github-client';

export class GitHubClient {
  private client: Octokit | null = null;

  constructor(token: string) {
    this.init(token);
  }

  // #region - @init
  /**
   * @description Initializes the GitHub client with a personal access token.
   * @param token - The personal access token for GitHub API authentication.
   */
  private init(token: string): void {
    this.client = new Octokit({ auth: token });
  }
  // #endregion - @init

  // #region - @getUserInfo
  /**
   * @description Retrieves the authenticated user's information.
   * @returns A promise that resolves to the user's information.
   */
  async getUserInfo(): Promise<GetUserInfoResult> {
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
    return response.data;
  }
  // #endregion - @getUserInfo

  // #region - @getRepoInfo
  /**
   * @description Retrieves repository information by owner and repo name.
   * @param owner - The owner of the repository.
   * @param repo - The name of the repository.
   * @returns A promise that resolves to the repository information.
   */
  async getRepoInfo(owner: string, repo: string): Promise<GetRepoInfoResult> {
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
    return response.data;
  }
  // #endregion - @getRepoInfo
  // #region - @createRelease
  /**
   * @description Creates a new release for a repository.
   * @param options - The options for creating the release.
   * @see {@link CreateReleaseOptions}
   * @returns A promise that resolves to the created release information.
   */
  async createRelease({
    owner,
    repo,
    tagName,
    releaseName,
    body,
    prerelease = false,
    draft = false,
  }: CreateReleaseOptions): Promise<CreateReleaseResult> {
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
      draft,
    });
    return response.data;
  }
  // #endregion - @createRelease

  // #region - @listReleases
  /**
   * @description Lists releases for a repository.
   * @param owner - The owner of the repository.
   * @param repo - The name of the repository.
   * @returns A promise that resolves to the list of releases.
   */
  async listReleases(owner: string, repo: string): Promise<ListReleasesResult> {
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
    return response.data;
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
  ): Promise<void> {
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
  ): Promise<CheckRepoExistsResult> {
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
    try {
      await this.client.repos.get({ owner, repo });
      return true;
    } catch (err) {
      if (err instanceof Error && err.message.includes('Not Found')) {
        return false;
      }
      throw err;
    }
  }
  // #endregion - @checkRepoExists
}

export default GitHubClient;
