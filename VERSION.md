# NumiVault Version History

## Version 0.2 - Advanced Filtering & Analytics (2026-02-21)

### 🎯 Milestone: SKU Page Enhancement with Statistics & Smart Filtering

This version adds comprehensive filtering, analytics, and intelligent grouping to the SKU detail page, making large collections easy to navigate and analyze.

### ✨ New Features

**Statistics Panel (Collapsible):**
- ✅ Bar Chart: Coin distribution by year with interactive tooltips
- ✅ Pie Chart: Status breakdown (In Collection / Sold / Listed)
- ✅ Line Chart: Purchase price trends over time
- ✅ Grade Distribution: Visual hierarchy of coin conditions
- ✅ Responsive design with proper data visualization
- ✅ Collapsible to save screen space

**Advanced Filter Bar:**
- ✅ Grade Multi-Select: Filter by Sheldon Scale grades (G, VG, F, VF, XF, AU, MS, PF)
- ✅ Status Filter: "All" / "In Collection" / "Sold" / "Listed"
- ✅ Date Range Presets: [Last Week] [Last Month] [Last 3 Months] [Custom Range]
- ✅ Active filter badges with one-click removal
- ✅ "Reset All Filters" button for quick clearing
- ✅ Clean Shadcn/UI design matching existing interface

**Nested Grouping System:**
- ✅ Primary grouping by Year (e.g., "1963 (28 coins) - Avg: CHF 4.78")
- ✅ Secondary grouping by Grade within each year
- ✅ Expandable/collapsible groups (expanded by default)
- ✅ Group state persists during session (localStorage)
- ✅ Shows coin count and average price per group

**Enhanced Sorting Options:**
- ✅ "Best to Sell": Intelligent sort by profit potential (spot value - purchase price)
- ✅ Grade Hierarchy: Proper Sheldon Scale ordering
- ✅ Year: Ascending/Descending
- ✅ Purchase Date: Oldest/Newest first
- ✅ Price: Lowest/Highest
- ✅ Profit Potential: Based on current metal spot prices

**Complete Sheldon Scale Support:**
- ✅ Full grade hierarchy: P-1 through PF-70
- ✅ 100+ grade variations supported
- ✅ Categories: G, VG, F, VF (20/30/35), XF (40/45), AU (50/53/55/58), MS (60-70), PF (60-70)
- ✅ Proper sorting based on numismatic standards

**Technical Improvements:**
- ✅ Recharts integration for all visualizations
- ✅ @tanstack/react-virtual for smooth scrolling performance
- ✅ Type-safe grade hierarchy with TypeScript
- ✅ Profit calculations: `metal content (grams) × spot price (CHF/g)`
- ✅ No breaking changes to existing functionality

### 🎨 UI/UX Enhancements

**Layout Structure:**
```
[Coin Images + Metal Content + Summary Cards]
↓
[Statistics Panel - Collapsible]
↓
[Filter Bar - Always Visible]
↓
[Grouped Table with Virtual Scrolling]
  ├─ Year Group 1 (expanded)
  │   ├─ Grade Subgroup 1
  │   ├─ Grade Subgroup 2
  │   └─ Grade Subgroup 3
  ├─ Year Group 2 (expanded)
  └─ Year Group 3 (expanded)
```

**Performance Optimizations:**
- Virtual scrolling handles hundreds of coins smoothly
- Charts render efficiently with memoization
- Filter operations are client-side for instant response
- Group collapse/expand animations are smooth

### 📋 Core Features (Still Working)

**Collection Management:**
- Complete coin collection tracking system
- Image upload and management (front/back/edge views)
- Detailed coin information (SKU, mint, year, country, denomination, grade)
- Metal content tracking (weight, purity, metal type)
- Bullion value calculation based on real-time spot prices

**Dashboard & Analytics:**
- Real-time portfolio overview
- Total collection value tracking
- Metal breakdown by type (Gold, Silver, Platinum)
- Spot price tracking with live updates
- Visual charts and statistics

