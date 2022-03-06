import Eris from "eris";
import BaseBot, { BaseBotOptions } from "../BaseBot";
import CommandStats from "../CommandStats";
import { ButtonPaginator } from "../utils/ButtonPaginator";
import SlashCommand from "../utils/SlashCommand";

export default class StatsCmd extends SlashCommand {
    bot: BaseBot;

    constructor(baseBot: BaseBot) {
        super();
        this.name = "Stats";
        this.description = "Bot statistics!";
        this.onRun = async (interaction) => {
            let user = this.getUser(interaction);

            await interaction.createFollowup({
                embeds: [
                    {
                        title: "Loading...",
                    },
                ],
            });

            let all = await CommandStats.findAll();

            let allTimeTotal: number = 0;
            let recentTotal: number = 0;
            all.forEach((index) => {
                recentTotal += +index.recentUses;
                allTimeTotal += +index.allTimeUses;
            });

            let embeds: Eris.Embed[] = [
                {
                    title: `About ${this.bot.options.name}`,
                    description: `This is a bot made by Kopymatic to hopefully make peoples lives better.\nAll time commands run: ${allTimeTotal}\nCommands run since last restart: ${recentTotal}`,
                    color: this.bot.options.defaultColor ? this.bot.options.defaultColor : 0x000000,
                    type: "rich",
                },
            ];

            all.forEach((index) => embeds.push(this.makeEmbed(index)));

            new ButtonPaginator(this.bot.client, await interaction.getOriginalMessage(), {
                startingPage: 0,
                allowedUsers: [user.id],
                maxTime: 30000,
                pages: embeds,
            });
        };
    }
    makeEmbed(commandStats: CommandStats): Eris.Embed {
        return {
            title: `About the command ${commandStats.commandName}`,
            description: `All time uses: ${commandStats.allTimeUses}\nUses since last restart: ${commandStats.recentUses}`,
            color: this.bot.options.defaultColor ? this.bot.options.defaultColor : 0x000000,
            type: "rich",
        };
    }
}
