import { DataTypes, Model, Sequelize } from "sequelize";

export function setUp(database: Sequelize) {
    CommandStats.init(
        {
            commandName: {
                type: DataTypes.TEXT,
                allowNull: false,
                primaryKey: true,
            },
            allTimeUses: {
                type: DataTypes.BIGINT,
                allowNull: false,
                defaultValue: 0,
            },
            recentUses: {
                type: DataTypes.BIGINT,
                allowNull: false,
                defaultValue: 0,
            },
        },
        { sequelize: database }
    );

    CommandStats.sync().then(
        () => console.log("CommandStats model success!"),
        (err) => console.error("CommandStats model error!", err)
    );
}

export default class CommandStats extends Model {
    // Specifying data types on the class itself so the compiler doesnt complain
    public commandName: string;
    public allTimeUses: number;
    public recentUses: number;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}
