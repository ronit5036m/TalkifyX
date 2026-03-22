import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Plus,
  MoreVertical,
  X,
  Loader2,
  Eye,
  ChevronUp,
  ChevronDown,
  Send,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import useAuthStore from "../stores/useAuthStore";
import useStatusStore from "../stores/useStatusStore";
import { useTheme } from "../theme/Theme";
import { Image } from "../assets/image";

// ==========================================
// 1. Status Ring Component (Circular Progress)
// ==========================================
const StatusRing = ({ stories, viewedStoryIds, children }) => {
  const total = stories.length;

  if (total === 1) {
    const isViewed = viewedStoryIds.has(stories[0].id);
    return (
      <div
        className={`w-14 h-14 flex-shrink-0 flex items-center justify-center p-[3px] rounded-full border-[3px] ${
          isViewed
            ? "border-slate-300 dark:border-slate-700"
            : "border-teal-500"
        } relative`}
      >
        <div className="w-full h-full rounded-full overflow-hidden">
          {children}
        </div>
      </div>
    );
  }

  const degreesPerSegment = 360 / total;
  const gapDegrees = 5;
  const drawDegrees = degreesPerSegment - gapDegrees;

  const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  const describeArc = (x, y, radius, startAngle, endAngle) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return [
      "M",
      start.x,
      start.y,
      "A",
      radius,
      radius,
      0,
      largeArcFlag,
      0,
      end.x,
      end.y,
    ].join(" ");
  };

  return (
    <div className="relative w-14 h-14 flex items-center justify-center">
      <svg
        className="absolute inset-0 w-full h-full -rotate-90"
        viewBox="0 0 50 50"
      >
        {stories.map((story, i) => {
          const startAngle = i * degreesPerSegment;
          const endAngle = startAngle + drawDegrees;
          const isViewed = viewedStoryIds.has(story.id);
          return (
            <path
              key={story.id}
              d={describeArc(25, 25, 23, startAngle, endAngle)}
              fill="none"
              stroke={isViewed ? "#6b7280" : "#14b8a6"}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          );
        })}
      </svg>
      <div className="w-[82%] h-[82%] rounded-full overflow-hidden z-10">
        {children}
      </div>
    </div>
  );
};

