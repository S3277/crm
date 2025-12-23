import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '';

  const digitsOnly = phone.replace(/\D/g, '');

  if (digitsOnly.length === 10) {
    return `+1${digitsOnly}`;
  }

  if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    return `+${digitsOnly}`;
  }

  if (phone.startsWith('+')) {
    return phone;
  }

  return `+1${digitsOnly}`;
}

interface WebhookPayload {
  lead_id?: string;
  status?: 'hot' | 'warm' | 'cold' | 'uninterested';
  action_type?: 'calling' | 'qualifying';
  transcript?: string;
  metadata?: Record<string, any>;
  name?: string;
  email?: string;
  phone?: string;
  user_id?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (req.method === 'POST') {
      const payload: WebhookPayload = await req.json();

      if (payload.name && payload.phone && !payload.lead_id) {
        const formattedPhone = formatPhoneNumber(payload.phone);

        if (!payload.user_id) {
          return new Response(
            JSON.stringify({ error: 'user_id is required for creating new leads' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        const { data: newLead, error: createError } = await supabase
          .from('leads')
          .insert({
            user_id: payload.user_id,
            name: payload.name,
            email: payload.email || null,
            phone: formattedPhone || null,
            status: payload.status || 'cold',
            lead_type: 'inbound',
            source_channel: 'inbound_call',
            call_result: null,
          })
          .select()
          .maybeSingle();

        if (createError) {
          console.error('Error creating lead:', createError);
          return new Response(
            JSON.stringify({ error: 'Failed to create lead', details: createError.message }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            lead: newLead,
            message: 'Lead created successfully',
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      if (!payload.lead_id || !payload.status) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: lead_id and status' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const validStatuses = ['hot', 'warm', 'cold', 'uninterested'];
      if (!validStatuses.includes(payload.status)) {
        return new Response(
          JSON.stringify({ error: 'Invalid status. Must be: hot, warm, cold, or uninterested' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const updateData: any = {
        status: payload.status,
        updated_at: new Date().toISOString(),
      };

      if (payload.phone) {
        updateData.phone = formatPhoneNumber(payload.phone);
      }

      if (payload.transcript) {
        updateData.transcript = payload.transcript;
      }

      if (payload.metadata) {
        const { data: currentLead } = await supabase
          .from('leads')
          .select('metadata')
          .eq('id', payload.lead_id)
          .maybeSingle();

        updateData.metadata = {
          ...(currentLead?.metadata || {}),
          ...payload.metadata,
        };
      }

      const { data: lead, error: updateError } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', payload.lead_id)
        .select()
        .maybeSingle();

      if (updateError) {
        console.error('Error updating lead:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update lead', details: updateError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      if (!lead) {
        return new Response(
          JSON.stringify({ error: 'Lead not found' }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      if (lead.user_id) {
        const { error: logError } = await supabase
          .from('automation_logs')
          .insert({
            action_type: payload.action_type === 'calling' ? 'start_calling' : 'start_qualifying',
            status: 'success',
            user_id: lead.user_id,
            details: {
              lead_id: payload.lead_id,
              new_status: payload.status,
              action: payload.action_type,
            },
          });

        if (logError) {
          console.error('Error logging automation:', logError);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          lead: lead,
          message: `Lead status updated to ${payload.status}`,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (req.method === 'GET') {
      return new Response(
        JSON.stringify({
          message: 'Qualification Webhook Endpoint',
          version: '1.0.0',
          endpoints: {
            POST: 'Update lead status based on qualification results',
          },
          payload_example: {
            lead_id: 'uuid-string',
            status: 'hot | warm | cold | uninterested',
            action_type: 'calling | qualifying',
            transcript: 'optional transcript text',
            metadata: { key: 'optional metadata' },
          },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});