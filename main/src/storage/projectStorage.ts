/*
 * Copyright (C) 2025-2026 Code Trace Tree Contributors
 *
 * SPDX-License-Identifier: MIT
 */
import * as fs from 'fs'
import * as path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { DEFAULT_PROFILE_NAME, PROJECT_DOCUMENT_VERSION } from '../domain/constants'
import { ProjectDocument, TraceProfile } from '../domain/types'
import { resolveAppDir } from './globalStoragePaths'
import {
  parseProjectFile,
  writeProjectDocumentAtomic
} from './projectDataXml'

export interface StoredDocumentSummary {
  storageFile: string
  storedPath: string
  updatedAt: number
  projectId: string
}

/**
 * Resolves and persists global XML project storage bound by workspace path.
 *
 * Global file naming for new projects: `<FolderName>.xml` (or `FolderName1.xml`, …).
 * Existing UUID-named and folder-named files are found by scanning XML content.
 *
 * Resolution on project open:
 * - Case B: match by path → bind in place (latest updatedAt when multiple)
 * - Case C: no match → return undefined (lazy)
 *
 * Call {@link ensureCreated} before the first persist that should bind storage
 * (create trace point, add profile, import, or toolbar toggle).
 */
export class ProjectStorage {
  private boundFile: string | undefined
  private boundProjectId: string | undefined
  private readonly projectBase: string

  constructor(projectBasePath: string) {
    this.projectBase = path.resolve(projectBasePath)
  }

  getBoundStorageFile(): string | undefined {
    return this.boundFile
  }

  getBoundProjectId(): string | undefined {
    return this.boundProjectId
  }

