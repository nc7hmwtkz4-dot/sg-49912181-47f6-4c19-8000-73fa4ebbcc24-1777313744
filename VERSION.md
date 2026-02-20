# NumiVault Version History

## Version 0.11 - Metal Prices & Stability Fix (2026-02-20)

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

### 🔧 Metal Prices Calculation

**API Configuration:**
```
Endpoint: https://api.metalpriceapi.com/v1/latest
Parameters: 
  - api_key: a4c341c9c8b69969cba65382941825cf
  - base: CHF
  - currencies: XAU,XAG,XPT,XCU
```

**Conversion Formula:**
```
API Response: { "rates": { "XAU": 0.00000123 } } // 1 CHF = X troy oz
Step 1: Troy Ounce Price = 1 / API_Rate
Step 2: Gramme Price = Troy Ounce Price / 31.1034768
Result: CHF per gramme
```

**Example Calculation:**
```
XAU API Rate: 0.000012345
Troy Ounce Price: 1 / 0.000012345 = 81,037 CHF/oz
Gramme Price: 81,037 / 31.1034768 = 2,605 CHF/g
```

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

### 🛡️ Technical Stack

- Next.js 15.5 (Page Router)
- React 18.3
- TypeScript
- Tailwind CSS v3.4
- Supabase (Database, Auth, Storage)
- Shadcn/UI components
- Metal Price API integration

### 🔄 Rollback Instructions

If you need to rollback to this version:

1. **Via Version History:**
   - Click "Version History" in the Softgen interface
   - Find the version tagged "Version 0.11 - 2026-02-20"
   - Click "Revert" to restore this exact state

2. **Via Git:**
   ```bash
   git checkout v0.11
   ```

3. **Via Vercel:**
   - Go to Vercel dashboard
   - Find deployment from 2026-02-20 (latest)
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

---

**Status:** ✅ Stable - Production Ready

**Last Updated:** 2026-02-20

**Next Planned Version:** 0.2.0

---

## Version 0.1.0 - Initial Baseline (2026-02-20)

First stable release with core features implemented. Superseded by version 0.11 with metal prices fix.

---

## Future Versions

All future versions will be documented here. If any major failure occurs, rollback to **Version 0.11** as the stable baseline.