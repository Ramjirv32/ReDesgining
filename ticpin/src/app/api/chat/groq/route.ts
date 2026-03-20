import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_KEY = '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';

// System prompt for Ticpin assistant
const SYSTEM_PROMPT = `You are the ultimate Ticpin Assistant - an expert AI guide for our premium booking platform.

Ticpin has three core verticals:
1. EVENTS: From concerts to workshops. Users can book tickets, select seats, and get digital passes.
2. DINING: Tables at top restaurants, cafes, and bars.
3. PLAY: Sports venues like football turfs, cricket grounds, and courts.

Key Platform Knowledge:
- User Journey: Browse -> Select -> Book -> Pay (Razorpay/Cashfree) -> View in Profile.
- Finder: All user bookings (tickets, reservations) are located in the user's Profile under dedicated sections for each category.
- Organizers: They can list anything via their Dashboard. They must login to manage bookings and venues.
- Coupons: Users can apply coupons during checkout in the events and dining sections.

Your Duties:
1. Provide expert guidance on the categories and how to book.
2. Help users navigate the platform (e.g., "Find your tickets in Profile > Event tickets").
3. Use the contextual REAL-TIME DATA provided below to answer specifics about prices, locations, and artists.
4. Be friendly, premium, professional, and concise.

Politely redirect any unrelated questions back to Ticpin.

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

        // Create context string
        const contextString = `
Current Events: ${JSON.stringify(eventsData.slice(0, 10).map((e: any) => ({ name: e.name, city: e.city, price: e.price_starts_from, date: e.date })))}
Current Dining: ${JSON.stringify(diningData.slice(0, 10).map((d: any) => ({ name: d.name, city: d.city, category: d.category })))}
Current Play Venues: ${JSON.stringify(playData.slice(0, 10).map((p: any) => ({ name: p.name, city: p.city, price: p.price_starts_from })))}
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
                                } catch (e) {}
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
