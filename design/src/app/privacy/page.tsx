'use client';

import React from 'react';

export default function PrivacyPolicyComponent() {
    return (
        <div className="min-h-screen bg-white font-[family-name:var(--font-anek-latin)]">
            {/* Header / Logo Section */}
            <header className="w-full h-20 flex items-center justify-center border-b border-[#D9D9D9]">
                <img src="/ticpin-logo-black.png" alt="TICPIN" className="h-8 md:h-9 object-contain" />
            </header>

            <main className="max-w-[1100px] mx-auto px-6 py-16 mt-[-10px]">
                <h1 className="text-[34px] font-semibold text-black text-center mb-10 break-words" style={{ fontFamily: 'Anek Latin' }}>
                    Privacy policy
                </h1>

                <div className="max-w-none text-[#686868] font-medium text-[18px] leading-relaxed space-y-10" style={{ fontFamily: 'Anek Latin' }}>
                    <div>
                        <p className="italic mb-6">Last Updated: FEB 22, 2026</p>

                        <h2 className="text-black text-[22px] font-bold mb-4">Your Privacy Matters</h2>
                        <p>
                            Velrona Technologies Private Limited, the owner and operator of the Ticpin platform, respects your privacy and is committed to protecting your personal data. By accessing or using the Platform, you consent to the practices described in this Privacy Policy.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <h2 className="text-black text-[22px] font-bold">Scope of This Privacy Policy</h2>
                            <div className="space-y-4">
                                <p>
                                    This Privacy Policy applies to all users of the Platform, including customers, organizers, merchants, vendors, and visitors. This Policy should be read together with the Ticpin Terms & Conditions.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-black text-[22px] font-bold">Information We Collect</h2>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <h3 className="text-black font-bold">Personal Information</h3>
                                    <p>We may collect the following personal information:</p>
                                    <ul className="list-disc pl-6 space-y-1">
                                        <li>Name</li>
                                        <li>Mobile number</li>
                                        <li>Email address</li>
                                        <li>Date of birth (where required)</li>
                                        <li>Account login details</li>
                                        <li>Preferences and profile information</li>
                                    </ul>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-black font-bold">Payment Information</h3>
                                    <p>All payments are processed through authorized third-party payment gateways. Ticpin does not store your complete debit card, credit card, or UPI details.</p>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-black font-bold">Usage & Technical Data</h3>
                                    <p>We may collect:</p>
                                    <ul className="list-disc pl-6 space-y-1">
                                        <li>Device and browser information</li>
                                        <li>IP address and log data</li>
                                        <li>Location data (approximate or precise, subject to permission)</li>
                                        <li>App usage behavior, searches, clicks, and booking history</li>
                                    </ul>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-black font-bold">User-Generated Content</h3>
                                    <p>We may collect:</p>
                                    <ul className="list-disc pl-6 space-y-1">
                                        <li>Reviews, ratings, comments</li>
                                        <li>Photos, videos, and messages shared on the Platform</li>
                                        <li>Communications with customer support</li>
                                    </ul>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-black font-bold">Information from Third Parties</h3>
                                    <p>We may receive information from event organizers, merchants, payment providers, analytics partners, or marketing partners.</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-black text-[22px] font-bold">How We Use Your Information</h2>
                            <div className="space-y-4">
                                <p>We use collected information to:</p>
                                <ul className="list-disc pl-6 space-y-1">
                                    <li>Create and manage user accounts</li>
                                    <li>Enable ticket bookings and reservations</li>
                                    <li>Process payments and confirmations</li>
                                    <li>Provide customer support</li>
                                    <li>Send transactional, service, and promotional communications</li>
                                    <li>Personalize content and recommendations</li>
                                    <li>Improve platform features and performance</li>
                                    <li>Detect and prevent fraud, misuse, and security incidents</li>
                                    <li>Comply with legal and regulatory obligations</li>
                                </ul>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-black text-[22px] font-bold">Legal Basis for Processing</h2>
                            <div className="space-y-4">
                                <p>We process personal data based on:</p>
                                <ul className="list-disc pl-6 space-y-1">
                                    <li>Your consent</li>
                                    <li>Performance of a contract</li>
                                    <li>Compliance with legal obligations</li>
                                    <li>Legitimate business interests</li>
                                </ul>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-black text-[22px] font-bold">Cookies and Tracking Technologies</h2>
                            <div className="space-y-4">
                                <p>
                                    We use cookies, SDKs, and similar technologies to enhance user experience, analyze usage, and improve Services. You may control cookies through your device or browser settings, but disabling them may affect Platform functionality.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-black text-[22px] font-bold">Sharing of Information</h2>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <h3 className="text-black font-bold">Organizers & Merchants</h3>
                                    <p>To fulfill bookings, manage entries, and provide event-related services.</p>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-black font-bold">Service Providers</h3>
                                    <p>Including cloud hosting, analytics, communication, and customer support providers.</p>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-black font-bold">Payment Partners</h3>
                                    <p>For secure processing of transactions.</p>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-black font-bold">Legal Authorities</h3>
                                    <p>When required by law, court order, or governmental request.</p>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-black font-bold">Business Transfers</h3>
                                    <p>In the event of a merger, acquisition, or sale of assets.</p>
                                </div>
                                <p className="pt-2">We do not sell your personal data to third parties.</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-black text-[22px] font-bold">Data Retention</h2>
                            <div className="space-y-4">
                                <p>
                                    We retain personal data only as long as necessary to provide Services, comply with legal obligations, resolve disputes, and enforce agreements.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-black text-[22px] font-bold">Data Security</h2>
                            <div className="space-y-4">
                                <p>
                                    We implement reasonable administrative, technical, and physical safeguards to protect your data. However, no method of transmission or storage is completely secure, and we cannot guarantee absolute security.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-black text-[22px] font-bold">Your Rights and Choices</h2>
                            <div className="space-y-4">
                                <p>Subject to applicable law, you may:</p>
                                <ul className="list-disc pl-6 space-y-1">
                                    <li>Access or update your personal information</li>
                                    <li>Withdraw consent for marketing communications</li>
                                    <li>Request account deletion</li>
                                    <li>Request correction or deletion of data</li>
                                </ul>
                                <p>Requests can be made through the Platform or via official support channels.</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-black text-[22px] font-bold">Children&apos;s Privacy</h2>
                            <div className="space-y-4">
                                <p>
                                    The Platform is not intended for independent use by individuals under 18 years of age. Minors may use the Platform only under parental or legal guardian supervision.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-black text-[22px] font-bold">Changes to This Privacy Policy</h2>
                            <div className="space-y-4">
                                <p>
                                    We may update this Privacy Policy from time to time. Continued use of the Platform after changes constitutes acceptance of the revised Policy.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-10 border-t border-zinc-200">
                        <h2 className="text-black text-[22px] font-bold mb-4">Grievance Redressal & Contact</h2>
                        <p>
                            For questions, concerns, or grievances related to this Privacy Policy or your data, please contact us through the support channels available on the Platform.
                        </p>
                        <p className="mt-6 font-bold text-black">
                            By using Ticpin, you acknowledge that you have read, understood, and agreed to this Privacy Policy.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}