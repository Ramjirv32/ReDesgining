'use client';

import React from 'react';

const stepsContent = {
    play: [
        {
            number: '01',
            title: 'Register as a Partner',
            description: 'Onboard within minutes with just your PAN card and bank details.',
        },
        {
            number: '02',
            title: 'List your turf or court',
            description: 'Tell us all about your turf or court, set up custom slots and price bookings just the way you want.',
        },
        {
            number: '03',
            title: 'Publish on Ticpin for free',
            description: 'Submit your listing and go live within 24 hours. Commission is charged only on successful bookings.',
        },
    ],
    events: [
        {
            number: '01',
            title: 'Register as a creator',
            description: 'Onboard within minutes with just your PAN card and bank details.',
        },
        {
            number: '02',
            title: 'Craft your first event',
            description: 'Tell us all about your event, set up custom shows and price tickets just the way you want.',
        },
        {
            number: '03',
            title: 'Publish on Ticpin for free',
            description: 'Submit your event and go live within 24 hours! Commissions will only be charged on tickets sold.',
        },
    ]
};

interface CreatorStepsProps {
    type?: 'events' | 'play';
    category?: string | null;
}

export default function CreatorSteps({ type = 'play', category = 'play' }: CreatorStepsProps) {
    const steps = stepsContent[type] || stepsContent.play;
    const isPlay = category === 'play';

    return (
        <div className="flex flex-col gap-12 max-w-xl">
            {steps.map((step) => (
                <div key={step.number} className="flex items-center gap-8 md:gap-12 group">
                    {/* Fixed width container for number ensures horizontal alignment of text */}
                    <div className="flex-shrink-0 w-[65px] md:w-[85px] lg:w-[100px] flex items-center justify-center">
                        <img
                            src={`/list your events/${step.number}${isPlay ? '' : step.number.charAt(1)}.svg`}
                            alt={step.number}
                            className="h-16 md:h-20 lg:h-24 w-auto object-contain"
                        />
                    </div>

                    {/* Content Section */}
                    <div className="flex flex-col justify-center space-y-1 md:space-y-2">
                        <h3 className="text-[26px] md:text-[30px] font-medium text-black leading-[33px] mt-[-20px]" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                            {step.title}
                        </h3>
                        <p className="text-[14px] md:text-[15px] text-[#686868] font-medium leading-[16px] max-w-sm" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                            {step.description}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}
