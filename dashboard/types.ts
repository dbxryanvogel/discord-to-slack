export interface MessageAnalysis {
  supportStatus: 'help_request' | 'bug_report' | 'feature_request' | 'complaint' | 'feedback' | 'question' | 'documentation_issue' | 'urgent_issue' | 'general_discussion' | 'resolved' | 'other';
  tone: 'happy' | 'neutral' | 'frustrated' | 'angry' | 'confused' | 'grateful' | 'urgent' | 'professional';
  priority: 'low' | 'medium' | 'high' | 'critical';
  sentiment: {
    score: number;
    confidence: number;
  };
  topics: string[];
  needsResponse: boolean;
  summary: string;
  suggestedActions: string[];
  customerMood: {
    description: string;
    emoji: string;
  };
  technicalDetails: {
    hasCode: boolean;
    hasError: boolean;
    hasScreenshot: boolean;
    mentionsVersion: boolean;
  };
}

export interface MessageData {
  // Message info
  content: string;
  id: string;
  timestamp: Date;
  editedTimestamp: Date | null;
  
  // Author info
  author: {
    id: string;
    username: string;
    discriminator: string;
    tag: string;
    avatar: string | null;
    bot: boolean;
  };
  
  // Channel info
  channel: {
    id: string;
    name: string;
    type: number;
    nsfw: boolean;
    isThread: boolean;
    parentId: string | null;
    parentName: string | null;
  };
  
  // Server info
  guild: {
    id: string;
    name: string;
    icon: string | null;
  };
  
  // Member info (roles, nickname, etc)
  member: {
    nickname: string | null;
    roles: Array<{
      id: string;
      name: string;
      color: string;
    }>;
    joinedAt: Date | null;
  };
  
  // Attachments
  attachments: Array<{
    id: string;
    filename: string;
    size: number;
    url: string;
    contentType: string | null;
  }>;
  
  // Message flags
  mentions: {
    users: string[];
    roles: string[];
    everyone: boolean;
  };
  
  // URLs in message
  embeds: Array<{
    title: string | null;
    description: string | null;
    url: string | null;
    type: string;
  }>;
}
