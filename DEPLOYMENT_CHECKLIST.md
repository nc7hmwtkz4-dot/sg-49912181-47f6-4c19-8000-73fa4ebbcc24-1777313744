# NumiVault Deployment Checklist

## ✅ Data Persistence Verification

### Before Every Deployment:

1. **Verify Environment Variables**
   ```bash
   # Check that these are set in Vercel:
   NEXT_PUBLIC_SUPABASE_URL=https://jldmiqfvvgulaycjqtfq.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
   NEXT_PUBLIC_SITE_URL=<your-production-url>
   ```

2. **Verify Database Connection**
   - ✅ All data is stored in Supabase (cloud database)
   - ✅ Data persists independently of deployments
   - ✅ No localStorage used for critical data

3. **Database Tables Status**
   ```sql
   -- These tables should exist and contain user data:
   - profiles
   - user_coins
   - user_sales
   - coins_reference (optional shared data)
   ```

4. **Migration Safety**
   - ✅ All migrations use `CREATE TABLE IF NOT EXISTS`
   - ✅ Migrations never use `DROP TABLE`
   - ✅ No destructive operations in migrations

---

## 🔒 Data Safety Guarantees

### What Happens on Deployment:

**✅ SAFE - Data is Preserved:**
- User coins in `user_coins` table → **PERSISTS**
- User sales in `user_sales` table → **PERSISTS**
- User profiles in `profiles` table → **PERSISTS**
- User authentication data → **PERSISTS**

**🎯 Why Data is Safe:**
1. **Cloud Database**: Supabase hosts your database separately from your app
2. **Independent Storage**: Database is NOT affected by app redeployments
3. **No localStorage**: All critical data goes to Supabase, not browser storage
4. **Safe Migrations**: Migrations only create/alter, never drop tables

---

## 🚨 What Could Cause Data Loss

### ❌ DANGEROUS - Avoid These:

1. **Manually Dropping Tables**
   ```sql
   -- NEVER run this in production:
   DROP TABLE user_coins;
   DROP TABLE user_sales;
   ```

2. **Using Wrong Supabase Instance**
   - Make sure production uses the correct `SUPABASE_URL`
   - Don't mix development and production databases

3. **Using localStorage for Data**
   - ❌ All references to `storageService` removed
   - ✅ All data operations use Supabase services

4. **Destructive Migrations**
   ```sql
   -- NEVER use TRUNCATE in production:
   TRUNCATE TABLE user_coins;
   ```

---

## 📊 Verify Data After Deployment

### Post-Deployment Checks:

1. **Login to Production App**
2. **Check Collection Page**
   - Can you see your coins?
   - Can you add a new coin?
   - Does it persist after refresh?

3. **Check Sales Page**
   - Can you see your sales history?
   - Can you record a new sale?
   - Does it appear immediately?

4. **Check Database Directly** (via Supabase Dashboard)
   ```sql
   -- Count records in each table:
   SELECT COUNT(*) FROM user_coins;
   SELECT COUNT(*) FROM user_sales;
   SELECT COUNT(*) FROM profiles;
   ```

---

## 🔧 Data Recovery (If Needed)

### If Data Appears Missing:

1. **Check Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project
   - Go to "Table Editor"
   - Verify data exists in tables

2. **Check Browser Console**
   - Open DevTools (F12)
   - Look for authentication errors
   - Look for RLS policy errors

3. **Verify Environment Variables**
   - In Vercel: Settings → Environment Variables
   - Make sure `NEXT_PUBLIC_SUPABASE_URL` matches your project
   - Make sure `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct

4. **Check RLS Policies**
   - Users can only see their own data
   - Make sure you're logged in with the correct account

---

## 📝 Data Backup Strategy

### Recommended Backup Schedule:

**Daily Automatic Backups** (Supabase Pro):
- Supabase Pro includes automatic daily backups
- Upgrade if handling valuable data

**Manual Backup** (Free Tier):
```sql
-- Export data as SQL dump:
-- Via Supabase Dashboard → Database → Backups
-- Or use pg_dump if you have direct database access
```

**CSV Export**:
```sql
-- Via Supabase Dashboard:
-- Table Editor → Select table → Export as CSV
```

---

## 🎯 Current Implementation Status

### ✅ Data Persistence - FULLY IMPLEMENTED

**All CRUD Operations Use Supabase:**

1. **Coins Management** (`userCoinService`):
   - ✅ `getUserCoins()` - Read from Supabase
   - ✅ `addUserCoin()` - Write to Supabase
   - ✅ `updateUserCoin()` - Update in Supabase
   - ✅ `deleteUserCoin()` - Delete from Supabase

2. **Sales Management** (`userSalesService`):
   - ✅ `getUserSales()` - Read from Supabase
   - ✅ `addSale()` - Write to Supabase
   - ✅ `deleteSale()` - Delete from Supabase

3. **Authentication** (`authService`):
   - ✅ User sessions managed by Supabase Auth
   - ✅ Profile data stored in `profiles` table

**No localStorage Used for Critical Data:**
- ✅ `storageService.ts` - Only used as backup/fallback
- ✅ All pages use Supabase services directly
- ✅ Data persists across deployments

---

## 🚀 Deployment Best Practices

1. **Always Test in Preview**
   - Vercel creates preview deployments for each commit
   - Test data persistence before promoting to production

2. **Monitor After Deployment**
   - Check user_coins table for record count
   - Check user_sales table for record count
   - Verify no errors in Vercel logs

3. **Keep Migrations Safe**
   - Review all SQL before running
   - Never drop tables in production
   - Use `ALTER TABLE ADD COLUMN IF NOT EXISTS`

4. **Environment Variables**
   - Set in Vercel Dashboard
   - Same for all environments (if using same Supabase project)
   - Or different for dev/staging/production (recommended)

---

## 📞 Support Checklist

If users report data loss:

1. ✅ Verify they're logged into the correct account
2. ✅ Check Supabase dashboard - data is actually there
3. ✅ Check browser console for RLS policy errors
4. ✅ Verify environment variables in Vercel
5. ✅ Check Supabase project status (not paused)

---

## ✨ Summary

**Your NumiVault app is now configured for persistent data storage:**

- ✅ All data saved to Supabase cloud database
- ✅ Data survives all redeployments
- ✅ Data accessible from any device
- ✅ No localStorage used for critical operations
- ✅ Safe migrations that don't destroy data
- ✅ RLS policies protect user data

**Data will NEVER be reset on deployment!** 🎉