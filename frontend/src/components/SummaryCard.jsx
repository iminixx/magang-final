import React from "react";

/**
 * Props:
 *  - title: string
 *  - value: number
 *  - icon: React component (from lucide-react)
 *  - bgColor: Tailwind color class for background
 *  - textColor: Tailwind color class for text
 */
export default function SummaryCard({
  title,
  value,
  icon: Icon,
  bgColor,
  textColor,
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col items-center justify-center text-center">
      <div className={`p-2 rounded-full mb-2 ${bgColor}`}>
        <Icon className={`w-6 h-6 ${textColor}`} />
      </div>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  );
}
