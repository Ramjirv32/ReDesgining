// +build ignore

package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"ticpin-backend/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func main() {
	uri := "mongodb+srv://ramji:Ramji23112005@cluster0.ln4g5.mongodb.net/ticpin?retryWrites=true&w=majority"
	client, err := mongo.Connect(context.TODO(), options.Client().ApplyURI(uri))
	if err != nil {
		log.Fatal(err)
	}
	defer client.Disconnect(context.TODO())

	db := client.Database("ticpin")
	col := db.Collection("plays")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var p models.Play
	err = col.FindOne(ctx, bson.M{"name": "Coimbatore Elite Turf Arena"}).Decode(&p)
	if err != nil {
		log.Fatal(err)
	}

	jsonData, _ := json.Marshal(p)
	fmt.Println(string(jsonData))
}
