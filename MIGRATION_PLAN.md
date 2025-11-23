# Sons of Legion - Supabase Pro Migration Plan

## Overview
Complete migration from Lovable Cloud to Supabase Pro project: `ojphjfrswqubslbvfhiw`

---

## PHASE 1: Pre-Migration Checklist

### 1.1 Backup Current Data
```bash
# In Lovable Cloud, export current user data
# Via Supabase Dashboard: Authentication > Users > Export to CSV
```

### 1.2 Verify Supabase Pro Project
- Project ID: `ojphjfrswqubslbvfhiw`
- Ensure project is on **Pro Plan**
- Verify billing is active

### 1.3 Required Secrets to Copy from Lovable Cloud
Navigate to your Lovable project settings and copy these secret values:

**Critical Secrets:**
- `LOVABLE_API_KEY` - Required for all AI intelligence features
- `STRIPE_SECRET_KEY` - Payment processing
- `RESEND_API_KEY` - Email sending
- `LIVEKIT_API_KEY` - Live streaming
- `LIVEKIT_API_SECRET` - Live streaming
- `META_ACCESS_TOKEN` - Facebook/Meta pixel tracking
- `SHOPIFY_ACCESS_TOKEN` - E-commerce integration
- `SHOPIFY_STOREFRONT_ACCESS_TOKEN` - Shopify storefront

**Optional Secrets:**
- `TUNEPIPE_API_KEY` - Music distribution
- `HEARTBEAT_API_KEY` - Analytics
- `VIBERATE_API_KEY` - Music data
- `VITE_MAPBOX_TOKEN` - Map display
- `SEND_EMAIL_HOOK_SECRET` - Webhook security

---

## PHASE 2: Database Migration

### 2.1 Run Complete Schema Migration

**In your Supabase Pro Dashboard:**
1. Go to SQL Editor
2. Create new query
3. Copy and run `MIGRATION_SCHEMA.sql` (see separate file)
4. Verify all tables created successfully

### 2.2 Enable Realtime (if needed)
```sql
-- Enable realtime for specific tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.livestream_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.livestream_chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_messages;
```

### 2.3 Verify RLS Policies
```sql
-- Check all tables have RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = false;
```

---

## PHASE 3: Storage Buckets

### 3.1 Create Storage Buckets
In Supabase Pro Dashboard > Storage:

1. **videos** (Public)
2. **thumbnails** (Public)
3. **profile-pictures** (Public)
4. **cameo-videos** (Public)
5. **music-tracks** (Public)
6. **email-assets** (Public)
7. **vod-recordings** (Public)

### 3.2 Configure Storage Policies
See `STORAGE_POLICIES.sql` for complete RLS policies for each bucket.

---

## PHASE 4: Authentication Configuration

### 4.1 Custom Auth Domain Setup
1. In Supabase Pro: Authentication > URL Configuration
2. Set **Site URL**: `https://sol-portal.com`
3. Add **Redirect URLs**:
   ```
   https://sol-portal.com/**
   http://localhost:5173/**
   ```

### 4.2 Custom Domain for Auth (Recommended)
1. Add CNAME record: `auth.sol-portal.com` → `ojphjfrswqubslbvfhiw.supabase.co`
2. In Supabase: Settings > Custom Domains
3. Add `auth.sol-portal.com`
4. Wait for SSL certificate provisioning

### 4.3 Email Templates
1. Authentication > Email Templates
2. Customize welcome email, password reset, etc.
3. Add Sons of Legion branding

### 4.4 Google OAuth Configuration

**Update in Google Cloud Console:**
1. Go to: https://console.cloud.google.com/apis/credentials
2. Find your OAuth 2.0 Client ID
3. Update **Authorized redirect URIs**:
   ```
   https://ojphjfrswqubslbvfhiw.supabase.co/auth/v1/callback
   https://auth.sol-portal.com/auth/v1/callback (if using custom domain)
   ```

**In Supabase Pro Dashboard:**
1. Authentication > Providers
2. Enable Google
3. Add your Google Client ID and Client Secret
4. Save configuration

---

## PHASE 5: Edge Functions Deployment

### 5.1 Required Secrets in Supabase Pro
In your Supabase Pro project, add these secrets:

