import { useCallback, useEffect, useState } from 'react'

type InstallChoice = {
  outcome: 'accepted' | 'dismissed'
  platform: string
}

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<InstallChoice>
}

type NavigatorWithStandalone = Navigator & {
  standalone?: boolean
}

export type InstallStatus =
  | 'idle'
  | 'prompting'
  | 'accepted'
  | 'dismissed'
  | 'error'

export type PwaInstallState = {
  canInstall: boolean
  isInstalled: boolean
  isIos: boolean
  status: InstallStatus
  install: () => Promise<void>
}

function isStandalone(): boolean {
  const navigatorWithStandalone = navigator as NavigatorWithStandalone
  return window.matchMedia('(display-mode: standalone)').matches ||
    navigatorWithStandalone.standalone === true
}

function isIosDevice(): boolean {
  return /iphone|ipad|ipod/iu.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

export function useInstallPrompt(): PwaInstallState {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(isStandalone)
  const [status, setStatus] = useState<InstallStatus>('idle')

  useEffect(() => {
    const displayMode = window.matchMedia('(display-mode: standalone)')
    const handleDisplayMode = () => setInstalled(isStandalone())
    const handleInstallPrompt = (event: Event) => {
      const installEvent = event as BeforeInstallPromptEvent
      installEvent.preventDefault()
      setPromptEvent(installEvent)
      setStatus('idle')
    }
    const handleInstalled = () => {
      setInstalled(true)
      setPromptEvent(null)
      setStatus('accepted')
    }

    displayMode.addEventListener('change', handleDisplayMode)
    window.addEventListener('beforeinstallprompt', handleInstallPrompt)
    window.addEventListener('appinstalled', handleInstalled)

    return () => {
      displayMode.removeEventListener('change', handleDisplayMode)
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  const install = useCallback(async () => {
    if (!promptEvent || installed) return

    setStatus('prompting')
    try {
      await promptEvent.prompt()
      const choice = await promptEvent.userChoice
      setPromptEvent(null)
      setStatus(choice.outcome)
    } catch {
      setPromptEvent(null)
      setStatus('error')
    }
  }, [installed, promptEvent])

  return {
    canInstall: promptEvent !== null && !installed,
    isInstalled: installed,
    isIos: isIosDevice(),
    status,
    install,
  }
}
