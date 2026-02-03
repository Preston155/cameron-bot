require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionsBitField
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages
  ],
  partials: [Partials.Channel]
});

/* ================= CONFIG ================= */

const TICKET_PANEL_CHANNEL_ID = "1468307494785912862";
const TICKET_CATEGORY_NAME = "Tickets";
const STAFF_ROLE_ID = "1468307062747435019";

/* ========================================== */

client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  const channel = await client.channels.fetch(TICKET_PANEL_CHANNEL_ID);

  const embed = new EmbedBuilder()
    .setTitle("🎫 Support Tickets")
    .setDescription(
      "**Need help? You’re in the right place.**\n\n" +
      "Click the button below to open a private support ticket.\n\n" +
      "• One issue per ticket\n" +
      "• Be clear and respectful\n" +
      "• Do NOT ping staff\n\n" +
      "Our team will assist you shortly 💙"
    )
    .setColor(0x3498db)
    .setFooter({ text: "Ticket System" });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("create_ticket")
      .setLabel("🎟 Create Ticket")
      .setStyle(ButtonStyle.Primary)
  );

  await channel.send({ embeds: [embed], components: [row] });
});

/* ================= INTERACTIONS ================= */

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  /* ---------- CREATE TICKET ---------- */
  if (interaction.customId === "create_ticket") {
    const guild = interaction.guild;
    const user = interaction.user;

    let category = guild.channels.cache.find(
      (c) => c.name === TICKET_CATEGORY_NAME && c.type === ChannelType.GuildCategory
    );

    if (!category) {
      category = await guild.channels.create({
        name: TICKET_CATEGORY_NAME,
        type: ChannelType.GuildCategory
      });
    }

    const ticketChannel = await guild.channels.create({
      name: `ticket-${user.username}`,
      type: ChannelType.GuildText,
      parent: category.id,
      permissionOverwrites: [
        {
          id: guild.id,
          deny: [PermissionsBitField.Flags.ViewChannel]
        },
        {
          id: user.id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory
          ]
        },
        {
          id: STAFF_ROLE_ID,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory
          ]
        }
      ]
    });

    const ticketEmbed = new EmbedBuilder()
      .setTitle("🎫 Ticket Created")
      .setDescription(
        `Hello <@${user.id}> 👋\n\n` +
        "Please explain your issue in detail.\n" +
        "A staff member will be with you shortly."
      )
      .setColor(0x2ecc71);

    const closeRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("close_ticket")
        .setLabel("🔒 Close Ticket")
        .setStyle(ButtonStyle.Danger)
    );

    await ticketChannel.send({
      content: `<@${user.id}>`,
      embeds: [ticketEmbed],
      components: [closeRow]
    });

    return interaction.reply({
      content: `✅ Your ticket has been created: ${ticketChannel}`,
      ephemeral: true
    });
  }

  /* ---------- CLOSE TICKET ---------- */
  if (interaction.customId === "close_ticket") {
    if (
      !interaction.member.roles.cache.has(STAFF_ROLE_ID)
    ) {
      return interaction.reply({
        content: "❌ Only staff can close tickets.",
        ephemeral: true
      });
    }

    await interaction.reply("🔒 Closing ticket in **5 seconds**...");

    setTimeout(() => {
      interaction.channel.delete().catch(() => {});
    }, 5000);
  }
});

/* ================= LOGIN ================= */

client.login(process.env.TOKEN);
