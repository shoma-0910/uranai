import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { google } from 'npm:googleapis@131.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

// Handle CORS preflight requests
function handleCors(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Origin': req.headers.get('origin') || '*',
      },
      status: 204,
    });
  }
  return null;
}

// Error response helper
function errorResponse(message: string, status = 500) {
  console.error(`Error: ${message}`);
  return new Response(
    JSON.stringify({ error: message }),
    {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      status,
    }
  );
}

// Success response helper
function successResponse(data: any) {
  return new Response(
    JSON.stringify(data),
    {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
      status: 200,
    }
  );
}

// Google Calendar API setup
const calendar = google.calendar('v3');
const googleAuth = new google.auth.GoogleAuth({
  credentials: {
    client_email: Deno.env.get('GOOGLE_CLIENT_EMAIL'),
    private_key: Deno.env.get('GOOGLE_PRIVATE_KEY')?.replace(/\\n/g, '\n'),
  },
  scopes: [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
  ],
});

// Create Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Required Supabase environment variables are not set');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function validateEnvironment() {
  const requiredEnvVars = [
    'GOOGLE_CLIENT_EMAIL',
    'GOOGLE_PRIVATE_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_URL'
  ];

  for (const varName of requiredEnvVars) {
    const value = Deno.env.get(varName);
    if (!value || value.trim() === '') {
      throw new Error(`Missing environment variable: ${varName}`);
    }
  }

  const privateKey = Deno.env.get('GOOGLE_PRIVATE_KEY');
  if (!privateKey?.includes('BEGIN PRIVATE KEY') || !privateKey?.includes('END PRIVATE KEY')) {
    throw new Error('Invalid Google credentials format');
  }
}

async function validateBookingData(booking: any) {
  if (!booking) {
    throw new Error('Booking not found');
  }

  if (!booking.fortune_teller?.profiles?.email || !booking.user?.email) {
    throw new Error('Required email addresses not found');
  }

  const startTime = new Date(booking.start_time);
  if (isNaN(startTime.getTime())) {
    throw new Error('Invalid start time');
  }

  if (!booking.duration_minutes || booking.duration_minutes <= 0) {
    throw new Error('Invalid booking duration');
  }

  const now = new Date();
  const maxFutureDate = new Date();
  maxFutureDate.setFullYear(now.getFullYear() + 1);

  if (startTime < now || startTime > maxFutureDate) {
    throw new Error('Booking time is out of valid range');
  }
}

async function createMeeting(bookingId: string) {
  try {
    await validateEnvironment();

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        user:profiles!bookings_user_id_fkey(email, full_name),
        fortune_teller:fortune_tellers!bookings_fortune_teller_id_fkey(
          name,
          user_id,
          profiles:profiles(email)
        )
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError) {
      throw new Error(`Failed to fetch booking: ${bookingError.message}`);
    }

    await validateBookingData(booking);

    const startTime = new Date(booking.start_time);
    const endTime = new Date(startTime.getTime() + booking.duration_minutes * 60000);

    const event = {
      summary: `占い鑑定: ${booking.fortune_teller.name}`,
      description: `
        占い師: ${booking.fortune_teller.name}
        お客様: ${booking.user.full_name}
        時間: ${booking.duration_minutes}分
        備考: ${booking.notes || 'なし'}
      `,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: 'Asia/Tokyo',
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'Asia/Tokyo',
      },
      attendees: [
        { email: booking.user.email },
        { email: booking.fortune_teller.profiles.email },
      ],
      conferenceData: {
        createRequest: {
          requestId: bookingId,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    };

    const authClient = await googleAuth.getClient();
    const calendarResponse = await calendar.events.insert({
      auth: authClient,
      calendarId: 'primary',
      conferenceDataVersion: 1,
      requestBody: event,
    });

    const meetLink = calendarResponse.data.conferenceData?.entryPoints?.[0]?.uri;
    if (!meetLink) {
      throw new Error('Failed to generate Google Meet link');
    }

    const { error: updateError } = await supabase
      .from('bookings')
      .update({ meet_link: meetLink })
      .eq('id', bookingId);

    if (updateError) {
      throw new Error(`Failed to update booking: ${updateError.message}`);
    }

    const notifications = [
      {
        user_id: booking.user_id,
        title: 'Google Meetリンクが生成されました',
        content: `${booking.fortune_teller.name}との鑑定用のGoogle Meetリンクが生成されました。\n日時: ${startTime.toLocaleString()}\n時間: ${booking.duration_minutes}分`,
        type: 'meeting_created',
      },
      {
        user_id: booking.fortune_teller.user_id,
        title: 'Google Meetリンクが生成されました',
        content: `${booking.user.full_name}様との鑑定用のGoogle Meetリンクが生成されました。\n日時: ${startTime.toLocaleString()}\n時間: ${booking.duration_minutes}分`,
        type: 'meeting_created',
      },
    ];

    const { error: notificationError } = await supabase
      .from('notifications')
      .insert(notifications);

    if (notificationError) {
      console.warn('Failed to create notifications:', notificationError);
    }

    return successResponse({ 
      message: 'Meeting link generated successfully',
      meetLink 
    });

  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'An unexpected error occurred');
  }
}

Deno.serve(async (req) => {
  try {
    const corsResponse = handleCors(req);
    if (corsResponse) return corsResponse;

    if (req.method !== 'POST') {
      return errorResponse('Method not allowed', 405);
    }

    const contentType = req.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return errorResponse('Content-Type must be application/json', 400);
    }

    const body = await req.json();
    const { bookingId } = body;

    if (!bookingId) {
      return errorResponse('Booking ID is required', 400);
    }

    return await createMeeting(bookingId);
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : 'An error occurred while processing the request',
      400
    );
  }
});