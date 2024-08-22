const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
} = require("discord.js");
const { ObjectivesSettings, ObjectivesTypes, Objectives } = require("../dbmodels/objectives.js");
const getDisplayName = require("../utils/getDisplayName.js");
const aoMapNames = require("../utils/aoMapNames.js");

const SETTINGS_OPTIONS = {
  default_reminder_time: { name: "Default reminder time", value: "default_reminder_time" },
  reminders_channel: { name: "Channel for sending reminders", value: "reminders_channel" },
  upcoming_objectives_channel: {
    name: "Channel for upcoming objectives",
    value: "upcoming_objectives_channel",
  },
  manager_role: { name: "Role that can manage this bot", value: "manager_role" },
  last_summary_post: { name: "Last summary post data", value: "last_summary_post" },
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("objectives")
    .setDescription("Objectives manager.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("setup")
        .setDescription("Bot setup")
        .addStringOption((option) =>
          option
            .setName("option")
            .setDescription("Select which setup option you want to change.")
            .addChoices(
              SETTINGS_OPTIONS.default_reminder_time,
              SETTINGS_OPTIONS.reminders_channel,
              SETTINGS_OPTIONS.upcoming_objectives_channel,
              SETTINGS_OPTIONS.manager_role
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
      subcommand.setName("reload_summary").setDescription("Reload objective summary")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("setup_objective_create")
        .setDescription("Create objective type")
        .addStringOption((option) =>
          option
            .setName("objective_name")
            .setDescription("Write the objective name")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("thumbnail_url")
            .setDescription("Optional thumbnail URL that will be added to the message")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("setup_objective_remove")
        .setDescription("Remove objective type")
        .addStringOption((option) =>
          option
            .setName("objective_name")
            .setDescription("Objective type to be removed")
            .setAutocomplete(true)
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Add new objective")
        .addStringOption((option) =>
          option
            .setName("objective_type")
            .setDescription("Objective type")
            .setAutocomplete(true)
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("map_name")
            .setDescription("Map name")
            .setAutocomplete(true)
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("unlock_in")
            .setDescription("Unlock in (use format HH:MM for example, 1:40 or 0:40)")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option.setName("additional_note").setDescription("Additional note")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("update")
        .setDescription("Update existing objective")
        .addStringOption((option) =>
          option.setName("message_id").setDescription("Message ID").setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("unlock_in")
            .setDescription("Unlock in (use format HH:MM for example, 1:40 or 0:40)")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("stats")
        .setDescription("Show objective stats")
        .addUserOption((option) =>
          option.setName("user").setDescription("Check stats for sepcific user.")
        )
    ),
  // .addSubcommand((subcommand) =>
  //   subcommand
  //     .setName("top_stats")
  //     .setDescription("Show TOP objective stats")
  //     .addNumberOption((option) =>
  //       option.setName("days").setDescription("Check stats for last X days (default: 30 days).")
  //     )
  //     .addNumberOption((option) =>
  //       option.setName("top").setDescription("Show top X results (default: 10 | max: 30).")
  //     )
  //     .addBooleanOption((option) =>
  //       option
  //         .setName("show_only_taken")
  //         .setDescription("Show in stats only taken objectives (default: yes).")
  //     )
  // )
  async autocomplete(interaction) {
    const focusedOption = interaction.options.getFocused(true);
    let choices = [];
    if (focusedOption.name === "setup_entry") {
      try {
        const settingsDB = await ObjectivesSettings.find({
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

    if (focusedOption.name === "objective_name" || focusedOption.name === "objective_type") {
      try {
        const objectivesDB = await ObjectivesTypes.find({
          gid: interaction.guildId,
        });

        await objectivesDB.forEach((objective) => {
          choices.push(objective.name);
        });
      } catch (err) {
        console.error(err);
      }

      const filtered = choices.filter((choice) => choice.startsWith(focusedOption.value));
      await interaction.respond(filtered.map((choice) => ({ name: choice, value: choice })));
    }

    if (focusedOption.name === "map_name") {
      try {
        const maps = aoMapNames();

        await maps.forEach((map_name) => {
          choices.push({
            name: map_name,
            value: map_name,
          });
        });
      } catch (err) {
        console.error(err);
      }

      const filtered = choices.filter((choice) =>
        choice.name.toLowerCase().includes(focusedOption.value.toLowerCase())
      );
      const limitedResults = filtered.slice(0, 20);
      await interaction.respond(
        limitedResults.map((choice) => ({ name: choice.name, value: choice.value }))
      );
    }
  },
  async execute(interaction) {
    // check if have admin perms for setup commands
    if (
      !interaction.memberPermissions.has(PermissionFlagsBits.Administrator) &&
      [
        "setup",
        "setup_show",
        "setup_remove",
        "setup_objective_create",
        "setup_objective_remove",
      ].indexOf(interaction.options.getSubcommand()) !== -1
    ) {
      return await interaction.reply({
        content: `> *You don't have permission to execute this command!*`,
        ephemeral: true,
      });
    }

    if (interaction.options.getSubcommand() == "setup") {
      const option = interaction.options.getString("option");
      const value = interaction.options.getString("value");

      if (option == SETTINGS_OPTIONS.reminders_channel.value) {
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
            const settingDB = await ObjectivesSettings.findOne({
              gid: interaction.guildId,
              option: SETTINGS_OPTIONS.reminders_channel.value,
            });

            if (settingDB) {
              return await interaction.reply(
                `> ***${SETTINGS_OPTIONS.reminders_channel.name}** - is already set to: <#${settingDB.value}> \`#${settingDB.value}\`.*`
              );
            }

            const newSetting = await new ObjectivesSettings({
              gid: interaction.guildId,
              option: SETTINGS_OPTIONS.reminders_channel.value,
              value: channelData.id,
            });

            await newSetting.save();

            const embedMessage = new EmbedBuilder()
              .setColor("#ff99ff")
              .setTitle(`Objective Settings`)
              .setDescription(
                `**${SETTINGS_OPTIONS.reminders_channel.name}** has been set to: <#${newSetting.value}> \`#${newSetting.value}\`.`
              );

            await interaction.reply({ embeds: [embedMessage] });
          } catch (err) {
            console.error(err);
            return await interaction.reply(
              `[g453f2] Error while creating new Objective Setting. Please try again later.`
            );
          }
        } else {
          return await interaction.reply(`> *Channel **${value}** doesn't exist.*`);
        }
      } else if (option == SETTINGS_OPTIONS.upcoming_objectives_channel.value) {
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
            const settingDB = await ObjectivesSettings.findOne({
              gid: interaction.guildId,
              option: SETTINGS_OPTIONS.upcoming_objectives_channel.value,
            });

            if (settingDB) {
              return await interaction.reply(
                `> ***${SETTINGS_OPTIONS.upcoming_objectives_channel.name}** - is already set to: <#${settingDB.value}> \`#${settingDB.value}\`.*`
              );
            }
            const newSetting = await new ObjectivesSettings({
              gid: interaction.guildId,
              option: SETTINGS_OPTIONS.upcoming_objectives_channel.value,
              value: channelData.id,
            });

            await newSetting.save();

            const embedMessage = new EmbedBuilder()
              .setColor("#ff99ff")
              .setTitle(`Objective Settings`)
              .setDescription(
                `**${SETTINGS_OPTIONS.upcoming_objectives_channel.name}** has been set to: <#${newSetting.value}> \`#${newSetting.value}\`.`
              );

            await interaction.reply({ embeds: [embedMessage] });
          } catch (err) {
            console.error(err);
            return await interaction.reply(
              `[u9h9d23] Error while creating new Objective Setting. Please try again later.`
            );
          }
        } else {
          return await interaction.reply(`> *Channel **${value}** doesn't exist.*`);
        }
      } else if (option == SETTINGS_OPTIONS.default_reminder_time.value) {
        let timeString = value.trim();
        let time = null;

        try {
          time = parseInt(timeString);
        } catch (e) {
          return await interaction.reply(`> *Provided value [${timeString}] is not a number.*`);
        }

        if (!time || time < 5) {
          return await interaction.reply(
            `> *Provided value [${time}] is not a number or is lower than 5.*`
          );
        }

        try {
          const settingDB = await ObjectivesSettings.findOne({
            gid: interaction.guildId,
            option: SETTINGS_OPTIONS.default_reminder_time.value,
          });

          if (settingDB) {
            return await interaction.reply(
              `> ***${SETTINGS_OPTIONS.default_reminder_time.name}** - is already set to: <#${settingDB.value}> \`#${settingDB.value}\`.*`
            );
          }
          const newSetting = await new ObjectivesSettings({
            gid: interaction.guildId,
            option: SETTINGS_OPTIONS.default_reminder_time.value,
            value: time.toString(),
          });

          await newSetting.save();

          const embedMessage = new EmbedBuilder()
            .setColor("#ff99ff")
            .setTitle(`Objective Settings`)
            .setDescription(
              `**${SETTINGS_OPTIONS.default_reminder_time.name}** has been set to: **${time}**.`
            );

          await interaction.reply({ embeds: [embedMessage] });
        } catch (err) {
          console.error(err);
          return await interaction.reply(
            `[u9h9d23] Error while creating new Objective Setting. Please try again later.`
          );
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
            const settingDB = await ObjectivesSettings.findOne({
              gid: interaction.guildId,
              option: SETTINGS_OPTIONS.manager_role.value,
              value: value,
            });

            if (settingDB) {
              return await interaction.reply(
                `> ***${SETTINGS_OPTIONS.manager_role.name}** - Role <@&${settingDB.value}> \`#${settingDB.value}\` is already added.*`
              );
            }

            const newSetting = await new ObjectivesSettings({
              gid: interaction.guildId,
              option: SETTINGS_OPTIONS.manager_role.value,
              value: roleData.id,
            });

            await newSetting.save();

            const embedMessage = new EmbedBuilder()
              .setColor("#ff99ff")
              .setTitle(`Objective Settings`)
              .setDescription(
                `**${SETTINGS_OPTIONS.manager_role.name}** has been set to: <@&${newSetting.value}> \`#${newSetting.value}\`.`
              );

            await interaction.reply({ embeds: [embedMessage] });
          } catch (err) {
            console.error(err);
            return await interaction.reply(
              `[h4h45g] Error while creating new Objective Setting. Please try again later.`
            );
          }
        } else {
          return await interaction.reply(`> *Role **${value}** doesn't exist.*`);
        }
      }
    } else if (interaction.options.getSubcommand() == "setup_show") {
      try {
        const settingsDB = await AvaSettings.find({
          gid: interaction.guildId,
        });

        if (settingsDB.length == 0) {
          return await interaction.reply(`> *There are no Objective Settings on this server yet.*`);
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
          .setTitle(`Objective Settings`)
          .setDescription(message);

        await interaction.reply({ embeds: [embedMessage] });
      } catch (err) {
        console.error(err);
        return await interaction.reply(
          `[h4cdfa] Error while showing Objective Setting. Please try again later.`
        );
      }
    } else if (interaction.options.getSubcommand() == "setup_remove") {
      const setup_entry = interaction.options.getString("setup_entry");

      try {
        const settingDB = await ObjectivesSettings.findOne({
          gid: interaction.guildId,
          _id: setup_entry,
        });

        if (!settingDB) {
          return await interaction.reply(`> *Can't find such setting on this server*`);
        }

        await ObjectivesSettings.deleteOne({
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
          .setTitle(`Objective Setting removed`)
          .setDescription(message);

        await interaction.reply({ embeds: [embedMessage] });
      } catch (err) {
        console.error(err);
        return await interaction.reply(
          `[h4cdfa] Error while showing Objective Settings. Please try again later.`
        );
      }
    } else if (interaction.options.getSubcommand() == "setup_objective_create") {
      const objective_name = interaction.options.getString("objective_name").trim();
      const thumbnail_url = interaction.options.getString("thumbnail_url") ?? "";

      try {
        const response = await ObjectivesTypes.findOne({
          gid: interaction.guildId,
          name: objective_name,
        });

        if (response) {
          return await interaction.reply(`> *Objective type **${category}** is already created.*`);
        }

        let thumbnail = "";

        if (thumbnail_url && thumbnail_url.length > 5) {
          try {
            url = new URL(thumbnail_url);

            if (url.protocol === "http:" || url.protocol === "https:") {
              thumbnail = thumbnail_url.trim();
            }
          } catch (_) {
            //
          }
        }

        const newObjective = await new ObjectivesTypes({
          gid: interaction.guildId,
          name: objective_name,
          thumbnail_url: thumbnail,
        });

        await newObjective.save();

        let message = "";
        message += `> **Objective name:** ${objective_name}\n`;
        if (thumbnail.length > 5) {
          message += `> **Thumbnail URL:** <${thumbnail}>\n`;
        }

        const embedMessage = new EmbedBuilder()
          .setColor("#009900")
          .setTitle(`New Objective type added`)
          .setDescription(`${message}`);

        await interaction.reply({ embeds: [embedMessage] });
      } catch (err) {
        console.error(err);
        await interaction.reply(
          `[h5b45] Error while creating new Objective type Please try again later.`
        );
      }
    } else if (interaction.options.getSubcommand() == "setup_objective_remove") {
      const objective_name = interaction.options.getString("objective_name").trim();

      try {
        const objectiveDB = await ObjectivesTypes.findOne({
          gid: interaction.guildId,
          name: objective_name,
        });

        if (!objectiveDB) {
          return await interaction.reply(`> *Objective type **${objective_name}** doesn't exist.*`);
        }

        await ObjectivesTypes.deleteOne({
          gid: interaction.guildId,
          name: objective_name,
        });

        let message = "";
        message += `> **Removed Objective type:** ${objective_name}\n`;

        const embedMessage = new EmbedBuilder()
          .setColor("#990000")
          .setTitle(`Objective type removed`)
          .setDescription(`${message}`);

        await interaction.reply({ embeds: [embedMessage] });
      } catch (err) {
        console.error(err);
        await interaction.reply(
          `[jn67hb4] Error while removing Objective type. Please try again later.`
        );
      }
    } else if (interaction.options.getSubcommand() == "add") {
      const objective_type = interaction.options.getString("objective_type");
      const map_name = interaction.options.getString("map_name");
      const unlock_in = interaction.options.getString("unlock_in").trim();
      const additional_note = interaction.options.getString("additional_note") ?? "";

      await interaction.deferReply({ ephemeral: true });

      let hours = 0;
      let minutes = 0;

      let timecheck = new RegExp(/^((([01]\d|2[0-3]|\d):)?([0-5]\d|[5-9])|([01]\d|2[0-3]|\d):\d)$/);

      if (timecheck.test(unlock_in) == true) {
        if (unlock_in.includes(":")) {
          [hours, minutes] = unlock_in.split(":");
        } else {
          minutes = unlock_in;
        }
      } else {
        return await interaction.followUp({
          content: `> *Plaese provide time for **Unlock in** in a valid format.*`,
          ephemeral: true,
        });
      }

      let objective_time = new Date();
      objective_time.setHours(objective_time.getHours() + parseInt(hours));
      objective_time.setMinutes(objective_time.getMinutes() + parseInt(minutes));

      let objective_time_before = new Date(objective_time);
      objective_time_before.setMinutes(objective_time_before.getMinutes() - 5);
      let objective_time_after = new Date(objective_time);
      objective_time_after.setMinutes(objective_time_after.getMinutes() + 5);

      // check if map name is valid
      const aoMaps = aoMapNames();

      if (aoMaps.indexOf(map_name) === -1) {
        return await interaction.followUp({
          content: `> ***Map name** is not valid.*`,
          ephemeral: true,
        });
      }

      // check if obcjective type is valid
      try {
        const isObjectiveExist = await ObjectivesTypes.findOne({
          gid: interaction.guildId,
          name: objective_type,
        });

        if (!isObjectiveExist) {
          return await interaction.followUp({
            content: `> ***Objective type** is not valid.*`,
            ephemeral: true,
          });
        }
      } catch (err) {
        console.error(err);
        return await interaction.followUp(
          `[ndun923] Error while fetching Objective Types. Please try again later.`
        );
      }

      // check if user doesn't have more than 3 wrong entries in last 30 days
      try {
        const historyDataForWrongObjectives = new Date();
        historyDataForWrongObjectives.setDate(historyDataForWrongObjectives.getDate() - 30);

        const wrongCount = await Objectives.countDocuments({
          gid: interaction.guildId,
          user: interaction.user.id,
          wrong: true,
          time: { $gte: historyDataForWrongObjectives },
        });

        if (wrongCount >= 3) {
          return await interaction.followUp(
            `> ⛔***You've added 3 or more wrong Objectives in last 30 days.***\n> ⛔***You are not allowed to add new objectives now!***`
          );
        }
      } catch (err) {
        console.error(err);
        return await interaction.followUp(
          `[ndun923] Error while checking user. Please try again later.`
        );
      }

      let settings = {};

      try {
        const objectivesSettings = await ObjectivesSettings.find({
          gid: interaction.guildId,
        }).sort({ option: 1 });

        settings[SETTINGS_OPTIONS.manager_role.value] = [];

        await objectivesSettings.forEach((setting) => {
          if (setting.option == SETTINGS_OPTIONS.upcoming_objectives_channel.value) {
            settings[setting.option] = setting.value;
          } else if (setting.option == SETTINGS_OPTIONS.default_reminder_time.value) {
            settings[setting.option] = setting.value;
          } else if (setting.option == SETTINGS_OPTIONS.reminders_channel.value) {
            settings[setting.option] = setting.value;
          } else if (setting.option == SETTINGS_OPTIONS.manager_role.value) {
            settings[setting.option].push(setting.value);
          }
        });

        if (
          !objectivesSettings ||
          !objectivesSettings.length ||
          !settings[SETTINGS_OPTIONS.upcoming_objectives_channel.value]
        ) {
          return await interaction.followUp({
            content: `> *Objective feature is not configured yet.*\n> *Please configure it first to start using this feature.*`,
            ephemeral: true,
          });
        }
      } catch (err) {
        console.error(err);
        return await interaction.followUp(
          `[h45g4f] Error while fetching Objective Setting. Please try again later.`
        );
      }

      try {
        const isObjectiveExist = await Objectives.findOne({
          $and: [
            { gid: interaction.guild.id },
            { map_name: map_name },
            { objective: objective_type },
            {
              time: {
                $gte: objective_time_before,
                $lte: objective_time_after,
              },
            },
            { wrong: { $ne: true } },
          ],
        });

        if (isObjectiveExist) {
          return await interaction.followUp({
            content: `> *This Objective is already added by <@${isObjectiveExist.user}> here: https://discord.com/channels/${interaction.guild.id}/${isObjectiveExist.channel_id}/${isObjectiveExist.message_id}*`,
            ephemeral: true,
          });
        }
      } catch (err) {
        console.error(err);
        return await interaction.followUp(
          `[j98j9j] Error while checking if objective already exist. Please try again later.`
        );
      }

      try {
        const interactionUser = await interaction.guild.members.fetch(interaction.user.id, {
          cache: true,
          force: true,
        });

        const channelHandle = await interaction.client.channels.cache.get(
          settings[SETTINGS_OPTIONS.upcoming_objectives_channel.value]
        );

        if (!channelHandle) {
          // if channel doesn't exist, remove setting entry
          await ObjectivesSettings.findOneAndDelete({
            gid: interaction.guildId,
            option: SETTINGS_OPTIONS.upcoming_objectives_channel.value,
            value: settings[SETTINGS_OPTIONS.upcoming_objectives_channel.value],
          });

          // and post a message about that
          await interaction.followUp({
            content: `> *Unfortunately, channel prepared for upcoming objectives were removed.*\n> ***New objectives can't be added.***`,
            ephemeral: true,
          });
        }

        const newObjective = await new Objectives({
          gid: interaction.guildId,
          user: interactionUser.user.id,
          user_name: getDisplayName(interactionUser),
          map_name: map_name,
          objective: objective_type,
          channel_id: settings[SETTINGS_OPTIONS.upcoming_objectives_channel.value],
          message_id: "",
          additional_note: additional_note,
          time: objective_time,
          reminder: true,
        });

        await newObjective.save();

        // post a message

        let desc = ``;
        desc += `**Map:** ${map_name}\n`;
        desc += `**Time:** <t:${Math.round(objective_time.getTime() / 1000)}:R>\n`;
        desc += `**Reporter:** <@${interactionUser.user.id}> - ${getDisplayName(
          interactionUser
        )}\n`;
        desc += `**Taken:** 🟡 *no info*\n`;

        if (additional_note.length > 0) {
          desc += `**Note:** *${additional_note}*`;
        }

        const embedMessage = new EmbedBuilder()
          .setColor("#fff900")
          .setTitle(`${objective_type}`)
          .setDescription(desc);

        // check if this objective type have a thumbnail
        const objectiveType = await ObjectivesTypes.findOne({
          gid: interaction.guildId,
          name: objective_type,
        });

        if (objectiveType && objectiveType.thumbnail_url.length > 5) {
          embedMessage.setThumbnail(objectiveType.thumbnail_url);
        }

        const actionButtons = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("taken").setLabel("Taken").setStyle("Success"),
          new ButtonBuilder().setCustomId("not_taken").setLabel("Not taken").setStyle("Danger"),
          new ButtonBuilder().setCustomId("wrong").setLabel("⚠️ Wrong").setStyle("Secondary")
        );

        const messagePosted = await channelHandle.send({
          embeds: [embedMessage],
          components: [actionButtons],
        });

        newObjective.message_id = messagePosted.id;

        await newObjective.save();

        this.updateSummary(interaction, false);

        await interaction.followUp({
          content: `> *Objective added: https://discord.com/channels/${interaction.guild.id}/${channelHandle.id}/${messagePosted.id} *`,
          ephemeral: true,
        });
      } catch (err) {
        console.error(err);
        return await interaction.followUp(
          `[g45d2f] Error while checking if objective already exist. Please try again later.`
        );
      }
    } else if (interaction.options.getSubcommand() == "update") {
      const message_id = interaction.options.getString("message_id").trim();
      const unlock_in = interaction.options.getString("unlock_in").trim();

      await interaction.deferReply({ ephemeral: true });

      try {
        let manager_perms = false;

        if (interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
          manager_perms = true;
        }

        const interactionUser = await interaction.guild.members.fetch(interaction.user.id, {
          cache: true,
          force: true,
        });

        if (!manager_perms) {
          const managerRoles = await ObjectivesSettings.find({
            gid: interaction.guildId,
            option: SETTINGS_OPTIONS.manager_role.value,
          });

          await managerRoles.forEach((mgr) => {
            if (interactionUser.roles.cache.has(mgr.value)) {
              manager_perms = true;
            }
          });
        }

        if (!manager_perms) {
          return await interaction.reply({
            content: `> *You don't have permissions to update this Objective.*`,
            ephemeral: true,
          });
        }

        // check if time is correct
        let hours = 0;
        let minutes = 0;

        let timecheck = new RegExp(
          /^((([01]\d|2[0-3]|\d):)?([0-5]\d|[5-9])|([01]\d|2[0-3]|\d):\d)$/
        );

        if (timecheck.test(unlock_in) == true) {
          if (unlock_in.includes(":")) {
            [hours, minutes] = unlock_in.split(":");
          } else {
            minutes = unlock_in;
          }
        } else {
          return await interaction.followUp({
            content: `> *Plaese provide time for **Unlock in** in a valid format.*`,
            ephemeral: true,
          });
        }

        let objective_time = new Date();
        objective_time.setHours(objective_time.getHours() + parseInt(hours));
        objective_time.setMinutes(objective_time.getMinutes() + parseInt(minutes));

        const isObjectiveExist = await Objectives.findOne({
          $and: [
            { gid: interaction.guild.id },
            { message_id: message_id },
            { wrong: { $ne: true } },
          ],
        });

        if (!isObjectiveExist) {
          return await interaction.followUp({
            content: `> *This Objective doesn't exist*`,
            ephemeral: true,
          });
        }

        // check if objective is taken/not taken already or if time already passed
        if (isObjectiveExist.taken !== null || isObjectiveExist.time < new Date().getTime()) {
          return await interaction.followUp({
            content: `> *This Objective can't be edited anymore*`,
            ephemeral: true,
          });
        }

        await Objectives.updateOne({ _id: isObjectiveExist._id }, { time: objective_time });

        let desc = ``;
        desc += `**Map:** ${isObjectiveExist.map_name}\n`;
        desc += `**Time:** <t:${Math.round(objective_time.getTime() / 1000)}:R>\n`;
        desc += `**Reporter:** <@${isObjectiveExist.user}> - ${isObjectiveExist.user_name}\n`;
        desc += `**Taken:** 🟡 *no info*\n`;

        if (isObjectiveExist.additional_note.length > 0) {
          desc += `**Note:** *${isObjectiveExist.additional_note}*`;
        }

        const embedMessage = new EmbedBuilder()
          .setColor("#fff900")
          .setTitle(`${isObjectiveExist.objective}`)
          .setDescription(desc);

        // check if this objective type have a thumbnail
        const objectiveType = await ObjectivesTypes.findOne({
          gid: interaction.guildId,
          name: isObjectiveExist.objective,
        });

        if (objectiveType && objectiveType.thumbnail_url.length > 5) {
          embedMessage.setThumbnail(objectiveType.thumbnail_url);
        }

        const actionButtons = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("taken").setLabel("Taken").setStyle("Success"),
          new ButtonBuilder().setCustomId("not_taken").setLabel("Not taken").setStyle("Danger"),
          new ButtonBuilder().setCustomId("wrong").setLabel("⚠️ Wrong").setStyle("Secondary")
        );

        try {
          const oldPost = await interaction.client.channels.cache
            .get(isObjectiveExist.channel_id)
            .messages.fetch(isObjectiveExist.message_id);

          if (oldPost) {
            await oldPost.edit({
              embeds: [embedMessage],
              components: [actionButtons],
            });
          }
        } catch (err) {
          console.error(err);
        }

        this.updateSummary(interaction, false);

        await interaction.followUp({
          content: `> *Objective time updated - https://discord.com/channels/${interaction.guild.id}/${isObjectiveExist.channel_id}/${isObjectiveExist.message_id}*`,
          ephemeral: true,
        });
      } catch (err) {
        console.error(err);
        return await interaction.followUp(
          `[mi90vf3] Error while manually updating Objective. Please try again later.`
        );
      }
    } else if (interaction.options.getSubcommand() == "reload_summary") {
      await interaction.deferReply({ ephemeral: true });

      try {
        let manager_perms = false;

        if (interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
          manager_perms = true;
        }

        const interactionUser = await interaction.guild.members.fetch(interaction.user.id, {
          cache: true,
          force: true,
        });

        if (!manager_perms) {
          const managerRoles = await ObjectivesSettings.find({
            gid: interaction.guildId,
            option: SETTINGS_OPTIONS.manager_role.value,
          });

          await managerRoles.forEach((mgr) => {
            if (interactionUser.roles.cache.has(mgr.value)) {
              manager_perms = true;
            }
          });
        }

        if (!manager_perms) {
          return await interaction.reply({
            content: `> *You don't have permissions to change status of this Objective.*`,
            ephemeral: true,
          });
        }

        this.updateSummary(interaction, false);

        await interaction.followUp({ content: `> *Objective Summary reloaded.*`, ephemeral: true });
      } catch (err) {
        console.error(err);
        return await interaction.followUp(
          `[h45k8] Error while manually updating Objective summary. Please try again later.`
        );
      }
    } else if (interaction.options.getSubcommand() == "stats") {
      // statystyki usera
      const user = interaction.options.getUser("user") ?? null;

      const userId = user ? user.id : interaction.user.id;

      const statsUser = await interaction.guild.members.fetch(userId, { force: true });

      if (!statsUser) {
        return await interaction.reply({ content: `> *Can't find this user.*`, ephemeral: true });
      }

      try {
        const generalStats = await Objectives.aggregate([
          { $match: { user: statsUser.user.id, gid: interaction.guildId } },
          {
            $group: {
              _id: null,
              totalObjectives: { $sum: 1 }, // łączna liczba objective
              takenTrue: { $sum: { $cond: [{ $eq: ["$taken", true] }, 1, 0] } }, // ile taken = true
              takenFalse: { $sum: { $cond: [{ $eq: ["$taken", false] }, 1, 0] } }, // ile taken = false
              takenNull: { $sum: { $cond: [{ $eq: ["$taken", null] }, 1, 0] } }, // ile taken = null
              wrongCount: { $sum: { $cond: [{ $eq: ["$wrong", true] }, 1, 0] } }, // ile wrong = true
            },
          },
        ]);

        const detailedStats = await Objectives.aggregate([
          { $match: { user: statsUser.user.id, gid: interaction.guildId } },
          {
            $group: {
              _id: "$objective", // grupowanie według rodzaju `objective`
              totalObjectives: { $sum: 1 }, // łączna liczba objective dla danego typu
              takenTrue: { $sum: { $cond: [{ $eq: ["$taken", true] }, 1, 0] } }, // ile taken = true
              takenFalse: { $sum: { $cond: [{ $eq: ["$taken", false] }, 1, 0] } }, // ile taken = false
              takenNull: { $sum: { $cond: [{ $eq: ["$taken", null] }, 1, 0] } }, // ile taken = null
              wrongCount: { $sum: { $cond: [{ $eq: ["$wrong", true] }, 1, 0] } }, // ile wrong = true
            },
          },
        ]);

        const embedMessage = new EmbedBuilder()
          .setColor("#c4a10f")
          .setTitle(`${getDisplayName(statsUser)}'s Objective stats`);

        if (!generalStats || !generalStats.length) {
          embedMessage.setDescription(`> *No stats for this user.*`);
          return await interaction.reply({ embeds: [embedMessage], ephemeral: true });
        }

        let generalStatsText = ``;
        generalStatsText += `## **General Stats**\n`;
        generalStatsText += `> 🔄️ **Count:** ${generalStats[0].totalObjectives}\n`;
        generalStatsText += `> 🟡 **No info:** ${generalStats[0].takenNull}\n`;
        generalStatsText += `> 🟢 **Taken:** ${generalStats[0].takenTrue}\n`;
        generalStatsText += `> 🔴 **Not taken:** ${generalStats[0].takenFalse}\n`;
        generalStatsText += `> ⚠️ **Wrong:** ${generalStats[0].wrongCount}\n`;
        generalStatsText += `## **Detailed Stats**\n`;

        detailedStats.forEach((stat) => {
          let detailedStatsText = ``;
          detailedStatsText += `> 🔄️ **Count:** ${stat.totalObjectives}\n`;
          detailedStatsText += `> 🟡 **No info:** ${stat.takenNull}\n`;
          detailedStatsText += `> 🟢 **Taken:** ${stat.takenTrue}\n`;
          detailedStatsText += `> 🔴 **Not taken:** ${stat.takenFalse}\n`;
          detailedStatsText += `> ⚠️ **Wrong:** ${stat.wrongCount}\n`;

          embedMessage.addFields({
            name: `**${stat._id}**`,
            value: detailedStatsText,
            inline: true,
          });
        });

        embedMessage.setDescription(generalStatsText);

        await interaction.reply({ embeds: [embedMessage], ephemeral: true });
      } catch (err) {
        console.error(err);
        return await interaction.reply(
          `[mi90vf3] Error while manually updating Objective. Please try again later.`
        );
      }
    } else if (interaction.options.getSubcommand() == "top_stats") {
      // top X statystyk z ostatnich X dni
    }
  },
  async autoload(client) {
    client.on("interactionCreate", async (interaction) => {
      if (!interaction.isButton()) return;

      const clickedButton = interaction.customId;
      let manager_perms = false;

      try {
        if (interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
          manager_perms = true;
        }

        const interactionUser = await interaction.guild.members.fetch(interaction.user.id, {
          cache: true,
          force: true,
        });

        if (!manager_perms) {
          const managerRoles = await ObjectivesSettings.find({
            gid: interaction.guildId,
            option: SETTINGS_OPTIONS.manager_role.value,
          });

          await managerRoles.forEach((mgr) => {
            if (interactionUser.roles.cache.has(mgr.value)) {
              manager_perms = true;
            }
          });
        }

        if (!manager_perms) {
          return await interaction.reply({
            content: `> *You don't have permissions to change status of this Objective.*`,
            ephemeral: true,
          });
        }

        // if (clickedButton === "refresh_summary") {
        //   return this.updateSummary(interaction, true);
        // }

        const entryDB = await Objectives.findOne({
          gid: interaction.guildId,
          message_id: interaction.message.id,
          channel_id: interaction.channelId,
          wrong: { $ne: true },
        });

        if (!entryDB) {
          return await interaction.reply({
            content: `> Entry doesn't exist in database.`,
            ephemeral: true,
          });
        }

        if (entryDB.time.getTime() > new Date().getTime() && clickedButton !== "wrong") {
          return await interaction.reply({
            content: `> *You can't change status of the objective before objectime timer.*`,
            ephemeral: true,
          });
        }

        if (clickedButton === "taken") {
          await Objectives.updateOne(
            { _id: entryDB._id },
            {
              taken: true,
              taken_user: interaction.user.id,
              taken_user_name: getDisplayName(interactionUser),
            }
          );

          let desc = ``;
          desc += `**Map:** ${entryDB.map_name}\n`;
          desc += `**Time:** <t:${Math.round(entryDB.time.getTime() / 1000)}:R> <t:${Math.round(
            entryDB.time.getTime() / 1000
          )}:t>\n`;
          desc += `**Reporter:** <@${entryDB.user}> - ${entryDB.user_name}\n`;
          desc += `**Taken:** 🟢 *taken*\n`;
          desc += `**Status changed by:** <@${interaction.user.id}> - ${getDisplayName(
            interactionUser
          )}\n`;

          if (entryDB.additional_note.length > 0) {
            desc += `**Note:** *${additional_note}*`;
          }

          const embedMessage = new EmbedBuilder()
            .setColor("#20ff00")
            .setTitle(`${entryDB.objective}`)
            .setDescription(desc);

          // check if this objective type have a thumbnail
          const objectiveType = await ObjectivesTypes.findOne({
            gid: interaction.guildId,
            name: entryDB.objective,
          });

          if (objectiveType && objectiveType.thumbnail_url.length > 5) {
            embedMessage.setThumbnail(objectiveType.thumbnail_url);
          }

          await interaction.update({ embeds: [embedMessage], components: [] });
          this.updateSummary(interaction, true);
        } else if (clickedButton === "not_taken") {
          await Objectives.updateOne(
            { _id: entryDB._id },
            {
              taken: false,
              taken_user: interaction.user.id,
              taken_user_name: getDisplayName(interactionUser),
            }
          );

          let desc = ``;
          desc += `**Map:** ${entryDB.map_name}\n`;
          desc += `**Time:** <t:${Math.round(entryDB.time.getTime() / 1000)}:R> <t:${Math.round(
            entryDB.time.getTime() / 1000
          )}:t>\n`;
          desc += `**Reporter:** <@${entryDB.user}> - ${entryDB.user_name}\n`;
          desc += `**Taken:** 🔴 *not taken*\n`;
          desc += `**Status changed by:** <@${interaction.user.id}> - ${getDisplayName(
            interactionUser
          )}\n`;

          if (entryDB.additional_note.length > 0) {
            desc += `**Note:** *${additional_note}*`;
          }

          const embedMessage = new EmbedBuilder()
            .setColor("#e91a1d")
            .setTitle(`${entryDB.objective}`)
            .setDescription(desc);

          // check if this objective type have a thumbnail
          const objectiveType = await ObjectivesTypes.findOne({
            gid: interaction.guildId,
            name: entryDB.objective,
          });

          if (objectiveType && objectiveType.thumbnail_url.length > 5) {
            embedMessage.setThumbnail(objectiveType.thumbnail_url);
          }

          await interaction.update({ embeds: [embedMessage], components: [] });
          this.updateSummary(interaction, true);
        } else if (clickedButton === "wrong") {
          await Objectives.updateOne(
            { _id: entryDB._id },
            {
              wrong: true,
            }
          );

          let desc = ``;
          desc += `**Reporter:** <@${entryDB.user}> - ${entryDB.user_name}\n`;
          desc += `**Wrong:** *true*\n`;
          desc += `**Status changed by:** <@${interaction.user.id}> - ${getDisplayName(
            interactionUser
          )}\n`;

          const embedMessage = new EmbedBuilder()
            .setColor("#e91a1d")
            .setTitle(`Wrong!`)
            .setDescription(desc);

          await interaction.update({ embeds: [embedMessage], components: [] });
          this.updateSummary(interaction, true);
        }
      } catch (err) {
        console.error(err);
        return await interaction.reply({
          content: `[f734g] Error while checking perms. Please try again later.`,
          ephemeral: true,
        });
      }
    });
  },
  async updateSummary(interaction, auto) {
    try {
      const objectivesSettings = await ObjectivesSettings.findOne({
        gid: interaction.guildId,
        option: SETTINGS_OPTIONS.upcoming_objectives_channel.value,
      }).sort({ option: 1 });

      if (!objectivesSettings || !objectivesSettings.value.length) {
        if (auto === false) {
          return await interaction.followUp({
            content: `> *Objective feature is not configured yet.*\n> *Please configure it first to start using this feature.*`,
            ephemeral: true,
          });
        }
        return;
      }

      const channelHandle = await interaction.guild.channels.cache.get(objectivesSettings.value);

      if (!channelHandle) {
        // if channel doesn't exist, remove setting entry
        await ObjectivesSettings.findOneAndDelete({
          gid: interaction.guildId,
          option: SETTINGS_OPTIONS.upcoming_objectives_channel.value,
          value: objectivesSettings.value,
        });

        if (auto === false) {
          // and post a message about that
          return await interaction.followUp({
            content: `> *Unfortunately, channel prepared for upcoming objectives were removed.*\n> ***New objectives can't be added.***`,
            ephemeral: true,
          });
        }
        return;
      }

      let summaryTimeBefore = new Date();
      summaryTimeBefore.setMinutes(summaryTimeBefore.getMinutes() - 30);

      const objectivesSummaryDB = await Objectives.find({
        $and: [
          { gid: interaction.guild.id },
          {
            time: {
              $gte: summaryTimeBefore,
            },
          },
          { wrong: { $ne: true } },
        ],
      }).sort({ time: 1 });

      let summary = ``;

      if (objectivesSummaryDB && objectivesSummaryDB.length) {
        objectivesSummaryDB.forEach(async (obj) => {
          if (summary.length > 0) {
            summary += `\n`;
          }

          if (obj.taken === null) summary += `🟡 `;
          if (obj.taken === false) summary += `🔴 `;
          if (obj.taken === true) summary += `🟢 `;

          summary += `**[${obj.objective}](https://discord.com/channels/${interaction.guild.id}/${obj.channel_id}/${obj.message_id})**`;
          summary += ` - ${obj.map_name} - <t:${Math.round(
            obj.time.getTime() / 1000
          )}:R> <t:${Math.round(obj.time.getTime() / 1000)}:t>`;

          if (obj.additional_note.length > 0) {
            summary += ` - *${obj.additional_note}*`;
          }
        });
      }

      if (summary.length < 5) {
        summary = `*No objectives... Go and find something...*`;
      }

      // delete old summary post if exist
      const oldSummaryPostDB = await ObjectivesSettings.findOne({
        gid: interaction.guildId,
        option: SETTINGS_OPTIONS.last_summary_post.value,
      });

      if (oldSummaryPostDB && oldSummaryPostDB.value.length > 0) {
        const [channelId, postId] = oldSummaryPostDB.value.split(",");

        try {
          const summaryPost = await interaction.client.channels.cache
            .get(channelId)
            .messages.fetch(postId);

          if (summaryPost) {
            summaryPost.delete();
          }
        } catch (_) {}
      }

      // create new summary post
      const embedMessageSummary = new EmbedBuilder()
        .setColor("#ff00f9")
        .setTitle(`Objectives Summary`)
        .setDescription(summary)
        .setFooter({ text: `Last update: ${new Date().toLocaleString()}` });

      // const actionButtons = new ActionRowBuilder().addComponents(
      //   new ButtonBuilder().setCustomId("refresh_summary").setLabel("Refresh").setStyle("Primary")
      // );

      const summaryPost = await channelHandle.send({
        embeds: [embedMessageSummary],
        // components: [actionButtons],
      });

      await ObjectivesSettings.updateOne(
        { gid: interaction.guildId, option: SETTINGS_OPTIONS.last_summary_post.value },
        { value: `${channelHandle.id},${summaryPost.id}` },
        { upsert: true, new: true }
      );
    } catch (err) {
      console.error(err);
      return await interaction.followUp({
        content: `[g3f2ds] Error while updating Objectives summary. Please try again later.`,
        ephemeral: true,
      });
    }
  },
};
