'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  label: string;
  value?: string;
  onChange: (url: string) => void;
  onFileChange?: (file: File) => void;
  className?: string;
}

export default function ImageUpload({ label, value, onChange, onFileChange, className = '' }: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState(value || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreview(result);
        onFileChange?.(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-[20px] font-medium text-[#686868]">{label}</label>
      <div className="relative">
        <div
          className={`relative border-2 border-dashed rounded-[12px] h-[200px] flex items-center justify-center cursor-pointer transition-all ${
            dragActive ? 'border-[#5331EA] bg-[#F0F4FF]' : 'border-[#D9D9D9] hover:border-[#5331EA]'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          {preview ? (
            <div className="relative w-full h-full">
              <img
                src={preview}
                alt={label}
                className="w-full h-full object-cover rounded-[10px]"
              />
              <div className="absolute top-2 right-2 flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreview('');
                    onChange('');
                  }}
                  className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                >
                  <X size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="bg-[#5331EA] text-white p-2 rounded-full hover:bg-[#4056CC] transition-colors"
                >
                  <Upload size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-gray-400">
              <ImageIcon size={48} />
              <span className="text-[16px]">Click to upload or drag & drop</span>
              <span className="text-[14px] text-gray-500">{label}</span>
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
          }}
        />
      </div>
    </div>
  );
}
