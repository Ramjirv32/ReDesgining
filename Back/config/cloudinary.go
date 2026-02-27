package config

import (
	"fmt"
	"os"

	"github.com/cloudinary/cloudinary-go/v2"
)

var CloudinaryClient *cloudinary.Cloudinary

func InitCloudinary() error {
	url := os.Getenv("CLOUDINARY_URL")
	if url == "" {
		fmt.Println("[InitCloudinary] Warning: CLOUDINARY_URL is empty")
	}
	cld, err := cloudinary.NewFromURL(url)
	if err != nil {
		fmt.Printf("[InitCloudinary] Error initializing: %v\n", err)
		return err
	}

	fmt.Printf("[InitCloudinary] Connected to Cloudinary cloud: %s\n", cld.Config.Cloud.CloudName)
	CloudinaryClient = cld
	return nil
}

func GetCloudinary() *cloudinary.Cloudinary {
	return CloudinaryClient
}
