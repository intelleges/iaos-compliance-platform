# Missing Features from Legacy Site

## Key Observations from Legacy Intelleges FCM Site

### 1. **Submenu System for Each Entity**
Each main menu item (Enterprise, Person, Partner, Protocol, Touchpoint, etc.) expands to show action submenus:
- **Add** - Create new record
- **Archive** - Archive selected records
- **Find** - Search/filter functionality
- **View** - Display data grid
- **Unarchive** - Restore archived records

**Current Implementation**: We have flat menu with direct navigation to entity pages. Missing the submenu structure.

### 2. **Modal Grid View with Dark Overlay**
- Grids appear as **modal overlays** on top of the dashboard (not full-page navigation)
- Dark semi-transparent background behind the modal
- Close button (X) in top-right to return to dashboard
- Grid stays on dashboard context

**Current Implementation**: Full-page navigation to separate entity pages. Missing modal overlay pattern.

### 3. **Export to Excel Button**
- Prominent "Export to Excel" button in grid header
- Allows exporting filtered/visible data

**Current Implementation**: Missing export functionality.

### 4. **Per-Column Filter Inputs**
- Each column header has its own filter input box
- Real-time filtering as you type
- Multiple columns can be filtered simultaneously

**Current Implementation**: Single global search bar only. Missing per-column filters.

### 5. **Grid Context Menus (Right-Click)**
- Right-click on any row should show context menu
- Actions: Edit, Delete, Archive, View Details, etc.
- Quick access to row-specific operations

**Current Implementation**: Only Edit and Archive buttons in Actions column. Missing right-click context menus.

### 6. **Additional Enterprise Grid Columns**
Legacy site shows:
- Enterprise Name
- Country
- License (Paid/Free Trial)
- Partner Max (capacity)
- Start Date
- End Date
- Users (count)

**Current Implementation**: Shows ID, Description, Company Name, Instance Name, Status. Missing Country, License, Partner Max, Start/End dates, User count.

### 7. **Clickable Data (Drill-Down Navigation)**
- Blue hyperlinked values (e.g., "500", "1000", "25", "45")
- Clicking Partner Max or Users count navigates to related records
- Enables drill-down from Enterprise → Partners or Enterprise → Users

**Current Implementation**: Static table data. Missing drill-down navigation.

### 8. **Pagination with Item Count**
- Shows "Displaying items 1 - 4 of 4"
- First/Previous/Page Numbers/Next/Last buttons
- Clear indication of total records

**Current Implementation**: Has pagination but missing detailed item count display.

### 9. **Dashboard as Home Page**
- Main dashboard shows "Compliance Command Center" with status grids
- Touchpoint selector dropdown
- Group filter dropdown
- Partner Type filter dropdown
- 8-status grid (G/U/R/C/N/R/R/I/R/C) by group and partner type
- Completion percentages and visual indicators

**Current Implementation**: Simple home page. Missing comprehensive dashboard.

### 10. **Role Selector Dropdown**
- Top-right dropdown: "Intelleges Admin / Enterprise User / Supplier"
- Allows switching between user perspectives
- Changes available menu items and data visibility

**Current Implementation**: Missing role switcher.

## Priority Implementation Order

1. **Submenu system** - Add/Archive/Find/View/Unarchive under each entity
2. **Modal grid overlays** - Convert entity pages to modal overlays on dashboard
3. **Per-column filters** - Add filter inputs to each column header
4. **Export to Excel** - Add export button to all grids
5. **Grid context menus** - Right-click menu on table rows
6. **Enhanced Enterprise columns** - Add Country, License, Partner Max, dates, user count
7. **Drill-down navigation** - Make key values clickable to navigate to related records
8. **Dashboard rebuild** - Create full Compliance Command Center with status grids
9. **Role switcher** - Add role selector dropdown
10. **Touchpoint/Group/PartnerType filters** - Add global filter dropdowns
