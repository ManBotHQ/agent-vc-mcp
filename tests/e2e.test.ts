import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

const TEST_ROOT = path.join(os.tmpdir(), 'agent-vc-e2e-test-' + Date.now());

async function callTool(server: ChildProcess, name: string, args: any) {
  return new Promise((resolve, reject) => {
    const requestId = Math.floor(Math.random() * 1000000);
    const request = JSON.stringify({
      jsonrpc: "2.0",
      id: requestId,
      method: "tools/call",
      params: {
        name,
        arguments: args
      }
    }) + "\n";

    let capturedOutput = '';
    const onData = (data: Buffer) => {
       capturedOutput += data.toString();
       try {
         // Attempt to parse complete JSON-RPC responses (assuming one response per line for testing)
         const lines = capturedOutput.split('\n');
         for (const line of lines) {
           if (line.trim().startsWith('{')) {
             const json = JSON.parse(line);
             if (json.id === requestId) {
               server.stdout?.removeListener('data', onData);
               resolve(json.result);
               return;
             }
           }
         }
       } catch (err) {
         // Ignore partial JSON
       }
    };

    server.stdout?.on('data', onData);
    server.stdin?.write(request);
  });
}

describe('Agent-VC E2E Tests', () => {
  let server: ChildProcess;

  beforeAll(async () => {
    await fs.mkdir(TEST_ROOT, { recursive: true });
    // Build the project first
    // Note: In real scenarios, use node build/index.js
    server = spawn('node', ['--loader', 'ts-node/esm', 'src/index.ts'], {
      env: { ...process.env, AGENT_VC_ROOT_OVERRIDE: TEST_ROOT },
      stdio: ['pipe', 'pipe', 'inherit']
    });

    // Wait for bootstrap
    await new Promise(r => setTimeout(r, 2000));
  });

  afterAll(async () => {
    server.kill();
    await fs.rm(TEST_ROOT, { recursive: true, force: true });
  });

  it('should initialize a project and write a file', async () => {
    const initRes: any = await callTool(server, 'vc_init_project', { name: "test-proj" });
    expect(initRes.content[0].text).toContain('Created project folder');

    const writeRes: any = await callTool(server, 'write_file', {
      project: "test-proj",
      subPath: "hello.txt",
      content: "Hello E2E"
    });
    expect(writeRes.content[0].text).toContain('Successfully wrote file');

    const statusRes: any = await callTool(server, 'vc_status', {});
    expect(statusRes.content[0].text).toMatch(/ADDED\s+test-proj\/hello\.txt/);
  });

  it('should manage tasks', async () => {
    const createRes: any = await callTool(server, 'task_create', {
      title: "TestTask",
      description: "Testing via E2E"
    });
    // Record indicates success
    expect(createRes.content[0].text).toMatch(/ticket\s+(add\s+succeeded|added)/i);
    
    // Extract ID (first few chars)
    const ticketId = createRes.content[0].text.split(/\s+|:/).pop()?.trim().substring(0, 10);
    expect(ticketId).toBeDefined();

    // Verify updating works
    const updateRes: any = await callTool(server, 'task_update', {
      id: ticketId,
      status: "Closed",
      comment: "Closing via E2E"
    });
    expect(updateRes.content[0].text).toContain('ticket set');
  });
});
