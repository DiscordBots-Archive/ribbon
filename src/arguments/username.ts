import { Argument, util, KlasaGuild, Possible, KlasaMessage, KlasaUser } from 'klasa';
import { isString } from 'util';
import { GuildMember } from 'discord.js';

const USER_REGEXP = Argument.regex.userOrMember;

const resolveUser = async (query: GuildMember | KlasaUser | string, guild: KlasaGuild): Promise<KlasaUser> => {
  if (query instanceof GuildMember) return query.user;
  if (query instanceof KlasaUser) return query;
  if (typeof query === 'string') {
    if (USER_REGEXP.test(query)) {
      const member = await guild.members.fetch(USER_REGEXP.exec(query)[1]);

      return member.user;
    }
    if (/\w{1,32}#\d{4}/.test(query)) {
      const res = guild.members.find(member => member.user.tag.toLowerCase() === query.toLowerCase());

      return res ? res.user : null;
    }
  }

  return null;
};

export default class UsernameArgument extends Argument {
  async run(arg: Parameters<typeof resolveUser>[0], possible: Possible, msg: KlasaMessage) {
    if (!msg.guild) return this.store.get('user').run(arg, possible, msg);
    try {
      const resUser = await resolveUser(arg, msg.guild);
      if (resUser) return resUser;
    } catch {
      // Proceed normally
    }

    if (isString(arg)) {
      const results = [];
      const reg = new RegExp(util.regExpEsc(arg), 'i');
      for (const member of msg.guild.members.values()) {
        if (reg.test(member.user.username)) results.push(member.user);
      }

      let querySearch: KlasaUser[];

      if (results.length > 0) {
        const regWord = new RegExp(`\\b${util.regExpEsc(arg)}\\b`, 'i');
        const filtered = results.filter(user => regWord.test(user.username));
        querySearch = filtered.length > 0 ? filtered : results;
      } else {
        querySearch = results;
      }

      switch (querySearch.length) {
        case 0: throw new Error(`${possible.name} Must be a valid name, id or user mention`);
        case 1: return querySearch[0];
        default: throw new Error(`Found multiple matches: \`${querySearch.map(user => user.tag).join('`, `')}\``);
      }
    }

    throw new Error('an invalid argument was given');
  }
}