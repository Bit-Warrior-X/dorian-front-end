// Carries an OAuth sign-in that still needs a 2FA code from the callback page to
// the login page without putting the challenge token in a URL.
const KEY = 'dorian.mfaChallenge'

export const saveMFAHandoff = ({ mfaToken, redirect, remember }) => {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ mfaToken, redirect, remember: Boolean(remember) }))
  } catch {
    /* storage unavailable: user will need to sign in again */
  }
}

export const takeMFAHandoff = () => {
  try {
    const raw = sessionStorage.getItem(KEY)
    sessionStorage.removeItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.mfaToken ? parsed : null
  } catch {
    return null
  }
}
