import BaseBot from "../BaseBot";
import { CommandTypes, ResponseFlags } from "../utils/CommandUtils";
import SlashCommand from "../utils/SlashCommand";
import StatsCmd from "./StatsCmd";

export default class UpdateCommandsCmd extends SlashCommand {
    constructor(bot: BaseBot) {
        super();
        this.name = "UpdateCommands";
        this.description = "Resend commands to discord. OWNER ONLY.";
        this.onRun = (interaction) => {
            const user = this.getUser(interaction);
            if (user.id !== bot.options.ownerID) {
                interaction.createFollowup({
                    content: "Owner only.",
                    flags: ResponseFlags.EPHEMERAL,
                });
            } else {
                if (bot.options.experimental) {
                    if (bot.options.statsCommand) {
                        bot.commands.push(new StatsCmd(bot));
                    }
                    if (bot.options.updateCommandsCommand) {
                        bot.commands.push(new UpdateCommandsCmd(bot));
                    }
                    //Loop over all commands and send them to discord as GUILD commands
                    bot.commands.forEach(async (index) => {
                        let newCommand = await bot.client.createGuildCommand(
                            bot.options.devServerId,
                            {
                                name: index.name,
                                description: index.description,
                                defaultPermission: index.defaultPermission,
                                options: index.options as any, //Opt out of typing for now to get ts to stfu
                                type: CommandTypes.SLASH,
                            }
                        );
                        console.log(
                            `Guild command ${index.name} created with id ${newCommand.id} in guild ${newCommand.guild_id}`
                        );

                        //If the command is marked as to be deleted, delete it
                        if (index.toDelete) {
                            bot.client.deleteGuildCommand(newCommand.guild_id, newCommand.id);
                            console.log(`Command ${index.name} deleted`);
                        }
                    });
                } else {
                    //Loop over all commands and send them to discord as GLOBAL commands
                    bot.commands.forEach(async (index) => {
                        let newCommand = await bot.client.createCommand({
                            name: index.name,
                            description: index.description,
                            defaultPermission: index.defaultPermission,
                            options: index.options as any,
                            type: CommandTypes.SLASH,
                        });
                        console.log(
                            `Global command ${index.name} created with id ${newCommand.id}`
                        );

                        //If the command is marked as to be deleted, delete it
                        if (index.toDelete) {
                            bot.client.deleteCommand(newCommand.id);
                            console.log(`Command ${index.name} deleted`);
                        }
                    });
                }
            }
        };
    }
}
