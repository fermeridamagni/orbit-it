/**
 * @file src/lib/git-client.ts
 * @description Class to manage git operations and repository information
 */

import { OrbitItError } from '@utils/errors';
import colors from 'picocolors';
import type { Formatter } from 'picocolors/types';
import simpleGit, { type SimpleGit } from 'simple-git';
import type { FunctionResult } from '@/types/functions';
import type {
  CommitChangesOptions,
  CommitChangesResult,
  ConstructCommitMessageOptions,
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

export class GitClient {
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
    let error: OrbitItError | undefined;
    let data: IsRepoResult | undefined;

    try {
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

      data = true;
    } catch (foundError) {
      if (foundError instanceof OrbitItError) {
        error = foundError;
      } else if (foundError instanceof Error) {
        error = new OrbitItError({
          message: foundError.message,
          content: [
            {
              message:
                'Failed to check if current directory is a git repository.',
            },
          ],
        });
      }
    }

    return {
      error,
      data,
    };
  }
  // #endregion - @isRepo

  // #region - @getCurrentBranch
  /**
   * @description Retrieves the current branch name of the git repository.
   * @returns A promise that resolves to the current branch name.
   */
  async getCurrentBranch(): Promise<FunctionResult<CurrentBranchResult>> {
    let error: OrbitItError | undefined;
    let data: CurrentBranchResult | undefined;

    try {
      const branchSummary = await this.client.branch();

      data = branchSummary.current;
    } catch (foundError) {
      if (foundError instanceof OrbitItError) {
        error = foundError;
      } else if (foundError instanceof Error) {
        error = new OrbitItError({
          message: foundError.message,
          content: [{ message: 'Failed to get current branch.' }],
        });
      }
    }

    return {
      error,
      data,
    };
  }
  // #endregion - @getCurrentBranch

  // #region - @getRemoteUrl
  /**
   * @description Retrieves the remote URL of the git repository.
   * @returns A promise that resolves to the remote URL or null if not found.
   */
  async getRemoteUrl(): Promise<FunctionResult<GetRemoteUrlResult>> {
    let error: OrbitItError | undefined;
    let data: GetRemoteUrlResult | undefined;

    try {
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

      data = remotes[0].refs.fetch; // Return the fetch URL of the first remote
    } catch (foundError) {
      if (foundError instanceof OrbitItError) {
        error = foundError;
      } else if (foundError instanceof Error) {
        error = new OrbitItError({
          message: foundError.message,
          content: [{ message: 'Failed to get remote URL.' }],
        });
      }
    }

    return {
      error,
      data,
    };
  }
  // #endregion - @getRemoteUrl

  // #region - @getStatus
  /**
   * @description Retrieves the status of the git repository, including staged, unstaged, and untracked files.
   * @returns A promise that resolves to the status of the repository.
   */
  async getStatus(): Promise<FunctionResult<GetStatusResult>> {
    let error: OrbitItError | undefined;
    let data: GetStatusResult | undefined;

    try {
      const status = await this.client.status();

      data = status;
    } catch (foundError) {
      if (foundError instanceof OrbitItError) {
        error = foundError;
      } else if (foundError instanceof Error) {
        error = new OrbitItError({
          message: foundError.message,
          content: [{ message: 'Failed to get repository status.' }],
        });
      }
    }

    return {
      error,
      data,
    };
  }
  // #endregion - @getStatus

  // #region - @getCommits
  /**
   * @description Retrieves the commit history of the git repository.
   * @returns A promise that resolves to an array of commits or null if no commits are found.
   */
  async getCommits(): Promise<FunctionResult<GetCommitsResult>> {
    let error: OrbitItError | undefined;
    let data: GetCommitsResult | undefined;

    try {
      const log = await this.client.log();

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

      data = log.all.map((commit) => ({
        ...commit,
        message: commit.message,
      }));
    } catch (foundError) {
      if (foundError instanceof OrbitItError) {
        error = foundError;
      } else if (foundError instanceof Error) {
        error = new OrbitItError({
          message: foundError.message,
          content: [{ message: 'Failed to get commits.' }],
        });
      }
    }

    return {
      error,
      data,
    };
  }
  // #endregion - @getCommits

  // #region - @getOwnerAndRepo
  /**
   * @description Retrieves the owner and repository name from the remote URL.
   * @returns A promise that resolves to an object containing the owner and repository name or null if not found.
   */
  async getOwnerAndRepo(): Promise<FunctionResult<GetOwnerAndRepoResult>> {
    let error: OrbitItError | undefined;
    let data: GetOwnerAndRepoResult | undefined;

    try {
      const remoteUrl = await this.getRemoteUrl();

      if (remoteUrl.error || !remoteUrl.data) {
        throw new OrbitItError({
          message: remoteUrl.error?.message || 'Failed to get remote URL',
          content: remoteUrl.error?.content || [
            { message: 'Unable to retrieve remote URL.' },
          ],
        });
      }

      const match = remoteUrl.data.match(remoteUrlRegex);

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

      data = {
        owner: match[1],
        repo: match[2].replace(removeGitFromUrlRegex, ''), // Remove .git if present
      };
    } catch (foundError) {
      if (foundError instanceof OrbitItError) {
        error = foundError;
      } else if (foundError instanceof Error) {
        error = new OrbitItError({
          message: foundError.message,
          content: [{ message: 'Failed to get owner and repository name.' }],
        });
      }
    }

    return {
      error,
      data,
    };
  }
  // #endregion - @getOwnerAndRepo

  // #region - @hasChanges
  /**
   * @description Checks if there are any changes in the git repository.
   * @returns A promise that resolves to a boolean indicating if there are changes.
   */
  async hasChanges(): Promise<FunctionResult<HasChangesResult>> {
    let error: OrbitItError | undefined;
    let data: HasChangesResult | undefined;

    try {
      const status = await this.getStatus();

      if (status.error || !status.data) {
        throw new OrbitItError({
          message: status.error?.message || 'Failed to retrieve status',
          content: status.error?.content || [
            { message: 'Unable to retrieve repository status.' },
          ],
        });
      }

      const hasChanges: boolean =
        status.data.files.length > 0 || status.data.not_added.length > 0;

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

      data = true;
    } catch (foundError) {
      if (foundError instanceof OrbitItError) {
        error = foundError;
      } else if (foundError instanceof Error) {
        error = new OrbitItError({
          message: foundError.message,
          content: [{ message: 'Failed to check for changes.' }],
        });
      }
    }

    return {
      error,
      data,
    };
  }
  // #endregion - @hasChanges

  // #region - @getChanges
  /**
   * @description Retrieves the changes in the git repository.
   * @returns A promise that resolves to the status of the repository or null if no changes are found.
   */
  async getChanges(): Promise<FunctionResult<GetChangesResult>> {
    let error: OrbitItError | undefined;
    let data: GetChangesResult | undefined;

    try {
      const status = await this.getStatus();

      if (status.error || !status.data) {
        throw new OrbitItError({
          message: status.error?.message || 'Failed to retrieve status',
          content: status.error?.content || [
            { message: 'Unable to retrieve repository status.' },
          ],
        });
      }

      data = status.data;
    } catch (foundError) {
      if (foundError instanceof OrbitItError) {
        error = foundError;
      } else if (foundError instanceof Error) {
        error = new OrbitItError({
          message: foundError.message,
          content: [{ message: 'Failed to get changes.' }],
        });
      }
    }

    return {
      error,
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
    let error: OrbitItError | undefined;

    try {
      await this.client.add(files);
    } catch (foundError) {
      if (foundError instanceof OrbitItError) {
        error = foundError;
      } else if (foundError instanceof Error) {
        error = new OrbitItError({
          message: foundError.message,
          content: [{ message: 'Failed to add files to staging area.' }],
        });
      }
    }

    return {
      error,
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
    let error: OrbitItError | undefined;
    let data: CommitChangesResult | undefined;

    const {
      type: commitType,
      message: commitMessage,
      body: commitBody,
      scope: commitScope,
    } = options;

    try {
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

      data = commit;
    } catch (foundError) {
      if (foundError instanceof OrbitItError) {
        error = foundError;
      } else if (foundError instanceof Error) {
        error = new OrbitItError({
          message: foundError.message,
          content: [{ message: 'Failed to commit changes.' }],
        });
      }
    }

    return {
      error,
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
    let error: OrbitItError | undefined;

    try {
      await this.client.push();
    } catch (foundError) {
      if (foundError instanceof OrbitItError) {
        error = foundError;
      } else if (foundError instanceof Error) {
        error = new OrbitItError({
          message: foundError.message,
          content: [
            { message: 'Failed to push changes to remote repository.' },
          ],
        });
      }
    }

    return {
      error,
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
    let error: OrbitItError | undefined;

    const { tagName, tagMessage } = options;

    try {
      if (tagMessage) {
        await this.client.addAnnotatedTag(tagName, tagMessage);
      } else {
        await this.client.addTag(tagName);
      }
    } catch (foundError) {
      if (foundError instanceof OrbitItError) {
        error = foundError;
      } else if (foundError instanceof Error) {
        error = new OrbitItError({
          message: foundError.message,
          content: [{ message: 'Failed to create tag.' }],
        });
      }
    }

    return {
      error,
    };
  }
  // #endregion - @createTag

  // #region - @pushTags
  /**
   * @description Pushes tags to the remote repository.
   * @returns A promise that resolves to a FunctionResult indicating success or failure.
   */
  async pushTags(): Promise<FunctionResult> {
    let error: OrbitItError | undefined;

    try {
      await this.client.pushTags();
    } catch (foundError) {
      if (foundError instanceof OrbitItError) {
        error = foundError;
      } else if (foundError instanceof Error) {
        error = new OrbitItError({
          message: foundError.message,
          content: [{ message: 'Failed to push tags to remote repository.' }],
        });
      }
    }

    return {
      error,
    };
  }
  // #endregion - @pushTags

  // #region - @getChangeType
  /**
   * @description Returns the console color and label for a given change type.
   * @param type - The type of change (e.g., "a" for added, "m" for modified).
   * @returns {consoleColor: Formatter; label: string;} An object containing the console color and label for the change type.
   */
  getChangeType = (
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
  // #endregion - @getChangeType

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
