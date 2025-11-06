import React from 'react';

const AlertsPage: React.FC = () => {
  return (
    <div className="p-4 pt-20 h-full"> {/* pt-20 to offset the fixed PageHeader */}
      <h1 className="text-2xl font-bold">Alerts</h1>
      <p className="text-gray-600 mt-4">
        This is the placeholder for the Alerts page. 
        Notifications and Messages will go here.
      </p>
    </div>
  );
};

export default AlertsPage;
