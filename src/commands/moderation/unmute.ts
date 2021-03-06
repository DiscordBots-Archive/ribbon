/**
 * @file Moderation UnmuteCommand - Unmutes a previously muted member
 * **Aliases**: `um`
 * @module
 * @category moderation
 * @name unmute
 * @example unmute Muffin
 * @param {GuildMemberResolvable} AnyMember The member to remove a role from
 */

import { deleteCommandMessages, logModMessage, shouldHavePermission } from '@components/Utils';
import { Command, CommandoClient, CommandoMessage } from 'discord.js-commando';
import { GuildMember, MessageEmbed, TextChannel } from 'discord.js';
import { oneLine, stripIndents } from 'common-tags';
import moment from 'moment';

interface UnmuteArgs {
  member: GuildMember;
}

export default class UnmuteCommand extends Command {
  public constructor(client: CommandoClient) {
    super(client, {
      name: 'unmute',
      aliases: [ 'um' ],
      group: 'moderation',
      memberName: 'unmute',
      description: 'Unmutes a previously muted member',
      format: 'MemberID|MemberName(partial or full)',
      examples: [ 'unmute Muffin' ],
      guildOnly: true,
      throttling: {
        usages: 2,
        duration: 3,
      },
      args: [
        {
          key: 'member',
          prompt: 'Which member should I unmute?',
          type: 'member',
        }
      ],
    });
  }

  @shouldHavePermission('MANAGE_ROLES', true)
  public async run(msg: CommandoMessage, { member }: UnmuteArgs) {
    if (member.manageable) {
      try {
        const modlogChannel = msg.guild.settings.get('modlogchannel', null);
        const muteRoleEmbed = new MessageEmbed();
        const muteRole = msg.guild.settings.get('muterole',
          msg.guild.roles.find(r => r.name === 'muted')
            ? msg.guild.roles.find(r => r.name === 'muted')
            : null);

        await member.roles.remove(muteRole);

        muteRoleEmbed
          .setColor('#4A9E93')
          .setAuthor(msg.author!.tag, msg.author!.displayAvatarURL())
          .setDescription(`**Action:** Unmuted ${member.displayName} (<@${member.id}>)`)
          .setTimestamp();

        if (msg.guild.settings.get('modlogs', true)) {
          logModMessage(
            msg, msg.guild, modlogChannel, msg.guild.channels.get(modlogChannel) as TextChannel, muteRoleEmbed
          );
        }

        deleteCommandMessages(msg, this.client);

        return msg.embed(muteRoleEmbed);
      } catch (err) {
        deleteCommandMessages(msg, this.client);
        if (/(?:Missing Permissions)/i.test(err.toString())) {
          return msg.reply(stripIndents`
            an error occurred unmuting \`${member.displayName}\`.
            Do I have \`Manage Roles\` permission and am I higher in hierarchy than the target's roles?`);
        }
        const channel = this.client.channels.get(process.env.ISSUE_LOG_CHANNEL_ID!) as TextChannel;

        channel.send(stripIndents`
          <@${this.client.owners[0].id}> Error occurred in \`deleterole\` command!
          **Server:** ${msg.guild.name} (${msg.guild.id})
          **Author:** ${msg.author!.tag} (${msg.author!.id})
          **Time:** ${moment(msg.createdTimestamp).format('MMMM Do YYYY [at] HH:mm:ss [UTC]Z')}
          **Error Message:** ${err}`);

        return msg.reply(oneLine`
          an unknown and unhandled error occurred but I notified ${this.client.owners[0].username}.
          Want to know more about the error?
          Join the support server by getting an invite by using the \`${msg.guild.commandPrefix}invite\` command`);
      }
    }
    deleteCommandMessages(msg, this.client);

    return msg.reply(stripIndents`
      an error occurred unmuting \`${member.displayName}\`.
      Do I have \`Manage Roles\` permission and am I higher in hierarchy than the target's roles?`);
  }
}