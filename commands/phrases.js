const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");

const { Phrases } = require("../dbmodels/phrases.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("phrases")
    .setDescription("Predefined phrases")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Create new phrase")
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("Short name of the phrase")
            .setMaxLength(31)
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("allowed_roles")
            .setDescription(
              "Mention all roles that are allowed to use this phrase (default: @everyone)"
            )
        )
        .addStringOption((option) =>
          option
            .setName("allowed_roles_separator")
            .setDescription("Allowed roles separator (default: space)")
        )
        .addStringOption((option) =>
          option.setName("description").setDescription("Description of the phrase")
        )
        .addBooleanOption((option) =>
          option.setName("embed").setDescription("Post message as embed? (default: false)")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove")
        .setDescription("Remove phrase")
        .addStringOption((option) =>
          option
            .setName("phrase_id")
            .setDescription("Phrase to post")
            .setAutocomplete(true)
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("update")
        .setDescription("Update phrase")
        .addStringOption((option) =>
          option
            .setName("phrase_id")
            .setDescription("Phrase to update")
            .setAutocomplete(true)
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("Overwrite Short name of the phrase")
            .setMaxLength(31)
        )
        .addStringOption((option) =>
          option
            .setName("allowed_roles")
            .setDescription(
              "Overwrite mention all roles that are allowed to use this phrase (default: @everyone)"
            )
        )
        .addStringOption((option) =>
          option
            .setName("allowed_roles_separator")
            .setDescription("Allowed roles separator (default: space)")
        )
        .addStringOption((option) =>
          option.setName("description").setDescription("Overwrite description of the phrase")
        )
        .addBooleanOption((option) =>
          option
            .setName("embed")
            .setDescription("Overwrite post message as embed? (default: false)")
        )
        .addBooleanOption((option) =>
          option
            .setName("update_content")
            .setDescription("Overwrite content of the phrase? (default: false)")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("list").setDescription("List all phrases for this server")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("send")
        .setDescription("Send a phrase")
        .addStringOption((option) =>
          option
            .setName("phrase_id")
            .setDescription("Phrase to send")
            .setAutocomplete(true)
            .setRequired(true)
        )
    ),

  async autocomplete(interaction) {
    const focusedOption = interaction.options.getFocused(true);
    let choices = [];
    if (focusedOption.name === "phrase_id") {
      try {
        const phrasesDB = await Phrases.find({
          gid: interaction.guildId,
        }).sort({ name: -1 });

        await phrasesDB.forEach((phrase) => {
          choices.push({
            name: `${phrase.name}`,
            value: phrase._id.toString(),
          });
        });
      } catch (err) {
        console.error("[309438] ", err);
      }

      const filtered = choices.filter((choice) =>
        choice.name.toLowerCase().includes(focusedOption.value.toLowerCase())
      );
      const limitedResults = filtered.slice(0, 15);
      await interaction.respond(
        limitedResults.map((choice) => ({ name: choice.name, value: choice.value }))
      );
    }
  },
  async execute(interaction) {
    if (
      !interaction.memberPermissions.has(PermissionFlagsBits.ManageMessages) &&
      interaction.options.getSubcommand() !== "send"
    ) {
      return await interaction.reply({
        content: `> *You don't have permission to execute this command!*`,
        ephemeral: true,
      });
    }

    if (interaction.options.getSubcommand() === "add") {
      const name = interaction.options.getString("name");
      const description = interaction.options.getString("description") ?? "-- No description --";
      const embed = interaction.options.getBoolean("embed") ?? false;
      const allowed_roles = interaction.options.getString("allowed_roles") ?? null;
      const allowed_roles_separator =
        interaction.options.getString("allowed_roles_separator") ?? " ";

      await interaction.deferReply({ ephemeral: true });
      await interaction.deleteReply();

      try {
        const phrasesDB = await Phrases.find({
          gid: interaction.guildId,
        }).sort({ name: -1 });

        if (phrasesDB.length >= 10) {
          return await interaction.followUp({
            content: `> *You can't have more than 10 phrases on this server!*`,
            ephemeral: true,
          });
        }

        const phrase = phrasesDB.find((phrase) => phrase.name.localeCompare(name) === 0);

        if (phrase) {
          return await interaction.followUp({
            content: `> *Phrase with name **${phrase.name}** already exist.*`,
            ephemeral: true,
          });
        }

        let roles = [];
        if (allowed_roles !== null) {
          const rolesArray = allowed_roles.split(allowed_roles_separator);
          for await (const role of rolesArray) {
            const roleId = role.replace(/[^0-9]/g, "");
            if (roleId.length > 0) {
              const role = await interaction.guild.roles.fetch(roleId);
              if (role) {
                roles.push(roleId);
              }
            }
          }
        }

        let embedContent = "";
        embedContent += `**Phrase name:** *${name}*\n`;
        embedContent += `**Description:** *${description}*\n`;
        embedContent += `**Embed:** *${embed && embed === true ? "True" : "False"}*\n`;
        embedContent += `**Allowed roles:** *${
          roles.length > 0 ? `<@&${roles.join(">, <@&")}>` : "everyone"
        }*\n`;
        embedContent += `\n> **Please send now a message that should be posted with this Phrase.**`;

        const questionEmbed = new EmbedBuilder()
          .setColor(`#00dabd`)
          .setTitle("Creating new Phrase")
          .setDescription(embedContent);

        const questionMessage = await interaction.channel.send({
          embeds: [questionEmbed],
          ephemeral: true,
        });

        const filter = (msg) => msg.author.id === interaction.user.id;
        const collector = interaction.channel.createMessageCollector({ filter, time: 120000 });

        collector.on("collect", async (msg) => {
          try {
            const newPhrase = await new Phrases({
              gid: interaction.guildId,
              name: name,
              description: description,
              content: msg.content,
              embed: embed,
              allowedRoles: roles,
            });
            await newPhrase.save();
          } catch (err) {
            console.error(err);
            return await interaction.followUp({
              content: `> [fde287] Error while creating new Phrase. Please try again later.`,
              ephemeral: true,
            });
          }
          const oldContent = embedContent.split("\n").slice(0, 4).join("\n");
          const newContent = msg.content.split("\n").join("\n> ");
          questionEmbed.setColor(`#00ff00`);
          questionEmbed.setTitle("New Phrase created.");
          questionEmbed.setDescription(`${oldContent}\n**Content:**\n> ${newContent}`);

          await questionMessage.edit({ embeds: [questionEmbed], ephemeral: true });

          try {
            await msg.delete();
          } catch (err) {
            console.error(`[PHRASES-085288] Can't remove message: \`${err.message}\``);
          }

          collector.stop();
        });

        collector.on("end", async (collected) => {
          if (collected.size === 0) {
            await interaction.channel.send({
              content: "> *You didn't provide any content. Creating new Phrase, canceled.*",
              ephemeral: true,
            });
          }
        });
      } catch (err) {
        console.error(err);
        return await interaction.followUp({
          content: `> [502073] Error while adding new Phrase. Please try again later.`,
          ephemeral: true,
        });
      }
    } else if (interaction.options.getSubcommand() === "update") {
      const phrase_id = interaction.options.getString("phrase_id");
      const name = interaction.options.getString("name") ?? null;
      const description = interaction.options.getString("description") ?? null;
      const embed = interaction.options.getBoolean("embed") ?? null;
      const allowed_roles = interaction.options.getString("allowed_roles") ?? null;
      const allowed_roles_separator =
        interaction.options.getString("allowed_roles_separator") ?? " ";
      const update_content = interaction.options.getBoolean("update_content") ?? false;

      await interaction.deferReply({ ephemeral: true });

      try {
        const phrase = await Phrases.findOne({ _id: phrase_id, gid: interaction.guildId });

        if (!phrase) {
          return await interaction.followUp({
            content: `> Didn't find phrase with that Name`,
            ephemeral: true,
          });
        }

        let oldName = phrase.name;
        let oldDescription = phrase.description;
        let oldEmbed = phrase.embed;
        let oldAllowedRoles = phrase.allowedRoles;

        if (name) {
          phrase.name = name;
        }
        if (description) {
          phrase.description = description;
        }
        if (embed !== null) {
          phrase.embed = embed;
        }

        let roles = [];

        if (allowed_roles !== null) {
          const rolesArray = allowed_roles.split(allowed_roles_separator);
          for await (const role of rolesArray) {
            const roleId = role.replace(/[^0-9]/g, "");
            if (roleId.length > 0) {
              const role = await interaction.guild.roles.fetch(roleId);
              if (role) {
                roles.push(roleId);
              }
            }
          }
          phrase.allowedRoles = roles;
        }

        let embedContent = "";

        embedContent += `**Phrase name:** *${oldName}*`;
        if (name && name.localeCompare(oldName) !== 0) {
          embedContent += ` -> *${name}*`;
        }

        embedContent += `\n**Description:** *${oldDescription}*`;
        if (description && description.localeCompare(oldDescription) !== 0) {
          embedContent += ` -> *${description}*`;
        }

        embedContent += `\n**Embed:** *${oldEmbed === true ? "True" : "False"}*`;
        if (embed !== null && embed !== oldEmbed) {
          embedContent += ` -> *${embed && embed === true ? "True" : "False"}*`;
        }

        embedContent += `\n**Allowed roles:** *${
          oldAllowedRoles.length > 0 ? `<@&${oldAllowedRoles.join(">, <@&")}>` : "everyone"
        }*`;
        if (roles.length !== oldAllowedRoles.length) {
          embedContent += ` -> *${roles.length > 0 ? `<@&${roles.join(">, <@&")}>` : "everyone"}*`;
        }

        if (update_content) {
          embedContent += `\n\n> **Please send now a message that should be posted with this Phrase.**`;

          const questionEmbed = new EmbedBuilder()
            .setColor(`#00dabd`)
            .setTitle(`Updating phrase - ${oldName}`)
            .setDescription(embedContent);

          const questionMessage = await interaction.channel.send({
            embeds: [questionEmbed],
            ephemeral: true,
          });

          const filter = (msg) => msg.author.id === interaction.user.id;
          const collector = interaction.channel.createMessageCollector({ filter, time: 120000 });

          collector.on("collect", async (msg) => {
            try {
              phrase.content = msg.content;
            } catch (err) {
              console.error(err);
              return await interaction.followUp({
                content: `> [20ab99] Error while updating Phrase. Please try again later.`,
                ephemeral: true,
              });
            }

            const oldContent = embedContent.split("\n").slice(0, 4).join("\n");
            const newContent = msg.content.split("\n").join("\n> ");
            questionEmbed.setColor(`#00ff00`);
            questionEmbed.setTitle("Phrase updated.");
            questionEmbed.setDescription(`${oldContent}\n**New content:**\n> ${newContent}`);

            await phrase.save();

            await questionMessage.edit({ embeds: [questionEmbed], ephemeral: true });

            try {
              await msg.delete();
            } catch (err) {
              console.error(`[PHRASES-6e857a] Can't remove message: \`${err.message}\``);
            }

            collector.stop();
          });

          collector.on("end", async (collected) => {
            if (collected.size === 0) {
              await interaction.channel.send({
                content: "> *You didn't provide any content. Creating new Phrase, canceled.*",
                ephemeral: true,
              });
            }
          });
        } else {
          const oldContent = embedContent.split("\n").slice(0, 4).join("\n");
          const questionEmbed = new EmbedBuilder()
            .setColor(`#00dabd`)
            .setTitle(`Phrase updated.`)
            .setDescription(oldContent);

          await interaction.channel.send({
            embeds: [questionEmbed],
          });

          await phrase.save();
        }
      } catch (err) {
        console.error(err);
        return await interaction.followUp({
          content: `> [cb9d78] Error while updating Phrase. Please try again later.`,
          ephemeral: true,
        });
      }
    } else if (interaction.options.getSubcommand() === "remove") {
      const phrase_id = interaction.options.getString("phrase_id");

      try {
        const phrase = await Phrases.findOne({ _id: phrase_id, gid: interaction.guildId });

        if (!phrase) {
          return await interaction.reply({
            content: `> Didn't find phrase with that ID`,
            ephemeral: true,
          });
        }

        await Phrases.deleteOne({ _id: phrase_id, gid: interaction.guildId });

        await interaction.reply({
          content: `> Phrase with name **${phrase.name}** has been removed.`,
          ephemeral: true,
        });
      } catch (err) {
        console.error(err);
        return await interaction.reply({
          content: `> [2cd747] Error while removing Phrase. Please try again later.`,
          ephemeral: true,
        });
      }
    } else if (interaction.options.getSubcommand() === "list") {
      try {
        const phrasesDB = await Phrases.find({
          gid: interaction.guildId,
        }).sort({ name: -1 });

        if (!phrasesDB) {
          return await interaction.reply({
            content: `> Didn't find any phrase on this server!`,
            ephemeral: true,
          });
        }

        let text = "";
        let out = [];

        for await (const phrase of phrasesDB) {
          text += `**Name:** ${phrase.name}\n`;
          text += `**Description:** ${phrase.description}\n`;
          text += `**Embed:** ${phrase.embed ? "True" : "False"}\n`;
          text += `**Allowed roles:** ${
            phrase.allowedRoles.length > 0 ? `<@&${phrase.allowedRoles.join("> <@&")}>` : "everyone"
          }\n`;
          out.push(text);
          text = "";
        }

        let message = out.join("*---------------*\n");

        const embedMessage = new EmbedBuilder()
          .setColor(`#5aff45`)
          .setTitle(`Found **${phrasesDB.length}** phrases for this server`)
          .setDescription(message);

        await interaction.reply({ embeds: [embedMessage] });
      } catch (err) {
        console.error(err);
        return await interaction.reply({
          content: `> [21a799] Error listing phrases. Please try again later.`,
          ephemeral: true,
        });
      }
    } else if (interaction.options.getSubcommand() === "send") {
      const phrase_id = interaction.options.getString("phrase_id");

      await interaction.deferReply({ ephemeral: true });

      try {
        const phrase = await Phrases.findOne({ _id: phrase_id, gid: interaction.guildId });
        if (!phrase) {
          return await interaction.followUp({
            content: `> Didn't find phrase with that Name`,
            ephemeral: true,
          });
        }

        if (phrase.allowedRoles.length > 0) {
          let allowed = false;

          if (interaction.memberPermissions.has(PermissionFlagsBits.ManageMessages)) {
            allowed = true;
          }

          if (!allowed == false) {
            const interactionUser = await interaction.guild.members.fetch(interaction.user.id, {
              force: true,
            });

            for await (role of phrase.allowedRoles) {
              if (interactionUser.roles.cache.has(role)) {
                allowed = true;
              }
            }
          }

          if (!allowed) {
            return await interaction.followUp({
              content: `> *You don't have permission to use this phrase!*`,
              ephemeral: true,
            });
          }
        }

        if (phrase.embed) {
          const embed = new EmbedBuilder().setColor("#2ae2e9").setDescription(`${phrase.content}`);

          await interaction.channel.send({ embeds: [embed] });
        } else {
          await interaction.channel.send(phrase.content);
        }
        interaction.deleteReply();
      } catch (err) {
        console.error(err);
        return await interaction.reply({
          content: `> [b9115e] Error while sending phrase. Please try again later.`,
          ephemeral: true,
        });
      }
    }
  },
};
