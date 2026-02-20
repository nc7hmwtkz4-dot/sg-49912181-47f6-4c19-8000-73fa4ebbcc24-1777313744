# NumiVault Version History

## Version 0.1.0 - Stable Baseline (2026-02-20)

### 🎯 Milestone: First Stable Release

This version represents the first stable baseline of NumiVault. All core features are working correctly and tested.

### ✅ Core Features Implemented

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

**Technical Stack:**
- Next.js 15.5 (Page Router)
- React 18.3
- TypeScript
- Tailwind CSS v3.4
- Supabase (Database, Auth, Storage)
- Shadcn/UI components

### 🔧 Metal Prices Integration

**API Configuration:**
- Metal Price API integration: https://api.metalpriceapi.com
- Real-time spot prices in CHF per gram
- Supported metals: Gold (XAU), Silver (XAG), Platinum (XPT)
- Automatic conversion from Troy Ounce to grams
- Fallback prices for API unavailability

**Calculation Formula:**
```
Price per gram (CHF) = API Rate (CHF/Troy Oz) ÷ 31.1034768
Bullion Value = (Weight × Purity%) × Price per gram
```

### 📋 Database Schema

**Tables:**
- `profiles` - User profiles and settings
- `user_coins` - Coin collection data
- `user_sales` - Sales transaction history
- `listings` - Marketplace listings
- `coin_references` - Reference data for coins

**Row Level Security (RLS):**
- All tables protected with RLS policies
- Users can only access their own data
- Public read access for marketplace listings

### 🛡️ Security Features

- JWT-based authentication
- Row Level Security (RLS) on all database tables
- Secure file storage with access controls
- Environment variable protection for API keys
- Input validation and sanitization

### 🔄 Rollback Instructions

If you need to rollback to this version:

1. **Via Version History:**
   - Click "Version History" in the Softgen interface
   - Find the version tagged "Version 0.1.0 - 2026-02-20"
   - Click "Revert" to restore this exact state

2. **Via Git (if using manual Git):**
   ```bash
   git checkout v0.1.0
   ```

3. **Via Vercel Deployments:**
   - Go to your Vercel dashboard
   - Find the deployment from 2026-02-20
   - Click "Promote to Production"

### 📝 Known Limitations

- Metal prices require active internet connection
- Image uploads limited to 5MB per file
- API rate limits apply (check Metal Price API documentation)

### 🎨 Design System

- Dark/Light theme support
- Responsive design (mobile, tablet, desktop)
- Consistent UI components via Shadcn/UI
- Swiss design aesthetic with CHF currency formatting

### 🚀 Deployment

- Production-ready for Vercel deployment
- One-click deployment via Softgen "Publish" button
- Environment variables configured
- Database migrations applied

---

**Status:** ✅ Stable - Production Ready

**Last Updated:** 2026-02-20

**Next Planned Version:** 0.2.0

---

## Future Versions

All future versions will be documented here. If any major failure occurs, rollback to **Version 0.1.0** as the stable baseline.