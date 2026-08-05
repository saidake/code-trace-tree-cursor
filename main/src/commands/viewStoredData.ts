/*
 * Copyright (C) 2025-2026 Code Trace Tree Contributors
 *
 * SPDX-License-Identifier: MIT
 */
import * as vscode from 'vscode'
import { TracePointService } from '../TracePointService'
import { runMultiProfileImportFlow, runSingleProfileImportFlow } from './importTracePointFlows'

function formatUpdatedAt(ms: number): string {
  if (!ms) return 'unknown date'
  try {
    return new Date(ms).toLocaleString()
  } catch {
    return String(ms)
  }
}

export function registerViewStoredData(
  context: vscode.ExtensionContext,
  service: TracePointService,
  onStorageBound: () => void
) {
  context.subscriptions.push(
    vscode.commands.registerCommand('codeTraceTree.viewStoredData', async () => {
      const summaries = service.listStoredGlobalSummaries()
      if (summaries.length === 0) {
        vscode.window.showInformationMessage('No stored Code Trace Tree data with trace points found.')
        return
      }

      const picked = await vscode.window.showQuickPick(
        summaries.map((s) => ({
          label: s.storedPath || '(no path)',
          description: `Updated ${formatUpdatedAt(s.updatedAt)}`,
          summary: s
        })),
        {
          title: 'Stored Code Trace Tree Data',
          placeHolder: 'Select global storage to import and bind to this workspace'
        }
      )
      if (!picked) return

      try {
        const applied = await service.importAndBindFromStoredFile(picked.summary.storageFile, {
          runSingleProfileImportFlow,
          runMultiProfileImportFlow
        })
        if (applied) {
          onStorageBound()
        }
      } catch (e) {
        vscode.window.showErrorMessage(`Failed to import stored data: ${e}`)
      }
    })
  )
}
