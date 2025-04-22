export interface User {
  uid?: string;
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status?: "online" | "offline";
  displayName?: string;
  photoURL?: string;
}

export interface ToastMessage {
  type: "success" | "warning" | "error";
  message: string;
  onClose?: () => void | undefined;
}

export interface AuthProps {
  onLogin: (userData: User) => void;
  darkMode: boolean;
  toggleTheme: () => void;
}

export interface LoginProps extends AuthProps {
  switchToSignUp: () => void;
}

export interface SignUpProps extends AuthProps {
  switchToSignIn: () => void;
}

export interface ChatProps {
  user: User;
  onLogout: () => void;
  darkMode: boolean;
  toggleTheme: () => void;
}

export interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  status?: "sent" | "delivered" | "read";
  searchResults: string[];
}

export interface Contact {
  id: string;
  chatId: string;
  name: string;
  email?: string;
  avatar: string;
  status: "online" | "offline";
  lastMessage?: string;
  timestamp?: string;
  unread: number;
  isGroup?: boolean;
  members?: string[];
  lastActive?: Date | { toDate: () => Date };
}

export interface ChatProps {
  user: User;
  onLogout: () => void;
  darkMode: boolean;
  toggleTheme: () => void;
}

export interface ChatHeaderProps {
  contact: Contact | null;
  onlineUsers: Record<string, boolean>;
  toggleMobileMenu: () => void;
  darkMode: boolean;
  isSearching: boolean;
  searchResults: Message[];
  onSearchMessage: (query: string) => void;
  onDeleteConversation: () => void;
}

export interface SidebarProps {
  user: User;
  contacts: Contact[];
  activeChat: string | null;
  setActiveChat: (userId: string) => void;
  onLogout: () => void;
  darkMode: boolean;
  toggleTheme: () => void;
  allUsers: User[];
}

export interface MessageListProps {
  messages: Message[];
  user: User;
  contact: Contact | null;
  darkMode: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export interface ExistingChatProps {
  id?: string;
  participants: string[];
  createdAt: string;
  lastMessage: string;
  unreadCount: string;
}

export interface MessageInputProps {
  onSendMessage: (content: string) => void;
  darkMode: boolean;
}

export interface SignUpProps {
  onLogin: (userData: User) => void;
  darkMode: boolean;
  toggleTheme: () => void;
  switchToSignIn: () => void;
}
