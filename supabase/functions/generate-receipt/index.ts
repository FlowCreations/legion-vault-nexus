import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { purchaseId } = await req.json();
    if (!purchaseId) {
      return new Response(JSON.stringify({ error: 'Purchase ID required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch purchase data
    const { data: purchase, error } = await supabaseClient
      .from('purchases')
      .select('*')
      .eq('id', purchaseId)
      .or(`user_id.eq.${user.id},email.eq.${user.email}`)
      .single();

    if (error || !purchase) {
      return new Response(JSON.stringify({ error: 'Purchase not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate HTML receipt
    const receiptHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt - ${purchase.product_name}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
      color: #333;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #000;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
    }
    .header p {
      margin: 5px 0;
      color: #666;
    }
    .receipt-info {
      margin-bottom: 30px;
    }
    .receipt-info table {
      width: 100%;
      border-collapse: collapse;
    }
    .receipt-info td {
      padding: 8px;
      border-bottom: 1px solid #eee;
    }
    .receipt-info td:first-child {
      font-weight: bold;
      width: 200px;
    }
    .items {
      margin-bottom: 30px;
    }
    .items table {
      width: 100%;
      border-collapse: collapse;
    }
    .items th {
      background: #f5f5f5;
      padding: 12px;
      text-align: left;
      border-bottom: 2px solid #ddd;
    }
    .items td {
      padding: 12px;
      border-bottom: 1px solid #eee;
    }
    .total {
      text-align: right;
      margin-top: 20px;
      font-size: 20px;
      font-weight: bold;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
    @media print {
      body { margin: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>RECEIPT</h1>
    <p>Thank you for your purchase!</p>
  </div>
  
  <div class="receipt-info">
    <table>
      <tr>
        <td>Order Number:</td>
        <td>#${purchase.stripe_session_id.slice(-8).toUpperCase()}</td>
      </tr>
      <tr>
        <td>Date:</td>
        <td>${new Date(purchase.created_at).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</td>
      </tr>
      <tr>
        <td>Customer Name:</td>
        <td>${purchase.customer_name || 'N/A'}</td>
      </tr>
      <tr>
        <td>Email:</td>
        <td>${purchase.email}</td>
      </tr>
      <tr>
        <td>Payment Status:</td>
        <td style="text-transform: capitalize;">${purchase.status}</td>
      </tr>
    </table>
  </div>
  
  <div class="items">
    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th>Type</th>
          <th style="text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${purchase.product_name}</td>
          <td style="text-transform: capitalize;">${purchase.product_type}</td>
          <td style="text-align: right;">${new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: purchase.currency.toUpperCase(),
          }).format(purchase.amount_total / 100)}</td>
        </tr>
      </tbody>
    </table>
  </div>
  
  <div class="total">
    Total: ${new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: purchase.currency.toUpperCase(),
    }).format(purchase.amount_total / 100)}
  </div>
  
  <div class="footer">
    <p>This is an electronic receipt for your purchase.</p>
    <p>If you have any questions, please contact support.</p>
  </div>
  
  <div class="no-print" style="text-align: center; margin-top: 30px;">
    <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; cursor: pointer;">
      Print / Save as PDF
    </button>
  </div>
</body>
</html>
    `;

    return new Response(receiptHtml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html',
      },
    });

  } catch (error) {
    console.error('Error generating receipt:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
