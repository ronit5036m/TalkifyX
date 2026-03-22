const RightSideContent = ({ Icon, size, name, details }) => {
  return (
    <div
      className={`hidden md:flex flex-1 relative items-center justify-center overflow-hidden `}
    >
      <div className="flex flex-col items-center justify-center text-center opacity-50 select-none">
        <Icon size={size} className="m-4" />
        <h2 className="text-xl font-medium mb-2">{name}</h2>
        <p className="text-sm max-w-xs font-medium">{details}</p>
      </div>
    </div>
  );
};

export default RightSideContent;
