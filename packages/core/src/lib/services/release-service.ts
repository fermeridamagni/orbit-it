import { GitClient } from '@lib/git-client';
import { OrbitItError } from '@utils/errors';
import type { FunctionResult } from '@/types/functions';
import type { Commit, CommitType } from '@/types/git-client';

const commitMessageRegex =
  /^(feat|fix|docs|style|refactor|perf|test|chore)(\([^)]*\))?:/;

class ReleaseService {
  private gitClient: GitClient | null = null;

  // #region - @getCommitsByType
  /**
   * @description Groups commits by their conventional commit type.
   * @returns Commits grouped by type.
   */
  async groupCommitsByType(): Promise<
    FunctionResult<Record<CommitType, Commit[]>>
  > {
    let error: OrbitItError | undefined;
    let data: Record<CommitType, Commit[]> | undefined;

    try {
      if (!this.gitClient) {
        this.gitClient = new GitClient();
      }

      const commits = await this.gitClient.getCommits();

      if (commits.error || !commits.data) {
        throw new OrbitItError({
          message: commits.error?.message || 'Failed to get commits',
          content: commits.error?.content || [
            { message: 'Unable to retrieve commits.' },
          ],
        });
      }

      const grouped: Record<CommitType, Commit[]> = {
        feat: [],
        fix: [],
        docs: [],
        style: [],
        refactor: [],
        perf: [],
        test: [],
        chore: [],
        revert: [],
        other: [],
      };

      for (const commit of commits.data) {
        const commitMessage = commit.message;
        const match = commitMessage.match(commitMessageRegex);

        let type: CommitType = 'other';
        if (match) {
          type = match[1] as CommitType;
        }

        if (!grouped[type]) {
          grouped[type] = [];
        }
        grouped[type].push(commit);
      }

      data = grouped;
    } catch (foundError) {
      if (foundError instanceof OrbitItError) {
        error = foundError;
      } else if (foundError instanceof Error) {
        error = new OrbitItError({
          message: foundError.message,
          content: [{ message: 'Failed to group commits by type.' }],
        });
      }
    }

    return {
      error,
      data,
    };
  }
  // #endregion - @getCommitsByType

  // #region - @getCommitTypeLabel
  /**
   * @description Gets a human-readable label for a commit type.
   * @param type The commit type.
   * @returns The human-readable label.
   */
  getCommitTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      feat: '🚀 Features',
      fix: '🐛 Bug Fixes',
      perf: '⚡ Performance Improvements',
      refactor: '♻️ Code Refactoring',
      docs: '📚 Documentation',
      style: '💄 Styles',
      test: '🧪 Tests',
      chore: '🔧 Chores',
      other: '📝 Other Changes',
    };

    return labels[type] || '📝 Other Changes';
  }
  // #endregion - @getCommitTypeLabel
}

export default ReleaseService;
