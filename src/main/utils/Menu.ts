import { EventEmitter } from "events";
import {
    Client,
    ComponentInteraction,
    InteractionButton,
    Interaction,
    CommandInteraction,
    InteractionContent,
    CommandClient,
} from "eris";
import InteractionUtils from "./InteractionUtils";
import { ComponentTypes, ResponseFlags } from "./CommandUtils";

export default class Menu extends EventEmitter {
    protected client: Client | CommandClient;
    protected interaction: CommandInteraction;
    protected message: InteractionContent;
    protected buttons: MenuButton[];
    protected readonly options: MenuOptions;
    protected timeout: NodeJS.Timeout;

    constructor(
        client: Client | CommandClient,
        interaction: CommandInteraction,
        message: InteractionContent,
        buttons: MenuButton[],
        options: MenuOptions
    ) {
        super();
        this.client = client;
        this.interaction = interaction;
        this.message = message;
        this.options = options;
        this.buttons = buttons;
        this.timeout = this.resetTimeout();

        this.initialize();
    }

    private async initialize() {
        this.client.on("interactionCreate", this.handleButtonPress);

        this.once("end", async () => {
            this.buttons.forEach((button: MenuButton) => {
                button.button.disabled = true;
            });

            let buttons: any = this.buttons.map((button: MenuButton) => {
                return button.button;
            });

            this.message.components = [{ type: ComponentTypes.ActionRow, components: buttons }];

            let originalMessage = await this.interaction.getOriginalMessage();
            originalMessage.edit(this.message);

            clearTimeout(this.timeout);
            this.client.off("interactionCreate", this.handleButtonPress);
        });

        this.once("cancel", async () => {
            this.buttons.forEach((button: MenuButton) => {
                button.button.disabled = true;
            });

            let buttons: any = this.buttons.map((button: MenuButton) => {
                return button.button;
            });

            this.message.components = [{ type: ComponentTypes.ActionRow, components: buttons }];

            let originalMessage = await this.interaction.getOriginalMessage();
            originalMessage.edit(this.message);

            clearTimeout(this.timeout);
            this.client.off("interactionCreate", this.handleButtonPress);
        });

        this.interaction.createFollowup(this.message);
    }

    protected handleButtonPress = async (interaction: Interaction): Promise<void> => {
        if (!(interaction instanceof ComponentInteraction)) {
            return;
        }
        if (InteractionUtils.isInDm(interaction)) {
            return;
        }

        if (!this.options.allowedUsers.includes(InteractionUtils.getUser(interaction).id)) {
            interaction.createMessage({
                content: "This menu is not for you",
                flags: ResponseFlags.EPHEMERAL,
            });
            return;
        }

        let custom_id = interaction.data.custom_id;
        this.buttons.forEach(async (button) => {
            if (button.button.custom_id === custom_id) {
                try {
                    await interaction.acknowledge();
                } catch (error) {
                    console.error(error);
                    return;
                }

                try {
                    await button.func(interaction);
                } catch (error) {
                    interaction.createFollowup(
                        "There was an error handling the button press. Contact Kopy about this!"
                    );
                }
            }
        });

        this.timeout = this.resetTimeout();
    };

    protected resetTimeout = (): NodeJS.Timeout => {
        clearTimeout(this.timeout);
        return setTimeout(() => this.emit("cancel", null), this.options.maxTime);
    };
}

export class MenuOptions {
    public allowedUsers: string[];
    public maxTime: number = 120000;
}

export interface MenuButton {
    button: InteractionButton;
    func: Function;
}
