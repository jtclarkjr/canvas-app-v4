function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function getNextWorkflowTitle(
  baseTitle: string,
  existingTitles: Iterable<string>
) {
  const base = baseTitle.trim() || 'Workflow'
  const occupied = new Set<number>()
  const exactTitle = base.toLocaleLowerCase()
  const numberedTitle = new RegExp(`^${escapeRegExp(base)}\\s+(\\d+)$`, 'i')

  for (const title of existingTitles) {
    const normalized = title.trim()
    if (normalized.toLocaleLowerCase() === exactTitle) {
      occupied.add(1)
      continue
    }

    const match = numberedTitle.exec(normalized)
    if (!match) continue

    const suffix = Number.parseInt(match[1], 10)
    if (Number.isSafeInteger(suffix) && suffix > 0) {
      occupied.add(suffix)
    }
  }

  let next = 1
  while (occupied.has(next)) {
    next += 1
  }

  return `${base} ${next}`
}

if (import.meta.vitest) {
  const { describe, expect, it } = import.meta.vitest

  describe('getNextWorkflowTitle', () => {
    it('starts numbered titles at one', () => {
      expect(getNextWorkflowTitle('Workflow', [])).toBe('Workflow 1')
    })

    it('treats an exact base title as the first numbered title', () => {
      expect(getNextWorkflowTitle('Workflow', ['Workflow'])).toBe('Workflow 2')
    })

    it('fills the first available numbering gap', () => {
      expect(
        getNextWorkflowTitle('Workflow', ['Workflow 1', 'Workflow 3'])
      ).toBe('Workflow 2')
    })

    it('numbers different workflow types independently', () => {
      expect(getNextWorkflowTitle('Database', ['Workflow', 'Workflow 1'])).toBe(
        'Database 1'
      )
    })

    it('matches existing titles after trim and case normalization', () => {
      expect(
        getNextWorkflowTitle('Workflow', [' workflow ', 'WORKFLOW 2'])
      ).toBe('Workflow 3')
    })
  })
}
