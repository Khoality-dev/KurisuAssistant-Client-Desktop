/**
 * Client-side slash command system.
 *
 * Commands are parsed and executed entirely on the frontend.
 * Add new commands to the `commands` array below.
 */

export interface CommandContext {
  activeConversationId: number | null;
  agentId: number | null;
}

interface Command {
  name: string;
  description: string;
  execute: (args: string, ctx: CommandContext) => Promise<string> | string;
}

const commands: Command[] = [
  {
    name: 'clear',
    description: 'Clear the current conversation',
    execute: async (_args, ctx) => {
      if (ctx.activeConversationId) {
        const { useConversationStore } = await import('../store/conversationStore');
        const { storage } = await import('./storage');
        const convStore = useConversationStore.getState();
        await convStore.deleteConversation(ctx.activeConversationId);
        if (ctx.agentId) {
          storage.clearAgentConversationId(ctx.agentId);
        } else {
          storage.clearAgentConversationId('group');
        }
        return 'Conversation cleared';
      }
      return 'No active conversation';
    },
  },
  {
    name: 'resume',
    description: 'Pick a previous conversation to resume',
    execute: (_args, ctx) => {
      if (!ctx.agentId) {
        return 'No agent selected';
      }
      window.dispatchEvent(new Event('kurisu:open-resume-picker'));
      return '';
    },
  },
  {
    name: 'context',
    description: 'Show the context breakdown for the current conversation',
    execute: (_args, ctx) => {
      if (!ctx.activeConversationId) {
        return 'No active conversation';
      }
      window.dispatchEvent(new Event('kurisu:open-context-breakdown'));
      return '';
    },
  },
];

/**
 * Try to handle text as a slash command.
 * Returns feedback message if handled, null if not a command.
 */
export async function handleCommand(text: string, ctx: CommandContext): Promise<string | null> {
  if (!text.startsWith('/')) return null;

  const spaceIdx = text.indexOf(' ');
  const name = (spaceIdx === -1 ? text.slice(1) : text.slice(1, spaceIdx)).toLowerCase();
  const args = spaceIdx === -1 ? '' : text.slice(spaceIdx + 1).trim();

  const cmd = commands.find((c) => c.name === name);
  if (!cmd) return null;

  return await cmd.execute(args, ctx);
}

/** Get all registered commands (for autocomplete/help). */
export function getCommands(): { name: string; description: string }[] {
  return commands.map((c) => ({ name: c.name, description: c.description }));
}
