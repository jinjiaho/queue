import Layout from '../components/layout'
import JoinRoomForm from '../components/join-room-form'
import './index.scss'
import server from '../constants'

function HomePage() {
  let url = `${server}/create-room`
  return (
    <Layout>
      <JoinRoomForm />
      <h3>Or</h3>
      <CreateRoomButton url={url} />
    </Layout>
  )
}

export default HomePage