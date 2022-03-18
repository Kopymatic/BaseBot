import Eris from "eris";
import { Sequelize } from "sequelize";
import StatsCmd from "./commands/StatsCmd";
import UpdateCommandsCmd from "./commands/UpdateCommands";
import CommandStats, { setUp } from "./CommandStats";
import { CommandTypes } from "./utils/CommandUtils";
import SlashCommand from "./utils/SlashCommand";

export default class BaseBot {
    firstReady = true;
    startTime: Date;
    client: Eris.Client;
    database: Sequelize;
    commands: SlashCommand[];
    options: BaseBotOptions;

    constructor(
        client: Eris.Client | Eris.CommandClient,
        database: Sequelize,
        commands: SlashCommand[],
        options: BaseBotOptions
    ) {
        this.client = client;
        this.database = database;
        this.commands = commands;
        this.options = options;

        console.log(
            `Configuration:
               experimental: ${options.experimental}
               version: ${options.version}
               name: ${options.name}`
        );

        setUp(database);

        client.on("ready", async () => {
            //When bot is ready, log ready
            console.log("Ready!");
            if (this.firstReady) {
                this.startTime = new Date();
                //Go over all the CommandStats and set recent uses to zero
                let all = await CommandStats.findAll();
                all.forEach((index) => {
                    //Clear recent uses
                    index.recentUses = 0;
                    index.save();
                });

                if (this.options.autoSendCommands) {
                    if (options.experimental) {
                        if (options.statsCommand) {
                            commands.push(new StatsCmd(this));
                        }
                        if (options.updateCommandsCommand) {
                            commands.push(new UpdateCommandsCmd(this));
                        }
                        //Loop over all commands and send them to discord as GUILD commands
                        commands.forEach(async (index) => {
                            let newCommand = await client.createGuildCommand(options.devServerId, {
                                name: index.name,
                                description: index.description,
                                defaultPermission: index.defaultPermission,
                                options: index.options as any, //Opt out of typing for now to get ts to stfu
                                type: CommandTypes.SLASH,
                            });
                            console.log(
                                `Guild command ${index.name} created with id ${newCommand.id} in guild ${newCommand.guild_id}`
                            );

                            //If the command is marked as to be deleted, delete it
                            if (index.toDelete) {
                                client.deleteGuildCommand(newCommand.guild_id, newCommand.id);
                                console.log(`Command ${index.name} deleted`);
                            }
                        });
                    } else {
                        //Loop over all commands and send them to discord as GLOBAL commands
                        commands.forEach(async (index) => {
                            let newCommand = await client.createCommand({
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
                                client.deleteCommand(newCommand.id);
                                console.log(`Command ${index.name} deleted`);
                            }
                        });
                    }
                }

                //Create a log in a configured logging channel that the bot is online
                client.createMessage(options.loggingChannelId, {
                    embeds: [
                        {
                            title: `${options.name} Version ${options.version} is now online!`,
                            color: options.green ? options.green : 0x57f287,
                        },
                    ],
                });

                //Set this.this.firstReady to false so we dont do all this again
                this.firstReady = false;
            }
        });

        //Whenever a shard is ready, set the status on that shard. This is done so the shard id can be in the status.
        client.on("shardReady", (id) => {
            client.shards.get(id).editStatus("online", {
                name: `Version ${options.version} | Shard ${id}`,
                type: 3,
            });
        });

        //If the bot encounters an error, log it in a configured logging channel.
        client.on("error", (err) => {
            console.error(err);
            try {
                client.createMessage(options.loggingChannelId, {
                    embeds: [
                        {
                            title: `${options.name} encountered an error!`,
                            description: `\`\`\`${err.name}\n${err.message}\n${err.stack}\`\`\``,
                            color: options.red ? options.red : 0xed4245,
                        },
                    ],
                });
            } catch (error) {
                console.error(error);
            }
        });

        //Executed when we recieve an interaction, such as a slash command or button press
        client.on("interactionCreate", (interaction) => {
            //If the recieved interaction is a slash command, loop over all the commands to find which we recieved
            if (interaction instanceof Eris.CommandInteraction) {
                commands.forEach(async (command) => {
                    if (command.name.toLowerCase() == interaction.data.name) {
                        //Once we figure out what command we recieved, acknowledge it and run its onRun function.
                        await interaction.acknowledge();
                        try {
                            await command.onRun(interaction);
                        } catch (error) {
                            console.error(error);
                            interaction.createFollowup(
                                "There was an error executing your command! Contact Kopy about this!"
                            );
                        }

                        //Do statistic tracking stuff
                        let commandStats = await CommandStats.findOrCreate({
                            where: {
                                commandName: command.name,
                            },
                        });
                        commandStats[0].allTimeUses++;
                        commandStats[0].recentUses++;
                        commandStats[0].save();
                    }
                });
            }
        });

        //Set the status while loading
        client.editStatus("idle", { name: `Loading...`, type: 3 });

        //Finally, connect the bot.
        client.connect();
    }
}

export interface BaseBotOptions {
    name: string;
    version: string;
    loggingChannelId: string;
    experimental: boolean;
    devServerId: string;
    green?: number;
    red?: number;
    statsCommand?: boolean;
    defaultColor?: number;
    autoSendCommands: boolean;
    ownerID: string;
    updateCommandsCommand: boolean;
}
