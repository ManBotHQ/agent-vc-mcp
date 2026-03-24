#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { FossilScm } from "./fossil.js";
import { WorkspaceManager } from "./workspace.js";
import { AGENT_VC_ROOT } from "./utils.js";

const TOOLS: Tool[] = [
  // VC TOOLS
  {
    name: "vc_init_project",
    description: "Initializes a new project folder inside the workspace.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Project/folder name." },
      },
      required: ["name"],
    },
  },
  {
    name: "vc_commit",
    description: "Commits current changes across the entire workspace to Fossil.",
    inputSchema: {
      type: "object",
      properties: {
        message: { type: "string", description: "Commit message." },
      },
      required: ["message"],
    },
  },
  {
    name: "vc_status",
    description: "Returns the current Fossil workspace status.",
    inputSchema: { type: "object", properties: {} },
  },
  {
      name: "vc_diff",
      description: "Returns the diff of current changes in the workspace.",
      inputSchema: { type: "object", properties: {} },
  },
  // FILE TOOLS
  {
    name: "read_file",
    description: "Read a file from within a project's workspace.",
    inputSchema: {
      type: "object",
      properties: {
        project: { type: "string", description: "The project folder." },
        subPath: { type: "string", description: "The relative path to the file." },
      },
      required: ["project", "subPath"],
    },
  },
  {
    name: "write_file",
    description: "Write content to a file in a project's workspace. Automatically adds to Fossil tracking.",
    inputSchema: {
      type: "object",
      properties: {
        project: { type: "string", description: "The project folder." },
        subPath: { type: "string", description: "The relative path to write the file to." },
        content: { type: "string", description: "The file content." },
      },
      required: ["project", "subPath", "content"],
    },
  },
  {
    name: "list_files",
    description: "Lists all files in a specific project's workspace.",
    inputSchema: {
      type: "object",
      properties: {
        project: { type: "string", description: "The project folder to list files for." },
      },
      required: ["project"],
    },
  },
  // TASK MANAGEMENT
  {
    name: "task_create",
    description: "Creates a new Fossil ticket (task).",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Task title." },
        description: { type: "string", description: "Task description/comment." },
      },
      required: ["title", "description"],
    },
  },
  {
    name: "task_update",
    description: "Update a Fossil ticket (task).",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "The ticket id (SHA-1 hash or prefix)." },
        status: { type: "string", enum: ["Open", "Closed", "Verified", "Review"], description: "The new status." },
        comment: { type: "string", description: "Additional comment or reason." },
      },
      required: ["id", "status"],
    },
  },
  {
    name: "task_list",
    description: "Lists existing Fossil tickets.",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", description: "Filter by status (optional)." },
      },
    },
  },
];

async function main() {
  console.error(`Starting Agent-VC MCP server at ${AGENT_VC_ROOT}`);
  
  // 1. Bootstrap SCM & Workspace
  try {
    await FossilScm.bootstrap();
  } catch (err) {
    console.error(`Bootstrap ERROR: ${err}`);
    process.exit(1);
  }

  // 2. Setup MCP server
  const server = new Server(
    { name: "agent-vc", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS,
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    console.error(`Executing tool ${name}...`);

    try {
      switch (name) {
        case "vc_init_project": {
          const res = await WorkspaceManager.initProject(args?.name as string);
          return { content: [{ type: "text", text: res }] };
        }
        case "vc_commit": {
          const res = await FossilScm.commit(args?.message as string);
          return { content: [{ type: "text", text: res }] };
        }
        case "vc_status": {
          const res = await FossilScm.status();
          return { content: [{ type: "text", text: res }] };
        }
        case "vc_diff": {
          const res = await FossilScm.diff();
          return { content: [{ type: "text", text: res }] };
        }
        case "read_file": {
          const res = await WorkspaceManager.readFile(args?.project as string, args?.subPath as string);
          return { content: [{ type: "text", text: res }] };
        }
        case "write_file": {
          const res = await WorkspaceManager.writeFile(args?.project as string, args?.subPath as string, args?.content as string);
          // Auto add to fossil
          const projectSubPath = `${args?.project}/${args?.subPath}`;
          await FossilScm.add(projectSubPath);
          return { content: [{ type: "text", text: res }] };
        }
        case "list_files": {
          const res = await WorkspaceManager.listFiles(args?.project as string);
          return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
        }
        case "task_create": {
          const res = await FossilScm.createTicket(args?.title as string, args?.description as string);
          return { content: [{ type: "text", text: res }] };
        }
        case "task_update": {
          const res = await FossilScm.updateTicket(args?.id as string, args?.status as string, args?.comment as string || "");
          return { content: [{ type: "text", text: res }] };
        }
        case "task_list": {
          const res = await FossilScm.listTickets(args?.status as string);
          return { content: [{ type: "text", text: res }] };
        }
        default:
          throw new Error(`Tool ${name} not found`);
      }
    } catch (error: any) {
      console.error(`Tool error: ${error.message}`);
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Agent-VC MCP Server connected.");
}

main().catch(console.error);
