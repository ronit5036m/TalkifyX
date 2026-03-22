import { create } from "zustand";
import { api, socket } from "../api/api";
import toast from "react-hot-toast";
import useAuthStore from "./useAuthStore";
import useChatStore from "./useChatStore";

const useStatusStore = create((set, get) => {
  return {
    statuses: [], // All statuses from contacts
    myStatus: null, // Current user's statuses
    isLoading: false,
    isUploading: false,
    viewedStatusIds: new Set(),
    
    fetchStatuses: async () => {
      set({ isLoading: true });
      try {
        // Ensure chats are loaded so we can resolve user details
        if (useChatStore.getState().chats.length === 0) {
           await useChatStore.getState().fetchChats();
        }

        const res = await api.get("/status/fetch");
        const allStatuses = res.data;
        const currentUser = useAuthStore.getState().user;
        
        // We need to find user details from chats if status has only ID
        const chats = useChatStore.getState().chats;

        // Separate my status vs others
        const grouped = allStatuses.reduce((acc, status) => {
          const userObj = status.user;
          const userId = typeof userObj === 'object' ? userObj._id : userObj; 
          
          if (!userId) return acc;

          let finalUser = typeof userObj === 'object' ? userObj : { _id: userId };

          // 1. Check if it's me
          if (userId === currentUser?._id) {
             finalUser = currentUser;
          } 
          // 2. If valid user object is missing (missing username), try to find in chats
          else if (!finalUser.username) {
             const chatWithUser = chats.find(c => 
                !c.isGroupChat && c.users.some(u => u._id === userId)
             );
             if (chatWithUser) {
                const foundUser = chatWithUser.users.find(u => u._id === userId);
                if (foundUser) finalUser = foundUser;
             }
          }

          if (!acc[userId]) {
            acc[userId] = {
              user: finalUser, 
              stories: [],
              timestamp: status.createdAt, 
            };
          }
          acc[userId].stories.push({
             id: status._id,
             ...status,
             url: status.media, 
             type: status.media.match(/\.(mp4|webm)$/i) ? 'video' : 'image', 
          });
          return acc;
        }, {});

        const groupedArray = Object.values(grouped);
        
        console.log(`DEBUG: Raw Statuses: ${allStatuses.length}`);
        groupedArray.forEach(g => {
             console.log(`DEBUG: User ${g.user?.username || g.user?._id} has ${g.stories.length} stories`);
        });
        
        // Split into "My Status" and "Others"
        const currentUserId = String(currentUser?._id || "");
        
        const myStatus = groupedArray.find(g => {
            const gUserId = String(g.user._id || g.user);
            return gUserId === currentUserId;
        }) || null;

        // Simplified Logic: Rely on Backend for "contacts" visibility.
        // We only exclude the current user from the main list.
        const contactStatuses = groupedArray.filter(g => {
             const gUserId = String(g.user._id || g.user);
             return gUserId !== currentUserId;
        });
        
        set({ 
          statuses: contactStatuses, 
          myStatus: myStatus,
          isLoading: false 
        });
      } catch (error) {
        console.error("Error fetching statuses:", error);
        toast.error("Failed to fetch statuses");
        set({ isLoading: false });
      }
    },

    uploadStatus: async (formData) => {
      set({ isUploading: true });
      try {
        // Default to contacts visibility (only people you have chatted with)
        formData.append("visibility", "contacts");

        const res = await api.post("/status/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        
        toast.success("Status uploaded successfully!");
        set({ isUploading: false });
        
        // Refresh statuses
        get().fetchStatuses();
        return res.data;
      } catch (error) {
        console.error("Error uploading status:", error);
        toast.error(error.response?.data?.message || "Failed to upload status");
        set({ isUploading: false });
        throw error;
      }
    },

    markStatusViewed: async (statusId) => {
      try {
        await api.post(`/status/view/${statusId}`);
        set((state) => ({
             viewedStatusIds: new Set(state.viewedStatusIds).add(statusId)
        }));
      } catch (error) {
        console.error("Error marking status viewed:", error);
      }
    },

    subscribeToStatusEvents: () => {
      socket.on("new status", (data) => {
        get().fetchStatuses();
        toast("New status update!", { icon: "🔔" });
      });
    },

    unsubscribeFromStatusEvents: () => {
      socket.off("new status");
    },
    
    getViewers: async (statusId) => {
      try {
        const res = await api.get(`/status/viewers/${statusId}`);
        return res.data.viewers || [];
      } catch (error) {
        console.error("Error fetching viewers:", error);
        return [];
      }
    }
  };
});

export default useStatusStore;
