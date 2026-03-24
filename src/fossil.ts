import fs from 'fs/promises';
import path from 'path';
import { runCommand, FOSSIL_DB_PATH, WORKSPACE_ROOT, AGENT_VC_ROOT } from './utils.js';

export class FossilScm {
  static async exists(): Promise<boolean> {
    try {
      await fs.access(FOSSIL_DB_PATH);
      return true;
    } catch {
      return false;
    }
  }

  static async bootstrap(): Promise<void> {
    // 1. Create root directory
    await fs.mkdir(AGENT_VC_ROOT, { recursive: true });
    
    // 2. Init fossil DB if it doesn't exist
    if (!(await FossilScm.exists())) {
      console.log('Initializing Fossil Scm...');
      const initResult = await runCommand('fossil', ['init', FOSSIL_DB_PATH]);
      if (initResult.code !== 0) throw new Error(`Fossil init failed: ${initResult.stderr}`);
    }

    // 3. Setup workspace directory
    await fs.mkdir(WORKSPACE_ROOT, { recursive: true });

    // 4. Open fossil if not opened
    const openCheck = await fs.access(path.join(WORKSPACE_ROOT, '_FOSSIL_'))
      .then(() => true)
      .catch(() => false);
    
    if (!openCheck) {
      console.log('Opening Fossil repository in workspace...');
      const openResult = await runCommand('fossil', ['open', FOSSIL_DB_PATH], WORKSPACE_ROOT);
      // Fossil open sometimes fails if already open or directory not empty, but let's check for real errors
      if (openResult.code !== 0 && !openResult.stderr.includes('already open')) {
         throw new Error(`Fossil open failed: ${openResult.stderr}`);
      }
    }
  }

  static async commit(message: string, project?: string): Promise<string> {
    const args = ['commit', '-m', message];
    if (project) {
        // We could restrict commit to specific project subfolders if needed
    }
    const result = await runCommand('fossil', args, WORKSPACE_ROOT);
    if (result.code !== 0) {
        throw new Error(`Fossil commit failed: ${result.stderr || result.stdout}`);
    }
    return result.stdout;
  }

  static async status(): Promise<string> {
    const result = await runCommand('fossil', ['status'], WORKSPACE_ROOT);
    return result.stdout;
  }

  static async diff(): Promise<string> {
    const result = await runCommand('fossil', ['diff'], WORKSPACE_ROOT);
    return result.stdout;
  }

  static async add(filePath: string): Promise<string> {
    const result = await runCommand('fossil', ['add', filePath], WORKSPACE_ROOT);
    return result.stdout;
  }

  // TICKET TOOLS
  static async createTicket(title: string, description: string): Promise<string> {
    const result = await runCommand('fossil', ['ticket', 'add', 'title', title, 'comment', description], WORKSPACE_ROOT);
    if (result.code !== 0) throw new Error(`Ticket create failed: ${result.stderr || result.stdout}`);
    return result.stdout;
  }

  static async updateTicket(id: string, status: string, comment: string): Promise<string> {
    const result = await runCommand('fossil', ['ticket', 'set', id, 'status', status, 'comment', comment], WORKSPACE_ROOT);
    if (result.code !== 0) throw new Error(`Ticket update failed: ${result.stderr || result.stdout}`);
    return result.stdout;
  }

  static async listTickets(status?: string): Promise<string> {
    const args = ['ticket', 'list'];
    // By default, let's try to list title and status
    const result = await runCommand('fossil', args, WORKSPACE_ROOT);
    return result.stdout || "(Empty)";
  }
}
