import fs from 'fs/promises';
import path from 'path';
import { WORKSPACE_ROOT, resolveSafePath } from './utils.js';

export class WorkspaceManager {
  static async initProject(name: string): Promise<string> {
    const projectPath = path.join(WORKSPACE_ROOT, name);
    try {
      await fs.mkdir(projectPath, { recursive: true });
      return `Created project folder structure at ${projectPath}`;
    } catch (e) {
      throw new Error(`Failed to create project project: ${e?.toString()}`);
    }
  }

  static async listFiles(project: string): Promise<string[]> {
    const projectPath = resolveSafePath(project);
    try {
        const files = await fs.readdir(projectPath, { recursive: true });
        return files;
    } catch (e) {
        throw new Error(`Failed to list files in ${project}: ${e?.toString()}`);
    }
  }

  static async readFile(project: string, subPath: string): Promise<string> {
    const fullPath = resolveSafePath(project, subPath);
    try {
        return await fs.readFile(fullPath, 'utf8');
    } catch (e) {
        throw new Error(`Failed to read file ${subPath}: ${e?.toString()}`);
    }
  }

  static async writeFile(project: string, subPath: string, content: string): Promise<string> {
    const fullPath = resolveSafePath(project, subPath);
    try {
        // Ensure parent directory exists for nested files
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, content, 'utf8');
        return `Successfully wrote file to ${subPath}`;
    } catch (e) {
        throw new Error(`Failed to write file ${subPath}: ${e?.toString()}`);
    }
  }
}
