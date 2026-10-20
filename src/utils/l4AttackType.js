const attackTokens = (value) =>
  String(value || '')
    .toUpperCase()
    .split(/[^A-Z0-9]+/)
    .filter(Boolean)

export const l4AttackKind = (value) => {
  const tokens = new Set(attackTokens(value))
  if (tokens.has('CONNECTION') && tokens.has('LIMIT')) return 'conn-limit'
  if (tokens.has('HANDSHAKE')) return 'handshake'
  if (tokens.has('STOMP') || tokens.has('PSH')) return 'stomp'
  if (tokens.has('SOCKET') || tokens.has('XMAS') || tokens.has('NULL') || tokens.has('FIN')) return 'socket'
  if (tokens.has('SYN')) return 'syn'
  if (tokens.has('RST')) return 'rst'
  if (tokens.has('ACK')) return 'ack'
  if (tokens.has('FRAG')) return 'frag'
  if (tokens.has('UDP')) return 'udp'
  if (tokens.has('ICMP')) return 'icmp'
  if (tokens.has('GRE')) return 'gre'
  return 'other'
}

const KIND_LABELS = {
  'conn-limit': 'Connection limit',
  handshake: 'Handshake flood',
  stomp: 'STOMP flood',
  socket: 'Socket flood',
  syn: 'SYN flood',
  rst: 'RST flood',
  ack: 'ACK flood',
  frag: 'IP fragment flood',
  udp: 'UDP flood',
  icmp: 'ICMP flood',
  gre: 'GRE flood',
}

export const l4AttackLabel = (value) => {
  const label = KIND_LABELS[l4AttackKind(value)]
  if (label) return label
  const words = attackTokens(value).filter(
    (token) => !['EVENT', 'ATTACK', 'FIXED', 'BURST', 'BLOCK'].includes(token),
  )
  return words.length ? words.join(' ') : 'L4 attack'
}
