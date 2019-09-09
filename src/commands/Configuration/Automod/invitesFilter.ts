import RibbonEmbed from '@root/components/RibbonEmbed';
import { ApplyOptions, logModMessage } from '@root/components/Utils';
import { GuildSettings } from '@root/RibbonTypes';
import { oneLine, stripIndent, stripIndents } from 'common-tags';
import { Command, CommandOptions, KlasaMessage } from 'klasa';

@ApplyOptions<CommandOptions>({
  aliases: [ 'if', 'noinvites' ],
  cooldown: 3,
  cooldownLevel: 'guild',
  description: 'Toggles the invites filter',
  extendedHelp: stripIndent`
    = Argument Details =
    shouldEnable :: Whether the filter should be enabled or not
  `,
  permissionLevel: 2,
  runIn: [ 'text' ],
  usage: '<shouldEnable:bool>',
})
export default class InvitesfilterCommand extends Command {
  async run(msg: KlasaMessage, [ shouldEnable ]: [ boolean ]) {
    msg.guildSettings.set(GuildSettings.automodLinks, shouldEnable);
    const elfEmbed = new RibbonEmbed(msg.author!)
      .setDescription(stripIndents(
        `
        **Action:** External Links filter has been ${shouldEnable ? 'enabled' : 'disabled'}
        ${msg.guildSettings.get(GuildSettings.automodEnabled) ? '' : oneLine`
            **Notice:** Be sure to enable the general automod toggle with the \`${msg.guildSettings.get(GuildSettings.prefix)}automod\` command!
          `}
        `
      ));

    logModMessage(msg, elfEmbed);

    return msg.sendEmbed(elfEmbed);
  }
}