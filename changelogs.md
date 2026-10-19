# Changelog



## \[Unreleased\] - 2026-10-19

### Added

#### 1. Extracted Shared Logic: [useShortExp.js](file:///d:/dev/arise/src/components/useShortExp.js)
Created a headless custom hook encapsulating all batch data management:
- Loads existing short expiry records from `/shortexp/item/${selectedItem.id}`.
- Manages adding, removing, and field changes across batches.
- Handles saving and payload formatting to `/shortexp/item/${selectedItem.id}/batches`.
- Provides loading and saving spinner states.

#### 2. Preserved Desktop Experience: [ShortExpDesktopModal.jsx](file:///d:/dev/arise/src/components/ShortExpDesktopModal.jsx)
Maintains the exact original Ant Design desktop modal with [ShortExpTabs.jsx](file:///d:/dev/arise/src/components/ShortExpTabs.jsx) for screens $\ge 768\text{px}$.

#### 3. Created Mobile Touch Experience: [ShortExpMobilePopup.jsx](file:///d:/dev/arise/src/components/ShortExpMobilePopup.jsx)
Replaced the center desktop dialog on mobile with an Ant Design Mobile slide-up bottom sheet (`Popup`):
- **Slide-Up Bottom Sheet**: Smooth iOS/Android bottom drawer with drag indicator and quick `✕` close button.
- **Drug Summary Banner**: Highlights drug name, PKU pill badge, unit, and shelf row.
- **Batch Navigation**: Uses `CapsuleTabs` (`[Batch 1]` `[Batch 2]`) with a quick `+ Add` button for fast thumb switching.
- **Touch-Friendly Controls**:
  - Direct numeric input with `-` and `+` adjustment buttons for quantity.
  - **Native Wheel Date Picker**: Tapping the date field opens `antd-mobile`'s smooth wheel picker (`precision="day"`) instead of desktop calendars that clip or overflow on small viewports.
  - Multi-line `TextArea` for remarks with character counter.
  - Delete batch option with confirmation when more than 1 batch exists.
- **Sticky Bottom Action Bar**: Pinned at the bottom with `SafeArea` support, featuring large `Cancel` and `Save Batches` buttons.

#### 4. Connected the Coordinator: [ShortExpModal.jsx](file:///d:/dev/arise/src/components/ShortExpModal.jsx)
```jsx
const ShortExpModal = ({ isOpen, onClose, selectedItem }) => {
    const isMobile = useIsMobile(768);
    const shortExpState = useShortExp({ isOpen, onClose, selectedItem });

    if (!isOpen) return null;

    return isMobile ? (
        <ShortExpMobilePopup
            isOpen={isOpen}
            onClose={onClose}
            selectedItem={selectedItem}
            {...shortExpState}
        />
    ) : (
        <ShortExpDesktopModal
            isOpen={isOpen}
            onClose={onClose}
            selectedItem={selectedItem}
            {...shortExpState}
        />
    );
};
```

---

### Global Impact
Because [ShortExpModal.jsx](file:///d:/dev/arise/src/components/ShortExpModal.jsx) preserves its original props interface (`isOpen`, `onClose`, `selectedItem`), this mobile slide-up experience automatically works across all screens that trigger it:
- [RoutineIndentMobileView.jsx](file:///d:/dev/arise/src/pages/Indent/RoutineIndentMobileView.jsx)
- [RoutineSummaryPage.jsx](file:///d:/dev/arise/src/pages/Indent/RoutineSummaryPage.jsx)
- [ShortExpPage.jsx](file:///d:/dev/arise/src/pages/Shortexp/ShortExpPage.jsx)
- [ShortExpEntry.jsx](file:///d:/dev/arise/src/pages/Shortexp/ShortExpEntry.jsx)


## \[Unreleased\] - 2026-10-19

### Added

- Added a dedicated mobile view for the Routine Indent workflow using Ant Design Mobile (antd-mobile).
- Added `useIsMobile.js`, a responsive viewport breakpoint hook using `window.matchMedia` with a default breakpoint of 768px.
- Added `useRoutineIndent.js`, a shared headless hook that centralizes Routine Indent business logic.
- Added `RoutineIndentDesktopView.jsx` to preserve the existing Ant Design desktop interface.
- Added `RoutineIndentMobileView.jsx` with a touch-friendly interface optimized for pharmacy staff performing shelf stock counts on mobile devices.
- Added a sticky mobile header displaying the current rack (Rak), item progress, and a progress bar.
- Added a drug information card displaying the drug name, PKU tag, and unit indicators.
- Added high-visibility numeric balance input with one-tap presets:
  - Out of Stock (0): Sets the indent quantity to the full quota.
  - Full (Max): Sets the indent quantity to zero.
- Added quick adjustment controls using minus and plus steppers for shelf balance and indent quantity.
- Added an indent recommendation card displaying the quota, balance, and calculated indent quantity.
- Added a dedicated Short Expiry action button to open the Short Expiry modal.
- Added expandable remarks with a character counter.
- Added a sticky bottom navigation bar with SafeArea support and accessible Prev, Next, and Finish buttons.

### Changed

#### Routine Indent Architecture

- Adopted a Headless Logic + Split View architecture to separate business logic from desktop and mobile presentation.
- Extracted shared Routine Indent logic into `useRoutineIndent.js`, eliminating duplicated business logic between desktop and mobile views.
- Updated `RoutineIndentPage.jsx` to detect the viewport size and render the appropriate interface:
  - Mobile view for screens below 768px.
  - Desktop view for screens 768px and above.
- Integrated Ant Design Mobile alongside the existing Ant Design desktop components.

#### Shared Business Logic

- Centralized session draft creation and resumption through `/indent_sessions/draft`.
- Centralized inventory loading and item data retrieval through `/indent_items` and `/inventory`.
- Preserved automatic indent quantity calculation using `Math.max(0, Max Qty - Balance)`.
- Centralized draft item saving, upserting, and inventory balance updates.
- Preserved automatic focus on the Balance input when transitioning between items.
- Added shared helper methods for quick stock adjustments, including `setBalanceQuick`, `adjustQty`, and `adjustBalance`.

#### Responsive Layout

- Updated `style.css` with responsive `.site-content` padding adjustments for screens below 768px.
- Removed excessive desktop margins on mobile screens to maximize usable space.
- Optimized mobile controls for touch interaction and one-handed operation.

### User Experience

- Improved mobile usability for pharmacy staff performing routine drug shelf counts.
- Reduced manual input through one-tap stock presets and quick adjustment steppers.
- Improved visibility of drug information, stock balance, quota, and recommended indent quantity.
- Kept navigation controls accessible through a sticky bottom action bar.
- Preserved the original desktop layout and behavior for screens 768px and above.
- Added responsive behavior that updates automatically when the browser window is resized or the device orientation changes.

### Testing and Verification

- Production build verified using `npm run build`.
- Build completed successfully with zero errors.
- Mobile layout can be tested by resizing the browser below 768px or using browser developer tools in device emulation mode.

### Commit

- Author: pfredz-hsgt
- Commit: ee31fe11148b547c3c5923ff19ef926fea7e93f2
- Date: October 19, 2026, 12:07 PM
- Branch: main
- Remote: origin/main
- Message: add mobile view for RoutineIndent
- Changes: 9 files changed, 1,549 insertions(+), 384 deletions(-)


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