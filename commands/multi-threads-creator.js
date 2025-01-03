const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  EmbedBuilder,
  ModalBuilder,
  TextInputStyle,
  TextInputBuilder,
  ThreadAutoArchiveDuration,
  ChannelType,
} = require("discord.js");
const {
  MultiThreadsCreatorSettings,
  MultiThreadsCreator,
} = require("../dbmodels/multi-threads-creator.js");

const MultiThreadsCreatorCommands = {
  data: new SlashCommandBuilder()
    .setName("mtc")
    .setDescription("Allows to create multiple threads.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add_template")
        .setDescription("Add new template to the server.")
        .addStringOption((option) =>
          option.setName("name").setDescription("Template name").setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove_template")
        .setDescription("Remove template from the server.")
        .addStringOption((option) =>
          option
            .setName("mtc_template_name")
            .setDescription("Select template.")
            .setAutocomplete(true)
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("list_templates").setDescription("List templates from this server.")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add_manager")
        .setDescription("Add role that can use this commands.")
        .addStringOption((option) =>
          option
            .setName("mtc_template_name")
            .setDescription("Select template.")
            .setAutocomplete(true)
            .setRequired(true)
        )
        .addRoleOption((option) =>
          option.setName("role").setDescription("Role to add").setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove_manager")
        .setDescription("Remove role that can use this commands.")
        .addStringOption((option) =>
          option
            .setName("mtc_template_name")
            .setDescription("Select template.")
            .setAutocomplete(true)
            .setRequired(true)
        )
        .addRoleOption((option) =>
          option.setName("role").setDescription("Role to remove").setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("list_managers")
        .setDescription("List roles that can use this commands.")
        .addStringOption((option) =>
          option
            .setName("mtc_template_name")
            .setDescription("Select template.")
            .setAutocomplete(true)
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("create_button_cfg")
        .setDescription("Create a button to create multiple threads.")
        .addStringOption((option) =>
          option
            .setName("mtc_template_name")
            .setDescription("Select template.")
            .setAutocomplete(true)
            .setRequired(true)
        )
        .addStringOption((option) =>
          option.setName("name").setDescription("Name of the button.").setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("description")
            .setDescription("Description of the button.")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("color")
            .setDescription("Button color.")
            .addChoices(
              { name: "Blue", value: "Primary" },
              { name: "Gray", value: "Secondary" },
              { name: "Green", value: "Success" },
              { name: "Red", value: "Danger" }
            )
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("channels")
            .setDescription("Mention all channels where the threads should be added.")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("separator")
            .setDescription("Separator for channels (default: space)")
            .setMaxLength(3)
            .setMinLength(1)
        )
        .addBooleanOption((option) =>
          option
            .setName("is_private")
            .setDescription("Make created thread as privated? (default: false)")
        )
        .addStringOption((option) =>
          option
            .setName("default_content")
            .setDescription(
              "Default contetn that will be posted in the thread after creation. You can mention members and roles."
            )
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("update_button_cfg")
        .setDescription("Update a button to create multiple threads.")
        .addStringOption((option) =>
          option
            .setName("mtc_button_name")
            .setDescription("Button to update")
            .setAutocomplete(true)
            .setRequired(true)
        )
        .addStringOption((option) =>
          option.setName("name").setDescription("New name of the button.")
        )
        .addStringOption((option) =>
          option.setName("description").setDescription("New description of the button.")
        )
        .addStringOption((option) =>
          option
            .setName("color")
            .setDescription("New button color.")
            .addChoices(
              { name: "Blue", value: "Primary" },
              { name: "Gray", value: "Secondary" },
              { name: "Green", value: "Success" },
              { name: "Red", value: "Danger" }
            )
        )
        .addStringOption((option) =>
          option
            .setName("channels")
            .setDescription("New channels where the threads should be added.")
        )
        .addStringOption((option) =>
          option
            .setName("separator")
            .setDescription("Separator for channels (default: space)")
            .setMaxLength(3)
            .setMinLength(1)
        )
        .addBooleanOption((option) =>
          option
            .setName("is_private")
            .setDescription("Make created thread as privated? (default: false)")
        )
        .addStringOption((option) =>
          option
            .setName("default_content")
            .setDescription(
              "Default contetn that will be posted in the thread after creation. You can mention members and roles."
            )
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove_button_cfg")
        .setDescription("Remove role that can use this commands.")
        .addStringOption((option) =>
          option
            .setName("mtc_button_name")
            .setDescription("Button to remove")
            .setAutocomplete(true)
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("list_buttons_cfg")
        .setDescription("Remove role that can use this commands.")
        .addStringOption((option) =>
          option
            .setName("mtc_template_name")
            .setDescription("Select template.")
            .setAutocomplete(true)
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add_buttons")
        .setDescription("Add buttons to the channel.")
        .addStringOption((option) =>
          option
            .setName("mtc_template_name")
            .setDescription("Select template.")
            .setAutocomplete(true)
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("content")
            .setDescription("Message content to which buttons will be attached.")
            .setRequired(true)
        )
        .addBooleanOption((option) =>
          option
            .setName("add_buttons_description")
            .setDescription(
              "Do you want to add buttons description to the message? (default: true)"
            )
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async autocomplete(interaction) {
    const focusedOption = interaction.options.getFocused(true);
    let choices = [];

    if (focusedOption.name === "mtc_button_name") {
      try {
        const settingsDB = await MultiThreadsCreator.find({
          gid: interaction.guildId,
        }).populate("template");

        await settingsDB.forEach((setting) => {
          choices.push({
            name: `${setting?.template?.name ?? ""} | ${setting.name}`,
            value: setting._id.toString(),
          });
        });

        choices.sort((a, b) => a.name.localeCompare(b.name));
      } catch (err) {
        console.error(err);
      }

      const filtered = choices.filter((choice) =>
        choice.name.toLowerCase().includes(focusedOption.value.toLowerCase())
      );

      await interaction.respond(
        filtered.map((choice) => ({ name: choice.name, value: choice.value }))
      );
    } else if (focusedOption.name === "mtc_template_name") {
      try {
        const settingsDB = await MultiThreadsCreatorSettings.find({
          gid: interaction.guildId,
        }).sort({ name: 1 });

        await settingsDB.forEach((setting) => {
          choices.push({
            name: `${setting.name}`,
            value: setting._id.toString(),
          });
        });
      } catch (err) {
        console.error(err);
      }

      const filtered = choices.filter((choice) =>
        choice.name.toLowerCase().includes(focusedOption.value.toLowerCase())
      );

      await interaction.respond(
        filtered.map((choice) => ({ name: choice.name, value: choice.value }))
      );
    }
  },
  async execute(interaction) {
    let mtcDBs;
    try {
      mtcDBs = await MultiThreadsCreatorSettings.find({ gid: interaction.guildId });

      if (mtcDBs.length < 1) {
        mtcDBs = [new MultiThreadsCreatorSettings({ gid: interaction.guildId, name: "Default" })];
      }
    } catch (err) {
      console.error(err);
      return await interaction.reply({
        content: `[h54hh] There was a Database error. Please try again later.`,
        ephemeral: true,
      });
    }

    if (interaction.options.getSubcommand() === "add_template") {
      const name = interaction.options.getString("name");

      try {
        const mtcDB = mtcDBs.find((mtc) => mtc.name === name);

        if (mtcDB) {
          return await interaction.reply({
            content: `> Template name **${mtcDB.name}** already exist on this server.`,
            ephemeral: true,
          });
        }

        const newTemplate = await new MultiThreadsCreatorSettings({
          gid: interaction.guildId,
          name: name,
        });

        await newTemplate.save();

        await interaction.reply(`> Template name **${name}** has been added.`);
      } catch (err) {
        console.error(err);
        return await interaction.reply({
          content: `[h455h4] There was a Database error. Please try again later.`,
          ephemeral: true,
        });
      }
    } else if (interaction.options.getSubcommand() === "remove_template") {
      const mtc_template_id = interaction.options.getString("mtc_template_name");

      try {
        const mtcDB = mtcDBs.find((mtc) => mtc._id.toString() === mtc_template_id);

        if (!mtcDB) {
          return await interaction.reply({
            content: `> Selected template doesn't exist on this server.`,
            ephemeral: true,
          });
        }

        await MultiThreadsCreatorSettings.deleteOne({ _id: mtc_template_id });
        await MultiThreadsCreator.deleteMany({ template: mtc_template_id });

        await interaction.reply(`> Template name **${mtcDB.name}** has been removed.`);
      } catch (err) {
        console.error(err);
        return await interaction.reply({
          content: `[lr2bnf] There was a Database error. Please try again later.`,
          ephemeral: true,
        });
      }
    } else if (interaction.options.getSubcommand() === "list_templates") {
      return await interaction.reply({
        content: `> Not ready yet...`,
        ephemeral: true,
      });
    } else if (interaction.options.getSubcommand() === "add_manager") {
      const role = interaction.options.getRole("role");
      const mtc_template_id = interaction.options.getString("mtc_template_name");

      try {
        const mtcDB = mtcDBs.find((mtc) => mtc._id.toString() === mtc_template_id);

        if (!mtcDB) {
          return await interaction.reply({
            content: `> Selected template doesn't exist.`,
            ephemeral: true,
          });
        }

        if (mtcDB.allowedRoles.includes(role.id)) {
          return await interaction.reply({
            content: `> Role **${role.name}** is already on the list.`,
            ephemeral: true,
          });
        }

        mtcDB.allowedRoles.push(role.id);
        await mtcDB.save();

        await interaction.reply(
          `> Role **${role.name}** has been added to the managers list in template **${mtcDB.name}**.`
        );
      } catch (err) {
        console.error(err);
        return await interaction.reply({
          content: `[g24gv] There was a Database error. Please try again later.`,
          ephemeral: true,
        });
      }
    } else if (interaction.options.getSubcommand() === "remove_manager") {
      const role = interaction.options.getRole("role");
      const mtc_template_id = interaction.options.getString("mtc_template_name");

      try {
        const mtcDB = mtcDBs.find((mtc) => mtc._id.toString() === mtc_template_id);

        if (!mtcDB) {
          return await interaction.reply({
            content: `> Selected template doesn't exist.`,
            ephemeral: true,
          });
        }

        if (!mtcDB.allowedRoles.includes(role.id)) {
          return await interaction.reply({
            content: `> Role **${role.name}** is not on the managers list in template **${mtcDB.name}**..`,
            ephemeral: true,
          });
        }

        mtcDB.allowedRoles = mtcDB.allowedRoles.filter((id) => id !== role.id);
        await mtcDB.save();

        await interaction.reply(
          `> Role **${role.name}** has been removed from the managers list in template **${mtcDB.name}**..`
        );
      } catch (err) {
        return await interaction.reply({
          content: `[h3ghd] There was a Database error. Please try again later.`,
          ephemeral: true,
        });
      }
    } else if (interaction.options.getSubcommand() === "list_managers") {
      const mtc_template_id = interaction.options.getString("mtc_template_name");

      try {
        const mtcDB = mtcDBs.find((mtc) => mtc._id.toString() === mtc_template_id);

        if (!mtcDB) {
          return await interaction.reply({
            content: `> Selected template doesn't exist.`,
            ephemeral: true,
          });
        }

        if (!mtcDB?.allowedRoles.length) {
          return await interaction.reply({
            content: `> No allowed roles in template **${mtcDB.name}**..`,
            ephemeral: true,
          });
        }

        let allowedRoles = ``;

        for (const roleId of mtcDB.allowedRoles) {
          allowedRoles += `> <@&${roleId}>\n`;
        }

        await interaction.reply({
          content: `> Allowed roles in template **${mtcDB.name}**:\n${allowedRoles}`,
          ephemeral: true,
        });
      } catch (err) {
        return await interaction.reply({
          content: `[h3ghd] There was a Database error. Please try again later.`,
          ephemeral: true,
        });
      }
    } else if (interaction.options.getSubcommand() === "create_button_cfg") {
      const mtc_template_id = interaction.options.getString("mtc_template_name");
      const name = interaction.options.getString("name");
      const description = interaction.options.getString("description");
      const color = interaction.options.getString("color");
      const channels = interaction.options.getString("channels").trim();
      const separator = interaction.options.getString("separator") ?? " ";
      const default_content = interaction.options.getString("default_content") ?? "";
      const is_private = interaction.options.getBoolean("is_private") ?? false;

      await interaction.deferReply();

      try {
        const template = await MultiThreadsCreatorSettings.findOne({ _id: mtc_template_id });

        if (!template) {
          return await interaction.followUp({
            content: `> Selected template doesn't exist.`,
            ephemeral: true,
          });
        }

        const channelsSplitted = channels.split(separator);
        let channelsArray = [];
        let notExistedChannels = [];

        for (let channel of channelsSplitted) {
          channel = channel?.trim();

          if (channel.startsWith("<#") && channel) {
            channel = channel.substring(2, channel.length - 1);

            const isChannelsExist =
              (await interaction.guild.channels.cache.find((c) => {
                return c.id === channel;
              })) || null;

            if (isChannelsExist) {
              channelsArray.push(isChannelsExist.id);
            } else {
              notExistedChannels.push(channel);
            }
          } else {
            notExistedChannels.push(channel);
          }
        }

        const newMTC = new MultiThreadsCreator({
          gid: interaction.guildId,
          template: template._id,
          name: name,
          description: description,
          color: color,
          channels: channelsArray,
          defaultContent: default_content,
          isPrivate: is_private,
        });

        await newMTC.save();

        let msg = ``;
        msg += `**Name:** *${name}*\n`;
        msg += `**Description:** *${description}*\n`;
        msg += `**Color:** *${color}*\n`;
        msg += `**Default content:** \`${default_content}\`\n`;
        msg += `**Is private:** *${is_private}*\n`;
        msg += `**Channels:** `;
        msg += channelsArray.map((c) => `<#${c}>`).join(" ");

        if (notExistedChannels.length) {
          msg += `\n**Not found channels:** `;
          msg += notExistedChannels.map((c) => `\`${c}\``).join(", ");
        }

        const embedMessage = new EmbedBuilder()
          .setColor("#00aa00")
          .setTitle(`Multi Thread Creator created`)
          .setDescription(msg);

        await interaction.followUp({ embeds: [embedMessage] });
      } catch (err) {
        console.error(err);
        return await interaction.followUp({
          content: `[j56ng] There was a Database error. Please try again later.`,
          ephemeral: true,
        });
      }
    } else if (interaction.options.getSubcommand() === "update_button_cfg") {
      const name = interaction.options.getString("name") ?? null;
      const description = interaction.options.getString("description") ?? null;
      const color = interaction.options.getString("color") ?? null;
      const channels = interaction.options.getString("channels")?.trim() ?? null;
      const separator = interaction.options.getString("separator") ?? " ";
      const default_content = interaction.options.getString("default_content") ?? null;
      const is_private = interaction.options.getBoolean("is_private") ?? null;

      await interaction.deferReply();

      try {
        const mtcButton = await MultiThreadsCreator.findOne({
          gid: interaction.guildId,
          _id: mtc_button_name,
        });

        if (!mtcButton) {
          return await interaction.followUp({
            content: `> In database there is no such button on this server.`,
            ephemeral: true,
          });
        }

        if (!name && !description && !color && !channels) {
          return await interaction.followUp({
            content: `> If you want to edit button, provide new values.`,
            ephemeral: true,
          });
        }

        let channelsArray = [];
        let notExistedChannels = [];

        if (channels?.length) {
          const channelsSplitted = channels.split(separator);

          for (let channel of channelsSplitted) {
            channel = channel?.trim();

            if (channel.startsWith("<#") && channel) {
              channel = channel.substring(2, channel.length - 1);

              const isChannelsExist =
                (await interaction.guild.channels.cache.find((c) => {
                  return c.id === channel;
                })) || null;

              if (isChannelsExist) {
                channelsArray.push(isChannelsExist.id);
              } else {
                notExistedChannels.push(channel);
              }
            } else {
              notExistedChannels.push(channel);
            }
          }
        }

        let msg = ``;

        if (name) {
          mtcButton.name = name;
          msg += `**Name:** *${name}*`;
          msg += ` \`(updated)\`\n`;
        } else {
          msg += `**Name:** *${mtcButton.name}*\n`;
        }

        if (description) {
          mtcButton.description = description;
          msg += `**Description:** *${description}*`;
          msg += ` \`(updated)\`\n`;
        } else {
          msg += `**Description:** *${mtcButton.description}*\n`;
        }

        if (color) {
          mtcButton.color = color;
          msg += `**Color:** *${color}*`;
          msg += ` \`(updated)\`\n`;
        } else {
          msg += `**Color:** *${mtcButton.color}*\n`;
        }

        if (default_content) {
          mtcButton.defaultContent = default_content;
          msg += `**Default content:** \`${default_content}\`\n`;
          msg += ` \`(updated)\`\n`;
        } else {
          msg += `**Default content:** \`${mtcButton.defaultContent}\`\n`;
        }

        if (is_private) {
          mtcButton.isPrivate = is_private;
          msg += `**Is private:** *${is_private}*`;
          msg += ` \`(updated)\`\n`;
        } else {
          msg += `**Is private:** *${mtcButton.isPrivate}*\n`;
        }

        if (channelsArray.length) {
          mtcButton.channels = channelsArray;

          msg += `**Channels:** `;
          msg += channelsArray.map((c) => `<#${c}>`).join(" ");
          msg += ` \`(updated)\``;
        } else {
          msg += `**Channels:** `;
          msg += mtcButton.channels.map((c) => `<#${c}>`).join(" ");
        }

        await mtcButton.save();

        if (notExistedChannels.length) {
          msg += `\n**Not found channels:** `;
          msg += notExistedChannels.map((c) => `\`${c}\``).join(", ");
        }

        const embedMessage = new EmbedBuilder()
          .setColor("#00aa00")
          .setTitle(`Multi Thread Creator updated`)
          .setDescription(msg);

        await interaction.followUp({ embeds: [embedMessage] });
      } catch (err) {
        console.error(err);
        return await interaction.followUp({
          content: `[j56ng] There was a Database error. Please try again later.`,
          ephemeral: true,
        });
      }
    } else if (interaction.options.getSubcommand() === "remove_button_cfg") {
      const mtc_button_name = interaction.options.getString("mtc_button_name");

      await interaction.deferReply();

      try {
        const mtcButton = await MultiThreadsCreator.findOne({
          gid: interaction.guildId,
          _id: mtc_button_name,
        });

        if (!mtcButton || mtcButton.length < 1) {
          return await interaction.followUp({
            content: `> *Not found any Multi Threads Creators configured with this name on this server*`,
            ephemeral: true,
          });
        }

        await MultiThreadsCreator.findOneAndDelete({
          gid: interaction.guildId,
          _id: mtc_button_name,
        });

        await interaction.followUp({
          content: `> Button with name **${mtcButton.name}** has been deleted.`,
          ephemeral: true,
        });
      } catch (err) {
        console.error(err);
        return await interaction.followUp({
          content: `[jn465f] There was a Database error. Please try again later.`,
          ephemeral: true,
        });
      }
    } else if (interaction.options.getSubcommand() === "list_buttons_cfg") {
      const mtc_template_id = interaction.options.getString("mtc_template_name");

      await interaction.deferReply();

      try {
        const mtcList = await MultiThreadsCreator.find({
          gid: interaction.guildId,
          template: mtc_template_id,
        });

        if (!mtcList || mtcList.length < 1) {
          return await interaction.followUp({
            content: `> *Not found any Multi Threads Creators configured on this server*`,
            ephemeral: true,
          });
        }

        let msg = ``;

        for await (mtc of mtcList) {
          if (msg.length > 0) {
            msg += `\n------------\n`;
          }

          msg += `**Name:** *${mtc.name}*\n`;
          msg += `**Description:** *${mtc.description}*\n`;
          msg += `**Color:** *${mtc.color}*\n`;
          msg += `**Default content:** *${mtc.defaultContent}*\n`;
          msg += `**Is private:** *${mtc.isPrivate}*\n`;
          msg += `**Channels:** `;
          msg += mtc.channels.map((c) => `<#${c}>`).join(" ");

          if (msg.length > 1950) {
            const embedMessage = new EmbedBuilder()
              .setColor("#00aa00")
              .setTitle(`Multi Thread Creator created`)
              .setDescription(msg);

            await interaction.followUp({ embeds: [embedMessage] });
          }
        }
        if (msg.length > 0) {
          const embedMessage = new EmbedBuilder()
            .setColor("#00aa00")
            .setTitle(`Multi Thread Creator created`)
            .setDescription(msg);

          await interaction.followUp({ embeds: [embedMessage] });
        }
      } catch (err) {
        console.error(err);
        return await interaction.followUp({
          content: `[jn465f] There was a Database error. Please try again later.`,
          ephemeral: true,
        });
      }
    } else if (interaction.options.getSubcommand() === "add_buttons") {
      const mtc_template_id = interaction.options.getString("mtc_template_name");

      const content = interaction.options.getString("content") ?? null;
      const add_buttons_description =
        interaction.options.getBoolean("add_buttons_description") ?? true;

      try {
        const mtcList = await MultiThreadsCreator.find({
          gid: interaction.guildId,
          template: mtc_template_id,
        });

        if (!mtcList || mtcList.length < 1) {
          return await interaction.followUp({
            content: `> *Not found any Multi Threads Creators configured on this server*`,
            ephemeral: true,
          });
        }

        if (mtcList.length > 25) {
          return await interaction.followUp({
            content: `> *Too many Multi Threads Creators configured on this server. You can have maximum 25. Consider removing some of them.*`,
            ephemeral: true,
          });
        }

        let message = content;

        let rows = [];
        let row = [];

        for await (let mtc of mtcList) {
          row.push(
            new ButtonBuilder()
              .setCustomId(`mtc-button-${mtc._id}`)
              .setLabel(mtc.name)
              .setStyle(mtc.color)
          );
          if (row.length == 5) {
            rows.push(new ActionRowBuilder().addComponents(row));
            row = [];
          }
        }

        if (row.length) {
          rows.push(new ActionRowBuilder().addComponents(row));
        }

        if (add_buttons_description) {
          message += `\n### Description\n`;
          message += mtcList.map((mtc) => `> **${mtc.name}** - *${mtc.description}*\n`).join("");
        }

        const embedMessage = new EmbedBuilder()
          .setColor("#2c97fc")
          .setTitle(`Multi Thread Creator`)
          .setDescription(`${message}`);

        await interaction.channel.send({
          embeds: [embedMessage],
          components: rows,
        });

        await interaction.reply({ content: `> Embed created!`, ephemeral: true });
      } catch (err) {
        console.error(err);
        return await interaction.followUp({
          content: `[h534h45] There was a Database error. Please try again later.`,
          ephemeral: true,
        });
      }
    }
  },
  async autoload(client) {
    client.on("interactionCreate", async (interaction) => {
      if (!interaction.isButton()) return;

      const clickedButton = interaction.customId;

      if (!clickedButton.startsWith("mtc-button-")) {
        return;
      }

      let manager_perms = false;

      try {
        if (interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
          manager_perms = true;
        }

        const interactionUser = await interaction.guild.members.fetch(interaction.user.id, {
          force: true,
        });

        if (!manager_perms) {
          const managerRoles = await MultiThreadsCreatorSettings.findOne({
            gid: interaction.guildId,
          });

          for await (const role of managerRoles.allowedRoles) {
            if (interactionUser.roles.cache.has(role)) {
              manager_perms = true;
            }
          }
        }

        if (!manager_perms) {
          return await interaction.reply({
            content: `> *You don't have permissions to use that button.*`,
            ephemeral: true,
          });
        }

        if (clickedButton.startsWith("mtc-button-")) {
          const buttonId = clickedButton.split("-")[2];

          const mtrEntry = await MultiThreadsCreator.findOne({
            gid: interaction.guildId,
            _id: buttonId,
          });

          if (!mtrEntry) {
            return await interaction.reply({
              content: `> Entry doesn't exist in database.`,
              ephemeral: true,
            });
          }

          const modal = new ModalBuilder()
            .setTitle("Create Multiple Threads")
            .setCustomId(`mtc-modal-${mtrEntry._id}`);

          const threadTitle = new TextInputBuilder()
            .setCustomId("mtc-modal-thread_title")
            .setLabel(`New threads title for: ${mtrEntry.name}`)
            .setPlaceholder("Threads title")
            .setStyle(TextInputStyle.Short)
            .setMinLength(3)
            .setMaxLength(50)
            .setRequired(true);

          const modalActionRow = new ActionRowBuilder().addComponents(threadTitle);

          modal.addComponents(modalActionRow);

          await interaction.showModal(modal);
        }
      } catch (err) {
        console.error(err);
        return await interaction.reply({
          content: `[h0jk2] There was a Database error. Please try again later.`,
          ephemeral: true,
        });
      }
    });
    client.on("interactionCreate", async (interaction) => {
      if (!interaction.isModalSubmit()) return;

      const modalSent = interaction.customId;

      if (!modalSent.startsWith("mtc-modal-")) {
        return;
      }

      if (modalSent.startsWith("mtc-modal-")) {
        const modalId = modalSent.split("-")[2];
        try {
          const mtrEntry = await MultiThreadsCreator.findOne({
            gid: interaction.guildId,
            _id: modalId,
          });

          if (!mtrEntry) {
            return await interaction.reply({
              content: `> Entry doesn't exist in database.`,
              ephemeral: true,
            });
          }

          const threadTitle = await interaction.fields.getTextInputValue("mtc-modal-thread_title");

          let createdThreads = [];

          for await (const channelId of mtrEntry.channels) {
            const channel = await interaction.guild.channels.cache.find((c) => c.id == channelId);

            if (channel) {
              if (channel.type == ChannelType.GuildForum) {
                //const postedMessage = await channel.send({ content: threadTitle });
                const createdThread = await channel.threads.create({
                  name: threadTitle,
                  autoArchiveDuration: ThreadAutoArchiveDuration.OneDay,
                  message: {
                    content: `${threadTitle} - ${mtrEntry?.defaultContent}`,
                  },
                  reason: `Multi Threads Creator`,
                });

                createdThreads.push({ channel: channelId, thread: createdThread });
              } else if (channel.type == ChannelType.GuildText) {
                if (!mtrEntry.isPrivate) {
                  const postedMessage = await channel.send({ content: threadTitle });

                  const createdThread = await postedMessage.startThread({
                    name: threadTitle,
                    autoArchiveDuration: ThreadAutoArchiveDuration.OneDay,
                    reason: `Multi Threads Creator`,
                  });

                  if (mtrEntry?.defaultContent?.length > 3) {
                    await createdThread.send(mtrEntry?.defaultContent);
                  }

                  createdThreads.push({ channel: channelId, thread: createdThread });
                } else {
                  const createdThread = await channel.threads.create({
                    name: threadTitle,
                    autoArchiveDuration: ThreadAutoArchiveDuration.OneDay,
                    type: ChannelType.PrivateThread,
                    message: `${threadTitle} - ${mtrEntry?.defaultContent}`,
                    reason: `Multi Threads Creator`,
                  });

                  await createdThread.members.add(interaction.user.id);

                  if (mtrEntry?.defaultContent.length > 3) {
                    await createdThread.send(mtrEntry?.defaultContent);
                  }

                  createdThreads.push({ channel: channelId, thread: createdThread });
                }
              }
            }
          }

          await interaction.reply({
            content: `> Created **${createdThreads.length}** thread(s):\n${createdThreads
              .map((t) => `> <#${t.channel}> ${t.thread}`)
              .join("\n")}`,
            ephemeral: true,
          });
        } catch (err) {
          console.error(err);
          return await interaction.reply({
            content: `[3gffds] There was a Database error. Please try again later.`,
            ephemeral: true,
          });
        }
      }
    });
  },
};

module.exports = { MultiThreadsCreatorCommands };
