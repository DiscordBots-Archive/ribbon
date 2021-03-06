/**
 * @file Owner TagMemberCommand - Tags a member by ID
 *
 * Primarily meant for mobile and when members have annoying untaggable names
 * @module
 * @category owner
 * @name tagmember
 * @example tagmember ☜(⌒▽⌒)☞guy
 * @param {GuildMemberResolvable} AnyMember Member to make a mention to
 */

import { deleteCommandMessages } from '@components/Utils';
import { Command, CommandoClient, CommandoMessage } from 'discord.js-commando';
import { GuildMember } from 'discord.js';
import { oneLine } from 'common-tags';

interface TagMemberArgs {
  member: GuildMember;
}

export default class TagMemberCommand extends Command {
  public constructor(client: CommandoClient) {
    super(client, {
      name: 'tagmember',
      group: 'owner',
      memberName: 'tagmember',
      description: 'Tag a member',
      format: 'MemberID|MemberName(partial or full)',
      examples: [ 'tagmember Favna' ],
      guildOnly: false,
      ownerOnly: true,
      args: [
        {
          key: 'member',
          prompt: 'What user would you like to snoop on?',
          type: 'member',
        }
      ],
      guarded: true,
      hidden: true,
    });
  }

  public async run(msg: CommandoMessage, { member }: TagMemberArgs) {
    const emote = '<:literallyThis:519988005507956752>';

    deleteCommandMessages(msg, this.client);

    return msg.say(oneLine`
            ${emote}${emote}${emote}${emote}
            <@${member.id}>
            ${emote}${emote}${emote}${emote}
        `);
  }
}