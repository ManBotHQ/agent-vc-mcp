# Agent-VC MCP Server
![CI](https://github.com/ManBotHQ/agent-vc-mcp/actions/workflows/ci.yml/badge.svg)

A specialized MCP server for AI agents to have persistent state, version control, and task management using [Fossil SCM](https://www.fossil-scm.org/).

## Why Agent-VC?

- **Persistent State**: Agents can store files in a structured, versioned workspace.
- **Reproducibility**: Full history of every commit, allowing rollbacks to any state.
- **Task Management**: Built-in tickets/tasks (via Fossil's ticket system) to track progress without external dependencies.
- **Sandboxed**: Operations are strictly limited to `~/.agent-vc/workspace/`.

## Structure & File Management

### Core Directories

- `~/.agent-vc/`: The root directory for all Agent-VC data and configuration.
- `~/.agent-vc/version_control.fossil`: The Fossil repository file. This is a single SQLite database that stores your entire project history, version control objects, and task/ticket data.
- `~/.agent-vc/workspace/`: The active checkout directory. All operations performed by the agent occur within this directory. This is the only place files are read from or written to.

### File and Folder Mapping

Agent-VC uses a "Project" based organization within the shared workspace. This allows the agent to manage multiple logical projects or modules within a single version-controlled repository.

| Concept | Description | Path Example |
| :--- | :--- | :--- |
| **Workspace Root** | The base directory for all operations. | `~/.agent-vc/workspace/` |
| **Project Folder** | A subdirectory representing a specific project. | `~/.agent-vc/workspace/chatbot-v1/` |
| **Project Subpath** | A file or nested folder within a project. | `~/.agent-vc/workspace/chatbot-v1/src/utils.js` |

### Working with the MCP Tools

When using the `agent-vc` tools, you interact with files using the `project` and `subPath` parameters. This abstraction maps directly to the filesystem:

1.  **Initializing a Project**: Running `vc_init_project(name: "my-app")` creates the directory `~/.agent-vc/workspace/my-app/`.
2.  **Writing Files**: Running `write_file(project: "my-app", subPath: "main.py", content: "...")` writes to `~/.agent-vc/workspace/my-app/main.py`.
3.  **Nested Folders**: You can use forward slashes in the `subPath` to create nested structures: `write_file(project: "my-app", subPath: "docs/specs/readme.md", ...)` will automatically create the `docs/specs/` directories if they don't exist.

> [!NOTE]
> All files created using the `write_file` tool are automatically added to Fossil's tracking (`fossil add`). To record these changes permanently in history, you must call `vc_commit`.

## Installation

1. Install Fossil:
   Follow the official installation instructions on the [Fossil website](https://www.fossil-scm.org/home/doc/trunk/www/build.wiki).

2. Run via npx:
   You can run the server directly using `npx`:
   ```bash
   npx agent-vc-mcp
   ```

3. Add to your MCP Config (e.g., `claude_desktop_config.json` or equivalent agent config):

```json
{
  "mcpServers": {
    "agent-vc": {
      "command": "npx",
      "args": ["agent-vc-mcp"],
      "env": {
        "AGENT_VC_WORKSPACE": "/path/to/my/project",
        "AGENT_VC_FOSSIL_DB": "/path/to/backup.fossil"
      }
    }
  }
}
```

## Environment Variables

You can tune Agent-VC behavior by setting these environment variables:

| Variable | Description | Default |
| :--- | :--- | :--- |
| `AGENT_VC_ROOT_OVERRIDE` | The root folder for agent data. | `~/.agent-vc/` |
| `AGENT_VC_WORKSPACE` | Path to the workspace checkout. | `~/.agent-vc/workspace/` (if cwd is `/` or `.`) |
| `AGENT_VC_FOSSIL_DB` | Path to the Fossil repository file. | `~/.agent-vc/version_control.fossil` |

> [!TIP]
> Setting `AGENT_VC_WORKSPACE` is useful if you want the agent to operate directly on an existing local directory that you've already initialized with Fossil SCM.

## Tools

### Version Control
- `vc_init_project(name)`: Create a project subfolder.
- `vc_commit(message)`: Commit all changes in the workspace.
- `vc_status()`: Get current status of tracking and changes.
- `vc_diff()`: View changes in the workspace.

### File Operations (Project Scoped)
- `write_file(project, subPath, content)`: Writes a file and automatically adds it to Fossil tracking.
- `read_file(project, subPath)`: Reads a file.
- `list_files(project)`: Lists all files in a project.

### Task Management
- `task_create(title, description)`: Create a project task.
- `task_list(status?)`: List existing tasks.
- `task_update(id, status, comment?)`: Update task status.

## Usage Examples

### 🏢 Initializing a Project
Create a new project folder structure in the workspace.
```json
{
  "name": "vc_init_project",
  "arguments": { "name": "chatbot-v1" }
}
```

### 💾 Writing and Committing Files
Write code and commit it to history.
```json
// 1. Write the file
{
  "name": "write_file",
  "arguments": {
    "project": "chatbot-v1",
    "subPath": "index.js",
    "content": "console.log('Hello Agent!');"
  }
}

// 2. Commit the changes
{
  "name": "vc_commit",
  "arguments": { "message": "initial commit for chatbot" }
}
```

### 📋 Managing Tasks (Fossil Tickets)
Track work using the built-in ticket system.
```json
// 1. Create a task
{
  "name": "task_create",
  "arguments": {
    "title": "Add streaming support",
    "description": "Implement chunked response parsing."
  }
}

// 2. List open tasks (to get the Ticket ID)
{
  "name": "task_list",
  "arguments": { "status": "Open" }
}

// 3. Update a task (using the first 7-10 characters of the Ticket ID)
{
  "name": "task_update",
  "arguments": {
    "id": "8d0aa38",
    "status": "Closed",
    "comment": "Work completed and tested."
  }
}
```

### 🔍 Inspecting Progress & History
```json
// Check modified files
{ "name": "vc_status", "arguments": {} }

// View code diff
{ "name": "vc_diff", "arguments": {} }

// List all files in a project
{
  "name": "list_files",
  "arguments": { "project": "chatbot-v1" }
}

// Read a specific file
{
  "name": "read_file",
  "arguments": {
    "project": "chatbot-v1",
    "subPath": "index.js"
  }
}
```

## Further Documentation
For more advanced Fossil commands and features (like branching, merging, and syncing), refer to the official [Fossil SCM Documentation](https://www.fossil-scm.org/home/doc/trunk/www/permutedindex.html).
