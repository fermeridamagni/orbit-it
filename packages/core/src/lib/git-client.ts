/**
 * @file src/lib/git-client.ts
 * @description Class to manage git operations and repository information
 */

import { OrbitItError } from '@utils/errors';
import simpleGit, { type SimpleGit } from 'simple-git';
import type {
  CommitChangesOptions,
  CommitChangesResult,
  ConstructCommitMessageOptions,
  CreateTagOptions,
  CurrentBranchResult,
  GetChangesResult,
  GetCommitFilesResult,
  GetCommitOptions,
  GetCommitsResult,
  GetRemoteUrlResult,
  GetRepoInfoResult,
  GetStatusResult,
  GetTagsResult,
  HasChangesResult,
  IsRepoResult,
} from '@/types/git-client';

const remoteUrlRegex = /github\.com[:/](.+)\/(.+)(\.git)?$/; // Adjusted regex to match both HTTPS and SSH formats -> https://github.com/owner/repo.git
const removeGitFromUrlRegex = /\.git$/; // Regex to remove .git from the end of the URL

class GitClient {
  private client: SimpleGit;

  constructor() {
    this.client = simpleGit(process.cwd());
  }

  // #region - @isRepo
  /**
   * @description Checks if the current directory is a git repository.
   * @returns A promise that resolves to an object indicating success or failure.
   */
  async isRepo(): Promise<IsRepoResult> {
    const isRepo = await this.client.checkIsRepo();
    if (!isRepo) {
      throw new OrbitItError({
        message: 'Current directory is not a git repository',
        content: [
          {
            message: 'Please make sure you are in a git repository.',
          },
        ],
      });
    }
    return true;
  }
  // #endregion - @isRepo

  // #region - @getCurrentBranch
  /**
   * @description Retrieves the current branch name of the git repository.
   * @returns A promise that resolves to the current branch name.
   */
  async getCurrentBranch(): Promise<CurrentBranchResult> {
    const branchSummary = await this.client.branch();
    return branchSummary.current;
  }
  // #endregion - @getCurrentBranch

  // #region - @getRemoteUrl
  /**
   * @description Retrieves the remote URL of the git repository.
   * @returns A promise that resolves to the remote URL or null if not found.
   */
  async getRemoteUrl(): Promise<GetRemoteUrlResult> {
    const remotes = await this.client.getRemotes(true);
    if (remotes.length === 0) {
      throw new OrbitItError({
        message: 'No remotes found',
        content: [
          {
            message: 'Please add a remote to your git repository.',
          },
        ],
      });
    }
    return remotes[0].refs.fetch;
  }
  // #endregion - @getRemoteUrl

  // #region - @getStatus
  /**
   * @description Retrieves the status of the git repository, including staged, unstaged, and untracked files.
   * @returns A promise that resolves to the status of the repository.
   */
  async getStatus(): Promise<GetStatusResult> {
    return await this.client.status();
  }
  // #endregion - @getStatus

  // #region - @getCommits
  /**
   * @description Retrieves the commit history of the git repository.
   * @returns A promise that resolves to an array of commits or null if no commits are found.
   */
  async getCommits(options?: GetCommitOptions): Promise<GetCommitsResult> {
    const log = await this.client.log({
      from: options?.from,
    });
    if (!log.all || log.all.length === 0) {
      throw new OrbitItError({
        message: 'No commits found',
        content: [
          {
            message: 'Please make some commits to the repository.',
          },
        ],
      });
    }
    return log.all.map((commit) => ({
      ...commit,
      message: commit.message,
    }));
  }
  // #endregion - @getCommits

  // #region - @getCommitFiles
  /**
   * @description Gets the list of files changed in a specific commit.
   * @param commitHash The hash of the commit.
   * @returns A promise that resolves to an array of file paths changed in the commit.
   */
  async getCommitFiles(commitHash: string): Promise<GetCommitFilesResult> {
    const filesOutput = await this.client.raw([
      'show',
      '--pretty=format:',
      '--name-only',
      commitHash,
    ]);
    return filesOutput
      .split('\n')
      .filter((line) => line.trim() !== '')
      .map((file) => file.trim());
  }
  // #endregion - @getCommitFiles

  // #region - @getRepoInfo
  /**
   * @description Retrieves the owner and repository name from the remote URL.
   * @returns A promise that resolves to an object containing the owner and repository name or null if not found.
   */
  async getRepoInfo(): Promise<GetRepoInfoResult> {
    const remoteUrl = await this.getRemoteUrl();
    const match = remoteUrl.match(remoteUrlRegex);
    if (!match) {
      throw new OrbitItError({
        message: 'Invalid remote URL format',
        content: [
          {
            message:
              'The remote URL does not match the expected GitHub format.',
          },
        ],
      });
    }
    return {
      owner: match[1],
      repo: match[2].replace(removeGitFromUrlRegex, ''),
    };
  }
  // #endregion - @getRepoInfo

