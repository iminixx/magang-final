import React from "react";

const EmptyState = ({ message, icon: Icon }) => {
  return (
    <div className="text-center py-12">
      {Icon && <Icon className="mx-auto h-12 w-12 text-gray-400 mb-4" />}
      <p className="text-gray-500">{message}</p>
    </div>
  );
};

export default EmptyState;
