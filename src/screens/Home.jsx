// #home pic - home tab
import HomeScreen from '../components/HomeScreen.jsx'
import { useOpenShift } from '../lib/shifts.js'

export default function Home() {
  const { status } = useOpenShift() // 'open' / 'closed' / 'loading' / 'error' from the shifts table
  return <HomeScreen status={status} hours="6–11" /> // hours are fixed so they're just hardcoded
}