  // #region - @hasChanges
  /**
   * @description Checks if there are any changes in the git repository.
   * @returns A promise that resolves to a boolean indicating if there are changes.
   */
  async hasChanges(): Promise<HasChangesResult> {
    const status = await this.getStatus();
    const hasChanges = status.files.length > 0 || status.not_added.length > 0;
    if (!hasChanges) {
      throw new OrbitItError({
        message: 'There are no changes in the repository',
        content: [
          {
            message: 'Make some changes to files before committing.',
          },
        ],
      });
    }
    return true;
  }
  // #endregion - @hasChanges

  // #region - @getChanges
  /**
   * @description Retrieves the changes in the git repository.
   * @returns A promise that resolves to the status of the repository or null if no changes are found.
   */
  async getChanges(): Promise<GetChangesResult> {
    return await this.getStatus();
  }
  // #endregion - @getChanges

  // #region - @addFiles
  /**
   * @description Adds files to the staging area in the git repository.
   * @param files An array of file paths to add to the staging area.
   * @returns A promise that resolves to a FunctionResult indicating success or failure.
   */
  async addFiles(files: string[]): Promise<void> {
    await this.client.add(files);
  }
  // #endregion - @addFiles

  // #region - @commitChanges
  /**
   * @description Commits the staged changes in the git repository.
   * @param type The type of change (e.g., "feat", "fix").
   * @param message The short description of the change.
   * @param body The detailed description of the change (optional).
   * @param scope The scope of the change (optional).
   * @returns A promise that resolves to the commit result or null if the commit fails.
   */
  async commitChanges(
    options: CommitChangesOptions
  ): Promise<CommitChangesResult> {
    const {
      type: commitType,
      message: commitMessage,
      body: commitBody,
      scope: commitScope,
    } = options;
    const constructedMessage = this.constructCommitMessage({
      type: commitType,
      scope: commitScope,
      message: commitMessage,
      body: commitBody,
    });
    const commit = await this.client.commit(constructedMessage);
    if (!commit.commit) {
      throw new OrbitItError({
        message: 'Commit failed or no commit data returned',
        content: [
          {
            message: 'Please check your git configuration and try again.',
          },
        ],
      });
    }
    return commit;
  }
  // #endregion - @commitChanges

  // #region - @pushChanges
  /**
   * @description Pushes the committed changes to the remote repository.
   * @returns A promise that resolves to a FunctionResult indicating success or failure.
   */
  async pushChanges(): Promise<void> {
    await this.client.push();
  }
  // #endregion - @pushChanges

  // #region - @getTags
  /**
   * @description Retrieves the tags in the git repository.
   * @returns A promise that resolves to an array of tags or null if no tags are found.
   */
  async getTags(): Promise<GetTagsResult> {
    // Return whatever simple-git returns; empty tag list is valid (first release scenario)
    return await this.client.tags();
  }
  // #endregion - @getTags

  // #region - @createTag
  /**
   * @description Creates a tag in the git repository.
   * @param tagName The name of the tag to create.
   * @param message The message associated with the tag (optional).
   * @returns A promise that resolves to a FunctionResult indicating success or failure.
   */
  async createTag(options: CreateTagOptions): Promise<void> {
    const { tagName, tagMessage } = options;
    if (tagMessage) {
      await this.client.addAnnotatedTag(tagName, tagMessage);
    } else {
      await this.client.addTag(tagName);
    }
  }
  // #endregion - @createTag

  // #region - @pushTags
  /**
   * @description Pushes tags to the remote repository.
   * @returns A promise that resolves to a FunctionResult indicating success or failure.
   */
  async pushTags(): Promise<void> {
    await this.client.pushTags();
  }
  // #endregion - @pushTags

  // #region - @createBranch
  /**
   * @description Creates and checks out a new branch.
   * @param branchName The name of the branch to create.
   * @returns A promise that resolves to a FunctionResult indicating success or failure.
   */
  async createBranch(branchName: string): Promise<void> {
    await this.client.checkoutLocalBranch(branchName);
  }
  // #endregion - @createBranch

  // #region - @pushBranch
  /**
   * @description Pushes a branch to the remote repository.
   * @param branchName The name of the branch to push.
   * @returns {FunctionResultPromise} A promise that resolves to a FunctionResult indicating success or failure.
   */
  async pushBranch(branchName: string): Promise<void> {
    await this.client.push('origin', branchName);
  }
  // #endregion - @pushBranch

  // #region - @constructCommitMessage
  /**
   * @description Constructs a commit message based on the provided type, scope, message, and body.
   * @param type The type of change (e.g., "feat", "fix").
   * @param scope The scope of the change (optional).
   * @param message The short description of the change (optional).
   * @param body The detailed description of the change (optional).
   * @returns {string} The constructed commit message.
   */
  private constructCommitMessage = ({
    type,
    scope,
    message,
    body,
  }: ConstructCommitMessageOptions): string => {
    let commitMsg = '';

    if (type) {
      commitMsg += `${type}`;
    }
    if (scope) {
      commitMsg += `(${scope})`;
    }
    if (message) {
      commitMsg += `: ${message}`;
    }
    if (body) {
      commitMsg += `\n\n${body}`;
    }
    return commitMsg;
  };
  // #endregion - @constructCommitMessage
}

export default GitClient;
