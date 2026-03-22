import { useState } from "react";
import { X, Loader2, Send } from "lucide-react";
import { motion } from "framer-motion";
import useStatusStore from "../../stores/useStatusStore";

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

export default UploadModal;
