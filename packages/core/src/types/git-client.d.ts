import type {
  CommitResult,
  DefaultLogFields,
  ListLogLine,
  StatusResult,
} from 'simple-git';

/**
 * @description A commit object
 */
export type Commit = DefaultLogFields & ListLogLine;

/**
 * @description The type of commit message prefixes used in conventional commits.
 */
export type CommitType =
  | 'feat'
  | 'fix'
  | 'docs'
  | 'style'
  | 'refactor'
  | 'perf'
  | 'test'
  | 'chore'
  | 'revert'
  | 'other';

/**
 * @description The result of checking if a repository exists.
 */
export type IsRepoResult = boolean;

/**
 * @description The result of getting the current branch name.
 */
export type CurrentBranchResult = string | null;

/**
 * @description The result of getting the remote URL.
 */
export type GetRemoteUrlResult = string | null;

/**
 * @description The result of getting the status of the repository.
 */
export type GetStatusResult = StatusResult | null;

/**
 * @description The result of getting commits.
 */
export type GetCommitsResult = Commit[] | null;

/**
 * @description The result of getting the owner and repository name from a remote URL.
 */
export type GetOwnerAndRepoResult = {
  owner: string;
  repo: string;
} | null;

/**
 * @description The result of checking if there are changes in the repository.
 */
export type HasChangesResult = boolean;

/**
 * @description The result of getting changes in the repository.
 */
export type GetChangesResult = StatusResult | null;

/**
 * @description The options for committing changes.
 */
export type CommitChangesOptions = {
  type: string;
  message: string;
  body?: string;
  scope?: string;
};

/**
 * @description The result of committing changes.
 */
export type CommitChangesResult = CommitResult | null;

/**
 * @description The options for creating a tag.
 */
export type CreateTagOptions = {
  tagName: string;
  tagMessage?: string;
};

/**
 * @description The options for constructing a commit message.
 */
export type ConstructCommitMessageOptions = {
  type: string;
  message: string;
  body?: string;
  scope?: string;
};
