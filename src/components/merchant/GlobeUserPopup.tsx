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
    // Close the popup first
    onClose();
    
    // Navigate to merchant dashboard, community tab, with selected user
    navigate('/merchant', { 
      state: { 
        activeTab: 'community',
        selectedUserId: userId 
      } 
    });
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-card border border-white/20 rounded-2xl p-6 max-w-3xl w-full mx-4 shadow-2xl max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold">{cityName}</h3>
            <p className="text-gray-400 text-sm">{users.length} {users.length === 1 ? 'member' : 'members'}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-3 overflow-y-auto flex-1">
          {users.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No community members found in this location yet.
            </div>
          ) : (
            users.map((user) => (
              <button
                key={user.user_id}
                onClick={() => handleUserClick(user.user_id)}
                className="w-full flex items-center gap-4 p-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500 transition-all group"
              >
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/20 group-hover:border-blue-500 transition-all flex-shrink-0">
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
                
                <div className="flex-1 text-left">
                  <div className="font-semibold text-lg text-white group-hover:text-blue-400 transition-colors">
                    {user.display_name || 'Unknown User'}
                  </div>
                  <div className="text-sm text-gray-400">
                    {user.location}
                  </div>
                </div>

                <div className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
