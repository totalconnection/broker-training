import type {Member} from './access';
import {listItems, saveItem} from './store';

export type GptMessage = {role: 'user' | 'assistant'; content: string};
export type GptConversation = {
  id: string;
  title: string;
  messages: GptMessage[];
  createdAt: string;
  updatedAt: string;
};

const KIND = 'gpt_conversation';
const MAX_SAVED_MESSAGES = 100;

function validMessages(value: unknown): GptMessage[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((message): message is GptMessage =>
      !!message &&
      typeof message === 'object' &&
      ((message as GptMessage).role === 'user' || (message as GptMessage).role === 'assistant') &&
      typeof (message as GptMessage).content === 'string',
    )
    .map(message => ({role: message.role, content: message.content.slice(0, 6000)}))
    .slice(-MAX_SAVED_MESSAGES);
}

export function conversationTitle(firstMessage: string) {
  const clean = firstMessage.replace(/\s+/g, ' ').trim();
  return clean.length > 64 ? `${clean.slice(0, 61)}…` : clean || 'New conversation';
}

export async function listGptConversations(member: Member) {
  return (await listItems(member, KIND)).map(item => ({
    id: item.id,
    title: typeof item.data.title === 'string' ? item.data.title : 'Conversation',
    updatedAt: item.updated_at,
  }));
}

export async function loadGptConversation(member: Member, id: string): Promise<GptConversation | null> {
  const item = (await listItems(member, KIND)).find(candidate => candidate.id === id);
  if (!item) return null;
  return {
    id: item.id,
    title: typeof item.data.title === 'string' ? item.data.title : 'Conversation',
    messages: validMessages(item.data.messages),
    createdAt: typeof item.data.createdAt === 'string' ? item.data.createdAt : item.updated_at,
    updatedAt: item.updated_at,
  };
}

export async function saveGptConversation(
  member: Member,
  conversation: {id?: string; title: string; messages: GptMessage[]; createdAt?: string},
) {
  const id = await saveItem(
    member,
    KIND,
    {
      title: conversation.title,
      messages: validMessages(conversation.messages),
      createdAt: conversation.createdAt || new Date().toISOString(),
    },
    conversation.id,
  );
  return id;
}
