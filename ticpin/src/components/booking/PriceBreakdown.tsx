'use client';

import { Ticket, Tag } from 'lucide-react';

interface PriceBreakdownProps {
  orderAmount: number;
  bookingFee: number;
  couponDiscount?: number;
  offerDiscount?: number;
  ticpassDiscount?: number;
  showTicpassApplied?: boolean;
}

export default function PriceBreakdown({
  orderAmount,
  bookingFee,
  couponDiscount = 0,
  offerDiscount = 0,
  ticpassDiscount = 0,
  showTicpassApplied = false
}: PriceBreakdownProps) {
  const totalDiscount = couponDiscount + offerDiscount + ticpassDiscount;
  const grandTotal = (orderAmount + bookingFee) - totalDiscount;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Breakdown</h3>
      
      {/* Original Price */}
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600">Order Amount</span>
        <span className="text-sm font-medium text-gray-900">₹{orderAmount.toFixed(2)}</span>
      </div>
      
      {bookingFee > 0 && (
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Booking Fee</span>
          <span className="text-sm font-medium text-gray-900">₹{bookingFee.toFixed(2)}</span>
        </div>
      )}
      
      {/* Discounts Section */}
      {totalDiscount > 0 && (
        <div className="border-t border-gray-200 pt-3 space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Discounts Applied</h4>
          
          {couponDiscount > 0 && (
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-600">Coupon Discount</span>
              </div>
              <span className="text-sm font-medium text-green-600">-₹{couponDiscount.toFixed(2)}</span>
            </div>
          )}
          
          {offerDiscount > 0 && (
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-600">Offer Discount</span>
              </div>
              <span className="text-sm font-medium text-green-600">-₹{offerDiscount.toFixed(2)}</span>
            </div>
          )}
          
          {ticpassDiscount > 0 && (
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-600">Ticpass Discount (10%)</span>
              </div>
              <span className="text-sm font-medium text-green-600">-₹{ticpassDiscount.toFixed(2)}</span>
            </div>
          )}
        </div>
      )}
      
      {/* Grand Total */}
      <div className="border-t border-gray-200 pt-3">
        <div className="flex justify-between items-center">
          <span className="text-base font-semibold text-gray-900">Grand Total</span>
          <span className="text-base font-bold text-gray-900">₹{grandTotal.toFixed(2)}</span>
        </div>
        
        {totalDiscount > 0 && (
          <div className="mt-2 text-xs text-green-600">
            You saved ₹{totalDiscount.toFixed(2)} on this booking!
          </div>
        )}
      </div>
      
      {/* Ticpass Badge */}
      {showTicpassApplied && ticpassDiscount > 0 && (
        <div className="mt-3 bg-green-50 border border-green-200 rounded-md p-2">
          <div className="flex items-center gap-2">
            <Ticket className="w-4 h-4 text-green-600" />
            <span className="text-xs font-medium text-green-800">
              Ticpass benefits applied
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
