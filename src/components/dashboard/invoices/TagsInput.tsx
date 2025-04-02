import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface TagsInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  max?: number;
  disabled?: boolean;
  className?: string;
  suggestions?: string[];
}

export function TagsInput({
  value,
  onChange,
  placeholder = "Add tags...",
  max = 10,
  disabled = false,
  className,
  suggestions = []
}: TagsInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Handle outside clicks to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filter suggestions based on input
  const filteredSuggestions = suggestions.filter(
    (suggestion) => 
      suggestion.toLowerCase().includes(inputValue.toLowerCase()) && 
      !value.includes(suggestion)
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (e.target.value) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    
    if (
      trimmedTag && 
      !value.includes(trimmedTag) && 
      value.length < max
    ) {
      onChange([...value, trimmedTag]);
    }
    
    setInputValue("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue) {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1]);
    } else if (e.key === "," && inputValue) {
      e.preventDefault();
      addTag(inputValue.replace(",", ""));
    }
  };

  return (
    <div className={cn("relative w-full", className)}>
      <div 
        className={cn(
          "flex flex-wrap items-center gap-1.5 p-1 border rounded-md bg-background",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag) => (
          <Badge key={tag} variant="secondary" className="h-6 text-xs gap-1 px-2">
            {tag}
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(tag);
                }}
                className="text-muted-foreground hover:text-foreground focus:outline-none"
                aria-label={`Remove ${tag} tag`}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}
        
        {value.length < max && (
          <Input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => inputValue && setShowSuggestions(true)}
            className="border-0 flex-1 min-w-[120px] h-6 p-0 px-1 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
            placeholder={value.length === 0 ? placeholder : ""}
            disabled={disabled}
          />
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute z-10 mt-1 w-full bg-popover text-popover-foreground shadow-md rounded-md border py-1 max-h-[200px] overflow-auto"
        >
          {filteredSuggestions.map((suggestion) => (
            <div
              key={suggestion}
              className="px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
              onClick={() => addTag(suggestion)}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 