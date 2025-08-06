import type GitClient from '@lib/git-client';
import type { RestEndpointMethodTypes } from '@octokit/rest';
import type { Commit, CommitType } from './git-client';

/**
 * @description The options for the GitHub client.
 */
export type GitHubClientOptions = {
  gitClient?: GitClient;
};

/**
 * @description The result of getting user information.
 */
export type GetUserInfoResult =
  | RestEndpointMethodTypes['users']['getAuthenticated']['response']['data']
  | null;

/**
 * @description The result of getting repository information.
 */
export type GetRepoInfoResult =
  | RestEndpointMethodTypes['repos']['get']['response']['data']
  | null;

/**
 * @description The result of creating a release.
 */
export type CreateReleaseResult =
  | RestEndpointMethodTypes['repos']['createRelease']['response']['data']
  | null;

/**
 * @description The result of listing releases.
 */
export type ListReleasesResult =
  | RestEndpointMethodTypes['repos']['listReleases']['response']['data']
  | null;

/**
 * @description The result of checking if a repository exists.
 */
export type CheckRepoExistsResult = boolean;

/**
 * @description The result of getting commits grouped by type.
 */
export type GroupCommitsByType = Record<CommitType, Commit[]> | null;
