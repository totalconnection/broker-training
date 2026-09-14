import {readFile, writeFile} from 'node:fs/promises';
import {retrieve, getSources} from '../lib/knowledge';
import {teachingInstructions, checkedAnswer} from '../lib/gpt-prompt';

const config = process.env.OPENAI_API_KEY ? process.env : JSON.parse(await readFile('/tmp/fs-app-vars.json', 'utf8'));
if (!config.OPENAI_API_KEY) throw Error('OpenAI key missing');

type Message = {role: 'user' | 'assistant'; content: string};
const cases: {name: string; conversation: Message[]; approved: boolean}[] = [
  {
    name: 'existing broker objection',
    conversation: [{role: 'user', content: 'A shipper told me they already have brokers. What should I say?'}],
    approved: true,
  },
  {
    name: 'carrier rate preparation',
    conversation: [{role: 'user', content: 'How should I prepare before asking a carrier for their rate?'}],
    approved: false,
  },
  {
    name: 'multi-turn quote context',
    conversation: [
      {role: 'user', content: 'Help me quote a dry van load. Carrier cost is $1,600.'},
      {role: 'assistant', content: 'Absolutely. What lane, timing, commodity, and service details are we working with?'},
      {role: 'user', content: 'Newark to Chicago next Tuesday, general merchandise, 34,000 pounds.'},
      {role: 'assistant', content: 'Got it. What margin are you targeting?'},
      {role: 'user', content: 'Use 20%, then write a casual customer message.'},
    ],
    approved: false,
  },
  {
    name: 'unrelated conversational request',
    conversation: [{role: 'user', content: 'Tell me how to bake a chocolate birthday cake.'}],
    approved: true,
  },
  {
    name: 'current federal broker bond requirement',
    conversation: [{role: 'user', content: 'What is the current federal freight broker bond requirement? Verify it online and show me the official source.'}],
    approved: true,
  },
];

const sources = await getSources();
const results = [];
for (const item of cases) {
  const question = item.conversation.at(-1)!.content;
  const retrievalQuery = item.conversation
    .filter(message => message.role === 'user')
    .slice(-4)
    .map(message => message.content)
    .join('\n');
  const found = retrieve(retrievalQuery, item.approved ? sources.filter(source => source.approved) : sources);
  const instructions = teachingInstructions('agent');
  const input = JSON.stringify({
    conversation: item.conversation,
    backgroundTeaching: found.map(({id, title, text}) => ({id, title, text})),
    responseTask: 'Reply to the final user message as the next turn in this ongoing conversation.',
  });
  if (Buffer.byteLength(instructions + input) > 50000) throw Error('Prompt too long');
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {Authorization: `Bearer ${config.OPENAI_API_KEY}`, 'Content-Type': 'application/json'},
    body: JSON.stringify({
      model: 'gpt-4.1-mini-2025-04-14',
      instructions,
      input,
      tools: [{type: 'web_search', search_context_size: 'medium'}],
      tool_choice: 'auto',
      max_tool_calls: 2,
      include: ['web_search_call.action.sources'],
      max_output_tokens: 1500,
      store: false,
    }),
    signal: AbortSignal.timeout(45000),
  });
  if (!response.ok) throw Error(`Provider returned ${response.status}`);
  const data = await response.json();
  const answer = checkedAnswer(
    (data.output || [])
      .flatMap((output: {content?: {type: string; text?: string}[]}) => output.content || [])
      .filter((content: {type: string}) => content.type === 'output_text')
      .map((content: {text: string}) => content.text)
      .join('\n'),
  );
  results.push({...item, question, retrieved: found.map(source => source.id), answer, usage: data.usage});
}

await writeFile('/tmp/fs-gpt-evaluation.json', JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
