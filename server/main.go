package main

import (
	"context"
	"fmt"
	// "log"
	"net/http"
	"time"

	"github.com/gorilla/mux"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.mongodb.org/mongo-driver/bson/primitive"
    // "github.com/mongodb/mongo-go-driver/bson"
    // "github.com/mongodb/mongo-go-driver/bson/primitive"
	// "github.com/mongodb/mongo-go-driver/mongo"
	// "github.com/mongodb/mongo-go-driver/mongo/options"
)

type QueueItem struct {
	Title string `json:"title,omitempty" bson:"title,omitempty"`
	VideoId string `json:"id,omitempty" bson:"id,omitempty`
}

type User struct {
	ID primitive.ObjectID `json:"_id,omitempty" bson:"_id,omitempty"`
}

type Room struct {
	ID primitive.ObjectID `json:"_id,omitempty" bson:"_id,omitempty"`
	Queue []QueueItem `json:"queue,omitempty" bson:"queue,omitempty"`
	Users []User `json:"users,omitempty" bson:"users,omitempty"`
}

var client *mongo.Client

func CreateRoomEndpoint(response http.ResponseWriter, request *http.Request) {
	response.Header().Add("content-type", "application/json")
	var room Room
	json.NewDecoder(request.Body).Decode(&room)

	collection := client.Database("queue").Collection("rooms")
	ctx, _ := context.WithTimeout(context.Background(), 10*time.Second)
	// Inserting a document into a collection
	res, err := collection.InsertOne(ctx, room)
	json.NewEncoder(response).Encode(res)
	fmt.Printf("%v", res.InsertedID)
	// id := res.InsertedID
	// fmt.Printf("%v", id)

}

func main() {

	client, err := mongo.NewClient(options.Client().ApplyURI("mongodb://localhost:27017"))
    if err != nil {
        fmt.Println(err.Error())
        return
    } else {
		fmt.Printf("client created")
	}

	ctx, _ := context.WithTimeout(context.Background(), 10*time.Second)
	router := mux.NewRouter()

	router.HandleFunc("/create-room", CreateRoomEndpoint).Methods("GET")
	http.ListenAndServe(":3001", router)

} 