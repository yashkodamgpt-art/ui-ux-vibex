import React, { useState, useEffect } from 'react';
import type { User, Friend, Tag, FriendRequest } from '../../types';
import { MOCK_USERS_DATABASE } from '../../lib/mockData';
import FriendsPanel from './FriendsPanel';
import TagsPanel from './TagsPanel';
import SearchPanel from './SearchPanel';

type SocialTab = 'Friends' | 'Search' | 'Tags';

interface SocialPageProps {
  user: User;
  friends: Friend[];
  tags: Tag[];
  friendRequests: FriendRequest[];
  onSaveTag: (tagData: Omit<Tag, 'id' | 'memberIds'>) => void;
  onDeleteTag: (tagId: string) => void;
  onRemoveFriend: (friendId: string) => void;
  onSaveFriendTags: (friendId: string, selectedTagIds: string[]) => void;
  onSendRequest: (toUserId: string) => void;
  onAcceptRequest: (fromUserId: string) => void;
  onRejectRequest: (fromUserId: string) => void;
  onViewFriendProfile: (friend: Friend) => void;
  setConfirmation: (confirmation: { title: string; message: string; onConfirm: () => void } | null) => void;
  onOpenCreateTagModal: () => void;
  onOpenEditTagModal: (tag: Tag) => void;
  onOpenAssignTagModal: (friend: Friend) => void;
}

const SocialPage: React.FC<SocialPageProps> = (props) => {
  const [activeTab, setActiveTab] = useState<SocialTab>('Friends');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data when the component mounts
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500); // Simulate a 500ms network request
    return () => clearTimeout(timer);
  }, []);

  const renderContent = () => {
    switch(activeTab) {
      case 'Friends':
        return <FriendsPanel isLoading={isLoading} friends={props.friends} tags={props.tags} onViewProfile={props.onViewFriendProfile} onRemoveFriend={props.onRemoveFriend} onAssignToTags={props.onOpenAssignTagModal} />;
      case 'Search':
        return <SearchPanel currentUser={props.user} friends={props.friends} allUsers={MOCK_USERS_DATABASE} friendRequests={props.friendRequests} onSendRequest={props.onSendRequest} onAcceptRequest={props.onAcceptRequest} onRejectRequest={props.onRejectRequest} onViewProfile={props.onViewFriendProfile} />;
      case 'Tags':
        return <TagsPanel isLoading={isLoading} tags={props.tags} friends={props.friends} onViewProfile={props.onViewFriendProfile} onCreateTag={props.onOpenCreateTagModal} onEditTag={props.onOpenEditTagModal} onDeleteTag={props.onDeleteTag} />;
      default:
        return null;
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 border-b border-gray-200 px-4">
          <nav className="flex justify-around -mb-px">
              <button onClick={() => setActiveTab('Friends')} className={`w-full py-3 px-1 border-b-2 font-semibold text-sm ${activeTab === 'Friends' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Friends ({props.friends.length})</button>
              <button onClick={() => setActiveTab('Search')} className={`w-full py-3 px-1 border-b-2 font-semibold text-sm ${activeTab === 'Search' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Search</button>
              <button onClick={() => setActiveTab('Tags')} className={`w-full py-3 px-1 border-b-2 font-semibold text-sm ${activeTab === 'Tags' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Tags ({props.tags.length})</button>
          </nav>
      </div>
      
      <div className="flex-grow overflow-y-auto bg-gray-50">
          {renderContent()}
      </div>
    </div>
  );
};

export default SocialPage;