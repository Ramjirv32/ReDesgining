'use client';

import { useState } from 'react';
import { Ticket, CheckCircle } from 'lucide-react';
import useUserPass from '@/hooks/useUserPass';

interface TicpassDiscountProps {
  onTicpassToggle: (useTicpass: boolean) => void;
  orderAmount: number;
  disabled?: boolean;
}

export default function TicpassDiscount({ 
  onTicpassToggle, 
  orderAmount, 
  disabled = false 
}: TicpassDiscountProps) {
  const [useTicpass, setUseTicpass] = useState(false);
  const { userPass, loading, error, hasActivePass, canApplyDiscount } = useUserPass();

  const handleTicpassToggle = (checked: boolean) => {
    setUseTicpass(checked);
    onTicpassToggle(checked);
  };

  const discountAmount = useTicpass && canApplyDiscount ? orderAmount * 0.10 : 0;

  if (loading) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 animate-pulse">
        <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
        <div className="h-3 bg-gray-300 rounded w-1/2"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <Ticket className="w-5 h-5 text-red-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900">
              Unable to check pass status
            </p>
            <p className="text-xs text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!hasActivePass) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <Ticket className="w-5 h-5 text-blue-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900">
              Want 10% discount on every booking?
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Get Ticpass and enjoy exclusive benefits
            </p>
          </div>
          <button
            onClick={() => window.open('/ticpass', '_blank')}
            className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Get Ticpass
          </button>
        </div>
      </div>
    );
  }

  if (!canApplyDiscount) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <Ticket className="w-5 h-5 text-yellow-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-900">
              Ticpass Benefits Limited
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              Discount benefits not available in current plan
            </p>
          </div>
          <button
            onClick={() => window.open('/ticpass', '_blank')}
            className="bg-yellow-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-yellow-700 transition-colors"
          >
            Upgrade Pass
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="pt-1">
          <input
            type="checkbox"
            id="use-ticpass"
            checked={useTicpass}
            onChange={(e) => handleTicpassToggle(e.target.checked)}
            disabled={disabled}
            className="w-4 h-4 text-green-600 border-green-300 rounded focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        <div className="flex-1">
          <label 
            htmlFor="use-ticpass" 
            className="flex items-center gap-2 cursor-pointer"
          >
            <Ticket className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-900">
              Use Ticpass Benefits
            </span>
            <CheckCircle className="w-4 h-4 text-green-600" />
          </label>
          
          <div className="mt-2 space-y-1">
            <p className="text-xs text-green-700">
              ✓ 10% instant discount on this booking
            </p>
            <p className="text-xs text-green-700">
              ✓ Valid until {userPass && new Date(userPass.end_date).toLocaleDateString()}
            </p>
            
            {useTicpass && discountAmount > 0 && (
              <div className="mt-2 pt-2 border-t border-green-200">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-green-900">Discount Applied:</span>
                  <span className="text-sm font-bold text-green-900">
                    -₹{discountAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
