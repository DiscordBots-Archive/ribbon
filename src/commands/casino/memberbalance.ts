/**
 * @file Casino MemberBalanceCommand - Retrieves the amount of chips another member has for the casino
 *
 * **Aliases**: `mbal`, `mcash`, `mbalance`, `mchips`
 * @module
 * @category casino
 * @name memberbalance
 * @example mchips Rohul
 * @param {GuildMemberResolvable} AnyMember Member to get the balance for
 */

import { ASSET_BASE_PATH, DEFAULT_EMBED_COLOR } from '@components/Constants';
import { deleteCommandMessages } from '@components/Utils';
import { Command, CommandoClient, CommandoMessage } from 'discord.js-commando';
import { GuildMember, MessageEmbed, TextChannel } from 'discord.js';
import { oneLine, stripIndents } from 'common-tags';
import moment from 'moment';
import { readCasino } from '@components/Typeorm/DbInteractions';

interface MemberBalanceArgs {
  player: GuildMember;
}

export default class MemberBalanceCommand extends Command {
  public constructor(client: CommandoClient) {
    super(client, {
      name: 'memberbalance',
      aliases: [ 'mbal', 'mcash', 'mbalance', 'mchips' ],
      group: 'casino',
      memberName: 'memberbalance',
      description: 'Retrieves the amount of chips another member has for the casino',
      format: 'MemberID|MemberName(partial or full)',
      examples: [ 'memberbalance Sagiri' ],
      guildOnly: true,
      throttling: {
        usages: 2,
        duration: 3,
      },
      args: [
        {
          key: 'player',
          prompt: 'Whose balance do you want to view?',
          type: 'member',
        }
      ],
    });
  }

  public async run(msg: CommandoMessage, { player }: MemberBalanceArgs) {
    const mbalEmbed = new MessageEmbed()
      .setAuthor(player.displayName, player.user.displayAvatarURL())
      .setColor(msg.guild ? msg.guild.me!.displayHexColor : DEFAULT_EMBED_COLOR)
      .setThumbnail(`${ASSET_BASE_PATH}/ribbon/casinologo.png`);

    try {
      const casino = await readCasino(player.id, player.guild.id);

      if (casino && casino.balance !== undefined && casino.balance >= 0) {
        mbalEmbed.setDescription(stripIndents`
          **Balance**
          ${casino.balance}`
        );

        deleteCommandMessages(msg, this.client);

        return msg.embed(mbalEmbed);
      }

      return msg.reply(oneLine`
        looks like ${player.displayName} doesn't have any chips yet,
        they can use the \`${msg.guild.commandPrefix}chips\` command to get their first 500`
      );
    } catch (err) {
      const channel = this.client.channels.get(process.env.ISSUE_LOG_CHANNEL_ID!) as TextChannel;

      channel.send(stripIndents`
        <@${this.client.owners[0].id}> Error occurred in \`memberbalance\` command!
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
}