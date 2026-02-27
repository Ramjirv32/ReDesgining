'use client';

import React from 'react';

export default function RefundAndCancellationComponent() {
    return (
        <div className="min-h-screen bg-white font-[family-name:var(--font-anek-latin)]">
            {/* Header / Logo Section */}
            <header className="w-full h-20 flex items-center justify-center border-b border-[#D9D9D9]">
                <img src="/ticpin-logo-black.png" alt="TICPIN" className="h-8 md:h-9 object-contain"/>
            </header>

            <main className="max-w-[1100px] mx-auto px-6 py-16 mt-[-10px]">
                <h1 className="text-[34px] font-semibold text-black text-center mb-10 break-words" style={{ fontFamily: 'Anek Latin' }}>
                    Refund and cancellation policy
                </h1>

                <div className="max-w-none text-[#686868] font-medium text-[18px] leading-relaxed space-y-10" style={{ fontFamily: 'Anek Latin' }}>
                    <div>
                        <p className="italic mb-6">Last Updated: FEB 22, 2026</p>

                        <h2 className="text-black text-[22px] font-bold mb-4">Important Notice</h2>
                        <p>
                            By using the Platform and making any booking, you agree to this Policy in addition to Ticpin&apos;s Terms & Conditions and Privacy Policy. Refund and cancellation terms are determined by the Organizer and are displayed at the time of booking.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <h2 className="text-black text-[22px] font-bold">Role of Ticpin</h2>
                            <div className="space-y-4">
                                <p>
                                    Ticpin acts solely as a technology intermediary that facilitates ticket bookings and reservations between customers and third-party organizers, merchants, venues, or service providers (&ldquo;Organizers&rdquo;).
                                </p>
                                <p>
                                    Ticpin does not own, organize, control, or manage events, venues, or experiences listed on the Platform. All events and services are the sole responsibility of the respective Organizers.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-black text-[22px] font-bold">General Refund Principles</h2>
                            <div className="space-y-4">
                                <ul className="list-disc pl-6 space-y-1">
                                    <li>Refund and cancellation terms are determined by the Organizer and are displayed at the time of booking.</li>
                                    <li>By proceeding with a booking, you agree to the Organizer&apos;s specific cancellation and refund terms.</li>
                                    <li>Ticpin does not guarantee refunds unless explicitly stated.</li>
                                    <li>Platform fees, convenience fees, or payment gateway charges are non-refundable, unless otherwise mentioned.</li>
                                </ul>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-black text-[22px] font-bold">Cancellation by Customer</h2>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <h3 className="text-black font-bold">Events, Tickets & Experiences</h3>
                                    <ul className="list-disc pl-6 space-y-1">
                                        <li>Customer-initiated cancellations are subject to the Organizer&apos;s cancellation policy.</li>
                                        <li>Some tickets may be non-cancellable and non-refundable.</li>
                                        <li>Where cancellations are allowed, refunds (if any) will be processed after deduction of applicable charges.</li>
                                    </ul>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-black font-bold">Dining, Turf & Activity Bookings</h3>
                                    <ul className="list-disc pl-6 space-y-1">
                                        <li>Cancellation timelines and refund eligibility vary by venue or merchant.</li>
                                        <li>Late cancellations or no-shows may result in partial or zero refunds.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-black text-[22px] font-bold">Cancellation or Changes by Organizer</h2>
                            <div className="space-y-4">
                                <p>
                                    If an event is cancelled, postponed, or materially changed by the Organizer, refund or rescheduling options (if any) will be communicated by the Organizer.
                                </p>
                                <p>
                                    Ticpin shall facilitate communication and refund processing but does not control refund decisions. Refund timelines depend on the Organizer and payment gateway.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-black text-[22px] font-bold">Force Majeure Events</h2>
                            <p>
                                No refunds shall be guaranteed for cancellations or disruptions caused by events beyond reasonable control, including but not limited to natural disasters, government orders, pandemics, strikes, technical failures, or public safety concerns, unless the Organizer explicitly offers a refund.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-black text-[22px] font-bold">Failed, Duplicate, or Incorrect Transactions</h2>
                            <div className="space-y-4">
                                <p>
                                    In case of a failed payment where the amount is debited but the booking is not confirmed, the amount will be reversed as per banking timelines.
                                </p>
                                <p>
                                    For duplicate payments, eligible refunds will be processed after verification. Ticpin is not responsible for delays caused by banks or payment gateways.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-black text-[22px] font-bold">Refund Processing Timeline</h2>
                            <div className="space-y-4">
                                <ul className="list-disc pl-6 space-y-1">
                                    <li>Approved refunds are generally processed within 7&ndash;14 business days.</li>
                                    <li>The refunded amount will be credited to the original payment method.</li>
                                    <li>Ticpin does not control bank or card issuer processing timelines.</li>
                                </ul>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-black text-[22px] font-bold">Partial Refunds</h2>
                            <div className="space-y-4">
                                <p>Partial refunds may be issued in situations such as:</p>
                                <ul className="list-disc pl-6 space-y-1">
                                    <li>Partial event cancellation</li>
                                    <li>Seat or service downgrade</li>
                                    <li>Organizer-approved adjustments</li>
                                </ul>
                                <p>The refunded amount shall be determined solely by the Organizer.</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-black text-[22px] font-bold">Non-Refundable Situations</h2>
                            <div className="space-y-4">
                                <p>Refunds shall not be provided for:</p>
                                <ul className="list-disc pl-6 space-y-1">
                                    <li>Missed events or late arrivals</li>
                                    <li>Incorrect bookings made by the customer</li>
                                    <li>No-shows at venues or events</li>
                                    <li>Tickets lost, stolen, or unused</li>
                                    <li>Violation of venue or event rules</li>
                                </ul>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-black text-[22px] font-bold">Refund Abuse & Fraud</h2>
                            <div className="space-y-4">
                                <p>Ticpin reserves the right to:</p>
                                <ul className="list-disc pl-6 space-y-1">
                                    <li>Deny refunds in cases of suspected fraud or abuse</li>
                                    <li>Suspend or terminate user accounts involved in misuse of refund policies</li>
                                </ul>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-black text-[22px] font-bold">Disputes</h2>
                            <p>
                                All disputes related to refunds or cancellations shall be resolved between the Customer and the Organizer. Ticpin may assist in communication but is not liable for the final outcome.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-black text-[22px] font-bold">Policy Updates</h2>
                            <p>
                                Ticpin reserves the right to modify this Policy at any time without prior notice. Updated versions will be published on the Platform and shall be effective immediately.
                            </p>
                        </div>
                    </div>

                    <div className="pt-10 border-t border-zinc-200">
                        <h2 className="text-black text-[22px] font-bold mb-4">Contact Support</h2>
                        <p>
                            For refund-related queries or support, please contact us through the customer support channels available on the Platform or visit the <span className="text-black font-bold cursor-pointer">Contact Page</span>.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}