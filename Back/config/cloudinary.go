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
