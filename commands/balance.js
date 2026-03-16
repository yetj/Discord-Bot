const {
  SlashCommandBuilder,
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  RoleSelectMenuBuilder,
  ChannelSelectMenuBuilder,
  StringSelectMenuBuilder,
  ButtonStyle,
} = require("discord.js");
const { BalanceSettings, Balance, BalanceLogs } = require("../dbmodels/balance");
const { CTAEvents } = require("../dbmodels/cta");
const getDisplayName = require("../utils/getDisplayName");
const extractUniqueMembers = require("../utils/extractUniqueMembers");
const formattedDate = require("../utils/formattedDate");

const Balance_Setup = {
  data: new SlashCommandBuilder()
    .setName("setup_balance")
    .setDescription("Configure balance module")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("manager_roles")
        .setDescription(
          "Set Manager role, that can manage balance bot and have access to all commands",
        )
        .addRoleOption((option) => option.setName("role").setDescription("Role").setRequired(true))
        .addBooleanOption((option) =>
          option
            .setName("remove_instead")
            .setDescription("Do you want to remove that role? (default: no)"),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("payout_roles")
        .setDescription("Set Payoout role, that can do payouts to members")
        .addRoleOption((option) => option.setName("role").setDescription("Role").setRequired(true))
        .addBooleanOption((option) =>
          option
            .setName("remove_instead")
            .setDescription("Do you want to remove that role? (default: no)"),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("enabled")
        .setDescription("Is balance system enabled? If not, all commands will be disabled.")
        .addBooleanOption((option) =>
          option
            .setName("enabled")
            .setDescription("Enable or disable balance system (default: false)")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("log_channel")
        .setDescription("Set channel for balance logs")
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("Channel")
            .addChannelTypes(
              ChannelType.GuildText,
              ChannelType.GuildForum,
              ChannelType.PrivateThread,
              ChannelType.PublicThread,
            )
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("allow_transfers")
        .setDescription("Is balance system enabled? If not, all commands will be disabled.")
        .addBooleanOption((option) =>
          option
            .setName("allow_transfers")
            .setDescription("Enable or disable transfers between users (default: false)")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("interactive")
        .setDescription(
          "Bot will ask you for all the settings. It will overwrite the current settings if they exist.",
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("show").setDescription("Show config for this server"),
    ),
  async execute(interaction) {
    let configBalance;
    let manager_perms = false;
    try {
      configBalance = await BalanceSettings.findOne({
        gid: interaction.guildId,
      });

      if (interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
        manager_perms = true;
      }

      if (!configBalance && !manager_perms) {
        return await interaction.reply(`> You don't have permissions to execute this command.`);
      }

      if (configBalance && manager_perms == false) {
        const interactionUser = await interaction.guild.members.fetch(interaction.user.id, {
          cache: true,
          force: true,
        });

        await configBalance.manager_roles.forEach((mgr) => {
          if (interactionUser.roles.cache.has(mgr.value)) {
            manager_perms = true;
          }
        });

        if (!manager_perms) {
          return await interaction.reply(`> You don't have permissions to execute this command.`);
        }
      }
    } catch (err) {
      console.error(err);
      return await interaction.reply(
        `> [3435d5] Error while checking perms. Please try again later.`,
      );
    }

    if (interaction.options.getSubcommand() === "manager_roles") {
      const role = interaction.options.getRole("role");
      const remove_instead = interaction.options.getBoolean("remove_instead") ?? false;

      try {
        if (!configBalance && remove_instead) {
          return await interaction.reply(`> Manager roles is not set yet. Nothing to remove.`);
        }

        let action = "";

        if (!configBalance) {
          const newConfig = await new BalanceSettings({
            gid: interaction.guildId,
            manager_roles: [role.id],
          });
          await newConfig.save();
        } else {
          if (remove_instead) {
            action = "removed";
            if (configBalance.manager_roles.indexOf(role.id) === -1) {
              return await interaction.reply(`> Role **${role.name}** doesn't have manager perms.`);
            }

            configBalance.manager_roles = configBalance.manager_roles.filter(
              (id) => id !== role.id,
            );

            await configBalance.save();
          } else {
            action = "added";
            if (configBalance.manager_roles.indexOf(role.id) !== -1) {
              return await interaction.reply(`> Role **${role.name}** has manager perms already.`);
            }

            configBalance.manager_roles.push(role.id);
            await configBalance.save();
          }
        }

        return await interaction.reply(`> Manager Role **${role.name}** has been **${action}**.`);
      } catch (err) {
        console.error(err);
        return await interaction.reply(
          `> [873b96] Error while modifying manager role. Please try again later.`,
        );
      }
    } else if (interaction.options.getSubcommand() === "payout_roles") {
      const role = interaction.options.getRole("role");
      const remove_instead = interaction.options.getBoolean("remove_instead") ?? false;

      try {
        if (!configBalance && remove_instead) {
          return await interaction.reply(`> Payout roles is not set yet. Nothing to remove.`);
        }

        let action = "";

        if (!configBalance) {
          const newConfig = await new BalanceSettings({
            gid: interaction.guildId,
            payout_roles: [role.id],
          });
          await newConfig.save();
        } else {
          if (remove_instead) {
            action = "removed";
            if (configBalance.payout_roles.indexOf(role.id) === -1) {
              return await interaction.reply(`> Role **${role.name}** doesn't have payout perms.`);
            }

            configBalance.payout_roles = configBalance.payout_roles.filter((id) => id !== role.id);

            await configBalance.save();
          } else {
            action = "added";
            if (configBalance.payout_roles.indexOf(role.id) !== -1) {
              return await interaction.reply(`> Role **${role.name}** has payout perms already.`);
            }

            configBalance.payout_roles.push(role.id);
            await configBalance.save();
          }
        }

        return await interaction.reply(`> Payout role **${role.name}** has been **${action}**.`);
      } catch (err) {
        console.error(err);
        return await interaction.reply(
          `> [873b96] Error while modifying payout role. Please try again later.`,
        );
      }
    } else if (interaction.options.getSubcommand() === "enabled") {
      const enabled = interaction.options.getBoolean("enabled") ?? false;

      try {
        await BalanceSettings.updateOne(
          { gid: interaction.guildId },
          { enabled: enabled },
          { upsert: true, new: true },
        );

        await interaction.reply({
          content: `> Balance feature has been **${enabled ? "enabled" : "disabled"}**.`,
        });
      } catch (err) {
        console.error(err);
        return await interaction.reply(
          `> [17bcd3] Error while turning on/off balance feature. Please try again later.`,
        );
      }
    } else if (interaction.options.getSubcommand() === "log_channel") {
      const channel = interaction.options.getChannel("channel");

      try {
        await BalanceSettings.updateOne(
          { gid: interaction.guildId },
          { log_channel: channel.id },
          { upsert: true, new: true },
        );

        await interaction.reply({
          content: `> Balance logs channel updated to <#${channel.id}>.`,
        });
      } catch (err) {
        console.error(err);
        return await interaction.reply(
          `> [6332c5] Error while updating balance logs channel. Please try again later.`,
        );
      }
    } else if (interaction.options.getSubcommand() === "allow_transfers") {
      const enabled = interaction.options.getBoolean("allow_transfers") ?? false;

      try {
        await BalanceSettings.updateOne(
          { gid: interaction.guildId },
          { allow_transfers: enabled },
          { upsert: true, new: true },
        );

        await interaction.reply({
          content: `> Transfering balance between users has been **${
            enabled ? "enabled" : "disabled"
          }**.`,
        });
      } catch (err) {
        console.error(err);
        return await interaction.reply(
          `> [783f22] Error while turning on/off transferring feature. Please try again later.`,
        );
      }
    } else if (interaction.options.getSubcommand() === "interactive") {
      const user = interaction.user;
      const channel = interaction.channel;

      const questions = [
        {
          id: "manager_roles",
          title: "Manager Roles",
          description: "Roles that will have full access to all Balance module",
          type: "role",
        },
        {
          id: "payout_roles",
          title: "Payout Roles",
          description: "Roles that can do payouts to members.",
          type: "role",
        },
        {
          id: "log_channel",
          title: "Log Channel",
          description: "Channel where you will be able to see all logs.",
          type: "channel",
          limit: 1,
        },
        {
          id: "allow_transfers",
          title: "Allow Transfers",
          description:
            "Should users be allowed to transfer their balance to other members? (default: No)",
          type: "select",
          options: [
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ],
        },
      ];

      let answers = {};
      let currentQuestion = 0;

      const cancelButton = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("balance_cancel")
          .setLabel("Cancel configuration")
          .setStyle(ButtonStyle.Danger),
      );

      await interaction.reply({
        content: "> *Starting interactive Balance module setup.*",
      });

      const askQuestion = async () => {
        if (currentQuestion >= questions.length) {
          try {
            await BalanceSettings.updateOne(
              { gid: interaction.guildId },
              {
                manager_roles: answers["manager_roles"] ?? [],
                payout_roles: answers["payout_roles"] ?? [],
                allow_transfers: answers["allow_transfers"] === "true" ? true : false,
                log_channel: answers["log_channel"] ? answers["log_channel"][0] : "",
                enabled: true,
              },
              { upsert: true, new: true },
            );
          } catch (err) {
            console.error(err);
            return await interaction.followUp({
              content: `> [5498fd] Error while saving interactive Balance setup. Please try again later.`,
              ephemeral: true,
            });
          }

          let message = `> Configuration finished. To see the summary execute command:\n\`/setup_balance show\``;

          const embedMessage = new EmbedBuilder()
            .setColor(`#00DB19`)
            .setTitle(`Balance configuration finished`)
            .setDescription(message);

          await interaction.followUp({ embeds: [embedMessage] });
          return;
        }

        const question = questions[currentQuestion];

        if (question.type === "role") {
          const row = new ActionRowBuilder().addComponents(
            new RoleSelectMenuBuilder()
              .setCustomId("balance_select_role")
              .setPlaceholder(question.title)
              .setMaxValues(question.limit ?? 25),
          );

          const embedMessage = new EmbedBuilder()
            .setColor(`#0000DB`)
            .setTitle(question.title)
            .setDescription(question.description);

          const msg = await channel.send({
            embeds: [embedMessage],
            components: [row, cancelButton],
          });

          const collector = msg.createMessageComponentCollector({ time: 120000 });

          collector.on("collect", async (i) => {
            if (
              i.customId == "balance_select_role" &&
              i.user.id === user.id &&
              i.values?.length > 0
            ) {
              answers[question.id] = i.values;
              embedMessage.setDescription(`Selected role(s): <@&${i.values.join("> <@&")}>`);
              await i.update({
                embeds: [embedMessage],
                components: [],
              });
              currentQuestion++;
              collector.stop();
              await askQuestion();
            } else if (i.customId === "balance_cancel" && i.user.id === user.id) {
              embedMessage.setDescription("Configuration canceled.");
              embedMessage.setColor(`#DB0019`);
              await i.update({ embeds: [embedMessage], components: [] });
              collector.stop();
            }
          });
        } else if (question.type === "channel") {
          const row = new ActionRowBuilder().addComponents(
            new ChannelSelectMenuBuilder()
              .setCustomId("balance_select_channel")
              .setPlaceholder("Select channel")
              .setMaxValues(question.limit ?? 25),
          );

          const embedMessage = new EmbedBuilder()
            .setColor(`#0000DB`)
            .setTitle(question.title)
            .setDescription(question.description);

          const msg = await channel.send({
            embeds: [embedMessage],
            components: [row, cancelButton],
          });

          const collector = msg.createMessageComponentCollector({ time: 120000 });

          collector.on("collect", async (i) => {
            if (
              i.customId == "balance_select_channel" &&
              i.user.id === user.id &&
              i.values?.length > 0
            ) {
              answers[question.id] = i.values;
              embedMessage.setDescription(`Selected channel(s): <#${i.values.join("> <#")}>`);
              await i.update({
                embeds: [embedMessage],
                components: [],
              });
              currentQuestion++;
              collector.stop();
              await askQuestion();
            } else if (i.customId === "balance_cancel" && i.user.id === user.id) {
              embedMessage.setColor(`#DB0019`);
              embedMessage.setDescription("Configuration canceled.");
              await i.update({ embeds: [embedMessage], components: [] });
              collector.stop();
            }
          });
        } else if (question.type === "select") {
          const row = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
              .setCustomId("balance_select")
              .setPlaceholder(question.title)
              .addOptions(question.options),
          );

          const embedMessage = new EmbedBuilder()
            .setColor(`#0000DB`)
            .setTitle(question.title)
            .setDescription(question.description);

          const msg = await channel.send({
            embeds: [embedMessage],
            components: [row, cancelButton],
          });

          const collector = msg.createMessageComponentCollector({ time: 120000 });

          collector.on("collect", async (i) => {
            if (i.customId == "balance_select" && i.user.id === user.id && i.values.length > 0) {
              const selectedOption = question.options.find((opt) => opt.value === i.values[0]);
              answers[question.id] = selectedOption.value;

              embedMessage.setDescription(`Selected option: ${selectedOption.label}`);

              await i.update({ embeds: [embedMessage], components: [] });
              currentQuestion++;
              collector.stop();
              await askQuestion();
            } else if (i.customId === "balance_cancel" && i.user.id === user.id) {
              embedMessage.setColor(`#DB0019`);
              embedMessage.setDescription("Configuration canceled.");
              await i.update({ embeds: [embedMessage], components: [] });
              collector.stop();
            }
          });
        }
      };

      await askQuestion();
    } else if (interaction.options.getSubcommand() === "show") {
      try {
        if (!configBalance) {
          return await interaction.reply({ content: `> There is no config to show.` });
        }

        let message = "";

        message += `### Balance feature:\n`;
        if (configBalance.enabled) {
          message += `✅ *enabled*\n`;
        } else {
          message += `❌ *disabled*\n`;
        }

        message += `### Manager roles:\n`;
        if (configBalance.manager_roles.length > 0) {
          configBalance.manager_roles.forEach((id) => {
            message += `<@&${id}> - \`${id}\`\n`;
          });
        } else {
          message += `*not set*\n`;
        }

        message += `### Payout roles:\n`;
        if (configBalance.payout_roles.length > 0) {
          configBalance.payout_roles.forEach((id) => {
            message += `<@&${id}> - \`${id}\`\n`;
          });
        } else {
          message += `*not set*\n`;
        }

        message += `### Balance transfers:\n`;
        if (configBalance.allow_transfers) {
          message += `✅ *enabled*\n`;
        } else {
          message += `❌ *disabled*\n`;
        }

        message += `### Log Channel:\n`;
        if (configBalance.log_channel.length > 0) {
          message += `<#${configBalance.log_channel}> - \`${configBalance.log_channel}\`\n`;
        } else {
          message += `*not set*\n`;
        }

        const embedMessage = new EmbedBuilder()
          .setColor("#ff99ff")
          .setTitle(`Balance Settings`)
          .setDescription(message);

        await interaction.reply({ embeds: [embedMessage] });
      } catch (err) {
        console.error(err);
        return await interaction.reply(
          `> [8f63c1] Error while displaying Balance config. Please try again later.`,
        );
      }
    }
  },
};

const Balance_Command = {
  data: new SlashCommandBuilder()
    .setName("balance")
    .setDescription("Balance system")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Add balance to the user.")
        .addUserOption((option) =>
          option.setName("user").setDescription("User to add balance to").setRequired(true),
        )
        .addIntegerOption((option) =>
          option.setName("amount").setDescription("Amount to add").setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add_many")
        .setDescription("Add balance to the mentioned users.")
        .addStringOption((option) =>
          option.setName("users").setDescription("Users to add balance to").setRequired(true),
        )
        .addIntegerOption((option) =>
          option.setName("amount").setDescription("Amount to add").setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove")
        .setDescription("Remove balance from the user.")
        .addUserOption((option) =>
          option.setName("user").setDescription("User to remove balance from").setRequired(true),
        )
        .addIntegerOption((option) =>
          option.setName("amount").setDescription("Amount to remove").setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove_many")
        .setDescription("Remove balance from the mentioned users.")
        .addStringOption((option) =>
          option.setName("users").setDescription("Users to remove balance from").setRequired(true),
        )
        .addIntegerOption((option) =>
          option.setName("amount").setDescription("Amount to remove").setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("check")
        .setDescription("Check balance.")
        .addUserOption((option) =>
          option.setName("user").setDescription("User to check balance for"),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("give")
        .setDescription("Give balance to the mentioned user.")
        .addUserOption((option) =>
          option.setName("user").setDescription("User to give balance to").setRequired(true),
        )
        .addIntegerOption((option) =>
          option.setName("amount").setDescription("Amount to transfer").setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("transfer")
        .setDescription("Transfer balance to the mentioned user.")
        .addUserOption((option) =>
          option.setName("user").setDescription("User to transfer balance to").setRequired(true),
        )
        .addIntegerOption((option) =>
          option.setName("amount").setDescription("Amount to transfer").setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("payout")
        .setDescription("Payout balance to the mentioned user.")
        .addUserOption((option) =>
          option.setName("user").setDescription("User to payout balance to").setRequired(true),
        )
        .addIntegerOption((option) => option.setName("amount").setDescription("Amount to payout")),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("ranking").setDescription("Check the balance ranking."),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("stats")
        .setDescription("Check total amount of balance waiting to be paid out."),
    )
    // .addSubcommand((subcommand) =>
    //   subcommand
    //     .setName("cta")
    //     .setDescription("Add or remove balance from the present CTA event users.")
    //     .addStringOption((option) =>
    //       option.setName("cta_id").setDescription("CTA event ID").setRequired(true)
    //     )
    //     .addIntegerOption((option) =>
    //       option.setName("amount").setDescription("Amount to remove").setRequired(true)
    //     )
    //     .addBooleanOption((option) =>
    //       option
    //         .setName("remove_instead")
    //         .setDescription("Instead remove balance from CTA event users?")
    //     )
    // )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("logs")
        .setDescription("View balance change logs.")
        .addUserOption((option) =>
          option.setName("user").setDescription("User to view logs for").setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("type")
            .setDescription("Log type to filter by")
            .addChoices(
              { name: "All", value: "all" },
              { name: "Add", value: "add" },
              { name: "Remove", value: "remove" },
              { name: "Transfer", value: "transfer" },
              { name: "Payout", value: "payout" },
            ),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("file")
        .setDescription("Generate a file with balance information.")
        .addStringOption((option) =>
          option
            .setName("type")
            .setDescription("Select type of file to generate (default: txt)")
            .addChoices(
              { name: "txt", value: "txt" },
              { name: "html", value: "html" },
              { name: "csv", value: "csv" },
            ),
        )
        .addBooleanOption((option) =>
          option
            .setName("above_zero")
            .setDescription("Show only users with balance above 0? (default: yes)"),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("import").setDescription("Import balance information from a file."),
    ),
  async execute(interaction) {
    let payout_perms = false;
    let manager_perms = false;
    let configBalance;

    if (interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
      payout_perms = true;
      manager_perms = true;
    }

    try {
      configBalance = await BalanceSettings.findOne({
        gid: interaction.guildId,
      });

      if (!configBalance || configBalance.enabled == false) {
        return await interaction.reply({
          content: `> Balance feature is **disabled**.`,
          ephemeral: true,
        });
      }

      const interactionUser = await interaction.guild.members.fetch(interaction.user.id, {
        cache: true,
        force: true,
      });

      if (!manager_perms) {
        configBalance.manager_roles.forEach((role) => {
          if (interactionUser.roles.cache.has(role)) {
            manager_perms = true;
            payout_perms = true;
          }
        });
      }

      if (!payout_perms) {
        configBalance.payout_roles.forEach((role) => {
          if (interactionUser.roles.cache.has(role)) {
            payout_perms = true;
          }
        });
      }
    } catch (err) {
      console.error(err);
      return await interaction.reply({
        content: `> [e21281] Error while checking perms. Please try again later.`,
        ephemeral: true,
      });
    }

    if (
      [
        "add",
        "add_many",
        "remove",
        "remove_many",
        "payout",
        "stats",
        "cta",
        "logs",
        "file",
      ].indexOf(interaction.options.getSubcommand()) !== -1 &&
      payout_perms === false
    ) {
      return await interaction.reply({
        content: `> You don't have permission to use this command.`,
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    // public commands
    if (interaction.options.getSubcommand() === "check") {
      try {
        const user = interaction.options.getUser("user") ?? interaction.user;

        const interactionUser = await interaction.guild.members.fetch(user.id, {
          force: true,
        });

        const balance = await Balance.findOne({
          gid: interaction.guildId,
          user_id: interactionUser.user.id,
        });

        let balanceAmout = 0;

        if (balance) {
          balanceAmout = balance.balance;
        }

        const embedMessage = new EmbedBuilder()
          .setColor("#00DB19")
          .setTitle(`Balance for: ${getDisplayName(interactionUser)}`)
          .setDescription(`**Balance:** 💲**${balanceAmout}**`);

        return await interaction.followUp({ embeds: [embedMessage] });
      } catch (err) {
        console.error(err);
        return await interaction.followUp({
          content: `> [97b104] Error while checking balance. Please try again later.`,
          ephemeral: true,
        });
      }
    } else if (
      interaction.options.getSubcommand() === "give" ||
      interaction.options.getSubcommand() === "transfer"
    ) {
      const user = interaction.options.getUser("user");
      const amount = interaction.options.getInteger("amount");

      if (amount <= 0) {
        return await interaction.followUp({
          content: `> ❌ Amount must be greater than 0.`,
          ephemeral: true,
        });
      }

      const interactionUser = await interaction.guild.members.fetch(interaction.user.id, {
        force: true,
      });

      const receiverUser = await interaction.guild.members.fetch(user.id, {
        cache: true,
      });

      if (interaction.user.id === user.id) {
        return await interaction.followUp({
          content: `> ❌ You can't transfer balance to yourself.`,
          ephemeral: true,
        });
      }

      if (!interactionUser) {
        return await interaction.followUp({
          content: `> ❌ [505852] Something wen't wrong try again later.`,
          ephemeral: true,
        });
      }

      if (!receiverUser) {
        return await interaction.followUp({
          content: `> ❌ Receiver not found.`,
          ephemeral: true,
        });
      }

      try {
        let balanceOrigin = await Balance.findOne({
          gid: interaction.guildId,
          user_id: interaction.user.id,
        });

        if (!balanceOrigin) {
          await interaction.followUp({
            content: `> ❌ You don't have any balance to transfer.`,
            ephemeral: true,
          });
        }

        if (balanceOrigin.balance < amount) {
          return await interaction.followUp({
            content: `> ❌ You don't have enough balance to transfer. You have 💲**${balanceOrigin.balance}**.`,
            ephemeral: true,
          });
        }

        if (amount < 100000) {
          return await interaction.followUp({
            content: `> ❌ You can't transfer less than 💲**100,000**.`,
            ephemeral: true,
          });
        }

        let balanceTarget = await Balance.findOne({
          gid: interaction.guildId,
          user_id: receiverUser.user.id,
        });

        if (!balanceTarget) {
          balanceTarget = new Balance({
            gid: interaction.guildId,
            user_id: receiverUser.user.id,
            user_name: getDisplayName(receiverUser),
          });
        }

        balanceOrigin.balance -= amount;
        await balanceOrigin.save();

        balanceTarget.balance += amount;
        await balanceTarget.save();

        const logEntry = new BalanceLogs({
          gid: interaction.guildId,
          sender_id: interactionUser.user.id,
          sender_name: getDisplayName(interactionUser),
          receiver_id: receiverUser.user.id,
          receiver_name: getDisplayName(receiverUser),
          type: "transfer",
          amount: amount,
        });

        await logEntry.save();

        const embedMessage = new EmbedBuilder()
          .setColor("#00DB19")
          .setTitle(`Balance transfer`)
          .setDescription(
            `User ${interactionUser} (${getDisplayName(
              interactionUser,
            )}) has transfered 💲**${amount}** to ${receiverUser} (${getDisplayName(
              receiverUser,
            )}).`,
          );

        await interaction.followUp({ embeds: [embedMessage] });

        if (configBalance.log_channel) {
          const logChannel = await interaction.guild.channels.fetch(configBalance.log_channel);
          if (logChannel) {
            embedMessage.setColor("#16b1f8");
            embedMessage.setFooter({
              text: `Balance transfered by ${getDisplayName(interactionUser)} (#${
                interactionUser.user.id
              })`,
            });
            await logChannel.send({ embeds: [embedMessage] });
          }
        }
      } catch (err) {
        console.error(err);
        return await interaction.followUp({
          content: `> [d3f4a2] Error while giving balance. Please try again later.`,
          ephemeral: true,
        });
      }
    } else if (interaction.options.getSubcommand() === "ranking") {
      try {
        const balances = await Balance.find({ gid: interaction.guildId })
          .sort({ balance: -1 })
          .limit(10);

        if (balances.length === 0) {
          return await interaction.followUp({
            content: `> No balances found for this server.`,
            ephemeral: true,
          });
        }

        const embedMessage = new EmbedBuilder()
          .setColor("#00DB19")
          .setTitle(`Balance Ranking`)
          .setDescription(
            balances
              .map((b, index) => `\`#${index + 1}\` ${b.user_name} - 💲${b.balance}`)
              .join("\n"),
          );

        return await interaction.followUp({ embeds: [embedMessage] });
      } catch (err) {
        console.error(err);
        return await interaction.followUp({
          content: `> [cbed3d] Error while fetching balance ranking. Please try again later.`,
          ephemeral: true,
        });
      }
    }
    // payout rights required
    else if (
      interaction.options.getSubcommand() === "add" ||
      interaction.options.getSubcommand() === "add_many"
    ) {
      const users = interaction.options.getString("users") || null;
      const user = interaction.options.getUser("user") || null;
      const amount = interaction.options.getInteger("amount");

      let usersArray = [];

      if (users) {
        usersArray = await extractUniqueMembers(users);
      } else if (user) {
        usersArray = [user.id];
      }

      if (usersArray.length === 0) {
        return await interaction.followUp({
          content: `> ❌ No valid users found in the input.`,
          ephemeral: true,
        });
      }

      if (amount <= 0) {
        return await interaction.followUp({
          content: `> ❌ Amount must be greater than 0.`,
          ephemeral: true,
        });
      }

      const interactionUser = await interaction.guild.members.fetch(interaction.user.id, {
        force: true,
      });

      let usersWhoReceived = [];
      let usersNotFound = [];

      for await (const userId of usersArray) {
        try {
          const guildMember = await interaction.guild.members.fetch(userId, {
            force: true,
          });

          if (!guildMember) {
            usersNotFound.push(userId);
            continue; // Skip if user not found
          }

          let balance = await Balance.findOne({
            gid: interaction.guildId,
            user_id: guildMember.id,
          });

          if (!balance) {
            balance = new Balance({
              gid: interaction.guildId,
              user_id: guildMember.id,
              user_name: getDisplayName(guildMember),
            });
          }

          balance.balance += amount;
          await balance.save();

          const logEntry = new BalanceLogs({
            gid: interaction.guildId,
            type: "add",
            payout_id: interactionUser.user.id,
            payout_name: getDisplayName(interactionUser),
            receiver_id: guildMember.user.id,
            receiver_name: getDisplayName(guildMember),
            amount: amount,
          });

          await logEntry.save();

          usersWhoReceived.push(guildMember);
        } catch (err) {
          console.error(err);
          await interaction.followUp({
            content: `> [d3f4a2] Error while adding balance to user <@${userId}>. Please try again later.`,
            ephemeral: true,
          });
        }
      }

      let message = ``;

      if (usersWhoReceived.length > 0) {
        message += `Added 💲**${amount}** to the following users:\n`;

        message += `> ` + usersWhoReceived.map((user) => `${getDisplayName(user)}`).join(", ");
      }

      if (usersNotFound.length > 0) {
        message += `\n\nThe following users were not found:\n`;
        message += `> ` + usersNotFound.map((user) => `${user}`).join(", ");
      }

      const embedMessage = new EmbedBuilder()
        .setColor(`#16915e`)
        .setTitle(`Balance Added`)
        .setDescription(message);

      await interaction.followUp({ embeds: [embedMessage] });

      if (configBalance.log_channel) {
        const logChannel = await interaction.guild.channels.fetch(configBalance.log_channel);
        if (logChannel) {
          embedMessage.setFooter({
            text: `Balance added by ${getDisplayName(interactionUser)} (#${
              interactionUser.user.id
            })`,
          });
          await logChannel.send({ embeds: [embedMessage] });
        }
      }
    } else if (
      interaction.options.getSubcommand() === "remove" ||
      interaction.options.getSubcommand() === "remove_many"
    ) {
      const users = interaction.options.getString("users") || null;
      const user = interaction.options.getUser("user") || null;
      const amount = interaction.options.getInteger("amount");

      let usersArray = [];

      if (users) {
        usersArray = await extractUniqueMembers(users);
      } else if (user) {
        usersArray = [user.id];
      }

      if (usersArray.length === 0) {
        return await interaction.followUp({
          content: `> ❌ No valid users found in the input.`,
          ephemeral: true,
        });
      }

      if (amount <= 0) {
        return await interaction.followUp({
          content: `> ❌ Amount must be greater than 0.`,
          ephemeral: true,
        });
      }

      const interactionUser = await interaction.guild.members.fetch(interaction.user.id, {
        force: true,
      });

      let usersToRemoveBalance = [];
      let usersWithoutBalance = [];
      let usersWithNotEnoughBalance = [];
      let usersNotFound = [];

      for await (const userId of usersArray) {
        try {
          const guildMember = await interaction.guild.members.fetch(userId, {
            force: true,
          });

          if (!guildMember) {
            usersNotFound.push(userId);
            continue;
          }

          let balance = await Balance.findOne({
            gid: interaction.guildId,
            user_id: guildMember.id,
          });

          if (!balance) {
            usersWithoutBalance.push(guildMember);
            continue;
          }

          if (balance.balance < amount) {
            usersWithNotEnoughBalance.push(guildMember);
            continue;
          }

          balance.balance -= amount;
          await balance.save();

          const logEntry = new BalanceLogs({
            gid: interaction.guildId,
            type: "remove",
            payout_id: interactionUser.user.id,
            payout_name: getDisplayName(interactionUser),
            receiver_id: guildMember.user.id,
            receiver_name: getDisplayName(guildMember),
            amount: amount,
          });

          await logEntry.save();

          usersToRemoveBalance.push(guildMember);
        } catch (err) {
          console.error(err);
          await interaction.followUp({
            content: `> [1799f9] Error while removing balance from user <@${userId}>. Please try again later.`,
            ephemeral: true,
          });
        }
      }

      let message = ``;

      if (usersToRemoveBalance.length > 0) {
        message += `Removed 💲**${amount}** from the following users:\n`;

        message += `> ` + usersToRemoveBalance.map((user) => `${getDisplayName(user)}`).join(", ");
      }

      if (usersWithoutBalance.length > 0) {
        message += `\n\nThe following users had no balance:\n`;
        message += `> ` + usersWithoutBalance.map((user) => `${getDisplayName(user)}`).join(", ");
      }

      if (usersWithNotEnoughBalance.length > 0) {
        message += `\n\nThe following users did not have enough balance:\n`;
        message +=
          `> ` + usersWithNotEnoughBalance.map((user) => `${getDisplayName(user)}`).join(", ");
      }

      if (usersNotFound.length > 0) {
        message += `\n\nThe following users were not found:\n`;
        message += `> ` + usersNotFound.map((user) => `${user}`).join(", ");
      }

      const embedMessage = new EmbedBuilder()
        .setColor(`#c90c6a`)
        .setTitle(`Balance Removed`)
        .setDescription(message);

      await interaction.followUp({ embeds: [embedMessage] });

      if (configBalance.log_channel) {
        const logChannel = await interaction.guild.channels.fetch(configBalance.log_channel);
        if (logChannel) {
          embedMessage.setFooter({
            text: `Balance removed by ${getDisplayName(interactionUser)} (#${
              interactionUser.user.id
            })`,
          });
          await logChannel.send({ embeds: [embedMessage] });
        }
      }
    } else if (interaction.options.getSubcommand() === "payout") {
      const user = interaction.options.getUser("user");
      let amount = interaction.options.getInteger("amount") ?? null;

      const interactionUser = await interaction.guild.members.fetch(interaction.user.id, {
        force: true,
      });
      const payoutUser = await interaction.guild.members.fetch(user.id, {
        force: true,
      });

      if (!payoutUser) {
        return await interaction.followUp({
          content: `> ❌ User not found.`,
          ephemeral: true,
        });
      }

      try {
        let balance = await Balance.findOne({
          gid: interaction.guildId,
          user_id: payoutUser.id,
        });

        if (!balance) {
          return await interaction.followUp({
            content: `> ❌ User ${payoutUser} has no balance to payout.`,
            ephemeral: true,
          });
        }

        if (amount === null) {
          amount = balance.balance;
        }

        if (balance.balance < amount) {
          return await interaction.followUp({
            content: `> ❌ User ${payoutUser} has only 💲${balance.balance} available.`,
            ephemeral: true,
          });
        }

        const embedMessage = new EmbedBuilder()
          .setColor("#fffb2c")
          .setTitle(`Payout information`)
          .setDescription(`You need to payout 💲**${amount}** to ${getDisplayName(payoutUser)}.`);

        const buttonsRow = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId("balance_payout_confirm")
              .setLabel("Confirm payout")
              .setStyle(ButtonStyle.Success),
          )
          .addComponents(
            new ButtonBuilder()
              .setCustomId("balance_payout_cancel")
              .setLabel("Cancel payout")
              .setStyle(ButtonStyle.Danger),
          );

        const msg = await interaction.followUp({
          embeds: [embedMessage],
          components: [buttonsRow],
        });

        const collector = msg.createMessageComponentCollector({ time: 120000 });

        collector.on("collect", async (i) => {
          if (i.customId === "balance_payout_cancel" && i.user.id === interactionUser.user.id) {
            embedMessage.setTitle("Payout canceled.");
            embedMessage.setColor(`#DB0019`);
            await i.update({ embeds: [embedMessage], components: [] });
            collector.stop();
          }
          if (i.customId === "balance_payout_confirm" && i.user.id === interactionUser.user.id) {
            try {
              balance.balance -= amount;
              await balance.save();

              const logEntry = new BalanceLogs({
                gid: interaction.guildId,
                type: "payout",
                payout_id: interactionUser.user.id,
                payout_name: getDisplayName(interactionUser),
                receiver_id: payoutUser.user.id,
                receiver_name: getDisplayName(payoutUser),
                amount: amount,
              });

              await logEntry.save();

              embedMessage
                .setTitle(`Payout successful`)
                .setDescription(
                  `💲**${amount}** has been successfully paid out to ${getDisplayName(
                    payoutUser,
                  )}.`,
                )
                .setColor(`#00DB19`);

              await i.update({ embeds: [embedMessage], components: [] });

              if (configBalance.log_channel) {
                const logChannel = await interaction.guild.channels.fetch(
                  configBalance.log_channel,
                );
                if (logChannel) {
                  embedMessage.setFooter({
                    text: `Balance payed out by ${getDisplayName(interactionUser)} (#${
                      interactionUser.user.id
                    })`,
                  });
                  await logChannel.send({ embeds: [embedMessage] });
                }
              }
            } catch (err) {
              console.error(err);
              embedMessage
                .setTitle("Payout failed")
                .setDescription(`> [d3f4a2] Error while processing payout. Please try again later.`)
                .setColor(`#DB0019`);
              await i.update({ embeds: [embedMessage], components: [] });
            }
            collector.stop();
          }
        });
      } catch (err) {
        console.error(err);
        return await interaction.followUp({
          content: `> [9defd7] Error while processing payout. Please try again later.`,
          ephemeral: true,
        });
      }
    } else if (interaction.options.getSubcommand() === "stats") {
      try {
        const stats = await Balance.aggregate([
          { $match: { gid: interaction.guildId } },
          {
            $group: {
              _id: null,
              totalBalance: { $sum: "$balance" },
            },
          },
        ]);

        const embedMessage = new EmbedBuilder()
          .setColor(`#4493fc`)
          .setTitle(`Balance Stats`)
          .setDescription(`Total Balance: 💲**${stats[0]?.totalBalance || 0}**`);

        await interaction.followUp({ embeds: [embedMessage] });
      } catch (err) {
        console.error(err);
        return await interaction.followUp({
          content: `> [26b31b] Error while fetching stats. Please try again later.`,
          ephemeral: true,
        });
      }
    } else if (interaction.options.getSubcommand() === "cta") {
      // TODO later
    } else if (interaction.options.getSubcommand() === "logs") {
      const user = interaction.options.getUser("user");
      const type = interaction.options.getString("type") ?? "all";

      const logUser = await interaction.guild.members.fetch(user.id, {
        force: true,
      });

      if (!logUser) {
        return await interaction.followUp({
          content: `> ❌ User not found.`,
          ephemeral: true,
        });
      }

      try {
        const logs = await BalanceLogs.find({
          gid: interaction.guildId,
          type: type === "all" ? { $exists: true } : type,
          $or: [{ sender_id: logUser.user.id }, { receiver_id: logUser.user.id }],
        }).sort({ date: 1 });

        if (logs.length === 0) {
          return await interaction.followUp({
            content: `> ❌ No logs found for this user.`,
            ephemeral: true,
          });
        }

        let fileContent = `Date\tType\tPayout member ID\tPayout member\tSender ID\tSender\tReceiver ID\tReceiver\tAmount\n`;

        for await (const log of logs) {
          fileContent += `${formattedDate(log.date, "date_time_utc")}\t${log.type}\t${
            log.payout_id || ""
          }\t${log.payout_name || ""}\t${log.sender_id || ""}\t${log.sender_name || ""}\t${
            log.receiver_id || ""
          }\t${log.receiver_name || ""}\t${log.amount}\n`;
        }

        const buffer = Buffer.from(fileContent, "utf-8");
        files = [
          {
            attachment: buffer,
            name: `balance_member_logs.txt`,
          },
        ];

        const embedMessage = new EmbedBuilder()
          .setColor("#ff99ff")
          .setTitle(`Balance Logs`)
          .setDescription(
            `Generated balanced logs for **${getDisplayName(logUser)}** (#${
              logUser.user.id
            }).\n*Given times are in UTC timezone.*`,
          );

        await interaction.followUp({ embeds: [embedMessage], files: files });
      } catch (err) {
        console.error(err);
        return await interaction.followUp({
          content: `> [8f63c1] Error while fetching logs. Please try again later.`,
          ephemeral: true,
        });
      }
    } else if (interaction.options.getSubcommand() === "file") {
      const type = interaction.options.getString("type") ?? "txt";
      const aboveZero = interaction.options.getBoolean("above_zero") ?? true;

      try {
        const balances = await Balance.find({
          gid: interaction.guildId,
          balance: aboveZero ? { $gt: 0 } : { $exists: true },
        }).sort({ balance: -1 });

        if (balances.length === 0) {
          return await interaction.followUp({
            content: `> ❌ No balances found for this server.`,
            ephemeral: true,
          });
        }

        let fileContent = `User ID\tUser Name\tBalance\n`;

        for await (const balance of balances) {
          fileContent += `${balance.user_id}\t${balance.user_name}\t${balance.balance}\n`;
        }

        let fileName = `balance_info.${type}`;
        if (type === "html") {
          fileContent = `<html><body><table><tr><th>User ID</th><th>User Name</th><th>Balance</th></tr>${fileContent
            .split("\n")
            .slice(1)
            .map(
              (line) =>
                `<tr>${line
                  .split("\t")
                  .map((cell) => `<td>${cell}</td>`)
                  .join("")}</tr>`,
            )
            .join("")}</table></body></html>`;
          fileName = `balance_info.html`;
        } else if (type === "csv") {
          fileContent = fileContent.replace(/\t/g, ",");
          fileName = `balance_info.csv`;
        }

        const buffer = Buffer.from(fileContent, "utf-8");
        files = [
          {
            attachment: buffer,
            name: fileName,
          },
        ];

        const embedMessage = new EmbedBuilder()
          .setColor("#ccf7b8")
          .setTitle(`Balance File`)
          .setDescription(`Generated balance file for the server. You can download it below.`);

        await interaction.followUp({ embeds: [embedMessage], files: files });
      } catch (err) {
        console.error(err);
        return await interaction.followUp({
          content: `> [8f63c1] Error while generating balance file. Please try again later.`,
          ephemeral: true,
        });
      }
    } else if (interaction.options.getSubcommand() === "import") {
      const interactionUser = await interaction.guild.members.fetch(interaction.user.id, {
        force: true,
      });

      if (!manager_perms) {
        return await interaction.followUp({
          content: `> You don't have permission to use this command.`,
          ephemeral: true,
        });
      }

      await interaction.followUp({
        content:
          "> Post balance list to import in format:\n> `display name;balance` (one per line).",
        ephemeral: true,
      });

      const filter = (m) => m.author.id === interaction.user.id;
      const collector = await interaction.channel.createMessageCollector({ filter, time: 60000 });

      let parsedData = [];

      await collector.on("collect", async (collectedMessage) => {
        if (collectedMessage.attachments.size > 0) {
          const attachment = collectedMessage.attachments.first();

          try {
            const response = await fetch(attachment.url);
            const buffer = Buffer.from(await response.arrayBuffer());

            parsedData = await this.parseFile(buffer);
          } catch (err) {
            console.error(err);
            return await interaction.followUp({
              content: `> [e270f9] Error while processing online list. Please try again later.`,
              ephemeral: true,
            });
          }
        } else {
          parsedData = await this.parseText(collectedMessage.content);
        }
        try {
          collectedMessage.delete();
        } catch (err) {
          console.error(`> [38b574] (/balance impoort) No permissions to remove messages.`);
        }
        collector.stop();

        if (parsedData.length < 1) {
          return await interaction.followUp({
            content: `> No data provided or provided in wrong format. Please try again.`,
            ephemeral: true,
          });
        }

        let usersNotFound = [];
        let usersAdded = [];

        for await (const user of parsedData) {
          const member = await interaction.guild.members.cache.find(
            (m) => getDisplayName(m) === user.displayName,
          );

          if (!member) {
            usersNotFound.push(user);
            continue;
          }

          let balance = await Balance.findOne({
            gid: interaction.guildId,
            user_id: member.user.id,
          });

          if (!balance) {
            balance = new Balance({
              gid: interaction.guildId,
              user_id: member.user.id,
              user_name: getDisplayName(member),
            });
          }

          balance.balance += user.amount;
          await balance.save();

          const logEntry = new BalanceLogs({
            gid: interaction.guildId,
            type: "add",
            payout_id: interaction.user.id,
            payout_name: getDisplayName(interactionUser),
            receiver_id: member.user.id,
            receiver_name: getDisplayName(member),
            amount: user.amount,
          });

          await logEntry.save();

          usersAdded.push({
            userId: member.user.id,
            ...user,
          });
        }

        let message = ``;

        message += `### Updated balance for **${usersAdded.length}** user(s):\n`;
        let page = 1;

        for await (const user of usersAdded) {
          message += `> **${user.displayName}** got 💲${user.amount}\n`;

          if (message.length > 3800) {
            const embedMessage = new EmbedBuilder()
              .setColor(`#4bdd11`)
              .setTitle(`Balance Import`)
              .setDescription(message)
              .setFooter({
                text: `Page ${page}`,
              });

            await interaction.followUp({ embeds: [embedMessage] });

            if (configBalance.log_channel) {
              const logChannel = await interaction.guild.channels.fetch(configBalance.log_channel);
              if (logChannel) {
                embedMessage.setFooter({
                  text: `Balance imported by ${getDisplayName(interactionUser)} (#${
                    interaction.user.id
                  })`,
                });
                await logChannel.send({ embeds: [embedMessage] });
              }
            }

            message = `### Updated balance for **${usersAdded.length}** user(s):\n`;
            page++;
          }
        }

        if (message.length > 0) {
          const embedMessage = new EmbedBuilder()
            .setColor(`#4bdd11`)
            .setTitle(`Balance Import`)
            .setDescription(message);

          if (page > 1) {
            embedMessage.setFooter({
              text: `Page ${page}`,
            });
          }

          await interaction.followUp({ embeds: [embedMessage] });

          if (configBalance.log_channel) {
            const logChannel = await interaction.guild.channels.fetch(configBalance.log_channel);
            if (logChannel) {
              embedMessage.setFooter({
                text: `Balance imported by ${getDisplayName(interactionUser)} (#${
                  interaction.user.id
                })`,
              });
              await logChannel.send({ embeds: [embedMessage] });
            }
          }
        }

        if (usersNotFound.length > 0) {
          let notFoundMessage = `### The following users were not found:\n`;
          notFoundMessage += usersNotFound
            .map((user) => `> ${user.displayName};${user.amount}`)
            .join("\n");

          try {
            const embedMessage = new EmbedBuilder()
              .setColor(`#c90c6a`)
              .setTitle(`Balance Import - Users Not Found`)
              .setDescription(notFoundMessage);

            await interaction.followUp({ embeds: [embedMessage] });

            if (configBalance.log_channel) {
              const logChannel = await interaction.guild.channels.fetch(configBalance.log_channel);
              if (logChannel) {
                embedMessage.setFooter({
                  text: `Balance imported by ${getDisplayName(interactionUser)} (#${
                    interaction.user.id
                  })`,
                });
                await logChannel.send({ embeds: [embedMessage] });
              }
            }
          } catch (err) {
            await interaction.followUp({
              content: `> An error occurred while processing the request.\nError message: \`${err.message}\``,
            });
            console.error(`> [832084] (/balance import) ${err.message}`, err);
          }
        }
      });
    }
  },
  async parseText(content) {
    const lines = content.split("\n");
    return lines
      .map((line) => {
        const match = line.match(/^(.+?);([\d., ]+)$/);
        if (!match) return null;

        if (match[1].trim() === "" || match[2].trim() === "") return null;

        return {
          displayName: match[1],
          amount: parseInt(match[2].trim().replace(/[., ]/g, ""), 10),
        };
      })
      .filter((entry) => entry !== null);
  },
  async parseFile(filePath) {
    let fileStream;

    if (Buffer.isBuffer(filePath)) {
      fileStream = Readable.from(filePath.toString("utf-8").split("\n"));
    } else {
      fileStream = fs.createReadStream(filePath);
    }
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    let data = [];

    for await (const line of rl) {
      const match = line.match(/^(.+?);([\d., ]+)$/);
      if (!match) return null;

      if (match[1].trim() === "" || match[2].trim() === "") return null;

      data.push({
        displayName: match[1],
        amount: parseInt(match[2].trim().replace(/[., ]/g, ""), 10),
      });
    }
    return data;
  },
};

module.exports = {
  Balance_Setup,
  Balance_Command,
};
