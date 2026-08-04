/*
 * Copyright (C) 2025-2026 Code Trace Tree Contributors
 *
 * SPDX-License-Identifier: MIT
 */
import * as fs from 'fs'
import * as path from 'path'
import { PROJECT_ID_FILE_NAME } from '../domain/constants'

/** Cursor IDE: `.cursor/code-trace-tree.project.id` */
export function cursorIdPath(projectBase: string): string {
  return path.join(projectBase, '.cursor', PROJECT_ID_FILE_NAME)
}

export function vscodeIdPath(projectBase: string): string {
  return path.join(projectBase, '.vscode', PROJECT_ID_FILE_NAME)
}

export function ideaIdPath(projectBase: string): string {
  return path.join(projectBase, '.idea', PROJECT_ID_FILE_NAME)
}

function readIdFile(filePath: string): string | undefined {
  try {
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return undefined
    const id = fs.readFileSync(filePath, 'utf8').trim()
    return id || undefined
  } catch {
    return undefined
  }
}

/**
 * Prefer `.cursor/code-trace-tree.project.id`; if missing, reuse `.vscode/...`
 * then `.idea/...` when present (shared with VS Code / JetBrains companions).
 */
export function readProjectId(projectBase: string): string | undefined {
  return (
    readIdFile(cursorIdPath(projectBase)) ||
    readIdFile(vscodeIdPath(projectBase)) ||
    readIdFile(ideaIdPath(projectBase))
  )
}

/** Write the project id only to `.cursor/` (current IDE). */
export function writeProjectId(projectBase: string, projectId: string): void {
  const filePath = cursorIdPath(projectBase)
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, projectId.trim() + '\n', 'utf8')
}
