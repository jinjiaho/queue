package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"time"
	"io/ioutil"
	"encoding/json"
	"strings"
	"reflect"

    "github.com/rs/cors"
	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	"github.com/tjarratt/babble"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"github.com/google/uuid"
)

const APIKey = "AIzaSyAw2xS6QMSKGL93xARLO3yX8si0nxZj--s"

type QueueItem struct {
	Title string `json:"title,omitempty" bson:"title,omitempty"`
	VideoID string `json:"id,omitempty" bson:"id,omitempty`
}

type Room struct {
	ID primitive.ObjectID `json:"_id,omitempty" bson:"_id,omitempty"`
	Name string `json:"name" bson:"name"`
	Queue []QueueItem `json:"queue" bson:"queue"`
	// Users map[string]bool `json:"users" bson:"users"`
}

type SearchResult struct {
	VideoID string `json:"id,omitempty"`
	Title string `json:"title,omitempty"`
	Thumbnail string `json:"thumbnail,omitempty"`
	Channel string `json:"channel,omitempty"`
}

// Client struct for keeping track of client devices
type Client struct {
	Room string
	Ws *websocket.Conn
}

var wsClients = make(map[uuid.UUID]Client)

var mongoClient *mongo.Client

func newRoomName(col *mongo.Collection) string {
	babbler := babble.NewBabbler()
	babbler.Separator = "-"
	babbler.Count = 2
	roomName := babbler.Babble()
	roomExists := checkRoomExists(col, roomName)
	if (roomExists) {
		roomName = newRoomName(col)
	}
	return roomName
}

func checkStringExists(str string) bool {
	var x string = "a-b"
	if reflect.TypeOf(str).Kind() == reflect.TypeOf(x).Kind() {
		fmt.Println("Equal kind")
		// room exists, return true
		return true
	} else {
		// exception, return false
		return false
	}
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

func wsEndpoint(w http.ResponseWriter, r *http.Request) {
	upgrader.CheckOrigin = func(r *http.Request) bool { return true }
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}

	reader(ws)
}

// define a reader which will listen for
// new messages being sent to our WebSocket
// endpoint
func reader(conn *websocket.Conn) {
    for {
		// read in a message
        messageType, p, err := conn.ReadMessage()
        if err != nil {
            log.Println(err)
            return
		}
		
		if (messageType == websocket.TextMessage) {
			// print out that message for clarity
			msg := strings.SplitN(string(p), " ", 2)
			fmt.Printf("%v, %v\n", msg[0], msg[1])
			data := msg[1]
			vals := parseMessageData(data)

			switch event := msg[0]; event {
			case "register":
				// register client
				idFromClient, _ := uuid.Parse(vals["clientID"])
				registered := false
				for i, _ := range wsClients {
					if i == idFromClient {
						registered = true
					}
				}
				if registered == false {
					clientID := uuid.New()
					fmt.Printf("New client %v\n", clientID)
					wsClients[clientID] = Client{
						Room: vals["room"],
						Ws: conn,
					}
					returnMessage := fmt.Sprintf("registered %v", clientID.String())
					sendMessage(conn, websocket.TextMessage, []byte(returnMessage))
				}
			case "GetQueue":
				room := getRoom(vals["room"])
				returnMessage := byteSliceReply("RefreshQueue", queue)
				sendMessage(conn, websocket.TextMessage, returnMessage)
			case "AddToQueue":
				room := getRoom(vals["room"])
				videoArr := getVideoInfo(vals["vidID"])
				// fmt.Printf("Add %v to %v\n", videoArr, room.Name)
				newQueue := addItemToRoomQueue(room.Name, videoArr)
				resultList := JSONifyQueue(newQueue)
				returnMessage := byteSliceReply("RefreshQueue", resultList)
				sendMessage(conn, websocket.TextMessage, returnMessage)
				broadcastToRoom(room.Name, returnMessage)
			case "Search":
				searchResults := searchYouTube(vals["query"])
				fmt.Printf("searchResults %v\n", searchResults)
				resultList, err := json.Marshal(searchResults)
				if err != nil {
					log.Fatal("Cannot encode to JSON ", err)
				}
				returnMessage := byteSliceReply("FoundVideos", resultList)
				sendMessage(conn, websocket.TextMessage, returnMessage)
			case "Next":
				room := getRoom(vals["room"])
				queue := room.Queue[1:];
				updateRoomQueue(vals["room"], queue)
				queueBytes := JSONifyQueue(queue)
				returnMessage := byteSliceReply("RefreshQueue", queueBytes)
				sendMessage(conn, websocket.TextMessage, returnMessage)
				broadcastToRoom(room.Name, returnMessage)
			case "PlayNow":

			}

		}	
	}
}

