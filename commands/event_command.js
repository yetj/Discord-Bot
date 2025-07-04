const {
  SlashCommandBuilder,
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
  MessageFlags,
  ThreadAutoArchiveDuration,
} = require("discord.js");
const { EventConfig, Events, EventTemplates } = require("../dbmodels/events");
const isUrl = require("../utils/isUrl");
const interactiveForm = require("../utils/interactiveForm");
const getDisplayName = require("../utils/getDisplayName");
const extractUniqueMembers = require("../utils/extractUniqueMembers");
const extractUniqueRoles = require("../utils/extractUniqueRoles");
const isValidDate = require("../utils/isValidDate");

const Event_Command = {
  data: new SlashCommandBuilder()
    .setName("event")
    .setDescription("Event management commands")
    .addSubcommandGroup((group) =>
      group
        .setName("template")
        .setDescription("Options for managing event templates")
        .addSubcommand((subcommand) =>
          subcommand
            .setName("create")
            .setDescription("Create a new event template")
            .addStringOption((option) =>
              option
                .setName("name")
                .setDescription("Template name")
                .setMaxLength(32)
                .setRequired(true)
            )
            .addStringOption((option) =>
              option
                .setName("method")
                .setDescription("Method of creating Template (default: simple)")
                .addChoices(
                  { name: "Simple", value: "simple" },
                  { name: "Advanced", value: "advanced" }
                )
            )
            .addStringOption((option) =>
              option.setName("image").setDescription("Link to the image")
            )
            .addStringOption((option) =>
              option.setName("build").setDescription("Link to the builds")
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("edit")
            .setDescription("Edit an existing event template")
            .addStringOption((option) =>
              option
                .setName("event_template_id")
                .setDescription("Template name")
                .setAutocomplete(true)
                .setRequired(true)
            )
            .addStringOption((option) =>
              option
                .setName("name")
                .setDescription("Template name")
                .setMinLength(2)
                .setMaxLength(32)
            )
            .addStringOption((option) =>
              option.setName("image").setDescription("Link to the image")
            )
            .addStringOption((option) =>
              option.setName("build").setDescription("Link to the builds")
            )
            .addBooleanOption((option) =>
              option
                .setName("skip_updating_roles")
                .setDescription("Skip updating roles? (default: true)")
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("preview")
            .setDescription("Preview an event template")
            .addStringOption((option) =>
              option
                .setName("event_template_id")
                .setDescription("Template name")
                .setAutocomplete(true)
                .setRequired(true)
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("delete")
            .setDescription("Delete an event template")
            .addStringOption((option) =>
              option
                .setName("event_template_id")
                .setDescription("Template name")
                .setAutocomplete(true)
                .setRequired(true)
            )
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("create_advanced")
        .setDescription("Create a new event from template")
        .addStringOption((option) =>
          option.setName("name").setDescription("Event name").setMaxLength(32).setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("event_template_id")
            .setDescription("Template name")
            .setAutocomplete(true)
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("start_date")
            .setDescription("Start date in format YYYY-MM-DD HH:MM or HH:MM if today")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("message_content")
            .setDescription("Custom message content for the event with mentions")
        )
        .addChannelOption((option) =>
          option
            .setName("event_channel")
            .setDescription("Channel where the event will be created")
            .addChannelTypes(ChannelType.GuildText)
        )
        .addBooleanOption((option) =>
          option.setName("allow_late_join").setDescription("Allow for late join? (default: true)")
        )
        .addNumberOption((option) =>
          option
            .setName("late_join_limit")
            .setDescription("How long after start date users can still sign-up? (default: 15)")
            .setMaxValue(60)
        )
        .addBooleanOption((option) =>
          option
            .setName("own_description")
            .setDescription("Provide own event description (default: false)")
        )
        .addStringOption((option) =>
          option.setName("own_image_url").setDescription("Custom image URL for the event")
        )
        .addStringOption((option) =>
          option.setName("own_build_url").setDescription("Custom build URL for the event")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("create").setDescription("Create a new simple event with interactive form")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("edit")
        .setDescription("Edit an event")
        .addStringOption((option) =>
          option
            .setName("event_id")
            .setDescription("Event ID")
            .setAutocomplete(true)
            .setRequired(true)
        )
        .addStringOption((option) =>
          option.setName("name").setDescription("Event name").setMaxLength(32)
        )
        .addBooleanOption((option) =>
          option
            .setName("description")
            .setDescription("Event description (you will be asked to provide it later)")
        )
        .addStringOption((option) =>
          option
            .setName("message_content")
            .setDescription("Custom message content for the event with mentions")
        )
        .addStringOption((option) =>
          option
            .setName("start_date")
            .setDescription("Start date in format YYYY-MM-DD HH:MM or HH:MM if today")
        )
        .addBooleanOption((option) =>
          option.setName("allow_late_join").setDescription("Allow for late join? (default: true)")
        )
        .addNumberOption((option) =>
          option
            .setName("late_join_limit")
            .setDescription("How long after start date users can still sign-up? (default: 15)")
            .setMaxValue(60)
        )
        .addUserOption((option) => option.setName("organizer").setDescription("Event Organizer"))

        .addStringOption((option) => option.setName("image_url").setDescription("Event image URL"))
        .addStringOption((option) => option.setName("build_url").setDescription("Event build URL"))
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("reload")
        .setDescription("Reload an event")
        .addStringOption((option) =>
          option
            .setName("event_id")
            .setDescription("Event ID")
            .setAutocomplete(true)
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("delete")
        .setDescription("Delete an event")
        .addStringOption((option) =>
          option
            .setName("event_id")
            .setDescription("Event name")
            .setAutocomplete(true)
            .setRequired(true)
        )
    ),
  async execute(interaction) {
    let manager_perms = false;
    let creator_perms = false;
    let helper_perms = false;
    let configEvent;

    if (interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
      manager_perms = true;
      creator_perms = true;
      helper_perms = true;
    }

    try {
      configEvent = await EventConfig.findOne({
        gid: interaction.guildId,
      });

      if (!configEvent || configEvent.enabled == false) {
        return await interaction.reply({
          content: `> Event feature is **disabled**.`,
          ephemeral: true,
        });
      }

      const interactionUser = await interaction.guild.members.fetch(interaction.user.id, {
        cache: true,
        force: true,
      });

      if (!manager_perms) {
        configEvent.manager_roles.forEach((role) => {
          if (interactionUser.roles.cache.has(role)) {
            manager_perms = true;
            creator_perms = true;
            helper_perms = true;
          }
        });
      }

      if (!creator_perms) {
        configEvent.creator_roles.forEach((role) => {
          if (interactionUser.roles.cache.has(role)) {
            creator_perms = true;
            helper_perms = true;
          }
        });
      }

      if (!helper_perms) {
        configEvent.helper_roles.forEach((role) => {
          if (interactionUser.roles.cache.has(role)) {
            helper_perms = true;
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

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    if (interaction.options.getSubcommandGroup() === "template") {
      if (interaction.options.getSubcommand() === "create") {
        if (!creator_perms) {
          return await interaction.followUp({
            content: `> You don't have permissions to create event templates.`,
            ephemeral: true,
          });
        }

        const name = interaction.options.getString("name");
        const method = interaction.options.getString("method") ?? "simple";
        const image_url = interaction.options.getString("image") ?? null;
        const build_url = interaction.options.getString("build") ?? null;

        const interactionUser = await interaction.guild.members.fetch(interaction.user.id, {
          force: true,
        });

        if (image_url && !isUrl(image_url)) {
          return await interaction.followUp({
            content: `> Invalid image URL. Please provide a valid URL.`,
            ephemeral: true,
          });
        }

        if (build_url && !isUrl(build_url)) {
          return await interaction.followUp({
            content: `> Invalid build URL. Please provide a valid URL.`,
            ephemeral: true,
          });
        }

        const questions = [
          {
            id: "description",
            title: "Event Description",
            description: "Description of the event.",
            type: "text",
            isRaw: true,
            canBeSkipped: true,
          },
        ];

        if (method === "advanced") {
          questions.push({
            id: "roles",
            title: "Advanced Roles",
            description:
              "Please write roles that will be used in this event. Each role in new line.\nProvide each role in new line in format:\n`a/b/c/d/e/f/g/h/i`\nExample:\n`1/Role Name/1/1/1/🛡️/@Caller//<@1231423423>`\nWhere:\n`a` - role position from 1 to 99\n`b` - role name\n`c` - party number\n`d` - max participants (default: 1) | *(0 - no limit)*\n`e` - is that limit strict? if yes only provided number of participants can signup for that role (default: 1) *(0 - no, 1 - yes)*\n`f` - emoji assigned to that role (default: no emoji)\n`g` - required roles to be able to signup (default: empty) *(you need to mention all discord roles that can assign to that role)*\n`h` - requiured positions (default: empty) *you can provide here which positions has to be filled firstly, before users can signup for that role*\n`i` - pre signed up members (default: empty) *you can mentioin any member that you want to pre signup for the event*",
            type: "text",
            isRaw: true,
            allowFiles: true,
          });
        } else if (method === "simple") {
          questions.push({
            id: "roles",
            title: "Simple Roles",
            description:
              "Please write roles that will be used in this event. Each role name in new line.\nYou can pre assign member to the event by adding / after the role name and mention the member you want to pre signup.\nExample:\n`Role Name / @yetj`",
            type: "text",
            isRaw: true,
          });
        }

        let callbackFunction = async (answers) => {
          try {
            const { parsedRoles, errors } = await this.parseRoles(
              interaction,
              method === "simple",
              answers["roles"] ?? ""
            );

            if (errors.length > 0) {
              let message = `There were some errors while parsing roles:\n`;
              if (errors.length > 0) {
                message += "> " + errors.join("\n> ");
              }

              const embedMessage = new EmbedBuilder()
                .setColor(`#DB0000`)
                .setTitle(`Errors`)
                .setDescription(message);

              await interaction.followUp({ embeds: [embedMessage], ephemeral: true });
            }

            const newTemplate = await new EventTemplates({
              gid: interaction.guildId,
              name: name,
              description: answers["description"] ?? "",
              messageContent: answers["content_message"] ?? "",
              authorId: interaction.user.id,
              authorName: getDisplayName(interactionUser),
              isSimple: method === "simple",
              imageUrl: image_url ?? "",
              buildUrl: build_url ?? "",
              roles: parsedRoles,
            });
            await newTemplate.save();

            let message = `> Event template named **${name}** created.\n*You can preview it using \`/event template preview\`*`;

            const embedMessage = new EmbedBuilder()
              .setColor(`#00DB19`)
              .setTitle(`Event template created`)
              .setDescription(message);

            await interaction.deleteReply();

            await interaction.followUp({ embeds: [embedMessage] });
          } catch (err) {
            console.error(err);
            return await interaction.followUp({
              content: `> [282a03] Error while creating new event template. Please try again later.`,
              ephemeral: true,
            });
          }
        };

        await interactiveForm("template_create", interaction, questions, callbackFunction);
      } else if (interaction.options.getSubcommand() === "edit") {
        if (!creator_perms) {
          return await interaction.followUp({
            content: `> You don't have permissions to create event templates.`,
            flags: MessageFlags.Ephemeral,
          });
        }

        const event_template_id = interaction.options.getString("event_template_id");
        const name = interaction.options.getString("name") ?? null;
        const image_url = interaction.options.getString("image") ?? null;
        const build_url = interaction.options.getString("build") ?? null;
        const skip_updating_roles = interaction.options.getBoolean("skip_updating_roles") ?? true;

        if (name && name.length > 32) {
          return await interaction.followUp({
            content: `> Template name is too long. Maximum length is 32 characters.`,
            flags: MessageFlags.Ephemeral,
          });
        }

        if (image_url && !isUrl(image_url)) {
          return await interaction.followUp({
            content: `> Invalid image URL. Please provide a valid URL.`,
            flags: MessageFlags.Ephemeral,
          });
        }

        if (build_url && !isUrl(build_url)) {
          return await interaction.followUp({
            content: `> Invalid build URL. Please provide a valid URL.`,
            flags: MessageFlags.Ephemeral,
          });
        }

        try {
          const eventTemplate = await EventTemplates.findOne({
            $and: [{ gid: interaction.guildId }, { _id: event_template_id }],
          });

          if (!eventTemplate) {
            return await interaction.followUp({
              content: `> Event template with ID \`${event_template_id}\` not found.`,
              flags: MessageFlags.Ephemeral,
            });
          }

          if (eventTemplate.authorId !== interaction.user.id && !manager_perms) {
            return await interaction.followUp({
              content: `> You don't have permission to edit this event template.`,
              flags: MessageFlags.Ephemeral,
            });
          }

          if (name) {
            eventTemplate.name = name;
          }

          if (image_url) {
            eventTemplate.imageUrl = image_url;
          }

          if (build_url) {
            eventTemplate.buildUrl = build_url;
          }

          const questions = [
            {
              id: "description",
              title: "Event Description",
              description: "Description of the event.",
              type: "text",
              isRaw: true,
              currentValue: eventTemplate.description,
              canBeSkipped: true,
            },
            {
              id: "content_message",
              title: "Event Content Message",
              description:
                "Content message of the event. You can use mentions here. This message will be sent when event is created.",
              type: "text",
              isRaw: true,
              currentValue: eventTemplate.contentMessage,
              canBeSkipped: true,
            },
          ];

          if (skip_updating_roles === false) {
            if (eventTemplate.isSimple === false) {
              questions.push({
                id: "roles",
                title: "Advanced Roles",
                description:
                  "Please write roles that will be used in this event. Each role in new line.\nProvide each role in new line in format:\n`a/b/c/d/e/f/g/h/i`\nExample:\n`1/Role Name/1/1/1/🛡️/@Caller//<@1231423423>`\nWhere:\n`a` - role position from 1 to 99\n`b` - role name\n`c` - party number\n`d` - max participants (default: 1) | *(0 - no limit)*\n`e` - is that limit strict? if yes only provided number of participants can signup for that role (default: 1) *(0 - no, 1 - yes)*\n`f` - emoji assigned to that role (default: no emoji)\n`g` - required roles to be able to signup (default: empty) *(you need to mention all discord roles that can assign to that role)*\n`h` - requiured positions (default: empty) *you can provide here which positions has to be filled firstly, before users can signup for that role*\n`i` - pre signed up members (default: empty) *you can mentioin any member that you want to pre signup for the event*",
                type: "text",
                isRaw: true,
                currentValue: await this.unparseRoles(eventTemplate.roles, eventTemplate.isSimple),
                allowFiles: true,
              });
            } else if (eventTemplate.isSimple === true) {
              questions.push({
                id: "roles",
                title: "Simple Roles",
                description:
                  "Please write roles that will be used in this event. Each role name in new line.\nYou can pre assign member to the event by adding / after the role name and mention the member you want to pre signup.\nExample:\n`Role Name / @yetj`",
                type: "text",
                isRaw: true,
                currentValue: await this.unparseRoles(eventTemplate.roles, eventTemplate.isSimple),
              });
            }
          }

          let callbackFunction = async (answers) => {
            eventTemplate.description = answers?.description ?? eventTemplate.description;
            eventTemplate.contentMessage = answers?.content_message ?? eventTemplate.contentMessage;

            if (skip_updating_roles === false) {
              const { parsedRoles, errors } = await this.parseRoles(
                interaction,
                eventTemplate.isSimple,
                answers["roles"] ?? ""
              );

              if (errors.length > 0) {
                let message = `There were some errors while parsing roles:\n`;
                if (errors.length > 0) {
                  message += "> " + errors.join("\n> ");
                }

                const embedMessage = new EmbedBuilder().setColor(`#DB0000`).setTitle(`Errors`);
                await interaction.followUp({ embeds: [embedMessage], ephemeral: true });
              }

              eventTemplate.roles = parsedRoles;
            }
            await eventTemplate.save();

            let message = `> Event template **${eventTemplate.name}** has been edited successfully.`;

            const embedMessage = new EmbedBuilder()
              .setColor(`#00DB19`)
              .setTitle(`Event template edited`)
              .setDescription(message);

            return await interaction.followUp({ embeds: [embedMessage] });
          };

          await interactiveForm("template_edit", interaction, questions, callbackFunction);
        } catch (err) {
          console.error(err);
          return await interaction.followUp({
            content: `> [f53533] Error occurred while editing event template. Please try again later.`,
            flags: MessageFlags.Ephemeral,
          });
        }
      } else if (interaction.options.getSubcommand() === "preview") {
        if (!creator_perms) {
          return await interaction.followUp({
            content: `> You don't have permissions to preview event templates.`,
            flags: MessageFlags.Ephemeral,
          });
        }

        const event_template_id = interaction.options.getString("event_template_id");

        try {
          const eventTemplate = await EventTemplates.findOne({
            $and: [{ gid: interaction.guildId }, { _id: event_template_id }],
          });

          if (!eventTemplate) {
            return await interaction.followUp({
              content: `> Event template with ID \`${event_template_id}\` not found.`,
              flags: MessageFlags.Ephemeral,
            });
          }

          const embeds = await this.eventEmbeds(eventTemplate);

          return await interaction.followUp({
            content: `Preview of the event:`,
            embeds: embeds,
            flags: MessageFlags.Ephemeral,
          });
        } catch (err) {
          console.error(err);
          return await interaction.followUp({
            content: `> [3bf7f7] Error occurred while previewing event template. Please try again later.`,
            flags: MessageFlags.Ephemeral,
          });
        }
      } else if (interaction.options.getSubcommand() === "delete") {
        if (!creator_perms) {
          return await interaction.followUp({
            content: `> You don't have permissions to delete event templates.`,
            flags: MessageFlags.Ephemeral,
          });
        }

        const event_template_id = interaction.options.getString("event_template_id");

        try {
          const eventTemplate = await EventTemplates.findOne({
            $and: [{ gid: interaction.guildId }, { _id: event_template_id }],
          });

          if (!eventTemplate) {
            return await interaction.followUp({
              content: `> Event template with ID \`${event_template_id}\` not found.`,
              flags: MessageFlags.Ephemeral,
            });
          }

          if (eventTemplate.authorId !== interaction.user.id && !manager_perms) {
            return await interaction.followUp({
              content: `> You don't have permission to delete this event template.`,
              flags: MessageFlags.Ephemeral,
            });
          }

          await EventTemplates.deleteOne({ gid: interaction.guildId, _id: event_template_id });

          const embedMessage = new EmbedBuilder()
            .setColor(`#00DB19`)
            .setTitle(`Event template deleted`)
            .setDescription(
              `Event template **${eventTemplate.name}** has been deleted successfully.`
            );
          return await interaction.followUp({ embeds: [embedMessage] });
        } catch (err) {
          console.error(err);
          return await interaction.followUp({
            content: `> [18507c] Error occurred while deleting event template. Please try again later.`,
            ephemeral: true,
          });
        }
      }
    } else if (interaction.options.getSubcommand() === "create_advanced") {
      if (!creator_perms) {
        return await interaction.followUp({
          content: `> You don't have permissions to create events.`,
          ephemeral: true,
        });
      }

      const channel = interaction.channel;

      const name = interaction.options.getString("name");
      const event_template_id = interaction.options.getString("event_template_id");
      const start_date = interaction.options.getString("start_date");
      const allow_late_join = interaction.options.getBoolean("allow_late_join") ?? true;
      const late_join_limit = interaction.options.getNumber("late_join_limit") ?? null;
      const own_description = interaction.options.getBoolean("own_description") ?? false;
      const own_image_url = interaction.options.getString("own_image_url") ?? null;
      const own_build_url = interaction.options.getString("own_build_url") ?? null;
      const event_channel = interaction.options.getChannel("event_channel") ?? channel;
      const message_content = interaction.options.getString("message_content") ?? null;

      if (name.length > 20) {
        return await interaction.followUp({
          content: `> Event name is too long. Maximum length is 20 characters.`,
          ephemeral: true,
        });
      }

      let event_date_timestamp = null;
      if (isValidDate(start_date, "YYYY-MM-DD HH:mm")) {
        event_date_timestamp = new Date(start_date).getTime();
      } else if (isValidDate(start_date, "HH:mm")) {
        const [hour, minute] = start_date.split(":").map(Number);
        let now = new Date();
        event_date_timestamp = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          hour,
          minute
        ).getTime();
      } else {
        return await interaction.followUp({
          content: `> Invalid date format. Please use \`YYYY-MM-DD HH:MM\` or \`HH:MM\` for today.`,
          ephemeral: true,
        });
      }

      if (event_date_timestamp < Date.now()) {
        return await interaction.followUp({
          content: `> Event date cannot be in the past. Please provide a valid date.`,
          ephemeral: true,
        });
      }

      if (late_join_limit && (late_join_limit < 1 || late_join_limit > 60)) {
        return await interaction.followUp({
          content: `> Late join limit must be between 1 and 60 minutes.`,
          ephemeral: true,
        });
      }

      if ((!allow_late_join || allow_late_join === false) && late_join_limit) {
        return await interaction.followUp({
          content: `> If you want to allow late join, you need to set \`allow_late_join\` to true.`,
          ephemeral: true,
        });
      }

      if (own_image_url && !isUrl(own_image_url)) {
        return await interaction.followUp({
          content: `> Image URL is not valid.`,
          ephemeral: true,
        });
      }

      if (own_build_url && !isUrl(own_build_url)) {
        return await interaction.followUp({
          content: `> Build URL is not valid.`,
          ephemeral: true,
        });
      }

      let own_description_text = null;
      if (own_description && own_description === true) {
        const embedOwnDesc = new EmbedBuilder()
          .setColor(`#ddec51`)
          .setTitle(`Own Description`)
          .setDescription(`> Please provide your own description for the event.`);

        await interaction.followUp({ embeds: [embedOwnDesc], ephemeral: true });

        const filter = (m) => m.author.id === interaction.user.id;

        own_description_text = await new Promise((resolve) => {
          const collector = channel.createMessageCollector({ filter, time: 120000 });

          collector.on("collect", async (msg) => {
            embedOwnDesc.setDescription(`Provided description:\n\n ${msg.content}`);
            await interaction.editReply({ embeds: [embedOwnDesc] });

            resolve(msg.content);

            try {
              await msg.delete();
            } catch (err) {
              console.error(`[8f958f-${formName}] Can't remove message: \`${err.message}\``);
            }

            collector.stop();
          });

          collector.on("end", (collected) => {
            if (collected.size === 0) {
              resolve(null); // or set a default/fallback value
            }
          });
        });

        if (!own_description_text) {
          return await interaction.followUp({
            content: `> You didn't provide a description. Please try again.`,
            ephemeral: true,
          });
        }
      }

      try {
        const eventTemplate = await EventTemplates.findOne({
          $and: [{ gid: interaction.guildId }, { _id: event_template_id }],
        });

        if (!eventTemplate) {
          return await interaction.followUp({
            content: `> Event template with ID \`${event_template_id}\` not found.`,
            ephemeral: true,
          });
        }

        const interactionUser = await interaction.guild.members.fetch(interaction.user.id, {
          force: true,
        });

        let { newEvent, createdThread } = await new Promise(async (resolve) => {
          const newEvent = new Events({
            gid: interaction.guildId,
            name: name,
            description: own_description_text ?? eventTemplate.description,
            messageContent: message_content ?? eventTemplate.messageContent,
            startDate: event_date_timestamp ? new Date(event_date_timestamp) : null,
            imageUrl: own_image_url ?? eventTemplate.imageUrl,
            buildUrl: own_build_url ?? eventTemplate.buildUrl,
            allowLateJoin: allow_late_join ?? true,
            lateJoinLimit: late_join_limit ?? 15,
            organizerId: interaction.user.id,
            organizerName: getDisplayName(interactionUser),
            usedTemplateId: eventTemplate._id.toString(),
            participantCount: eventTemplate.roles.reduce(
              (sum, role) => sum + (role.participants ? role.participants.length : 0),
              0
            ),
            roles: eventTemplate.roles,
          });

          await newEvent.save();

          const embeds = await this.eventEmbeds(newEvent);

          let eventMessage;
          if (message_content) {
            eventMessage = await event_channel.send({
              content: message_content,
              embeds: embeds,
            });
          } else {
            eventMessage = await event_channel.send({
              embeds: embeds,
            });
          }

          newEvent.channelId = event_channel.id;
          newEvent.messageId = eventMessage.id;

          let threadContent = ``;
          threadContent += `## **__Event instructions:__**\n`;
          threadContent += `➡️ To **sign-up** for the event, please post a role number on this thread. Role number can be found in the event message between brackets \`┊N┊\` where N is a role number\n> Example: \`1\`\n`;
          threadContent += `➡️ To **sign-out** from the event, please type \`-\` on this thread.\n> Example: \`-\`\n`;

          threadContent += `## **__Event advanced usage (only for helpers and event organizers):__**\n`;
          threadContent += `➡️ To **sign-up** someone else for the event, please type a role number and mention the user.\n> Example: \`1 @user\`\n`;
          threadContent += `➡️ To **sign-out** someone else from the event, please type \`-\` and mention the user.\n> Example: \`- @user\`\n`;
          threadContent += `➡️ To **sign-out** someone else from the event with a **"Miss" reason**, please type \`miss\` and mention the user.\n> Example: \`miss @user\`\n`;
          threadContent += `➡️ To **sign-out** someone else from the event with a **"MOR" reason**, please type \`mor\` and mention the user.\n> Example: \`mor @user\`\n`;
          threadContent += `*You can mention multiple users at the same time.*`;

          const embedMessageInstructions = new EmbedBuilder()
            .setColor(`#c3ff37`)
            .setDescription(threadContent);

          const createdThread = await eventMessage.startThread({
            name: `${newEvent.name} #${newEvent.event_id}`,
            autoArchiveDuration: ThreadAutoArchiveDuration.ThreeDays,
            reason: `Event thread created`,
          });

          await createdThread.send({ embeds: [embedMessageInstructions] });

          await newEvent.save();

          resolve({ newEvent, createdThread });
        });
        const embedMessage = new EmbedBuilder()
          .setColor(`#00DB19`)
          .setTitle(`Event created`)
          .setDescription(
            `Event **${newEvent.name}** has been created successfully you can signup for it here ${createdThread}.`
          );

        await interaction.deleteReply();

        return await interaction.followUp({ embeds: [embedMessage], ephemeral: true });
      } catch (err) {
        console.error(err);
        return await interaction.followUp({
          content: `> [5cec5e] Error occurred while creating event. Please try again later.`,
          ephemeral: true,
        });
      }
    } else if (interaction.options.getSubcommand() === "edit") {
      if (!creator_perms) {
        return await interaction.followUp({
          content: `> You don't have permissions to edit events.`,
          ephemeral: true,
        });
      }

      const channel = interaction.channel;

      const event_id = interaction.options.getString("event_id");
      const name = interaction.options.getString("name") ?? null;
      const description = interaction.options.getBoolean("description") ?? false;
      const start_date = interaction.options.getString("start_date") ?? null;
      const allow_late_join = interaction.options.getBoolean("allow_late_join") ?? null;
      const late_join_limit = interaction.options.getNumber("late_join_limit") ?? null;
      const organizer = interaction.options.getUser("organizer") ?? null;
      const image_url = interaction.options.getString("image_url") ?? null;
      const build_url = interaction.options.getString("build_url") ?? null;
      const message_content = interaction.options.getString("message_content") ?? null;

      if (name && name.length > 20) {
        return await interaction.followUp({
          content: `> Event name is too long. Maximum length is 20 characters.`,
          ephemeral: true,
        });
      }

      let event_date_timestamp = null;
      if (start_date) {
        if (isValidDate(start_date, "YYYY-MM-DD HH:mm")) {
          event_date_timestamp = new Date(start_date).getTime();
        } else if (isValidDate(start_date, "HH:mm")) {
          const [hour, minute] = start_date.split(":").map(Number);
          let now = new Date();
          event_date_timestamp = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            hour,
            minute
          ).getTime();
        } else {
          return await interaction.followUp({
            content: `> Invalid date format. Please use \`YYYY-MM-DD HH:MM\` or \`HH:MM\` for today.`,
            ephemeral: true,
          });
        }

        if (event_date_timestamp < Date.now()) {
          return await interaction.followUp({
            content: `> Event date cannot be in the past. Please provide a valid date.`,
            ephemeral: true,
          });
        }
      }

      if (late_join_limit && (late_join_limit < 1 || late_join_limit > 60)) {
        return await interaction.followUp({
          content: `> Late join limit must be between 1 and 60 minutes.`,
          ephemeral: true,
        });
      }

      if (organizer && organizer.id === interaction.user.id) {
        return await interaction.followUp({
          content: `> You cannot set yourself as the organizer.`,
          ephemeral: true,
        });
      }

      if (image_url && !isUrl(image_url)) {
        return await interaction.followUp({
          content: `> Image URL is not valid.`,
          ephemeral: true,
        });
      }

      if (build_url && !isUrl(build_url)) {
        return await interaction.followUp({
          content: `> Build URL is not valid.`,
          ephemeral: true,
        });
      }

      if (message_content && message_content.length > 2000) {
        return await interaction.followUp({
          content: `> Message content is too long. Please limit it to 2000 characters.`,
          ephemeral: true,
        });
      }

      let description_text = null;
      if (description && description === true) {
        const embedOwnDesc = new EmbedBuilder()
          .setColor(`#ddec51`)
          .setTitle(`New Description`)
          .setDescription(`> Please provide new description for the event.`);

        await interaction.followUp({ embeds: [embedOwnDesc], ephemeral: true });

        const filter = (m) => m.author.id === interaction.user.id;

        description_text = await new Promise((resolve) => {
          const collector = channel.createMessageCollector({ filter, time: 120000 });

          collector.on("collect", async (msg) => {
            embedOwnDesc.setDescription(`Provided description:\n\n ${msg.content}`);
            await interaction.editReply({ embeds: [embedOwnDesc] });

            resolve(msg.content);

            try {
              await msg.delete();
            } catch (err) {
              console.error(`[8f958f-${formName}] Can't remove message: \`${err.message}\``);
            }

            collector.stop();
          });

          collector.on("end", (collected) => {
            if (collected.size === 0) {
              resolve(null); // or set a default/fallback value
            }
          });
        });

        if (!description_text) {
          return await interaction.followUp({
            content: `> You didn't provide a description. Please try again.`,
            ephemeral: true,
          });
        }
      }

      try {
        const event = await Events.findOne({
          $and: [{ gid: interaction.guildId }, { _id: event_id }],
        });

        if (!event) {
          return await interaction.followUp({
            content: `> Event with ID \`${event_id}\` not found.`,
            ephemeral: true,
          });
        }

        if (event.organizerId !== interaction.user.id && !manager_perms) {
          return await interaction.followUp({
            content: `> You don't have permission to edit this event.`,
            ephemeral: true,
          });
        }

        if (name) {
          event.name = name;
        }

        if (description_text) {
          event.description = description_text;
        }

        if (message_content) {
          event.messageContent = message_content;
        }

        if (event_date_timestamp) {
          event.startDate = new Date(event_date_timestamp);
        }

        if (allow_late_join !== null) {
          event.allowLateJoin = allow_late_join;
        }

        if (late_join_limit !== null) {
          event.lateJoinLimit = late_join_limit;
        }

        if (organizer) {
          let organizerMember = await interaction.guild.members.fetch(organizer.id);
          event.organizerId = organizerMember.user.id;
          event.organizerName = getDisplayName(organizerMember);
        }

        if (image_url) {
          event.imageUrl = image_url;
        }

        if (build_url) {
          event.buildUrl = build_url;
        }

        await event.save();

        const embeds = await this.eventEmbeds(event);

        const channel = await interaction.guild.channels.cache
          .get(event.channelId)
          .messages.fetch(event.messageId);

        if (event.messageContent) {
          await channel.edit({
            content: event.messageContent,
            embeds: embeds,
          });
        } else {
          await channel.edit({ embeds: embeds });
        }

        const embedMessage = new EmbedBuilder()
          .setColor(`#00DB19`)
          .setTitle(`Event edited`)
          .setDescription(
            `Event **[${event.name}](https://discord.com/channels/${interaction.guild.id}/${event.channelId}/${event.messageId})** has been edited successfully.`
          );

        return await interaction.followUp({ embeds: [embedMessage], ephemeral: true });
      } catch (err) {
        console.error(err);
        return await interaction.followUp({
          content: `> [ecff4f] Error occurred while editing event. Please try again later.`,
          ephemeral: true,
        });
      }
    } else if (interaction.options.getSubcommand() === "reload") {
      if (!manager_perms) {
        return await interaction.followUp({
          content: `> You don't have permissions to reload events.`,
          ephemeral: true,
        });
      }

      const event_id = interaction.options.getString("event_id");

      try {
        // Reload the events from the database
        const event = await Events.findOne({ gid: interaction.guildId, _id: event_id });

        if (!event) {
          return await interaction.followUp({
            content: `> Event with ID \`${event_id}\` not found.`,
          });
        }

        await this.reloadEvent(interaction.guild, event);

        return await interaction.followUp({
          content: `> Events reloaded successfully.`,
          ephemeral: true,
        });
      } catch (err) {
        console.error(err);
        return await interaction.followUp({
          content: `> [b1c2d3] Error occurred while reloading events. Please try again later.`,
          ephemeral: true,
        });
      }
    } else if (interaction.options.getSubcommand() === "delete") {
      if (!creator_perms) {
        return await interaction.followUp({
          content: `> You don't have permissions to delete events.`,
          ephemeral: true,
        });
      }

      const event_id = interaction.options.getString("event_id");

      try {
        const event = await Events.findOne({
          $and: [{ gid: interaction.guildId }, { _id: event_id }],
        });

        if (!event) {
          return await interaction.followUp({
            content: `> Event with ID \`${event_id}\` not found.`,
            ephemeral: true,
          });
        }

        if (event.organizerId !== interaction.user.id && !manager_perms) {
          return await interaction.followUp({
            content: `> You don't have permission to delete this event.`,
            ephemeral: true,
          });
        }

        await Events.deleteOne({ gid: interaction.guildId, _id: event_id });

        const embedMessage = new EmbedBuilder()
          .setColor(`#00DB19`)
          .setTitle(`Event deleted`)
          .setDescription(`Event **${event.name}** has been deleted successfully.`);
        return await interaction.followUp({ embeds: [embedMessage], ephemeral: true });
      } catch (err) {
        console.error(err);
        return await interaction.followUp({
          content: `> [ffb78a] Error occurred while deleting event. Please try again later.`,
          ephemeral: true,
        });
      }
    } else if (interaction.options.getSubcommand() === "create") {
      const user = interaction.user;
      const channel = interaction.channel;

      const questions = [
        // {
        //   id: "name",
        //   title: "Event Name",
        //   description: "Name of the event.",
        //   type: "text",
        //   isRaw: true,
        // },
        // {
        //   id: "content_message",
        //   title: "Event Content message",
        //   description:
        //     "Content message of the event. You can use mentions here. This message will be sent when event is created.",
        //   type: "text",
        //   isRaw: true,
        //   canBeSkipped: true,
        // },
        // {
        //   id: "description",
        //   title: "Event Description",
        //   description: "Description of the event.",
        //   type: "text",
        //   isRaw: true,
        //   canBeSkipped: true,
        // },
        // {
        //   id: "event_type",
        //   title: "Event type",
        //   description:
        //     "Select the type of event you want to create. You can choose between following options:\n- `1 member to 1 role` - You can provide multiple roles, but only one member can sign up for each role.\n- `∞ members to 1 roles` - You can provide multiple roles, and multiple members can sign up for each role.",
        //   type: "select",
        //   options: [
        //     { label: "1 member to 1 role", value: "one_to_one" },
        //     { label: "∞ members to 1 role", value: "many_to_one" },
        //   ],
        // },
        {
          id: "start_date",
          title: "Event Start time",
          description:
            "When the event will start. Please use format: `YYYY-MM-DD HH:mm` or `HH:mm` for today.",
          type: "date",
          format: ["YYYY-MM-DD HH:mm", "HH:mm"],
        },
      ];

      let callbackFunction = async (answers) => {
        console.log(answers);
      };

      await interactiveForm("event_create", interaction, questions, callbackFunction);
    }
  },
  async autocomplete(interaction) {
    const focusedOption = interaction.options.getFocused(true);

    let choices = [];
    if (focusedOption.name === "event_template_id") {
      try {
        const eventTemplates = await EventTemplates.find({
          gid: interaction.guildId,
        }).sort({ name: 1 });

        for await (const entry of eventTemplates) {
          choices.push({
            name: `${entry.name} (${entry.authorName})`,
            value: entry._id.toString(),
          });
        }
      } catch (err) {
        console.error("[d3744f] ", err);
      }

      const filtered = choices.filter((choice) =>
        choice.name.toLowerCase().includes(focusedOption.value.toLowerCase())
      );
      const limitedResults = filtered.slice(0, 20);
      await interaction.respond(
        limitedResults.map((choice) => ({ name: choice.name, value: choice.value }))
      );
    }
    if (focusedOption.name === "event_id") {
      try {
        const now = new Date();
        const events = await Events.find({
          gid: interaction.guildId,
          $or: [
            {
              startDate: { $gte: now },
            },
            {
              $and: [
                {
                  allowLateJoin: true,
                },
                { startDate: { $lte: now } },
                {
                  $expr: {
                    $gt: [{ $add: ["$startDate", { $multiply: ["$lateJoinLimit", 60000] }] }, now],
                  },
                },
              ],
            },
          ],
        }).sort({ name: 1 });

        for await (const entry of events) {
          let name = `${entry.name} [#${entry.event_id}] (${entry.organizerName})`.substring(0, 32);
          choices.push({
            name: name,
            value: entry._id.toString(),
          });
        }
      } catch (err) {
        console.error("[d3744f] ", err);
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
  async autoload(client) {
    client.on("messageCreate", async (message) => {
      const { channelId, author, guild } = message;

      // check if message is not empty
      if (message.content.length === 0) return;

      // check if the message is from a bot
      if (author.bot) return;

      // check if the message is in a thread
      const channel = await guild.channels.fetch(channelId);
      if (!channel || !channel.isThread()) return;

      // check if the thread is created by the bot
      const owner = await guild.members.fetch(channel.ownerId);
      if (!owner || owner.user.id !== client.user.id) return;

      const messageMember = await guild.members.fetch(author.id, {
        force: true,
      });

      const content = message.content.trim();

      const matchSkip = /^skip\s*((?:<@!?\d+>\s*)+)$/i.exec(content);
      const matchMor = /^mor\s*((?:<@!?\d+>\s*)+)$/i.exec(content);
      const matchOut = /^-\s*((?:<@!?\d+>\s*)+)$/i.exec(content);
      const matchOutSelf = /^-\s*$/.exec(content);
      const matchIn = /^(\d{1,2})\s*((?:<@!?\d+>\s*)+)$/i.exec(content);
      const matchInSelf = /^(\d{1,2})$/.exec(content);

      let event;
      let configEvent;

      if (matchSkip || matchMor || matchOut || matchOutSelf || matchIn || matchInSelf) {
        try {
          configEvent = await EventConfig.findOne({
            gid: guild.id,
          });

          if (!configEvent || configEvent.enabled == false) {
            return;
          }

          event = await Events.findOne({
            gid: guild.id,
            messageId: channelId,
          });
        } catch (err) {
          console.error("[baee2b] Error while fetching event: ", err);
          return;
        }

        if (!event) {
          return;
        }
      } else {
        return;
      }

      const perms = await this.getPermissions(messageMember, configEvent);

      const now = new Date();

      // check if event already started and late join is not allowed and user is not a helper
      if (event.startDate < now && !event.allowLateJoin && !perms.helper) {
        return;
      }

      // check if event already started but late join is allowed
      const lateJoinEnd = event.startDate.getTime() + (event.lateJoinLimit || 0) * 60000;
      if (
        event.startDate < now &&
        event.allowLateJoin &&
        lateJoinEnd < now.getTime() &&
        !perms.helper
      ) {
        return;
      }

      if (event.organizerId === messageMember.user.id) {
        perms.creator = true;
        perms.helper = true;
      }

      // skip <user>, skip <user> <user> <user>
      // mor <user>, mor <user> <user> <user>
      // - <user>, - <user> <user> <user>
      if (matchSkip || matchMor || matchOut) {
        if (perms.helper === false) return;

        const match = matchSkip || matchMor || matchOut;

        const userIds = [...new Set([...match[1].matchAll(/<@!?(\d+)>/g)].map((m) => m[1]))];

        let responses = [];
        let summary = ``;

        for await (const userId of userIds) {
          const mentionedMember = await guild.members.fetch(userId, { force: true });

          if (!mentionedMember) {
            responses.push({
              success: false,
              message: `Member with ID \`${userId}\` not found.`,
            });
            continue;
          }

          if (await this.isSignedUp(event, mentionedMember)) {
            if (matchSkip) {
              responses.push(await this.signOut(guild, event, mentionedMember, "skip"));
            } else if (matchMor) {
              responses.push(await this.signOut(guild, event, mentionedMember, "mor"));
            } else if (matchOut) {
              responses.push(await this.signOut(guild, event, mentionedMember, "signed_out"));
            }
          } else if (await this.isSignedOut(event, mentionedMember)) {
            if (matchSkip) {
              responses.push(await this.signOutUpdateReason(guild, event, mentionedMember, "skip"));
            } else if (matchMor) {
              responses.push(await this.signOutUpdateReason(guild, event, mentionedMember, "mor"));
            } else if (matchOut) {
              responses.push(
                await this.signOutUpdateReason(guild, event, mentionedMember, "signed_out")
              );
            }
          }
        }

        let isAnyWrong = false;
        let isAnySuccess = false;
        for (const response of responses) {
          summary += `> ${response.success === true ? "✅" : "❌"} ${response.member} ${
            response.message
          }\n`;
          if (response.success === true) isAnySuccess = true;
          if (response.success === false) isAnyWrong = true;
        }

        const embedMessage = new EmbedBuilder().setDescription(summary);

        if (isAnySuccess === false && isAnyWrong === true) {
          await message.react("❌");
          embedMessage.setColor(`#eb5151`);
        } else if (isAnySuccess === true && isAnyWrong === false) {
          await message.react("✅");
          embedMessage.setColor(`#24da5b`);
        } else {
          await message.react("⚠️");
          embedMessage.setColor(`#f0c000`);
        }

        embedMessage.setFooter({ text: `Executed by: ${getDisplayName(messageMember)}` });

        return await message.reply({ embeds: [embedMessage] });
      }

      // -
      else if (matchOutSelf) {
        if (await this.isSignedUp(event, messageMember)) {
          let response = await this.signOut(guild, event, messageMember, "signed_out");

          const embedMessage = new EmbedBuilder().setDescription(response.message);

          if (response.success === false) {
            await message.react("❌");
            embedMessage.setColor(`#eb5151`);
          } else {
            await message.react("✅");
            embedMessage.setColor(`#24da5b`);
          }

          return await message.reply({ embeds: [embedMessage] });
        }
        if (await this.isSignedOut(event, messageMember)) {
          let response = `You are signed out already.`;

          const embedMessage = new EmbedBuilder().setDescription(response);
          embedMessage.setColor(`#eb5151`);
          await message.react("❌");

          return await message.reply({ embeds: [embedMessage] });
        }
      }

      // 23 <user>, 12 <user> <user> <user>
      else if (matchIn) {
        if (perms.helper === false) return;

        const number = Number(matchIn[1]);
        const userIds = [
          ...new Set([...(matchIn[2] || "").matchAll(/<@!?(\d+)>/g)].map((m) => m[1])),
        ];

        if (isNaN(number) || number < 1 || number > 99) return;

        let responses = [];
        let summary = ``;

        for await (const userId of userIds) {
          const mentionedMember = await guild.members.fetch(userId, { force: true });

          if (!mentionedMember) {
            responses.push({
              success: false,
              message: `Member with ID \`${userId}\` not found.`,
            });
            continue;
          }

          if (
            (await this.isSignedUp(event, mentionedMember)) ||
            (await this.isSignedOut(event, mentionedMember))
          ) {
            responses.push(await this.changeRole(guild, event, mentionedMember, number, perms));
          } else {
            responses.push(await this.signUp(guild, event, mentionedMember, number, perms));
          }
        }

        let isAnyWrong = false;
        let isAnySuccess = false;
        for (const response of responses) {
          summary += `> ${response.success === true ? "✅" : "❌"} ${response.member} ${
            response.message
          }\n`;
          if (response.success === true) isAnySuccess = true;
          if (response.success === false) isAnyWrong = true;
        }

        const embedMessage = new EmbedBuilder().setDescription(summary);

        if (isAnySuccess === false && isAnyWrong === true) {
          await message.react("❌");
          embedMessage.setColor(`#eb5151`);
        } else if (isAnySuccess === true && isAnyWrong === false) {
          await message.react("✅");
          embedMessage.setColor(`#24da5b`);
        } else {
          await message.react("⚠️");
          embedMessage.setColor(`#f0c000`);
        }

        embedMessage.setFooter({ text: `Executed by: ${getDisplayName(messageMember)}` });

        return await message.reply({ embeds: [embedMessage] });
      }

      // 5, 23, 23
      else if (matchInSelf) {
        const number = Number(matchInSelf[1]);

        if (isNaN(number) || number < 1 || number > 99) return;

        let response;

        if (
          (await this.isSignedUp(event, messageMember)) ||
          (await this.isSignedOut(event, messageMember))
        ) {
          response = await this.changeRole(guild, event, messageMember, number, perms);
        } else {
          response = await this.signUp(guild, event, messageMember, number, perms);
        }

        const embedMessage = new EmbedBuilder().setDescription(response.message);

        if (response.success === false) {
          await message.react("❌");
          embedMessage.setColor(`#eb5151`);
        } else {
          await message.react("✅");
          embedMessage.setColor(`#24da5b`);
        }

        return await message.reply({ embeds: [embedMessage] });
      }
    });
  },
  async firstFreeRoleNumber(usedRoleNumbers) {
    let roleNumber = 1;
    while (usedRoleNumbers.includes(roleNumber)) {
      roleNumber++;
    }
    return roleNumber;
  },
  async parseRoles(interaction, isSimple, data) {
    let roles = [];
    let errors = [];

    const roleLines = data?.split("\n") ?? [];
    if (isSimple === false) {
      let usedRoleNumbers = [];
      let signedUpParticipants = [];
      let participantNumber = 0;
      for (const line of roleLines) {
        const roleData = line.split("/");
        if (roleData.length === 9) {
          // Role number validation
          let roleNumber;
          try {
            roleNumber = parseInt(roleData[0]);
            if (isNaN(roleNumber) || roleNumber < 1 || roleNumber > 99) {
              throw new Error(`Invalid role number: ${roleData[0]}`);
            }
            usedRoleNumbers.push(roleNumber);
          } catch (err) {
            roleNumber = await this.firstFreeRoleNumber(usedRoleNumbers);
            usedRoleNumbers.push(roleNumber);
          }

          // Role name validation
          if (roleData[1].length === 0) {
            errors.push(`> Role name cannot be empty in line:\n\`${line}\``);
            continue;
          } else if (roleData[1].length > 50) {
            errors.push(`> Role name cannot be longer than 50 characters in line:\n\`${line}\``);
            continue;
          }

          // Party number validation
          let partyNumber;
          try {
            if (roleData[2].length === 0) {
              partyNumber = 0; // Default to 0 if not provided
            } else if (roleData[2].length > 0) {
              partyNumber = parseInt(roleData[2]);
            } else if (isNaN(partyNumber) || partyNumber < 0 || partyNumber > 99) {
              throw new Error(`Invalid party number: ${roleData[2]}`);
            }
          } catch (err) {
            errors.push(`> Invalid party number in line:\n\`${line}\``);
            continue;
          }

          // Max participants validation
          let maxParticipants = 1; // Default to 1 if not provided
          try {
            if (roleData[3].length === 0) {
              maxParticipants = 1; // Default to 1 if not provided
            } else if (roleData[3].length > 0) {
              maxParticipants = parseInt(roleData[3]);
            } else if (isNaN(maxParticipants) || maxParticipants < 0 || maxParticipants > 99) {
              throw new Error(`Invalid max participants: ${roleData[3]}`);
            }
          } catch (err) {
            errors.push(`> Invalid max participants in line:\n\`${line}\``);
            continue;
          }

          // Strict max validation
          let strictMax = true; // Default to true if not provided
          try {
            if (roleData[4].length === 0) {
              strictMax = true; // Default to true if not provided
            } else if (roleData[4].length > 0) {
              strictMax = parseInt(roleData[4]) === 1; // Convert to boolean
            } else if (isNaN(strictMax) || strictMax < 0 || strictMax > 1) {
              throw new Error(`Invalid strict max: ${roleData[4]}`);
            }
          } catch (err) {
            errors.push(`> Invalid strict max in line:\n\`${line}\``);
            continue;
          }

          // Emoji validation
          let emoji = "";
          // Discord custom emoji: <a:name:id> or <:name:id>
          const discordEmoji = /^<a?:\w+:\d+>$/;
          // Unicode emoji (covers most emojis)
          const unicodeEmoji = /^(?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F)$/u;
          if (discordEmoji.test(roleData[5]) || unicodeEmoji.test(roleData[5])) {
            emoji = roleData[5];
          }

          // Required roles validation
          let requiredRoles = [];

          if (roleData[6].length > 0) {
            requiredRoles = await extractUniqueRoles(roleData[6]);
          }

          // Required signed ups validation
          let requiredSignedUps = [];

          if (roleData[7].length > 0) {
            let signedUps = roleData[7].split(",");
            for (let signedUp of signedUps) {
              signedUp = signedUp.trim();
              if (signedUp) {
                try {
                  signedUp = parseInt(signedUp);
                  if (isNaN(signedUp) || signedUp < 1 || signedUp > 99) {
                    throw new Error(`Invalid required signed up number: ${signedUp}`);
                  }
                  requiredSignedUps.push(signedUp);
                } catch (err) {
                  errors.push(`> Invalid required signed up number in line:\n\`${line}\``);
                  continue;
                }
              }
            }
          }

          // Participants validation
          let participants = [];
          if (roleData[8].length > 0) {
            const uniqueMembers = await extractUniqueMembers(roleData[8]);
            for await (const memberId of uniqueMembers) {
              const member = await interaction.guild.members.cache.get(memberId);
              if (member && signedUpParticipants.includes(member.user.id)) {
                errors.push(`>Member ${getDisplayName(member)} is already signed up!`);
              } else if (member && !signedUpParticipants.includes(member.user.id)) {
                if (participants.length >= maxParticipants && maxParticipants > 0 && strictMax) {
                  errors.push(
                    `> Only ${maxParticipants} participants can be sign up for role ${roleData[1]}. The rest are ignored.`
                  );
                  break;
                }
                participants.push({
                  participantNumber: ++participantNumber,
                  discordId: member.id,
                  name: getDisplayName(member),
                });
                signedUpParticipants.push(member.user.id);
              } else {
                errors.push(`> Member with ID ${memberId} not found to sign up.`);
              }
            }
          }

          roles.push({
            roleNumber: roleNumber,
            roleName: roleData[1],
            partyNumber: partyNumber,
            maxParticipants: maxParticipants,
            strictMax: strictMax,
            emoji: emoji,
            requiredRoles: requiredRoles,
            requiredSignedUps: requiredSignedUps,
            participants: participants,
          });
        } else {
          errors.push(`> Invalid format in line:\n\`${line}\``);
        }
      }
    } else if (isSimple === true) {
      let roleNumber = 0;
      let participantNumber = 0;
      let signedUpParticipants = [];
      let roleName = "";
      for (let line of roleLines) {
        let participants = [];
        if (line.trim() === "") continue; // Skip empty lines
        if (line.includes("/")) {
          let lineSplit = line.split("/");
          if (lineSplit[0].length > 0) {
            if (lineSplit[0].length == 0) {
              errors.push(`> Role name cannot be empty in line:\n\`${line}\``);
              continue;
            }
            if (lineSplit[0].length > 50) {
              errors.push(`> Role name cannot be longer than 50 characters in line:\n\`${line}\``);
              continue;
            }

            roleName = lineSplit[0].trim();
          }
          if (lineSplit[1].length > 0) {
            const uniqueMembers = await extractUniqueMembers(lineSplit[1]);
            if (uniqueMembers.length > 1) {
              errors.push(
                `> Only one member can be signed up per role. Ignored the rest.\n\`${line}\``
              );
            }
            const memberId = uniqueMembers[0];
            const member = await interaction.guild.members.cache.get(memberId);
            if (member && signedUpParticipants.includes(member.user.id)) {
              errors.push(`> Member ${getDisplayName(member)} is already signed up!`);
            } else if (member && !signedUpParticipants.includes(member.user.id)) {
              participants.push({
                participantNumber: ++participantNumber,
                discordId: member.id,
                name: getDisplayName(member),
              });
              signedUpParticipants.push(member.user.id);
            } else {
              errors.push(`> Member with ID ${memberId} not found to sign up.`);
            }
          }
        } else {
          line = line.trim();
          if (line.length === 0) continue; // Skip empty lines
          // Role name validation
          if (line.length > 50) {
            errors.push(`> Role name cannot be longer than 50 characters in line:\n\`${line}\``);
            continue;
          }
          roleName = line;
        }
        roles.push({
          roleNumber: ++roleNumber,
          roleName: roleName,
          participants: participants,
        });
      }
    }

    return { parsedRoles: roles, errors };
  },
  async unparseRoles(roles, isSimple = false) {
    let result = [];
    for (const role of roles) {
      if (isSimple) {
        let participants = role.participants.map((p) => `<@${p.discordId}>`).join(", ");
        if (role.participants.length > 0) {
          participants = `/${participants}`;
        } else {
          result.push(`${role.roleName}`);
        }
      } else {
        let requiredRoles = role.requiredRoles.map((r) => `<@&${r}>`).join(" ");
        let participants = role.participants.map((p) => `<@${p.discordId}>`).join(", ");
        result.push(
          `${role.roleNumber}/${role.roleName}/${role.partyNumber}/${role.maxParticipants}/${
            role.strictMax ? 1 : 0
          }/${role.emoji}/${requiredRoles}/${role.requiredSignedUps.join(", ")}/${participants}`
        );
      }
    }
    return result.join("\n");
  },
  async eventEmbeds(eventData) {
    const embeds = [];

    let eventInfoMessage = ``;
    eventInfoMessage += `# ${eventData.name} [#${eventData.event_id}]\n`;

    if (eventData.description && eventData.description.length > 0) {
      eventInfoMessage += `\n\n${eventData.description}`;
    }

    const eventInfo = new EmbedBuilder().setColor("#42d1eb").setDescription(eventInfoMessage);

    if (eventData?.usedTemplateId) {
      try {
        const eventTemplate = await EventTemplates.findOne({
          $and: [{ gid: eventData.gid }, { _id: eventData.usedTemplateId }],
        });

        if (eventTemplate) {
          eventInfo.setFooter({
            text: `Used template: ${eventTemplate.name} (${eventTemplate.authorName})`,
          });
        }
      } catch (error) {
        console.error("[47abda] Event used template error: ", error);
      }

      if (eventData.imageUrl) {
        try {
          eventInfo.setImage(eventData.imageUrl);
        } catch (error) {
          console.error("[bc294c] Event setImage error: ", error);
        }
      }

      let organizerField = `🎓 **${eventData.organizerName}**`;
      if (eventData.buildUrl) {
        organizerField += `\n[👕 Build link](${eventData.buildUrl})`;
      }
      eventInfo.addFields({ name: "Organizer:", value: organizerField, inline: true });

      let dateTimeField = ``;
      if (eventData.startDate) {
        let timestamp = Math.floor(eventData.startDate.getTime() / 1000);
        dateTimeField += `🗓️ <t:${timestamp}:d>\n`;
        dateTimeField += `⏱️ <t:${timestamp}:t>\n`;
        dateTimeField += `⏳ <t:${timestamp}:R>`;
      }

      eventInfo.addFields({
        name: `Event Time:`,
        value: dateTimeField,
        inline: true,
      });

      let signupsField = ``;
      signupsField += `👤 ${eventData.participantCount}\n`;
      if (eventData.roles && eventData.unsignedParticipants.length > 0) {
        signupsField += `🚪 ${eventData.unsignedParticipants.length}`;
      }

      eventInfo.addFields({
        name: `Participants:`,
        value: signupsField,
        inline: true,
      });
    }

    if (eventData.allowLateJoin) {
      eventInfo.addFields({
        name: `\u200B`,
        value: `*Late Join allowed for **${eventData.lateJoinLimit}** minutes after the event start.*`,
      });
    }
    if (eventData.imageUrl) {
      try {
        eventInfo.setImage(eventData.imageUrl);
      } catch (error) {
        console.error("[bc294c] Event setImage error: ", error);
      }
    }

    embeds.push(eventInfo);

    const uniquePartyNumbers = [
      ...new Set((eventData.roles || []).map((role) => role.partyNumber)),
    ].sort();

    for await (const partyNumber of uniquePartyNumbers) {
      const partyRoles = eventData.roles
        .filter((role) => role.partyNumber === partyNumber)
        .sort((a, b) => a.roleNumber - b.roleNumber);

      let partyInfoMessage = ``;

      for (const role of partyRoles) {
        let emoji = role.emoji ? `${role.emoji} ` : "";
        let maxParticipants = role.maxParticipants > 0 ? `/${role.maxParticipants}` : "";

        partyInfoMessage += `\n${emoji}┊**${role.roleNumber}**┊ **${role.roleName}** (${role.participants.length}${maxParticipants})`;

        if (role.participants.length > 0) {
          partyInfoMessage +=
            `\n> ` +
            role.participants.map((p) => `\`${p.participantNumber}\` ${p.name}`).join(", ");
        }
      }

      const partyInfo = new EmbedBuilder().setColor("#1cff60").setDescription(partyInfoMessage);

      if (uniquePartyNumbers.length == 1) {
        partyInfo.setTitle(`Signed Up Participants`);
      }

      embeds.push(partyInfo);
    }

    if (eventData?.unsignedParticipants && eventData.unsignedParticipants.length > 0) {
      let unsignedParticipantsMessage = ``;

      const reasons = {
        signed_out: "🚪 Signed Out",
        mor: "⏭️ MOR",
        skip: "💤 Skip",
      };

      // Group unsigned participants by reason
      const groupedByReason = eventData.unsignedParticipants.reduce((acc, unsignedParticipant) => {
        const reason = unsignedParticipant.reason || "unknown";
        if (!acc[reason]) acc[reason] = [];
        acc[reason].push(unsignedParticipant);
        return acc;
      }, {});

      for (const [reason, unsignedParticipants] of Object.entries(groupedByReason)) {
        unsignedParticipantsMessage += `\n\n**${reasons[reason] || "Unknown Reason"}**:\n> `;
        unsignedParticipantsMessage += unsignedParticipants
          .map((p) => `\`${p.participantNumber}\` ${p.name}`)
          .join(", ");
      }

      const unsignedParticipantsEmbed = new EmbedBuilder()
        .setColor("#ffdb93")
        .setTitle(`Unsigned Participants`)
        .setDescription(unsignedParticipantsMessage);

      embeds.push(unsignedParticipantsEmbed);
    }

    return embeds;
  },
  async reloadEvent(guild, eventData) {
    const embeds = await this.eventEmbeds(eventData);

    const channel = await guild.channels.fetch(eventData.channelId);
    if (!channel) return;

    const message = await channel.messages.fetch(eventData.messageId);
    if (!message) return;

    if (eventData.messageContent) {
      await message.edit({
        content: eventData.messageContent,
        embeds: embeds,
      });
    } else {
      await message.edit({
        embeds: embeds,
      });
    }
  },
  async isSignedUp(eventData, member) {
    if (!eventData || !eventData.roles || !member) return false;

    for (const role of eventData.roles) {
      if (role.participants && role.participants.some((p) => p.discordId === member.id)) {
        return true;
      }
    }
    return false;
  },
  async isSignedOut(eventData, member) {
    if (!eventData || !eventData.unsignedParticipants || !member) return false;
    return eventData.unsignedParticipants.some((p) => p.discordId === member.id);
  },
  async signUp(guild, eventData, member, roleNumber, perms) {
    if (!eventData || !eventData.roles || !member) return false;

    // check if roleNumber exists
    const role = eventData.roles.find((r) => r.roleNumber === roleNumber);
    if (!role)
      return { success: false, message: `Role number \`${roleNumber}\` not found`, member };

    // check if limit is reached
    if (
      role.strictMax &&
      role.participants.length >= role.maxParticipants &&
      role.maxParticipants > 0
    ) {
      return { success: false, message: `Role \`${role.roleName}\` is full`, member };
    }

    // check if member has required roles
    if (role.requiredRoles && role.requiredRoles.length > 0 && !perms.creator) {
      const memberRoles = member.roles.cache.map((r) => r.id);
      // Check if the member has at least one required role
      const hasAnyRequiredRole = role.requiredRoles.some((requiredRole) =>
        memberRoles.includes(requiredRole)
      );
      if (!hasAnyRequiredRole) {
        return {
          success: false,
          message: `To signup for **${
            role.roleName
          }** you need to have at least one of the roles:\n> ${role.requiredRoles
            .map((r) => `<@&${r}>`)
            .join(" ")}`,
          member,
        };
      }
    }

    // check if requiredSignedUps are met
    if (role.requiredSignedUps && role.requiredSignedUps.length > 0 && !perms.creator) {
      const signedUpParticipants = role.participants.map((p) => p.participantNumber);
      for (const requiredSignedUp of role.requiredSignedUps) {
        if (!signedUpParticipants.includes(requiredSignedUp)) {
          return {
            success: false,
            message: `You can't signup for **${
              role.roleName
            }** before roles ${role.requiredSignedUps
              .map((r) => `\`${r}\``)
              .join(", ")} are not filled.`,
            member,
          };
        }
      }
    }

    for (const role of eventData.roles) {
      if (role.roleNumber === roleNumber) {
        role.participants.push({
          participantNumber: eventData.signedCount,
          discordId: member.user.id,
          name: getDisplayName(member),
        });

        eventData.participantCount++;
        eventData.signedCount++;

        await eventData.save();
        await this.reloadEvent(guild, eventData);
        return { success: true, message: `Signed up for **${role.roleName}**`, member };
      }
    }
    return { success: false, message: `Role number ${roleNumber} not found`, member };
  },
  async signOut(guild, eventData, member, reason = "signed_out") {
    if (!eventData || !eventData.roles || !member) return false;

    // remove from participants
    const role = eventData.roles.find((r) =>
      r.participants.some((p) => p.discordId === member.user.id)
    );

    // Find the participant object
    const participantIndex = role.participants.findIndex((p) => p.discordId === member.user.id);
    if (participantIndex !== -1) {
      // Remove the participant from the role
      let [participant] = role.participants.splice(participantIndex, 1);

      let unsignedParticipant = JSON.parse(JSON.stringify(participant));

      // Add reason to the participant object
      unsignedParticipant.reason = reason;

      // Move to unsignedParticipants
      eventData.unsignedParticipants.push(unsignedParticipant);
    }

    eventData.participantCount--;

    await eventData.save();
    await this.reloadEvent(guild, eventData);

    return { success: true, message: `Signed out from the event`, member };
  },
  async signOutUpdateReason(guild, eventData, member, reason = "signed_out") {
    if (!eventData || !eventData.roles || !member) return false;

    // Check if the member is signed out and return index
    const unsignedIndex = eventData.unsignedParticipants.findIndex(
      (p) => p.discordId === member.user.id
    );

    const reasons = {
      signed_out: "Signed Out",
      mor: "MOR",
      skip: "Skip",
    };

    if (unsignedIndex !== -1) {
      const unsignedParticipant = eventData.unsignedParticipants[unsignedIndex];
      if (unsignedParticipant.reason === reason) {
        return {
          success: false,
          message: `Is already signed out with reason: **${reasons[reason] ?? reason}**`,
          member,
        };
      } else {
        eventData.unsignedParticipants[unsignedIndex].reason = reason;
        await eventData.save();

        await this.reloadEvent(guild, eventData);

        return {
          success: true,
          message: `Sign out reason updated to **${reasons[reason] ?? reason}**`,
          member,
        };
      }
    } else {
      return {
        success: false,
        message: `You are not signed out from the event`,
        member,
      };
    }
  },
  async changeRole(guild, eventData, member, roleNumber, perms) {
    if (!eventData || !eventData.roles || !member) return false;

    // check if roleNumber exists
    const role = eventData.roles.find((r) => r.roleNumber === roleNumber);
    if (!role)
      return { success: false, message: `Role number \`${roleNumber}\` not found`, member };

    // check if limit is reached
    if (
      role.strictMax &&
      role.participants.length >= role.maxParticipants &&
      role.maxParticipants > 0
    ) {
      return { success: false, message: `Role **${role.roleName}** is full`, member };
    }

    // check if member is already signed up for this role
    if (role.participants.some((p) => p.discordId === member.user.id)) {
      return {
        success: false,
        message: `You are already signed up for **${role.roleName}**`,
        member,
      };
    }

    // check if member has required roles
    if (role.requiredRoles && role.requiredRoles.length > 0 && !perms.creator) {
      const memberRoles = member.roles.cache.map((r) => r.id);
      // Check if the member has at least one required role
      const hasAnyRequiredRole = role.requiredRoles.some((requiredRole) =>
        memberRoles.includes(requiredRole)
      );
      if (!hasAnyRequiredRole) {
        return {
          success: false,
          message: `To signup for **${
            role.roleName
          }** you need to have at least one of the roles:\n> ${role.requiredRoles
            .map((r) => `<@&${r}>`)
            .join(" ")}`,
          member,
        };
      }
    }

    // check if requiredSignedUps are met
    if (role.requiredSignedUps && role.requiredSignedUps.length > 0 && !perms.creator) {
      const signedUpParticipants = role.participants.map((p) => p.participantNumber);
      for (const requiredSignedUp of role.requiredSignedUps) {
        if (!signedUpParticipants.includes(requiredSignedUp)) {
          return {
            success: false,
            message: `You can't signup for **${
              role.roleName
            }** before roles ${role.requiredSignedUps
              .map((r) => `\`${r}\``)
              .join(", ")} are not filled.`,
            member,
          };
        }
      }
    }

    // remove from current role
    const currentRole = eventData.roles.find((r) =>
      r.participants.some((p) => p.discordId === member.user.id)
    );
    const unsignedParticipant = eventData.unsignedParticipants.find(
      (p) => p.discordId === member.user.id
    );

    if (currentRole) {
      const participantIndex = currentRole.participants.findIndex(
        (p) => p.discordId === member.user.id
      );
      if (participantIndex !== -1) {
        const [participant] = currentRole.participants.splice(participantIndex, 1);

        // add to new role
        role.participants.push(participant);
      }
    } else if (unsignedParticipant) {
      const unsignedIndex = eventData.unsignedParticipants.findIndex(
        (p) => p.discordId === member.user.id
      );

      if (unsignedIndex !== -1) {
        const [participant] = eventData.unsignedParticipants.splice(unsignedIndex, 1);

        // add to new role
        role.participants.push(participant);

        eventData.participantCount++;
      }
    } else {
      return { success: false, message: `You are not signed up for any role`, member };
    }

    await eventData.save();
    await this.reloadEvent(guild, eventData);

    if (currentRole) {
      return {
        success: true,
        message: `Changed role from **${currentRole.roleName}** to **${role.roleName}**`,
        member,
      };
    } else if (unsignedParticipant) {
      return {
        success: true,
        message: `Changed role from **not signed up** to **${role.roleName}**`,
        member,
      };
    } else {
      return { success: false, message: `You are not signed up for this event`, member };
    }
  },
  async getPermissions(member, configEvent) {
    let manager_perms = false;
    let creator_perms = false;
    let helper_perms = false;

    if (member.permissions.has(PermissionFlagsBits.Administrator)) {
      manager_perms = true;
      creator_perms = true;
      helper_perms = true;
    }

    try {
      if (!manager_perms) {
        configEvent.manager_roles.forEach((role) => {
          if (member.roles.cache.has(role)) {
            manager_perms = true;
            creator_perms = true;
            helper_perms = true;
          }
        });
      }

      if (!creator_perms) {
        configEvent.creator_roles.forEach((role) => {
          if (member.roles.cache.has(role)) {
            creator_perms = true;
            helper_perms = true;
          }
        });
      }

      if (!helper_perms) {
        configEvent.helper_roles.forEach((role) => {
          if (member.roles.cache.has(role)) {
            helper_perms = true;
          }
        });
      }
    } catch (err) {
      console.error(err);
    }

    return { manager: manager_perms, creator: creator_perms, helper: helper_perms };
  },
};

module.exports = {
  Event_Command,
};
