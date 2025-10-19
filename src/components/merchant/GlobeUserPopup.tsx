import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface User {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  location: string;
}

interface GlobeUserPopupProps {
  users: User[];
  cityName: string;
  onClose: () => void;
}

export const GlobeUserPopup = ({ users, cityName, onClose }: GlobeUserPopupProps) => {
  const navigate = useNavigate();

  const handleUserClick = (userId: string) => {
    // Navigate to merchant dashboard, community tab, with selected user
    navigate('/merchant', { 
      state: { 
        activeTab: 'community',
        selectedUserId: userId 
      } 
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-card border border-white/20 rounded-2xl p-6 max-w-2xl w-full mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold">{cityName}</h3>
            <p className="text-gray-400 text-sm">{users.length} {users.length === 1 ? 'member' : 'members'}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
          {users.map((user) => (
            <button
              key={user.user_id}
              onClick={() => handleUserClick(user.user_id)}
              className="flex flex-col items-center p-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500 transition-all group"
            >
              <div className="w-16 h-16 rounded-full overflow-hidden mb-3 border-2 border-white/20 group-hover:border-blue-500 transition-all">
                {user.avatar_url ? (
                  <img 
                    src={user.avatar_url} 
                    alt={user.display_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                    {user.display_name?.charAt(0) || '?'}
                  </div>
                )}
              </div>
              <span className="text-sm font-medium text-center line-clamp-2">
                {user.display_name || 'Unknown User'}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
