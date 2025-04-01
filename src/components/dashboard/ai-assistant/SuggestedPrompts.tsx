import { Sparkles , HistoryIcon, Languages, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";

interface Conversation {
  id: string;
  title: string;
}

interface SuggestedPromptsProps {
  onSelectPrompt: (prompt: string) => void;
  onNewConversation: () => void;
  onSelectConversation?: (conversationId: string) => void;
  recentTopics?: string[];
  proactiveSuggestion?: string | null;
  languageCode?: string;
  recentConversations?: Conversation[];
}

const COMMON_PROMPTS = [
  {
    text: "Show me invoices from last month",
    icon: <Sparkles className="h-4 w-4 mr-2 flex-shrink-0" />,
  },
  {
    text: "Which vendor charged the most?",
    icon: <Sparkles className="h-4 w-4 mr-2 flex-shrink-0" />,
  },
  {
    text: "Generate a financial report for Q1",
    icon: <Sparkles className="h-4 w-4 mr-2 flex-shrink-0" />,
  },
  {
    text: "Predict expenses for next month",
    icon: <Sparkles className="h-4 w-4 mr-2 flex-shrink-0" />,
  },
  {
    text: "Find duplicated invoices",
    icon: <Sparkles className="h-4 w-4 mr-2 flex-shrink-0" />,
  },
];

export default function SuggestedPrompts({
  onSelectPrompt,
  onNewConversation,
  onSelectConversation,
  recentTopics = [],
  proactiveSuggestion,
  languageCode = "en",
  recentConversations = [],
}: SuggestedPromptsProps) {
  // Generate topic-specific suggestions based on recent topics
  const [topicSuggestions, setTopicSuggestions] = useState<string[]>([]);

  // Generate suggestions based on recent topics
  useEffect(() => {
    if (recentTopics.length === 0) return;

    const suggestions: string[] = [];
    
    if (recentTopics.includes("invoices")) {
      suggestions.push("Find unpaid invoices");
      suggestions.push("Export all invoices to Excel");
    }
    
    if (recentTopics.includes("vendors")) {
      suggestions.push("Show payment history for top vendors");
      suggestions.push("Compare vendor pricing trends");
    }
    
    if (recentTopics.includes("expenses")) {
      suggestions.push("Summarize expense categories this quarter");
      suggestions.push("Which expense category grew the most?");
    }
    
    if (recentTopics.includes("reports")) {
      suggestions.push("Create a cash flow projection");
      suggestions.push("Generate monthly variance report");
    }
    
    setTopicSuggestions(suggestions.slice(0, 3));
  }, [recentTopics]);

  return (
    <Card className="h-[calc(100vh-12rem)]">
      <CardHeader className="border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Suggested Prompts</CardTitle>
          {languageCode !== "en" && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Languages className="h-3 w-3 mr-1" />
              {languageCode.toUpperCase()}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100%-3.5rem)]">
          <div className="p-4 space-y-2">
            {proactiveSuggestion && (
              <>
                <div className="bg-primary/10 rounded-md p-3 mb-4">
                  <h3 className="text-xs font-semibold flex items-center mb-2">
                    <Sparkles className="h-3 w-3 mr-1 text-primary" />
                    Suggested Action
                  </h3>
                  <p className="text-sm">{proactiveSuggestion}</p>
                  <div className="mt-2 flex justify-end">
                    <Button
                      size="sm"
                      onClick={() => onSelectPrompt(proactiveSuggestion)}
                      className="text-xs h-7"
                    >
                      Take Action
                    </Button>
                  </div>
                </div>
                <Separator className="my-3" />
              </>
            )}

            {/* Common prompts */}
            {COMMON_PROMPTS.map((prompt, index) => (
              <Button
                key={index}
                variant="outline"
                className="w-full justify-start text-left h-auto py-2.5"
                onClick={() => onSelectPrompt(prompt.text)}
              >
                {prompt.icon}
                <span>{prompt.text}</span>
              </Button>
            ))}

            {/* Topic-specific suggestions */}
            {topicSuggestions.length > 0 && (
              <>
                <Separator className="my-3" />
                <h3 className="text-xs font-medium mb-2">Based on Your Interests</h3>
                {topicSuggestions.map((suggestion, index) => (
                  <Button
                    key={`topic-${index}`}
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-2.5"
                    onClick={() => onSelectPrompt(suggestion)}
                  >
                    <Sparkles className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>{suggestion}</span>
                  </Button>
                ))}
              </>
            )}

            <Separator className="my-4" />
            <h3 className="font-medium text-sm mb-2 flex items-center">
              <HistoryIcon className="h-3 w-3 mr-1" />
              Recent Conversations
            </h3>
            
            {recentConversations.length > 0 ? (
              recentConversations.map((conversation, index) => (
                <Button
                  key={`history-${index}`}
                  variant="ghost"
                  className="w-full justify-start text-left text-muted-foreground h-auto py-2"
                  onClick={() => onSelectConversation?.(conversation.id)}
                >
                  <span>{conversation.title}</span>
                </Button>
              ))
            ) : (
              <p className="text-xs text-muted-foreground px-2">
                No recent conversations found. Start a new conversation to see it here.
              </p>
            )}
            
            <div className="mt-4 flex flex-col gap-2">
              <Button
                variant="outline"
                className="w-full justify-center text-primary h-auto py-2"
                onClick={onNewConversation}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                <span>New Conversation</span>
              </Button>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
} 