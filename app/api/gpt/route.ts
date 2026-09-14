import {NextResponse} from 'next/server';
import {z} from 'zod';
import {teachingInstructions, checkedAnswer} from '@/lib/gpt-prompt';
import {requireMember, checkOrigin} from '@/lib/access';
import {approvedSources, retrieve} from '@/lib/knowledge';
import {reserve, settle, usage} from '@/lib/ai-budget';
import {
  conversationTitle,
  listGptConversations,
  loadGptConversation,
  saveGptConversation,
} from '@/lib/gpt-conversations';

const enabled = () => process.env.AI_ENABLED === 'true' && !!process.env.OPENAI_API_KEY;
const requestBody = z.object({
  message: z.string().trim().min(1).max(4000),
  conversationId: z.string().uuid().nullable().optional(),
}).strict();

export async function GET(request: Request) {
  try {
    const member = await requireMember();
    const id = new URL(request.url).searchParams.get('id');
    const limits = !member.demo ? await usage(member.id) : {remaining: 100, dailyRemaining: 10};
    if (id) {
      const conversation = await loadGptConversation(member, id);
      if (!conversation) return NextResponse.json({error: 'Conversation not found.'}, {status: 404});
      return NextResponse.json(
        {enabled: enabled() && !member.demo, ...limits, conversation},
        {headers: {'Cache-Control': 'no-store'}},
      );
    }
    return NextResponse.json(
      {
        enabled: enabled() && !member.demo,
        ...limits,
        conversations: await listGptConversations(member),
      },
      {headers: {'Cache-Control': 'no-store'}},
    );
  } catch {
    return NextResponse.json({error: 'Sign in to use Freightskills GPT.'}, {status: 401});
  }
}

export async function POST(request: Request) {
  let reservation: string | undefined;
  try {
    await checkOrigin();
    const member = await requireMember();
    if (!enabled() || member.demo) {
      return NextResponse.json(
        {error: 'Freightskills GPT is not enabled yet. Your course is available while we finish setup.'},
        {status: 503},
      );
    }

    const raw = await request.text();
    if (Buffer.byteLength(raw) > 10000) throw Error('Please shorten your message.');
    const {message, conversationId: requestedId} = requestBody.parse(JSON.parse(raw));
    const existing = requestedId ? await loadGptConversation(member, requestedId) : null;
    if (requestedId && !existing) return NextResponse.json({error: 'Conversation not found.'}, {status: 404});

    const priorMessages = existing?.messages || [];
    const modelConversation = [...priorMessages.slice(-16), {role: 'user' as const, content: message}];
    const retrievalQuery = modelConversation
      .filter(turn => turn.role === 'user')
      .slice(-4)
      .map(turn => turn.content)
      .join('\n');
    const found = retrieve(retrievalQuery, await approvedSources(member));
    const instructions = teachingInstructions(member.role);
    const input = JSON.stringify({
      conversation: modelConversation,
      privateProgramKnowledge: found.map(({text}) => text),
      responseTask: 'Reply directly to the final user message as the next turn in this ongoing conversation.',
    });
    if (Buffer.byteLength(input + instructions) > 50000) {
      throw Error('This conversation is too long. Start a new chat and bring over the key details.');
    }

    reservation = await reserve(member.id);
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini-2025-04-14',
        instructions,
        input,
        tools: [{type: 'web_search', search_context_size: 'medium'}],
        tool_choice: 'auto',
        max_tool_calls: 2,
        max_output_tokens: 1800,
        store: false,
      }),
      signal: AbortSignal.timeout(45000),
    });
    if (!response.ok) throw Error('Freightskills GPT could not answer right now. Please try again later.');

    const data = await response.json();
    await settle(reservation, 'complete', data.usage?.input_tokens, data.usage?.output_tokens);
    reservation = undefined;
    const rawAnswer = (data.output || [])
      .flatMap((output: {content?: {type: string; text?: string}[]}) => output.content || [])
      .filter((content: {type: string}) => content.type === 'output_text')
      .map((content: {text?: string}) => content.text || '')
      .join('\n');
    const answer = checkedAnswer(rawAnswer.replace(/cite[^]+/g, '').trim());
    if (!answer) throw Error('No answer was returned. Please try again later.');

    const savedMessages = [...priorMessages, {role: 'user' as const, content: message}, {role: 'assistant' as const, content: answer}];
    const conversationId = await saveGptConversation(member, {
      id: existing?.id,
      title: existing?.title || conversationTitle(message),
      messages: savedMessages,
      createdAt: existing?.createdAt,
    });

    return NextResponse.json(
      {conversationId, reply: answer, ...await usage(member.id)},
      {headers: {'Cache-Control': 'no-store'}},
    );
  } catch (error) {
    if (reservation) await settle(reservation, 'failed').catch(() => {});
    return NextResponse.json(
      {error: error instanceof Error && !(error instanceof z.ZodError) ? error.message : 'Please enter a message of 1–4,000 characters.'},
      {status: 400},
    );
  }
}
