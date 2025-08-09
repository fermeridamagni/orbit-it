import type { RestEndpointMethodTypes } from '@octokit/rest';

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
 * @description The options for creating a release.
 */
export type CreateReleaseOptions = {
  owner: string;
  repo: string;
  tagName: string;
  releaseName: string;
  body: string;
  prerelease?: boolean;
  draft?: boolean;
};

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
