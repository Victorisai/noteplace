import { createSelector, createSlice } from '@reduxjs/toolkit';
import {
  deleteConversation,
  getConversationMessages,
  getMessageConversations,
  openConversationWithUser,
  searchFollowingForMessages,
  sendConversationMessage,
  setConversationPinned,
} from '../../services/messageService';

function getConversationOrderTimestamp(conversation) {
  const value = conversation?.last_message?.created_at || conversation?.updated_at;
  const timestamp = value ? new Date(value).getTime() : 0;
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function sortConversations(conversations) {
  return [...conversations].sort((a, b) => {
    const pinDiff = Number(Boolean(b.is_pinned)) - Number(Boolean(a.is_pinned));
    if (pinDiff !== 0) return pinDiff;

    return getConversationOrderTimestamp(b) - getConversationOrderTimestamp(a);
  });
}

function upsertConversationInList(conversations, conversation) {
  const next = conversations.filter((item) => item.id !== conversation.id);
  next.push(conversation);
  return sortConversations(next);
}

const initialState = {
  conversations: [],
  conversationsLoading: true,
  activeConversationId: null,
  messages: [],
  messagesLoading: false,
  composer: '',
  sending: false,
  search: '',
  searchUsers: [],
  searchingUsers: false,
  pinningConversationId: null,
  deletingConversationId: null,
};

const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    setConversations(state, action) {
      state.conversations = sortConversations(action.payload || []);
    },
    setConversationsLoading(state, action) {
      state.conversationsLoading = Boolean(action.payload);
    },
    setActiveConversationId(state, action) {
      state.activeConversationId = action.payload ?? null;
    },
    clearMessages(state) {
      state.messages = [];
    },
    setMessages(state, action) {
      state.messages = action.payload || [];
    },
    setMessagesLoading(state, action) {
      state.messagesLoading = Boolean(action.payload);
    },
    setComposer(state, action) {
      state.composer = action.payload ?? '';
    },
    setSending(state, action) {
      state.sending = Boolean(action.payload);
    },
    setSearch(state, action) {
      state.search = action.payload ?? '';
    },
    setSearchUsers(state, action) {
      state.searchUsers = action.payload || [];
    },
    setSearchingUsers(state, action) {
      state.searchingUsers = Boolean(action.payload);
    },
    setPinningConversationId(state, action) {
      state.pinningConversationId = action.payload ?? null;
    },
    setDeletingConversationId(state, action) {
      state.deletingConversationId = action.payload ?? null;
    },
    upsertConversation(state, action) {
      if (!action.payload?.id) return;
      state.conversations = upsertConversationInList(state.conversations, action.payload);
    },
    selectConversation(state, action) {
      const conversationId = action.payload ?? null;
      state.activeConversationId = conversationId;
      if (!conversationId) return;

      state.conversations = state.conversations.map((item) => (
        item.id === conversationId ? { ...item, unread_count: 0 } : item
      ));
    },
    markConversationRead(state, action) {
      const conversationId = action.payload;
      if (!conversationId) return;

      state.conversations = state.conversations.map((item) => (
        item.id === conversationId ? { ...item, unread_count: 0 } : item
      ));
    },
    updateConversationWithMessage(state, action) {
      const { conversationId, message, unreadIncrement = 0 } = action.payload || {};
      if (!conversationId || !message?.id) return;

      const target = state.conversations.find((item) => item.id === conversationId);
      if (!target) return;

      const updatedConversation = {
        ...target,
        updated_at: message.created_at,
        unread_count: Math.max(0, Number(target.unread_count || 0) + Number(unreadIncrement || 0)),
        last_message: {
          id: message.id,
          sender_id: message.sender_id,
          content: message.content,
          created_at: message.created_at,
        },
      };

      state.conversations = upsertConversationInList(state.conversations, updatedConversation);
    },
    appendMessageIfMissing(state, action) {
      const message = action.payload;
      if (!message?.id) return;
      if (state.messages.some((item) => item.id === message.id)) return;
      state.messages.push(message);
    },
    removeConversationById(state, action) {
      const conversationId = action.payload;
      if (!conversationId) return;
      state.conversations = state.conversations.filter((item) => item.id !== conversationId);
    },
  },
});

