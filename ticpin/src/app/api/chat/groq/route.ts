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
        const { message, conversationHistory } = await request.json();

        // Fetch current data from all collections - use the correct backend URL
        const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:9000';
        
        // Try to fetch data, but handle gracefully if APIs are not available
        let eventsData = [];
        let diningData = [];
        let playData = [];

        try {
            const eventsResponse = await fetch(`${baseUrl}/api/events`, {
                headers: { 'Accept': 'application/json' }
            });
            if (eventsResponse && eventsResponse.ok) {
                const text = await eventsResponse.text();
                if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
                    eventsData = JSON.parse(text);
                    if (!Array.isArray(eventsData)) {
                        eventsData = eventsData.events || [];
                    }
                }
            }
        } catch (e) {
            console.log('Events API not available, using empty data');
        }

        try {
            const diningResponse = await fetch(`${baseUrl}/api/dining`, {
                headers: { 'Accept': 'application/json' }
            });
            if (diningResponse && diningResponse.ok) {
                const text = await diningResponse.text();
                if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
                    diningData = JSON.parse(text);
                    if (!Array.isArray(diningData)) {
                        diningData = diningData.dining || [];
                    }
                }
            }
        } catch (e) {
            console.log('Dining API not available, using empty data');
        }

        try {
            const playResponse = await fetch(`${baseUrl}/api/play`, {
                headers: { 'Accept': 'application/json' }
            });
            if (playResponse && playResponse.ok) {
                const text = await playResponse.text();
                if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
                    playData = JSON.parse(text);
                    if (!Array.isArray(playData)) {
                        playData = playData.play || [];
                    }
                }
            }
        } catch (e) {
            console.log('Play API not available, using empty data');
        }

        // Create context from the data
        const contextData = {
            events: Array.isArray(eventsData) ? eventsData.slice(0, 15) : [],
            dining: Array.isArray(diningData) ? diningData.slice(0, 15) : [],
            play: Array.isArray(playData) ? playData.slice(0, 15) : []
        };

        // Format context for Groq with detailed information
        const contextString = `
Current Ticpin Data:

EVENTS (${contextData.events.length} available):
${contextData.events.map((event: any) => {
    const date = event.date ? new Date(event.date).toLocaleDateString() : 'TBD';
    const artists = event.artists && Array.isArray(event.artists) 
        ? event.artists.map((a: any) => a.name).join(', ') 
        : event.artistName || 'Various Artists';
    const price = event.priceStartsFrom ? `₹${event.priceStartsFrom}` : 'Price TBD';
    return `- ${event.name || 'Untitled Event'}: ${event.description || 'No description'}, Date: ${date}, Time: ${event.time || 'TBD'}, Venue: ${event.venueName || 'TBD'}, City: ${event.city || 'TBD'}, Artists: ${artists}, Price: ${price}, Category: ${event.category || 'General'}`;
}).join('\n')}

DINING VENUES (${contextData.dining.length} available):
${contextData.dining.map((venue: any) => {
    const date = venue.date ? new Date(venue.date).toLocaleDateString() : 'Available daily';
    const price = venue.priceStartsFrom ? `₹${venue.priceStartsFrom}` : 'Price varies';
    return `- ${venue.name || 'Unnamed Venue'}: ${venue.description || 'No description'}, Location: ${venue.venueAddress || venue.city || 'TBD'}, Date: ${date}, Time: ${venue.time || 'Multiple slots'}, Price: ${price}, Category: ${venue.category || 'Restaurant'}`;
}).join('\n')}

PLAY VENUES (${contextData.play.length} available):
${contextData.play.map((venue: any) => {
    const date = venue.date ? new Date(venue.date).toLocaleDateString() : 'Available daily';
    const time = venue.time || venue.openingTime || 'Multiple slots';
    const price = venue.priceStartsFrom ? `₹${venue.priceStartsFrom}` : 'Price varies';
    const courts = venue.courts && Array.isArray(venue.courts) ? venue.courts.length : 0;
    return `- ${venue.name || 'Unnamed Venue'}: ${venue.description || 'No description'}, Location: ${venue.venueAddress || venue.city || 'TBD'}, Date: ${date}, Time: ${time}, Price: ${price}, Category: ${venue.category || 'Sports'}, Courts: ${courts}, Venue: ${venue.venueName || 'TBD'}`;
}).join('\n')}
`;

        // Format conversation history
        const messages = [
            { role: 'system', content: SYSTEM_PROMPT + '\n\n' + contextString },
            ...conversationHistory.map((msg: any) => ({
                role: msg.sender === 'user' ? 'user' : 'assistant',
                content: msg.text
            })),
            { role: 'user', content: message }
        ];

        // Call Groq API with streaming
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: messages,
                temperature: 0.8,
                max_completion_tokens: 1024,
                top_p: 0.9,
                stream: true,
                stop: null
            })
        });

        if (!response.ok) {
            throw new Error('Groq API request failed');
        }

        // Return streaming response
        return new Response(
            new ReadableStream({
                async start(controller) {
                    const reader = response.body?.getReader();
                    const decoder = new TextDecoder();
                    let isClosed = false;

                    if (!reader) {
                        if (!isClosed) {
                            controller.close();
                            isClosed = true;
                        }
                        return;
                    }

                    try {
                        while (true) {
                            const { done, value } = await reader.read();
                            if (done) break;

                            const chunk = decoder.decode(value);
                            const lines = chunk.split('\n');

                            for (const line of lines) {
                                if (line.startsWith('data: ')) {
                                    const data = line.slice(6);
                                    if (data === '[DONE]') {
                                        if (!isClosed) {
                                            controller.close();
                                            isClosed = true;
                                        }
                                        return;
                                    }

                                    try {
                                        const parsed = JSON.parse(data);
                                        const content = parsed.choices?.[0]?.delta?.content || '';
                                        if (content) {
                                            // Stream character by character with delay for natural typing effect
                                            for (let i = 0; i < content.length; i++) {
                                                if (isClosed) break;
                                                
                                                const char = content[i];
                                                const charChunk = {
                                                    ...parsed,
                                                    choices: [{
                                                        ...parsed.choices[0],
                                                        delta: { content: char }
                                                    }]
                                                };
                                                
                                                controller.enqueue(`data: ${JSON.stringify(charChunk)}\n\n`);
                                                
                                                // Add delay for natural typing (30-80ms per character)
                                                const delay = Math.random() * 50 + 30;
                                                await new Promise(resolve => setTimeout(resolve, delay));
                                            }
                                        }
                                    } catch (e) {
                                        // Skip invalid JSON
                                    }
                                }
                            }
                        }
                    } catch (error) {
                        console.error('Streaming error:', error);
                    } finally {
                        if (!isClosed) {
                            controller.close();
                            isClosed = true;
                        }
                    }
                }
            }),
            {
                headers: {
                    'Content-Type': 'text/plain; charset=utf-8',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                },
            }
        );

    } catch (error) {
        console.error('Groq API Error:', error);
        return NextResponse.json(
            { error: 'Failed to process chat request' },
            { status: 500 }
        );
    }
}