func JSONifyQueue(array []QueueItem) []byte {
	byteSlice, err := json.Marshal(array)
	if err != nil {
		fmt.Printf("\nCannot encode to JSON ", err)
	}
	return byteSlice
}

func byteSliceReply(event string, bytes []byte) []byte {
	str := fmt.Sprintf("%v ", event)
	return append([]byte(str), bytes...)
}

func broadcastToRoom(roomName string, message []byte) {
	for _, v := range wsClients {
		if v.Room == roomName {
			sendMessage(v.Ws, websocket.TextMessage, message)
		}
	}
}

func parseMessageData(data string) map[string]string {
	var vals map[string]string
	json.Unmarshal([]byte(data), &vals)
	return vals
}


func formatWebsocketReply(event string, data string) []byte {
	oneString := fmt.Sprintf("%v %v", event, data)
	bytes := []byte(oneString)
	return bytes
}

func getMongoCollection(collection string) *mongo.Collection {
	ctx, _ := context.WithTimeout(context.Background(), 10*time.Second)
	clientOptions := options.Client().ApplyURI("mongodb://localhost:27017")
	mongoClient, _ := mongo.Connect(ctx, clientOptions)
	col := mongoClient.Database("queue").Collection(collection)
	return col
}

func updateRoomQueue(roomName string, newQueue []QueueItem) []QueueItem {
	filter := bson.M{"name": roomName}
	update := bson.M{
		"$set": bson.M{
			"queue": newQueue,
		},
	}
	updateDocument(roomName, filter, update, newQueue)
	return newQueue
}

func addItemToRoomQueue(roomName string, queueItems []QueueItem) []QueueItem {
	room := getRoom(roomName)
	for _, q := range queueItems {
		videoInQueue := false
		for _, v := range room.Queue {
			if q.VideoID == v.VideoID {
				videoInQueue = true
			}
		}
		if videoInQueue != true {
			room.Queue = append(room.Queue, q)
		}
	}
	filter := bson.M{"name": roomName}
	update := bson.M{
		"$set": bson.M{
			"queue": room.Queue,
		},
	}
	updateDocument(roomName, filter, update, room.Queue)
	return room.Queue
}

func updateDocument(colName string, filter bson.M, updater bson.M, latest []QueueItem) bool {
	ctx, _ := context.WithTimeout(context.Background(), 10*time.Second)
	result, err := getMongoCollection("rooms").UpdateOne(ctx, filter, updater)
	// Check for error, else print the UpdateOne() API call results
	if err != nil {
		fmt.Println("UpdateOne() result ERROR:", err)
		return false
	} else {
		fmt.Println("UpdateOne() result:", result)
		fmt.Println("UpdateOne() result TYPE:", reflect.TypeOf(result))
		fmt.Println("UpdateOne() result MatchedCount:", result.MatchedCount)
		fmt.Println("UpdateOne() result ModifiedCount:", result.ModifiedCount)
		fmt.Println("UpdateOne() result UpsertedCount:", result.UpsertedCount)
		fmt.Println("UpdateOne() result UpsertedID:", result.UpsertedID)
		return true
	}
	
	
}

