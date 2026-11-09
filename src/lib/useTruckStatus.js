import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from './supabase.js'

// Database reads only: the timer resyncs; it never toggles the business status.
export function useTruckStatus() {
  const [view, setView] = useState({ status: 'loading', row: null, error: '' })
  const refreshRef = useRef(async () => {})
  const refresh = useCallback(() => refreshRef.current(), [])

  useEffect(() => {
    let stopped = false
    let request = 0
    const fail = () => setView(previous => ({ ...previous, status: 'error',
      error: 'Cannot confirm truck status. Check connection and database setup.' }))
    if (!supabase) { fail(); return }

    async function load() {
      if (stopped) return
      const ticket = ++request
      try {
        if (!navigator.onLine) throw new Error('Offline')
        const { data, error } = await supabase.from('truck_status')
          .select('id,is_open,version,updated_at').eq('id', 1).single()
        if (stopped || ticket !== request) return
        if (error || !data || typeof data.is_open !== 'boolean' || !Number.isInteger(data.version)) {
          throw new Error('Invalid status response')
        }
        setView({ status: data.is_open ? 'open' : 'closed', row: data, error: '' })
      } catch {
        if (!stopped && ticket === request) fail()
      }
    }
    refreshRef.current = load
    void load()
    const channel = supabase.channel('truck-status-' + Math.random().toString(36).slice(2))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'truck_status' }, () => { void load() })
      .subscribe(state => {
        if (!stopped && ['SUBSCRIBED', 'CHANNEL_ERROR', 'TIMED_OUT'].includes(state)) void load()
      })
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        setView(previous => ({ ...previous, status: 'loading' }))
        void load()
      }
    }
    const onOnline = () => { void load() }
    const onOffline = () => { ++request; fail() }
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void load()
    }, 30000)
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      stopped = true
      ++request
      refreshRef.current = async () => {}
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      void supabase.removeChannel(channel)
    }
  }, [])

  return { ...view, refresh }
}
