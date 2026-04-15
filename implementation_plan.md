`# Implementation Plan: Bookings UI & Support Navigation Refinement

Refine the bookings interface to improve visual fidelity and navigation logic based on user feedback.

## Proposed Changes

### [Component] Bookings List ([src/app/bookings/page.tsx](file:///home/ramji/Desktop/FinalTickpinDesgin/ticpin/src/app/bookings/page.tsx))
- Modify the card layout to display the venue/turf image in place of the yellow box placeholder.
- Implement multiple fallbacks for image fields (`play_image`, `image_url`, `event_image_url`, `venue_image_url`).
- Update the support box link to navigate to `/chat-support`.

### [Component] Booking Details (`src/app/bookings/[id]/page.tsx`)
- Remove the recently added category switching tabs.
- Add a back button in the header (circle button with ChevronLeft).
- Update the support box link to navigate to `/chat-support`.
- Adjust CSS/spacing to remove unnecessary padding/margin below the support box.

## Verification Plan

### Automated Tests
- Run `tsc` to ensure no regressions in TypeScript types.

### Manual Verification
- Navigate to `/bookings` and verify turf images are visible.
- Click "View details" and verify back button returns to the list.
- Click "Chat with support" and verify it goes to `/chat-support`.
- Observe the layout on the details page to ensure no stray spacing below the support box.
