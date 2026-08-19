import { useCallback } from 'react'
import notificationSound from '../assets/audio/universfield-new-notification-051-494246.mp3'

const useNotificationSound = () => {
  const play = useCallback(() => {
    try {
      const audio = new Audio(notificationSound)
      audio.volume = 0.5
      audio.play().catch(() => {})
    } catch {}
  }, [])

  return { play }
}

export default useNotificationSound
