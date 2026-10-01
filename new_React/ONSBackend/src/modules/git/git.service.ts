import { promises as fs } from "fs";
import path from "path";
import { CheckRepoActions, simpleGit, type SimpleGit } from "simple-git";
import { ConflictError, NotFoundError, ValidationError } from "../../errors/AppError.js";
import { authRepository } from "../auth/auth.repository.js";
import { filesRepository } from "../files/files.repository.js";
import {
  META_FILE,
  mirrorRootFor,
  readMirrorMeta,
  syncDbToMirror,
  syncMirrorToDb,
  writeMirrorMeta,
} from "./git.mirror.service.js";

export interface GitChange {
  id: string;
  path: string;
  fileName: string;
  status: "M" | "A" | "D" | "U";
  staged: boolean;
  additions: number;
  deletions: number;
}

export interface GitCommitSummary {
  id: string;
  message: string;
  author: string;
  time: string;
  current: boolean;
}

export interface GitBranchSummary {
  name: string;
  current: boolean;
}

const BRANCH_NAME_PATTERN = /^[A-Za-z0-9._\/-]{1,120}$/;

function assertValidBranchName(name: string) {
  if (!BRANCH_NAME_PATTERN.test(name) || name.includes("..") || name.startsWith("-")) {
    throw new ValidationError("Invalid branch name");
  }
}

async function getIdentity(userId: string): Promise<{ name: string; email: string }> {
  const user = await authRepository.findById(userId);
  if (!user) throw new NotFoundError("User not found");
  return { name: user.name, email: user.email };
}

/** Runs a git command with a one-off local author identity, so multi-user commits attribute correctly. */
function withIdentity(git: SimpleGit, identity: { name: string; email: string }, args: string[]) {
  return git.raw(["-c", `user.name=${identity.name}`, "-c", `user.email=${identity.email}`, ...args]);
}

async function ensureRepo(projectId: string, identity: { name: string; email: string }): Promise<SimpleGit> {
  const mirrorRoot = await syncDbToMirror(projectId);
  const git = simpleGit(mirrorRoot);

  // Plain checkIsRepo() detects being nested inside ANY ancestor repo (this very
  // workspace's own dev repo included) — IS_REPO_ROOT confirms the mirror dir itself owns a `.git`.
  const isRepo = await git.checkIsRepo(CheckRepoActions.IS_REPO_ROOT);
  if (!isRepo) {
    await git.init();
  }

  const hasCommits = await git.log().then(() => true).catch(() => false);
  if (!hasCommits) {
    await git.add(".");
    await withIdentity(git, identity, ["commit", "-m", "Initial commit"]);
  }

  return git;
}

function relativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

async function numstatMap(git: SimpleGit, args: string[]): Promise<Map<string, { additions: number; deletions: number }>> {
  const raw = await git.diff(args).catch(() => "");
  const map = new Map<string, { additions: number; deletions: number }>();
  for (const line of raw.split("\n")) {
    const [add, del, filePath] = line.split("\t");
    if (!filePath) continue;
    map.set(filePath, { additions: Number(add) || 0, deletions: Number(del) || 0 });
  }
  return map;
}

