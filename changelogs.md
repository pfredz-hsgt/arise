# Changelog

## \[Unreleased\] - 2026-10-19

### Added

- Added main\_unit segregation across backend APIs and frontend workflows to enforce departmental data isolation for OPD, IPD, and ED.
- Added department badges next to the user avatar and in the profile dropdown, with department-specific theme colors.
- Added main unit indicators to the Routine Indent card, inventory lists, and urgent indent tables.
- Added dynamic PDF export filenames using the format `${unit}_Indent_${source}_${timestamp}.pdf`.
- Added main unit, tingkat, and petak information to the indent item modal.
- Added administrator support for managing inventory across all departments and exporting hospital-wide Excel reports.

### Changed

#### Backend

- Authentication (backend/routes/auth.js)
  - Updated authenticateToken middleware to ensure req.user.main\_unit is populated.
  - Added a PostgreSQL lookup to support older authentication tokens issued before the migration.
- Inventory (backend/routes/inventory.js)
  - Scoped GET /raks to the authenticated user's main\_unit.
  - Scoped GET / to the user's main\_unit by default, with an all\_units=true override for administrators.
  - Restricted GET /:id to inventory items belonging to the user's main\_unit.
- Indents and Transactions (backend/routes/indents.js, backend/routes/indent\_items.js)
  - Scoped cart sessions and pending requests to the user's main\_unit.
  - Scoped historical records, sessions, and user filter lists to the user's main\_unit.
  - Restricted approved indent dates, approved indents, and indent listings to the user's main\_unit.
  - Added department integrity checks to POST /indents, POST /indent\_items, and POST /indent\_items/bulk to prevent indents from referencing items belonging to another department.
- Short Expiry Management (backend/routes/shortexp.js)
  - Scoped active Kewps 6 short expiry records to the user's main\_unit through inventory\_items.main\_unit.
  - Added main\_unit validation when accessing short expiry items.
  - Enforced department validation before saving batches or remarks.
  - Restricted archive operations to records belonging to the user's main\_unit, preventing one department from clearing another department's records.
  - Scoped archive dates and archive data retrieval to the user's main\_unit.

#### Frontend

- Navigation and Header (MainLayout.jsx)
  - Added department badges to the header and user profile dropdown, with department-specific theme colors.
- Home Page (HomePage.jsx)
  - Restricted rak retrieval to the user's main\_unit.
  - Updated the Routine Indent card description and added a department badge.
- Routine Indent (RoutineIndentPage.jsx, RoutineSummaryPage.jsx)
  - Replaced the hardcoded indent\_source=OPD Substor parameter with dynamic main\_unit={user.main\_unit}&row={rak} parameters.
  - Enabled routine indent workflows for OPD, IPD, and ED drug racks.
- Urgent Indent (IndentPage.jsx, IndentModal.jsx)
  - Restricted inventory queries to the user's main\_unit.
  - Added a Main Unit column and department tags to list and table views.
  - Displayed the item's main\_unit, tingkat, and petak in the indent modal.
- Cart, Approval, and Records (CartPage.jsx, IndentListPage.jsx, IndentRecordPage.jsx)
  - Scoped cart sessions, approval requests, and PDF generation to the user's main\_unit.
  - Added dynamic PDF export filenames based on the department, indent source, and timestamp.
- Short Expiry (ShortExpPage.jsx, ShortExpEntry.jsx, ShortExpArchive.jsx, ShortExpModal.jsx)
  - Added department-specific filtering for short expiry items, rak navigation, and archive history.
  - Updated the archive confirmation dialog to identify the department being archived.
- Administrator Management (InventoryTable.jsx, AdminMenu.jsx)
  - Added the all\_units=true parameter to support cross-department inventory management.
  - Enabled comprehensive hospital-wide Excel exports for administrators.

### Security

- Enforced main\_unit segregation across inventory retrieval, indent creation, transaction history, approval workflows, and short expiry management.
- Prevented cross-department inventory access and unauthorized indent creation.
- Restricted short expiry archiving and clearing operations to the authenticated user's department.
- Preserved administrator access to cross-department inventory management through the explicit all\_units=true override.

### Testing and Verification

- Production build: npx vite build completed successfully in 20.06 seconds with zero errors.
- Backend segregation: Verified that OPD, IPD, and ED users can access only their respective segregated datasets.

### Commit

- Author: pfredz-hsgt
- Commit: b637b6209629f1c62b604475c011a3003366489a
- Date: October 19, 2026, 11:39 AM
- Message: add main\_unit segregation