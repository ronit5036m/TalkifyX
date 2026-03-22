import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Plus,
  MoreVertical,
  X,
  Loader2,
  Eye,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import useAuthStore from "../stores/useAuthStore";
import useStatusStore from "../stores/useStatusStore";
import { useTheme } from "../theme/Theme";
import { Image } from "../assets/image";

// Status Ring Component
const StatusRing = ({ stories, viewedStoryIds, children }) => {
  const radius = 22;
  const stroke = 2;
  // const normalizedRadius = radius - stroke * 2;
  // const circumference = normalizedRadius * 2 * Math.PI;

  const total = stories.length;

  if (total === 1) {
    const isViewed = viewedStoryIds.has(stories[0].id);
    return (
      <div
        className={`w-12 h-12 flex-shrink-0 flex items-center justify-center p-[3px] rounded-full border-2 ${
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
    <div className="relative w-12 h-12 flex items-center justify-center">
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
              strokeWidth="2"
              strokeLinecap="round"
            />
          );
        })}
      </svg>
      <div className="w-[86%] h-[86%] rounded-full overflow-hidden z-10">
        {children}
      </div>
    </div>
  );
};

const Status = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuthStore();
  
  const { 
    statuses, 
    myStatus, 
    isLoading, 
    isUploading, 
    fetchStatuses, 
    uploadStatus, 
    markStatusViewed,
    getViewers,
    subscribeToStatusEvents, 
    unsubscribeFromStatusEvents 
  } = useStatusStore();

  const fileInputRef = useRef(null);

  // State
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [viewingStoryIndex, setViewingStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [viewedStoryIds, setViewedStoryIds] = useState(new Set());
  
  // Viewers Logic
  const [viewers, setViewers] = useState([]);
  const [showViewers, setShowViewers] = useState(false);
  const [isMyStatus, setIsMyStatus] = useState(false);

  // Initial Fetch & Subscription
  useEffect(() => {
    fetchStatuses();
    subscribeToStatusEvents();
    return () => unsubscribeFromStatusEvents();
  }, [fetchStatuses, subscribeToStatusEvents, unsubscribeFromStatusEvents]);

  // Derive initial viewed state from data
  useEffect(() => {
    if (statuses.length > 0 || myStatus) {
      const newViewedIds = new Set(viewedStoryIds);
      
      const processGroup = (group) => {
         group?.stories.forEach(story => {
             // Check if current user is in viewers list
             if (story.viewers && story.viewers.includes(user?._id)) {
                 newViewedIds.add(story.id);
             }
         });
      };

      statuses.forEach(processGroup);
      if (myStatus) processGroup(myStatus);

      setViewedStoryIds(newViewedIds);
    }
  }, [statuses, myStatus, user?._id]);


  const handleSelectStatus = (statusGroup) => {
    // Determine if it's my status
    const isMine = statusGroup.user._id === user?._id;
    setIsMyStatus(isMine);
    setSelectedStatus(statusGroup);
    
    // Auto-reset viewers panel
    setShowViewers(false);
    setViewers([]);

    // Find first unviewed (only if not mine, since I've probably seen mine)
    let startIndex = 0;
    if (!isMine) {
        const firstUnviewedIndex = statusGroup.stories.findIndex(
            (s) => !viewedStoryIds.has(s.id)
        );
        startIndex = firstUnviewedIndex >= 0 ? firstUnviewedIndex : 0;
    }
    setViewingStoryIndex(startIndex);
    setProgress(0);
    
    // Fetch viewers immediately if it's mine
    if (isMine) {
        fetchViewersForStory(statusGroup.stories[startIndex].id);
    }
  };

  const fetchViewersForStory = async (storyId) => {
      const list = await getViewers(storyId);
      setViewers(list);
  };
  
  // Refetch viewers when story index changes (if my status)
  useEffect(() => {
      if (selectedStatus && isMyStatus) {
         fetchViewersForStory(selectedStatus.stories[viewingStoryIndex].id);
      }
  }, [viewingStoryIndex, selectedStatus, isMyStatus]);

  const handleCloseStatus = () => {
    setSelectedStatus(null);
    setViewingStoryIndex(0);
    setProgress(0);
    setShowViewers(false);
  };

  const markCurrentStoryViewed = () => {
    if (selectedStatus && !isMyStatus) {
      const story = selectedStatus.stories[viewingStoryIndex];
      // Optimistic update
      if (!viewedStoryIds.has(story.id)) {
         setViewedStoryIds((prev) => new Set(prev).add(story.id));
         markStatusViewed(story.id); // Call API
      }
    }
  };

  // Progress Timer
  useEffect(() => {
    let interval;
    if (selectedStatus && !showViewers) {
      markCurrentStoryViewed();

      const currentStory = selectedStatus.stories[viewingStoryIndex];
      const duration = currentStory.duration || 5000; 
      const step = 100 / (duration / 50);

      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            if (viewingStoryIndex < selectedStatus.stories.length - 1) {
              setViewingStoryIndex((prev) => prev + 1);
              return 0;
            } else {
              handleCloseStatus();
              return 100;
            }
          }
          return prev + step;
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [selectedStatus, viewingStoryIndex, showViewers]);


  const handleNextStory = (e) => {
    e?.stopPropagation();
    if(showViewers) return; // Disable next on tap if viewing list

    markCurrentStoryViewed();
    if (selectedStatus && viewingStoryIndex < selectedStatus.stories.length - 1) {
      setViewingStoryIndex((prev) => prev + 1);
      setProgress(0);
    } else {
      handleCloseStatus();
    }
  };

  const handlePrevStory = (e) => {
    e?.stopPropagation();
    if(showViewers) return; 

    if (selectedStatus && viewingStoryIndex > 0) {
      setViewingStoryIndex((prev) => prev - 1);
      setProgress(0);
    }
  };

  // Upload Logic
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("media", file);

    try {
      await uploadStatus(formData);
    } catch(err) {
      // Error handled in store
    }
  };

  const triggerUpload = (e) => {
    e.stopPropagation();
    fileInputRef.current.click();
  };


  return (
    <div className={`flex h-screen w-full overflow-hidden ${theme.navBg}`}>
      {/* LEFT SIDE */}
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className={`${
          selectedStatus ? "hidden md:flex" : "flex"
        } flex-col h-full w-full md:w-[400px] lg:w-[450px] ${
          theme.bg
        } border-r ${theme.divider} flex-shrink-0 z-10`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-4 py-4 ${theme.navBg} border-b ${theme.divider} shadow-sm`}>
          <div className="flex items-center gap-3">
             <button
              onClick={() => navigate(-1)}
              className={`${theme.text} p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-all`}
            >
              <ArrowLeft size={22} />
            </button>
            <h1 className={`text-xl font-semibold ${theme.text}`}>Status</h1>
          </div>
          <div className={`${theme.textMuted} p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full cursor-pointer`}>
            <MoreVertical size={20} />
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-0 pb-20 md:pb-0">
            {/* My Status */}
            <div 
              className="p-4 flex items-center gap-4 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
              onClick={() => {
                 if (myStatus && myStatus.stories.length > 0) {
                    handleSelectStatus(myStatus);
                 } else {
                    triggerUpload({ stopPropagation: () => {} });
                 }
              }}
            >
               <div className="relative">
                 <img
                    src={user?.avatar || Image.defaultUser}
                    alt="My Status"
                    className={`w-12 h-12 rounded-full object-cover ${myStatus ? "border-2 border-teal-500 p-[2px]" : ""}`}
                 />
                 <div 
                   className="absolute bottom-0 right-0 bg-teal-500 rounded-full p-0.5 border-2 border-white dark:border-slate-900 cursor-pointer hover:bg-teal-600 transition-colors"
                   onClick={triggerUpload} 
                 >
                   <Plus size={14} className="text-white" strokeWidth={3} />
                 </div>
                 {/* Hidden Input */}
                 <input 
                   type="file" 
                   ref={fileInputRef} 
                   className="hidden" 
                   accept="image/*,video/*"
                   onChange={handleFileChange}
                 />
               </div>

               <div className="flex-1">
                 <h3 className={`font-medium ${theme.text}`}>My Status</h3>
                 <div className={`text-sm ${theme.textMuted} flex items-center gap-2`}>
                   {isUploading ? (
                      <span className="flex items-center gap-1 text-teal-500">
                        <Loader2 size={12} className="animate-spin"/> Uploading...
                      </span>
                   ) : (
                      myStatus ? "Click to view / + to add" : "Click to add status update"
                   )}
                 </div>
               </div>
            </div>

            {/* Recent Updates */}
            {statuses.length > 0 && statuses.some(s => s.stories.some(st => !viewedStoryIds.has(st.id))) && (
               <>
                <div className={`px-4 py-2 text-sm font-medium ${theme.textMuted} uppercase tracking-wider text-[11px] mt-2`}>
                  Recent updates
                </div>
                {statuses
                   .filter(s => s.stories.some(st => !viewedStoryIds.has(st.id)))
                   .map(status => (
                     <div
                       key={status.user._id}
                       onClick={() => handleSelectStatus(status)}
                       className="px-4 py-3 flex items-center gap-4 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                     >
                        <StatusRing stories={status.stories} viewedStoryIds={viewedStoryIds}>
                           <img 
                              src={status.user.avatar || Image.defaultUser} 
                              alt={status.user.username}
                              className="w-full h-full object-cover"
                           />
                        </StatusRing>
                        <div className="flex-1 border-b border-transparent">
                           <h3 className={`font-medium ${theme.text} text-base`}>{status.user.username}</h3>
                           <p className={`text-sm ${theme.textMuted}`}>
                             {new Date(status.stories[status.stories.length-1].createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                           </p>
                        </div>
                     </div>
                   ))
                }
               </>
            )}

            {/* Viewed Updates */}
             {statuses.length > 0 && statuses.some(s => s.stories.every(st => viewedStoryIds.has(st.id))) && (
               <>
                <div className={`px-4 py-2 text-sm font-medium ${theme.textMuted} uppercase tracking-wider text-[11px] mt-4`}>
                   Viewed updates
                </div>
                {statuses
                   .filter(s => s.stories.every(st => viewedStoryIds.has(st.id)))
                   .map(status => (
                     <div
                        key={status.user._id}
                        onClick={() => handleSelectStatus(status)}
                        className="px-4 py-3 flex items-center gap-4 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                     >
                        <div className={`w-12 h-12 flex-shrink-0 flex items-center justify-center p-[3px] rounded-full border-2 ${theme.divider} relative`}>
                           <div className="w-full h-full rounded-full overflow-hidden">
                             <img 
                                src={status.user.avatar || Image.defaultUser} 
                                alt={status.user.username}
                                className="w-full h-full object-cover opacity-80"
                             />
                           </div>
                        </div>
                        <div className="flex-1">
                           <h3 className={`font-medium ${theme.text} text-base opacity-90`}>{status.user.username}</h3>
                           <p className={`text-sm ${theme.textMuted}`}>
                              {new Date(status.stories[status.stories.length-1].createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                           </p>
                        </div>
                     </div>
                   ))
                }
               </>
             )}


             {!isLoading && statuses.length === 0 && !myStatus && (
                <div className="flex flex-col items-center justify-center mt-20 opacity-50">
                    <p className={theme.textMuted}>No status updates available</p>
                </div>
             )}
        </div>
      </motion.div>

      {/* RIGHT SIDE (Overlay) */}
      <div className={`${
         selectedStatus ? "fixed inset-0 z-[60] flex bg-black md:static md:z-auto" : "hidden md:flex"
      } flex-1 relative items-center justify-center overflow-hidden`}>
         {selectedStatus ? (
            <div className="relative w-full h-full flex items-center justify-center bg-zinc-900">
              {/* Top Controls */}
              <div className="absolute top-0 left-0 right-0 z-20 p-4 pt-6 bg-gradient-to-b from-black/60 to-transparent">
                 <div className="flex gap-1.5 mb-3">
                   {selectedStatus.stories.map((story, idx) => (
                      <div key={story.id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-white transition-all duration-100 ease-linear"
                          style={{
                             width: idx < viewingStoryIndex ? "100%" : idx === viewingStoryIndex ? `${progress}%` : "0%"
                          }}
                        ></div>
                      </div>
                   ))}
                 </div>

                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-white">
                       <ArrowLeft className="md:hidden cursor-pointer" onClick={handleCloseStatus} />
                       <img 
                         src={selectedStatus.user.avatar || Image.defaultUser}
                         className="w-10 h-10 rounded-full border border-white/20"
                       />
                       <div className="flex flex-col">
                          <span className="font-semibold text-sm">{selectedStatus.user.username}</span>
                          <span className="text-xs text-white/70">
                             {new Date(selectedStatus.stories[viewingStoryIndex].createdAt).toLocaleString()}
                          </span>
                       </div>
                    </div>
                    <div className="flex gap-4 text-white">
                       <button onClick={handleCloseStatus} className="hover:bg-white/10 p-2 rounded-full">
                          <X size={24} />
                       </button>
                    </div>
                 </div>
              </div>

              {/* Content */}
              <div 
                className="w-full h-full flex items-center justify-center relative bg-black"
                onClick={handleNextStory}
              >
                 {selectedStatus.stories[viewingStoryIndex].type === 'video' ? (
                    <video
                       src={selectedStatus.stories[viewingStoryIndex].url}
                       className="max-h-full max-w-full object-contain"
                       autoPlay
                    />
                 ) : (
                    <img 
                       src={selectedStatus.stories[viewingStoryIndex].url}
                       className="max-h-full max-w-full object-contain"
                    />
                 )}

                 {/* Tap Zones */}
                 <div className="absolute left-0 top-0 bottom-0 w-1/3 z-10 cursor-pointer" onClick={handlePrevStory}></div>
                 <div className="absolute right-0 top-0 bottom-0 w-1/3 z-10 cursor-pointer" onClick={handleNextStory}></div>
              </div>

              {/* Viewers List (Only for My Status) */}
              {isMyStatus && (
                <motion.div 
                  initial={{ y: "100%" }}
                  animate={{ y: showViewers ? "0%" : "92%" }} // 92% keeps the handle visible
                  transition={{ type: "spring", damping: 20 }}
                  className="absolute bottom-0 left-0 right-0 bg-zinc-900 rounded-t-2xl z-30 flex flex-col h-[60vh] border-t border-white/10"
                >
                    <div 
                       className="w-full flex items-center justify-center p-3 cursor-pointer hover:bg-white/5"
                       onClick={(e) => {
                          e.stopPropagation();
                          setShowViewers(!showViewers);
                       }}
                    >
                        <div className="flex flex-col items-center text-white/70 gap-1">
                            {showViewers ? <ChevronDown size={20}/> : <ChevronUp size={20}/>}
                            <div className="flex items-center gap-2 font-medium">
                                <Eye size={16} />
                                <span>{viewers.length} views</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 pt-0">
                        <h3 className="text-white font-semibold mb-4 text-lg">Viewed by</h3>
                        {viewers.length > 0 ? (
                           <div className="flex flex-col gap-4">
                               {viewers.map(viewer => (
                                  <div key={viewer._id} className="flex items-center gap-3">
                                      <img 
                                        src={viewer.avatar || Image.defaultUser} 
                                        className="w-10 h-10 rounded-full object-cover"
                                      />
                                      <span className="text-white font-medium">{viewer.username}</span>
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
         ) : (
            <div className="flex flex-col items-center justify-center text-center opacity-70 select-none">
                <div className="w-24 h-24 rounded-full border-2 border-white/10 flex items-center justify-center mb-6">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-white/40">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                </div>
                <h2 className="text-xl text-white/80 font-medium mb-2">Click on a contact to view status</h2>
                <p className="text-white/40 text-sm max-w-xs">User statuses will disappear after 24 hours.</p>
            </div>
         )}
      </div>

    </div>
  );
};

export default Status;
