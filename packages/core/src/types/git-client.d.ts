import type {
  CommitResult,
  DefaultLogFields,
  ListLogLine,
  StatusResult,
} from 'simple-git';

/**
 * @description A commit object that includes default log fields and a list log line.
 */
export type Commit = DefaultLogFields & ListLogLine;

/**
 * @description The type for grouping commits by their type.
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

export type IsRepoResult = boolean;

export type CurrentBranchResult = string | null;

export type GetRemoteUrlResult = string | null;

export type GetStatusResult = StatusResult | null;

export type GetCommitsResult = Commit[] | null;

export type GetOwnerAndRepoResult = {
  owner: string;
  repo: string;
} | null;

export type HasChangesResult = boolean;

export type GetChangesResult = StatusResult | null;

export type CommitChangesOptions = {
  type: string;
  message: string;
  body?: string;
  scope?: string;
};

export type CommitChangesResult = CommitResult | null;

export type CreateTagOptions = {
  tagName: string;
  tagMessage?: string;
};
