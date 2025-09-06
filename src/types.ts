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
