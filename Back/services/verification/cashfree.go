package verification

type PANVerifyRequest struct {
	VerificationID string `json:"verification_id"`
	PAN            string `json:"pan"`
	Name           string `json:"name"`
	DOB            string `json:"dob"`
}

type PANVerifyResponse struct {
	VerificationID string `json:"verification_id"`
	ReferenceID    int    `json:"reference_id"`
	Status         string `json:"status"`
	NameMatch      string `json:"name_match"`
	DOBMatch       string `json:"dob_match"`
	PANStatus      string `json:"pan_status"`
	Message        string `json:"message"`
}

type GSTListResponse struct {
	ReferenceID    int    `json:"reference_id"`
	VerificationID string `json:"verification_id"`
	Status         string `json:"status"`
	PAN            string `json:"pan"`
	GSTINList      []struct {
		GSTIN  string `json:"gstin"`
		Status string `json:"status"`
		State  string `json:"state"`
	} `json:"gstin_list"`
}

func VerifyPAN(pan, name, dob, verificationID string) (*PANVerifyResponse, error) {

	return &PANVerifyResponse{
		Status:         "SUCCESS",
		NameMatch:      "Y",
		DOBMatch:       "Y",
		PANStatus:      "VALID",
		VerificationID: verificationID,
	}, nil

}

func FetchGST(pan, verificationID string) (*GSTListResponse, error) {

	return &GSTListResponse{
		Status:         "SUCCESS",
		PAN:            pan,
		VerificationID: verificationID,
		GSTINList: []struct {
			GSTIN  string `json:"gstin"`
			Status string `json:"status"`
			State  string `json:"state"`
		}{
			{GSTIN: "33AAFCT1234F1Z1", Status: "ACTIVE", State: "TAMIL NADU"},
			{GSTIN: "29AAFCT1234F1Z2", Status: "ACTIVE", State: "KARNATAKA"},
		},
	}, nil

}
