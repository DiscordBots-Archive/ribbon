/**
 * @file Automod ExcessiveEmojisCommand - Toggle the excessive emojis filter
 *
 * **Aliases**: `ef`, `emojifilter`, `spammedemojis`, `manyemojis`
 * @module
 * @category automod
 * @name excessiveemojis
 * @example excessiveemojis enable
 * @param {boolean} Option True or False
 * @param {string} [threshold] How much percent of a message should be emojis to delete
 * @param {number} [minlength] Minimum length of message before it is checked
 */

import { deleteCommandMessages, logModMessage, shouldHavePermission } from '@components/Utils';
import { Command, CommandoClient, CommandoMessage } from 'awesome-commando';
import { MessageEmbed, TextChannel } from 'awesome-djs';
import { stripIndents } from 'common-tags';

export default class ExcessiveEmojisCommand extends Command {
    constructor (client: CommandoClient) {
        super(client, {
            name: 'excessiveemojis',
            aliases: ['ef', 'emojifilter', 'spammedemojis', 'manyemojis'],
            group: 'automod',
            memberName: 'excessiveemojis',
            description: 'Toggle the excessive emojis filter',
            format: 'boolean',
            examples: ['excessiveemojis enable'],
            guildOnly: true,
            throttling: {
                usages: 2,
                duration: 3,
            },
            args: [
                {
                    key: 'option',
                    prompt: 'Enable or disable the Excessive Emojis filter?',
                    type: 'validboolean',
                },
                {
                    key: 'threshold',
                    prompt: 'How many emojis are allowed in 1 message?',
                    type: 'integer',
                    default: 5,
                },
                {
                    key: 'minlength',
                    prompt: 'What should the minimum length of a message be before it is checked?',
                    type: 'integer',
                    default: 10,
                }
            ],
        });
    }

    @shouldHavePermission('MANAGE_MESSAGES', true)
    public run (msg: CommandoMessage, { option, threshold, minlength }: { option: boolean; threshold: number; minlength: number }) {
        const eeEmbed = new MessageEmbed();
        const modlogChannel = msg.guild.settings.get('modlogchannel', null);
        const options = { minlength, threshold, enabled: option };

        msg.guild.settings.set('emojis', options);

        eeEmbed
            .setColor('#439DFF')
            .setAuthor(msg.author!.tag, msg.author!.displayAvatarURL())
            .setDescription(stripIndents`
                **Action:** Excessive Emojis filter has been ${option ? 'enabled' : 'disabled'}
                ${option ? `**Threshold:** Messages that have at least ${threshold} emojis will be deleted` : ''}
                ${option ? `**Minimum length:** Messages of at least ${minlength} are checked for excessive emojis` : ''}
                ${!msg.guild.settings.get('automod', false) ? `**Notice:** Be sure to enable the general automod toggle with the \`${msg.guild.commandPrefix}automod\` command!` : ''}`
            )
            .setTimestamp();

        if (msg.guild.settings.get('modlogs', true)) {
            logModMessage(msg, msg.guild, modlogChannel, msg.guild.channels.get(modlogChannel) as TextChannel, eeEmbed);
        }

        deleteCommandMessages(msg, this.client);

        return msg.embed(eeEmbed);
    }
}
