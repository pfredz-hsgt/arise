# Changelog

### Summary of Changes v1.1.7 - Cancel Indent Support for Routine Indent and Summary

Added a dedicated **"Cancel Indent"** capability to stop, clear, and permanently discard an active Routine Indent draft session from both the step-by-step shelf audit (`RoutineIndentPage`) and the review screen (`RoutineSummaryPage`), across both desktop and mobile viewports.

#### Changes Implemented:

1. **Backend Session Deletion Endpoint ([`backend/routes/indent_sessions.js`](arise/backend/routes/indent_sessions.js))**:
   - Implemented `DELETE /api/indent_sessions/:id` endpoint with user ownership verification (`WHERE id = $1 AND (user_id = $2 OR $3 = 'Admin')`).
   - Relies on PostgreSQL's `ON DELETE CASCADE` constraint on `indent_items(session_id)` to automatically wipe all line items associated with the cancelled session.
   - Preserves draft cleanup endpoint `DELETE /api/indent_sessions/drafts/cleanup` for batch cleanup routines.

2. **Frontend Headless State & API Hooks**:
   - **Routine Indent Hook ([`src/pages/Indent/useRoutineIndent.js`](arise/src/pages/Indent/useRoutineIndent.js))**:
     - Added `cancelling` loading state and `cancelIndent` async function.
     - Calls `DELETE /api/indent_sessions/:id` (with fallback to draft cleanup), displays a toast notification (`"Routine indent session cancelled and cleared."`), and navigates back to `/home`.
   - **Routine Summary Hook ([`src/pages/Indent/useRoutineSummary.js`](arise/src/pages/Indent/useRoutineSummary.js))**:
     - Added `cancelling` state and `cancelIndent` handler to allow discarding the draft session directly from the summary/review page before submitting to cart.

3. **Desktop View Integration**:
   - **Routine Indent Desktop ([`src/pages/Indent/RoutineIndentDesktopView.jsx`](arise/src/pages/Indent/RoutineIndentDesktopView.jsx))**:
     - Integrated Ant Design `Modal.confirm` with danger action styling and warning iconography to prevent accidental session abandonment.
     - Added **Cancel Indent** button in the **Top Header Card** (beside completion progress), the **Bottom Navigation Bar** (beside "Previous"), and in the **Empty Shelf State**.
   - **Routine Summary Desktop ([`src/pages/Indent/RoutineSummaryDesktopView.jsx`](arise/src/pages/Indent/RoutineSummaryDesktopView.jsx))**:
     - Added `Modal.confirm` safeguard.
     - Added **Cancel Indent** button in both the **Top Action Bar** (beside "Resume Shelf Walk") and the **Bottom Sticky Action Footer** (beside "Resume Shelf Walk" and "Confirm & Send to Cart").

4. **Mobile View Integration**:
   - **Routine Indent Mobile ([`src/pages/Indent/RoutineIndentMobileView.jsx`](arise/src/pages/Indent/RoutineIndentMobileView.jsx))**:
     - Integrated touch-native Ant Design Mobile `Dialog.confirm` prompt.
     - Added **Cancel Indent** button in the **Sticky Top `NavBar`** (beside item counter), a dedicated button in the **Inspection Card Area**, and a return button in the **Empty Shelf State**.
   - **Routine Summary Mobile ([`src/pages/Indent/RoutineSummaryMobileView.jsx`](arise/src/pages/Indent/RoutineSummaryMobileView.jsx))**:
     - Added `Dialog.confirm` safeguard.
     - Added **Cancel** button in the **Sticky Top `NavBar`** (beside "Resume") and in the **Fixed Bottom Action Bar** (beside "Confirm & Submit").

---

### Hotfix 1.1.6 - Table Overlapping Sidebar Issue

The issue was caused by a **state desynchronization** between Ant Design’s `<Sider>` component and the main layout’s margin in [`MainLayout.jsx`](arise/src/components/Layout/MainLayout.jsx):

```jsx
// Before:
<Sider
    breakpoint="lg"
    collapsedWidth="0"
    onCollapse={setCollapsed}
    ...
/>
...
<Layout style={{ marginLeft: isMobile ? 0 : (collapsed ? 0 : 200) }}>
```

#### 1. Why the Content Overlapped the Sidebar
* Ant Design's `<Sider>` had `breakpoint="lg"` (992px) with `onCollapse={setCollapsed}`, but **was not given `collapsed={collapsed}` as a prop** (it was uncontrolled).
* When the breakpoint was triggered, Ant Design called `onCollapse(true)`, setting `collapsed = true` in React state.
* This caused `<Layout>` to calculate `marginLeft: 0px`.
* However, on desktop viewports, `<Sider>` rendered expanded at **200px** with `position: fixed; left: 0`.
* With `marginLeft: 0px`, the entire content area (tabs, search bar, and tables) shifted 200px to the left and rendered **directly on top of the fixed sidebar**.

