/*
 * Copyright (C) 2025-2026 Code Trace Tree Contributors
 *
 * SPDX-License-Identifier: MIT
 */
import * as vscode from 'vscode'
import { TracePointService } from '../TracePointService'
import { TracePointNode, TraceProfile } from '../domain/types'

/** Apply a single-profile import after the user picks replace vs new profile. */
export async function runSingleProfileImportFlow(
  service: TracePointService,
  profileName: string | undefined,
  nodes: TracePointNode[],
  expandedIds: string[]
): Promise<boolean> {
  const nameHint = profileName ? ` ("${profileName}")` : ''
  const choice = await vscode.window.showQuickPick(
    [
      {
        label: 'Replace Current Profile',
        description: `Overwrite "${service.getActiveProfileName()}"`,
        value: 'replace' as const
      },
      {
        label: 'Import as New Profile',
        description: 'Keep existing profiles and add a new one',
        value: 'new' as const
      }
    ],
    {
      title: 'Import Trace Points',
      placeHolder: `This file contains a single profile${nameHint}`
    }
  )
  if (!choice) return false

  if (choice.value === 'replace') {
    await service.replaceActiveProfileTree(nodes, expandedIds)
    vscode.window.showInformationMessage(
      `Replaced profile "${service.getActiveProfileName()}".`
    )
    return true
  }

  const name = await service.importAsNewProfile(profileName || 'imported', nodes, expandedIds)
  vscode.window.showInformationMessage(`Imported as new profile "${name}".`)
  return true
}

/** Apply a multi-profile import after the user picks new / merge / replace. */
export async function runMultiProfileImportFlow(
  service: TracePointService,
  activeProfileName: string | undefined,
  profiles: TraceProfile[]
): Promise<boolean> {
  const names = profiles.map((p) => `"${p.name}"`).join(', ')
  const choice = await vscode.window.showQuickPick(
    [
      {
        label: 'Import as New Profiles',
        description: 'Add all; rename on name conflicts',
        value: 'new' as const
      },
      {
        label: 'Merge All Profiles',
        description: 'Overwrite same-named; add the rest; keep local-only',
        value: 'merge' as const
      },
      {
        label: 'Replace All Profiles',
        description: 'Discard local profiles and use the file’s profiles',
        value: 'replace' as const
      }
    ],
    {
      title: 'Import Trace Points',
      placeHolder: `This file contains ${profiles.length} profile(s): ${names}`
    }
  )
  if (!choice) return false

  if (choice.value === 'new') {
    const created = await service.importAsNewProfiles(profiles)
    vscode.window.showInformationMessage(
      `Imported ${created.length} profile(s): ${created.map((n) => `"${n}"`).join(', ')}.`
    )
    return true
  }

  if (choice.value === 'merge') {
    await service.mergeProfiles(profiles, activeProfileName)
    vscode.window.showInformationMessage(
      `Merged ${profiles.length} profile(s) into the project.`
    )
    return true
  }

  const confirm = await vscode.window.showWarningMessage(
    'This will delete all existing local profiles and replace them with the file’s profiles. Continue?',
    { modal: true },
    'Replace'
  )
  if (confirm !== 'Replace') return false

  await service.replaceAllProfiles(profiles, activeProfileName)
  vscode.window.showInformationMessage(
    `Replaced all profiles with ${profiles.length} profile(s) from the file.`
  )
  return true
}
