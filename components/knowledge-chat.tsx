'use client';

import {useCallback, useEffect, useRef, useState} from 'react';

type ChatMessage = {role: 'user' | 'assistant'; content: string};
type ConversationStub = {id: string; title: string; updatedAt: string};
type Status = {enabled: boolean; remaining: number; dailyRemaining: number; conversations?: ConversationStub[]};

const STARTERS = [
  'I have a freight question.',
  'Help me think through a situation.',
  'Practice a shipper conversation with me.',
  'Help me work through a quote.',
];

function timeAgo(value: string) {
  const minutes = Math.round((Date.now() - new Date(value).getTime()) / 60000);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

export default function KnowledgeChat({admin: _admin}: {admin: boolean}) {
  const [status, setStatus] = useState<Status | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationStub[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    const response = await fetch('/api/gpt');
    const data = await response.json();
    if (!response.ok) throw Error(data.error);
    setStatus(data);
    setConversations(data.conversations || []);
  }, []);

  useEffect(() => {
    refresh().catch(cause => setError(cause.message));
  }, [refresh]);

  useEffect(() => {
    scrollRef.current?.scrollTo({top: scrollRef.current.scrollHeight, behavior: 'smooth'});
  }, [messages, busy]);

  function newConversation() {
    setConversationId(null);
    setMessages([]);
    setShowHistory(false);
    setError('');
    setInput('');
  }

  async function openConversation(id: string) {
    setBusy(true);
    setError('');
    setShowHistory(false);
    try {
      const response = await fetch(`/api/gpt?id=${encodeURIComponent(id)}`);
      const data = await response.json();
      if (!response.ok) throw Error(data.error);
      setConversationId(data.conversation.id);
      setMessages(data.conversation.messages || []);
      setStatus(previous => previous ? {...previous, remaining: data.remaining, dailyRemaining: data.dailyRemaining} : data);
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function send(value: string) {
    const message = value.trim();
    if (!message || busy || !status?.enabled) return;
    const optimistic = [...messages, {role: 'user' as const, content: message}];
    setMessages(optimistic);
    setInput('');
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/gpt', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({conversationId, message}),
      });
      const data = await response.json();
      if (!response.ok) throw Error(data.error);
      setConversationId(data.conversationId);
      setMessages([...optimistic, {role: 'assistant', content: data.reply}]);
      setStatus(previous => previous ? {...previous, remaining: data.remaining, dailyRemaining: data.dailyRemaining} : previous);
      void refresh();
    } catch (cause) {
      setMessages([...optimistic, {role: 'assistant', content: 'I hit a snag answering that. Try sending it again in a moment.'}]);
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return <>
    <div className="tp-heading tp-expert-heading">
      <div>
        <p className="tp-kicker">FREIGHTSKILLS PROGRAM EXPERT</p>
        <h1>Ask Freightskills.</h1>
        <p>Bring a question, a situation, or something you’re working on. Keep the conversation going until it’s clear.</p>
      </div>
    </div>

    <section className="tp-card tp-expert-card">
      <div className="tp-expert-toolbar">
        <button type="button" className="tp-text" onClick={() => setShowHistory(value => !value)}>☰ Conversations{conversations.length ? ` (${conversations.length})` : ''}</button>
        <small>{status ? `${status.remaining} messages this month · ${status.dailyRemaining} today` : ''}</small>
        <button type="button" className="tp-text" onClick={newConversation}>✎ New chat</button>
      </div>

      {showHistory && <div className="tp-expert-history">
        {conversations.length === 0 ? <p>No saved conversations yet.</p> : conversations.map(conversation => <button
          type="button"
          key={conversation.id}
          className={conversation.id === conversationId ? 'selected' : ''}
          onClick={() => openConversation(conversation.id)}
        >
          <span>{conversation.title}</span>
          <small>{timeAgo(conversation.updatedAt)}</small>
        </button>)}
      </div>}

      {status && !status.enabled && <p className="tp-note">Freightskills GPT is being connected. The program remains available while this feature is offline.</p>}

      <div ref={scrollRef} className="tp-expert-thread" aria-live="polite">
        {messages.length === 0 && <div className="tp-expert-welcome">
          <div className="tp-expert-mark">FS</div>
          <h2>Your program expert is here.</h2>
          <p>Ask about the program or freight work you’re dealing with. Follow up naturally—I’ll keep the context.</p>
          <div className="tp-expert-starters">
            {STARTERS.map(starter => <button type="button" key={starter} disabled={!status?.enabled} onClick={() => send(starter)}>{starter}</button>)}
          </div>
        </div>}

        {messages.map((message, index) => <div className={`tp-expert-message ${message.role}`} key={`${message.role}-${index}`}>
          {message.content}
        </div>)}

        {busy && <div className="tp-expert-message assistant tp-expert-thinking" aria-label="Freightskills is thinking"><span /><span /><span /></div>}
      </div>

      {error && <p className="tp-expert-error" role="alert">{error}</p>}

      <form className="tp-expert-composer" onSubmit={event => {event.preventDefault(); send(input);}}>
        <textarea
          rows={2}
          maxLength={4000}
          value={input}
          onChange={event => setInput(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              send(input);
            }
          }}
          placeholder="Ask anything about the program or your freight work…"
          aria-label="Message Freightskills"
        />
        <button className="tp-button" disabled={busy || !status?.enabled || !input.trim()}>Send</button>
      </form>
      <small className="tp-expert-hint">Freightskills can use current web information when your question requires it.</small>
    </section>
  </>;
}
