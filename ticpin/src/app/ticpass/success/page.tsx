'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Ticket } from 'lucide-react';

export default function TicpassSuccessPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Get user from localStorage or Firebase
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      // Redirect to login if no user data
      router.push('/login');
    }
  }, [router]);

  const handleGoToDashboard = () => {
    router.push('/profile');
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Success Icon */}
        <div className="mb-8">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
        </div>

        {/* Success Message */}
        <h1 className="text-4xl font-bold text-white mb-4">
          Congratulations!
        </h1>
        
        <p className="text-xl text-white/80 mb-8">
          Your Ticpin Pass is now active
        </p>

        {/* Pass Details */}
        <div className="bg-white/10 border border-white/20 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-center mb-4">
            <Ticket className="w-8 h-8 text-white mr-3" />
            <h2 className="text-2xl font-semibold text-white">Ticpin Pass</h2>
          </div>
          
          <div className="space-y-3 text-left">
            <div className="flex justify-between text-white/80">
              <span>Duration:</span>
              <span className="text-white font-medium">3 Months</span>
            </div>
            <div className="flex justify-between text-white/80">
              <span>Status:</span>
              <span className="text-green-400 font-medium">Active</span>
            </div>
            <div className="flex justify-between text-white/80">
              <span>Valid Until:</span>
              <span className="text-white font-medium">
                {new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Benefits Reminder */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-3">Your Benefits</h3>
          <ul className="text-left space-y-2 text-white/80">
            <li>• 2 Free Turf Bookings</li>
            <li>• 2 Dining Vouchers (₹250 each)</li>
            <li>• Early Access to Events</li>
            <li>• Exclusive Discounts</li>
          </ul>
        </div>

        {/* Action Button */}
        <button
          onClick={handleGoToDashboard}
          className="w-full bg-white text-black py-4 rounded-2xl font-semibold text-lg hover:bg-gray-100 transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
