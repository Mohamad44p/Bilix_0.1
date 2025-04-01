import { useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface SmartSearchProps {
  onSearch: (query: string) => void;
  onNaturalLanguageSearch: (query: string) => void;
  initialValue?: string;
}

export function SmartSearch({
  onSearch,
  onNaturalLanguageSearch,
  initialValue = "",
}: SmartSearchProps) {
  const [query, setQuery] = useState(initialValue);
  const [isAIMode, setIsAIMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) return;
    
    if (isAIMode) {
      // Use AI-powered natural language search
      setIsProcessing(true);
      
      // Show a processing toast
      toast({
        title: "Processing your query",
        description: "Our AI is analyzing your natural language query...",
      });
      
      // Simulate AI processing time (in a real app, this would be an API call)
      setTimeout(() => {
        onNaturalLanguageSearch(query);
        setIsProcessing(false);
        
        // Show success toast
        toast({
          title: "AI Search Complete",
          description: "Showing results for your query",
        });
      }, 1000);
    } else {
      // Use regular search
      onSearch(query);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <Input
        type="text"
        placeholder={
          isAIMode 
            ? "Ask in natural language (e.g., 'Show me overdue invoices from last month')" 
            : "Search invoices..."
        }
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className={`pl-10 pr-20 ${isAIMode ? 'border-purple-300 focus:border-purple-500 dark:border-purple-900 dark:focus:border-purple-700' : ''}`}
      />
      <div className="absolute inset-y-0 left-3 flex items-center">
        <Search className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="absolute inset-y-0 right-3 flex items-center space-x-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={`h-6 w-6 ${isAIMode ? 'text-purple-500 dark:text-purple-400' : ''}`}
          onClick={() => {
            setIsAIMode(!isAIMode);
            if (query.trim()) {
              if (!isAIMode) {
                toast({
                  title: "AI Search Mode Enabled",
                  description: "Now you can search using natural language",
                });
              }
            }
          }}
        >
          <Sparkles className="h-4 w-4" />
        </Button>
        {query && (
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Processing</span>
              </span>
            ) : (
              <span>Search</span>
            )}
          </Button>
        )}
      </div>
    </form>
  );
} 