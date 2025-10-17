"use client";

import React from "react";
import Dialer from "./dialer";

type Props = {
  open: boolean;
  onClose: () => void;
  number?: string;
  userName?: string;
};

export default function DialerModal({ open, onClose, number, userName }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Dialer</h2>
          <button onClick={onClose} className="text-sm px-2 py-1 rounded bg-gray-100 hover:bg-gray-200">Close</button>
        </div>
        <div className="text-sm text-gray-700 mb-2">Number: {number || "N/A"}</div>
        <Dialer number={number} userName={userName} />
      </div>
    </div>
  );
}