  /** Re-read the bound XML without rebinding project id. */
  reloadBoundDocument(): ProjectDocument | undefined {
    const file = this.boundFile
    if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) return undefined
    try {
      const doc = parseProjectFile(file)
      const rebound: ProjectDocument = { ...doc, storageFile: file }
      this.bind(rebound)
      return rebound
    } catch {
      return undefined
    }
  }

  /**
   * Resolve existing storage (Case B). Returns undefined when nothing exists yet
   * (lazy Case C — no disk writes).
   */
  resolveAndLoad(): ProjectDocument | undefined {
    fs.mkdirSync(resolveAppDir(), { recursive: true })

    const matches = this.findDocumentsByPath(this.projectBase)
    if (matches.length === 0) return undefined

    const best =
      matches.length === 1
        ? matches[0]
        : matches.reduce((a, b) => (a.updatedAt >= b.updatedAt ? a : b))

    const updated: ProjectDocument = {
      ...best,
      path: this.projectBase,
      updatedAt: Date.now(),
      storageFile: best.storageFile
    }
    this.bind(updated)
    this.saveDocument(updated)
    return updated
  }

  /**
   * Bind storage for a new project (Case C) if not already bound.
   * Allocates a folder-named global XML path; the first {@link save} writes from memory.
   * @returns true when this call newly bound storage
   */
  ensureCreated(): boolean {
    if (this.boundFile && this.boundProjectId) return false

    fs.mkdirSync(resolveAppDir(), { recursive: true })
    if (this.resolveAndLoad()) return true

    const newId = uuidv4()
    const newFile = this.allocateFolderNamedStorageFile()
    this.boundProjectId = newId
    this.boundFile = newFile
    return true
  }

  /** Scan global XML files for a matching {@link projectId}; no migrate/rename. */
  findDocumentByProjectId(projectId: string): ProjectDocument | undefined {
    for (const file of this.listProjectXmlFiles()) {
      try {
        const doc = parseProjectFile(file)
        if (doc.projectId === projectId) {
          return { ...doc, storageFile: file }
        }
      } catch {
        // Skip unreadable storage files
      }
    }
    return undefined
  }

  /**
   * Bind when a storage-ready signal's projectId matches XML whose path equals the workspace.
   */
  tryBindFromSignal(signalProjectId: string): ProjectDocument | undefined {
    const doc = this.findDocumentByProjectId(signalProjectId)
    if (!doc?.storageFile) return undefined
    if (this.normalizePath(doc.path) !== this.normalizePath(this.projectBase)) return undefined

    const updated: ProjectDocument = {
      ...doc,
      path: this.projectBase,
      updatedAt: Date.now(),
      storageFile: doc.storageFile
    }
    this.bind(updated)
    this.saveDocument(updated)
    return updated
  }

  /** Summaries for global XMLs that contain at least one trace point (any profile). */
  listStoredSummaries(): StoredDocumentSummary[] {
    const summaries: StoredDocumentSummary[] = []
    for (const file of this.listProjectXmlFiles()) {
      try {
        const doc = parseProjectFile(file)
        if (!documentHasTracePoints(doc)) continue
        summaries.push({
          storageFile: file,
          storedPath: doc.path,
          updatedAt: doc.updatedAt,
          projectId: doc.projectId
        })
      } catch {
        // Skip unreadable storage files
      }
    }
    summaries.sort((a, b) => b.updatedAt - a.updatedAt)
    return summaries
  }

  /** Parse a global XML without binding. */
  loadDocumentFromFile(storageFile: string): ProjectDocument {
    return parseProjectFile(storageFile)
  }

  /** Point working storage at an existing global XML without writing yet. */
  adoptBinding(storageFile: string, projectId: string): void {
    this.boundFile = storageFile
    this.boundProjectId = projectId
  }

  /** Bind an existing global XML to this workspace and refresh path / updatedAt. */
  bindStorageFile(storageFile: string): ProjectDocument {
    const doc = parseProjectFile(storageFile)
    const updated: ProjectDocument = {
      ...doc,
      path: this.projectBase,
      updatedAt: Date.now(),
      storageFile
    }
    this.bind(updated)
    this.saveDocument(updated)
    return updated
  }

  save(
    profiles: TraceProfile[],
    activeProfileName: string,
    descriptionAreaOpened: boolean,
    highlightingEnabled: boolean,
    namePromptEnabled: boolean
  ): void {
    const file = this.boundFile
    const projectId = this.boundProjectId
    if (!file || !projectId) return

    const doc: ProjectDocument = {
      version: PROJECT_DOCUMENT_VERSION,
      projectId,
      path: this.projectBase,
      updatedAt: Date.now(),
      profiles: profiles.map((p) => ({
        name: p.name || DEFAULT_PROFILE_NAME,
        tracePointNodes: p.tracePointNodes,
        expandedTracePointIds: [...p.expandedTracePointIds]
      })),
      activeProfileName,
      descriptionAreaOpened,
      highlightingEnabled,
      namePromptEnabled,
      storageFile: file
    }
    this.saveDocument(doc)
  }

  private saveDocument(doc: ProjectDocument): void {
    const file = doc.storageFile || this.boundFile
    if (!file) return
    writeProjectDocumentAtomic(doc, file)
    this.bind({ ...doc, storageFile: file })
  }

  private bind(doc: ProjectDocument): void {
    this.boundFile = doc.storageFile
    this.boundProjectId = doc.projectId
  }

  private allocateFolderNamedStorageFile(): string {
    const dir = resolveAppDir()
    fs.mkdirSync(dir, { recursive: true })
    const base = this.sanitizeFolderBaseName()
    let candidate = path.join(dir, `${base}.xml`)
    if (!fs.existsSync(candidate)) return candidate
    let i = 1
    while (fs.existsSync(path.join(dir, `${base}${i}.xml`))) i++
    return path.join(dir, `${base}${i}.xml`)
  }

  private sanitizeFolderBaseName(): string {
    const raw = path.basename(this.projectBase)
    const sanitized = raw.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_').trim()
    if (!sanitized || sanitized === '.' || sanitized === '..') return 'project'
    return sanitized
  }

  private listProjectXmlFiles(): string[] {
    const dir = resolveAppDir()
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return []
    return fs
      .readdirSync(dir)
      .filter((name) => name.endsWith('.xml') && !name.endsWith('.tmp'))
      .map((name) => path.join(dir, name))
      .filter((file) => fs.statSync(file).isFile())
  }

  private findDocumentsByPath(absolutePath: string): ProjectDocument[] {
    const normalized = this.normalizePath(absolutePath)
    const matches: ProjectDocument[] = []
    for (const file of this.listProjectXmlFiles()) {
      try {
        const doc = parseProjectFile(file)
        if (this.normalizePath(doc.path) === normalized) {
          matches.push({ ...doc, storageFile: file })
        }
      } catch {
        // Skip unreadable storage files
      }
    }
    return matches
  }

  private normalizePath(p: string): string {
    if (!p) return ''
    try {
      const normalized = path.resolve(p)
      return process.platform === 'win32' ? normalized.toLowerCase() : normalized
    } catch {
      return process.platform === 'win32' ? p.toLowerCase() : p
    }
  }
}

function documentHasTracePoints(doc: ProjectDocument): boolean {
  return doc.profiles.some((profile) => profile.tracePointNodes.length > 0)
}