```bash
# Critical for AI Features
supabase secrets set LOVABLE_API_KEY="[copy from Lovable Cloud]"

# Payment & Commerce
supabase secrets set STRIPE_SECRET_KEY="[your key]"
supabase secrets set SHOPIFY_ACCESS_TOKEN="[your key]"
supabase secrets set SHOPIFY_STOREFRONT_ACCESS_TOKEN="[your key]"

# Communications
supabase secrets set RESEND_API_KEY="[your key]"

# Live Streaming
supabase secrets set LIVEKIT_API_KEY="[your key]"
supabase secrets set LIVEKIT_API_SECRET="[your key]"
supabase secrets set LIVEKIT_URL="wss://sonsoflegionlivestudio-lvof78tr.livekit.cloud"

# Analytics & Tracking
supabase secrets set META_ACCESS_TOKEN="[your key]"
supabase secrets set HEARTBEAT_API_KEY="[your key]"

# Additional Services
supabase secrets set TUNEPIPE_API_KEY="[your key]"
supabase secrets set VIBERATE_API_KEY="[your key]"
supabase secrets set VITE_MAPBOX_TOKEN="[your key]"
supabase secrets set SEND_EMAIL_HOOK_SECRET="[generate new secret]"

# Supabase Connection (auto-configured)
supabase secrets set SUPABASE_URL="https://ojphjfrswqubslbvfhiw.supabase.co"
supabase secrets set SUPABASE_ANON_KEY="[your anon key]"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="[your service role key]"
```

### 5.2 Edge Functions List (80+ functions)

**AI Intelligence Features (16 functions):**
1. `generate-epiphany-insight` - Emotional breakthrough insights
2. `generate-oracle-insight` - Revenue predictions
3. `send-personalized-message` - AI-powered messaging
4. `shop-assistant` - AI shopping assistant
5. `auto-generate-personalities` - MBTI personality generation
6. `trigger-email-automation` - Smart email triggers
7. Plus 10 more AI-powered functions

**Core Edge Functions:**
- Email & SMS automation (15 functions)
- Livestream management (8 functions)
- E-commerce & Stripe (12 functions)
- Analytics & tracking (10 functions)
- Campaign management (15 functions)
- Funnel tracking (6 functions)
- Plus 18 utility functions

### 5.3 Deploy Edge Functions

**Option A: Via Supabase CLI (Recommended)**
```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref ojphjfrswqubslbvfhiw

# Deploy all functions
supabase functions deploy --project-ref ojphjfrswqubslbvfhiw
```

**Option B: Via Dashboard**
1. Edge Functions > Create function
2. Upload function code
3. Deploy each function individually

---

## PHASE 6: Frontend Configuration

### 6.1 Update Environment Variables
Create `.env` in your Lovable project:
```env
VITE_SUPABASE_URL=https://ojphjfrswqubslbvfhiw.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=[your anon key from Supabase Pro]
VITE_SUPABASE_PROJECT_ID=ojphjfrswqubslbvfhiw
VITE_LIVEKIT_URL=wss://sonsoflegionlivestudio-lvof78tr.livekit.cloud
VITE_MAPBOX_TOKEN=[your mapbox token]
```

### 6.2 Update Supabase Client
File will be auto-updated when you add Supabase connection in Lovable settings.

### 6.3 Lovable Settings Update
1. In Lovable: Settings > Integrations
2. **Disable** Lovable Cloud
3. **Add** Supabase connection:
   - Project URL: `https://ojphjfrswqubslbvfhiw.supabase.co`
   - Anon Key: [from Supabase Pro]
   - Service Role Key: [from Supabase Pro]

---

## PHASE 7: Data Migration

### 7.1 Export User Data from Lovable Cloud
```sql
-- In Lovable Cloud SQL Editor
COPY (SELECT * FROM auth.users) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM public.user_profiles) TO STDOUT WITH CSV HEADER;
```

### 7.2 Import to Supabase Pro

**Via Dashboard:**
1. Authentication > Users
2. Import users from CSV
3. Users will receive password reset emails

**Or via SQL:**
```sql
-- Import user profiles
INSERT INTO public.user_profiles (user_id, email, display_name, ...)
VALUES (...);
```

### 7.3 Migrate User Content
```sql
-- Export from Lovable Cloud
COPY (SELECT * FROM public.videos) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM public.music_tracks) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM public.community_posts) TO STDOUT WITH CSV HEADER;

-- Import to Supabase Pro (use same INSERT pattern)
```

---

## PHASE 8: Intelligence Features Verification

### 8.1 Test Epiphany Insight
```bash
curl -X POST https://ojphjfrswqubslbvfhiw.supabase.co/functions/v1/generate-epiphany-insight \
  -H "Authorization: Bearer [SUPABASE_ANON_KEY]" \
  -H "Content-Type: application/json"
```

Expected: AI-generated emotional insight

### 8.2 Test Oracle Insight
```bash
curl -X POST https://ojphjfrswqubslbvfhiw.supabase.co/functions/v1/generate-oracle-insight \
  -H "Authorization: Bearer [SUPABASE_ANON_KEY]" \
  -H "Content-Type: application/json"
```

Expected: AI revenue prediction

