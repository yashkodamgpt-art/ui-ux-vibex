import React from 'react';

const ProfilePage: React.FC = () => {
  return (
    <div className="p-4 pt-20 h-full"> {/* pt-20 to offset the fixed PageHeader */}
      <h1 className="text-2xl font-bold">Profile</h1>
      <p className="text-gray-600 mt-4">
        This is the placeholder for the Profile page. 
        User settings, editable fields, and the Cookie Score will go here.
      </p>
    </div>
  );
};

export default ProfilePage;
