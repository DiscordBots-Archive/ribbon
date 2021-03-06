/**
 * @file Searches SteamCommand - Gets information about a game using Steam
 *
 * **Aliases**: `valve`
 * @module
 * @category searches
 * @name steam
 * @example steam Tales of Berseria
 * @param {string} GameName The name of any game that you want to find
 */

import { DEFAULT_EMBED_COLOR } from '@components/Constants';
import { currencyMap } from '@components/MoneyHelper';
import { deleteCommandMessages } from '@components/Utils';
import { stringify } from '@favware/querystring';
import { unescape } from '@favware/unescape';
import { Command, CommandoClient, CommandoMessage } from 'discord.js-commando';
import { MessageEmbed } from 'discord.js';
import cheerio from 'cheerio';
import fetch from 'node-fetch';
import { SteamGenreType } from 'RibbonTypes';

interface SteamArgs {
  game: string;
}

export default class SteamCommand extends Command {
  public constructor(client: CommandoClient) {
    super(client, {
      name: 'steam',
      aliases: [ 'valve' ],
      group: 'searches',
      memberName: 'steam',
      description: 'Finds a game on Steam',
      format: 'GameName',
      examples: [ 'steam Tales of Berseria' ],
      guildOnly: false,
      throttling: {
        usages: 2,
        duration: 3,
      },
      args: [
        {
          key: 'game',
          prompt: 'Which game do you want to find on the steam store?',
          type: 'string',
        }
      ],
    });
  }

  public async run(msg: CommandoMessage, { game }: SteamArgs) {
    try {
      const steamEmbed = new MessageEmbed();
      const steamSearch = await fetch(`http://store.steampowered.com/search/?${stringify({
        category1: 998,
        term: game,
      })}`);
      const $ = cheerio.load(await steamSearch.text());
      const gameID = $('#search_result_container > div:nth-child(2) > a:nth-child(2)')
        .attr('href')
        .split('/')[4];
      const steamFetch = await fetch(`https://store.steampowered.com/api/appdetails?${stringify({
        appids: gameID,
        key: process.env.STEAM_API_KEY!,
      })}`, { headers: { 'User-Agent': 'Ribbon Discord Bot (https://github.com/ribbon)' } });
      const steamResponse = await steamFetch.json();
      const steamData = steamResponse[gameID].data;
      const genres: string[] = [];
      const platforms: string[] = [];

      if (steamData.platforms.windows) platforms.push('Windows');
      if (steamData.platforms.mac) platforms.push('MacOS');
      if (steamData.platforms.linux) platforms.push('Linux');

      steamData.genres.forEach((genre: SteamGenreType) => {
        genres.push(genre.description);
      });

      steamEmbed
        .setColor(msg.guild ? msg.guild.me!.displayHexColor : DEFAULT_EMBED_COLOR)
        .setTitle(steamData.name)
        .setURL(`http://store.steampowered.com/app/${steamData.steam_appid}/`)
        .setImage(steamData.header_image)
        .setDescription(unescape(steamData.short_description))
        .addField(steamData.price_overview ? `Price in ${steamData.price_overview.currency}` : 'Price',
          steamData.price_overview
            ? `${currencyMap(steamData.price_overview.currency)}${this.insert(steamData.price_overview.final.toString(), ',')}`
            : 'Free',
          true)
        .addField('Release Date', steamData.release_date.date, true)
        .addField('Platforms', platforms.join(', '), true)
        .addField('Controller Support', steamData.controller_support ? steamData.controller_support : 'None', true)
        .addField('Age requirement', steamData.required_age !== 0 ? steamData.required_age : 'Everyone / Not in API', true)
        .addField('Genres', genres.join(', '), true)
        .addField('Developer(s)', steamData.developers, true)
        .addField('Publisher(s)', steamData.publishers, true)
        .addField('Steam Store Link', `http://store.steampowered.com/app/${steamData.steam_appid}/`, false);

      deleteCommandMessages(msg, this.client);

      return msg.embed(steamEmbed, `http://store.steampowered.com/app/${steamData.steam_appid}/`);
    } catch (err) {
      deleteCommandMessages(msg, this.client);

      return msg.reply(`nothing found for \`${game}\``);
    }
  }

  private insert(str: string, value: string) {
    return (str.substring(0, str.length - 2) + value + str.substring(str.length - 2));
  }
}