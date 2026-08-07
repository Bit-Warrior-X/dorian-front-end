export const splitDisplayName = (name) => {
  const trimmed = String(name || '').trim()
  if (!trimmed) {
    return { firstName: '', secondName: '' }
  }

  const spaceIndex = trimmed.indexOf(' ')
  if (spaceIndex === -1) {
    return { firstName: trimmed, secondName: '' }
  }

  return {
    firstName: trimmed.slice(0, spaceIndex).trim(),
    secondName: trimmed.slice(spaceIndex + 1).trim(),
  }
}

export const joinDisplayName = (firstName, secondName) =>
  [firstName, secondName]
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .join(' ')
