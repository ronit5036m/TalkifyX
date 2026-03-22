import React, { useEffect, useState, useRef } from "react";
import {
  Copy,
  Pencil,
  ArrowLeft,
  Camera,
  Share2,
  Check,
  UserRound,
  X,
  Trash2,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../stores/useAuthStore";
import { useTheme } from "../theme/Theme";
import { Image } from "../assets/image";
import { api } from "../api/api";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import RightSideContent from "../components/RightSIdeContent";

const Profile = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user, loadUser } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [copied, setCopied] = useState(false);

  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchProfile = async () => {
      try {
        if (user) {
          if (mounted) setProfile(user);
        } else {
          setLoading(true);
          await loadUser();
        }
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchProfile();
    return () => {
      mounted = false;
    };
  }, [user, loadUser]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(profile.userCode || profile._id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Copy failed");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Connect with me",
          text: `My Unique ID is: ${profile.userCode}`,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Error sharing", err);
      }
    } else {
      copyId();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setPreview(url);
    setUploading(true);
    setShowPhotoMenu(false);

    try {
      const fd = new FormData();
      fd.append("avatar", file);

      const res = await api.put("/user/update_profile", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.success) {
        setUploadSuccess(true);
        setProfile(res.data.user || { ...profile, avatar: res.data.avatar });
        await loadUser();
        setTimeout(() => setUploadSuccess(false), 1800);
        toast.success("Profile photo updated");
      }
    } catch (err) {
      console.error("Upload failed", err);
      toast.error("Failed to upload photo");
    } finally {
      setUploading(false);
      e.target.value = null;
    }
  };

  const handleDeletePhoto = async () => {
    setShowPhotoMenu(false);
    setUploading(true);
    try {
      const res = await api.put("/user/update_profile", { removeAvatar: true });
      setProfile(res.data.user || { ...profile, avatar: null });
      setPreview(null);
      await loadUser();
      toast.success("Profile photo removed");
    } catch (err) {
      toast.error("Failed to remove photo");
    } finally {
      setUploading(false);
    }
  };

  const startEditing = (field) => {
    setEditingField(field);
    setEditValue(profile[field] || "");
  };

  const cancelEditing = () => {
    setEditingField(null);
    setEditValue("");
  };

  const saveField = async (field) => {
    if (editValue.trim() === profile[field]) {
      cancelEditing();
      return;
    }

    setIsSaving(true);
    try {
      const res = await api.put("/user/update_profile", {
        [field]: editValue.trim(),
      });
      setProfile(res.data.user || { ...profile, [field]: editValue.trim() });
      await loadUser();
      toast.success("Profile updated");
      setEditingField(null);
    } catch (err) {
      toast.error("Failed to update");
    } finally {
      setIsSaving(false);
    }
  };

  const EditableField = ({
    label,
    field,
    isMultiline = false,
    description,
  }) => {
    const isEditing = editingField === field;
    const value = profile[field] || "";

    return (
      <div className={`px-8 py-4 ${theme.mainBg} shadow-sm transition-colors`}>
        <label className="text-sm text-cyan-600 dark:text-cyan-400 mb-2 block font-medium">
          {label}
        </label>

        {isEditing ? (
          <div className="flex flex-col gap-2 mt-2">
            <div className="flex items-center gap-3">
              {isMultiline ? (
                <textarea
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className={`w-full bg-transparent border-b-2 border-cyan-500 focus:outline-none resize-none py-1 ${theme.text}`}
                  rows={2}
                />
              ) : (
                <input
                  autoFocus
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className={`w-full bg-transparent border-b-2 border-cyan-500 focus:outline-none py-1 ${theme.text}`}
                />
              )}
            </div>
            <div className="flex justify-end gap-3 mt-2">
              <button
                onClick={cancelEditing}
                disabled={isSaving}
                className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              >
                <X size={20} className={theme.textMuted} />
              </button>
              <button
                onClick={() => saveField(field)}
                disabled={isSaving}
                className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              >
                {isSaving ? (
                  <Loader2 size={20} className={`animate-spin ${theme.text}`} />
                ) : (
                  <Check size={20} className="text-cyan-500" />
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between group">
            <span
              className={`text-base ${theme.text} whitespace-pre-wrap flex-1`}
            >
              {value || `Add your ${label.toLowerCase()}`}
            </span>
            <button
              onClick={() => startEditing(field)}
              className="p-2 ml-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-full hover:bg-black/5 dark:hover:bg-white/10"
            >
              <Pencil size={18} className={theme.textMuted} />
            </button>
          </div>
        )}

        {description && !isEditing && (
          <p className={`text-xs ${theme.textMuted} mt-4 leading-relaxed`}>
            {description}
          </p>
        )}
      </div>
    );
  };

  if (loading || !profile) {
    return (
      <div
        className={`h-full w-full flex items-center justify-center ${theme.bg} ${theme.text}`}
      >
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  const currentAvatar = preview || profile.avatar || Image.defaultUser;

  return (
    <div className={`flex h-screen w-full overflow-hidden ${theme.bg}`}>
      <AnimatePresence>
        {showPhotoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
          >
            <div className="absolute top-6 right-6 flex gap-4">
              <button
                onClick={() => setShowPhotoModal(false)}
                className="text-white/70 hover:text-white p-2"
              >
                <X size={28} />
              </button>
            </div>
            <motion.img
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              src={currentAvatar}
              alt="Profile"
              className="max-w-[90vw] max-h-[80vh] object-contain rounded-lg"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -50, opacity: 0 }}
        transition={{ type: "spring", stiffness: 120, damping: 18 }}
        className={`flex flex-col h-full w-full md:w-[400px] lg:w-[450px] ${theme.sidebarBg} border-r ${theme.divider} flex-shrink-0 z-10 relative`}
      >
        <div
          className={`flex items-end px-5 py-5 ${theme.footer} flex-shrink-0 shadow-sm z-20`}
        >
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate(-1)}
              className={`${theme.text} p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-all`}
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className={`text-xl font-medium ${theme.text}`}>Profile</h1>
          </div>
        </div>

        <div className={`flex-1 overflow-y-auto custom-scrollbar ${theme.bg}`}>
          <div className="flex justify-center py-10 relative">
            <div
              className="relative group w-44 h-44 rounded-full shadow-lg cursor-pointer"
              onClick={() => setShowPhotoMenu(true)}
            >
              <img
                src={currentAvatar}
                alt={profile.username}
                className="w-full h-full object-cover rounded-full transition-transform duration-300"
              />

              <div
                className={`absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-full flex flex-col items-center justify-center transition-opacity text-white text-center ${(uploading || uploadSuccess) && "opacity-100"}`}
              >
                {uploading ? (
                  <Loader2 size={28} className="animate-spin text-white" />
                ) : uploadSuccess ? (
                  <Check size={28} className="text-green-400 mb-2" />
                ) : (
                  <>
                    <Camera size={26} className="mb-2" />
                    <span className="text-[10px] uppercase font-bold tracking-wider">
                      Change <br /> Photo
                    </span>
                  </>
                )}
              </div>
            </div>

            <AnimatePresence>
              {showPhotoMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowPhotoMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className={`absolute top-[75%] md:left-[50%] origin-top-left z-50 w-48 rounded-xl shadow-xl overflow-hidden border ${theme.divider} bg-zinc-100 dark:bg-slate-900`}
                  >
                    <button
                      onClick={() => {
                        setShowPhotoModal(true);
                        setShowPhotoMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-black/60 dark:text-white hover:bg-white/10 transition-colors font-bold"
                    >
                      <ImageIcon size={18} className="text-cyan-400" /> View
                      photo
                    </button>
                    <button
                      onClick={() => {
                        fileInputRef.current?.click();
                        setShowPhotoMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-black/60 dark:text-white hover:bg-white/10 transition-colors font-bold"
                    >
                      <Camera size={18} className="text-cyan-400" /> Upload
                      photo
                    </button>
                    {(profile.avatar || preview) && (
                      <button
                        onClick={handleDeletePhoto}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors font-bold"
                      >
                        <Trash2 size={18} /> Remove photo
                      </button>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <div className="flex flex-col gap-2 pb-10">
            <EditableField
              label="Your name"
              field="username"
              description="This is not your username or pin. This name will be visible to your contacts."
            />

            <EditableField label="About" field="bio" isMultiline={false} />

            <EditableField label="Phone" field="phone" />

            <div className={`px-8 py-5 mt-2 ${theme.mainBg} shadow-sm`}>
              <label className="text-sm text-cyan-600 dark:text-cyan-400 mb-4 block font-medium">
                Unique ID
              </label>
              <div className="flex items-center justify-between">
                <span
                  className={`text-base font-mono bg-black/5 dark:bg-white/5 px-3 py-1 rounded-md ${theme.text}`}
                >
                  {profile.userCode || "N/A"}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleShare}
                    className="p-2.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
                    title="Share Profile"
                  >
                    <Share2 size={20} className={theme.textMuted} />
                  </button>
                  <button
                    onClick={copyId}
                    className={`p-2.5 rounded-full transition-all ${
                      copied
                        ? "bg-green-500/10"
                        : "hover:bg-black/5 dark:hover:bg-white/10"
                    }`}
                    title="Copy ID"
                  >
                    {copied ? (
                      <Check
                        size={20}
                        className="text-green-500 animate-in zoom-in duration-200"
                      />
                    ) : (
                      <Copy size={20} className={theme.textMuted} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      <RightSideContent
        name="Profile"
        details="Update your profile details, photo, and manage how others see you on the platform"
        Icon={UserRound}
        size={100}
      />
    </div>
  );
};

export default Profile;
