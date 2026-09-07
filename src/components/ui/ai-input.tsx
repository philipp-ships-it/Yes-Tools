"use client";

import { CornerRightUp, Mic } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { useAutoResizeTextarea } from "@/components/hooks/use-auto-resize-textarea";
import { PulsingBorder } from "@paper-design/shaders-react";

interface AIInputProps {
  id?: string
  placeholder?: string
  minHeight?: number
  maxHeight?: number
  onSubmit?: (value: string) => void
  className?: string
  value?: string
  onChange?: (value: string) => void
}

export function AIInput({
  id = "ai-input",
  placeholder = "Type your message...",
  minHeight = 52,
  maxHeight = 200,
  onSubmit,
  className,
  value,
  onChange
}: AIInputProps) {
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight,
    maxHeight,
  });
  const [internalValue, setInternalValue] = useState("");
  
  const inputValue = value !== undefined ? value : internalValue;
  const setInputValue = (newVal: string) => {
    if (onChange) {
      onChange(newVal);
    }
    setInternalValue(newVal);
  };

  const handleReset = () => {
    if (!inputValue.trim()) return;
    onSubmit?.(inputValue);
    setInputValue("");
    adjustHeight(true);
  };

  return (
    <div className={cn("w-full py-4 group", className)}>
      <div className="relative max-w-4xl w-full mx-auto">
        <div className="absolute -inset-0.5 rounded-[26px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden pointer-events-none z-0">
          <PulsingBorder />
        </div>
        <div className="relative z-10">
          <Textarea
            id={id}
            placeholder={placeholder}
            className={cn(
              "w-full max-w-4xl bg-white dark:bg-[#1A1A1A] rounded-3xl pl-6 pr-16 shadow-sm",
              "placeholder:text-black/50 dark:placeholder:text-white/50",
              "border border-black/5 dark:border-white/5 ring-black/20 dark:ring-white/20",
              "text-black dark:text-white text-wrap",
              "overflow-y-auto resize-none",
              "focus-visible:ring-0 focus-visible:ring-offset-0",
              "transition-all duration-300 ease-out group-hover:border-transparent",
              "leading-[1.2] py-[16px]",
              `min-h-[${minHeight}px]`,
              `max-h-[${maxHeight}px]`,
              "[&::-webkit-resizer]:hidden" // Скрываем ресайзер
            )}
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              adjustHeight();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleReset();
              } else if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault();
                handleReset();
              }
            }}
          />

          <div
            className={cn(
              "absolute top-1/2 -translate-y-1/2 rounded-xl bg-black/5 dark:bg-white/5 py-1 px-1 transition-all duration-200",
              inputValue ? "right-10" : "right-3"
            )}
          >
            <Mic className="w-4 h-4 text-black/70 dark:text-white/70" />
          </div>
         <button
            onClick={handleReset}
            type="button"
            className={cn(
              "absolute top-1/2 -translate-y-1/2 right-3",
              "rounded-xl bg-black/5 dark:bg-white/5 py-1 px-1",
              "transition-all duration-200",
              inputValue 
                ? "opacity-100 scale-100" 
                : "opacity-0 scale-95 pointer-events-none"
            )}
          >
            <CornerRightUp className="w-4 h-4 text-black/70 dark:text-white/70" />
          </button>
        </div>
      </div>
    </div>
  );
}
