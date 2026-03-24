# Agent-VC MCP Server

A specialized MCP server for AI agents to have persistent state, version control, and task management using [Fossil SCM](https://www.fossil-scm.org/).

## Why Agent-VC?

- **Persistent State**: Agents can store files in a structured, versioned workspace.
- **Reproducibility**: Full history of every commit, allowing rollbacks to any state.
- **Task Management**: Built-in tickets/tasks (via Fossil's ticket system) to track progress without external dependencies.
- **Sandboxed**: Operations are strictly limited to `~/.agent-vc/workspace/`.

## Structure

- `~/.agent-vc/`: Root directory for agent data.
- `~/.agent-vc/version_control.fossil`: The single-file SQLite database containing the entire project history.
- `~/.agent-vc/workspace/`: The open checkout where the agent reads and writes files.

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
      "args": ["agent-vc-mcp"]
    }
  }
}
```

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
// Create a task
{
  "name": "task_create",
  "arguments": {
    "title": "Add streaming support",
    "description": "Implement chunked response parsing."
  }
}

// List open tasks
{
  "name": "task_list",
  "arguments": { "status": "Open" }
}
```

### 🔍 Inspecting Progress
```json
// Check modified files
{ "name": "vc_status", "arguments": {} }

// View code diff
{ "name": "vc_diff", "arguments": {} }
```
