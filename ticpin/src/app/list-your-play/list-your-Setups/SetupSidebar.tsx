'use client';

import React from 'react';

export default function SetupSidebar({
    currentStep = '01',
    completedSteps = [] as string[],
    category = null as string | null
}: {
    currentStep?: string,
    completedSteps?: string[],
    category?: string | null
}) {
    const steps = [
        { number: '01', title: 'Organization details' },
        { number: '02', title: 'GST selection' },
        { number: '03', title: 'Bank details' },
        { number: '04', title: 'Backup contact' },
        { number: '05', title: 'Agreement' },
    ];

    // Calculate progress percentage
    const currentStepIndex = steps.findIndex(s => s.number === currentStep);
    const progressPercentage = ((currentStepIndex + 1) / steps.length) * 100;

    const isPlay = category === 'play';
    const activeColor = isPlay ? '#E7C200' : '#5331EA';

    return (
        <div className="flex gap-4 min-w-[200px]">
            {/* Step Indicators */}
            <div className="flex flex-col gap-6 relative">
                {/* Background vertical line (gray) */}
                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-zinc-300 rounded-full" />

                {/* Progress vertical line (dynamic color) */}
                <div
                    className="absolute left-0 top-0 w-[3px] rounded-full transition-all duration-500 ease-out"
                    style={{
                        height: `${progressPercentage}%`,
                        backgroundColor: '#000000'
                    }}
                />

                {steps.map((step) => {
                    const isActive = step.number === currentStep;
                    return (
                        <div
                            key={step.number}
                            className="flex gap-3 items-center relative pl-4 text-[18px] font-bold text-black break-words w-[280px]"
                            style={{ fontFamily: 'var(--font-anek-latin)' }}
                        >
                            <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-3">
                                    <span
                                        style={{
                                            color: '#000000',
                                            fontFamily: 'var(--font-anek-tamil)',
                                            fontVariationSettings: "'wdth' 87.5, 'wght' 700"
                                        }}
                                    >
                                        {step.number}
                                    </span>
                                    <span className={`whitespace-nowrap md:whitespace-normal font-bold ${isActive || completedSteps.includes(step.number) ? 'text-black' : 'text-black opacity-80'}`}>
                                        {step.title}
                                    </span>
                                </div>
                                {completedSteps.includes(step.number) && !isActive && (
                                    <img
                                        src={isPlay ? "/list your events/tick.svg" : "/list your events/tick icon.svg"}
                                        alt="completed"
                                        className="w-[16px] h-[16px] object-contain shrink-0"
                                    />
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