#### 2. Why It Specifically Happened on Pages with Tables
* **Vertical Scrollbar Width (17px)**: Pages without tables (like `Home` or step-by-step `Routine Indent`) often fit within the screen height. When navigating to pages with large tables (such as `Admin / Inventory Settings`, `Routine Summary`, `Records`, or `Short Expiry`), hundreds of rows load and inject a vertical scrollbar. On screens near the 992px boundary (e.g. 1024px monitors, laptop screens with 125%/150% Windows scaling, or split/half-screen windows), the 17px vertical scrollbar reduced the client width below 991.98px, immediately firing Ant Design's `breakpoint="lg"` collapse.
* **Table Reflow & ResizeObserver**: Ant Design tables with `scroll={{ x: ... }}` use `rc-resize-observer` to measure container widths and trigger window reflows, causing Ant Design's responsive handler to evaluate during layout recalculations.

#### 3. Why Refresh (F5) Returned It to Normal
* `<Sider>` only calls `onCollapse` when crossing breakpoints, not on mount. Once `collapsed` was set to `true`, the React state remained permanently stuck at `true` during client-side SPA navigation.
* Pressing **Refresh (F5)** performed a full page reload, re-initializing the React state back to its default (`collapsed = false`), which restored `marginLeft: 200px`.

---

### Solution Applied

In [`MainLayout.jsx`](arise/src/components/Layout/MainLayout.jsx):

1. **Eliminated State-Driven Margin Conflicts**:
   Removed the brittle JS-based `marginLeft` calculation and the uncontrolled `breakpoint="lg"` / `onCollapse` from `<Sider>`.
2. **CSS Media-Query Driven Layout**:
   Moved the margin and visibility behavior to CSS media queries:
   * **`>= 992px` (Desktop)**: `.main-content-layout` has `margin-left: 200px !important`, ensuring the 200px fixed sidebar and content never overlap.
   * **`< 992px` (Tablet & Mobile)**: `.main-content-layout` has `margin-left: 0 !important`, while the desktop sidebar is cleanly hidden and replaced with the drawer / bottom bar.
3. **Table Flex Protection**:
   Added `min-width: 0` to `.main-content-layout` and `.site-content` so wide tables with horizontal scroll (`scroll={{ x: 1400 }}`) remain contained within their parent without causing layout shifts.

---

### Summary of Changes v1.1.6

Implemented a dedicated touch-optimized mobile view for the Inventory page ([`src/pages/Admin/InventoryTable.jsx`](/arise/src/pages/Admin/InventoryTable.jsx)), replacing the wide desktop table on mobile devices with modern touch-friendly cards, search, filters, and mobile-adapted modals.

### Changes Implemented:

1. **Coordinator Refactoring ([`InventoryTable.jsx`](/arise/src/pages/Admin/InventoryTable.jsx))**:
   - Refactored `InventoryTable` into a thin coordinator adhering to the codebase convention (`useIsMobile(768)`).
   - Renders touch-optimized [`InventoryMobileView.jsx`](/arise/src/pages/Admin/InventoryMobileView.jsx) on mobile viewports (< 768px).
   - Preserves 100% of the desktop table functionality without regression via [`InventoryDesktopView.jsx`](/arise/src/pages/Admin/InventoryDesktopView.jsx) on desktop (>= 768px).

2. **Shared State & Logic ([`useInventoryTable.js`](/arise/src/pages/Admin/useInventoryTable.js))**:
   - Extracted shared state management, real-time search filtering, lookup fetches (`units`, `sources`, `types`, `purchasetypes`, `stdkts`), and CRUD operations (`handleAdd`, `handleEdit`, `handleDelete`, `handleSubmit`).
   - Added multi-criteria filtering (Main Unit, Shelf Row, Indent Source, Item Type, Purchase Type) and sorting (Name A-Z/Z-A, Shelf Location, Balance High/Low).

3. **Touch-First Mobile Interface ([`InventoryMobileView.jsx`](/arise/src/pages/Admin/InventoryMobileView.jsx))**:
   - **Top Search & Action Bar**: Real-time `antd-mobile` SearchBar with quick clear and pill-shaped `+ New Drug` button.
   - **Department Filter Pills**: Horizontal touch-scrollable unit chips (`All Units`, `OPD`, `IPD`, `ED`) with active department colors.
   - **Advanced Filter & Sort Popups**: Bottom sheet modals for multi-attribute filtering (Shelf Row, Source, Type, Purchase Type) and fast sort order switching.
   - **Interactive Drug Cards**:
     - Prominent drug name and department badge.
     - Item code, PKU, and convert SKU tags.
     - Location capsule (`Row`, `Tingkat`, `Petak`) and color-coded stock balance (`Bal: X / Max: Y`).
     - Classification tags with standard color mappings.
     - Quick Edit button and Popconfirm-protected Delete button.
   - **Mobile Pagination**: 15 items per page with Prev/Next controls and page indicators.
   - **Mobile Add/Edit Modal**: Centered touch modal with scrollable form body and sticky bottom action buttons (`Update Drug`, `Delete`, `Cancel`), preventing screen cutoffs on mobile viewports.

4. **Container Integration ([`AdminMenuMobileView.jsx`](/arise/src/pages/Admin/AdminMenuMobileView.jsx))**:
   - Seamlessly integrated `<InventoryTable />` into Tab 2 ("Inventory") without artificial card nesting, matching the visual rhythm of Users and Audit tabs.

---

### Summary of Changes v1.1.5

Added an exception allowing the **Issuer** role with `main_unit = 'OPD'` to view and process cart items and sessions for **ED** (Emergency Dept) alongside **OPD**, because ED is operationally part of OPD, while maintaining **IPD** (Inpatient Dept) strictly isolated and keeping the **Indenter** role scoped strictly to their respective units.

