# Refactor Report: Invoice Editing and Deletion Functionality

## Context and Goals
- **Goal:** Implement Phase 12 - Invoice Editing and Deletion Functionality.
- **Why:** To allow users to modify existing invoices or delete them from the system, enhancing the core MVP capabilities.
- **Constraints:** Preserve existing UI styling, ensure TypeScript compilation remains unbroken, and do not modify files outside the intended scope unless strictly necessary.

## Files Modified

1. `src/app/invoices/[id]/page.tsx`
   - **Action:** Modified
   - **Details:** 
     - Added `useAuth` hook to access the `user.id` since the `GET` and `DELETE` endpoints require a `userID`.
     - Fixed an existing issue where `fetch("/api/invoices/${invoiceID}")` was failing on the server because `userID` wasn't passed in the URL (it requires `userID`). Added `?userID=${user.id}`.
     - Added the "Edit Invoice" button that routes to `/invoices/[id]/edit`.
     - Added the "Delete Invoice" button that triggers a browser `window.confirm` and calls `DELETE /api/invoices/[id]?userID=[user.id]`, redirecting the user back to `/invoices` upon success.
     - Applied appropriate UI styling and loading states for deletion.

2. `src/app/invoices/[id]/edit/page.tsx`
   - **Action:** Created
   - **Details:** 
     - Created a new edit invoice page, adapting the UI and structure of `src/app/invoices/new/page.tsx`.
     - Integrated `GET /api/invoices/[id]?userID=[user.id]` to fetch the existing invoice data.
     - Pre-filled the form states (billing info, dates, item selections) using the fetched invoice details.
     - Fetched the available items for the user from `/api/invoices/items?userID=[user.id]` and dynamically merged the existing invoice's items to ensure they render in the select table properly even if they somehow wouldn't appear in the standard list.
     - Integrated `PATCH /api/invoices/[id]?userID=[user.id]` for updating the invoice upon submission.
     - Redirects back to the invoice details page (`/invoices/[id]`) after a successful save.

## Decisions Made
- **API Fetching Fix:** Discovered that the `GET /api/invoices/[id]` endpoint requires `userID`, but the invoice detail page wasn't providing it. Fixed the query string across the app logic to correctly reflect the backend requirements.
- **Item Loading in Edit Form:** Added a dynamic merge of available items. To ensure that items already present in the existing invoice (which might have been deleted or filtered out from the default items response) are still editable and visible in the selection table, we added the existing invoice items to the available items array during initial load.
- **Styling:** Maintained consistency by reusing the existing custom `Button` and `Container` components. For the delete button, overriding classes (`!bg-red-100 !text-red-700 hover:!bg-red-200`) were used so it stands out safely from standard buttons without needing a new variant on the `Button` primitive.

## Risks and Follow-ups
- **Authentication Dependency:** Like the rest of the MVP, the `userID` parameter is taken from the pluggable `AuthProvider` mock logic. Once real authentication is implemented (NextAuth), these client pages will correctly pass the actual user ID to these authenticated routes.

## Escalations
None. The requested refactor remained within the constraints and scope described by the orchestrator.