func getRoom(roomName string) Room {
	ctx, _ := context.WithTimeout(context.Background(), 10*time.Second)
	col := getMongoCollection("rooms")

	var room Room
	filter := bson.M{"name": roomName}
	// fmt.Printf("filtering for room %v\n", roomName)
	col.FindOne(ctx, filter).Decode(&room)
	return room
}

func sendMessage(conn *websocket.Conn, messageType int, p []byte) {
	if err := conn.WriteMessage(messageType, p); err != nil {
        fmt.Printf("sendMessage failed with error %s\n", err)
		return
	}
	return
}

func searchYouTube(query string) []SearchResult {
	// fmt.Printf("query %v\n", query)
	url := fmt.Sprintf("https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=%v&type=video&key=%v", query, APIKey)
	// fmt.Printf("search url %v\n", url)
	response, err := http.Get(url)
	var empty []SearchResult
	if err != nil {
		fmt.Printf("YouTube search failed with error %s\n", err)
		return empty
	} else {
		res, _ := ioutil.ReadAll(response.Body)
		var resMap map[string]interface{}
		json.Unmarshal([]byte(res), &resMap)
		items := resMap["items"].([]interface{})
		var results []SearchResult
		for _, v := range items {
			// fmt.Printf("item %v of type %T\n", i, v)
			w := v.(map[string]interface{})
			snippet := w["snippet"].(map[string]interface{})
			itemIDs := w["id"].(map[string]interface{})
			thumbnails := snippet["thumbnails"].(map[string]interface{})

			result := SearchResult{
				VideoID: itemIDs["videoId"].(string),
				Title: snippet["title"].(string),
				Thumbnail: thumbnails["medium"].(map[string]interface{})["url"].(string),
				Channel: snippet["channelTitle"].(string),
			}
			results = append(results, result)
		}
		return results
	}
}

func getVideoInfo(vidID string) []QueueItem {
	url := fmt.Sprintf("https://www.googleapis.com/youtube/v3/videos?id=%v&key=%v&part=snippet", vidID, APIKey)
	fmt.Printf("get video from url %v\n", url)
	response, err := http.Get(url)
	var empty []QueueItem
    if err != nil {
		fmt.Printf("getVideoInfo failed with error %s\n", err)
		return empty
    } else {
        response, _ := ioutil.ReadAll(response.Body)
		var resMap map[string]interface{}
		json.Unmarshal(response, &resMap)
		items := resMap["items"].([]interface{})
		var result []QueueItem
		for range items {
			item := items[0].(map[string]interface{})
			snippet := item["snippet"].(map[string]interface{})
			result = append(result, QueueItem{
				Title: snippet["title"].(string),
				VideoID: vidID,
			})
		}

		return result
	}
}

func checkRoomExists(col *mongo.Collection, roomName string) bool {
	// fmt.Printf("roomName %v\n", roomName)
	ctx, _ := context.WithTimeout(context.Background(), 10*time.Second)
	var result struct {
		Value string
	}
	filter := bson.M{"name": roomName}
	err := col.FindOne(ctx, filter).Decode(&result)
	if err != nil {
		// room does not exist, return false
		return false
	}
	fmt.Printf("value: %v", result.Value)

	return checkStringExists(result.Value)
}

func CreateRoomEndpoint(response http.ResponseWriter, request *http.Request) {
	// get collection
	ctx, _ := context.WithTimeout(context.Background(), 10*time.Second)
	clientOptions := options.Client().ApplyURI("mongodb://localhost:27017")
	mongoClient, _ := mongo.Connect(ctx, clientOptions)
	collection := mongoClient.Database("queue").Collection("rooms")

	// Generate random room name
	roomName := newRoomName(collection)

	var newRoom Room = Room{
		Name: roomName,
		Queue: []QueueItem{},
		// Users: make(map[string]bool),
	}
	fmt.Printf("%v %v\n", roomName, reflect.TypeOf(roomName).Kind())
	// response.Header().Add("content-type", "application/json")
	// json.NewDecoder(request.Body).Decode(&room)
	
	fmt.Println("Inserting document")
	// Inserting a document into a collection
	res, err := collection.InsertOne(ctx, newRoom)

	if err != nil {
		log.Fatal(err)
	} else {
		fmt.Printf("document inserted: %v\n", res.InsertedID)
		// json.NewEncoder(response).Encode(res)
		response.WriteHeader(http.StatusOK)
		response.Write([]byte(roomName))
	}
	
}

