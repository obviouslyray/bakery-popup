import HomeScreen from '../components/HomeScreen.jsx'
import { useOpenShift } from '../lib/shifts.js'

export default function Home() {
  const { status } = useOpenShift()
  return <HomeScreen status={status} hours="6–11" />
}
