package config

import (
	"crypto/tls"
	"net"
	"net/http"
	"os"
	"time"

	"github.com/cloudinary/cloudinary-go/v2"
)

var CloudinaryClient *cloudinary.Cloudinary

func InitCloudinary() error {
	cld, err := cloudinary.NewFromURL(os.Getenv("CLOUDINARY_URL"))
	if err != nil {
		return err
	}

	// High timeouts for large media uploads and slow handshakes
	cld.Config.API.Timeout = 300       // 5 minutes
	cld.Config.API.UploadTimeout = 900 // 15 minutes

	// Create a specialized transport for problematic network environments
	transport := &http.Transport{
		Proxy: http.ProxyFromEnvironment,
		DialContext: (&net.Dialer{
			Timeout:   120 * time.Second, // 2 minutes to dial
			KeepAlive: 30 * time.Second,
			// Sometimes forcing IPv4 helps with handshake timeouts on some networks
		}).DialContext,
		MaxIdleConns:          100,
		IdleConnTimeout:       90 * time.Second,
		TLSHandshakeTimeout:   120 * time.Second, // 2 minutes for TLS handshake
		ExpectContinueTimeout: 1 * time.Second,
		// Explicitly set TLS config
		TLSClientConfig: &tls.Config{
			InsecureSkipVerify: false,
			MinVersion:         tls.VersionTLS12,
		},
		// Disable HTTP/2 if it's causing issues with handshake
		TLSNextProto: make(map[string]func(string, *tls.Conn) http.RoundTripper),
	}

	// Apply robust client settings to the uploader
	cld.Upload.Client = http.Client{
		Transport: transport,
		Timeout:   0, // We control timeouts via cld.Config and Context
	}

	CloudinaryClient = cld
	return nil
}

func GetCloudinary() *cloudinary.Cloudinary {
	return CloudinaryClient
}
