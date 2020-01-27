import { server } from '../constants'
import { useCookies } from 'react-cookie'

function CreateRoomButton(url) {
    return (<button onClick={createRoom}>Create a Room</button>)
}

function createRoom() {
    let xhr = new XMLHttpRequest()
    xhr.open('GET', `${server}/create-room`)
    xhr.send()
    xhr.onreadystatechange = function(e) {
        let DONE = 4;
        let OK = 200
        if (xhr.readyState === DONE) {
            if (xhr.status === OK) {
                window.sessionStorage.setItem('room', xhr.responseText);
                window.location.href = '/room';
            } else {
                console.log('Error:', xhr.status);
                alert('Error creating room. Please try again later.');
            }
        }
    }
}

export default CreateRoomButton