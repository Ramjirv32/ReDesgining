package main

import (
	"context"
	"fmt"
	"os"
	"time"

	"ticpin-backend/config"
	"ticpin-backend/services/admin"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func main() {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	config.ConnectDB()

	collection := config.GetDB().Collection("admins")
	_, err := collection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.M{"email": 1},
		Options: options.Index().SetUnique(true),
	})
	if err != nil {
		fmt.Printf("Index error (may already exist): %v\n", err)
	}

	var existing bson.M
	err = collection.FindOne(ctx, bson.M{"email": "23cs139@kpriet.ac.in"}).Decode(&existing)
	if err == nil {
		fmt.Println("Admin already exists")
		return
	}

	_, err = admin.Create("23cs139@kpriet.ac.in", "12345678", "Admin", "7845613278")
	if err != nil {
		fmt.Printf("Error creating admin: %v\n", err)
		os.Exit(1)
	}

	fmt.Println("Admin created successfully!")
	fmt.Println("Email: 23cs139@kpriet.ac.in")
	fmt.Println("Password: 12345678")
	fmt.Println("Phone: 7845613278")
	fmt.Println("OTP: any 6 digits")
}