### Changes Implemented:

1. **Backend Unit Resolution (`indents.js`)**:
   - Implemented `resolveUnits(req, requestedUnit)` in [`backend/routes/indents.js`](/arise/backend/routes/indents.js).
   - If user is `Issuer` and effective unit is `'OPD'`, expands target units to `['OPD', 'ED']` using Postgres array matching `u.main_unit = ANY($1::text[])`.
   - Updated `GET /indents/cart`, `GET /indents/records`, `GET /indents/approved-dates`, `GET /indents/approved`, and `GET /indents/`.
   - Maintained strict isolation for `IPD` (`['IPD']`) and kept indent validation in `indent_items.js` and `indents.js` untouched for `Indenter` role.

2. **Frontend Cart State Management (`useCartPage.js` & `useIndentRecord.js`)**:
   - Preserved `user_main_unit` on ad-hoc request groups in [`useCartPage.js`](/arise/src/pages/Cart/useCartPage.js) and [`useIndentRecord.js`](/arise/src/pages/Cart/useIndentRecord.js).
   - Added client-side `unitFilter` (`'ALL'`, `'OPD'`, `'ED'`), `unitCounts`, and `filteredSessions` memoization for OPD Issuers.

3. **Cart UI Views (`CartDesktopView.jsx` & `CartMobileView.jsx`)**:
   - **Desktop View**: Header displays both `OPD` and `ED` tags with descriptive subtitle ("... from OPD & ED waiting for approval"), added `Segmented` unit filter tabs (`All`, `OPD`, `ED`), and displays session `user_main_unit` tags on each session panel.
   - **Mobile View**: NavBar right displays `OPD` and `ED` badges for OPD Issuers, added interactive department filter bar (`All`, `OPD`, `ED`), and displays `user_main_unit` badge on mobile session cards.

---

### Summary of Changes v1.1.4

The text and elements in the `TabBar` inside [`MainLayout.jsx`](/arise/src/components/Layout/MainLayout.jsx) have been made non-selectable with touch callouts disabled.

### Changes Implemented:

