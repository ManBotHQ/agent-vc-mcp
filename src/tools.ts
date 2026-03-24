import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const TOOLS: Tool[] = [
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
