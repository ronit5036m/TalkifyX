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

export default StatusRing;
