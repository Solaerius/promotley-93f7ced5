const TypingIndicator = () => {
  return (
    <div className="flex justify-start">
      <div className="bg-muted text-foreground rounded-2xl rounded-bl-sm px-4 py-3 max-w-[75%]">
        <div className="flex gap-1 items-center">
          <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
