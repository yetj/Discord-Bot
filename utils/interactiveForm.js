const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  RoleSelectMenuBuilder,
  ChannelSelectMenuBuilder,
  StringSelectMenuBuilder,
  UserSelectMenuBuilder,
  ButtonStyle,
} = require("discord.js");
const isValidDate = require("./isValidDate");

module.exports = async function interactiveForm(
  formName,
  interaction,
  questions,
  callbackFunction,
  ephemeral = true
) {
  let answers = {};
  let currentQuestion = 0;

  const user = interaction.user;
  const channel = interaction.channel;

  let skipDescription = `\n\n*You can skip this question by clicking on the **Skip** button below.*\n*If you skip this question, empty or default value will be used.*`;

  const askQuestion = async () => {
    if (currentQuestion >= questions.length) {
      callbackFunction(answers);
      return;
    }
    const buttonsRow = new ActionRowBuilder();

    buttonsRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`${formName}_cancel`)
        .setLabel("Cancel configuration")
        .setStyle(ButtonStyle.Danger)
    );

    const question = questions[currentQuestion];

    if (question?.canBeSkipped === true) {
      buttonsRow.addComponents(
        new ButtonBuilder()
          .setCustomId(`${formName}_skip`)
          .setLabel("Skip")
          .setStyle(ButtonStyle.Primary)
      );
    } else {
      skipDescription = "";
    }

    let embeds = [];

    await interaction.followUp({
      content: `> ***Starting interactive form***`,
    });

    const embedQuestion = new EmbedBuilder()
      .setColor(`#0000DB`)
      .setTitle(question.title)
      .setDescription(question.description + skipDescription);

    embeds.push(embedQuestion);

    let embedCurrentValue = null;
    if (question?.currentValue) {
      embedCurrentValue = new EmbedBuilder()
        .setColor(`#44cce4`)
        .setTitle(`Current value:`)
        .setDescription("-");

      embeds.push(embedCurrentValue);
    }

    if (question.type === "role") {
      const row = new ActionRowBuilder().addComponents(
        new RoleSelectMenuBuilder()
          .setCustomId(`${formName}_select_role`)
          .setPlaceholder(question.title)
          .setMaxValues(question.limit ?? 25)
      );

      if (question?.currentValue) {
        if (!Array.isArray(question.currentValue)) {
          question.currentValue = [question.currentValue];
        }
        const roles = question.currentValue.map((roleId) => `<@&${roleId}>`);
        embedCurrentValue.setDescription(`\`${roles.join(" ")}\``);
      }

      const msg = await channel.send({
        embeds: [...embeds],
        components: [row, buttonsRow],
      });

      const collector = msg.createMessageComponentCollector({ time: 120000 });

      collector.on("collect", async (i) => {
        if (
          i.customId == `${formName}_select_role` &&
          i.user.id === user.id &&
          i.values?.length > 0
        ) {
          answers[question.id] = i.values;
          embedQuestion.setDescription(`Selected role(s): <@&${i.values.join("> <@&")}>`);
          await i.update({
            embeds: [embedQuestion],
            components: [],
          });
          currentQuestion++;
          collector.stop();
          await askQuestion();
        } else if (i.customId === `${formName}_cancel` && i.user.id === user.id) {
          embedQuestion.setDescription("Canceled.");
          embedQuestion.setColor(`#DB0019`);
          await i.update({ embeds: [embedQuestion], components: [] });
          collector.stop();
        } else if (i.customId === `${formName}_skip` && i.user.id === user.id) {
          embedQuestion.setDescription("Skipped.");
          embedQuestion.setColor(`#dfb600`);
          await i.update({ embeds: [embedQuestion], components: [] });
          currentQuestion++;
          collector.stop();
          await askQuestion();
        }
      });
    } else if (question.type === "channel") {
      const row = new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder()
          .setCustomId(`${formName}_select_channel`)
          .setPlaceholder("Select channel")
          .setMaxValues(question.limit ?? 25)
      );

      if (question?.currentValue) {
        if (!Array.isArray(question.currentValue)) {
          question.currentValue = [question.currentValue];
        }
        const channels = question.currentValue.map((channelId) => `<#${channelId}>`);
        embedCurrentValue.setDescription(`\`${channels.join(" ")}\``);
      }

      const msg = await channel.send({
        embeds: [...embeds],
        components: [row, buttonsRow],
      });

      const collector = msg.createMessageComponentCollector({ time: 120000 });

      collector.on("collect", async (i) => {
        if (
          i.customId == `${formName}_select_channel` &&
          i.user.id === user.id &&
          i.values?.length > 0
        ) {
          answers[question.id] = i.values;
          embedQuestion.setDescription(`Selected channel(s): <#${i.values.join("> <#")}>`);
          await i.update({
            embeds: [embedQuestion],
            components: [],
          });
          currentQuestion++;
          collector.stop();
          await askQuestion();
        } else if (i.customId === `${formName}_cancel` && i.user.id === user.id) {
          embedQuestion.setColor(`#DB0019`);
          embedQuestion.setDescription("Canceled.");
          await i.update({ embeds: [embedQuestion], components: [] });
          collector.stop();
        } else if (i.customId === `${formName}_skip` && i.user.id === user.id) {
          embedQuestion.setDescription("Skipped.");
          embedQuestion.setColor(`#dfb600`);
          await i.update({ embeds: [embedQuestion], components: [] });
          currentQuestion++;
          collector.stop();
          await askQuestion();
        }
      });
    } else if (question.type === "select") {
      const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`${formName}_select`)
          .setPlaceholder(question.title)
          .addOptions(question.options)
      );

      if (question?.currentValue) {
        if (!Array.isArray(question.currentValue)) {
          question.currentValue = [question.currentValue];
        }
        const options = question.currentValue.map((option) => `${option}`);
        embedCurrentValue.setDescription(`\`${options.join(", ")}\``);
      }

      const msg = await channel.send({
        embeds: [...embeds],
        components: [row, buttonsRow],
      });

      const collector = msg.createMessageComponentCollector({ time: 120000 });

      collector.on("collect", async (i) => {
        if (i.customId == `${formName}_select` && i.user.id === user.id && i.values.length > 0) {
          const selectedOption = question.options.find((opt) => opt.value === i.values[0]);
          answers[question.id] = selectedOption.value;

          embedQuestion.setDescription(`Selected option: ${selectedOption.label}`);

          await i.update({ embeds: [embedQuestion], components: [] });
          currentQuestion++;
          collector.stop();
          await askQuestion();
        } else if (i.customId === `${formName}_cancel` && i.user.id === user.id) {
          embedQuestion.setColor(`#DB0019`);
          embedQuestion.setDescription("Canceled.");
          await i.update({ embeds: [embedQuestion], components: [] });
          collector.stop();
        } else if (i.customId === `${formName}_skip` && i.user.id === user.id) {
          embedQuestion.setDescription("Skipped.");
          embedQuestion.setColor(`#dfb600`);
          await i.update({ embeds: [embedQuestion], components: [] });
          currentQuestion++;
          collector.stop();
          await askQuestion();
        }
      });
    } else if (question.type === "text") {
      let files = [];
      if (question?.currentValue) {
        if (question?.isRaw && question.isRaw === true) {
          if (question.currentValue.length > 4000) {
            const buffer = Buffer.from(question.currentValue, "utf-8");
            files = [
              {
                attachment: buffer,
                name: `current_value.txt`,
              },
            ];
            embedCurrentValue.setDescription(
              `Current value attached in the file: \`current_value.txt\``
            );
          } else {
            embedCurrentValue.setDescription(`\`\`\`${question.currentValue}\`\`\``);
          }
        } else {
          if (!Array.isArray(question.currentValue)) {
            question.currentValue = [question.currentValue];
          }
          const options = question.currentValue.map((option) => `${option}`);
          embedCurrentValue.setDescription(`\`${options.join(", ")}\``);
        }
      }

      const questionMessage = await channel.send({
        files: [...files],
        embeds: [...embeds],
        components: [buttonsRow],
      });

      const filter = (msg) => msg.author.id === user.id;
      const messageCollector = channel.createMessageCollector({ filter, time: 120000 });

      const buttonCollector = questionMessage.createMessageComponentCollector({ time: 120000 });

      let canceled = false;

      buttonCollector.on("collect", async (i) => {
        if (i.customId === `${formName}_cancel` && i.user.id === user.id) {
          embedQuestion.setDescription("Canceled.");
          embedQuestion.setColor(`#DB0019`);
          await i.update({ embeds: [embedQuestion], components: [] });
          canceled = true;
          messageCollector.stop();
          buttonCollector.stop();
        }

        if (i.customId === `${formName}_skip` && i.user.id === user.id) {
          embedQuestion.setDescription("Skipped.");
          embedQuestion.setColor(`#dfb600`);
          await i.update({ embeds: [embedQuestion], components: [] });
          canceled = true;
          currentQuestion++;
          buttonCollector.stop();
          messageCollector.stop();
          await askQuestion();
        }
      });

      messageCollector.on("collect", async (msg) => {
        let options = null;
        if (question?.toLowerCase && question.toLowerCase === true) {
          options = Array.from(
            new Set(
              msg.content
                .split(",")
                .map((option) => option.trim().toLowerCase())
                .filter((option) => option.length > 0)
            )
          );
          embedQuestion.setDescription(`Provided options: ${options.join(", ")}`);
          await questionMessage.edit({ embeds: [embedQuestion], components: [] });
        } else if (question?.isRaw && question.isRaw === true) {
          if (question?.allowFiles && question.allowFiles === true && msg.attachments.size > 0) {
            const attachment = msg.attachments.first();
            try {
              const response = await fetch(attachment.url);
              const buffer = Buffer.from(await response.arrayBuffer());

              options = buffer.toString("utf-8");
            } catch (err) {
              console.error(`[2871c6-${formName}] Can't download attachment: \`${err.message}\``);
            }
          } else {
            options = msg.content;
          }

          if (options.length > 4000) {
            const buffer = Buffer.from(options, "utf-8");
            files = [
              {
                attachment: buffer,
                name: `roles.txt`,
              },
            ];
            embedQuestion.setDescription(`Provided text attached in the file: \`roles.txt\``);
            await questionMessage.edit({ files: files, embeds: [embedQuestion], components: [] });
          } else {
            embedQuestion.setDescription(`Provided text:\n\n ${options}`);
            await questionMessage.edit({ embeds: [embedQuestion], components: [] });
          }
        } else {
          options = Array.from(
            new Set(
              msg.content
                .split(",")
                .map((option) => option.trim())
                .filter((option) => option.length > 0)
            )
          );
          embedQuestion.setDescription(`Provided options: ${options.join(", ")}`);
          await questionMessage.edit({ embeds: [embedQuestion], components: [] });
        }
        try {
          await msg.delete();
        } catch (err) {
          console.error(`[8f958f-${formName}] Can't remove message: \`${err.message}\``);
        }
        answers[question.id] = options;
        currentQuestion++;
        messageCollector.stop();
        buttonCollector.stop();
        await askQuestion();
      });

      messageCollector.on("end", (collected) => {
        if (collected.size === 0 && !canceled) {
          channel.send("> *You didn't provide any answer. Canceled.*");
        }
      });
    } else if (question.type === "members") {
      const row = new ActionRowBuilder().addComponents(
        new UserSelectMenuBuilder()
          .setCustomId(`${formName}_members`)
          .setPlaceholder("Select members")
          .setMinValues(question.min ?? 1)
          .setMaxValues(question.limit ?? 25)
      );

      if (question?.currentValue) {
        if (!Array.isArray(question.currentValue)) {
          question.currentValue = [question.currentValue];
        }
        const members = question.currentValue.map((memberId) => `<@${memberId}>`);
        embedCurrentValue.setDescription(`\`${members.join(" ")}\``);
      }

      const msg = await channel.send({
        embeds: [...embeds],
        components: [row, buttonsRow],
      });

      const collector = msg.createMessageComponentCollector({ time: 120000 });

      collector.on("collect", async (i) => {
        if (i.customId == `${formName}_members` && i.user.id === user.id && i.values.length > 0) {
          answers[question.id] = i.values;

          questionEmbed.setDescription(`Selected members(s): <@${i.values.join(">, <@")}>`);

          await i.update({ embeds: [questionEmbed], components: [] });
          currentQuestion++;
          collector.stop();
          await askQuestion();
        } else if (i.customId === `${formName}_cancel` && i.user.id === user.id) {
          questionEmbed.setColor(`#DB0019`);
          questionEmbed.setDescription("Configuration canceled.");
          await i.update({ embeds: [questionEmbed], components: [] });
          collector.stop();
        } else if (i.customId === `${formName}_skip` && i.user.id === user.id) {
          embedQuestion.setDescription("Skipped.");
          embedQuestion.setColor(`#dfb600`);
          await i.update({ embeds: [embedQuestion], components: [] });
          currentQuestion++;
          collector.stop();
          await askQuestion();
        }
      });
    } else if (question.type === "date") {
      if (question?.currentValue) {
        embedCurrentValue.setDescription(`\`${question.currentValue}\``);
      }

      const questionMessage = await channel.send({
        embeds: [...embeds],
        components: [buttonsRow],
      });

      const filter = (msg) => msg.author.id === user.id;
      const collector = channel.createMessageCollector({ filter, time: 120000 });

      const buttonCollector = questionMessage.createMessageComponentCollector({ time: 120000 });

      let canceled = false;

      buttonCollector.on("collect", async (i) => {
        if (i.customId === `${formName}_cancel` && i.user.id === user.id) {
          embedQuestion.setDescription("Canceled.");
          embedQuestion.setColor(`#DB0019`);
          await i.update({ embeds: [embedQuestion], components: [] });
          canceled = true;
          collector.stop();
          buttonCollector.stop();
        }

        if (i.customId === `${formName}_skip` && i.user.id === user.id) {
          embedQuestion.setDescription("Skipped.");
          embedQuestion.setColor(`#dfb600`);
          await i.update({ embeds: [embedQuestion], components: [] });
          canceled = true;
          currentQuestion++;
          buttonCollector.stop();
          collector.stop();
          await askQuestion();
        }
      });

      collector.on("collect", async (msg) => {
        let providedDate = msg.content.trim();
        let formats = question?.format ?? "YYYY-MM-DD";
        let isValid = false;
        let usedFormat = null;
        if (Array.isArray(formats)) {
          for (const format of formats) {
            if (isValidDate(providedDate, format)) {
              isValid = true;
              usedFormat = format;
              break;
            }
          }
        } else {
          isValid = isValidDate(providedDate, formats);
          usedFormat = formats;
        }

        if (!isValid) {
          await interaction.followUp({
            content: `> Invalid date format. Please use one of the following formats: \`${
              Array.isArray(formats) ? formats.join("`, `") : formats
            }\``,
            ephemeral: true,
          });
          try {
            await msg.delete();
          } catch (err) {
            console.error(`[d1d44c-${formName}] Can't remove message: \`${err.message}\``);
          }
          return;
        }

        answers[question.id] = providedDate;

        embedQuestion.setDescription(`Selected date: **${providedDate}**`);
        await questionMessage.edit({ embeds: [embedQuestion], components: [] });

        try {
          await msg.delete();
        } catch (err) {
          console.error(`[de1626-${formName}] Can't remove message: \`${err.message}\``);
        }

        currentQuestion++;
        collector.stop();
        buttonCollector.stop();
        await askQuestion();
      });

      collector.on("end", (collected) => {
        if (collected.size === 0 && !canceled) {
          channel.send("> *You didn't provide any answer. Canceled.*");
        }
      });
    }
  };

  await askQuestion();
};
