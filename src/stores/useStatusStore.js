import { create } from "zustand";
import { api, socket } from "../api/api";
import toast from "react-hot-toast";
import useAuthStore from "./useAuthStore";
import useChatStore from "./useChatStore";

const useStatusStore = create((set, get) => ({
  statuses: [],
  myStatus: null,
  isLoading: false,
  isStatusUploading: false,
  viewedStatusIds: new Set(),

  fetchStatuses: async () => {
    set({ isLoading: true });
    try {
      if (useChatStore.getState().chats.length === 0) {
        await useChatStore.getState().fetchChats();
      }

      const res = await api.get("/status/fetch");
      const allStatuses = res.data;
      const currentUser = useAuthStore.getState().user;
      const chats = useChatStore.getState().chats;

      const grouped = allStatuses.reduce((acc, status) => {
        const userObj = status.user;
        const userId = typeof userObj === "object" ? userObj._id : userObj;

        if (!userId) return acc;

        let finalUser = typeof userObj === "object" ? userObj : { _id: userId };

        if (userId === currentUser?._id) {
          finalUser = currentUser;
        } else if (!finalUser.username) {
          const chatWithUser = chats.find(
            (c) => !c.isGroupChat && c.users.some((u) => u._id === userId),
          );
          if (chatWithUser) {
            const foundUser = chatWithUser.users.find((u) => u._id === userId);
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
          type: status.media?.match(/\.(mp4|webm|mov|mkv)$/i)
            ? "video"
            : "image",
        });
        return acc;
      }, {});

      const groupedArray = Object.values(grouped);
      const currentUserId = String(currentUser?._id || "");

      const myStatus =
        groupedArray.find(
          (g) => String(g.user._id || g.user) === currentUserId,
        ) || null;
      const contactStatuses = groupedArray.filter(
        (g) => String(g.user._id || g.user) !== currentUserId,
      );

      set({ statuses: contactStatuses, myStatus: myStatus, isLoading: false });
    } catch (error) {
      console.error("Error fetching statuses:", error);
      toast.error("Failed to fetch statuses");
      set({ isLoading: false });
    }
  },

  uploadStatus: async (formData) => {
    set({ isStatusUploading: true });
    try {
      const res = await api.post("/status/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      set({ isStatusUploading: false });
      get().fetchStatuses(); // Refresh immediately
      toast.success("Status uploaded!");
      return res.data;
    } catch (error) {
      console.error("Error uploading status:", error);
      toast.error(error.response?.data?.message || "Failed to upload status");
      set({ isStatusUploading: false });
      throw error;
    }
  },

  markStatusViewed: async (statusId) => {
    try {
      await api.post(`/status/view/${statusId}`);
      set((state) => ({
        viewedStatusIds: new Set(state.viewedStatusIds).add(statusId),
      }));
    } catch (error) {
      console.error("Error marking status viewed:", error);
    }
  },

  subscribeToStatusEvents: () => {
    socket.on("new status", () => {
      get().fetchStatuses();
    });
    socket.on("status viewed", () => {
      get().fetchStatuses(); // Refreshes to update view counts
    });
  },

  unsubscribeFromStatusEvents: () => {
    socket.off("new status");
    socket.off("status viewed");
  },

  getViewers: async (statusId) => {
    try {
      const res = await api.get(`/status/viewers/${statusId}`);
      return res.data.viewers || [];
    } catch (error) {
      console.error("Error fetching viewers:", error);
      return [];
    }
  },
}));

export default useStatusStore;