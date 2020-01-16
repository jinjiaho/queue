import { observable } from "mobx"

class Queue {
  @observable items = []
}

var queue = new Queue

export default queue