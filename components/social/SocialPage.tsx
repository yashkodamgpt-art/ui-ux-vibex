import React, { useState } from 'react';
import type { User, Friend, Tag, FriendRequest } from '../../types';
import FriendsPanel from './FriendsPanel';
import TagsPanel from './TagsPanel';
import { SearchPanel } from './SearchPanel';
import { useSwipeGesture } from '../../lib/useSwipeGesture';

type SocialTab = 'Friends' | 'Search' | 'Tags';

interface SocialPageProps {
  user: User;
  friends: Friend[];
  tags: Tag[];
  friendRequests: FriendRequest[];
  onSaveTag: (tagData: Omit<Tag, 'id' | 'memberIds' | 'creator_id'>) => void;
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
  onOpenDM: (friendId: string) => void; // NEW
}

const SocialPage: React.FC<SocialPageProps> = (props) => {
  const [activeTab, setActiveTab] = useState<SocialTab>('Friends');

  // The internal loading state has been removed. The parent component `MainApp`
  // now manages the initial loading state for the entire application.
  // Skeletons in child components will now only appear if they have their
  // own internal data fetching (like the SearchPanel).

  const tabs: SocialTab[] = ['Friends', 'Search', 'Tags'];
  const currentIndex = tabs.indexOf(activeTab);

  const handleSwipeLeft = () => {
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1]);
    }
  };

  const handleSwipeRight = () => {
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1]);
    }
  };

  const swipeHandlers = useSwipeGesture(handleSwipeLeft, handleSwipeRight);

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 border-b border-[--color-border] px-4 bg-[--color-bg-primary]">
          <nav className="flex justify-around -mb-px">
              <button onClick={() => setActiveTab('Friends')} className={`w-full py-3 px-1 border-b-2 font-semibold text-sm transition-colors ${activeTab === 'Friends' ? 'border-[--color-accent-primary] text-[--color-accent-primary]' : 'border-transparent text-[--color-text-secondary] hover:text-[--color-text-primary] hover:border-[--color-border]'}`}>Friends ({props.friends.length})</button>
              <button onClick={() => setActiveTab('Search')} className={`w-full py-3 px-1 border-b-2 font-semibold text-sm transition-colors ${activeTab === 'Search' ? 'border-[--color-accent-primary] text-[--color-accent-primary]' : 'border-transparent text-[--color-text-secondary] hover:text-[--color-text-primary] hover:border-[--color-border]'}`}>Search</button>
              <button onClick={() => setActiveTab('Tags')} className={`w-full py-3 px-1 border-b-2 font-semibold text-sm transition-colors ${activeTab === 'Tags' ? 'border-[--color-accent-primary] text-[--color-accent-primary]' : 'border-transparent text-[--color-text-secondary] hover:text-[--color-text-primary] hover:border-[--color-border]'}`}>Tags ({props.tags.length})</button>
          </nav>
      </div>
      
      <div 
        className="flex-grow overflow-hidden relative"
        {...swipeHandlers}
      >
        <div className="h-full flex transition-transform duration-300 ease-out"
             style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
          <div className="min-w-full h-full overflow-y-auto bg-[--color-bg-secondary]">
            <FriendsPanel friends={props.friends} tags={props.tags} onViewProfile={props.onViewFriendProfile} onRemoveFriend={props.onRemoveFriend} onAssignToTags={props.onOpenAssignTagModal} onOpenDM={props.onOpenDM} />
          </div>
          <div className="min-w-full h-full overflow-y-auto bg-[--color-bg-secondary]">
            <SearchPanel currentUser={props.user} friends={props.friends} friendRequests={props.friendRequests} onSendRequest={props.onSendRequest} onAcceptRequest={props.onAcceptRequest} onRejectRequest={props.onRejectRequest} onViewProfile={props.onViewFriendProfile} />
          </div>
          <div className="min-w-full h-full overflow-y-auto bg-[--color-bg-secondary]">
            <TagsPanel tags={props.tags} friends={props.friends} onViewProfile={props.onViewFriendProfile} onCreateTag={props.onOpenCreateTagModal} onEditTag={props.onOpenEditTagModal} onDeleteTag={props.onDeleteTag} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialPage;