package bookingctrl

import (
	"errors"

	"github.com/gofiber/fiber/v2"

	"ticpin-backend/models"
	bookingService "ticpin-backend/services/booking"
)

// CreateSlotLock generates a temporary lock for a given slot.
func CreateSlotLock(c *fiber.Ctx) error {
	var req models.LockRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body", "details": err.Error()})
	}

	// Basic validation
	if req.LockKey == "" || req.Type == "" || req.ReferenceID == "" || req.Date == "" || req.Slot == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Missing required fields for lock"})
	}

	lock, err := bookingService.CreateSlotLock(c.Context(), req)
	if err != nil {
		if errors.Is(err, bookingService.ErrSlotAlreadyLocked) {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error":   "Slot Unavailable",
				"message": "This slot is currently locked by another user.",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create slot lock",
			"details": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"lock":    lock,
	})
}

// UnlockSlot explicitly removes a lock
func UnlockSlot(c *fiber.Ctx) error {
	var req models.UnlockRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}

	if err := bookingService.UnlockSlot(c.Context(), req); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to remove slot lock"})
	}

	return c.JSON(fiber.Map{"success": true})
}

// GetUserActiveLocks retrieves locks assigned to the current LockKey
func GetUserActiveLocks(c *fiber.Ctx) error {
	lockKey := c.Query("lock_key")
	lockType := c.Query("type")

	if lockKey == "" || lockType == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "lock_key and type query parameters are required"})
	}

	locks, err := bookingService.GetUserActiveLocks(c.Context(), lockKey, lockType)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to retrieve user locks"})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"locks":   locks,
	})
}
