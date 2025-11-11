import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'npm:resend@2.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { abandonedCartId } = await req.json()

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

    // Get abandoned cart details
    const { data: cart } = await supabaseClient
      .from('abandoned_carts')
      .select('*, user_profiles!inner(*)')
      .eq('id', abandonedCartId)
      .single()

    if (!cart) {
      throw new Error('Abandoned cart not found')
    }

    const items = cart.cart_items as any[]
    const itemsList = items
      .map((item: any) => {
        const product = item.product?.node || {}
        return `<li style="margin: 10px 0;">
          <strong>${product.title || 'Product'}</strong> - 
          Quantity: ${item.quantity} - 
          $${parseFloat(item.price?.amount || '0').toFixed(2)}
        </li>`
      })
      .join('')

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Your Cart is Waiting!</h1>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px;">Hi ${cart.user_profiles?.first_name || 'there'},</p>
          
          <p style="font-size: 16px;">We noticed you left some items in your cart. We'd love to help you complete your purchase!</p>
          
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0; color: #667eea; font-size: 20px;">Your Items:</h2>
            <ul style="list-style: none; padding: 0;">
              ${itemsList}
            </ul>
            <p style="font-size: 18px; font-weight: bold; margin: 15px 0 0 0;">
              Total: $${parseFloat(cart.cart_value).toFixed(2)}
            </p>
          </div>

          <div style="background: #667eea; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; font-size: 24px;">Special Offer: 25% OFF!</h3>
            <p style="margin: 10px 0; font-size: 16px;">Use code:</p>
            <div style="background: white; color: #667eea; padding: 15px; border-radius: 5px; font-size: 24px; font-weight: bold; letter-spacing: 2px;">
              ${cart.discount_code}
            </div>
            <p style="margin: 15px 0 5px 0; font-size: 14px; opacity: 0.9;">Valid for 7 days</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'lovableprojects.com') || 'https://your-site.com'}" 
               style="display: inline-block; background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-size: 18px; font-weight: bold;">
              Complete Your Order
            </a>
          </div>

          <p style="font-size: 14px; color: #666; text-align: center; margin-top: 30px;">
            This offer expires in 7 days. Don't miss out!
          </p>
        </div>
      </body>
      </html>
    `

    const { data: emailResult, error: emailError } = await resend.emails.send({
      from: 'Sons of Legion <onboarding@resend.dev>',
      to: [cart.user_profiles?.email || ''],
      subject: `Your cart is waiting - Here's 25% off! 🎁`,
      html: emailHtml,
    })

    if (emailError) {
      throw emailError
    }

    // Update abandoned cart with email sent timestamp
    await supabaseClient
      .from('abandoned_carts')
      .update({ email_sent_at: new Date().toISOString() })
      .eq('id', abandonedCartId)

    // Log email send
    await supabaseClient
      .from('email_logs')
      .insert({
        user_id: cart.user_id,
        email_type: 'cart_recovery',
        recipient_email: cart.user_profiles?.email,
        status: 'sent',
      })

    return new Response(
      JSON.stringify({ success: true, emailId: emailResult?.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error sending cart recovery email:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})