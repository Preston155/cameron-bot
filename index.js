const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
  ChannelType
} = require("discord.js");

/* ======================
   CONFIG
====================== */

const PREFIX = "!";
const TICKET_CATEGORY_ID = "1466903166670082210"; // 👈 ADD CATEGORY ID

/* ======================
   CLIENT
====================== */

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.User,
    Partials.GuildMember
  ]
});

/* ======================
   READY
====================== */

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

/* ======================
   PREFIX COMMANDS
====================== */

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;
  if (!message.content.startsWith(PREFIX)) return;

  const command = message.content
    .slice(PREFIX.length)
    .trim()
    .toLowerCase();

  if (command === "ping") {
    return message.reply(`🏓 Pong! ${client.ws.ping}ms`);
  }

  if (command === "ticketpanel") {
    if (
      !message.member.permissions.has(
        PermissionsBitField.Flags.Administrator
      )
    ) return;

    const embed = new EmbedBuilder()
      .setTitle("🎟️ Support & Assistance Center")
      .setDescription(
        "**Need help or have an issue?** You’re in the right place.\n\n" +
        "Click **Open Ticket** to create a private support channel where our team can assist you.\n\n" +
        "**Before opening a ticket:**\n" +
        "• Clearly explain your issue\n" +
        "• One issue per ticket\n" +
        "• Remain respectful and patient\n\n" +
        "⏳ Tickets are handled in the order they are received."
      )
      .setColor(0x5865f2)
      .setFooter({ text: "Support System" })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("open_ticket")
        .setLabel("Open Ticket")
        .setStyle(ButtonStyle.Primary)
    );

    message.channel.send({ embeds: [embed], components: [row] });
  }
});

/* ======================
   BUTTON HANDLER
====================== */

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  /* OPEN TICKET */
  if (interaction.customId === "open_ticket") {
    const existing = interaction.guild.channels.cache.find(
      (c) => c.name === `ticket-${interaction.user.id}`
    );

    if (existing) {
      return interaction.reply({
        content: "❌ You already have an open ticket.",
        ephemeral: true
      });
    }

    const channel = await interaction.guild.channels.create({
      name: `ticket-${interaction.user.id}`,
      type: ChannelType.GuildText,
      parent: TICKET_CATEGORY_ID || null, // ✅ CATEGORY SUPPORT
      permissionOverwrites: [
        {
          id: interaction.guild.id,
          deny: [PermissionsBitField.Flags.ViewChannel]
        },
        {
          id: interaction.user.id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory
          ]
        }
      ]
    });

    const embed = new EmbedBuilder()
      .setTitle("🎫 Ticket Created")
      .setDescription(
        `Hello ${interaction.user}, welcome to your support ticket.\n\n` +
        "Please provide **as much detail as possible** regarding your issue so we can assist you efficiently.\n\n" +
        "**What happens next?**\n" +
        "• A staff member will claim this ticket\n" +
        "• They will assist you until resolved\n" +
        "• The ticket will then be closed\n\n" +
        "🔔 Please avoid pinging staff — they will respond soon."
      )
      .setColor(0x2ecc71)
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("claim_ticket")
        .setLabel("Claim")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("unclaim_ticket")
        .setLabel("Unclaim")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("close_ticket")
        .setLabel("Close")
        .setStyle(ButtonStyle.Danger)
    );

    channel.send({ embeds: [embed], components: [row] });

    interaction.reply({
      content: `✅ Ticket created: ${channel}`,
      ephemeral: true
    });
  }

  /* CLAIM TICKET */
  if (interaction.customId === "claim_ticket") {
    if (
      !interaction.member.permissions.has(
        PermissionsBitField.Flags.Administrator
      )
    ) {
      return interaction.reply({
        content: "❌ Only admins can claim tickets.",
        ephemeral: true
      });
    }

    interaction.channel.send(
      `🟢 **Ticket claimed by ${interaction.user}**`
    );

    interaction.reply({ content: "Ticket claimed.", ephemeral: true });
  }

  /* UNCLAIM TICKET */
  if (interaction.customId === "unclaim_ticket") {
    if (
      !interaction.member.permissions.has(
        PermissionsBitField.Flags.Administrator
      )
    ) {
      return interaction.reply({
        content: "❌ Only admins can unclaim tickets.",
        ephemeral: true
      });
    }

    interaction.channel.send(`🟡 **Ticket is now unclaimed**`);
    interaction.reply({ content: "Ticket unclaimed.", ephemeral: true });
  }

  /* CLOSE TICKET */
  if (interaction.customId === "close_ticket") {
    if (
      !interaction.member.permissions.has(
        PermissionsBitField.Flags.Administrator
      )
    ) {
      return interaction.reply({
        content: "❌ Only admins can close tickets.",
        ephemeral: true
      });
    }

    await interaction.reply("🔒 Closing ticket...");
    setTimeout(() => interaction.channel.delete().catch(() => {}), 3000);
  }
});

/* ======================
   LOGIN (RAILWAY)
====================== */

client.login(process.env.TOKEN);
