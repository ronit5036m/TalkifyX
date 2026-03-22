import { useState, useEffect, useRef } from "react";
import { ArrowLeft, X, Eye, ChevronUp, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import useStatusStore from "../../stores/useStatusStore";
import { Image } from "../../assets/image";
import formatStatusTime from "../../util/formatStatusTime";

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
                {formatStatusTime(currentStory.createdAt)}
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

export default StatusViewer;