**Sales Tracking:**
- Complete sales history management
- Profit/loss calculations
- Sales date and price tracking
- Link sales to collection items

**Marketplace:**
- Public listings system
- Buy/sell functionality
- Listing management with images
- Price negotiation support

**Authentication & User Management:**
- Secure email/password authentication
- User profiles with avatar support
- Password reset functionality
- Email confirmation system

**Metal Prices (Fixed in v0.1.1):**
- ✅ Correct API endpoint: `https://api.metalpriceapi.com/v1/latest`
- ✅ Proper currency codes: `XAU`, `XAG`, `XPT`, `XCU`
- ✅ Accurate conversion: CHF per Troy Ounce → CHF per Gramme
- ✅ Formula: `Price per gram = (1 / API_Rate) / 31.1034768`

### 🛡️ Technical Stack

- Next.js 15.5 (Page Router)
- React 18.3
- TypeScript
- Tailwind CSS v3.4
- Supabase (Database, Auth, Storage)
- Shadcn/UI components
- Recharts (data visualization)
- @tanstack/react-virtual (performance)
- Metal Price API integration

### 🔄 Rollback Instructions

If you need to rollback to this version:

1. **Via Version History (Recommended):**
   - Click "Version History" in the Softgen interface
   - Find the version tagged "Version 0.2 - 2026-02-21"
   - Click "Revert" to restore this exact state

2. **Via Git:**
   ```bash
   git checkout v0.2
   ```

3. **Via Vercel:**
   - Go to Vercel dashboard
   - Find deployment from 2026-02-21 (latest)
   - Click "Promote to Production"

### 📊 Database Schema

**Tables:**
- `profiles` - User profiles and settings
- `user_coins` - Coin collection data
- `user_sales` - Sales transaction history
- `listings` - Marketplace listings
- `coins_reference` - Reference data for coins (SKU, name, year, country, etc.)

**Row Level Security:**
- All tables protected with RLS policies
- Users can only access their own data
- Public read access for marketplace listings and reference coins

### 📈 What's Next?

Future enhancements could include:
- Extend filtering to main Collection page
- Add export functionality (CSV, PDF reports)
- Implement bulk actions (multi-select operations)
- Add price history tracking
- Create custom views/dashboards

---

**Status:** ✅ Stable - Production Ready

**Last Updated:** 2026-02-21

**Recommended Recovery Point:** ✅ Version 0.2

**Next Planned Version:** 0.3.0

---

## Version 0.1.1 - Metal Prices & Stability Fix (2026-02-20)

### 🎯 Milestone: Metal Prices Integration & Crash Prevention

This version fixes critical issues with metal prices calculation and Register Purchase dialog crashes.

### ✅ What's Fixed

**Metal Prices API Integration:**
- ✅ Correct API endpoint: `https://api.metalpriceapi.com/v1/latest`
- ✅ Proper currency codes: `XAU`, `XAG`, `XPT`, `XCU` (not `CHFXAU` format)
- ✅ Accurate conversion: CHF per Troy Ounce → CHF per Gramme
- ✅ Formula: `Price per gram = (1 / API_Rate) / 31.1034768`
- ✅ Real-time spot prices for Gold, Silver, Platinum, Copper

**Register Purchase Dialog Fixes:**
- ✅ Fixed crashes when searching for reference coins
- ✅ Added proper null/undefined checks for coin properties
- ✅ Safe property access with defensive programming
- ✅ Improved authentication checks before loading reference coins
- ✅ Better error handling for empty or missing data

**Code Quality:**
- ✅ Enhanced null safety throughout collection page
- ✅ Type-safe property access for reference coins
- ✅ Improved error boundaries and fallback handling

---

## Version 0.1.0 - Initial Baseline (2026-02-20)

First stable release with core features implemented. Superseded by version 0.1.1 with metal prices fix, and version 0.2 with advanced filtering.

---

## Future Versions

All future versions will be documented here. If any major failure occurs, rollback to **Version 0.2** as the stable baseline.