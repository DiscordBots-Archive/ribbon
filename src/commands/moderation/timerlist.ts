/**
 * @file Moderation TimerListCommand - List all stored timed messages in the current guild
 *
 * **Aliases**: `tl`, `timelist`
 * @module
 * @category moderation
 * @name timerlist
 */

import { DURA_FORMAT } from '@components/Constants';
import { deleteCommandMessages, shouldHavePermission } from '@components/Utils';
import { Command, CommandoClient, CommandoMessage } from 'discord.js-commando';
import { TextChannel, Util } from 'discord.js';
import { oneLine, stripIndents } from 'common-tags';
import moment from 'moment';
import { readAllTimersForGuild } from '@components/Typeorm/DbInteractions';

export default class TimerListCommand extends Command {
  public constructor(client: CommandoClient) {
    super(client, {
      name: 'timerlist',
      aliases: [ 'tl', 'timelist' ],
      group: 'moderation',
      memberName: 'timerlist',
      description: 'List all stored timed messages in the current guild',
      guildOnly: true,
      throttling: {
        usages: 2,
        duration: 3,
      },
    });
  }

  @shouldHavePermission('MANAGE_MESSAGES')
  public async run(msg: CommandoMessage) {
    try {
      const timers = await readAllTimersForGuild(msg.guild.id);

      if (!timers.length) throw new Error('no_timers');

      const body = timers.map(row => (
        `${stripIndents`
          **name:** ${row.name}
          **interval:** ${moment.duration(row.interval).format(DURA_FORMAT.slice(5))}
          **channel:** <#${row.channelId}>
          **content:** ${row.content}
          **last sent at:** ${moment(row.lastsend).format('YYYY-MM-DD HH:mm [UTC]Z')}
          ${row.members ? `**members tagged on send:** ${row.members.map(member => `<@${member}>`).join(' ')}` : ''}`}
          \n`
      )).join('\n');

      deleteCommandMessages(msg, this.client);

      if (body.length >= 1800) {
        const splitContent = Util.splitMessage(body, { maxLength: 1800 });

        splitContent.forEach(part => {
          msg.embed({
            color: msg.guild.me!.displayColor,
            description: part,
            title: 'Timed messages stored on this server',
          });
        });

        return null;
      }

      return msg.embed({
        color: msg.guild.me!.displayColor,
        description: body,
        title: 'Timed messages stored on this server',
      });
    } catch (err) {
      if (/(?:no_timers)/i.test(err.toString())) {
        return msg.reply(`no timers saved for this server. Start saving your first with \`${msg.guild.commandPrefix}timeradd\``);
      }
      const channel = this.client.channels.get(process.env.ISSUE_LOG_CHANNEL_ID!) as TextChannel;

      channel.send(stripIndents`
        <@${this.client.owners[0].id}> Error occurred in \`timerlist\` command!
        **Server:** ${msg.guild.name} (${msg.guild.id})
        **Author:** ${msg.author!.tag} (${msg.author!.id})
        **Time:** ${moment(msg.createdTimestamp).format('MMMM Do YYYY [at] HH:mm:ss [UTC]Z')}
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