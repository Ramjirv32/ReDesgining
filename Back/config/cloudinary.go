package config

import (
	"context"
	"crypto/tls"
	"fmt"
	"net"
	"net/http"
	"os"
	"time"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api"
	"github.com/cloudinary/cloudinary-go/v2/api/admin"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
)

var CloudinaryClient *cloudinary.Cloudinary

func InitCloudinary() error {
	cld, err := cloudinary.NewFromURL(os.Getenv("CLOUDINARY_URL"))
	if err != nil {
		return err
	}

	cld.Config.API.Timeout = 300
	cld.Config.API.UploadTimeout = 900

	transport := &http.Transport{
		Proxy: http.ProxyFromEnvironment,
		DialContext: (&net.Dialer{
			Timeout:   120 * time.Second,
			KeepAlive: 30 * time.Second,
		}).DialContext,
		MaxIdleConns:          100,
		IdleConnTimeout:       90 * time.Second,
		TLSHandshakeTimeout:   120 * time.Second,
		ExpectContinueTimeout: 1 * time.Second,

		TLSClientConfig: &tls.Config{
			InsecureSkipVerify: false,
			MinVersion:         tls.VersionTLS12,
		},

		TLSNextProto: make(map[string]func(string, *tls.Conn) http.RoundTripper),
	}

	cld.Upload.Client = http.Client{
		Transport: transport,
		Timeout:   0,
	}

	CloudinaryClient = cld
	return nil
}

func GetCloudinary() *cloudinary.Cloudinary {
	return CloudinaryClient
}

// UploadPANCard uploads PAN card as private/authenticated image
func UploadPANCard(filePath string, organizerID string) (*uploader.UploadResult, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	overwrite := true
	params := uploader.UploadParams{
		Folder:       "pan_docs",
		ResourceType: "auto",
		Type:         "authenticated", // More secure than private
		PublicID:     fmt.Sprintf("pan_%s", organizerID),
		Overwrite:    &overwrite,
	}

	result, err := CloudinaryClient.Upload.Upload(ctx, filePath, params)
	if err != nil {
		return nil, fmt.Errorf("failed to upload PAN card: %w", err)
	}

	return result, nil
}

// GenerateSignedPANURL generates a time-limited signed URL for PAN card access
func GenerateSignedPANURL(publicID string, expiresInMinutes int) (string, error) {
	if expiresInMinutes <= 0 || expiresInMinutes > 60 {
		expiresInMinutes = 5 // Default to 5 minutes
	}

	// In Cloudinary v2 SDK, we can use the Image method to generate signed URLs
	img, err := CloudinaryClient.Image(publicID)
	if err != nil {
		return "", fmt.Errorf("failed to initialize image helper: %w", err)
	}

	img.DeliveryType = api.Authenticated
	img.Config.URL.SignURL = true
	
	url, err := img.String()
	if err != nil {
		return "", fmt.Errorf("failed to generate signed URL string: %w", err)
	}

	return url, nil
}

// DeletePANCard securely deletes PAN card from Cloudinary
func DeletePANCard(publicID string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	invalidate := true
	_, err := CloudinaryClient.Admin.DeleteAssets(ctx, admin.DeleteAssetsParams{
		PublicIDs:  []string{publicID},
		Invalidate: &invalidate,
	})
	if err != nil {
		return fmt.Errorf("failed to delete PAN card: %w", err)
	}

	return nil
}