// ==========================================
// 2. Upload Modal Component
// ==========================================
const UploadModal = ({ isOpen, onClose, file, previewUrl }) => {
  const { uploadStatus, isStatusUploading } = useStatusStore();
  const [caption, setCaption] = useState("");
  const [visibility, setVisibility] = useState("contacts");
  const isVideo = file?.type.startsWith("video/");

  if (!isOpen) return null;

  const handleUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("media", file);
    if (caption) formData.append("caption", caption);
    formData.append("visibility", visibility);

    await uploadStatus(formData);
    onClose();
    setCaption("");
    setVisibility("contacts");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">New Status</h2>
          <button
            onClick={onClose}
            className="p-2 bg-white/5 rounded-full text-white hover:bg-white/10 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Media Preview */}
        <div className="w-full aspect-[9/16] max-h-[50vh] bg-black flex items-center justify-center overflow-hidden">
          {isVideo ? (
            <video
              src={previewUrl}
              className="w-full h-full object-contain"
              controls
              autoPlay
              loop
              muted
            />
          ) : (
            <img
              src={previewUrl}
              className="w-full h-full object-contain"
              alt="Preview"
            />
          )}
        </div>

        {/* Controls */}
        <div className="p-4 flex flex-col gap-4">
          <input
            type="text"
            placeholder="Enter some caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-teal-500"
          />

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 bg-black/50 rounded-xl p-1 border border-white/10">
              <button
                onClick={() => setVisibility("contacts")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${visibility === "contacts" ? "bg-white/20 text-white" : "text-white/50 hover:text-white"}`}
              >
                Contacts
              </button>
              <button
                onClick={() => setVisibility("everyone")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${visibility === "everyone" ? "bg-white/20 text-white" : "text-white/50 hover:text-white"}`}
              >
                Everyone
              </button>
            </div>

            <button
              onClick={handleUpload}
              disabled={isStatusUploading}
              className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-6 py-2.5 rounded-xl font-medium transition disabled:opacity-50"
            >
              {isStatusUploading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
              Upload
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// ==========================================
// 3. Status Viewer Component (Overlay)
// ==========================================
const StatusViewer = ({
  statusGroup,
  isMyStatus,
  viewedStoryIds,
  onClose,
  onNextStory,
  onPrevStory,
}) => {
  const { markStatusViewed, getViewers } = useStatusStore();
  const [viewingIndex, setViewingIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false); // Long press freeze

  const [viewers, setViewers] = useState([]);
  const [showViewers, setShowViewers] = useState(false);
  const videoRef = useRef(null);

  // Initialize starting story
  useEffect(() => {
    let startIndex = 0;
    if (!isMyStatus) {
      const firstUnviewed = statusGroup.stories.findIndex(
        (s) => !viewedStoryIds.has(s.id),
      );
      startIndex = firstUnviewed >= 0 ? firstUnviewed : 0;
    }
    setViewingIndex(startIndex);
    setProgress(0);
  }, [statusGroup, isMyStatus]);

  const currentStory = statusGroup.stories[viewingIndex];

  // Fetch viewers if it's my status
  useEffect(() => {
    if (isMyStatus && currentStory) {
      getViewers(currentStory.id).then(setViewers);
    }
  }, [viewingIndex, isMyStatus, currentStory]);

  // Mark viewed
  useEffect(() => {
    if (!isMyStatus && currentStory && !viewedStoryIds.has(currentStory.id)) {
      viewedStoryIds.add(currentStory.id); // Optimistic local add
      markStatusViewed(currentStory.id);
    }
  }, [viewingIndex, currentStory, isMyStatus]);

  // Handle Video Pause/Play on Long Press
  useEffect(() => {
    if (videoRef.current) {
      if (isPaused || showViewers) videoRef.current.pause();
      else videoRef.current.play();
    }
  }, [isPaused, showViewers]);

  // Progress Timer (Images)
  useEffect(() => {
    let interval;
    if (!isPaused && !showViewers && currentStory?.type === "image") {
      const duration = 5000;
      const step = 100 / (duration / 50);

      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            handleNext();
            return 100;
          }
          return prev + step;
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [viewingIndex, isPaused, showViewers, currentStory]);

  const handleNext = (e) => {
    e?.stopPropagation();
    if (showViewers) return;
    if (viewingIndex < statusGroup.stories.length - 1) {
      setViewingIndex((prev) => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrev = (e) => {
    e?.stopPropagation();
    if (showViewers) return;
    if (viewingIndex > 0) {
      setViewingIndex((prev) => prev - 1);
      setProgress(0);
    }
  };

  // --- Long Press Handlers ---
  const handlePointerDown = () => setIsPaused(true);
  const handlePointerUp = () => setIsPaused(false);

  if (!currentStory) return null;

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-zinc-950 select-none">
      {/* Top Header & Progress Bars */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 pt-6 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex gap-1.5 mb-4">
          {statusGroup.stories.map((story, idx) => (
            <div
              key={story.id}
              className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden"
            >
              <div
                className="h-full bg-white transition-all duration-75 ease-linear"
                style={{
                  width:
                    idx < viewingIndex
                      ? "100%"
                      : idx === viewingIndex
                        ? `${progress}%`
                        : "0%",
                }}
              />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <ArrowLeft className="md:hidden cursor-pointer" onClick={onClose} />
            <img
              src={statusGroup.user.avatar || Image.defaultUser}
              className="w-11 h-11 rounded-full border border-white/20 object-cover"
              alt="avatar"
            />
            <div className="flex flex-col">
              <span className="font-semibold text-[15px]">
                {statusGroup.user.username}
              </span>
              <span className="text-xs text-white/70">
                {new Date(currentStory.createdAt).toLocaleString([], {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-white/10 p-2 rounded-full text-white transition"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Main Content Area (With Long Press Handlers) */}
      <div
        className="w-full h-full flex flex-col relative"
        onMouseDown={handlePointerDown}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchEnd={handlePointerUp}
      >
        <div className="flex-1 flex items-center justify-center relative overflow-hidden">
          {currentStory.type === "video" ? (
            <video
              ref={videoRef}
              src={currentStory.url}
              className={`max-h-full max-w-full object-contain transition-transform duration-300 ${isPaused ? "scale-[0.98]" : "scale-100"}`}
              autoPlay
              playsInline
              onTimeUpdate={() => {
                if (videoRef.current && !showViewers && !isPaused) {
                  setProgress(
                    (videoRef.current.currentTime / videoRef.current.duration) *
                      100,
                  );
                }
              }}
              onEnded={handleNext}
            />
          ) : (
            <img
              src={currentStory.url}
              className={`max-h-full max-w-full object-contain transition-transform duration-300 ${isPaused ? "scale-[0.98]" : "scale-100"}`}
              alt="status"
              draggable={false}
            />
          )}

          {/* Tap Zones for Navigation */}
          <div
            className="absolute left-0 top-0 bottom-0 w-1/4 z-10 cursor-pointer"
            onClick={handlePrev}
          />
          <div
            className="absolute right-0 top-0 bottom-0 w-1/4 z-10 cursor-pointer"
            onClick={handleNext}
          />
        </div>

        {/* Caption Area */}
        {currentStory.caption && (
          <div className="absolute bottom-16 md:bottom-10 left-0 right-0 text-center z-10 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <p className="text-white text-lg font-medium drop-shadow-md">
              {currentStory.caption}
            </p>
          </div>
        )}
      </div>

      {/* Viewers List Drawer (Only for My Status) */}
      {isMyStatus && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: showViewers ? "0%" : "calc(100% - 48px)" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="absolute bottom-0 left-0 right-0 bg-zinc-900 rounded-t-3xl z-30 flex flex-col h-[60vh] border-t border-white/10"
        >
          <div
            className="w-full flex flex-col items-center justify-center p-2 cursor-pointer hover:bg-white/5"
            onClick={() => setShowViewers(!showViewers)}
          >
            {showViewers ? (
              <ChevronDown size={20} className="text-white/50" />
            ) : (
              <ChevronUp size={20} className="text-white/50" />
            )}
            <div className="flex items-center gap-2 font-medium text-white/90">
              <Eye size={16} />
              <span>{viewers.length} views</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 pt-2 custom-scrollbar">
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider text-white/50">
              Viewed by
            </h3>
            {viewers.length > 0 ? (
              <div className="flex flex-col gap-4">
                {viewers.map((viewer) => (
                  <div key={viewer._id} className="flex items-center gap-3">
                    <img
                      src={viewer.avatar || Image.defaultUser}
                      className="w-10 h-10 rounded-full object-cover"
                      alt="viewer"
                    />
                    <span className="text-white font-medium">
                      {viewer.username}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-white/40 text-center mt-10">
                No viewers yet
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

// ==========================================
// 4. Main Status Component
// ==========================================
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
              if (myStatus && myStatus.stories.length > 0)
                setSelectedStatusGroup(myStatus);
              else fileInputRef.current?.click();
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
                      {new Date(
                        status.stories[status.stories.length - 1].createdAt,
                      ).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
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
                      {new Date(
                        status.stories[status.stories.length - 1].createdAt,
                      ).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
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