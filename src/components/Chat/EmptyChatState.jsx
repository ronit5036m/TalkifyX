import { MessageSquareText } from "lucide-react";

const EmptyChatState = () => {
  return (
    <div
      className={`hidden md:flex flex-1 relative items-center justify-center overflow-hidden `}
    >
      <div className="flex flex-col items-center justify-center text-center opacity-50 select-none">
        <MessageSquareText size={100} className="m-4" />
        <h2 className="text-xl font-medium mb-2">Welcome to TalkifyX</h2>
        <p className="text-sm max-w-xs font-medium">
          Select a conversation from the sidebar to start chatting, or search
          for a new connection.
        </p>
      </div>
    </div>
  );
};

export default EmptyChatState;
