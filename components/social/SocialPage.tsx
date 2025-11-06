import React, { useState } from 'react';
import type { User, Friend, Tag, FriendRequest } from '../../types';
import { MOCK_FRIENDS, MOCK_TAGS, MOCK_FRIEND_REQUESTS, MOCK_USERS_DATABASE } from '../../lib/mockData';
import FriendsPanel from './FriendsPanel';
import TagsPanel from './TagsPanel';
import SearchPanel from './SearchPanel';
import CreateTagModal from './CreateTagModal';
import AssignTagModal from './AssignTagModal';

type SocialTab = 'Friends' | 'Search' | 'Tags';

interface SocialPageProps {
  user: User;
  onViewFriendProfile: (friend: Friend) => void;
  setConfirmation: (confirmation: { title: string; message: string; onConfirm: () => void } | null) => void;
}

const SocialPage: React.FC<SocialPageProps> = ({ user, onViewFriendProfile, setConfirmation }) => {
  const [activeTab, setActiveTab] = useState<SocialTab>('Friends');
  const [friends, setFriends] = useState<Friend[]>(MOCK_FRIENDS);
  const [tags, setTags] = useState<Tag[]>(MOCK_TAGS);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>(MOCK_FRIEND_REQUESTS);

  // State for modals
  const [isCreateTagModalOpen, setIsCreateTagModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [isAssignTagModalOpen, setIsAssignTagModalOpen] = useState(false);
  const [assigningFriend, setAssigningFriend] = useState<Friend | null>(null);

  const handleOpenCreateTagModal = () => {
    setEditingTag(null);
    setIsCreateTagModalOpen(true);
  };

  const handleOpenEditTagModal = (tag: Tag) => {
    setEditingTag(tag);
    setIsCreateTagModalOpen(true);
  };

  const handleSaveTag = (tagData: Omit<Tag, 'id' | 'memberIds'>) => {
    if (editingTag) {
      setTags(prevTags => prevTags.map(t => t.id === editingTag.id ? { ...t, ...tagData } : t));
    } else {
      const newTag: Tag = { ...tagData, id: `tag-${Date.now()}`, memberIds: [] };
      setTags(prevTags => [...prevTags, newTag]);
    }
    setIsCreateTagModalOpen(false);
    setEditingTag(null);
  };

  const handleDeleteTag = (tagId: string) => {
    setConfirmation({
        title: "Delete Tag?",
        message: "Are you sure you want to delete this tag? Friends will not be removed.",
        onConfirm: () => {
            setTags(prevTags => prevTags.filter(t => t.id !== tagId));
            setConfirmation(null);
        }
    });
  };

  const handleOpenAssignTagModal = (friend: Friend) => {
    setAssigningFriend(friend);
    setIsAssignTagModalOpen(true);
  };

  const handleSaveFriendTags = (friendId: string, selectedTagIds: string[]) => {
      setTags(prevTags => prevTags.map(tag => {
          const hasFriend = tag.memberIds.includes(friendId);
          const shouldHaveFriend = selectedTagIds.includes(tag.id);
          if (hasFriend && !shouldHaveFriend) return { ...tag, memberIds: tag.memberIds.filter(id => id !== friendId) };
          if (!hasFriend && shouldHaveFriend) return { ...tag, memberIds: [...tag.memberIds, friendId] };
          return tag;
      }));
      setIsAssignTagModalOpen(false);
      setAssigningFriend(null);
  };

  const handleRemoveFriend = (friendId: string) => {
    const friendToRemove = friends.find(f => f.id === friendId);
    if (!friendToRemove) return;

    setConfirmation({
        title: `Remove ${friendToRemove.username}?`,
        message: `Are you sure you want to remove ${friendToRemove.username}?`,
        onConfirm: () => {
            setFriends(prev => prev.filter(f => f.id !== friendId));
            setTags(prev => prev.map(tag => ({ ...tag, memberIds: tag.memberIds.filter(id => id !== friendId) })));
            setConfirmation(null);
        }
    });
  };

  // --- NEW Friend Request Handlers ---
  const handleSendRequest = (toUserId: string) => {
      setFriendRequests(prev => [...prev, { fromUserId: user.id, toUserId }]);
  };

  const handleAcceptRequest = (fromUserId: string) => {
      const userToAdd = MOCK_USERS_DATABASE.find(u => u.id === fromUserId);
      if (userToAdd) {
          setFriends(prev => [...prev, userToAdd]);
      }
      setFriendRequests(prev => prev.filter(req => !(req.fromUserId === fromUserId && req.toUserId === user.id)));
  };

  const handleRejectRequest = (fromUserId: string) => {
      setFriendRequests(prev => prev.filter(req => !(req.fromUserId === fromUserId && req.toUserId === user.id)));
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'Friends':
        return <FriendsPanel friends={friends} tags={tags} onViewProfile={onViewFriendProfile} onRemoveFriend={handleRemoveFriend} onAssignToTags={handleOpenAssignTagModal} />;
      case 'Search':
        return <SearchPanel currentUser={user} friends={friends} allUsers={MOCK_USERS_DATABASE} friendRequests={friendRequests} onSendRequest={handleSendRequest} onAcceptRequest={handleAcceptRequest} onRejectRequest={handleRejectRequest} onViewProfile={onViewFriendProfile} />;
      case 'Tags':
        return <TagsPanel tags={tags} friends={friends} onViewProfile={onViewFriendProfile} onCreateTag={handleOpenCreateTagModal} onEditTag={handleOpenEditTagModal} onDeleteTag={handleDeleteTag} />;
      default:
        return null;
    }
  }

  return (
    <>
      <div className="h-full flex flex-col">
        <div className="flex-shrink-0 border-b border-gray-200 px-4">
            <nav className="flex justify-around -mb-px">
                <button onClick={() => setActiveTab('Friends')} className={`w-full py-3 px-1 border-b-2 font-semibold text-sm ${activeTab === 'Friends' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Friends ({friends.length})</button>
                <button onClick={() => setActiveTab('Search')} className={`w-full py-3 px-1 border-b-2 font-semibold text-sm ${activeTab === 'Search' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Search</button>
                <button onClick={() => setActiveTab('Tags')} className={`w-full py-3 px-1 border-b-2 font-semibold text-sm ${activeTab === 'Tags' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Tags ({tags.length})</button>
            </nav>
        </div>
        
        <div className="flex-grow overflow-y-auto bg-gray-50">
            {renderContent()}
        </div>
      </div>

      <CreateTagModal isOpen={isCreateTagModalOpen} onClose={() => setIsCreateTagModalOpen(false)} onSave={handleSaveTag} existingTag={editingTag} />
      
      {assigningFriend && (
        <AssignTagModal isOpen={isAssignTagModalOpen} onClose={() => setIsAssignTagModalOpen(false)} friend={assigningFriend} tags={tags} onSave={handleSaveFriendTags} onCreateTag={handleOpenCreateTagModal} />
      )}
    </>
  );
};

export default SocialPage;