import { reactive } from 'vue'
import { markAlarmRead } from '@/stores/alarms'

const DISMISS_KEY = 'dorian.attackAlert.dismissed'

const readDismissed = () => {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(DISMISS_KEY) || '[]')
    return new Set(Array.isArray(parsed) ? parsed : [])
  } catch {
    return new Set()
  }
}

const writeDismissed = (reqId) => {
  const dismissed = readDismissed()
  if (reqId) dismissed.add(reqId)
  sessionStorage.setItem(DISMISS_KEY, JSON.stringify([...dismissed].slice(-80)))
}

export const attackAlertState = reactive({
  prompt: null,
  consoleReqId: '',
})

export const isAttackDismissed = (reqId) => readDismissed().has(reqId)

export const dismissAttack = (reqId) => {
  writeDismissed(reqId)
  if (attackAlertState.prompt?.reqId === reqId) {
    attackAlertState.prompt = null
  }
}

export const openAttackConsole = (reqId) => {
  if (!reqId) return
  writeDismissed(reqId)
  void markAlarmRead(`attack:${reqId}`)
  attackAlertState.prompt = null
  attackAlertState.consoleReqId = reqId
}

export const closeAttackConsole = () => {
  attackAlertState.consoleReqId = ''
}

export const offerAttack = (period) => {
  const reqId = period?.reqId
  if (!reqId || readDismissed().has(reqId)) return
  if (attackAlertState.consoleReqId === reqId) return
  attackAlertState.prompt = period
}
