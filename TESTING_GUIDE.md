# SQLite Articles Caching - Testing Guide

## ✅ Implementation Complete

All article stores have been refactored to use SQLite caching with 1-hour TTL and cursor-based pagination.

## 📋 What to Test

### 1. **Main Articles Feed (Latest)**
**Location:** `ArticleScreen.tsx` - Default view (no category selected)

**Test Steps:**
1. Open the app (cold start)
2. Navigate to Articles screen
3. **Expected:** Articles load from SQLite cache instantly (if within 1 hour)
4. Pull to refresh
5. **Expected:** Fetches fresh data from API, saves to SQLite
6. Scroll down to load more
7. **Expected:** Uses `nextCursor` for pagination, appends to SQLite
8. Close app and reopen within 1 hour
9. **Expected:** Same articles load instantly from cache
10. Wait 1+ hour, reopen app
11. **Expected:** Cache expired, fetches fresh from API

**Console Logs to Watch:**
```
⚡ Loaded articles from SQLite cache: X
✅ Fetched articles from API: X
✅ Inserted X articles
```

### 2. **Category-Based Articles**
**Location:** `ArticleScreen.tsx` - When category is selected

**Test Steps:**
1. Select any category (e.g., "Politics", "Sports")
2. **Expected:** ALWAYS fetches fresh from API (no cache)
3. Scroll to load more
4. **Expected:** Uses `nextCursor` for pagination
5. Switch to another category
6. **Expected:** Fresh API call again
7. Go back to previous category
8. **Expected:** Fresh API call (no caching)

**Console Logs to Watch:**
```
🟦 [API → getStateArticles] Request Params: { category_id: X, ... }
🟩 [API → getStateArticles] Response: Items Count: X
```

### 3. **Breaking News**
**Location:** Breaking news section

**Test Steps:**
1. View breaking news
2. **Expected:** Loads from SQLite cache if within 1 hour
3. Pull to refresh
4. **Expected:** Fetches fresh, saves to SQLite
5. Wait 1+ hour
6. **Expected:** Cache expired, fetches fresh

**Console Logs:**
```
⚡ Loaded breaking news from cache: X
✅ Fetched breaking news from API: X
```

### 4. **Trending News**
Same as Breaking News

### 5. **Exclusive Articles**
Same as Breaking News

## 🔍 Verification Checklist

- [ ] Cold start loads articles instantly (from cache)
- [ ] Pull-to-refresh fetches new data
- [ ] Pagination works with `nextCursor`
- [ ] Cache expires after 1 hour
- [ ] Category articles always fetch fresh
- [ ] No duplicate articles in the list
- [ ] App doesn't crash on SQLite operations
- [ ] Breaking/Trending/Exclusive use separate caches

## 🐛 Common Issues & Solutions

### Issue: "Cannot find module 'react-native-sqlite-storage'"
**Solution:** Run `npm install react-native-sqlite-storage --legacy-peer-deps`

### Issue: SQLite database not initializing
**Solution:** Add to `App.tsx`:
```typescript
import { initDatabase } from './utils/db/sqlite';

useEffect(() => {
  initDatabase();
}, []);
```

### Issue: Articles not caching
**Check:**
1. SQLite database initialized?
2. Console shows "✅ Inserted X articles"?
3. Check `cached_at` timestamp in database

### Issue: Cache not expiring
**Check:**
1. `clearExpiredArticles()` being called?
2. System time correct?
3. Check console for "✅ Cleared expired articles"

## 📊 Database Inspection (Optional)

To inspect the SQLite database:

1. **Android:** Use `adb pull` to get the database file
2. **iOS:** Use Xcode to access app container
3. Open with SQLite browser

**Tables:**
- `articles` - Main feed cache
- `breaking_news` - Breaking news cache
- `trending_news` - Trending news cache
- `exclusive_articles` - Exclusive articles cache

## 🎯 Performance Metrics

**Expected Results:**
- **Cold start:** <100ms to display cached articles
- **API fetch:** 500-2000ms depending on network
- **Pagination:** Smooth, no lag
- **Memory:** Minimal increase (SQLite is efficient)

## ✅ Success Criteria

1. ✅ Articles load instantly on app launch (from cache)
2. ✅ Fresh data fetched when cache expires
3. ✅ Category articles always fresh
4. ✅ Pagination works smoothly
5. ✅ No crashes or errors
6. ✅ Console logs show cache hits/misses correctly

---

**Need Help?** Check console logs for detailed debugging information!