export const {
  setConversations,
  setConversationsLoading,
  setActiveConversationId,
  clearMessages,
  setMessages,
  setMessagesLoading,
  setComposer,
  setSending,
  setSearch,
  setSearchUsers,
  setSearchingUsers,
  setPinningConversationId,
  setDeletingConversationId,
  upsertConversation,
  selectConversation,
  markConversationRead,
  updateConversationWithMessage,
  appendMessageIfMissing,
  removeConversationById,
} = messagesSlice.actions;

export function fetchConversations({ isMobile = false } = {}) {
  return async (dispatch, getState) => {
    dispatch(setConversationsLoading(true));

    try {
      const data = await getMessageConversations();
      const list = data.conversations || [];
      dispatch(setConversations(list));

      const { activeConversationId } = getState().messages;
      const hasActiveConversation = activeConversationId
        && list.some((item) => item.id === activeConversationId);

      if (!hasActiveConversation) {
        if (isMobile) {
          dispatch(setActiveConversationId(null));
        } else {
          dispatch(setActiveConversationId(list[0]?.id || null));
        }
      }

      return list;
    } finally {
      dispatch(setConversationsLoading(false));
    }
  };
}

export function fetchConversationMessages(conversationId) {
  return async (dispatch) => {
    if (!conversationId) {
      dispatch(clearMessages());
      return [];
    }

    dispatch(setMessagesLoading(true));

    try {
      const data = await getConversationMessages(conversationId, { limit: 60 });
      const messages = data.messages || [];
      dispatch(setMessages(messages));
      return messages;
    } finally {
      dispatch(setMessagesLoading(false));
    }
  };
}

export function runMessagesUserSearch(query) {
  return async (dispatch) => {
    const trimmed = String(query || '').trim();
    if (!trimmed) {
      dispatch(setSearchUsers([]));
      dispatch(setSearchingUsers(false));
      return [];
    }

    dispatch(setSearchingUsers(true));

    try {
      const data = await searchFollowingForMessages(trimmed);
      const users = data.users || [];
      dispatch(setSearchUsers(users));
      return users;
    } catch {
      dispatch(setSearchUsers([]));
      return [];
    } finally {
      dispatch(setSearchingUsers(false));
    }
  };
}

export function openConversationFromSearchUser(userId) {
  return async (dispatch) => {
    const data = await openConversationWithUser(userId);
    const conversation = data.conversation;

    if (!conversation?.id) return null;

    dispatch(upsertConversation(conversation));
    dispatch(selectConversation(conversation.id));
    dispatch(setSearch(''));
    dispatch(setSearchUsers([]));
    return conversation;
  };
}

export function sendMessageFromComposer() {
  return async (dispatch, getState) => {
    const state = getState().messages;
    if (!state.activeConversationId || state.sending) return null;

    const trimmed = state.composer.trim();
    if (!trimmed) return null;

    dispatch(setSending(true));

    try {
      const data = await sendConversationMessage(state.activeConversationId, trimmed);
      const newMessage = data.message;
      if (!newMessage?.id) return null;

      dispatch(setComposer(''));
      dispatch(appendMessageIfMissing(newMessage));
      dispatch(updateConversationWithMessage({
        conversationId: state.activeConversationId,
        message: newMessage,
        unreadIncrement: 0,
      }));
      dispatch(markConversationRead(state.activeConversationId));
      return newMessage;
    } finally {
      dispatch(setSending(false));
    }
  };
}

