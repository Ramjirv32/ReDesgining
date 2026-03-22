package utils

import (
	"crypto/sha256"
	"encoding/hex"
	"strings"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

func HashObjectID(id primitive.ObjectID) string {
	hash := sha256.Sum256(id[:])

	return strings.ToUpper(hex.EncodeToString(hash[:])[:8])
}

func HashString(s string) string {
	hash := sha256.Sum256([]byte(s))
	return strings.ToUpper(hex.EncodeToString(hash[:])[:8])
}
