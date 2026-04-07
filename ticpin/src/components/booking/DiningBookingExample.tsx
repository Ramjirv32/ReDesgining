'use client';

import { useState } from 'react';
import { CreditCard, Calendar, Users } from 'lucide-react';
import TicpassDiscount from './TicpassDiscount';
import PriceBreakdown from './PriceBreakdown';
import { CreateDiningPayload } from '@/lib/api/booking';
// m
export default function DiningBookingExample() {
  const [useTicpass, setUseTicpass] = useState(false);
  const [formData, setFormData] = useState<Partial<CreateDiningPayload>>({
    guests: 2,
    order_amount: 1000,
    booking_fee: 0,
    date: '2026-03-25',
    time_slot: '19:00',
  });

  // Simulated discount calculations
  const couponDiscount = 0; // Would come from applied coupon
  const offerDiscount = 0;   // Would come from applied offer
  const ticpassDiscount = useTicpass ? formData.order_amount! * 0.10 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const bookingData: CreateDiningPayload = {
      user_email: 'user@example.com', // Would come from auth context
      user_name: 'John Doe',
      user_phone: '+919876543210',
      address: '123 Main St',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      nationality: 'Indian',
      dining_id: 'dining123',
      venue_name: 'Sample Restaurant',
      date: formData.date || '2026-03-25',
      time_slot: formData.time_slot || '19:00',
      guests: formData.guests || 2,
      order_amount: formData.order_amount || 1000,
      booking_fee: formData.booking_fee || 0,
      use_ticpass: useTicpass,
    };

    console.log('Booking data:', bookingData);
    console.log('Expected discounts:', {
      coupon: couponDiscount,
      offer: offerDiscount,
      ticpass: ticpassDiscount,
      total: couponDiscount + offerDiscount + ticpassDiscount
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Complete Your Dining Booking</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Booking Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="w-4 h-4 inline mr-2" />
                Number of Guests
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={formData.guests}
                onChange={(e) => setFormData({ ...formData, guests: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Time Slot */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Time Slot
            </label>
            <select
              value={formData.time_slot}
              onChange={(e) => setFormData({ ...formData, time_slot: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="18:00">6:00 PM</option>
              <option value="19:00">7:00 PM</option>
              <option value="20:00">8:00 PM</option>
              <option value="21:00">9:00 PM</option>
            </select>
          </div>

          {/* Order Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expected Order Amount
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.order_amount}
              onChange={(e) => setFormData({ ...formData, order_amount: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter expected bill amount"
              required
            />
          </div>

          {/* Ticpass Discount Section */}
          <div>
            <TicpassDiscount
              onTicpassToggle={setUseTicpass}
              orderAmount={formData.order_amount || 0}
              disabled={false}
            />
          </div>

          {/* Price Breakdown */}
          <div>
            <PriceBreakdown
              orderAmount={formData.order_amount || 0}
              bookingFee={formData.booking_fee || 0}
              couponDiscount={couponDiscount}
              offerDiscount={offerDiscount}
              ticpassDiscount={ticpassDiscount}
              showTicpassApplied={useTicpass}
            />
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              className="w-full bg-black text-white py-3 px-4 rounded-md font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
            >
              <CreditCard className="w-5 h-5" />
              Proceed to Payment
            </button>
          </div>
        </form>
      </div>

      {/* Debug Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Debug Information</h3>
        <div className="text-xs text-gray-600 space-y-1">
          <p>Use Ticpass: {useTicpass ? 'Yes' : 'No'}</p>
          <p>Order Amount: ₹{formData.order_amount}</p>
          <p>Ticpass Discount: ₹{ticpassDiscount.toFixed(2)}</p>
          <p>Expected Grand Total: ₹{(formData.order_amount! + formData.booking_fee! - (couponDiscount + offerDiscount + ticpassDiscount)).toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}
