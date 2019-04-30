/**
 * @file Games FightCommand - Pit two things against each other in a fight to the death.
 *
 * **Aliases**: `combat`
 * @module
 * @category games
 * @name fight
 * @example fight Pyrrha Ruby
 * @param {string} FighterOne The first combatant
 * @param {string} FighterTwo The second combatant
 */

import { ASSET_BASE_PATH, DEFAULT_EMBED_COLOR } from '@components/Constants';
import { deleteCommandMessages } from '@components/Utils';
import { Command, CommandoClient, CommandoMessage } from 'awesome-commando';
import { MessageEmbed } from 'awesome-djs';

type FightArgs = {
    fighterOne: string;
    fighterTwo: string;
};

export default class FightCommand extends Command {
    constructor (client: CommandoClient) {
        super(client, {
            name: 'fight',
            aliases: ['combat'],
            group: 'games',
            memberName: 'fight',
            description: 'Pit two things against each other in a fight to the death.',
            format: 'FirstFighter, SecondFighter',
            details: 'Winner is determined with random.org randomization',
            examples: ['fight Favna Chuck Norris'],
            guildOnly: false,
            throttling: {
                usages: 2,
                duration: 3,
            },
            args: [
                {
                    key: 'fighterOne',
                    prompt: 'Who or what is the first fighter?',
                    type: 'string',
                },
                {
                    key: 'fighterTwo',
                    prompt: 'What or what is the second fighter?',
                    type: 'string',
                }
            ],
        });
    }

    public run (msg: CommandoMessage, { fighterOne, fighterTwo }: FightArgs) {
        try {
            const fighterEmbed = new MessageEmbed();

            fighterOne = /<@[0-9]{18}>/.test(fighterOne)
                ? msg.guild.members.get(fighterOne.slice(2, 20))!.displayName
                : fighterOne;
            fighterTwo = /<@[0-9]{18}>/.test(fighterTwo)
                ? msg.guild.members.get(fighterTwo.slice(2, 20))!.displayName
                : fighterTwo;

            fighterEmbed
                .setColor(msg.guild ? msg.guild.me!.displayHexColor : DEFAULT_EMBED_COLOR)
                .setTitle('🥊 Fight Results 🥊')
                .setThumbnail(`${ASSET_BASE_PATH}/ribbon/dbxlogo.png`);

            if (fighterOne.toLowerCase() === 'chuck norris' || fighterTwo.toLowerCase() === 'chuck norris') {
                if (fighterOne.toLowerCase() === 'favna' || fighterTwo.toLowerCase() === 'favna') {
                    fighterEmbed
                        .addField(
                            'All right, you asked for it...',
                            '***The universe was destroyed due to this battle between two unstoppable forces. Good Job.***'
                        )
                        .setImage(`${ASSET_BASE_PATH}/ribbon/universeblast.png`);
                } else {
                    fighterEmbed
                        .addField(
                            'You fokn wot m8',
                            '***Chuck Norris cannot be beaten***'
                        )
                        .setImage(`${ASSET_BASE_PATH}/ribbon/chucknorris.png`);
                }

                deleteCommandMessages(msg, this.client);

                return msg.embed(fighterEmbed);
            }

            if (fighterOne.toLowerCase() === 'favna' || fighterTwo.toLowerCase() === 'favna') {
                fighterEmbed
                    .addField('You got mega rekt', '***Favna always wins***')
                    .setImage(`${ASSET_BASE_PATH}/ribbon/pyrrhawins.gif`);

                deleteCommandMessages(msg, this.client);

                return msg.embed(fighterEmbed);
            }

            const fighterOneChance = Math.floor(Math.random() * 100 + 1);
            const fighterTwoChance = Math.floor(Math.random() * 100 + 1);
            const loser = Math.min(fighterOneChance, fighterTwoChance) === fighterOneChance ? fighterOne : fighterTwo;
            const winner = Math.max(fighterOneChance, fighterTwoChance) === fighterOneChance ? fighterOne : fighterTwo;

            fighterEmbed
                .addField('🇼 Winner', `**${winner}**`, true)
                .addField('🇱 Loser', `**${loser}**`, true)
                .setFooter(`${winner} bodied ${loser} at`)
                .setTimestamp();

            deleteCommandMessages(msg, this.client);

            return msg.embed(fighterEmbed);
        } catch (err) {

            return msg.reply(`something went wrong trying to make \`${fighterOne}\` fight \`${fighterTwo}\``);
        }
    }
}
