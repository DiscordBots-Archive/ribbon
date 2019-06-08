/**
 * @file Moderation TimerAddCommand - Store timed messages
 *
 * These are messages Ribbon will repeat in a given channel on a given interval
 *
 * Useful for repeating about rules and such
 *
 * You can save multiple messages with varying intervals and channels by using this command multiple times
 *
 * The first time the message will be send is the next periodic check Ribbon will do (which is every 3 minutes) after
 *     adding the timed message
 *
 * The format for the interval is in minutes, hours or days in the format of `5m`, `2h` or `1d`
 *
 * **Aliases**: `timedmsgs`, `timedmsg`, timedmessages`, `timer`, `tm`
 * @module
 * @category moderation
 * @name timeradd
 * @example timeradd 1d #general Please read the rules everyone!
 * @param {string} Interval The interval at which the message(s) should be repeated
 * @param {ChannelResolvable} Channel The channel to send the timed message in
 * @param {string} Message  The message(s) to repeat
 */

import { DURA_FORMAT } from '@components/Constants';
import { deleteCommandMessages, logModMessage, shouldHavePermission } from '@components/Utils';
import { Command, CommandoClient, CommandoMessage } from 'awesome-commando';
import { GuildMember, MessageEmbed, TextChannel } from 'awesome-djs';
import Database from 'better-sqlite3';
import { oneLine, stripIndents } from 'common-tags';
import moment from 'moment';
import 'moment-duration-format';
import path from 'path';

type TimerAddArgs = {
    interval: number
    timerChannel: TextChannel;
    content: string;
    members: GuildMember[];
};

export default class TimerAddCommand extends Command {
    constructor (client: CommandoClient) {
        super(client, {
            name: 'timeradd',
            aliases: ['timedmsgs', 'timedmsg', 'timedmessages', 'timer', 'tm'],
            group: 'moderation',
            memberName: 'timeradd',
            description: 'Store timed messages',
            format: 'Interval Channel Message',
            details: stripIndents`These are messages Ribbon will repeat in a given channel on a given interval
                Useful for repeating about rules and such
                You can save multiple messages with varying intervals and channels by using this command multiple times
                The first time the message will be send is the next periodic check Ribbon will do (which is every 3 minutes) after adding the timed message
                The format for the interval is in minutes, hours or days in the format of \`5m\`, \`2h\` or \`1d\``,
            examples: ['timeradd 1d #general Please read the rules everyone!'],
            guildOnly: true,
            throttling: {
                usages: 2,
                duration: 3,
            },
            args: [
                {
                    key: 'interval',
                    prompt: 'At which interval should the message(s) be repeated?',
                    type: 'duration',
                },
                {
                    key: 'timerChannel',
                    prompt: 'In what channel should the message be repeated?',
                    type: 'channel',
                },
                {
                    key: 'content',
                    prompt: 'What message should I repeat?',
                    type: 'string',
                },
                {
                    key: 'members',
                    prompt: 'Should any members be mentioned for this timer?',
                    type: 'member',
                    default: [],
                    infinite: true,
                }
            ],
        });
    }

    @shouldHavePermission('MANAGE_MESSAGES')
    public run (msg: CommandoMessage, { interval, timerChannel, content, members }: TimerAddArgs) {
        const conn = new Database(path.join(__dirname, '../../data/databases/timers.sqlite3'));
        const modlogChannel = msg.guild.settings.get('modlogchannel', null);
        const timedMsgEmbed = new MessageEmbed();

        try {
            conn.prepare(`INSERT INTO "${msg.guild.id}" (interval, channel, content, lastsend, members) VALUES ($interval, $channel, $content, $lastsend, $members);`)
                .run({
                    content,
                    interval,
                    channel: timerChannel.id,
                    lastsend: moment().subtract(interval, 'ms').format('YYYY-MM-DD HH:mm'),
                    members: members.length ? members.map(member => member.id).join(';') : '',
                });
        } catch (err) {
            if (/(?:no such table)/i.test(err.toString())) {
                conn.prepare(`CREATE TABLE IF NOT EXISTS "${msg.guild.id}" (id INTEGER PRIMARY KEY AUTOINCREMENT, interval INTEGER, channel TEXT, content TEXT, lastsend TEXT, members TEXT);`)
                    .run();

                conn.prepare(`INSERT INTO "${msg.guild.id}" (interval, channel, content, lastsend, members) VALUES ($interval, $channel, $content, $lastsend, $members);`)
                    .run({
                        content,
                        interval,
                        channel: timerChannel.id,
                        lastsend: moment()
                            .subtract(interval, 'ms')
                            .format('YYYY-MM-DD HH:mm'),
                        members: members.length
                            ? members.map(member => member.id).join(';')
                            : '',
                    });
            } else {
                const channel = this.client.channels.get(process.env.ISSUE_LOG_CHANNEL_ID!) as TextChannel;

                channel.send(stripIndents`
                    <@${this.client.owners[0].id}> Error occurred in \`timeradd\` command!
                    **Server:** ${msg.guild.name} (${msg.guild.id})
                    **Author:** ${msg.author!.tag} (${msg.author!.id})
                    **Time:** ${moment(msg.createdTimestamp).format('MMMM Do YYYY [at] HH:mm:ss [UTC]Z')}
                    **Interval:** ${moment.duration(interval).format(DURA_FORMAT.slice(5))}
                    **Channel:** ${channel.name} (${channel.id})>
                    **Message:** ${content}
                    **Error Message:** ${err}
                `);

                return msg.reply(oneLine`An unknown and unhandled error occurred but I notified ${this.client.owners[0].username}.
                    Want to know more about the error? Join the support server by getting an invite by using the \`${msg.guild.commandPrefix}invite\` command `);
            }
        }

        timedMsgEmbed
            .setColor('#9EF7C1')
            .setAuthor(msg.author!.tag, msg.author!.displayAvatarURL())
            .setDescription(stripIndents`
                **Action:** Timed message stored
                **Interval:** ${moment.duration(interval).format(DURA_FORMAT)}
                **Channel:** <#${timerChannel.id}>
                **Message:** ${content}`
            )
            .setTimestamp();

        if (msg.guild.settings.get('modlogs', true)) {
            logModMessage(msg, msg.guild, modlogChannel, msg.guild.channels.get(modlogChannel) as TextChannel, timedMsgEmbed);
        }

        deleteCommandMessages(msg, this.client);

        return msg.embed(timedMsgEmbed);
    }
}
