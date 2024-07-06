const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const {
  AvaSettings,
  AvaMembers,
  AvaGuilds,
  AvaPlusOneCategories,
  AvaPlusOneLogs,
  AvaActivity,
} = require("../dbmodels/ava.js");
const getDisplayName = require("../utils/getDisplayName.js");
//const fetch = require("node-fetch");

const SETTINGS_OPTIONS = {
  registered_role: { name: "Role for Registered members", value: "registered_role" },
  manager_role: { name: "Role that can manage this bot", value: "manager_role" },
  wrong_guild_channel_log: {
    name: "Channel for wrong guild tag logs",
    value: "wrong_guild_channel_log",
  },
  plus_one_role: { name: "Role with access to add Plus One", value: "plus_one_role" },
  plus_one_channel_log: { name: "Channel for plus one logs", value: "plus_one_channel_log" },
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ava")
    .setDescription("Avalonian Discord manager.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("setup")
        .setDescription("Bot setup")
        .addStringOption((option) =>
          option
            .setName("option")
            .setDescription("Select which setup option you want to change.")
            .addChoices(
              SETTINGS_OPTIONS.registered_role,
              SETTINGS_OPTIONS.manager_role,
              SETTINGS_OPTIONS.wrong_guild_channel_log,
              SETTINGS_OPTIONS.plus_one_role,
              SETTINGS_OPTIONS.plus_one_channel_log
            )
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("value")
            .setDescription("Please mention role or channel for specific option.")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("setup_show").setDescription("Show bot setup")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("setup_remove")
        .setDescription("Removing specific bot setup")
        .addStringOption((option) =>
          option
            .setName("setup_entry")
            .setDescription("Select option to remove.")
            .setAutocomplete(true)
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("register")
        .setDescription("Register on the server")
        .addStringOption((option) =>
          option
            .setName("ao_server")
            .setDescription("Select server where you play")
            .addChoices(
              { name: "Europe", value: "ams" },
              { name: "Asia", value: "sgp" },
              { name: "Americas", value: "us" }
            )
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("ao_name")
            .setDescription("Write your ingame nickname (Size of the letters matters!)")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("ao_id")
            .setDescription("Albion API player ID in case if you can't register by name.")
        )
        .addStringOption((option) =>
          option
            .setName("ao_guild")
            .setDescription("Albion guild in case if you can't register just by name.")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("register_update")
        .setDescription("Update your registration after guild change")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("register_manual")
        .setDescription("Register manually on the server")
        .addUserOption((option) =>
          option
            .setName("member")
            .setDescription("Select member you want to register")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("ao_server")
            .setDescription("Select server where you play")
            .addChoices(
              { name: "Europe", value: "ams" },
              { name: "Asia", value: "sgp" },
              { name: "Americas", value: "us" }
            )
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("ao_name")
            .setDescription("Write ingame nickname (Size of the letters matters!)")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("ao_id")
            .setDescription("Albion API player ID in case if you can't register by name.")
        )
        .addStringOption((option) =>
          option
            .setName("ao_guild")
            .setDescription("Albion guild in case if you can't register just by name.")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("unregister_manual")
        .setDescription("Unregister manually member from the server")
        .addUserOption((option) =>
          option
            .setName("member")
            .setDescription("Select member you want to unregister")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("guilds_add")
        .setDescription("Set custom prefix for the guild")
        .addStringOption((option) =>
          option
            .setName("ao_server")
            .setDescription("Select server where you play")
            .addChoices(
              { name: "Europe", value: "ams" },
              { name: "Asia", value: "sgp" },
              { name: "Americas", value: "us" }
            )
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("ao_guild")
            .setDescription("Write guild name (Size of the letters matters!)")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("prefix")
            .setDescription("Custom prefix for members that belongs to this guild.")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("ao_guild_id")
            .setDescription("Albion API player ID in case if you can't register by name.")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("guilds_show").setDescription("Show already configured custom prefixes")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("guilds_remove")
        .setDescription("Removing specific guild prefix configuration")
        .addStringOption((option) =>
          option
            .setName("guild_prefix")
            .setDescription("Select guild and prefix to remove.")
            .setAutocomplete(true)
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("plus_one_category_create")
        .setDescription("Create category for Plus One")
        .addStringOption((option) =>
          option
            .setName("category")
            .setDescription("Write the category name for plus one")
            .setRequired(true)
        )
        .addRoleOption((option) =>
          option
            .setName("basic_role")
            .setDescription("Basic role for this category")
            .setRequired(true)
        )
        .addRoleOption((option) =>
          option
            .setName("experienced_role")
            .setDescription("Albion API player ID in case if you can't register by name.")
            .setRequired(true)
        )
        .addNumberOption((option) =>
          option
            .setName("min_plus_ones")
            .setDescription("Number of plus ones to get experienced role.")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("plus_one_category_remove")
        .setDescription("Remove role for plus one")
        .addStringOption((option) =>
          option
            .setName("category")
            .setDescription("Category to be removed")
            .setAutocomplete(true)
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("plus_one")
        .setDescription("Add plus one")
        .addUserOption((option) =>
          option
            .setName("member")
            .setDescription("Select member you want to give plus one")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("category")
            .setDescription("Select category for plus one")
            .setAutocomplete(true)
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("city")
            .setDescription("Select category for plus one")
            .addChoices(
              { name: "Lymhurst", value: "Lymhurst" },
              { name: "Fort Sterling", value: "Fort Sterling" },
              { name: "Thetford", value: "Thetford" },
              { name: "Martlock", value: "Martlock" },
              { name: "Bridgewatch", value: "Bridgewatch" }
            )
            .setRequired(true)
        )
        .addNumberOption((option) =>
          option
            .setName("value")
            .setDescription("Value of plus one (default: 1)")
            .addChoices(
              { name: "2", value: 2 },
              { name: "1", value: 1 },
              { name: "-1", value: -1 },
              { name: "-2", value: -2 }
            )
        )
        .addStringOption((option) =>
          option.setName("reason").setDescription("Reason for different value of plus one")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("plus_one_show")
        .setDescription("Check your summary of Plus Ones")
        .addUserOption((option) =>
          option.setName("member").setDescription("Select member you want to see plus one")
        )
    ),
  async autocomplete(interaction) {
    const focusedOption = interaction.options.getFocused(true);
    let choices = [];
    if (focusedOption.name === "setup_entry") {
      try {
        const settingsDB = await AvaSettings.find({
          gid: interaction.guildId,
        }).sort({ option: 1 });

        await settingsDB.forEach((setting) => {
          choices.push({
            name: `${setting.option} - ${setting.value}`,
            value: setting._id.toString(),
          });
        });
      } catch (err) {
        console.error(err);
      }

      const filtered = choices.filter((choice) => choice.name.startsWith(focusedOption.value));
      await interaction.respond(
        filtered.map((choice) => ({ name: choice.name, value: choice.value }))
      );
    }

    if (focusedOption.name === "category") {
      try {
        const categoriesDB = await AvaPlusOneCategories.find({
          gid: interaction.guildId,
        });

        await categoriesDB.forEach((category) => {
          choices.push(category.category);
        });
      } catch (err) {
        console.error(err);
      }

      const filtered = choices.filter((choice) => choice.startsWith(focusedOption.value));
      await interaction.respond(filtered.map((choice) => ({ name: choice, value: choice })));
    }

    if (focusedOption.name === "guild_prefix") {
      try {
        const guildsDB = await AvaGuilds.find({
          gid: interaction.guildId,
        }).sort({ ao_guild: 1 });

        await guildsDB.forEach((guild) => {
          choices.push({
            name: `${guild.ao_guild} - ${guild.ao_server} - ${guild.prefix}`,
            value: guild._id.toString(),
          });
        });
      } catch (err) {
        console.error(err);
      }

      const filtered = choices.filter((choice) => choice.name.startsWith(focusedOption.value));
      await interaction.respond(
        filtered.map((choice) => ({ name: choice.name, value: choice.value }))
      );
    }

    // const filtered = choices.filter((choice) => choice.startsWith(focusedOption.value));
    // await interaction.respond(filtered.map((choice) => ({ name: choice, value: choice })));
  },
  async execute(interaction) {
    let manager_perms = false;
    let plus_one_perms = false;

    // check if have admin perms for setup commands
    if (
      !interaction.memberPermissions.has(PermissionFlagsBits.Administrator) &&
      ["setup_add", "setup_show", "setup_remove", "plus_one_category_remove"].indexOf(
        interaction.options.getSubcommand()
      ) !== -1
    ) {
      return await interaction.reply({
        content: `> *You don't have permission to execute this command!*`,
        ephemeral: true,
      });
    }

    // check if have manager perms
    if (
      [
        "register_manual",
        "unregister_manual",
        "guilds_add",
        "guilds_show",
        "guilds_remove",
        "plus_one_category_create",
      ].indexOf(interaction.options.getSubcommand()) !== -1
    ) {
      if (interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
        manager_perms = true;
      }

      try {
        const managerRoles = await AvaSettings.find({
          gid: interaction.guildId,
          option: SETTINGS_OPTIONS.manager_role.value,
        });

        const interactionUser = await interaction.guild.members.fetch(interaction.user.id, {
          cache: true,
          force: true,
        });

        await managerRoles.forEach((mgr) => {
          if (interactionUser.roles.cache.has(mgr.value)) {
            manager_perms = true;
          }
        });
      } catch (err) {
        console.error(err);
        return await interaction.reply(
          `[n4vf4] Error while checking perms. Please try again later.`
        );
      }

      if (!manager_perms) {
        return await interaction.reply({
          content: `> *You don't have permission to execute this command!*`,
          ephemeral: true,
        });
      }
    }

    if (["plus_one"].indexOf(interaction.options.getSubcommand()) !== -1) {
      if (interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
        plus_one_perms = true;
      }

      try {
        const plus_oneRoles = await AvaSettings.find({
          gid: interaction.guildId,
          option: SETTINGS_OPTIONS.plus_one_role.value,
        });

        const interactionUser = await interaction.guild.members.fetch(interaction.user.id, {
          cache: true,
          force: true,
        });

        await plus_oneRoles.forEach((plus_one) => {
          if (interactionUser.roles.cache.has(plus_one.value)) {
            plus_one_perms = true;
          }
        });
      } catch (err) {
        console.error(err);
        return await interaction.reply(
          `[g45g4] Error while checking perms. Please try again later.`
        );
      }

      if (!plus_one_perms) {
        return await interaction.reply({
          content: `> *You don't have permission to execute this command!*`,
          ephemeral: true,
        });
      }
    }

    if (interaction.options.getSubcommand() == "setup") {
      const option = interaction.options.getString("option");
      const value = interaction.options.getString("value");

      if (option == SETTINGS_OPTIONS.registered_role.value) {
        let role = value.trim();

        if (role.startsWith("<@&")) {
          role = role.substring(3, role.length - 1);
        }

        let roleData =
          (await interaction.guild.roles.cache.find((r) => {
            return r.name === role || r.id === role;
          })) || null;

        if (roleData) {
          try {
            const settingDB = await AvaSettings.findOne({
              gid: interaction.guildId,
              option: SETTINGS_OPTIONS.registered_role.value,
            });

            if (settingDB) {
              return await interaction.reply(
                `> ***${SETTINGS_OPTIONS.registered_role.name}** - is already set to: <@&${settingDB.value}> \`${settingDB.value}\`.*`
              );
            }

            const newSetting = await new AvaSettings({
              gid: interaction.guildId,
              option: SETTINGS_OPTIONS.registered_role.value,
              value: roleData.id,
            });

            await newSetting.save();

            const embedMessage = new EmbedBuilder()
              .setColor("#ff99ff")
              .setTitle(`Ava Settings`)
              .setDescription(
                `**${SETTINGS_OPTIONS.registered_role.name}** has been set to: <@&${newSetting.value}> \`#${newSetting.value}\`.`
              );

            await interaction.reply({ embeds: [embedMessage] });
          } catch (err) {
            console.error(err);
            return await interaction.reply(
              `[j98j9j] Error while creating new Ava Setting. Please try again later.`
            );
          }
        } else {
          return await interaction.reply(`> *Role **${value}** doesn't exist.*`);
        }
      } else if (option == SETTINGS_OPTIONS.manager_role.value) {
        let role = value.trim();

        if (role.startsWith("<@&")) {
          role = role.substring(3, role.length - 1);
        }

        let roleData =
          (await interaction.guild.roles.cache.find((r) => {
            return r.name === role || r.id === role;
          })) || null;

        if (roleData) {
          try {
            const settingDB = await AvaSettings.findOne({
              gid: interaction.guildId,
              option: SETTINGS_OPTIONS.manager_role.value,
              value: value,
            });

            if (settingDB) {
              return await interaction.reply(
                `> ***${SETTINGS_OPTIONS.manager_role.name}** - Role <@&${settingDB.value}> \`#${settingDB.value}\` is already added.*`
              );
            }

            const newSetting = await new AvaSettings({
              gid: interaction.guildId,
              option: SETTINGS_OPTIONS.manager_role.value,
              value: roleData.id,
            });

            await newSetting.save();

            const embedMessage = new EmbedBuilder()
              .setColor("#ff99ff")
              .setTitle(`Ava Settings`)
              .setDescription(
                `**${SETTINGS_OPTIONS.manager_role.name}** has been set to: <@&${newSetting.value}> \`#${newSetting.value}\`.`
              );

            await interaction.reply({ embeds: [embedMessage] });
          } catch (err) {
            console.error(err);
            return await interaction.reply(
              `[g3gkokf] Error while creating new Ava Setting. Please try again later.`
            );
          }
        } else {
          return await interaction.reply(`> *Role **${value}** doesn't exist.*`);
        }
      } else if (option == SETTINGS_OPTIONS.plus_one_role.value) {
        let role = value.trim();

        if (role.startsWith("<@&")) {
          role = role.substring(3, role.length - 1);
        }

        let roleData =
          (await interaction.guild.roles.cache.find((r) => {
            return r.name === role || r.id === role;
          })) || null;

        if (roleData) {
          try {
            const settingDB = await AvaSettings.findOne({
              gid: interaction.guildId,
              option: SETTINGS_OPTIONS.plus_one_role.value,
              value: value,
            });

            if (settingDB) {
              return await interaction.reply(
                `> ***${SETTINGS_OPTIONS.plus_one_role.name}** - Role <@&${settingDB.value}> \`#${settingDB.value}\` is already added.*`
              );
            }

            const newSetting = await new AvaSettings({
              gid: interaction.guildId,
              option: SETTINGS_OPTIONS.plus_one_role.value,
              value: roleData.id,
            });

            await newSetting.save();

            const embedMessage = new EmbedBuilder()
              .setColor("#ff99ff")
              .setTitle(`Ava Settings`)
              .setDescription(
                `**${SETTINGS_OPTIONS.plus_one_role.name}** has been set to: <@&${newSetting.value}> \`#${newSetting.value}\`.`
              );

            await interaction.reply({ embeds: [embedMessage] });
          } catch (err) {
            console.error(err);
            return await interaction.reply(
              `[uh92hf] Error while creating new Ava Setting. Please try again later.`
            );
          }
        } else {
          return await interaction.reply(`> *Role **${value}** doesn't exist.*`);
        }
      } else if (option == SETTINGS_OPTIONS.plus_one_channel_log.value) {
        let channel = value.trim();

        if (channel.startsWith("<#")) {
          channel = channel.substring(2, channel.length - 1);
        }

        let channelData =
          (await interaction.guild.channels.cache.find((r) => {
            return r.name === channel || r.id === channel;
          })) || null;

        if (channelData) {
          try {
            const settingDB = await AvaSettings.findOne({
              gid: interaction.guildId,
              option: SETTINGS_OPTIONS.plus_one_channel_log.value,
            });

            if (settingDB) {
              return await interaction.reply(
                `> ***${SETTINGS_OPTIONS.plus_one_channel_log.name}** - is already set to: <#${settingDB.value}> \`#${settingDB.value}\`.*`
              );
            }

            const newSetting = await new AvaSettings({
              gid: interaction.guildId,
              option: SETTINGS_OPTIONS.plus_one_channel_log.value,
              value: channelData.id,
            });

            await newSetting.save();

            const embedMessage = new EmbedBuilder()
              .setColor("#ff99ff")
              .setTitle(`Ava Settings`)
              .setDescription(
                `**${SETTINGS_OPTIONS.plus_one_channel_log.name}** has been set to: <#${newSetting.value}> \`#${newSetting.value}\`.`
              );

            await interaction.reply({ embeds: [embedMessage] });
          } catch (err) {
            console.error(err);
            return await interaction.reply(
              `[g453f2] Error while creating new Ava Setting. Please try again later.`
            );
          }
        } else {
          return await interaction.reply(`> *Channel **${value}** doesn't exist.*`);
        }
      } else if (option == SETTINGS_OPTIONS.wrong_guild_channel_log.value) {
        let channel = value.trim();

        if (channel.startsWith("<#")) {
          channel = channel.substring(2, channel.length - 1);
        }

        let channelData =
          (await interaction.guild.channels.cache.find((r) => {
            return r.name === channel || r.id === channel;
          })) || null;

        if (channelData) {
          try {
            const settingDB = await AvaSettings.findOne({
              gid: interaction.guildId,
              option: SETTINGS_OPTIONS.wrong_guild_channel_log.value,
            });

            if (settingDB) {
              return await interaction.reply(
                `> ***${SETTINGS_OPTIONS.wrong_guild_channel_log.name}** - is already set to: <#${settingDB.value}> \`#${settingDB.value}\`.*`
              );
            }
            const newSetting = await new AvaSettings({
              gid: interaction.guildId,
              option: SETTINGS_OPTIONS.wrong_guild_channel_log.value,
              value: channelData.id,
            });

            await newSetting.save();

            const embedMessage = new EmbedBuilder()
              .setColor("#ff99ff")
              .setTitle(`Ava Settings`)
              .setDescription(
                `**${SETTINGS_OPTIONS.wrong_guild_channel_log.name}** has been set to: <#${newSetting.value}> \`#${newSetting.value}\`.`
              );

            await interaction.reply({ embeds: [embedMessage] });
          } catch (err) {
            console.error(err);
            return await interaction.reply(
              `[u9h9d23] Error while creating new Ava Setting. Please try again later.`
            );
          }
        } else {
          return await interaction.reply(`> *Channel **${value}** doesn't exist.*`);
        }
      }
    } else if (interaction.options.getSubcommand() == "setup_show") {
      try {
        const settingsDB = await AvaSettings.find({
          gid: interaction.guildId,
        });

        if (settingsDB.length == 0) {
          return await interaction.reply(`> *There are no Ava Settings on this server yet.*`);
        }

        let settingsList = {};
        let message = "";

        await settingsDB.forEach((setting) => {
          settingsList[setting.option] = [];
        });

        await settingsDB.forEach((setting) => {
          settingsList[setting.option].push(setting.value);
        });

        Object.entries(settingsList).forEach(([cat, values]) => {
          if (cat.includes("_role")) {
            message += `### ${SETTINGS_OPTIONS[cat].name} \`[${
              SETTINGS_OPTIONS[cat].value
            }]\`\n ${settingsList[cat].map((val) => `> • <@&${val}> - \`#${val}\`\n`).join("")}\n`;
          }
          if (cat.includes("_channel")) {
            message += `### ${SETTINGS_OPTIONS[cat].name} \`[${
              SETTINGS_OPTIONS[cat].value
            }]\`\n ${settingsList[cat].map((val) => `> • <#${val}> - \`#${val}\`\n`).join("")}`;
          }
        });

        const embedMessage = new EmbedBuilder()
          .setColor("#ff99ff")
          .setTitle(`Ava Settings`)
          .setDescription(message);

        await interaction.reply({ embeds: [embedMessage] });
      } catch (err) {
        console.error(err);
        return await interaction.reply(
          `[h4cdfa] Error while showing Ava Setting. Please try again later.`
        );
      }
    } else if (interaction.options.getSubcommand() == "setup_remove") {
      const setup_entry = interaction.options.getString("setup_entry");

      try {
        const settingDB = await AvaSettings.findOne({ gid: interaction.guildId, _id: setup_entry });

        if (!settingDB) {
          return await interaction.reply(`> *Can't find such setting on this server*`);
        }

        await AvaSettings.deleteOne({
          gid: interaction.guild.id,
          _id: setup_entry,
        });

        let message = "";

        if (settingDB.option.includes("_role")) {
          message += `> Removed setting **${
            SETTINGS_OPTIONS[settingDB.option].name
          }** with value <@&${settingDB.value}> \`${settingDB.value}\``;
        }
        if (settingDB.option.includes("_channel")) {
          message += `> Removed setting **${
            SETTINGS_OPTIONS[settingDB.option].name
          }** with value <#${settingDB.value}> \`${settingDB.value}\``;
        }

        const embedMessage = new EmbedBuilder()
          .setColor("#cc0000")
          .setTitle(`Ava Setting removed`)
          .setDescription(message);

        await interaction.reply({ embeds: [embedMessage] });
      } catch (err) {
        console.error(err);
        return await interaction.reply(
          `[h4cdfa] Error while showing Ava Setting. Please try again later.`
        );
      }
    } else if (interaction.options.getSubcommand() == "register") {
      const ao_server = interaction.options.getString("ao_server");
      const ao_name = interaction.options.getString("ao_name");
      const ao_id = interaction.options.getString("ao_id") || null;
      const ao_guild = interaction.options.getString("ao_guild") || null;

      await interaction.deferReply({ ephemeral: true });

      const interactionUser = await interaction.guild.members.fetch(interaction.user.id, {
        force: true,
      });

      this.register(interaction, interactionUser, { ao_server, ao_name, ao_id, ao_guild });
    } else if (interaction.options.getSubcommand() == "register_update") {
      await interaction.deferReply({ ephemeral: true });

      const interactionUser = await interaction.guild.members.fetch(interaction.user.id, {
        force: true,
      });

      try {
        const responseDB = await AvaMembers.findOne({
          gid: interaction.guildId,
          id: interactionUser.user.id,
        });

        if (!responseDB) {
          const embedMessage = new EmbedBuilder()
            .setColor("#dd0000")
            .setDescription(`*User ${interactionUser} is not registered.*`);

          return await interaction.followUp({ embeds: [embedMessage], ephemeral: true });
        }

        let responseStatus = null;
        let foundPlayer = null;

        await fetch(
          `https://gameinfo${
            responseDB.ao_server !== "us" ? `-${responseDB.ao_server}` : ""
          }.albiononline.com/api/gameinfo/players/${responseDB.ao_name_id}`
        )
          .then((response) => {
            responseStatus = response.status;
            return response.text();
          })
          .then(async (data) => {
            if (responseStatus == 200) {
              const entry = JSON.parse(data);
              foundPlayer = entry;
            } else {
              const embedMessage = new EmbedBuilder()
                .setColor("#ff0000")
                .setTitle(`Error`)
                .setDescription(`Not found any player with this ID.`);

              return await interaction.followUp({
                embeds: [embedMessage],
                ephemeral: true,
              });
            }
          });

        if (!foundPlayer) {
          const embedMessage = new EmbedBuilder()
            .setColor("#ff0000")
            .setTitle(`Error`)
            .setDescription(`Not found any player with this ID.`);

          return await interaction.followUp({
            embeds: [embedMessage],
            ephemeral: true,
          });
        }

        let prefix = "";

        const guildsDB = await AvaGuilds.findOne({
          gid: interaction.guildId,
          ao_guild_id: foundPlayer.GuildId,
        });

        if (guildsDB) {
          prefix = `[${guildsDB.prefix}]`;
        } else {
          if (!foundPlayer.GuildName || foundPlayer.GuildName?.length == 0) {
            prefix = `[]`;
          } else {
            let guildNameSplit = foundPlayer.GuildName.split(" ");
            let tempName = "";

            if (guildNameSplit.length == 1) {
              prefix = `[${foundPlayer.GuildName.slice(0, 4)}]`;
            } else if (guildNameSplit.length == 2 || guildNameSplit.length == 3) {
              guildNameSplit.forEach((part) => {
                tempName += `${part.slice(0, 3)}`;
              });

              prefix = `[${tempName}]`;
            } else {
              guildNameSplit.forEach((part) => {
                tempName += `${part.slice(0, 2)}`;
              });

              prefix = `[${tempName}]`;
            }
          }
        }

        let finalName = `${prefix} ${foundPlayer.Name}`;

        await AvaMembers.findOneAndUpdate(
          {
            _id: responseDB._id,
          },
          {
            $set: {
              name: finalName,
              ao_guild: foundPlayer.GuildName,
              ao_guild_id: foundPlayer.GuildId,
              last_check: Date.now(),
            },
          }
        );

        let nicknameChangeError = "";

        try {
          await interactionUser
            .setNickname(finalName)
            .catch(
              (nicknameChangeError += `Bot doesn't have permissions to change your nickname.\n`)
            );
        } catch (err) {}

        try {
          await interactionUser.roles
            .add(settingsDB.value)
            .catch(
              (nicknameChangeError += `Bot doesn't have permissions to assign registration role.\n`)
            );
        } catch (err) {}

        let message = "";
        message += `**Updated player:** ${interactionUser}\n`;
        message += `**Prefix:** ${prefix}\n`;
        message += `**Server:** ${responseDB.ao_server}\n`;
        message += `**Player nickname:** ${finalName}\n`;
        message += `**Albion Player ID:** \`${foundPlayer.Id}\`\n`;
        message += `**Guild name:** ${foundPlayer.GuildName ?? "-"}\n`;
        message += `**Albion Guild ID:** \`${
          foundPlayer.GuildId.length ? foundPlayer.GuildId : "-"
        }\`\n`;

        const embedMessage = new EmbedBuilder()
          .setColor("#00ff00")
          .setTitle(`Registration update successfull`)
          .setDescription(message);

        if (nicknameChangeError.length) {
          embedMessage.setFooter({ text: nicknameChangeError });
        }

        return await interaction.followUp({
          embeds: [embedMessage],
          ephemeral: true,
        });
      } catch (err) {
        console.error(err);
        await interaction.followUp(
          `[jkn34] Error while checking if Ava player is registered. Please try again later.`
        );
      }
    } else if (interaction.options.getSubcommand() == "register_manual") {
      const ao_server = interaction.options.getString("ao_server");
      const ao_name = interaction.options.getString("ao_name");
      const ao_id = interaction.options.getString("ao_id") || null;
      const ao_guild = interaction.options.getString("ao_guild") || null;
      const member = interaction.options.getMember("member");

      await interaction.deferReply({ ephemeral: true });

      const interactionUser = await interaction.guild.members.fetch(member.user.id, {
        force: true,
      });

      this.register(interaction, interactionUser, { ao_server, ao_name, ao_id, ao_guild });
    } else if (interaction.options.getSubcommand() == "unregister_manual") {
      const member = interaction.options.getMember("member");

      try {
        const responseDB = await AvaMembers.findOne({
          gid: interaction.guildId,
          id: member.user.id,
        });

        const settingsDB = await AvaSettings.findOne({
          gid: interaction.guildId,
          option: SETTINGS_OPTIONS.registered_role.value,
        });

        if (!responseDB) {
          const embedMessage = new EmbedBuilder()
            .setColor("#dd0000")
            .setDescription(`*User ${member} is not registered.*`);

          return await interaction.reply({ embeds: [embedMessage] });
        }

        if (!settingsDB) {
          const embedMessage = new EmbedBuilder()
            .setColor("#dd0000")
            .setDescription(
              `*Bot is not configured for registration.\nPlease use \`/ava setup\` to finalize configuration.*.`
            );

          return await interaction.reply({ embeds: [embedMessage] });
        }

        await AvaMembers.deleteOne({
          gid: interaction.guildId,
          id: member.user.id,
        });

        const userToManage = await interaction.guild.members.fetch(member.user.id, {
          force: true,
        });

        try {
          await userToManage.setNickname(null);
        } catch (err) {
          console.log("[h45bmj] ", err.message);
        }

        try {
          await userToManage.roles.remove(settingsDB.value);
        } catch (err) {
          console.log("[x2v534] ", err.message);
        }

        const embedMessage = new EmbedBuilder()
          .setColor("#00bb00")
          .setDescription(
            `*User ${userToManage} unregistered and role <@&${settingsDB.value}> removed.*`
          );

        return await interaction.reply({ embeds: [embedMessage] });
      } catch (err) {
        console.error(err);
        await interaction.reply(
          `[h4hggv] Error while checking if Ava player is registered. Please try again later.`
        );
      }
    } else if (interaction.options.getSubcommand() == "guilds_add") {
      const ao_server = interaction.options.getString("ao_server");
      const ao_guild = interaction.options.getString("ao_guild");
      const prefix = interaction.options.getString("prefix");
      const ao_guild_id = interaction.options.getString("ao_guild_id") || null;

      await interaction.deferReply({ ephemeral: true });

      let server = "";
      if (ao_server == "ams") {
        server = "-ams";
      } else if (ao_server == "sgp") {
        server = "-sgp";
      }

      try {
        const guildDB = await AvaGuilds.findOne({
          gid: interaction.guildId,
          ao_server: ao_server,
          ao_guild: ao_guild,
        });

        if (guildDB) {
          let message = "";
          message += `**Guild name:** ${guildDB.ao_guild}\n`;
          message += `**Guild ID:** ${guildDB.ao_guild_id}\n`;
          message += `**Server:** ${guildDB.ao_server}\n`;
          message += `**Prefix:** ${guildDB.prefix}\n`;

          const embedMessage = new EmbedBuilder()
            .setColor("#dd0000")
            .setTitle("This guild is already configured")
            .setDescription(message);

          return await interaction.followUp({ embeds: [embedMessage], ephemeral: true });
        }

        let foundGuild = null;
        let foundGuilds = null;
        let responseStatus = null;

        if (ao_guild_id) {
          await fetch(
            `https://gameinfo${server}.albiononline.com/api/gameinfo/guilds/${ao_guild_id.trim()}`
          )
            .then((response) => {
              responseStatus = response.status;
              return response.text();
            })
            .then(async (data) => {
              if (responseStatus == 200) {
                const entry = JSON.parse(data);
                foundGuild = entry;
              } else {
                const embedMessage = new EmbedBuilder()
                  .setColor("#ff0000")
                  .setTitle(`Error`)
                  .setDescription(`Not found any guild with this ID.`);

                return await interaction.followUp({
                  embeds: [embedMessage],
                  ephemeral: true,
                });
              }
            });
        } else {
          await fetch(
            `https://gameinfo${server}.albiononline.com/api/gameinfo/search?q=${ao_guild.trim()}`
          )
            .then((response) => {
              responseStatus = response.status;
              return response.text();
            })
            .then(async (data) => {
              if (responseStatus == 200) {
                const entries = JSON.parse(data);

                if (entries?.guilds.length > 0) {
                  foundGuilds = null;

                  foundGuilds =
                    (await entries.guilds.filter((guild) => guild.Name == ao_guild)) || null;

                  if (foundGuilds.length > 1) {
                    let message = "";
                    foundGuilds.forEach((guild) => {
                      message += `> Guild: \`${guild.Name}\` | ID: \`${guild.Id}\` | Alliance: \`${
                        guild.AllianceName ?? "-"
                      }\`\n`;
                    });

                    const embedMessage = new EmbedBuilder()
                      .setColor("#dd0000")
                      .setTitle(`Found results:`)
                      .setDescription(`${message}`);

                    return await interaction.followUp({
                      content: `> *Found more than one result, please add ID.*`,
                      embeds: [embedMessage],
                      ephemeral: true,
                    });
                  } else if (foundGuilds.length == 0) {
                    const embedMessage = new EmbedBuilder()
                      .setColor("#dd0000")
                      .setTitle(`Error`)
                      .setDescription(`Not found any guilds.`);

                    return await interaction.followUp({
                      embeds: [embedMessage],
                      ephemeral: true,
                    });
                  }

                  foundGuild = foundGuilds[0];
                }
              } else {
                const embedMessage = new EmbedBuilder()
                  .setColor("#ff0000")
                  .setTitle(`Error`)
                  .setDescription(
                    `[gy54v] There was an error while getting the results. Please try again later.`
                  );

                return await interaction.followUp({
                  embeds: [embedMessage],
                  ephemeral: true,
                });
              }
            });
        }

        if (foundGuild) {
          const foundGuildDB = await AvaGuilds.findOne({
            gid: interaction.guildId,
            ao_guild_id: foundGuild.Id,
          });

          if (foundGuildDB) {
            let message = "";
            message += `**Guild name:** ${newGuildDB.ao_guild}\n`;
            message += `**Guild ID:** ${newGuildDB.ao_guild_id}\n`;
            message += `**Server:** ${newGuildDB.ao_server}\n`;
            message += `**Prefix:** ${newGuildDB.prefix}\n`;

            const embedMessage = new EmbedBuilder()
              .setColor("#dd0000")
              .setTitle("This guild is already configured")
              .setDescription(message);

            return await interaction.followUp({ embeds: [embedMessage], ephemeral: true });
          }

          const newGuildDB = await new AvaGuilds({
            gid: interaction.guildId,
            ao_server: ao_server,
            ao_guild: foundGuild.Name,
            ao_guild_id: foundGuild.Id,
            prefix: prefix,
          });

          await newGuildDB.save();

          let message = "";
          message += `**Guild name:** \`${foundGuild.Name}\`\n`;
          message += `**Guild ID:** \`${foundGuild.Id}\`\n`;
          message += `**Server:** \`${ao_server}\`\n`;
          message += `**Prefix:** \`${prefix}\`\n`;

          const registeredDB = await AvaMembers.find({
            gid: interaction.guildId,
            ao_guild_id: foundGuild.Id,
          });
          let updatedUsers = 0;
          if (registeredDB && registeredDB.length > 0) {
            await registeredDB.forEach(async (registered) => {
              const registeredUser = await interaction.guild.members.fetch(registered.id, {
                force: true,
              });

              const finalName = `[${prefix}] ${registered.ao_name}`;

              await AvaMembers.updateOne({ _id: registered._id.toString() }, { name: finalName });

              if (registeredUser) {
                try {
                  updatedUsers++;
                  await registeredUser.setNickname(finalName);
                } catch (err) {
                  console.log("[f2f3b4] ", err.message);
                }
              }
            });
          }

          const embedMessage = new EmbedBuilder()
            .setColor("#00ff00")
            .setTitle(
              `New guild configuration added successfully\nUpdating **${updatedUsers}** user(s) nicknames.`
            )
            .setDescription(message);

          return await interaction.followUp({
            embeds: [embedMessage],
            ephemeral: true,
          });
        } else if (!foundGuilds || !foundGuilds.length) {
          const embedMessage = new EmbedBuilder()
            .setColor("#ff0000")
            .setTitle(`Error`)
            .setDescription(`*Couldn't find a guild with the provided data.*`);

          return await interaction.followUp({
            embeds: [embedMessage],
            ephemeral: true,
          });
        }
      } catch (err) {
        console.error("h445gbd", err);
        await interaction.followUp(
          `[h445gbd] Error while creating Ava guild. Please try again later.`
        );
      }
    } else if (interaction.options.getSubcommand() == "guilds_show") {
      try {
        const guildsDB = await AvaGuilds.find({
          gid: interaction.guildId,
        }).sort({ ao_guild: 1 });

        if (guildsDB.length == 0) {
          return await interaction.reply(
            `> *There are no Ava Guilds configuration on this server yet.*`
          );
        }

        let message = "";

        guildsDB.forEach((guild) => {
          if (message.length > 0) {
            message += `----------\n`;
          }
          message += `**Guild name:** \`${guild.ao_guild}\`\n`;
          message += `**Guild ID:** \`${guild.ao_guild_id}\`\n`;
          message += `**Server:** \`${guild.ao_server}\`\n`;
          message += `**Prefix:** \`${guild.prefix}\`\n`;
        });

        const embedMessage = new EmbedBuilder()
          .setColor("#ff99ff")
          .setTitle(`Ava Guilds`)
          .setDescription(message);

        await interaction.reply({ embeds: [embedMessage] });
      } catch (err) {
        console.error(err);
        return await interaction.reply(
          `[5jnv3f] Error while showing Ava Guilds. Please try again later.`
        );
      }
    } else if (interaction.options.getSubcommand() == "guilds_remove") {
      const guild_prefix = interaction.options.getString("guild_prefix");

      try {
        const guildsDB = await AvaGuilds.findOne({ gid: interaction.guildId, _id: guild_prefix });

        if (!guildsDB) {
          return await interaction.reply(`> *Can't find such guild and prefix on this server*`);
        }

        await AvaGuilds.deleteOne({
          gid: interaction.guild.id,
          _id: guild_prefix,
        });

        let message = "";

        message += `**Guild name:** \`${guildsDB.ao_guild}\`\n`;
        message += `**Guild ID:** \`${guildsDB.ao_guild_id}\`\n`;
        message += `**Server:** \`${guildsDB.ao_server}\`\n`;
        message += `**Prefix:** \`${guildsDB.prefix}\`\n`;

        const embedMessage = new EmbedBuilder()
          .setColor("#cc0000")
          .setTitle(`Ava Guild prefix removed`)
          .setDescription(message);

        await interaction.reply({ embeds: [embedMessage] });
      } catch (err) {
        console.error(err);
        return await interaction.reply(
          `[f34f34] Error while removing Ava Guild prefix. Please try again later.`
        );
      }
    } else if (interaction.options.getSubcommand() == "plus_one_category_create") {
      const category = interaction.options.getString("category").trim();
      const basic_role = interaction.options.getRole("basic_role");
      const experienced_role = interaction.options.getRole("experienced_role");
      const min_plus_ones = interaction.options.getNumber("min_plus_ones");

      if (min_plus_ones < 2) {
        return await interaction.reply(`> *Minimum value of \`min_plus_ones\` should be **2**.*`);
      }

      try {
        const response = await AvaPlusOneCategories.findOne({
          gid: interaction.guildId,
          category: category,
        });

        if (response) {
          return await interaction.reply(
            `> *Category **${category}** is already created with basic role ${basic_role} and experienced role ${experienced_role}.*`
          );
        }

        const newPlusOneCategory = await new AvaPlusOneCategories({
          gid: interaction.guildId,
          category: category,
          basic_role_id: basic_role.id,
          experienced_role_id: experienced_role.id,
          min_plus_ones: min_plus_ones,
        });

        await newPlusOneCategory.save();

        let message = "";
        message += `> **Category:** ${category}\n`;
        message += `> **Basic role:** ${basic_role}\n`;
        message += `> **Experienced role:** ${experienced_role}\n`;
        message += `> **Number of plus ones to get experienced role:** ${min_plus_ones}\n`;

        const embedMessage = new EmbedBuilder()
          .setColor("#009900")
          .setTitle(`New Category for Plus One added`)
          .setDescription(`${message}`);

        await interaction.reply({ embeds: [embedMessage] });
      } catch (err) {
        console.error(err);
        await interaction.reply(
          `[h5b45] Error while creating new Category for Plus One. Please try again later.`
        );
      }
    } else if (interaction.options.getSubcommand() == "plus_one_category_remove") {
      const category = interaction.options.getString("category").trim();

      try {
        const categoryDB = await AvaPlusOneCategories.findOne({
          gid: interaction.guildId,
          category: category,
        });

        if (!categoryDB) {
          return await interaction.reply(`> *Category **${category}** doesn't exist.*`);
        }

        await AvaPlusOneCategories.deleteOne({
          gid: interaction.guildId,
          category: category,
        });

        const plusOneDB = await AvaPlusOneLogs.find({
          gid: interaction.guildId,
          category: category,
        });

        let entriesToRemove = 0;

        await plusOneDB.forEach(() => {
          entriesToRemove++;
        });

        await AvaPlusOneLogs.deleteMany({
          gid: interaction.guildId,
          category: category,
        });

        let message = "";
        message += `> **Removed category:** ${category}\n`;
        message += `> **Removed entries in Plus One:** ${entriesToRemove}\n`;

        const embedMessage = new EmbedBuilder()
          .setColor("#990000")
          .setTitle(`Category for Plus One removed`)
          .setDescription(`${message}`);

        await interaction.reply({ embeds: [embedMessage] });
      } catch (err) {
        console.error(err);
        await interaction.reply(
          `[jn67hb4] Error while removing Category in Plus One. Please try again later.`
        );
      }
    } else if (interaction.options.getSubcommand() == "plus_one") {
      const member = interaction.options.getMember("member");
      const category = interaction.options.getString("category");
      const city = interaction.options.getString("city");
      const value = interaction.options.getNumber("value") ?? 1;
      const reason = interaction.options.getString("reason") ?? "";

      await interaction.deferReply();

      if (value !== 1 && reason.length < 5) {
        return await interaction.followUp(
          `> *If you are giving different value than 1, you have to specify the reason.*`
        );
      }

      try {
        // check if user select existing category
        const categoryDB = await AvaPlusOneCategories.findOne({
          gid: interaction.guildId,
          category: category,
        });

        if (!categoryDB) {
          return await interaction.followUp(`> *Category **${category}** doesn't exist.*`);
        }

        const interactionUser = await interaction.guild.members.fetch(interaction.user.id, {
          cache: true,
          force: true,
        });

        const selectedMember = await interaction.guild.members.fetch(member.user.id, {
          cache: true,
          force: true,
        });

        // add plus one
        const newPlusOne = await new AvaPlusOneLogs({
          gid: interaction.guildId,
          category: category,
          member_id: member.user.id,
          member_name: getDisplayName(selectedMember),
          city: city,
          value: value,
          author_id: interaction.user.id,
          author_name: getDisplayName(interactionUser),
        });

        await newPlusOne.save();

        // check how many plus ones user have now
        const memberLogsDB = await AvaPlusOneLogs.find({
          gid: interaction.guildId,
          member_id: member.user.id,
          category: category,
        });

        let plusOnes = 0;

        await memberLogsDB.forEach((entry) => {
          plusOnes += entry.value;
        });

        let message = "";

        if (value == 1) {
          message += `🟢 ${selectedMember} got positive Plus One as **${category}**. Total: **${plusOnes}**\n`;
        } else if (value == -1) {
          message += `🔴 ${selectedMember} got negative Plus One as **${category}**. Total: **${plusOnes}**\n`;
        }

        if (plusOnes >= 1) {
          if (!selectedMember.roles.cache.has(categoryDB.basic_role_id)) {
            message += `He got a role <@&${categoryDB.basic_role_id}>\n`;
            await selectedMember.roles.add(categoryDB.basic_role_id);
          }
        }

        if (plusOnes <= 0) {
          if (!selectedMember.roles.cache.has(categoryDB.experienced_role_id)) {
            message += `His role <@&${categoryDB.basic_role_id}> has been removed.\n`;
            await selectedMember.roles.remove(categoryDB.experienced_role_id);
          }
          if (!selectedMember.roles.cache.has(categoryDB.basic_role_id)) {
            message += `His role <@&${categoryDB.basic_role_id}> has been removed.\n`;
            await selectedMember.roles.remove(categoryDB.basic_role_id);
          }
        }

        if (plusOnes >= categoryDB.min_plus_ones) {
          if (!selectedMember.roles.cache.has(categoryDB.experienced_role_id)) {
            message += `He got a experienced role <@&${categoryDB.experienced_role_id}>\n`;
            await selectedMember.roles.add(categoryDB.experienced_role_id);
          }
        } else if (plusOnes < categoryDB.min_plus_ones) {
          if (selectedMember.roles.cache.has(categoryDB.experienced_role_id)) {
            message += `His experienced role <@&${categoryDB.experienced_role_id}> has been removed.\n`;
            await selectedMember.roles.remove(categoryDB.experienced_role_id);
          }
        }

        if (reason.length >= 5) {
          message += `**Reason:** *${reason}*\n`;
        }

        const embedMessage = new EmbedBuilder()
          .setColor("#0000cc")
          .setTitle(`Plus One Update`)
          .setDescription(`${message}`);

        await interaction.followUp({ embeds: [embedMessage] });

        const settingDB = await AvaSettings.findOne({
          gid: interaction.guildId,
          option: SETTINGS_OPTIONS.plus_one_channel_log.value,
        });

        if (settingDB) {
          let channelData = interaction.guild.channels.cache.get(settingDB.value);
          if (channelData) {
            message += `\n**Author**: ${interactionUser} \`#${interactionUser.user.id}\`\n`;
            message += `**City**: ${city}\n`;

            const embedMessageLog = new EmbedBuilder()
              .setColor("#777777")
              .setTitle(`Plus One Log`)
              .setDescription(`${message}`);

            channelData.send({ embeds: [embedMessageLog] });
          }
        }
      } catch (err) {
        console.error(err);
        await interaction.reply(`[g45gsf] Error while giving Plus One. Please try again later.`);
      }
    } else if (interaction.options.getSubcommand() == "plus_one_show") {
      await interaction.deferReply({ ephemeral: true });
      const member = interaction.options.getMember("member") ?? null;

      let member_id = member ? member.user.id : interaction.user.id;

      try {
        let plusOnes = {};

        // get categories
        const categoriesDB = await AvaPlusOneCategories.find({
          gid: interaction.guildId,
        }).sort({ category: 1 });

        await categoriesDB.forEach((cat) => {
          plusOnes[cat.category] = { pos: 0, neg: 0, sum: 0 };
        });

        // check how many plus ones user have now
        const memberLogsDB = await AvaPlusOneLogs.find({
          gid: interaction.guildId,
          member_id: member_id,
        });

        await memberLogsDB.forEach((entry) => {
          if (entry.value == 1) {
            plusOnes[entry.category].pos++;
          }
          if (entry.value == -1) {
            plusOnes[entry.category].neg++;
          }

          plusOnes[entry.category].sum += entry.value;
        });

        let message = "";

        const selectedMember = await interaction.guild.members.fetch(member_id, {
          force: true,
        });

        Object.entries(plusOnes).forEach(([cat, values]) => {
          if (plusOnes[cat].pos || plusOnes[cat].neg || plusOnes[cat].sum) {
            message += `### ${cat}:\n**• Positive:** ${plusOnes[cat].pos}\n**• Negative:** ${plusOnes[cat].neg}\n**• Total:** ${plusOnes[cat].sum}\n`;
          }
        });

        if (message.length < 5) {
          message = "\n*Can't find any logs of your Plus Ones*";
        }

        if (selectedMember) {
          message = `Stats for **${selectedMember}**\n${message}`;
        }

        const embedMessage = new EmbedBuilder()
          .setColor("#0000ff")
          .setTitle(`Plus One Stats`)
          .setDescription(`${message}`);

        await interaction.followUp({ embeds: [embedMessage], ephemeral: true });
      } catch (err) {
        console.error(err);
        await interaction.reply(`[hg45g] Error while checking Plus One. Please try again later.`);
      }
    }
  },
  async autoload(client) {
    // remove sync if bot is removed from source or destination server
    client.on("guildDelete", async (guild) => {
      try {
        await AvaActivity.deleteMany({ gid: guild.id });
        await AvaGuilds.deleteMany({ gid: guild.id });
        await AvaMembers.deleteMany({ gid: guild.id });
        await AvaPlusOneCategories.deleteMany({ gid: guild.id });
        await AvaPlusOneLogs.deleteMany({ gid: guild.id });
        await AvaSettings.deleteMany({ gid: guild.id });

        console.log(
          `>>> [BOT REMOVED FROM SERVER] Removing Ava entries connected with server ID: #${guild.id}`
        );
      } catch (err) {
        console.error("[uf4f3] ", err);
      }
    });

    // member join the server
    client.on("guildMemberAdd", async (member) => {
      try {
        const registeredDB = await AvaMembers.findOne({
          gid: member.guild.id,
          id: member.user.id,
        });

        if (registeredDB) {
          const server = client.guilds.cache.get(member.guild.id);

          if (server) {
            const guildMember = server.members.cache.get(member.user.id);
            if (guildMember) {
              const settingsDB = await AvaSettings.findOne({
                gid: member.guild.id,
                option: SETTINGS_OPTIONS.registered_role.value,
              });

              if (settingsDB) {
                guildMember.setNickname(registeredDB.name);
                guildMember.roles.add(settingsDB.value);
              }
            }
          }
        }
      } catch (err) {
        console.error("[gerg3]", err);
        console.log(`[gerg3] Error while checking Ava Registration. Please try again later.`);
      }
    });
  },
  async register(interaction, interactionUser, { ao_server, ao_name, ao_id, ao_guild }) {
    let settingsDB = null;

    try {
      const responseDB = await AvaMembers.findOne({
        gid: interaction.guildId,
        id: interactionUser.user.id,
      });

      settingsDB = await AvaSettings.findOne({
        gid: interaction.guildId,
        option: SETTINGS_OPTIONS.registered_role.value,
      });

      if (responseDB) {
        const embedMessage = new EmbedBuilder().setColor("#dd0000");

        if (interactionUser.user.id == interaction.user.id) {
          embedMessage.setDescription(
            `*You are already registered.\nIf you want to update your guild, use the command \`/ava register_update\`*.`
          );
        } else {
          embedMessage.setDescription(`*User ${interactionUser} is already registered.*`);
        }

        return await interaction.followUp({ embeds: [embedMessage] });
      }

      if (!settingsDB) {
        const embedMessage = new EmbedBuilder()
          .setColor("#dd0000")
          .setDescription(
            `*Bot is not configured to start registration.\nPlease use \`/ava setup\` to finalize configuration.*.`
          );

        return await interaction.followUp({ embeds: [embedMessage] });
      }
    } catch (err) {
      console.error(err);
      await interaction.followUp(
        `[h56vg] Error while checking if Ava player is registered. Please try again later.`
      );
    }

    let server = "";
    if (ao_server == "ams") {
      server = "-ams";
    } else if (ao_server == "sgp") {
      server = "-sgp";
    }

    let foundPlayer = null;
    let foundPlayers = null;
    let responseStatus = null;

    try {
      if (ao_id) {
        await fetch(
          `https://gameinfo${server}.albiononline.com/api/gameinfo/players/${ao_id.trim()}`
        )
          .then((response) => {
            responseStatus = response.status;
            return response.text();
          })
          .then(async (data) => {
            if (responseStatus == 200) {
              const entry = JSON.parse(data);
              foundPlayer = entry;
            } else {
              const embedMessage = new EmbedBuilder()
                .setColor("#ff0000")
                .setTitle(`Error`)
                .setDescription(`Not found any player with this ID.`);

              return await interaction.followUp({
                embeds: [embedMessage],
                ephemeral: true,
              });
            }
          });
      } else {
        await fetch(
          `https://gameinfo${server}.albiononline.com/api/gameinfo/search?q=${ao_name.trim()}`
        )
          .then((response) => {
            responseStatus = response.status;
            return response.text();
          })
          .then(async (data) => {
            if (responseStatus == 200) {
              const entries = JSON.parse(data);

              if (entries?.players.length > 0) {
                foundPlayers = null;

                if (ao_guild !== null) {
                  foundPlayers =
                    (await entries.players.filter(
                      (player) => player.Name == ao_name && player.GuildName == ao_guild
                    )) || null;
                } else {
                  foundPlayers =
                    (await entries.players.filter((player) => player.Name == ao_name)) || null;
                }

                if (foundPlayers.length > 1) {
                  let message = "";
                  foundPlayers.forEach((player) => {
                    message += `> Player: \`${player.Name}\` | ID: \`${player.Id}\` | Guild: \`${
                      player.GuildName ?? "-"
                    }\`\n`;
                  });

                  const embedMessage = new EmbedBuilder()
                    .setColor("#dd0000")
                    .setTitle(`Found results:`)
                    .setDescription(`${message}`);

                  return await interaction.followUp({
                    content: `> *Found more than one result, please add Guild name or ID.*`,
                    embeds: [embedMessage],
                    ephemeral: true,
                  });
                } else if (foundPlayers.length == 0) {
                  const embedMessage = new EmbedBuilder()
                    .setColor("#dd0000")
                    .setTitle(`Error`)
                    .setDescription(`Not found any player.`);

                  return await interaction.followUp({
                    embeds: [embedMessage],
                    ephemeral: true,
                  });
                }

                foundPlayer = foundPlayers[0];
              }
            } else {
              const embedMessage = new EmbedBuilder()
                .setColor("#ff0000")
                .setTitle(`Error`)
                .setDescription(
                  `There was an error while getting the results. Please try again later.`
                );

              return await interaction.followUp({
                embeds: [embedMessage],
                ephemeral: true,
              });
            }
          });
      }
    } catch (e) {
      console.error(e);
      return await interaction.followUp({
        content: `> *Something went wrong. Please try again later.*`,
        ephemeral: true,
      });
    }

    if (foundPlayer) {
      try {
        let prefix = "";

        const playerDB = await AvaMembers.findOne({
          gid: interaction.guildId,
          ao_name_id: foundPlayer.Id,
        });

        if (playerDB) {
          const embedMessage = new EmbedBuilder()
            .setColor("#dd0000")
            .setDescription(
              `*Nickname **${foundPlayer.Name}** is already registered by <@${playerDB.id}> (${playerDB.name}).*`
            );

          return await interaction.followUp({ embeds: [embedMessage] });
        }

        const guildsDB = await AvaGuilds.findOne({
          gid: interaction.guildId,
          ao_guild_id: foundPlayer.GuildId,
        });

        if (guildsDB) {
          prefix = `[${guildsDB.prefix}]`;
        } else {
          if (!foundPlayer.GuildName || foundPlayer.GuildName?.length == 0) {
            prefix = `[]`;
          } else {
            let guildNameSplit = foundPlayer.GuildName.split(" ");
            let tempName = "";

            if (guildNameSplit.length == 1) {
              prefix = `[${foundPlayer.GuildName.slice(0, 4)}]`;
            } else if (guildNameSplit.length == 2 || guildNameSplit.length == 3) {
              guildNameSplit.forEach((part) => {
                tempName += `${part.slice(0, 3)}`;
              });

              prefix = `[${tempName}]`;
            } else {
              guildNameSplit.forEach((part) => {
                tempName += `${part.slice(0, 2)}`;
              });

              prefix = `[${tempName}]`;
            }
          }
        }

        let finalName = `${prefix} ${foundPlayer.Name}`;

        const newMemberDB = await new AvaMembers({
          gid: interaction.guildId,
          id: interactionUser.user.id,
          name: finalName,
          ao_server: ao_server,
          ao_name: foundPlayer.Name,
          ao_name_id: foundPlayer.Id,
          ao_guild: foundPlayer.GuildName,
          ao_guild_id: foundPlayer.GuildId,
        });

        await newMemberDB.save();

        let nicknameChangeError = "";

        try {
          await interactionUser.setNickname(finalName).catch((err) => {
            nicknameChangeError += `Bot doesn't have permissions to change your nickname.\n`;
          });
        } catch (err) {
          console.log("[f2f3b4] ", err.message);
        }

        try {
          await interactionUser.roles.add(settingsDB.value).catch((err) => {
            nicknameChangeError += `Bot doesn't have permissions to assign registration role.\n`;
          });
        } catch (err) {
          console.log("[j56vd] ", err.message);
        }

        let message = "";
        message += `**Registered player:** ${interactionUser}\n`;
        message += `**Prefix:** ${prefix}\n`;
        message += `**Server:** ${ao_server}\n`;
        message += `**Player nickname:** ${finalName}\n`;
        message += `**Albion Player ID:** \`${foundPlayer.Id}\`\n`;
        message += `**Guild name:** ${foundPlayer.GuildName ?? "-"}\n`;
        message += `**Albion Guild ID:** \`${
          foundPlayer.GuildId.length ? foundPlayer.GuildId : "-"
        }\`\n`;

        const embedMessage = new EmbedBuilder()
          .setColor("#00ff00")
          .setTitle(`Registration successfull`)
          .setDescription(message);

        if (nicknameChangeError.length) {
          embedMessage.setFooter({ text: nicknameChangeError });
        }

        return await interaction.followUp({
          embeds: [embedMessage],
          ephemeral: true,
        });
      } catch (err) {
        console.error("nu9f234", err);
        await interaction.followUp(
          `[nu9f234] Error while registering new Ava player. Please try again later.`
        );
      }
    } else if (!foundPlayers.length) {
      const embedMessage = new EmbedBuilder()
        .setColor("#ff0000")
        .setTitle(`Error`)
        .setDescription(`*Couldn't find a player with the provided data.*`);

      return await interaction.followUp({
        embeds: [embedMessage],
        ephemeral: true,
      });
    }
  },
};