export const gitService = {
  async getStatus(projectId: string, userId: string) {
    const identity = await getIdentity(userId);
    const git = await ensureRepo(projectId, identity);
    const status = await git.status();
    const unstagedStats = await numstatMap(git, ["--numstat"]);
    const stagedStats = await numstatMap(git, ["--cached", "--numstat"]);

    const changes: GitChange[] = [];
    for (const file of status.files) {
      if (file.path === META_FILE) continue;
      const fileName = file.path.split("/").pop() ?? file.path;

      const isUntracked = file.index === "?" && file.working_dir === "?";
      if (isUntracked) {
        changes.push({ id: file.path, path: file.path, fileName, status: "U", staged: false, additions: unstagedStats.get(file.path)?.additions ?? 0, deletions: 0 });
        continue;
      }

      if (file.index && file.index !== " " && file.index !== "?") {
        changes.push({
          id: `${file.path}#staged`,
          path: file.path,
          fileName,
          status: mapStatusChar(file.index),
          staged: true,
          additions: stagedStats.get(file.path)?.additions ?? 0,
          deletions: stagedStats.get(file.path)?.deletions ?? 0,
        });
      }

      if (file.working_dir && file.working_dir !== " " && file.working_dir !== "?") {
        changes.push({
          id: `${file.path}#unstaged`,
          path: file.path,
          fileName,
          status: mapStatusChar(file.working_dir),
          staged: false,
          additions: unstagedStats.get(file.path)?.additions ?? 0,
          deletions: unstagedStats.get(file.path)?.deletions ?? 0,
        });
      }
    }

    return { branch: status.current ?? "main", changes };
  },

  async stage(projectId: string, userId: string, paths: string[]) {
    const identity = await getIdentity(userId);
    const git = await ensureRepo(projectId, identity);
    if (paths.length === 0) return;
    await git.add(paths);
  },

  async unstage(projectId: string, userId: string, paths: string[]) {
    const identity = await getIdentity(userId);
    const git = await ensureRepo(projectId, identity);
    if (paths.length === 0) return;
    await git.raw(["restore", "--staged", "--", ...paths]);
  },

  async discardPath(projectId: string, userId: string, relPath: string) {
    const identity = await getIdentity(userId);
    const git = await ensureRepo(projectId, identity);
    const mirrorRoot = mirrorRootFor(projectId);
    const status = await git.status();
    const entry = status.files.find((file) => file.path === relPath);
    const isUntracked = entry?.index === "?" && entry?.working_dir === "?";

    if (isUntracked) {
      await fs.rm(path.join(mirrorRoot, relPath), { force: true });
    } else {
      await git.checkout(["HEAD", "--", relPath]);
      const meta = await readMirrorMeta(mirrorRoot);
      if (!meta[relPath]) {
        const headMetaRaw = await git.show([`HEAD:${META_FILE}`]).catch(() => null);
        if (headMetaRaw) {
          const headMeta = JSON.parse(headMetaRaw) as Record<string, unknown>;
          if (headMeta[relPath]) {
            meta[relPath] = headMeta[relPath] as (typeof meta)[string];
            await writeMirrorMeta(mirrorRoot, meta);
          }
        }
      }
    }

    await syncMirrorToDb(projectId);
  },

  async commit(projectId: string, userId: string, message: string) {
    const trimmed = message.trim();
    if (!trimmed) throw new ValidationError("Commit message is required");

    const identity = await getIdentity(userId);
    const git = await ensureRepo(projectId, identity);
    const mirrorRoot = mirrorRootFor(projectId);
    await git.add(META_FILE);

    const staged = await git.diff(["--cached", "--name-only"]);
    if (!staged.trim()) throw new ValidationError("No staged changes to commit");

    await withIdentity(git, identity, ["commit", "-m", trimmed]);
    void mirrorRoot;
  },

  async getLog(projectId: string, userId: string): Promise<GitCommitSummary[]> {
    const identity = await getIdentity(userId);
    const git = await ensureRepo(projectId, identity);
    const log = await git.log();
    return log.all.map((entry, index) => ({
      id: entry.hash.slice(0, 7),
      message: entry.message,
      author: entry.author_name,
      time: relativeTime(new Date(entry.date)),
      current: index === 0,
    }));
  },

  async listBranches(projectId: string, userId: string): Promise<GitBranchSummary[]> {
    const identity = await getIdentity(userId);
    const git = await ensureRepo(projectId, identity);
    const branches = await git.branchLocal();
    return branches.all.map((name) => ({ name, current: name === branches.current }));
  },

  async createBranch(projectId: string, userId: string, name: string) {
    assertValidBranchName(name);
    const identity = await getIdentity(userId);
    const git = await ensureRepo(projectId, identity);
    const existing = await git.branchLocal();
    if (existing.all.includes(name)) throw new ConflictError(`Branch "${name}" already exists`);
    await git.raw(["branch", name]);
  },

  async switchBranch(projectId: string, userId: string, name: string) {
    const identity = await getIdentity(userId);
    const git = await ensureRepo(projectId, identity);
    const status = await git.status();
    if (!status.isClean()) {
      throw new ConflictError("Commit or discard your changes before switching branches");
    }
    await git.checkout(name);
    await syncMirrorToDb(projectId);
  },

  async deleteBranch(projectId: string, userId: string, name: string, force: boolean) {
    const identity = await getIdentity(userId);
    const git = await ensureRepo(projectId, identity);
    const branches = await git.branchLocal();
    if (branches.current === name) throw new ConflictError("Cannot delete the currently checked-out branch");
    if (!branches.all.includes(name)) throw new NotFoundError(`Branch "${name}" not found`);
    await git.deleteLocalBranch(name, force);
  },

  async resetHard(projectId: string, userId: string) {
    const identity = await getIdentity(userId);
    const git = await ensureRepo(projectId, identity);
    await git.raw(["reset", "--hard", "HEAD"]);
    await syncMirrorToDb(projectId);
  },
};

function mapStatusChar(char: string): "M" | "A" | "D" | "U" {
  if (char === "A" || char === "C") return "A";
  if (char === "D") return "D";
  return "M";
}
