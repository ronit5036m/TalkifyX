import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Plus, MoreVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import useAuthStore from "../stores/useAuthStore";
import useStatusStore from "../stores/useStatusStore";
import { useTheme } from "../theme/Theme";
import { Image } from "../assets/image";

import StatusRing from "../components/Status/StatusRing";
import UploadModal from "../components/Status/UploadModal";
import StatusViewer from "../components/Status/StatusViewer";
import formatStatusTime from "../util/formatStatusTime";

const Status = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuthStore();

  const {
    statuses,
    myStatus,
    fetchStatuses,
    subscribeToStatusEvents,
    unsubscribeFromStatusEvents,
  } = useStatusStore();

  // State
  const [selectedStatusGroup, setSelectedStatusGroup] = useState(null);
  const [viewedStoryIds, setViewedStoryIds] = useState(new Set());

  // Upload Modal State
  const fileInputRef = useRef(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Initial Fetch & Sync Viewed State
  useEffect(() => {
    fetchStatuses();
    subscribeToStatusEvents();
    return () => unsubscribeFromStatusEvents();
  }, []);

  useEffect(() => {
    if (statuses.length > 0 || myStatus) {
      const newViewedIds = new Set(viewedStoryIds);
      const processGroup = (group) => {
        group?.stories.forEach((story) => {
          if (story.viewers?.includes(user?._id)) newViewedIds.add(story.id);
        });
      };
      statuses.forEach(processGroup);
      if (myStatus) processGroup(myStatus);
      setViewedStoryIds(newViewedIds);
    }
  }, [statuses, myStatus, user?._id]);

  // Handle File Selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Create preview URL and open modal
    const url = URL.createObjectURL(file);
    setUploadFile(file);
    setPreviewUrl(url);
    setIsUploadModalOpen(true);
    e.target.value = null; // reset input
  };

  const closeUploadModal = () => {
    setIsUploadModalOpen(false);
    setUploadFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl); // Prevent memory leaks
    setPreviewUrl(null);
  };

  // Derived Lists based on mockup structure
  const recentUpdates = statuses.filter((s) =>
    s.stories.some((st) => !viewedStoryIds.has(st.id)),
  );
  const viewedUpdates = statuses.filter(
    (s) =>
      s.stories.length > 0 &&
      s.stories.every((st) => viewedStoryIds.has(st.id)),
  );

  return (
    <div className={`flex h-screen w-full overflow-hidden ${theme.navBg}`}>
      {/* Upload Modal Portal */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <UploadModal
            isOpen={isUploadModalOpen}
            onClose={closeUploadModal}
            file={uploadFile}
            previewUrl={previewUrl}
          />
        )}
      </AnimatePresence>

      {/* LEFT SIDE: Lists */}
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className={`${selectedStatusGroup ? "hidden md:flex" : "flex"} flex-col h-full w-full md:w-[400px] lg:w-[450px] ${theme.bg} border-r ${theme.divider} flex-shrink-0 z-10`}
      >
        <div
          className={`flex items-center justify-between px-4 py-4 ${theme.navBg} border-b ${theme.divider} shadow-sm z-10`}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className={`${theme.text} p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-all`}
            >
              <ArrowLeft size={22} />
            </button>
            <h1 className={`text-xl font-semibold ${theme.text}`}>Status</h1>
          </div>
          <div
            className={`${theme.textMuted} p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full cursor-pointer`}
          >
            <MoreVertical size={20} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pb-20 md:pb-0">
          {/* My Status Area */}
          <div
            className="px-4 py-5 flex items-center gap-4 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
            onClick={() => {
              if (myStatus && myStatus.stories.length > 0) {
                setSelectedStatusGroup(myStatus);
              } else {
                fileInputRef.current?.click();
              }
            }}
          >
            <div className="relative">
              <img
                src={user?.avatar || Image.defaultUser}
                className={`w-14 h-14 rounded-full object-cover ${myStatus ? "border-[3px] border-teal-500 p-[2px]" : ""}`}
                alt="Me"
              />
              <div
                className="absolute bottom-0 right-0 bg-teal-500 rounded-full p-1 border-2 border-white dark:border-slate-900 cursor-pointer hover:bg-teal-600 transition-transform hover:scale-110 shadow-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  fileInputRef.current?.click();
                }}
              >
                <Plus size={16} className="text-white" strokeWidth={3} />
              </div>

              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*,video/*"
                onChange={handleFileChange}
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            <div className="flex-1">
              <h3 className={`font-semibold text-lg ${theme.text}`}>
                My Status
              </h3>
              <p className={`text-sm ${theme.textMuted}`}>
                {myStatus
                  ? "Tap to view my status update"
                  : "Tap to add status update"}
              </p>
            </div>
          </div>

          {/* Recent Updates */}
          {recentUpdates.length > 0 && (
            <div className="mb-4">
              <div
                className={`px-5 py-2 text-sm font-semibold ${theme.textMuted} uppercase tracking-wider text-[12px] bg-black/5 dark:bg-white/5`}
              >
                Recent updates
              </div>
              {recentUpdates.map((status) => (
                <div
                  key={status.user._id}
                  onClick={() => setSelectedStatusGroup(status)}
                  className="px-4 py-3 flex items-center gap-4 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <StatusRing
                    stories={status.stories}
                    viewedStoryIds={viewedStoryIds}
                  >
                    <img
                      src={status.user.avatar || Image.defaultUser}
                      className="w-full h-full object-cover"
                      alt={status.user.username}
                    />
                  </StatusRing>
                  <div className="flex-1">
                    <h3 className={`font-medium ${theme.text} text-base`}>
                      {status.user.username}
                    </h3>
                    <p className={`text-sm ${theme.textMuted}`}>
                      {formatStatusTime(
                        status.stories[status.stories.length - 1].createdAt,
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Viewed Updates */}
          {viewedUpdates.length > 0 && (
            <div>
              <div
                className={`px-5 py-2 text-sm font-semibold ${theme.textMuted} uppercase tracking-wider text-[12px] bg-black/5 dark:bg-white/5`}
              >
                Viewed updates
              </div>
              {viewedUpdates.map((status) => (
                <div
                  key={status.user._id}
                  onClick={() => setSelectedStatusGroup(status)}
                  className="px-4 py-3 flex items-center gap-4 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <div
                    className={`w-14 h-14 flex-shrink-0 flex items-center justify-center p-[3px] rounded-full border-[3px] border-slate-300 dark:border-slate-700 relative`}
                  >
                    <img
                      src={status.user.avatar || Image.defaultUser}
                      className="w-full h-full rounded-full object-cover opacity-70"
                      alt={status.user.username}
                    />
                  </div>
                  <div className="flex-1">
                    <h3
                      className={`font-medium ${theme.text} text-base opacity-70`}
                    >
                      {status.user.username}
                    </h3>
                    <p className={`text-sm ${theme.textMuted}`}>
                      {formatStatusTime(
                        status.stories[status.stories.length - 1].createdAt,
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* RIGHT SIDE: Viewer (Overlay) */}
      <div
        className={`${selectedStatusGroup ? "fixed inset-0 z-[60] flex bg-black md:static md:z-auto" : "hidden md:flex"} flex-1 relative items-center justify-center overflow-hidden`}
      >
        {selectedStatusGroup ? (
          <StatusViewer
            statusGroup={selectedStatusGroup}
            isMyStatus={selectedStatusGroup.user._id === user?._id}
            viewedStoryIds={viewedStoryIds}
            onClose={() => setSelectedStatusGroup(null)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-center opacity-50 select-none">
            <div className="w-24 h-24 rounded-full border-2 border-current flex items-center justify-center mb-6">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <h2 className="text-xl font-medium mb-2">
              Click on a contact to view status
            </h2>
            <p className="text-sm max-w-xs">
              User statuses will disappear after 24 hours.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Status;
