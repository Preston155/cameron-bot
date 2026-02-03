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

const PREFIX = "!";

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
      .setTitle("🎟️ Support Tickets")
      .setDescription(
        "Need help? Click the button below.\n\n" +
        "• One issue per ticket\n" +
        "• Be respectful\n" +
        "• Do not ping staff"
      )
      .setColor(0x5865f2);

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
        },
        {
          id: interaction.guild.roles.everyone.id,
          deny: [PermissionsBitField.Flags.ViewChannel]
        }
      ]
    });

    const embed = new EmbedBuilder()
      .setTitle("🎫 Ticket Opened")
      .setDescription(
        `Hello ${interaction.user},\n\n` +
        "Please explain your issue.\n" +
        "An admin will assist you shortly."
      )
      .setColor(0x2ecc71);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("close_ticket")
        .setLabel("Close Ticket")
        .setStyle(ButtonStyle.Danger)
    );

    channel.send({ embeds: [embed], components: [row] });

    interaction.reply({
      content: `✅ Ticket created: ${channel}`,
      ephemeral: true
    });
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
