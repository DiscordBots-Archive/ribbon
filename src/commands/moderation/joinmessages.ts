/**
 * @file Moderation JoinMessagesCommand - Toggle whether Ribbon should send special greeting messages when members join
 *
 * **Aliases**: `jmt`, `joinmessagestoggle`
 * @module
 * @category moderation
 * @name joinmessages
 * @example joinmessages enable
 * @param {boolean} Option True or False
 * @param {TextChannel} [Channel] TextChannel the Join Message is sent to, required when enabling
 */

import { deleteCommandMessages, logModMessage, shouldHavePermission } from '@components/Utils';
import { Command, CommandoClient, CommandoMessage } from 'awesome-commando';
import { MessageEmbed, TextChannel } from 'awesome-djs';
import { stripIndents } from 'common-tags';

export default class JoinMessagesCommand extends Command {
    constructor (client: CommandoClient) {
        super(client, {
            name: 'joinmessages',
            aliases: ['jmt', 'joinmessagestoggle'],
            group: 'moderation',
            memberName: 'joinmessages',
            description: 'Toggle whether Ribbon should send special greeting messages when members join',
            format: 'boolean [Channel]',
            examples: ['joinmessages enable'],
            guildOnly: true,
            throttling: {
                usages: 2,
                duration: 3,
            },
            args: [
                {
                    key: 'option',
                    prompt: 'Enable or disable join messages?',
                    type: 'validboolean',
                },
                {
                    key: 'channel',
                    prompt: 'In which channel should I greet people?',
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

        const joinMsgEmbed = new MessageEmbed();
        const description = option
            ? '📈 Ribbon join messages have been enabled'
            : '📈 Ribbon join messages have been disabled';
        const modlogChannel = msg.guild.settings.get('modlogchannel', null);

        msg.guild.settings.set('joinmsgs', option);
        msg.guild.settings.set('joinmsgchannel', channel.id);

        joinMsgEmbed
            .setColor('#AAEFE6')
            .setAuthor(msg.author!.tag, msg.author!.displayAvatarURL())
            .setDescription(stripIndents`
                **Action:** ${description}
                ${option ? `**Channel:** <#${channel.id}>` : ''}`
            )
            .setTimestamp();

        if (msg.guild.settings.get('modlogs', true)) {
            logModMessage(msg, msg.guild, modlogChannel, msg.guild.channels.get(modlogChannel) as TextChannel, joinMsgEmbed);
        }

        deleteCommandMessages(msg, this.client);

        return msg.embed(joinMsgEmbed);
    }
}
