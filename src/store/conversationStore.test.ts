import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('../api/client', () => ({
  apiClient: {
    deleteConversation: vi.fn(async (_id: number) => {}),
    getConversation: vi.fn(),
  },
}));

import { apiClient } from '../api/client';
import { useConversationStore } from './conversationStore';

describe('conversationStore.deleteConversation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useConversationStore.setState({
      currentConversation: { id: 7, title: 'doomed', main_agent_id: 1, message_count: 0, created_at: '', updated_at: '' },
      messages: [{ id: 1, role: 'user', content: 'hi' } as any],
      totalMessages: 5,
      hasMoreMessages: true,
      messagesOffset: 5,
      isLoadingMessages: false,
      compactedUpToId: 100,
      compactedContext: 'previous summary',
      systemPromptTokenCount: 0,
    } as any);
  });

  it('hits the API to delete and resets the store', async () => {
    await useConversationStore.getState().deleteConversation(7);

    expect(apiClient.deleteConversation).toHaveBeenCalledWith(7);

    const s = useConversationStore.getState();
    expect(s.currentConversation).toBeNull();
    expect(s.messages).toEqual([]);
    expect(s.totalMessages).toBe(0);
    expect(s.hasMoreMessages).toBe(false);
    expect(s.messagesOffset).toBe(0);
  });

  it('clears the compacted-context state so the post-compact banner does not stick around', async () => {
    await useConversationStore.getState().deleteConversation(7);

    const s = useConversationStore.getState();
    expect(s.compactedUpToId).toBe(0);
    expect(s.compactedContext).toBe('');
  });
});
