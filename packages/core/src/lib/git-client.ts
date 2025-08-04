/**
 * @name GitClient
 * @file src/lib/git-client.ts
 * @description Class to manage git operations and repository information
 */

import colors from 'picocolors';
import type { Formatter } from 'picocolors/types';
import simpleGit, { type SimpleGit } from 'simple-git';
import type { FunctionResult } from '@/types/functions';
import type {
  CommitChangesOptions,
  CommitChangesResult,
  CreateTagOptions,
  CurrentBranchResult,
  GetChangesResult,
  GetCommitsResult,
  GetOwnerAndRepoResult,
  GetRemoteUrlResult,
  GetStatusResult,
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
  async isRepo(): Promise<FunctionResult<IsRepoResult>> {
    let success = false;
    let message = '';
    let result = false;

    try {
      const isRepo = await this.client.checkIsRepo();

      if (!isRepo) {
        throw new Error('Current directory is not a git repository');
      }

      success = true;
      message = 'Current directory is a git repository';
      result = true;
    } catch (error) {
      success = false;
      message = 'Failed to check if current directory is a git repository';

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
  // #endregion - @isRepo

  // #region - @getCurrentBranch
  /**
   * @description Retrieves the current branch name of the git repository.
   * @returns A promise that resolves to the current branch name.
   */
  async getCurrentBranch(): Promise<FunctionResult<CurrentBranchResult>> {
    let success = false;
    let message = '';
    let result: CurrentBranchResult = null;

    try {
      const branchSummary = await this.client.branch();

      success = true;
      message = 'Current branch retrieved successfully';
      result = branchSummary.current;
    } catch (error) {
      success = false;
      message = 'Failed to get current branch';

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
  // #endregion - @getCurrentBranch

  // #region - @getRemoteUrl
  /**
   * @description Retrieves the remote URL of the git repository.
   * @returns A promise that resolves to the remote URL or null if not found.
   */
  async getRemoteUrl(): Promise<FunctionResult<GetRemoteUrlResult>> {
    let success = false;
    let message = '';
    let result: GetRemoteUrlResult = null;

    try {
      const remotes = await this.client.getRemotes(true);

      if (remotes.length === 0) {
        throw new Error('No remotes found');
      }

      success = true;
      message = 'Remote URL retrieved successfully';
      result = remotes[0].refs.fetch; // Return the fetch URL of the first remote
    } catch (error) {
      success = false;
      message = 'Failed to get remote URL';

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
  // #endregion - @getRemoteUrl

  // #region - @getStatus
  /**
   * @description Retrieves the status of the git repository, including staged, unstaged, and untracked files.
   * @returns A promise that resolves to the status of the repository.
   */
  async getStatus(): Promise<FunctionResult<GetStatusResult>> {
    let success = false;
    let message = '';
    let result: GetStatusResult = null;

    try {
      const status = await this.client.status();

      success = true;
      message = 'Repository status retrieved successfully';
      result = status;
    } catch (error) {
      success = false;
      message = 'Failed to get repository status';

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
  // #endregion - @getStatus

  // #region - @getCommits
  /**
   * @description Retrieves the commit history of the git repository.
   * @returns A promise that resolves to an array of commits or null if no commits are found.
   */
  async getCommits(): Promise<FunctionResult<GetCommitsResult>> {
    let success = false;
    let message = '';
    let result: GetCommitsResult = null;

    try {
      const log = await this.client.log();

      if (!log.all || log.all.length === 0) {
        throw new Error('No commits found');
      }

      success = true;
      message = 'Commits retrieved successfully';
      result = log.all.map((commit) => ({
        ...commit,
        message: commit.message,
      }));
    } catch (error) {
      success = false;
      message = 'Failed to get commits';

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
  // #endregion - @getCommits

  // #region - @getOwnerAndRepo
  /**
   * @description Retrieves the owner and repository name from the remote URL.
   * @returns A promise that resolves to an object containing the owner and repository name or null if not found.
   */
  async getOwnerAndRepo(): Promise<FunctionResult<GetOwnerAndRepoResult>> {
    let success = false;
    let message = '';
    let result: GetOwnerAndRepoResult = null;

    try {
      const remoteUrl = await this.getRemoteUrl();

      if (!(remoteUrl.success && remoteUrl.data)) {
        throw new Error(remoteUrl.message);
      }

      const match = remoteUrl.data.match(remoteUrlRegex);

      if (!match) {
        throw new Error('Invalid remote URL format');
      }

      success = true;
      message = 'Owner and repository name retrieved successfully';
      result = {
        owner: match[1],
        repo: match[2].replace(removeGitFromUrlRegex, ''), // Remove .git if present
      };
    } catch (error) {
      success = false;
      message = 'Failed to get owner and repository name';

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
  // #endregion - @getOwnerAndRepo

  // #region - @hasChanges
  /**
   * @description Checks if there are any changes in the git repository.
   * @returns A promise that resolves to a boolean indicating if there are changes.
   */
  async hasChanges(): Promise<FunctionResult<HasChangesResult>> {
    let success = false;
    let message = '';
    let result: HasChangesResult = false;

    try {
      const status = await this.getStatus();

      if (!status.data) {
        throw new Error('Failed to retrieve status or no files found');
      }

      const hasChanges: boolean =
        status.data.files.length === 0 || status.data.not_added.length === 0;

      if (hasChanges) {
        throw new Error('There are no changes in the repository');
      }

      success = true;
      message = 'There are changes in the repository';
      result = true;
    } catch (error) {
      success = false;
      message = 'No changes detected';

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
  // #endregion - @hasChanges

  // #region - @getChanges
  /**
   * @description Retrieves the changes in the git repository.
   * @returns A promise that resolves to the status of the repository or null if no changes are found.
   */
  async getChanges(): Promise<FunctionResult<GetChangesResult>> {
    let success = false;
    let message = '';
    let data: GetChangesResult = null;

    try {
      const status = await this.getStatus();

      if (!status.data) {
        throw new Error('Failed to retrieve status or no files found');
      }

      success = true;
      message = 'Changes retrieved successfully';
      data = status.data;
    } catch (error) {
      success = false;
      message = 'Failed to get changes';

      if (error instanceof Error) {
        message = error.message;
      }
    }

    return {
      success,
      message,
      data,
    };
  }
  // #endregion - @getChanges

  // #region - @addFiles
  /**
   * @description Adds files to the staging area in the git repository.
   * @param files An array of file paths to add to the staging area.
   * @returns A promise that resolves to a FunctionResult indicating success or failure.
   */
  async addFiles(files: string[]): Promise<FunctionResult> {
    let success = false;
    let message = '';

    try {
      await this.client.add(files);

      success = true;
      message = 'Files added to staging area successfully';
    } catch (error) {
      success = false;
      message = 'Failed to add files';

      if (error instanceof Error) {
        message = error.message;
      }
    }

    return {
      success,
      message,
    };
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
  ): Promise<FunctionResult<CommitChangesResult>> {
    let success = false;
    let message = '';
    let data: CommitChangesResult = null;

    const {
      type: commitType,
      message: commitMessage,
      body: commitBody,
      scope: commitScope,
    } = options;

    try {
      const constructedMessage = this.constructCommitMessage(
        commitType,
        commitScope,
        commitMessage,
        commitBody
      );

      const commit = await this.client.commit(constructedMessage);

      if (!commit.commit) {
        throw new Error('Commit failed or no commit data returned');
      }

      success = true;
      message = 'Changes committed successfully';
      data = commit;
    } catch (error) {
      success = false;
      message = 'Failed to commit changes';

      if (error instanceof Error) {
        message = error.message;
      }
    }

    return {
      success,
      message,
      data,
    };
  }
  // #endregion - @commitChanges

  // #region - @pushChanges
  /**
   * @description Pushes the committed changes to the remote repository.
   * @returns A promise that resolves to a FunctionResult indicating success or failure.
   */
  async pushChanges(): Promise<FunctionResult> {
    let success = false;
    let message = '';

    try {
      await this.client.push();

      success = true;
      message = 'Changes pushed to remote repository successfully';
    } catch (error) {
      success = false;
      message = 'Failed to push changes';

      if (error instanceof Error) {
        message = error.message;
      }
    }

    return {
      success,
      message,
    };
  }
  // #endregion - @pushChanges

  // #region - @createTag
  /**
   * @description Creates a tag in the git repository.
   * @param tagName The name of the tag to create.
   * @param message The message associated with the tag (optional).
   * @returns A promise that resolves to a FunctionResult indicating success or failure.
   */
  async createTag(options: CreateTagOptions): Promise<FunctionResult> {
    let success = false;
    let message = '';

    const { tagName, tagMessage } = options;

    try {
      if (tagMessage) {
        await this.client.addAnnotatedTag(tagName, tagMessage);
      } else {
        await this.client.addTag(tagName);
      }

      success = true;
      message = 'Tag created successfully';
    } catch (error) {
      success = false;
      message = 'Failed to create tag';

      if (error instanceof Error) {
        message = error.message;
      }
    }

    return {
      success,
      message,
    };
  }
  // #endregion - @createTag

  // #region - @pushTags
  /**
   * @description Pushes tags to the remote repository.
   * @returns A promise that resolves to a FunctionResult indicating success or failure.
   */
  async pushTags(): Promise<FunctionResult> {
    let success = false;
    let message = '';

    try {
      await this.client.pushTags();

      success = true;
      message = 'Tags pushed to remote repository successfully';
    } catch (error) {
      success = false;
      message = 'Failed to push tags';

      if (error instanceof Error) {
        message = error.message;
      }
    }

    return {
      success,
      message,
    };
  }
  // #endregion - @pushTags

  // #region - @getChangeInfo
  /**
   * @description Returns the console color and label for a given change type.
   * @param type - The type of change (e.g., "a" for added, "m" for modified).
   * @returns {consoleColor: Formatter; label: string;} An object containing the console color and label for the change type.
   */
  getChangeInfo = (
    type: string
  ): {
    consoleColor: Formatter;
    label: string;
  } => {
    let consoleColor: Formatter;
    let label: string;

    switch (type.toLocaleLowerCase()) {
      case 'a':
        consoleColor = colors.green;
        label = 'Added';
        break;
      case 'm':
        consoleColor = colors.blue;
        label = 'Modified';
        break;
      case 'd':
        consoleColor = colors.red;
        label = 'Deleted';
        break;
      case 'r':
        consoleColor = colors.yellow;
        label = 'Renamed';
        break;
      case '?':
        consoleColor = colors.cyan;
        label = 'Untracked';
        break;
      default:
        consoleColor = colors.white;
        label = 'Unknown';
    }

    return { consoleColor, label };
  };
  // #endregion - @getChangeInfo

  // #region - @constructCommitMessage
  /**
   * @description Constructs a commit message based on the provided type, scope, message, and body.
   * @param type The type of change (e.g., "feat", "fix").
   * @param scope The scope of the change (optional).
   * @param message The short description of the change (optional).
   * @param body The detailed description of the change (optional).
   * @returns {string} The constructed commit message.
   */
  private constructCommitMessage = (
    type: string,
    scope?: string,
    message?: string,
    body?: string
  ): string => {
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
