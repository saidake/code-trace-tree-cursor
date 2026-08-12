# Code Trace Tree
[![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/saidake/code-trace-tree-cursor?sort=semver)](https://github.com/saidake/code-trace-tree-cursor/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
![Build](https://github.com/saidake/code-trace-tree-cursor/actions/workflows/release.yml/badge.svg)

<img src="main/assets/icons/logo.png" width="100" alt="Code Trace Tree logo">

----

<!-- Plugin description -->
<p>
  Trace code in a tree structure.
  Build and display code workflows as nested trace points
  (lines, files, and directories) so you can follow the flow and jump back to source anytime.
  Double-click any trace point to navigate to its source, with support for multiple trace levels.
</p>
<p>
  Includes a <b>Cursor-only</b> Agent Skill (bundled in this Cursor plugin) so Cursor Agent can
  search, add, move, and rebind traces, and refresh the Trace Points view when you ask.
  Cursor <b>auto-loads</b> the skill when relevant — you do not install it separately.
</p>
<!-- Plugin description end -->

# Preview
![](docs/assets/preview-1-cursor.png)
![](docs/assets/preview-2-cursor.png)

<!-- Plugin description -->
<h1>How to use</h1>
<ol>
  <li>Open the <b>Code Trace Tree</b> activity bar view.</li>
  <li>Use the <b>Profile</b> webview above the tree to switch trees, add a profile, or delete one.</li>
  <li>In the editor, right-click a line in a <b>workspace file</b> and choose:
    <ul>
      <li><b>Create a Root Code Trace Point</b> — start a new line-level trace tree (selects the new node; does not jump)</li>
      <li><b>Create Code Trace Points (Under selected)</b> — add a child under the selected node(s) in the tree (parent expands; new node is selected)</li>
      <li><b>Update Selected Trace Points</b> — move the selected tree node(s) to the current line</li>
      <li><b>Go to the Trace Point in the tree panel (Only matching)</b> — selects and reveals matching node(s) for the current line; does nothing when none match</li>
    </ul>
  </li>
  <li>In the <b>Explorer</b>, right-click a file or directory <b>inside the workspace</b> and choose:
    <ul>
      <li><b>Create a Root File/Directory Trace Point</b> — add a file or directory node at the root</li>
      <li><b>Create File/Directory Trace Point (Under selected)</b> — add that file/directory under the selected tree node(s) (parent expands automatically)</li>
    </ul>
  </li>
  <li>Single-click a node to select it; double-click to jump to that location (line, file, or Explorer for folders). Double-click restores the prior expand/collapse state if the host toggled it (brief flicker possible).</li>
  <li>Right-click a node and choose <b>Copy Trace Point Text</b> to copy its display text, e.g. <code>test233 (TestControllerWebFlux.java:54)</code>.</li>
  <li>Right-click a line trace point and choose <b>Show Line Content</b> to view its saved trimmed line text.</li>
  <li>Use the view title-bar actions to expand/collapse, reorder, highlight, prompt for name on create, import/export, or edit descriptions. Drag a node onto another to reparent it (the target expands automatically).</li>
</ol>
<p>
  <b>TIPS:</b> Prefer creating line trace points on text that is <b>unique in that file</b> (or uncommon),
  not generic lines like <code>}</code> or <code>return;</code>. Empty lines are not allowed.
  The extension stores occurrence counts to re-find the line after it moves; unique content rebinds more reliably.
</p>

<h1>Install the Extension</h1>
<ol>
  <li>Download <code>code-trace-tree-1.2.8.vsix</code> from the GitHub Release.</li>
  <li>In Cursor: <b>Extensions</b> → <code>...</code> → <b>Install from VSIX…</b>
    (or Command Palette: <code>Extensions: Install from VSIX…</code>).</li>
  <li>Choose the downloaded <code>.vsix</code> file and reload if prompted.</li>
</ol>
<p>
  Shares the same global storage as the JetBrains and VS Code companions.
  The Cursor Agent Skill is <b>bundled</b> in this Cursor plugin (Cursor-only; auto-loaded).
</p>
<h1>Agent Skill (Cursor)</h1>
<p>
  The Agent Skill ships <b>inside this Cursor plugin</b>
  (<code>.cursor-plugin/plugin.json</code> + <code>skills/code-trace-tree/</code>).
  It is for <a href="https://cursor.com">Cursor</a> Agent only.
  Cursor <b>auto-loads</b> it when relevant (or via <code>/code-trace-tree</code>).
  Users do <b>not</b> install a skill zip or copy files into <code>~/.cursor/skills/</code>.
</p>
<p>
  The VSIX adds the Trace Points editor panel; the skill is already part of the Cursor plugin.
  Install the VSIX when you want the UI panel alongside agent-driven edits.
</p>
<p>The skill lets Cursor Agent:</p>
<ul>
  <li>Resolve the bound global storage XML for the project</li>
  <li>Search, add, move, and delete trace points</li>
  <li>Rebind line locations after source edits on disk</li>
  <li>Ask Cursor to reload / refresh extension data</li>
  <li>Select or navigate to nodes in the Code Trace Tree view</li>
</ul>
<p>
  The skill still instructs the agent to edit traces only when you ask.
</p>
<p>
  <b>Python required:</b> the main skill ops (<code>trace_tree</code> search / add / move / delete / rebind)
  run <code>trace_tree.py</code>, so <b>Python 3</b> must be on your <code>PATH</code>
  (<code>python3</code> or <code>python</code>).
  Resolve / refresh / select helper scripts are plain shell or batch and do not need Python.
</p>

<h2>How to use the skill</h2>
<p>
  In <b>Cursor</b>, keep the Trace Points view open for the same project: it loads the agent’s
  trace point changes in real time (no manual reload).
</p>
<p>Examples:</p>
<pre><code>Help me generate some trace point nodes related to the current topic.
</code></pre>
<pre><code>Add a root trace point at the login handler, then children for validation and token issue.
</code></pre>

<h1>Storage</h1>
<p>Trace data is stored in a shared global folder:</p>
<ul>
  <li>Windows: <code>%LOCALAPPDATA%\code-trace-tree</code></li>
  <li>macOS: <code>~/Library/Application Support/code-trace-tree</code></li>
  <li>Linux: <code>$XDG_CONFIG_HOME/code-trace-tree</code> or <code>~/.config/code-trace-tree</code></li>
</ul>
<ul>
  <li><b>Binding:</b> each workspace matches a global XML by <code>&lt;path&gt;</code> (path mode).</li>
  <li><b>New projects:</b> allocate a folder-named global XML (for example <code>MyProject.xml</code>,
    or <code>Name1.xml</code>, …) with a UUID <code>&lt;projectId&gt;</code> on first use.</li>
  <li><b>Agents (Case C):</b> create that global XML without
    <code>.idea/code-trace-tree.project.id</code> (IDE-agnostic).</li>
  <li><b>Legacy:</b> <code>&lt;projectId&gt;.xml</code> files are still resolved by scanning XML content.</li>
  <li><b>No workspace:</b> the empty panel asks you to open one
    (Profile / Description / toolbar stay hidden).</li>
  <li><b>Empty tree:</b> an empty-state webview explains how to create a root trace point
    (no nodes; only the default <code>main</code> profile or no profiles).</li>
  <li><b>Recover UI:</b> grey <b>Import stored data</b> after move/rename appears only when another
    stored global project still has a trace point. Clearing this workspace’s tree (including
    delete-all) does not keep recover UI visible for the bound file while it is empty.</li>
</ul>
<!-- Plugin description end -->

# Development

- Open the project root in Cursor (or VS Code)
- Install deps: `cd main && yarn install`
- Press **F5** to launch an Extension Development Host
- Cursor-only agent skill source: `skills/code-trace-tree/` (bundled in the Cursor plugin; auto-loaded)

## Cursor plugin (local development)

Local load for development:

```powershell
New-Item -ItemType Junction -Force `
  -Path "$env:USERPROFILE\.cursor\plugins\local\code-trace-tree" `
  -Target "C:\Users\saidake\Desktop\DevProjects\code-trace-tree-cursor"
```

Then **Developer: Reload Window**, and check **Customize → Skills** for `code-trace-tree`.

# License

This project is licensed under the [MIT License](./LICENSE).
