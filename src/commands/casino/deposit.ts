/**
 * @file Casino DepositCommand - Deposit chips into your vault
 *
 * **Aliases**: `depo`
 * @module
 * @category casino
 * @name deposit
 * @example deposit 100
 * @param {number} ChipsAmount The amount of chips to deposit
 */

import { ASSET_BASE_PATH, DEFAULT_EMBED_COLOR } from '@components/Constants';
import { readCasino, updateCasinoVault } from '@components/Typeorm/DbInteractions';
import { deleteCommandMessages, roundNumber } from '@components/Utils';
import { Command, CommandoClient, CommandoMessage } from 'discord.js-commando';
import { MessageEmbed, TextChannel } from 'discord.js';
import { oneLine, stripIndents } from 'common-tags';
import moment from 'moment';

interface DepositArgs {
  chips: number;
}

export default class DepositCommand extends Command {
  public constructor(client: CommandoClient) {
    super(client, {
      name: 'deposit',
      aliases: [ 'depo' ],
      group: 'casino',
      memberName: 'deposit',
      description: 'Deposit chips into your vault',
      format: 'ChipsAmount',
      examples: [ 'deposit 100' ],
      guildOnly: true,
      throttling: {
        usages: 2,
        duration: 3,
      },
      args: [
        {
          key: 'chips',
          prompt: 'How many chips do you want to deposit?',
          type: 'integer',
          parse: (chips: string) => roundNumber(Number(chips)),
        }
      ],
    });
  }

  public async run(msg: CommandoMessage, { chips }: DepositArgs) {
    const depositEmbed = new MessageEmbed()
      .setAuthor(msg.member!.displayName, msg.author!.displayAvatarURL())
      .setColor(msg.guild ? msg.guild.me!.displayHexColor : DEFAULT_EMBED_COLOR)
      .setThumbnail(`${ASSET_BASE_PATH}/ribbon/bank.png`);

    try {
      const casino = await readCasino(msg.author!.id, msg.guild.id);

      if (casino && casino.balance !== undefined && casino.balance >= 0) {
        if (chips > casino.balance) {
          return msg.reply(oneLine`
            you don\'t have enough chips to make that deposit.
            Use \`${msg.guild.commandPrefix}chips\` to check your current balance.
            or withdraw some chips from your vault with \`${msg.guild.commandPrefix}withdraw\``);
        }

        const prevBal = casino.balance;
        const prevVault = casino.vault;
        const newBalance = casino.balance - chips;
        const newVault = casino.vault! + chips;

        await updateCasinoVault({
          userId: msg.author!.id,
          guildId: msg.guild.id,
          balance: newBalance,
          vault: newVault,
        });

        depositEmbed
          .setTitle('Vault deposit completed successfully')
          .addField('Previous balance', prevBal, true)
          .addField('New balance', newBalance, true)
          .addField('Previous vault content', prevVault, true)
          .addField('New vault content', newVault, true);

        deleteCommandMessages(msg, this.client);

        return msg.embed(depositEmbed);
      }

      return msg.reply(oneLine`
        looks like you either don't have any chips yet or you used them all
        Run \`${msg.guild.commandPrefix}chips\` to get your first 500
        or run \`${msg.guild.commandPrefix}withdraw\` to withdraw some chips from your vault.`
      );
    } catch (err) {
      const channel = this.client.channels.get(process.env.ISSUE_LOG_CHANNEL_ID!) as TextChannel;

      channel.send(stripIndents`
        <@${this.client.owners[0].id}> Error occurred in \`withdraw\` command!
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