export function togglePinnedForActiveConversation() {
  return async (dispatch, getState) => {
    const state = getState().messages;
    const activeConversation = state.conversations.find(
      (item) => item.id === state.activeConversationId
    );

    if (!activeConversation?.id || state.pinningConversationId || state.deletingConversationId) {
      return null;
    }

    const conversationId = activeConversation.id;
    const nextPinnedState = !activeConversation.is_pinned;

    dispatch(setPinningConversationId(conversationId));

    try {
      const data = await setConversationPinned(conversationId, nextPinnedState);
      const updatedConversation = data.conversation || {
        ...activeConversation,
        is_pinned: nextPinnedState,
      };
      dispatch(upsertConversation(updatedConversation));
      return nextPinnedState;
    } finally {
      dispatch(setPinningConversationId(null));
    }
  };
}

export function deleteActiveConversation({ isMobile = false } = {}) {
  return async (dispatch, getState) => {
    const state = getState().messages;
    const conversationId = state.activeConversationId;

    if (!conversationId || state.deletingConversationId || state.pinningConversationId) {
      return false;
    }

    dispatch(setDeletingConversationId(conversationId));

    try {
      await deleteConversation(conversationId);
      dispatch(removeConversationById(conversationId));

      const nextConversations = getState().messages.conversations;
      const nextActiveConversationId = isMobile ? null : (nextConversations[0]?.id || null);

      dispatch(setActiveConversationId(nextActiveConversationId));
      dispatch(clearMessages());
      dispatch(setComposer(''));
      return true;
    } finally {
      dispatch(setDeletingConversationId(null));
    }
  };
}

export function processIncomingMessage({ incoming, currentUserId }) {
  return (dispatch, getState) => {
    if (!incoming?.id) return { shouldRefreshConversations: false };

    const state = getState().messages;
    const targetConversation = state.conversations.find(
      (item) => item.id === incoming.conversation_id
    );

    if (!targetConversation) return { shouldRefreshConversations: true };

    const unreadIncrement = incoming.sender_id !== currentUserId
      && incoming.conversation_id !== state.activeConversationId ? 1 : 0;

    dispatch(updateConversationWithMessage({
      conversationId: incoming.conversation_id,
      message: incoming,
      unreadIncrement,
    }));

    if (incoming.conversation_id === state.activeConversationId) {
      dispatch(appendMessageIfMissing(incoming));

      if (incoming.sender_id !== currentUserId) {
        dispatch(markConversationRead(state.activeConversationId));
      }
    }

    return { shouldRefreshConversations: false };
  };
}

export const selectMessagesState = (state) => state.messages;
export const selectConversations = (state) => state.messages.conversations;
export const selectConversationsLoading = (state) => state.messages.conversationsLoading;
export const selectActiveConversationId = (state) => state.messages.activeConversationId;
export const selectMessages = (state) => state.messages.messages;
export const selectMessagesLoading = (state) => state.messages.messagesLoading;
export const selectComposer = (state) => state.messages.composer;
export const selectSending = (state) => state.messages.sending;
export const selectSearch = (state) => state.messages.search;
export const selectSearchUsers = (state) => state.messages.searchUsers;
export const selectSearchingUsers = (state) => state.messages.searchingUsers;
export const selectPinningConversationId = (state) => state.messages.pinningConversationId;
export const selectDeletingConversationId = (state) => state.messages.deletingConversationId;

export const selectActiveConversation = createSelector(
  [selectConversations, selectActiveConversationId],
  (conversations, activeConversationId) => (
    conversations.find((item) => item.id === activeConversationId) || null
  )
);

export const selectIsPinningActiveConversation = createSelector(
  [selectPinningConversationId, selectActiveConversationId],
  (pinningConversationId, activeConversationId) => (
    Boolean(activeConversationId) && pinningConversationId === activeConversationId
  )
);

export const selectIsDeletingActiveConversation = createSelector(
  [selectDeletingConversationId, selectActiveConversationId],
  (deletingConversationId, activeConversationId) => (
    Boolean(activeConversationId) && deletingConversationId === activeConversationId
  )
);

export default messagesSlice.reducer;
