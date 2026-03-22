import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_KEY = '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';

// System prompt for Ticpin assistant
const SYSTEM_PROMPT = `You are "Ticpin AI" - the ultimate premium expert guide for the Ticpin booking platform.
Always Online. Always Ready.

Your mission is to provide extremely structured, point-by-point navigation guides using a "PowerPoint Architecture Flow" style.
When users ask for directions or "how-to", present the answer as a visual step-by-step sequence.

RESPONSE FORMAT RULES:
1. USE LISTS: Always present instructions point-by-point.
2. USE ARROWS: Show navigation paths using "GO TO -> [Menu] -> [Selection]".
3. STEP HEADERS: Every step MUST start with a single line header in this EXACT format: "📍 [Step X: Step Title]". 
   - CRITICAL: Never split the step number and the title into different lines. This will BREAK the formatting.
4. "POWERPOINT" STYLE: Treat each step header as a slide transition.
5. VISUAL MARKERS: Use emojis to make steps distinctive (📍, ➡️, 🎫, 🏙️, 🎟️, 💳).
6. TONE: Premium, concise, and professional. Use "Ticpin Quality" in your language.

PLATFORM ARCHITECTURE & INTERNAL WORKFLOW KNOWLEDGE:
- PHASE 1: DISCOVERY (Location & Search)
  - Location Filtering: Uses Google Geocoding API. Users MUST select a City via the Location Modal. City selection filters the Events, Dining, and Play lists.
  - Search: Global Top Menu search bar for quick indexing.

- PHASE 2: VERTICAL EXPLORATION
  - Events (/events): Filters by Date (Today, Tomorrow, Weekend) and Category (Music, Sports, etc.).
  - Dining (/dining): Filters by Cuisine, Rating, and Price range.
  - Play (/play): Time-slot based selection. Users choose specific Start and End times.

- PHASE 3: TRANSACTION & BOOKING
  - Play/Dining/Events follow a "Step Pattern": [Selection] -> [Review Detail] -> [Checkout] -> [Payment].
  - Users can view specific Reviews before final booking.

- PHASE 4: POST-BOOKING (MY PASS)
  - Profile -> My Bookings: View "My Pass" (Dynamic QR Code) for ticket verification. 
  - Direct Path: Footer -> Profile -> My Bookings -> [Vertical Selection].

PRACTICAL EXAMPLE (If user asks "Where is my ticket?"):
📍 [Step 1: Open User Menu]
➡️ Go to -> Homepage -> Profile Icon (Top Right Corner).

📍 [Step 2: Access Bookings]
➡️ GO TO -> "My Bookings" button in the menu.

📍 [Step 3: Download Pass]
➡️ Select your Vertical (e.g., Events) -> Click on the Booking -> Use "Download Bill" or "View QR".

STRICT OFF-TOPIC HANDLING:
- If a user asks ANYTHING unrelated to Ticpin (History, Science, General Facts, personal questions, etc.), DO NOT ANSWER.
- Simply respond: "I am Ticpin AI, and I only have knowledge about Ticpin services. I am unable to assist with unrelated topics. However, I can guide you on how to contact us for any issues or concerns:
📍 [Step: Go to Contact Us]
➡️ GO TO -> Footer -> 'Contact Us'."

MANDATORY RESPONSE FOOTER:
- ALWAYS end every response with this exact navigation tip:
"Need more help? ➡️ GO TO -> Footer -> 'Contact Us'."

Politely redirect any unrelated questions back to Ticpin services.

Context data from our current database:`;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { message, conversationHistory, sessionId, userData } = body;

        // Fetch current data from all collections - use the correct backend URL
        const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:9000';

        // 1. Save user message to Go backend if sessionId is present
        if (sessionId && userData) {
            try {
                const formData = new FormData();
                formData.append('userId', userData.id || 'guest');
                formData.append('userEmail', userData.email || 'guest@ticpin.in');
                formData.append('userType', userData.type || 'user');
                formData.append('message', message);
                formData.append('sender', 'user');

                await fetch(`${baseUrl}/api/chat/sessions/${sessionId}/messages`, {
                    method: 'POST',
                    body: formData
                });
            } catch (e) {
                console.error('Error saving user message to DB:', e);
            }
        }

        // Try to fetch data, but handle gracefully if APIs are not available
        let eventsData = [];
        let diningData = [];
        let playData = [];

        try {
            const [evRes, dinRes, playRes] = await Promise.all([
                fetch(`${baseUrl}/api/events`, { cache: 'no-store' }),
                fetch(`${baseUrl}/api/dining`, { cache: 'no-store' }),
                fetch(`${baseUrl}/api/play`, { cache: 'no-store' })
            ]);

            if (evRes.ok) {
                const d = await evRes.json();
                eventsData = Array.isArray(d) ? d : (d.data || []);
            }
            if (dinRes.ok) {
                const d = await dinRes.json();
                diningData = Array.isArray(d) ? d : (d.data || []);
            }
            if (playRes.ok) {
                const d = await playRes.json();
                playData = Array.isArray(d) ? d : (d.data || []);
            }
        } catch (e) {
            console.log('Error fetching context data, continuing with empty context');
        }

        // Extract unique artists from events
        const uniqueArtists = Array.from(new Set(eventsData.map((e: any) => e.artist_name).filter(Boolean)));

        // Create context string with exhaustive platform data
        const contextString = `
AVAILABLE ARTISTS ON PLATFORM: ${uniqueArtists.join(', ') || 'None specified'}

CURRENT EVENTS (Next 20): ${JSON.stringify(eventsData.slice(0, 20).map((e: any) => ({ 
    name: e.name, 
    city: e.city, 
    price: e.price_starts_from, 
    date: e.date,
    category: e.category,
    artist: e.artist_name || 'TBA'
})))}

CURRENT DINING (Next 20): ${JSON.stringify(diningData.slice(0, 20).map((d: any) => ({ 
    name: d.name, 
    city: d.city, 
    cuisine: d.category,
    price: d.price_starts_from 
})))}

CURRENT PLAY VENUES (Next 20): ${JSON.stringify(playData.slice(0, 20).map((p: any) => ({ 
    name: p.name, 
    city: p.city, 
    type: p.category,
    open_time: p.opening_time, 
    close_time: p.closing_time,
    price: p.price_starts_from 
})))}
`;

        // Prepare messages for Groq
        const messages = [
            { role: "system", content: SYSTEM_PROMPT + contextString },
            ...conversationHistory.map((msg: any) => ({
                role: msg.sender === 'user' ? 'user' : 'assistant',
                content: msg.text || msg.message || ""
            })),
            { role: "user", content: message }
        ];

        // Call Groq API
        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant",
                messages: messages,
                temperature: 0.7,
                max_tokens: 1024,
                top_p: 1,
                stream: true
            })
        });

        if (!groqResponse.ok) {
            const error = await groqResponse.json();
            throw new Error(`Groq API Error: ${JSON.stringify(error)}`);
        }

        // Handle streaming response
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        let fullAiResponse = '';

        return new Response(new ReadableStream({
            async start(controller) {
                const reader = groqResponse.body?.getReader();
                if (!reader) return;

                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        const chunk = decoder.decode(value);
                        controller.enqueue(encoder.encode(chunk));

                        // Accumulate for saving to DB
                        const lines = chunk.split('\n');
                        for (const line of lines) {
                            if (line.startsWith('data: ')) {
                                const data = line.slice(6);
                                if (data === '[DONE]') continue;
                                try {
                                    const parsed = JSON.parse(data);
                                    const content = parsed.choices?.[0]?.delta?.content || '';
                                    fullAiResponse += content;
                                } catch (e) { }
                            }
                        }
                    }
                } catch (e) {
                    controller.error(e);
                } finally {
                    // Save full AI response to DB
                    if (sessionId && userData && fullAiResponse) {
                        try {
                            const formData = new FormData();
                            formData.append('userId', userData.id || 'guest');
                            formData.append('userEmail', userData.email || 'guest@ticpin.in');
                            formData.append('userType', userData.type || 'user');
                            formData.append('message', fullAiResponse);
                            formData.append('sender', 'admin'); // Saved as admin or support in DB

                            await fetch(`${baseUrl}/api/chat/sessions/${sessionId}/messages`, {
                                method: 'POST',
                                body: formData
                            });
                        } catch (e) {
                            console.error('Error saving AI response to DB:', e);
                        }
                    }
                    controller.close();
                }
            }
        }), {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            }
        });

    } catch (error: any) {
        console.error('Chat error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
