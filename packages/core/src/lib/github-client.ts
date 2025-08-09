/**
 * @name GitHubClient
 * @file src/lib/github-client.ts
 * @description Class to manage GitHub operations and repository information
 */

import { Octokit } from '@octokit/rest';
import { OrbitItError } from '@utils/errors';
import type { FunctionResult } from '@/types/functions';
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
  }: CreateReleaseOptions): Promise<FunctionResult<CreateReleaseResult>> {
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
        draft,
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
}

export default GitHubClient;
