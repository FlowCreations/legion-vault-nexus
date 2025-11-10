import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get all active users (logged in within last 60 days)
    const sixtyDaysAgo = new Date()
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

    const { data: activeUsers, error: usersError } = await supabaseClient
      .from('user_profiles')
      .select('user_id, last_login, last_login_date, login_streak')
      .gte('last_login', sixtyDaysAgo.toISOString())

    if (usersError) throw usersError

    console.log(`Processing ${activeUsers?.length || 0} active users`)

    const results = {
      processed: 0,
      errors: 0,
      streaksUpdated: 0
    }

    // Process each user
    for (const user of activeUsers || []) {
      try {
        // Update login streak tracking
        const today = new Date().toISOString().split('T')[0]
        const lastLoginDate = user.last_login_date
        const currentStreak = user.login_streak || 0

        let newStreak = currentStreak
        if (lastLoginDate) {
          const lastDate = new Date(lastLoginDate)
          const todayDate = new Date(today)
          const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))

          if (diffDays === 1) {
            // Consecutive day
            newStreak = currentStreak + 1
            results.streaksUpdated++
          } else if (diffDays > 1) {
            // Streak broken
            newStreak = 0
          }
        }

        // Calculate inactive days
        const lastLogin = new Date(user.last_login || new Date())
        const now = new Date()
        const inactiveDays = Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24))

        // Update user profile with streak and inactive days
        await supabaseClient
          .from('user_profiles')
          .update({
            login_streak: newStreak,
            inactive_days: inactiveDays
          })
          .eq('user_id', user.user_id)

        // Trigger PTP computation
        const { error: computeError } = await supabaseClient.functions.invoke('compute-era-ptp', {
          body: { member_id: user.user_id }
        })

        if (computeError) {
          console.error(`Error computing PTP for ${user.user_id}:`, computeError)
          results.errors++
        } else {
          results.processed++
        }

      } catch (error) {
        console.error(`Error processing user ${user.user_id}:`, error)
        results.errors++
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        ...results,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in daily PTP computation:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