1. **Inline Prevention on `mobile-tabbar-container` and `TabBar.Item` title**:
   - Added `userSelect: 'none'`, `WebkitUserSelect: 'none'`, `WebkitTouchCallout: 'none'`, and `WebkitTapHighlightColor: 'transparent'` to the TabBar container at [`MainLayout.jsx:L404-L408`](/arise/src/components/Layout/MainLayout.jsx#L404-L408).
   - Wrapped the item `title` in a `<span>` with explicit non-selectable inline styling at [`MainLayout.jsx:L416-L423`](/arise/src/components/Layout/MainLayout.jsx#L416-L423).

2. **Global CSS Rule in Layout `<style>`**:
   - Added rules targeting `.mobile-tabbar-container` and all child elements (`.mobile-tabbar-container *`) at [`MainLayout.jsx:L525-L534`](/arise/src/components/Layout/MainLayout.jsx#L525-L534):
     ```css
     .mobile-tabbar-container,
     .mobile-tabbar-container * {
       -webkit-touch-callout: none !important;
       -webkit-user-select: none !important;
       -khtml-user-select: none !important;
       -moz-user-select: none !important;
       -ms-user-select: none !important;
       user-select: none !important;
       -webkit-tap-highlight-color: transparent !important;
     }
     ```

This suppresses iOS Safari callout balloons (Look Up, Copy, Share, Search Web) and Android text selection handles when long-pressing or tapping tab bar items.

The non-selectable and touch-callout prevention fix has been applied across all mobile pages and interactive touchable controls.

### Implementation Details:

1. **Global Stylesheet Hardening in [`src/style.css`](/arise/src/style.css#L46-L147)**:
   Added comprehensive mobile rules loaded globally across all routes:
   - **All Buttons & Controls**: Targeted `button`, `[role="button"]`, `.ant-btn`, `.adm-button`, and their descendants with:
     ```css
     -webkit-touch-callout: none !important;
     -webkit-user-select: none !important;
     -khtml-user-select: none !important;
     -moz-user-select: none !important;
     -ms-user-select: none !important;
     user-select: none !important;
     -webkit-tap-highlight-color: transparent !important;
     ```
   - **Mobile UI Elements**: Covers Ant Design Mobile navigation bars ([`.adm-nav-bar`](/arise/src/style.css#L68)), TabBars ([`.adm-tab-bar`](/arise/src/style.css#L64)), Capsule Tabs ([`.adm-capsule-tabs`](/arise/src/style.css#L72)), Segmented controls, Tags, Checkboxes, Dialog buttons, and Dropdowns.
   - **Tap Targets on Mobile Viewports (`@media (max-width: 767.98px)`)**: Elements styled with `cursor: pointer` (filter pills, quick chips, interactive cards, steppers) are automatically non-selectable and callout-free.
   - **Form Input Protection**: Explicitly preserved native cursor positioning and text selection for `input`, `textarea`, `.adm-input-element`, and `.ant-input`.

2. **Inline Hardening on Custom Floating Controls**:
   - Added `userSelect: 'none'`, `WebkitUserSelect: 'none'`, and `WebkitTouchCallout: 'none'` to the floating `+` entry button in [`ShortExpMobileView.jsx:L612-L614`](/arise/src/pages/Shortexp/ShortExpMobileView.jsx#L612-L614).

### Mobile Pages Protected:
- **[`HomeMobileView.jsx`](/arise/src/pages/Home/HomeMobileView.jsx)**: Shelf selector triggers, routine/urgent/short-exp cards, quick shelf audit chips, and drawer action buttons.
- **[`ShortExpMobileView.jsx`](/arise/src/pages/Shortexp/ShortExpMobileView.jsx)**: Filter pills (All, Critical, Upcoming), search clear button, pagination, archive/export buttons, and floating `+` button.
- **[`ShortExpEntryMobileView.jsx`](/arise/src/pages/Shortexp/ShortExpEntryMobileView.jsx)**: Batch tabs, date picker trigger, quantity steppers, and navigation action bar.
- **[`ShortExpArchiveMobileView.jsx`](/arise/src/pages/Shortexp/ShortExpArchiveMobileView.jsx)**: Pagination, filter pills, and Excel export.
- **[`RoutineIndentMobileView.jsx`](/arise/src/pages/Indent/RoutineIndentMobileView.jsx)**: NIL (0) / MAX quick balance buttons, `-` / `+` steppers, expandable remarks trigger, and previous/next buttons.
- **[`RoutineSummaryMobileView.jsx`](/arise/src/pages/Indent/RoutineSummaryMobileView.jsx)**: Resume button, medicine edit cards, edit popup steppers, and fixed bottom "Confirm and Send" button.
- **[`IndentMobileView.jsx`](/arise/src/pages/Indent/IndentMobileView.jsx)**: Row/Source filter buttons, clear filters, add/update item buttons, and bottom cart floating bar.
- **[`CartMobileView.jsx`](/arise/src/pages/Cart/CartMobileView.jsx)** & **[`IndentRecordMobileView.jsx`](/arise/src/pages/Cart/IndentRecordMobileView.jsx)**: Header navigation, user and date preset pills, order action cards, PDF/Excel buttons, and stepper controls.
- **[`LoginMobileView.jsx`](/arise/src/pages/Auth/LoginMobileView.jsx)**: "Sign In" button, "Forgot Password?" trigger, and reset modal buttons.
- **[`AdminMenuMobileView.jsx`](/arise/src/pages/Admin/AdminMenuMobileView.jsx)**: Header back arrow, capsule tabs, and action buttons.


1. **Coordinator: [`LoginPage.jsx`](/arise/src/pages/Auth/LoginPage.jsx)**:
   - Refactored into a thin coordinator detecting `useIsMobile(768)`.
   - Delegates state management to `useLoginPage` and renders [`LoginMobileView.jsx`](/arise/src/pages/Auth/LoginMobileView.jsx) on mobile or [`LoginDesktopView.jsx`](/arise/src/pages/Auth/LoginDesktopView.jsx) on desktop.

2. **Headless Logic: [`useLoginPage.js`](/arise/src/pages/Auth/useLoginPage.js)**:
   - Houses login submission, recovery link dispatching, error feedback, modal/loading state, and routing logic shared across both viewports.

3. **Desktop View: [`LoginDesktopView.jsx`](/arise/src/pages/Auth/LoginDesktopView.jsx)**:
   - Preserves the existing desktop glassmorphism design with radial gradients and desktop modal.

4. **Touch-First Mobile View: [`LoginMobileView.jsx`](/arise/src/pages/Auth/LoginMobileView.jsx)**:
   - **Hero Header**: Features the hospital pharmacy blue gradient (`#001529` to `#00457c`) with subtle ambient glow, drop-shadowed ARISE logo, signature metallic gradient branding, and Segamat hospital badge.
   - **Mobile Form Card**: Floating card with rounded corners (`22px`), comfortable touch inputs with prefix icons (email, password), and primary gradient Sign In button (`48px` touch target) with loading spinner.
   - **Mobile Forgot Password Drawer (`Popup`)**: Replaces the desktop dialog with an `antd-mobile` slide-up bottom sheet drawer with grab indicator, recovery instruction card, email input, and full-width reset trigger.
   - **Device Integration**: Uses `<SafeArea position="top" />` and `<SafeArea position="bottom" />` for safe display on modern phone screens with notches and home indicators.

Added the **Edit Profile** menu option and mobile slide-up drawer to [`HomeMobileView.jsx`](/arise/src/pages/Home/HomeMobileView.jsx):

### Implementation Details

1. **Updated `userMenu` in [`HomeMobileView.jsx`](/arise/src/pages/Home/HomeMobileView.jsx)**:
   - Added `Edit Profile` with `<UserOutlined />` icon.
   - Clicking triggers `openEditProfile()`, pre-populating current user data into the form and opening the drawer.

2. **Mobile Edit Profile Bottom Sheet Drawer (`Popup`)**:
   - **Slide-up Bottom Sheet**: Styled with rounded top corners, top drag indicator, title header, and close button.
   - **Account Information Card**: Fields for **Full Name** and **Email Address** with validation.
   - **Change Password (Collapsible)**: Fields for **New Password** and **Confirm Password** with matching validator and show/hide password toggles.
   - **PHIS Credentials (Collapsible)**: Fields for optional **PHIS Username** and **PHIS Password**.
   - **Sticky Bottom Action Bar**: Sticky footer with **Cancel** and primary **Save Changes** buttons, including safe area padding and loading state.
   - **Full State Integration**: Uses `updateProfile` and `changePassword` from `useAuth()` matching the desktop edit profile logic.

The **Entry** button on [`ShortExpMobileView.jsx`](/arise/src/pages/Shortexp/ShortExpMobileView.jsx) has been converted to a floating `+` action button:

### Changes Made

1. **Cleaned up NavBar Header**:
   - Removed the compact `Entry` button that was in the title bar next to "Short Expiry", restoring the standard centered title header with the unit badge on the right.

2. **Added Floating `+` Action Button (FAB)**:
   - Placed a floating circular `+` button positioned at `bottom: 114px` and `right: 18px` so it floats above the bottom export/archive action bar and the persistent `TabBar`.
   - Styled with a primary blue gradient (`#1677ff` to `#0958d9`), elevated drop shadow, smooth active press animation (`scale(0.92)` on tap), and navigates directly to `/shortexp-entry`.




1. **Persistent Mobile TabBar in [`MainLayout.jsx`](/arise/src/components/Layout/MainLayout.jsx)**:
   - Integrated the Ant Design Mobile `TabBar` persistently at the bottom of `MainLayout` when on mobile viewports (`isMobile`).
   - Automatic route-aware tab activation via `getActiveMobileTab(location.pathname)`:
     - **Home** (`/home`)
     - **Routine** (`/routine-summary`, `/routine-indent`)
     - **Urgent** (`/indent`)
     - **Cart** (`/cart`, for Issuers)
     - **Short Exp** (`/shortexp`, `/shortexp-entry`, `/shortexp-archive`)
     - **Records** (`/indent-list`)
   - Navigation via `handleMobileTabChange` triggers client-side routing smoothly.

2. **Hidden Header and Sidebar Navigation on Mobile**:
   - Conditioned `<Header className="site-header">` to render only on non-mobile screens (`!isMobile`).
   - Conditioned the drawer navigation (`<Drawer className="mobile-drawer">`) and desktop sidebar (`<Sider>`) to stay hidden on mobile.
   - Set layout margin to `marginLeft: 0` on mobile, removing the desktop sidebar offset and 64px header margin.
   - Updated responsive CSS in both [`MainLayout.jsx`](/arise/src/components/Layout/MainLayout.jsx) and [`style.css`](/arise/src/style.css) so `.site-content` renders edge-to-edge with no clipping or gaps.

3. **Removed Redundant TabBar from [`HomeMobileView.jsx`](/arise/src/pages/Home/HomeMobileView.jsx)**:
   - Removed the local fixed `TabBar` and `onTabChange` handler from `HomeMobileView.jsx`.
   - Added a compact user avatar dropdown (Profile info & Sign Out) in the top department greeting banner beside the unit badge so mobile users can manage their profile and sign out without needing the desktop header.

4. **Coordinated Floating Bottom Action Bars**:
   - Adjusted sticky/floating action bars in [`RoutineSummaryMobileView.jsx`](/arise/src/pages/Indent/RoutineSummaryMobileView.jsx), [`RoutineIndentMobileView.jsx`](/arise/src/pages/Indent/RoutineIndentMobileView.jsx), [`IndentMobileView.jsx`](/arise/src/pages/Indent/IndentMobileView.jsx), [`ShortExpMobileView.jsx`](/arise/src/pages/Shortexp/ShortExpMobileView.jsx), [`ShortExpEntryMobileView.jsx`](/arise/src/pages/Shortexp/ShortExpEntryMobileView.jsx), [`ShortExpArchiveMobileView.jsx`](/arise/src/pages/Shortexp/ShortExpArchiveMobileView.jsx), and [`IndentRecordMobileView.jsx`](/arise/src/pages/Cart/IndentRecordMobileView.jsx) to sit at `bottom: 50` with bottom padding clearance so they dock neatly above the persistent `TabBar`.

### What Was Done v1.1.3

#### Short Expiry Entry Mobile Adaptation: [ShortExpEntry.jsx](/arise/src/pages/Shortexp/ShortExpEntry.jsx)
Implemented the "Share Logic, Split the View" pattern with `antd-mobile` alongside desktop Ant Design:
1. **Shared Headless Logic ([useShortExpEntry.js](/arise/src/pages/Shortexp/useShortExpEntry.js))**:
   - Manages Rak selection, inventory items iteration, batch saving, and instant drug search.
   - Pure JS implementation without raw JSX.
2. **Desktop View ([ShortExpEntryDesktopView.jsx](/arise/src/pages/Shortexp/ShortExpEntryDesktopView.jsx))**:
   - 100% of the desktop wizard preserved for screens $\ge 768\text{px}$.
   - Card setup with Ant Design Select, Search & Edit Specific Drug Card, and `ShortExpTabs` editable card tabs.
3. **Mobile Touch View ([ShortExpEntryMobileView.jsx](/arise/src/pages/Shortexp/ShortExpEntryMobileView.jsx))**:
   - **Setup View**: Sticky `NavBar` with unit badge, native `Picker` wheel for choosing Rak, and instant SearchBar with tap-to-edit drug cards opening [ShortExpModal.jsx](/arise/src/components/ShortExpModal.jsx).
   - **Active Recording View**: Sticky header with Rak tag and item counter, progress bar, current drug info card with PKU badge, and `MobileBatchEditor` (`CapsuleTabs`, `-` / `+` quantity steppers, `DatePicker` popup for expiry date, and optional remarks).
   - Sticky bottom navigation bar with `[ < Previous ]` and `[ Next Item > ]` / `[ Finish & Return ✓ ]`.
4. **Thin Coordinator ([ShortExpEntry.jsx](/arise/src/pages/Shortexp/ShortExpEntry.jsx))**:
   - Seamless dynamic routing between desktop and mobile based on `useIsMobile(768)`.

#### Short Expiry Archive Mobile Adaptation: [ShortExpArchive.jsx](/arise/src/pages/Shortexp/ShortExpArchive.jsx)
Implemented the "Share Logic, Split the View" pattern with `antd-mobile` alongside desktop Ant Design:
1. **Shared Headless Logic ([useShortExpArchive.js](/arise/src/pages/Shortexp/useShortExpArchive.js))**:
   - Manages archive dates fetching, date selection, archived drugs loading, item search, and Excel spreadsheet export (`xlsx`).
   - Pure JS implementation without raw JSX.
2. **Desktop View ([ShortExpArchiveDesktopView.jsx](/arise/src/pages/Shortexp/ShortExpArchiveDesktopView.jsx))**:
   - 100% of the desktop Ant Design table experience preserved for screens $\ge 768\text{px}$.
   - Full table with 6M..1M monthly breakdown, Ant Design Select for dates, and Export Excel button.
3. **Mobile Touch View ([ShortExpArchiveMobileView.jsx](/arise/src/pages/Shortexp/ShortExpArchiveMobileView.jsx))**:
   - Sticky `NavBar` with unit badge and top Excel export trigger.
   - Touch date selector pill opening a native `Picker` wheel for archive dates.
   - Real-time `SearchBar` for drug name, batch no, or PKU.
   - Touch cards with batch badges, PKU tags, shelf row, total quantity, and archiver name.
   - Mobile stepper pagination and sticky bottom summary bar.
4. **Thin Coordinator ([ShortExpArchive.jsx](/arise/src/pages/Shortexp/ShortExpArchive.jsx))**:
   - Seamless dynamic routing between desktop and mobile based on `useIsMobile(768)`.



#### Admin Menu Page Mobile Adaptation: [AdminMenu.jsx](/arise/src/pages/Admin/AdminMenu.jsx)
Implemented the "Share Logic, Split the View" pattern with `antd-mobile` alongside desktop Ant Design:
1. **Shared Headless Logic ([useAdminMenu.js](/arise/src/pages/Admin/useAdminMenu.js))**:
   - Manages tab navigation state and full database Excel export across Inventory and Indent records.
   - Zero raw JSX in hook to ensure clean compilation.
2. **Desktop View ([AdminMenuDesktopView.jsx](/arise/src/pages/Admin/AdminMenuDesktopView.jsx))**:
   - 100% of the desktop Ant Design tabs preserved for screens $\ge 768\text{px}$.
   - User Management table, Inventory settings, Audit logs table, dbdiagram iframe, and System Values cards.
3. **Mobile Touch View ([AdminMenuMobileView.jsx](/arise/src/pages/Admin/AdminMenuMobileView.jsx))**:
   - Sticky header with `NavBar`, title, back navigation to `/home`, and top `Export` button.
   - Smooth `CapsuleTabs` touch navigation (`Users`, `Inventory`, `Audit`, `Schema`, `Values`).
   - Mobile User Management with instant search bar, `+ New User` button, touch user cards, and slide-up edit/create modals.
   - Mobile Audit Logs with real-time search, refresh action, and color-coded event badges.
   - Mobile System Values with horizontal sub-section pills, color dot indicators, and streamlined add/edit forms.
   - Mobile DB Schema viewer container with responsive iframe.
4. **Thin Coordinator ([AdminMenu.jsx](/arise/src/pages/Admin/AdminMenu.jsx))**:
   - Seamless dynamic routing between desktop and mobile based on `useIsMobile(768)`.



#### Short Expiry Page Mobile Adaptation: [ShortExpPage.jsx](/arise/src/pages/Shortexp/ShortExpPage.jsx)
Implemented the "Share Logic, Split the View" pattern with `antd-mobile` alongside desktop Ant Design:
1. **Shared Headless Logic ([useShortExpPage.js](/arise/src/pages/Shortexp/useShortExpPage.js))**:
   - Manages short expiry items loading for the active unit (`OPD`, etc.), item normalization, and expiry date sorting.
   - Provides live search filtering (drug name, batch no, PKU) and urgency filters (`critical` < 30 days, `warning` < 90 days).
   - Preserves 6M/5M/4M/3M/2M/1M monthly breakdown Excel export (`xlsx`).
   - Manages Issuer archival & database clearing workflow.
   - Zero raw JSX in hook to prevent esbuild compilation issues.
2. **Desktop View ([ShortExpDesktopView.jsx](/arise/src/pages/Shortexp/ShortExpDesktopView.jsx))**:
   - 100% of the original Ant Design table experience preserved for screens $\ge 768\text{px}$.
   - Horizontal table with fixed left column, monthly countdown columns, pagination, and `onRow` click handler.
3. **Mobile Touch View ([ShortExpMobileView.jsx](/arise/src/pages/Shortexp/ShortExpMobileView.jsx))**:
   - Sticky header with `NavBar`, active unit badge, `+ Entry` shortcut button, and integrated `SearchBar`.
   - Urgency filter pills with live counts (`All`, `Critical <30d` with red indicator, `Upcoming <90d` with amber indicator).
   - High-contrast touch cards featuring color-coded urgency borders, batch tags, days-left badges, shelf row, and bold total quantity counters.
   - One-tap card click triggers [ShortExpModal.jsx](/arise/src/components/ShortExpModal.jsx) (which routes to touch bottom sheet [ShortExpMobilePopup.jsx](/arise/src/components/ShortExpMobilePopup.jsx)).
   - Sticky bottom action bar with Excel export and Issuer archive trigger with `Dialog.confirm` and `SafeArea`.
4. **Thin Coordinator ([ShortExpPage.jsx](/arise/src/pages/Shortexp/ShortExpPage.jsx))**:
   - Seamless dynamic routing between desktop and mobile based on `useIsMobile(768)`.



#### Indent Record Page Mobile Adaptation: [IndentRecordPage.jsx](/arise/src/pages/Cart/IndentRecordPage.jsx)
Implemented the "Share Logic, Split the View" pattern with `antd-mobile` alongside desktop Ant Design:
1. **Shared Headless Logic ([useIndentRecord.js](/arise/src/pages/Cart/useIndentRecord.js))**:
   - Manages indent records and adhoc requests fetching, item deduplication, and combined sorting.
   - Centralizes filtering by date range, indenter user, and debounced item name search.
   - Preserves full Kew.PS-8 PDF generation (`jsPDF` + `jspdf-autotable`) and Excel spreadsheet export (`xlsx`).
   - Handles multi-row selection, batch export, and pagination calculations.
2. **Desktop View ([IndentRecordDesktopView.jsx](/arise/src/pages/Cart/IndentRecordDesktopView.jsx))**:
   - 100% of the original Ant Design desktop table preserved for screens $\ge 768\text{px}$.
   - Multi-column sorters, expandable table rows, `RangePicker`, and `Select` dropdown.
3. **Mobile Touch View ([IndentRecordMobileView.jsx](/arise/src/pages/Cart/IndentRecordMobileView.jsx))**:
   - Sticky header with `NavBar`, unit badge, and search bar.
   - Filter pills with native wheel `Picker` for indenters and quick date range presets (`Today`, `7 Days`, `This Month`, `Custom`).
   - Touch cards per record with status tags, metadata badges, and expandable item rows.
   - Individual 1-tap Kew.PS-8 PDF preview per record.
   - Floating batch action bottom bar for multi-selected Kew.PS-8 PDF and Excel export with `SafeArea`.
4. **Thin Coordinator ([IndentRecordPage.jsx](/arise/src/pages/Cart/IndentRecordPage.jsx))**:
   - Dynamic view routing at the `768px` breakpoint via `useIsMobile`.



#### Cart Page Mobile Adaptation: [CartPage.jsx](/arise/src/pages/Cart/CartPage.jsx)
Implemented the "Share Logic, Split the View" pattern with `antd-mobile` alongside desktop Ant Design:
1. **Shared Headless Logic ([useCartPage.js](/arise/src/pages/Cart/useCartPage.js))**:
   - Manages submitted cart session fetching, item deduplication, and selection.
   - Handles item quantity modification and clearance dialogs.
   - Automates PhIS batch bot execution with real-time SSE event streaming and abort handling.
   - Kew.PS-8 PDF multi-page generation and live preview with `jsPDF` and `jspdf-autotable`.
2. **Desktop View ([CartDesktopView.jsx](/arise/src/pages/Cart/CartDesktopView.jsx))**:
   - Full-width desktop collapsible panels, bulk selection checkboxes, and item tables.
   - PhIS bot execution modal with terminal-style logs and success report dialogs.
3. **Mobile Touch View ([CartMobileView.jsx](/arise/src/pages/Cart/CartMobileView.jsx))**:
   - Touch cards per session with expandable item lists and visual status tags.
   - One-tap quantity adjustment bottom sheet (`Popup`) with increment/decrement steppers.
   - Mobile PhIS automation modal with live log terminal and easy-copy Indent number button.
   - Floating sticky bottom bar for batch Kew.PS-8 PDF export and select all.
4. **Thin Coordinator ([CartPage.jsx](/arise/src/pages/Cart/CartPage.jsx))**:
   - Seamless dynamic routing between desktop and mobile based on `useIsMobile(768)`.


#### 1. Extracted Shared Logic: [useIndentPage.js](/arise/src/pages/Indent/useIndentPage.js)
Centralized 100% of the inventory loading, filtering, pagination, and modal selection logic:
- Fetches full departmental inventory for the active unit (`OPD`, `IPD`, `ED`, etc.).
- Dynamically extracts unique shelf rows (`indentRows`) and sources (`indentSources`).
- Manages multi-dimensional filtering (live search query, shelf row, and source).
- Handles pagination calculations (`paginatedDrugs`, `totalPages`, `handlePageChange`).
- Manages drug selection and indent modal visibility.

#### 2. Preserved Desktop Experience: [IndentDesktopView.jsx](/arise/src/pages/Indent/IndentDesktopView.jsx)
Maintains the complete original Ant Design desktop layout for screens $\ge 768\text{px}$:
- Table and List view switcher (`TableOutlined`, `UnorderedListOutlined`).
- Desktop Table with multi-column sorting, pagination, and horizontal scroll.
- Responsive right margin offset for the desktop side drawer.

#### 3. Created Mobile Touch Experience: [IndentMobileView.jsx](/arise/src/pages/Indent/IndentMobileView.jsx)
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

#### 4. Upgraded Indent Drawer to Mobile Bottom Sheet: [IndentMobilePopup.jsx](/arise/src/pages/Indent/IndentMobilePopup.jsx) & [IndentModal.jsx](/arise/src/pages/Indent/IndentModal.jsx)
Previously, [IndentModal.jsx](/arise/src/pages/Indent/IndentModal.jsx) used an unmasked desktop side drawer (`width={500}`) that overflowed portrait mobile screens.
- **Desktop**: Retains the existing side `Drawer`.
- **Mobile**: Automatically switches via `useIsMobile(768)` to a slide-up bottom sheet (`Popup`):
  - Drug summary card (Name, PKU, Unit, Shelf Row, Purchase Type).
  - Quota vs Balance with `NIL (0)`, `MAX (quota)`, and `-` / `+` steppers.
  - Auto-calculated Indent Quantity with `-` and `+` adjustment buttons.
  - Optional Remarks `TextArea` with character counter.
  - Sticky bottom action buttons with `SafeArea` (`Cancel` and `Add to Cart`).

#### 5. Connected the Coordinator: [IndentPage.jsx](/arise/src/pages/Indent/IndentPage.jsx)
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

#### 1. Extracted Shared Logic: [useRoutineSummary.js](/arise/src/pages/Indent/useRoutineSummary.js)
Moved 100% of the session data fetching, inventory alignment, item editing, and submission logic into a headless custom hook:
- Loads active draft session (`/indent_sessions/draft`) and retrieves all indented items.
- Aligns full rack inventory to automatically surface un-indented shelf items as mock items (`requested_qty: 0`).
- Manages single-item editing (updating requested qty, balance, inventory sync, and remarks).
- Calculates key metrics: `totalCount`, `indentedCount`, `lastItemIndex`, and `progressPercent`.
- Handles resume routing (`/routine-indent?rak=${rak}&resumeItemId=...`).
- Handles final submission (`/indent_items/bulk` and updating session status to `Submitted`).
- Provides quick stock adjustment helpers (`setEditBalanceQuick`, `adjustEditBalance`, `adjustEditQty`).

#### 2. Preserved Desktop Experience: [RoutineSummaryDesktopView.jsx](/arise/src/pages/Indent/RoutineSummaryDesktopView.jsx)
Maintains the complete original Ant Design desktop layout for screens $\ge 768\text{px}$:
- Table view and List view toggles (`TableOutlined`, `UnorderedListOutlined`).
- Desktop Table with custom scroll and row-click edit modal (`width={800}`).
- Desktop progress bar, Rak tag, and resume affix.

#### 3. Created Mobile Touch Experience: [RoutineSummaryMobileView.jsx](/arise/src/pages/Indent/RoutineSummaryMobileView.jsx)
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
  - Short Expiry button opening the mobile [ShortExpModal.jsx](/arise/src/components/ShortExpModal.jsx).
  - Multi-line remarks `TextArea` with character counter.
- **Sticky Bottom Action Bar**:
  - Pinned with `SafeArea` at the bottom of the screen.
  - Prominent **Confirm & Send ({count} Items)** button with a mobile confirmation prompt (`Dialog.confirm`) before final submission to Substore/Issuer.

#### 4. Connected the Coordinator: [RoutineSummaryPage.jsx](/arise/src/pages/Indent/RoutineSummaryPage.jsx)
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

#### 1. Extracted Shared Logic: [useShortExp.js](/arise/src/components/useShortExp.js)
Created a headless custom hook encapsulating all batch data management:
- Loads existing short expiry records from `/shortexp/item/${selectedItem.id}`.
- Manages adding, removing, and field changes across batches.
- Handles saving and payload formatting to `/shortexp/item/${selectedItem.id}/batches`.
- Provides loading and saving spinner states.

#### 2. Preserved Desktop Experience: [ShortExpDesktopModal.jsx](/arise/src/components/ShortExpDesktopModal.jsx)
Maintains the exact original Ant Design desktop modal with [ShortExpTabs.jsx](/arise/src/components/ShortExpTabs.jsx) for screens $\ge 768\text{px}$.

#### 3. Created Mobile Touch Experience: [ShortExpMobilePopup.jsx](/arise/src/components/ShortExpMobilePopup.jsx)
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

#### 4. Connected the Coordinator: [ShortExpModal.jsx](/arise/src/components/ShortExpModal.jsx)
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
Because [ShortExpModal.jsx](/arise/src/components/ShortExpModal.jsx) preserves its original props interface (`isOpen`, `onClose`, `selectedItem`), this mobile slide-up experience automatically works across all screens that trigger it:
- [RoutineIndentMobileView.jsx](/arise/src/pages/Indent/RoutineIndentMobileView.jsx)
- [RoutineSummaryPage.jsx](/arise/src/pages/Indent/RoutineSummaryPage.jsx)
- [ShortExpPage.jsx](/arise/src/pages/Shortexp/ShortExpPage.jsx)
- [ShortExpEntry.jsx](/arise/src/pages/Shortexp/ShortExpEntry.jsx)


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