### 8.3 Test Catalyst Campaign
```bash
curl -X POST https://ojphjfrswqubslbvfhiw.supabase.co/functions/v1/send-personalized-message \
  -H "Authorization: Bearer [SUPABASE_ANON_KEY]" \
  -H "Content-Type: application/json" \
  -d '{"campaignId":"test","targetId":"test","channel":"email"}'
```

Expected: Personalized AI message

### 8.4 Verify Match Matrix
Check that PTP/ERA scoring is working:
```sql
SELECT * FROM era_ptp_scores_daily LIMIT 10;
SELECT * FROM match_matrix_scores LIMIT 10;
```

---

## PHASE 9: Testing & Validation

### 9.1 Authentication Test
- [ ] Sign up new user
- [ ] Login existing user
- [ ] Google OAuth login
- [ ] Password reset flow
- [ ] Email confirmation

### 9.2 JRNY Milestone Test
- [ ] Watch video to trigger milestone
- [ ] Verify `milestone_progress` updates
- [ ] Check `user_milestones` creation
- [ ] Test badge awards (Silver, Gold, Champion)
- [ ] Verify modal display

### 9.3 Intelligence Features Test
- [ ] Generate Epiphany insight
- [ ] Generate Oracle prediction
- [ ] Trigger Catalyst campaign
- [ ] View Match Matrix scores
- [ ] Check PTP/ERA calculations

### 9.4 E-commerce Test
- [ ] Stripe checkout flow
- [ ] Abandoned cart recovery
- [ ] Order creation
- [ ] Receipt generation

### 9.5 Live Studio Test
- [ ] Start livestream
- [ ] Join as viewer
- [ ] Send reactions
- [ ] Chat messages
- [ ] VOD recording

---

## PHASE 10: Go Live

### 10.1 DNS Configuration
Update your domain DNS:
```
A     @           [Your hosting IP]
CNAME auth        ojphjfrswqubslbvfhiw.supabase.co
CNAME api         ojphjfrswqubslbvfhiw.supabase.co
```

### 10.2 Final Checklist
- [ ] All secrets configured in Supabase Pro
- [ ] All edge functions deployed and tested
- [ ] Database schema migrated
- [ ] RLS policies verified
- [ ] User data migrated
- [ ] Google OAuth updated
- [ ] Custom auth domain active
- [ ] Intelligence features tested
- [ ] JRNY milestones working
- [ ] Live Studio functional
- [ ] E-commerce checkout working
- [ ] Email sending operational

### 10.3 Monitor
First 24 hours:
- Watch edge function logs
- Monitor error rates
- Check email delivery
- Verify user signups
- Test intelligence features

---

## Support & Rollback

### If Issues Arise:
1. **Keep Lovable Cloud active** during migration
2. Run dual systems for 48 hours
3. Monitor both databases
4. Full rollback available if needed

### Common Issues:

**Issue: "LOVABLE_API_KEY not found"**
- Solution: Verify secret is set in Supabase Pro dashboard

**Issue: "RLS policy violation"**
- Solution: Check user is authenticated, verify policy SQL

**Issue: "Edge function timeout"**
- Solution: Increase timeout in function config, optimize query

**Issue: "Google OAuth redirect mismatch"**
- Solution: Double-check redirect URIs in Google Console

---

## Cost Estimation

**Supabase Pro Plan:** $25/month
- Includes: 8GB database, 250GB bandwidth, 50GB file storage
- No extra charges for your current usage level

**Estimated Additional Costs:**
- Edge Functions: $0 (within free tier for current usage)
- Database Storage: $0 (under 8GB)
- Bandwidth: $0 (under 250GB/month)

**Total Monthly Cost:** ~$25/month

---

## Timeline

**Estimated Migration Time:**
- Phase 1-2 (Setup & Schema): 1 hour
- Phase 3-5 (Storage, Auth, Functions): 2 hours
- Phase 6-7 (Frontend & Data): 1 hour
- Phase 8-9 (Testing): 2 hours
- **Total:** 6 hours

**Recommended Schedule:**
- Day 1: Phases 1-5 (Setup)
- Day 2: Phases 6-7 (Migration)
- Day 3: Phases 8-9 (Testing)
- Day 4: Phase 10 (Go Live)

---

## Next Steps

1. **Review this plan thoroughly**
2. **Run MIGRATION_SCHEMA.sql** in your Supabase Pro project
3. **Configure secrets** in Supabase dashboard
4. **Update Lovable settings** to connect to Supabase Pro
5. **Test intelligence features** to verify LOVABLE_API_KEY works
6. **Begin data migration**

**Ready to proceed?** Start with Phase 1 and work through systematically. All your intelligence features will work seamlessly once the LOVABLE_API_KEY is configured.
