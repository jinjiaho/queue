import Layout from '../components/layout'
import JoinRoomForm from '../components/join-room-form'
import CreateRoomButton from '../components/create-room-button'
import './index.scss'
import { server } from '../constants'

function HomePage() {
  let url = `${server}/create-room`
  return (
    <Layout>
      <JoinRoomForm />
      <h3>or</h3>
      <CreateRoomButton url={url} />
    </Layout>
  )
}

export default HomePage