func CheckRoomEndpoint(response http.ResponseWriter, request *http.Request) {
	vars := mux.Vars(request)
	// fmt.Printf("roomName %v\n", request)
	roomExists := checkRoomExists(getMongoCollection("rooms"), vars["roomName"])
	if roomExists {
		response.WriteHeader(http.StatusOK)
		response.Write([]byte("OK"))
	} else {
		response.Write([]byte("Room not found"))
	}
}

func DeleteRoomEndpoint(response http.ResponseWriter, request *http.Request) {
	vars := mux.Vars(request)
	col := getMongoCollection("rooms")
	ctx, _ := context.WithTimeout(context.Background(), 10*time.Second)
	res, err := col.DeleteOne(ctx, bson.M{"name": vars["roomName"]})
	fmt.Println("DeleteOne Result TYPE:", reflect.TypeOf(res))
	
	if err != nil {
        fmt.Printf("Delete Room failed with error %s\n", err)
		response.Write([]byte("Failed to delete"))
	} else {
		response.WriteHeader(http.StatusOK)
		response.Write([]byte("Document deleted"))
	}
}

func GetRoomEndpoint(response http.ResponseWriter, request *http.Request) {
	vars := mux.Vars(request)
	room := getRoom(vars["roomName"])
	roomData, err := json.Marshal(room)

	if err != nil {
        fmt.Printf("Get Room failed with error %s\n", err)
		response.Write([]byte("Could not get room"))
	} else {
		response.WriteHeader(http.StatusOK)
		response.Write([]byte(roomData))
	}
}

func main() {

	router := mux.NewRouter()

	router.HandleFunc("/create-room", CreateRoomEndpoint)
	router.HandleFunc("/check-room-exists/{roomName}", CheckRoomEndpoint)
	router.HandleFunc("/delete-room/{roomName}", DeleteRoomEndpoint)
	router.HandleFunc("/get-room/{roomName}", GetRoomEndpoint)
	router.HandleFunc("/ws", wsEndpoint)

	handler := cors.Default().Handler(router)

	log.Fatal(http.ListenAndServe(":8080", handler))

} 


// func updateUserList(userID uuid.UUID, roomName string) (updated bool) {
// 	// add user to room
// 	ctx, _ := context.WithTimeout(context.Background(), 10*time.Second)
// 	room := getRoom(roomName)
// 	uid := userID.String()
// 	fmt.Printf("%v\n", room.Users)
// 	if _, ok := room.Users[uid]; !ok {
// 		if room.Users == nil {
// 			room.Users = make(map[string]bool)
// 		}
// 		room.Users[uid] = true
// 		filter := bson.M{"name": roomName}
// 		result, err := getMongoCollection("rooms").UpdateOne(ctx, filter, bson.M{
// 			"$set": bson.M{
// 				"users": room.Users,
// 			},
// 		})
// 		// Check for error, else print the UpdateOne() API call results
// 		if err != nil {
// 			fmt.Println("UpdateOne() result ERROR:", err)
// 			return false
// 		} else {
// 			fmt.Println("UpdateOne() result:", result)
// 			fmt.Println("UpdateOne() result TYPE:", reflect.TypeOf(result))
// 			fmt.Println("UpdateOne() result MatchedCount:", result.MatchedCount)
// 			fmt.Println("UpdateOne() result ModifiedCount:", result.ModifiedCount)
// 			fmt.Println("UpdateOne() result UpsertedCount:", result.UpsertedCount)
// 			fmt.Println("UpdateOne() result UpsertedID:", result.UpsertedID)
// 			return true
// 		}
// 	}
// 	return true
// }