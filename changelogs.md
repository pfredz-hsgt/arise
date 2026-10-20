# Changelog


### What Was Done

#### Short Expiry Entry Mobile Adaptation: [ShortExpEntry.jsx](file:///d:/dev/arise/src/pages/Shortexp/ShortExpEntry.jsx)
Implemented the "Share Logic, Split the View" pattern with `antd-mobile` alongside desktop Ant Design:
1. **Shared Headless Logic ([useShortExpEntry.js](file:///d:/dev/arise/src/pages/Shortexp/useShortExpEntry.js))**:
   - Manages Rak selection, inventory items iteration, batch saving, and instant drug search.
   - Pure JS implementation without raw JSX.
2. **Desktop View ([ShortExpEntryDesktopView.jsx](file:///d:/dev/arise/src/pages/Shortexp/ShortExpEntryDesktopView.jsx))**:
   - 100% of the desktop wizard preserved for screens $\ge 768\text{px}$.
   - Card setup with Ant Design Select, Search & Edit Specific Drug Card, and `ShortExpTabs` editable card tabs.
3. **Mobile Touch View ([ShortExpEntryMobileView.jsx](file:///d:/dev/arise/src/pages/Shortexp/ShortExpEntryMobileView.jsx))**:
   - **Setup View**: Sticky `NavBar` with unit badge, native `Picker` wheel for choosing Rak, and instant SearchBar with tap-to-edit drug cards opening [ShortExpModal.jsx](file:///d:/dev/arise/src/components/ShortExpModal.jsx).
   - **Active Recording View**: Sticky header with Rak tag and item counter, progress bar, current drug info card with PKU badge, and `MobileBatchEditor` (`CapsuleTabs`, `-` / `+` quantity steppers, `DatePicker` popup for expiry date, and optional remarks).
   - Sticky bottom navigation bar with `[ < Previous ]` and `[ Next Item > ]` / `[ Finish & Return ✓ ]`.
4. **Thin Coordinator ([ShortExpEntry.jsx](file:///d:/dev/arise/src/pages/Shortexp/ShortExpEntry.jsx))**:
   - Seamless dynamic routing between desktop and mobile based on `useIsMobile(768)`.

#### Short Expiry Archive Mobile Adaptation: [ShortExpArchive.jsx](file:///d:/dev/arise/src/pages/Shortexp/ShortExpArchive.jsx)
Implemented the "Share Logic, Split the View" pattern with `antd-mobile` alongside desktop Ant Design:
1. **Shared Headless Logic ([useShortExpArchive.js](file:///d:/dev/arise/src/pages/Shortexp/useShortExpArchive.js))**:
   - Manages archive dates fetching, date selection, archived drugs loading, item search, and Excel spreadsheet export (`xlsx`).
   - Pure JS implementation without raw JSX.
2. **Desktop View ([ShortExpArchiveDesktopView.jsx](file:///d:/dev/arise/src/pages/Shortexp/ShortExpArchiveDesktopView.jsx))**:
   - 100% of the desktop Ant Design table experience preserved for screens $\ge 768\text{px}$.
   - Full table with 6M..1M monthly breakdown, Ant Design Select for dates, and Export Excel button.
3. **Mobile Touch View ([ShortExpArchiveMobileView.jsx](file:///d:/dev/arise/src/pages/Shortexp/ShortExpArchiveMobileView.jsx))**:
   - Sticky `NavBar` with unit badge and top Excel export trigger.
   - Touch date selector pill opening a native `Picker` wheel for archive dates.
   - Real-time `SearchBar` for drug name, batch no, or PKU.
   - Touch cards with batch badges, PKU tags, shelf row, total quantity, and archiver name.
   - Mobile stepper pagination and sticky bottom summary bar.
4. **Thin Coordinator ([ShortExpArchive.jsx](file:///d:/dev/arise/src/pages/Shortexp/ShortExpArchive.jsx))**:
   - Seamless dynamic routing between desktop and mobile based on `useIsMobile(768)`.



#### Admin Menu Page Mobile Adaptation: [AdminMenu.jsx](file:///d:/dev/arise/src/pages/Admin/AdminMenu.jsx)
Implemented the "Share Logic, Split the View" pattern with `antd-mobile` alongside desktop Ant Design:
1. **Shared Headless Logic ([useAdminMenu.js](file:///d:/dev/arise/src/pages/Admin/useAdminMenu.js))**:
   - Manages tab navigation state and full database Excel export across Inventory and Indent records.
   - Zero raw JSX in hook to ensure clean compilation.
2. **Desktop View ([AdminMenuDesktopView.jsx](file:///d:/dev/arise/src/pages/Admin/AdminMenuDesktopView.jsx))**:
   - 100% of the desktop Ant Design tabs preserved for screens $\ge 768\text{px}$.
   - User Management table, Inventory settings, Audit logs table, dbdiagram iframe, and System Values cards.
3. **Mobile Touch View ([AdminMenuMobileView.jsx](file:///d:/dev/arise/src/pages/Admin/AdminMenuMobileView.jsx))**:
   - Sticky header with `NavBar`, title, back navigation to `/home`, and top `Export` button.
   - Smooth `CapsuleTabs` touch navigation (`Users`, `Inventory`, `Audit`, `Schema`, `Values`).
   - Mobile User Management with instant search bar, `+ New User` button, touch user cards, and slide-up edit/create modals.
   - Mobile Audit Logs with real-time search, refresh action, and color-coded event badges.
   - Mobile System Values with horizontal sub-section pills, color dot indicators, and streamlined add/edit forms.
   - Mobile DB Schema viewer container with responsive iframe.
4. **Thin Coordinator ([AdminMenu.jsx](file:///d:/dev/arise/src/pages/Admin/AdminMenu.jsx))**:
   - Seamless dynamic routing between desktop and mobile based on `useIsMobile(768)`.



#### Short Expiry Page Mobile Adaptation: [ShortExpPage.jsx](file:///d:/dev/arise/src/pages/Shortexp/ShortExpPage.jsx)
Implemented the "Share Logic, Split the View" pattern with `antd-mobile` alongside desktop Ant Design:
1. **Shared Headless Logic ([useShortExpPage.js](file:///d:/dev/arise/src/pages/Shortexp/useShortExpPage.js))**:
   - Manages short expiry items loading for the active unit (`OPD`, etc.), item normalization, and expiry date sorting.
   - Provides live search filtering (drug name, batch no, PKU) and urgency filters (`critical` < 30 days, `warning` < 90 days).
   - Preserves 6M/5M/4M/3M/2M/1M monthly breakdown Excel export (`xlsx`).
   - Manages Issuer archival & database clearing workflow.
   - Zero raw JSX in hook to prevent esbuild compilation issues.
2. **Desktop View ([ShortExpDesktopView.jsx](file:///d:/dev/arise/src/pages/Shortexp/ShortExpDesktopView.jsx))**:
   - 100% of the original Ant Design table experience preserved for screens $\ge 768\text{px}$.
   - Horizontal table with fixed left column, monthly countdown columns, pagination, and `onRow` click handler.
3. **Mobile Touch View ([ShortExpMobileView.jsx](file:///d:/dev/arise/src/pages/Shortexp/ShortExpMobileView.jsx))**:
   - Sticky header with `NavBar`, active unit badge, `+ Entry` shortcut button, and integrated `SearchBar`.
   - Urgency filter pills with live counts (`All`, `Critical <30d` with red indicator, `Upcoming <90d` with amber indicator).
   - High-contrast touch cards featuring color-coded urgency borders, batch tags, days-left badges, shelf row, and bold total quantity counters.
   - One-tap card click triggers [ShortExpModal.jsx](file:///d:/dev/arise/src/components/ShortExpModal.jsx) (which routes to touch bottom sheet [ShortExpMobilePopup.jsx](file:///d:/dev/arise/src/components/ShortExpMobilePopup.jsx)).
   - Sticky bottom action bar with Excel export and Issuer archive trigger with `Dialog.confirm` and `SafeArea`.
4. **Thin Coordinator ([ShortExpPage.jsx](file:///d:/dev/arise/src/pages/Shortexp/ShortExpPage.jsx))**:
   - Seamless dynamic routing between desktop and mobile based on `useIsMobile(768)`.



#### Indent Record Page Mobile Adaptation: [IndentRecordPage.jsx](file:///d:/dev/arise/src/pages/Cart/IndentRecordPage.jsx)
Implemented the "Share Logic, Split the View" pattern with `antd-mobile` alongside desktop Ant Design:
1. **Shared Headless Logic ([useIndentRecord.js](file:///d:/dev/arise/src/pages/Cart/useIndentRecord.js))**:
   - Manages indent records and adhoc requests fetching, item deduplication, and combined sorting.
   - Centralizes filtering by date range, indenter user, and debounced item name search.
   - Preserves full Kew.PS-8 PDF generation (`jsPDF` + `jspdf-autotable`) and Excel spreadsheet export (`xlsx`).
   - Handles multi-row selection, batch export, and pagination calculations.
2. **Desktop View ([IndentRecordDesktopView.jsx](file:///d:/dev/arise/src/pages/Cart/IndentRecordDesktopView.jsx))**:
   - 100% of the original Ant Design desktop table preserved for screens $\ge 768\text{px}$.
   - Multi-column sorters, expandable table rows, `RangePicker`, and `Select` dropdown.
3. **Mobile Touch View ([IndentRecordMobileView.jsx](file:///d:/dev/arise/src/pages/Cart/IndentRecordMobileView.jsx))**:
   - Sticky header with `NavBar`, unit badge, and search bar.
   - Filter pills with native wheel `Picker` for indenters and quick date range presets (`Today`, `7 Days`, `This Month`, `Custom`).
   - Touch cards per record with status tags, metadata badges, and expandable item rows.
   - Individual 1-tap Kew.PS-8 PDF preview per record.
   - Floating batch action bottom bar for multi-selected Kew.PS-8 PDF and Excel export with `SafeArea`.
4. **Thin Coordinator ([IndentRecordPage.jsx](file:///d:/dev/arise/src/pages/Cart/IndentRecordPage.jsx))**:
   - Dynamic view routing at the `768px` breakpoint via `useIsMobile`.



#### Cart Page Mobile Adaptation: [CartPage.jsx](file:///d:/dev/arise/src/pages/Cart/CartPage.jsx)
Implemented the "Share Logic, Split the View" pattern with `antd-mobile` alongside desktop Ant Design:
1. **Shared Headless Logic ([useCartPage.js](file:///d:/dev/arise/src/pages/Cart/useCartPage.js))**:
   - Manages submitted cart session fetching, item deduplication, and selection.
   - Handles item quantity modification and clearance dialogs.
   - Automates PhIS batch bot execution with real-time SSE event streaming and abort handling.
   - Kew.PS-8 PDF multi-page generation and live preview with `jsPDF` and `jspdf-autotable`.
2. **Desktop View ([CartDesktopView.jsx](file:///d:/dev/arise/src/pages/Cart/CartDesktopView.jsx))**:
   - Full-width desktop collapsible panels, bulk selection checkboxes, and item tables.
   - PhIS bot execution modal with terminal-style logs and success report dialogs.
3. **Mobile Touch View ([CartMobileView.jsx](file:///d:/dev/arise/src/pages/Cart/CartMobileView.jsx))**:
   - Touch cards per session with expandable item lists and visual status tags.
   - One-tap quantity adjustment bottom sheet (`Popup`) with increment/decrement steppers.
   - Mobile PhIS automation modal with live log terminal and easy-copy Indent number button.
   - Floating sticky bottom bar for batch Kew.PS-8 PDF export and select all.
4. **Thin Coordinator ([CartPage.jsx](file:///d:/dev/arise/src/pages/Cart/CartPage.jsx))**:
   - Seamless dynamic routing between desktop and mobile based on `useIsMobile(768)`.


#### 1. Extracted Shared Logic: [useIndentPage.js](file:///d:/dev/arise/src/pages/Indent/useIndentPage.js)
Centralized 100% of the inventory loading, filtering, pagination, and modal selection logic:
- Fetches full departmental inventory for the active unit (`OPD`, `IPD`, `ED`, etc.).
- Dynamically extracts unique shelf rows (`indentRows`) and sources (`indentSources`).
- Manages multi-dimensional filtering (live search query, shelf row, and source).
- Handles pagination calculations (`paginatedDrugs`, `totalPages`, `handlePageChange`).
- Manages drug selection and indent modal visibility.

#### 2. Preserved Desktop Experience: [IndentDesktopView.jsx](file:///d:/dev/arise/src/pages/Indent/IndentDesktopView.jsx)
Maintains the complete original Ant Design desktop layout for screens $\ge 768\text{px}$:
- Table and List view switcher (`TableOutlined`, `UnorderedListOutlined`).
- Desktop Table with multi-column sorting, pagination, and horizontal scroll.
- Responsive right margin offset for the desktop side drawer.

#### 3. Created Mobile Touch Experience: [IndentMobileView.jsx](file:///d:/dev/arise/src/pages/Indent/IndentMobileView.jsx)
Built a high-performance, touch-first catalog interface with `antd-mobile`:
- **Sticky Header**: `NavBar` with department unit badge (`OPD`) and integrated `SearchBar` for quick search by drug name, item code, PKU, or row.
- **Filter Pills with Native Wheel Pickers**:
  - **Shelf Row Pill**: Tapping opens an `antd-mobile` `Picker` wheel to filter by shelf.
  - **Source Pill**: Tapping opens a `Picker` wheel to filter by source (`STORE`, `SUBSTORE`, etc.).
  - **Clear Filters Tag**: One-tap button to reset all filters.
- **Touch Drug Cards**:
  - Drug name with warm amber `PKU` tag, unit, and purchase type badges.
  - Clear stock indicators: `Max: X` | `Bal: Y` with auto-calculated `Suggested: Z`.
  - Prominent **+ Indent** button / whole card click target.
- **Mobile Stepper Pagination**: Compact, thumb-friendly `[Prev]` and `[Next]` pagination bar with current page indicator.

#### 4. Upgraded Indent Drawer to Mobile Bottom Sheet: [IndentMobilePopup.jsx](file:///d:/dev/arise/src/pages/Indent/IndentMobilePopup.jsx) & [IndentModal.jsx](file:///d:/dev/arise/src/pages/Indent/IndentModal.jsx)
Previously, [IndentModal.jsx](file:///d:/dev/arise/src/pages/Indent/IndentModal.jsx) used an unmasked desktop side drawer (`width={500}`) that overflowed portrait mobile screens.
- **Desktop**: Retains the existing side `Drawer`.
- **Mobile**: Automatically switches via `useIsMobile(768)` to a slide-up bottom sheet (`Popup`):
  - Drug summary card (Name, PKU, Unit, Shelf Row, Purchase Type).
  - Quota vs Balance with `NIL (0)`, `MAX (quota)`, and `-` / `+` steppers.
  - Auto-calculated Indent Quantity with `-` and `+` adjustment buttons.
  - Optional Remarks `TextArea` with character counter.
  - Sticky bottom action buttons with `SafeArea` (`Cancel` and `Add to Cart`).

#### 5. Connected the Coordinator: [IndentPage.jsx](file:///d:/dev/arise/src/pages/Indent/IndentPage.jsx)
```jsx
const IndentPage = () => {
    const isMobile = useIsMobile(768);
    const indentPageState = useIndentPage();

    return isMobile ? (
        <IndentMobileView {...indentPageState} />
    ) : (
        <IndentDesktopView {...indentPageState} />
    );
};
```

## \[Unreleased\] - 2026-10-19

### Added

#### 1. Extracted Shared Logic: [useRoutineSummary.js](file:///d:/dev/arise/src/pages/Indent/useRoutineSummary.js)
Moved 100% of the session data fetching, inventory alignment, item editing, and submission logic into a headless custom hook:
- Loads active draft session (`/indent_sessions/draft`) and retrieves all indented items.
- Aligns full rack inventory to automatically surface un-indented shelf items as mock items (`requested_qty: 0`).
- Manages single-item editing (updating requested qty, balance, inventory sync, and remarks).
- Calculates key metrics: `totalCount`, `indentedCount`, `lastItemIndex`, and `progressPercent`.
- Handles resume routing (`/routine-indent?rak=${rak}&resumeItemId=...`).
- Handles final submission (`/indent_items/bulk` and updating session status to `Submitted`).
- Provides quick stock adjustment helpers (`setEditBalanceQuick`, `adjustEditBalance`, `adjustEditQty`).

#### 2. Preserved Desktop Experience: [RoutineSummaryDesktopView.jsx](file:///d:/dev/arise/src/pages/Indent/RoutineSummaryDesktopView.jsx)
Maintains the complete original Ant Design desktop layout for screens $\ge 768\text{px}$:
- Table view and List view toggles (`TableOutlined`, `UnorderedListOutlined`).
- Desktop Table with custom scroll and row-click edit modal (`width={800}`).
- Desktop progress bar, Rak tag, and resume affix.

#### 3. Created Mobile Touch Experience: [RoutineSummaryMobileView.jsx](file:///d:/dev/arise/src/pages/Indent/RoutineSummaryMobileView.jsx)
Crafted specifically for pharmacy staff reviewing and confirming indents on mobile:
- **Sticky Header**: `NavBar` with shelf name (`Rak ${rak} Summary`) and a quick **Resume** action button to jump directly back to shelf walking.
- **Session Metrics Card**:
  - Highlights session creator and timestamp.
  - Overall progress bar with `Stopped at item X of Y` indicator.
  - 3-column stats summary: **Total Items**, **Indented** (green), and **NIL / 0**.
- **Search & Filter Tabs**:
  - `SearchBar` to find medicines or PKUs instantly.
  - `CapsuleTabs` to quickly filter by:
    - `All (${total})`
    - `Indented (${indentedCount})`
    - `NIL (${zeroCount})`
- **Touch Item Cards**:
  - Clear drug name with warm amber PKU pill.
  - Quota and shelf balance indicators (`Max: X | Bal: Y`).
  - Distinct requested quantity display with green check indicator.
  - Remarks snippet preview if notes were added.
  - `Last Stopped` badge marking the item where the user stopped counting.
- **Item Edit Bottom Sheet (`Popup`)**:
  - Tapping any card opens a slide-up bottom sheet instead of a desktop dialog.
  - Includes `NIL (0)` and `MAX (quota)` quick-tap presets, plus numeric steppers (`-` / `+`).
  - Short Expiry button opening the mobile [ShortExpModal.jsx](file:///d:/dev/arise/src/components/ShortExpModal.jsx).
  - Multi-line remarks `TextArea` with character counter.
- **Sticky Bottom Action Bar**:
  - Pinned with `SafeArea` at the bottom of the screen.
  - Prominent **Confirm & Send ({count} Items)** button with a mobile confirmation prompt (`Dialog.confirm`) before final submission to Substore/Issuer.

#### 4. Connected the Coordinator: [RoutineSummaryPage.jsx](file:///d:/dev/arise/src/pages/Indent/RoutineSummaryPage.jsx)
```jsx
const RoutineSummaryPage = () => {
    const isMobile = useIsMobile(768);
    const summaryState = useRoutineSummary();

    return isMobile ? (
        <RoutineSummaryMobileView {...summaryState} />
    ) : (
        <RoutineSummaryDesktopView {...summaryState} />
    );
};
```

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