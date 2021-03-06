/**
 * @file Moderation ListWarnCommand - Show the amount of warning points a member has
 *
 * **Aliases**: `reqwarn`, `lw`, `rw`
 * @module
 * @category moderation
 * @name listwarn
 * @example listwarn Biscuit
 * @param {GuildMemberResolvable} AnyMember The member of whom to list the warning points
 */

import { deleteCommandMessages, shouldHavePermission } from '@components/Utils';
import { Command, CommandoClient, CommandoMessage } from 'discord.js-commando';
import { GuildMember, MessageEmbed, TextChannel } from 'discord.js';
import { oneLine, stripIndents } from 'common-tags';
import moment from 'moment';
import { readWarning } from '@components/Typeorm/DbInteractions';

interface ListWarnArgs {
  member: GuildMember;
}

export default class ListWarnCommand extends Command {
  public constructor(client: CommandoClient) {
    super(client, {
      name: 'listwarn',
      aliases: [ 'reqwarn', 'lw', 'rw' ],
      group: 'moderation',
      memberName: 'listwarn',
      description: 'Lists the warning points given to a member',
      format: 'MemberID|MemberName(partial or full)',
      examples: [ 'listwarn Biscuit' ],
      guildOnly: true,
      throttling: {
        usages: 2,
        duration: 3,
      },
      args: [
        {
          key: 'member',
          prompt: 'Which member should I show warning points for?',
          type: 'member',
        }
      ],
    });
  }

  @shouldHavePermission('MANAGE_MESSAGES')
  public async run(msg: CommandoMessage, { member }: ListWarnArgs) {
    const listwarnEmbed = new MessageEmbed()
      .setColor('#ECECC9')
      .setAuthor(msg.author!.tag, msg.author!.displayAvatarURL())
      .setTimestamp();

    try {
      const warning = await readWarning(member.id, msg.guild.id);
      const userTag = warning && warning.tag ? warning.tag : null;
      const userId = warning && warning.userId ? warning.userId : null;
      const warnPoints = warning && warning.points ? warning.points : 0;

      listwarnEmbed.setDescription(stripIndents`
        **Member:** ${userTag} (${userId})
        **Current warning Points:** ${warnPoints}`
      );
      deleteCommandMessages(msg, this.client);

      return msg.embed(listwarnEmbed);
    } catch (err) {
      const channel = this.client.channels.get(process.env.ISSUE_LOG_CHANNEL_ID!) as TextChannel;

      channel.send(stripIndents`
        <@${this.client.owners[0].id}> Error occurred in \`listwarn\` command!
        **Server:** ${msg.guild.name} (${msg.guild.id})
        **Author:** ${msg.author!.tag} (${msg.author!.id})
        **Time:** ${moment(msg.createdTimestamp).format('MMMM Do YYYY [at] HH:mm:ss [UTC]Z')}
        **Input:** \`${member.user.tag} (${member.id})\`
        **Error Message:** ${err}`
      );

      return msg.reply(oneLine`
        an unknown and unhandled error occurred but I notified ${this.client.owners[0].username}.
        Want to know more about the error?
        Join the support server by getting an invite by using the \`${msg.guild.commandPrefix}invite\` command`
      );
    }
  }
}