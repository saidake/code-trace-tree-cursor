/*
 * Copyright (C) 2025-2026 Code Trace Tree Contributors
 *
 * SPDX-License-Identifier: MIT
 */
import * as vscode from 'vscode'
import { TracePointService } from '../TracePointService'
import { isParsedSingle, parseExportXml } from '../utils/traceProfileXml'
import { runMultiProfileImportFlow, runSingleProfileImportFlow } from './importTracePointFlows'

/**
 * Import single-profile (`<traceProfile>`) or multi-profile (`<traceProfiles>`) files.
 * Always asks how to apply the data — never auto-overwrites.
 */
export function registerImportTracePoints(
  context: vscode.ExtensionContext,
  service: TracePointService
) {
  context.subscriptions.push(
    vscode.commands.registerCommand('codeTraceTree.importTracePoints', async () => {
      const uri = await vscode.window.showOpenDialog({
        canSelectMany: false,
        filters: { XML: ['xml'] },
        openLabel: 'Import'
      })
      if (!uri?.[0]) return

      const projectPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || ''
      try {
        const data = await vscode.workspace.fs.readFile(uri[0])
        const xml = new TextDecoder().decode(data)
        const parsed = parseExportXml(xml, projectPath)

        if (isParsedSingle(parsed)) {
          await runSingleProfileImportFlow(
            service,
            parsed.profileName,
            parsed.nodes,
            parsed.expandedIds
          )
        } else {
          await runMultiProfileImportFlow(
            service,
            parsed.activeProfileName,
            parsed.profiles
          )
        }
      } catch (e) {
        vscode.window.showErrorMessage(`Failed to import: ${e}`)
      }
    })
  )
}
