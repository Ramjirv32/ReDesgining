package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type ChatMessage struct {
	ID        primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	SessionID string             `json:"sessionId" bson:"session_id"`
	UserID    string             `json:"userId" bson:"user_id,omitempty"`
	UserEmail string             `json:"userEmail" bson:"user_email,omitempty"`
	UserType  string             `json:"userType" bson:"user_type"`
	Category  string             `json:"category" bson:"category"`
	Message   string             `json:"message" bson:"message"`
	Sender    string             `json:"sender" bson:"sender"`
	FileUrl   string             `json:"fileUrl" bson:"file_url,omitempty"`
	FileType  string             `json:"fileType" bson:"file_type,omitempty"`
	IsRead    bool               `json:"isRead" bson:"is_read"`
	CreatedAt time.Time          `json:"createdAt" bson:"created_at"`
}

type ChatSession struct {
	ID          primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	SessionID   string             `json:"sessionId" bson:"session_id"`
	UserID      string             `json:"userId" bson:"user_id,omitempty"`
	UserEmail   string             `json:"userEmail" bson:"user_email"`
	UserName    string             `json:"userName" bson:"user_name,omitempty"`
	UserType    string             `json:"userType" bson:"user_type"`
	Category    string             `json:"category" bson:"category"`
	Status      string             `json:"status" bson:"status"`
	LastMessage string             `json:"lastMessage" bson:"last_message"`
	CreatedAt   time.Time          `json:"createdAt" bson:"created_at"`
	UpdatedAt   time.Time          `json:"updatedAt" bson:"updated_at"`
	ClosedAt    *time.Time         `json:"closedAt,omitempty" bson:"closed_at,omitempty"`
}

type ChatQuestion struct {
	ID       primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	Category string             `json:"category" bson:"category"`
	Question string             `json:"question" bson:"question"`
	Answer   string             `json:"answer" bson:"answer"`
	Order    int                `json:"order" bson:"order"`
}
