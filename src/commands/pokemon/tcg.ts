/**
 * @file Pokémon PokemonTCGCommand - Gets information on a Pokemon card
 *
 * At start of the command you can specify which properties you want to use for the search, the options are `name`, `types`, `subtype`, `supertype` and `hp`.
 * After specifying which options you want to use, Ribbon will go through the options asking you the values to use for the search.
 * By default only `name` is used as argument and the supertype is set to pokemon
 *
 * - name is the name of the pokemon card
 * - types are the types of the pokemon card (only works with pokemon as supertype)
 * - subtype specifies the subtype of a card (ex: MEGA, Stage 1, BREAK, Supporter)
 * - supertype specifies the supertype of a card (pokemon, trainer or energy)
 * - hp specifies the hp of a pokemon
 *
 * **Aliases**: `ptcg`, `tcgo`
 * @module
 * @category pokémon
 * @name TCG
 * @example tcg name types subtype
 * @param {string} [Properties] Properties you want to use for your search
 */

import { ASSET_BASE_PATH, DEFAULT_EMBED_COLOR } from '@components/Constants';
import { stringify } from '@favware/querystring';
import { ArgumentCollector, Command, CommandoClient, CommandoMessage } from 'discord.js-commando';
import { MessageEmbed, TextChannel, Message } from 'discord.js';
import { oneLine, stripIndents } from 'common-tags';
import moment from 'moment';
import fetch from 'node-fetch';
import { TCGPropsType, TCGCardData } from 'RibbonTypes';

interface NameArgumentCollection { name: string }
interface TypeArgumentCollection { types: string }
interface SubTypeArgumentCollection { subtype: string }
interface SuperTypeArgumentCollection { supertype: string }
interface HpSelectionArgumentCollection { hp: number }
interface CardChooserArgumentCollection { card: number }
interface PokemonTCGArgs { props: string[] }

