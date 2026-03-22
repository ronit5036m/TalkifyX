import { MessageSquareText } from "lucide-react";
import RightSideContent from "../RightSideContent";

const EmptyChatState = () => {
  return (
    <RightSideContent
      Icon={MessageSquareText}
      name={"Welcome to TalkifyX"}
      details={
        "Select a conversation from the sidebar to start chatting, or search for a new connection."
      }
      size={100}
    />
  );
};

export default EmptyChatState;
