/* eslint-disable @typescript-eslint/no-unused-vars */
import Eris from "eris";
import { default as KopyEris } from "@kopymatic/eris";

export default class SlashCommand {
    /**
     * The name of the command.
     */
    name: string;
    /**
     * The description for the command
     */
    description: string;
    /**
     * 	whether the command is enabled by default when the app is added to a guild
     */
    defaultPermission: boolean = true;
    /**
     * the parameters for the command, max 25
     */
    options: Eris.ApplicationCommandOptions[] | KopyEris.ApplicationCommandOptions[];
    /**
     * function to run when the command is recieved
     * @param  {Eris.CommandInteraction} interaction
     */
    onRun: (interaction: Eris.CommandInteraction) => void;
    /**
     * Whether or not the command should be deleted from discord
     */
    toDelete: boolean = false;

    /**
     * Get the user or member, guaranteed not null or undefined.
     */
    public getUser(
        interaction: Eris.CommandInteraction | Eris.ComponentInteraction
    ): Eris.Member | Eris.User {
        let user: Eris.Member | Eris.User;
        if (interaction.member == undefined || interaction.member == null) {
            user = interaction.user;
        } else {
            user = interaction.member;
        }
        return user;
    }

    /**
     * Get the options with type any for easy value getting
     */
    public getOptions(interaction: Eris.CommandInteraction): any {
        let options: any = interaction.data.options;
        return options;
    }

    /**
     * Returns true if the interaction is in a dm
     * @param interaction
     * @returns
     */
    public isInDm(interaction: Eris.CommandInteraction | Eris.ComponentInteraction): boolean {
        return interaction.member == undefined || interaction.member == null;
    }
}