export default class PokemonTCGCommand extends Command {
  public constructor(client: CommandoClient) {
    super(client, {
      name: 'tcg',
      aliases: [ 'ptcg', 'tcgo' ],
      group: 'pokemon',
      memberName: 'tcg',
      description: 'Gets information on a Pokemon card',
      format: 'Properties',
      details: stripIndents`
                ${oneLine`
                  At start of the command you can specify which properties you want to use for the search,
                  the options are \`name\`, \`types\`, \`subtype\`, \`supertype\` and \`hp\``
}
                After specifying which options you want to use, Ribbon will go through the options asking you the values to use for the search
                By default only \`name\` is used as argument and the supertype is set to pokemon
                name is the name of the pokemon card
                types are the types of the pokemon card (only works with pokemon as supertype)
                subtype specifies the subtype of a card (ex: MEGA, Stage 1, BREAK, Supporter)
                supertype specifies the supertype of a card (pokemon, trainer or energy)
                hp specifies the hp of a pokemon`,
      examples: [ 'tcg name types subtype' ],
      guildOnly: false,
      throttling: {
        usages: 2,
        duration: 3,
      },
      args: [
        {
          key: 'props',
          prompt: stripIndents`
                    Which properties to search by? Can be any combination of \`name\`, \`types\`, \`subtype\`, \`supertype\` and \`hp\`
                    Split each property with a \`space\`
                    Use the help command (\`help tcg\`) to view examples`,
          type: 'tcgprops',
          default: [ 'name' ],
        }
      ],
    });
  }

  public async run(msg: CommandoMessage, { props }: PokemonTCGArgs) {
    const command = msg;
    const properties: TCGPropsType = {
      name: '',
      types: '',
      subtype: '',
      supertype: 'pokemon',
      hp: '',
    };
    const tcgEmbed = new MessageEmbed();

    let messagesDeletable = false;

    if (props.includes('name')) {
      const namePicker = new ArgumentCollector(command.client,
        [
          {
            key: 'name',
            prompt: stripIndents`
              Name of the card to find?
              **Note:** Do not specify "EX" and such here, that goes in the \`subtype\``,
            type: 'string',
            parse: (p: string) => p.toLowerCase(),
          }
        ],
        1);

      const nameSelection = await namePicker.obtain<NameArgumentCollection>(command, [], 1);

      properties.name = nameSelection.values.name;
      nameSelection.prompts[0].delete();
      if (nameSelection.answers[0].deletable) {
        messagesDeletable = true;
        nameSelection.answers[0].delete();
        msg.delete();
      }
    }

    if (props.includes('types')) {
      const typePicker = new ArgumentCollector(command.client,
        [
          {
            key: 'types',
            prompt: 'Which types can the Pokemon be (ex. Fire, Fighting, Psychic, etc.)?',
            type: 'string',
            parse: (p: string) => p.replace(/ /gm, ',').toLowerCase(),
          }
        ],
        1);
      const typeSelection = await typePicker.obtain<TypeArgumentCollection>(command, [], 1);

      properties.types = typeSelection.values.types;
      typeSelection.prompts[0].delete();
      if (messagesDeletable) typeSelection.answers[0].delete();
    }

    if (props.includes('subtype')) {
      const subTypePicker = new ArgumentCollector(command.client,
        [
          {
            key: 'subtype',
            prompt: 'What can the card\'s subtype be (ex. MEGA, Stage 1, BREAK, Supporter etc.)?',
            type: 'string',
            parse: (p: string) => p.toLowerCase(),
          }
        ],
        1);
      const subTypeSelection = await subTypePicker.obtain<SubTypeArgumentCollection>(command, [], 1);

      properties.subtype = subTypeSelection.values.subtype;
      subTypeSelection.prompts[0].delete();
      if (messagesDeletable) subTypeSelection.answers[0].delete();
    }

    if (props.includes('supertype')) {
      const superTypePicker = new ArgumentCollector(command.client,
        [
          {
            key: 'supertype',
            prompt: 'What can the card\'s super be (one of pokemon, trainer or energy)?',
            type: 'string',
            validate: (type: string) => {
              const validTypes = [ 'pokemon', 'trainer', 'energy' ];

              if (validTypes.includes(type.toLowerCase())) {
                return true;
              }

              return stripIndents`
                      Has to be one of ${validTypes.map(val => `\`${val}\``).join(', ')}
                      Respond with your new selection or
                    `;
            },
            parse: (p: string) => p.toLowerCase(),
          }
        ],
        1);
      const superTypeSelection = await superTypePicker.obtain<SuperTypeArgumentCollection>(command, [], 1);

      properties.supertype = superTypeSelection.values.supertype;
      superTypeSelection.prompts[0].delete();
      if (messagesDeletable) superTypeSelection.answers[0].delete();
    }

    if (props.includes('hp')) {
      const hpPicker = new ArgumentCollector(command.client,
        [
          {
            key: 'hp',
            prompt: 'How much HP does the pokemon have?',
            type: 'integer',
          }
        ],
        1);
      const hpSelection = await hpPicker.obtain<HpSelectionArgumentCollection>(command, [], 1);

      properties.hp = hpSelection.values.hp.toString();
      hpSelection.prompts[0].delete();
      if (messagesDeletable) hpSelection.answers[0].delete();
    }

    try {
      const res = await fetch(`https://api.pokemontcg.io/v1/cards?${stringify({
        hp: properties.hp ? properties.hp : '',
        name: properties.name,
        page: 1,
        pageSize: 10,
        subtype: properties.subtype ? properties.subtype : '',
        supertype: properties.supertype,
        types: properties.types ? properties.types : '',
      })}`);
      const poke = await res.json() as TCGCardData;

      if (poke.cards.length) {
        const cards = poke.cards;
        let body = '';
        let index = 0;

        for (const card of cards) {
          body += `**${index + 1}:** ${card.name}\n`;
          index++;
        }

        const selectionEmbed = await command.embed({
          color: command.guild ? command.member!.displayColor : 14827841,
          description: body,
          thumbnail: { url: `${ASSET_BASE_PATH}/ribbon/tcglogo.png` },
        }) as Message;

        const cardChooser = new ArgumentCollector(command.client,
          [
            {
              key: 'card',
              prompt: 'Send number to see details or cancel to cancel',
              type: 'integer',
              validate: (v: string) => Number(v) >= 1 && Number(v) <= 10
                ? true
                : 'Please choose a number between 1 and 10',
              parse: (p: string) => Number(p) - 1,
            }
          ],
          1);

        const cardSelection = await cardChooser.obtain<CardChooserArgumentCollection>(command, [], 1);
        const selection = cardSelection.values.card;

        cardSelection.prompts[0].delete();
        selectionEmbed.delete();
        if (messagesDeletable) cardSelection.answers[0].delete();

        tcgEmbed
          .setColor(msg.guild ? msg.member!.displayHexColor : DEFAULT_EMBED_COLOR)
          .setThumbnail(`${ASSET_BASE_PATH}/ribbon/tcglogo.png`)
          .setTitle(`${cards[selection].name} (${cards[selection].id})`)
          .setImage(cards[selection].imageUrl)
          .addField('Series', cards[selection].series, true)
          .addField('Set', cards[selection].set, true);

        if (properties.supertype === 'pokemon') {
          const { attacks } = cards[selection];
          const { resistances } = cards[selection];
          const { weaknesses } = cards[selection];

          if (attacks) {
            attacks.forEach((attack, attackIndex) => {
              tcgEmbed.addField(`
                Attack ${Number(attackIndex) + 1}`, stripIndents`
                **Name:** ${attack.name}
                **Description:** ${attack.text}
                **Damage:** ${attack.damage}
                **Cost:** ${attack.cost.join(', ')}
              `,
              true);
            });
          }

          if (resistances) {
            resistances.forEach((resistance, resistIndex) => {
              tcgEmbed.addField(`
                Resistance ${Number(resistIndex) + 1}`, stripIndents`
                **Type:** ${resistance.type}
                **Multiplier:** ${resistance.value}
              `,
              true);
            });
          }

          if (weaknesses) {
            weaknesses.forEach((weakness, weaknessIndex) => {
              tcgEmbed.addField(`
                Weakness ${Number(weaknessIndex) + 1}`, stripIndents`
                **Type:** ${weakness.type}
                **Multiplier:** ${weakness.value}
              `,
              true);
            });
          }

          tcgEmbed.fields.shift();
          tcgEmbed.fields.shift();

          tcgEmbed
            .addField('Type(s)', cards[selection].types!.join(', '), true)
            .addField('Subtype', cards[selection].subtype, true)
            .addField('HP', cards[selection].hp, true)
            .addField('Retreat Cost', cards[selection].convertedRetreatCost, true)
            .addField('Series', cards[selection].series, true)
            .addField('Set', cards[selection].set, true);
        } else if (properties.supertype === 'trainer') {
          tcgEmbed.setDescription(cards[selection].text[0]);
        }

        return command.embed(tcgEmbed);
      }

      return command.reply(stripIndents`
        no cards were found for that query.
        ${oneLine`
          Be sure to check the command help (\`${msg.guild ? msg.guild.commandPrefix : this.client.commandPrefix}help tcg\`)
          if you want to know how to use this command`}`
      );
    } catch (err) {
      const channel = this.client.channels.get(process.env.ISSUE_LOG_CHANNEL_ID!) as TextChannel;

      channel.send(stripIndents`
        <@${this.client.owners[0].id}> Error occurred in \`tcg\` command!
        **Server:** ${msg.guild.name} (${msg.guild.id})
        **Author:** ${msg.author!.tag} (${msg.author!.id})
        **Time:** ${moment(msg.createdTimestamp).format('MMMM Do YYYY [at] HH:mm:ss [UTC]Z')}
        **Props:** ${props.map(val => `\`${val}\``).join(', ')}
        **Name:** \`${properties.name}\`
        **Types:** \`${properties.types}\`
        **Subtype:** \`${properties.subtype}\`
        **Supertype:** \`${properties.supertype}\`
        **HP:** \`${properties.hp}\`
        **Error Message:** ${err}`);

      return msg.reply(oneLine`
        an unknown and unhandled error occurred but I notified ${this.client.owners[0].username}.
        Want to know more about the error?
        Join the support server by getting an invite by using the \`${msg.guild.commandPrefix}invite\` command`);
    }
  }
}