package utils

import (
	"crypto/sha256"
	"encoding/hex"
	"strings"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// HashObjectID creates a short, secure hash from MongoDB ObjectID
func HashObjectID(id primitive.ObjectID) string {
	hash := sha256.Sum256(id[:])
	// Take first 8 characters of hex hash
	return strings.ToUpper(hex.EncodeToString(hash[:])[:8])
}

// HashString creates a short, secure hash from string
func HashString(s string) string {
	hash := sha256.Sum256([]byte(s))
	return strings.ToUpper(hex.EncodeToString(hash[:])[:8])
}
