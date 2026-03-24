import path from 'path';
import os from 'os';
import { spawn } from 'child_process';

export const AGENT_VC_ROOT = path.join(os.homedir(), '.agent-vc');
export const FOSSIL_DB_PATH = path.join(AGENT_VC_ROOT, 'version_control.fossil');
export const WORKSPACE_ROOT = path.join(AGENT_VC_ROOT, 'workspace');

export function resolveSafePath(project: string, subPath?: string): string {
  const projectPath = path.join(WORKSPACE_ROOT, project);
  if (subPath) {
    const fullPath = path.join(projectPath, subPath);
    if (!fullPath.startsWith(projectPath)) {
      throw new Error(`Security Exception: Path ${subPath} is outside project ${project}`);
    }
    return fullPath;
  }
  return projectPath;
}

export interface ExecResult {
  stdout: string;
  stderr: string;
  code: number | null;
}

export async function runCommand(cmd: string, args: string[], cwd: string = AGENT_VC_ROOT): Promise<ExecResult> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd, shell: true });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      resolve({ stdout, stderr, code });
    });
  });
}
