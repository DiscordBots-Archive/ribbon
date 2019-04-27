/**
 * @file Moderation LeaveMessagesCommand - Toggle whether Ribbon should send special leave messages when members leave
 *
 * **Aliases**: `lmt`, `leavemessagestoggle`
 * @module
 * @category moderation
 * @name leavemessages
 * @example leavemessages enable
 * @param {boolean} Option True or False
 * @param {TextChannel} [Channel] TextChannel the Leave Message is sent to, required when enabling
 */

import { deleteCommandMessages, logModMessage, shouldHavePermission } from '@components/Utils';
import { Command, CommandoClient, CommandoMessage } from 'awesome-commando';
import { MessageEmbed, TextChannel } from 'awesome-djs';
import { stripIndents } from 'common-tags';

export default class LeaveMessagesCommand extends Command {
    constructor (client: CommandoClient) {
        super(client, {
            name: 'leavemessages',
            aliases: ['lmt', 'leavemessagestoggle'],
            group: 'moderation',
            memberName: 'leavemessages',
            description: 'Toggle whether Ribbon should send special leave messages when members leave',
            format: 'boolean  [Channel]',
            examples: ['leavemessages enable'],
            guildOnly: true,
            throttling: {
                usages: 2,
                duration: 3,
            },
            args: [
                {
                    key: 'option',
                    prompt: 'Enable or disable leave messages?',
                    type: 'validboolean',
                },
                {
                    key: 'channel',
                    prompt: 'In which channel should I wave people goodbye?',
                    type: 'channel',
                    default: 'off',
                }
            ],
        });
    }

    @shouldHavePermission('MANAGE_MESSAGES')
    public run (msg: CommandoMessage, { channel, option }: { channel: TextChannel | any; option: boolean }) {
        if (option && channel === 'off') {
            return msg.reply('when activating join messages you need to provide a channel for me to output the messages to!');
        }

        const leaveMsgEmbed = new MessageEmbed();
        const description = option
            ? '📉 Ribbon leave messages have been enabled'
            : '📉 Ribbon leave messages have been disabled';
        const modlogChannel = msg.guild.settings.get('modlogchannel', null);

        msg.guild.settings.set('leavemsgs', option);
        msg.guild.settings.set('leavemsgchannel', channel.id);

        leaveMsgEmbed
            .setColor('#AAEFE6')
            .setAuthor(msg.author!.tag, msg.author!.displayAvatarURL())
            .setDescription(stripIndents`
                **Action:** ${description}
                ${option ? `**Channel:** <#${channel.id}>` : ''}`
            )
            .setTimestamp();

        if (msg.guild.settings.get('modlogs', true)) {
            logModMessage(msg, msg.guild, modlogChannel, msg.guild.channels.get(modlogChannel) as TextChannel, leaveMsgEmbed);
        }

        deleteCommandMessages(msg, this.client);

        return msg.embed(leaveMsgEmbed);
    }
}
