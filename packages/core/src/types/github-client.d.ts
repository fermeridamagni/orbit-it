import type GitClient from '@lib/git-client';
import type { RestEndpointMethodTypes } from '@octokit/rest';
import type { Commit, CommitType } from './git-client';

export type GitHubClientOptions = {
  gitClient?: GitClient;
};

export type ClientOptions = {
  token: string;
};

export type GetUserInfoResult =
  | RestEndpointMethodTypes['users']['getAuthenticated']['response']['data']
  | null;

export type GetRepoInfoResult =
  | RestEndpointMethodTypes['repos']['get']['response']['data']
  | null;

export type CreateReleaseResult =
  | RestEndpointMethodTypes['repos']['createRelease']['response']['data']
  | null;

export type ListReleasesResult =
  | RestEndpointMethodTypes['repos']['listReleases']['response']['data']
  | null;

export type CheckRepoExistsResult = boolean;

export type GroupCommitsByType = Record<CommitType, Commit[]> | null;
