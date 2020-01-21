import { server } from '../constants'
import { useCookies } from 'react-cookie'

function CreateRoomButton(url) {
    return (<button onClick={createRoom}>Create a Room</button>)
}

function createRoom() {
    fetch(`${server}/create-room`).then(response => {
        console.log(response.data);
        // const [cookies, setCookie] = useCookies(['room'])
        // setCookie('room', roomId, { path: '/', maxAge: 86400 })
        window.sessionStorage.setItem('room', response)
    }).catch(err => {
        console.error(err);
    })
}

export default CreateRoomButton