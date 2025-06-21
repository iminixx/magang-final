// src/components/SummaryCard.jsx

import React from "react";

/**
 * Props:
 *  - title: string
 *  - value: number
 */
export default function SummaryCard({ title, value }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col items-center justify-center">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
    </div>
  );
}
