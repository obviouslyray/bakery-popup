import HomeScreen from '../components/HomeScreen.jsx'
import { useTruckStatus } from '../lib/useTruckStatus.js'

export default function Home() {
  const { status } = useTruckStatus()
  return <HomeScreen status={status} hours="6–11" />
}
