# Dashboard Analysis - Legacy Site

## Overall Layout

### Header Section
- **Title**: "Compliance Command Center" with subtitle "Enterprise-wide situational awareness"
- **Touchpoint Selector**: Dropdown showing current touchpoint (e.g., "Reps & Certs Annual 2025")
- **Role Switcher**: Dropdown with "Intelleges Admin", "Enterprise User", "Supplier"
- **Overall Completion**: Large "66%" with "Complete (2602/3961)" text
- **Needs Focus Alert**: Red badge showing "ROCHESTER (52%)"

### Filter Bar
- **All Groups** dropdown: CME, CMO, CMY, CNO, COV, CSP, NEW_HOPE, ROCHESTER
- **All Partner Types** dropdown: Supplier, Distributor, Contractor, Consultant

### Legend
- **G** = Goal
- **U** = Unconfirmed
- **R** = Reviewing
- **C** = Confirmed
- **N/R** = No Response (Yellow background)
- **R/I** = Incomplete (Red background)
- **R/C** = Complete (Blue background)
- **T** = Total Sent

## Group Status Grids

Each group has:
1. **Header**: Group name (e.g., "CME") with completion percentage badge (e.g., "57%")
2. **Table Structure**:
   - Columns: PARTNER TYPE | G | U | R | C | N/R | R/I | R/C | T
   - Rows: Supplier, Distributor, Contractor, Total
3. **Color Coding**:
   - N/R column: Yellow background
   - R/I column: Red background
   - R/C column: Blue background
4. **Special Styling**:
   - ROCHESTER group has red background header with "⚠ NEEDS ATTENTION - Lowest Completion"
   - Expandable rows (▼ indicator)

## Bottom Summary

### Enterprise Totals
- **8 Groups** total
- **66% Complete** with emoji indicator (😐 Making Progress)
- **Pre-Invite Stats**: U: 0, R: 12, C: 1183
- **Post-Invite Stats**: 
  - N/R: 393 (10%)
  - R/I: 966 (24%)
  - R/C: 2602 (66%)
  - T: 3961

## Data Structure Needed

```typescript
interface DashboardData {
  touchpoint: string;
  overallCompletion: number;
  totalSent: number;
  completed: number;
  needsFocus: {
    group: string;
    percentage: number;
  };
  groups: GroupStatus[];
  totals: {
    preInvite: { u: number; r: number; c: number };
    postInvite: { nr: number; ri: number; rc: number; t: number };
  };
}

interface GroupStatus {
  name: string;
  completion: number;
  partnerTypes: {
    type: string; // Supplier, Distributor, Contractor
    g: number;
    u: number;
    r: number;
    c: number;
    nr: number;
    ri: number;
    rc: number;
    t: number;
  }[];
}
```

## Color Scheme
- **Yellow (N/R)**: #FCD34D or similar
- **Red (R/I)**: #EF4444 or similar
- **Blue (R/C)**: #3B82F6 or similar
- **Group Headers**: Black background (#000000)
- **Completion Badges**: Colored circles with percentage
