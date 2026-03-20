'use client';

import React from 'react';
import { Clock } from 'lucide-react';

interface TimeInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function TimeInput({ label, value, onChange, className = '' }: TimeInputProps) {
  // Convert 24h format to 12h format for display
  const formatTime12Hour = (time24: string) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const minute = minutes;
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour.toString().padStart(2, '0')}:${minute.padStart(2, '0')} ${period}`;
  };

  // Convert 12h format back to 24h for backend
  const parseTime12Hour = (time12: string) => {
    if (!time12) return '';
    const match = time12.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return time12;
    
    const [, hours, minutes, period] = match;
    let hour = parseInt(hours);
    if (period.toUpperCase() === 'PM' && hour !== 12) hour += 12;
    if (period.toUpperCase() === 'AM' && hour === 12) hour = 0;
    
    return `${hour.toString().padStart(2, '0')}:${minutes}`;
  };

  const [displayValue, setDisplayValue] = React.useState(
    value ? formatTime12Hour(value) : ''
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setDisplayValue(newValue);
    onChange(parseTime12Hour(newValue));
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-[20px] font-medium text-[#686868]">{label}</label>
      <div className="relative">
        <Clock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#AEAEAE]" size={20} />
        <input
          type="text"
          value={displayValue}
          onChange={handleChange}
          placeholder="e.g., 09:00 AM"
          className="w-full h-[52px] border border-[#D9D9D9] rounded-[12px] pl-12 pr-4 text-[16px] focus:outline-none focus:border-[#5331EA] transition-colors"
        />
      </div>
    </div>
  );
}
