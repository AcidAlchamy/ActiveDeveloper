require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField, SlashCommandBuilder, REST, Routes } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();

// Initializing the Discord client
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Database setup
const db = new sqlite3.Database('./servers.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the servers database.');
    db.run('CREATE TABLE IF NOT EXISTS guilds(guild_id TEXT, guild_name TEXT, admin_name TEXT, admin_user_id TEXT)');
});

client.on('guildCreate', guild => {
    console.log(`Joined new guild: ${guild.name}`);
    const admin = guild.members.cache.find(member => member.permissions.has(PermissionsBitField.Flags.Administrator));

    const stmt = db.prepare('INSERT INTO guilds (guild_id, guild_name, admin_name, admin_user_id) VALUES (?, ?, ?, ?)');
    stmt.run(guild.id, guild.name, admin.user.username, admin.user.id);
    stmt.finalize();
});

// Registering slash commands
const commands = [
    new SlashCommandBuilder()
        .setName('active_developer')
        .setDescription('Express your interest in becoming an active developer'),
    new SlashCommandBuilder()
        .setName('github')
        .setDescription('Get the link to the GitHub project'),
    new SlashCommandBuilder()
        .setName('how_does_it_work')
        .setDescription('Learn how running this bot can earn you the Active Developer emblem'),
    new SlashCommandBuilder()
        .setName('bot_tips')
        .setDescription('Get helpful tips and best practices for Discord bot development'),
    new SlashCommandBuilder()
        .setName('docs')
        .setDescription('Get documentation links for various Discord libraries.')
        .addStringOption(option =>
            option.setName('library')
                .setDescription('Select a programming language library')
                .setRequired(true)
                .addChoices(
                    { name: 'JavaScript (discord.js)', value: 'discord_js' },
                    { name: 'Python (discord.py)', value: 'discord_py' },
                    { name: 'Java (JDA)', value: 'java_jda' },
                    { name: 'C# (Discord.Net)', value: 'csharp_discordnet' },
                    { name: 'Ruby (discordrb)', value: 'ruby_discordrb' },
                    { name: 'Rust (Serenity)', value: 'rust_serenity' },
                    { name: 'Go (DiscordGo)', value: 'go_discordgo' },
                    { name: 'Elixir (Nostrum)', value: 'elixir_nostrum' },
                    { name: 'PHP (DiscordPHP)', value: 'php_discordphp' }
                ))
].map(command => command.toJSON());

// REST client for Discord API
const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN);

// Development environment check
const isDevelopment = process.env.NODE_ENV === 'development';
const devGuildId = process.env.DEV_GUILD_ID;

client.once('ready', () => {
    if (isDevelopment && devGuildId) {
        // Register commands locally for development guild
        rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, devGuildId), { body: commands })
            .then(() => console.log(`Registered commands locally to guild ${devGuildId}`))
            .catch(console.error);
    } else {
        // Register commands globally for production
        rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands })
            .then(() => console.log('Registered global commands'))
            .catch(console.error);
    }
});

// Handling slash command interactions
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    switch (interaction.commandName) {
        case 'active_developer':
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('active_dev_yes')
                        .setLabel('Yes')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('active_dev_no')
                        .setLabel('No')
                        .setStyle(ButtonStyle.Danger),
                );

            const activeDevEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('Become an Active Developer')
                .setDescription('The Active Developer badge is a recognition given to Discord bot developers who actively contribute. Earn it by: \n- Regularly updating your bot \n- Engaging with the community \n- Following best practices.');

            await interaction.reply({
                content: 'Do you want to become an active developer?',
                components: [row],
                embeds: [activeDevEmbed]
            });
            break;

        case 'github':
            const githubEmbed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('GitHub Repository')
                .setURL('https://github.com/your-repository-link')
                .setDescription('Visit our GitHub repository for resources and to contribute!');
            await interaction.reply({ embeds: [githubEmbed] });
            break;

        case 'how_does_it_work':
            const howItWorksEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('How Does It Work')
                .setDescription('Earning the Active Developer emblem involves running this bot and contributing to its development. This includes deploying the bot in your server, actively updating and improving it, and engaging with your bot’s user community.');
            await interaction.reply({ embeds: [howItWorksEmbed] });
            break;

        case 'bot_tips':
            const botTipsEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('Tips for Discord Bot Developers')
                .setDescription('New to Discord bot development? Here are some tips:\n\n' +
                                '- **Understand Discord’s API:** Get familiar with the documentation.\n' +
                                '- **Start Small:** Begin with simple features and gradually add complexity.\n' +
                                '- **Test Regularly:** Ensure your bot runs smoothly and bug-free.\n' +
                                '- **Engage with Your Users:** Gather feedback and make improvements.\n' +
                                '- **Stay Updated:** Keep up with Discord updates and changes.');
            await interaction.reply({ embeds: [botTipsEmbed] });
            break;

            case 'docs':
                const libraryChoice = interaction.options.getString('library');
                let embed = new EmbedBuilder();
            
                switch (libraryChoice) {
                    case 'discord_js':
                        embed.setTitle('JavaScript (discord.js) Documentation')
                             .setURL('https://discord.js.org/#/docs/main/stable/general/welcome')
                             .setDescription('Find the official discord.js library documentation here.')
                             .setThumbnail('https://i.imgur.com/KKUocWM.png');
                        break;
                    case 'discord_py':
                        embed.setTitle('Python (discord.py) Documentation')
                             .setURL('https://discordpy.readthedocs.io/en/stable/')
                             .setDescription('Find the official discord.py library documentation here.')
                             .setThumbnail('https://i.imgur.com/AN4Qi8P.png');
                        break;
                    case 'java_jda':
                        embed.setTitle('Java (JDA) Documentation')
                             .setURL('https://ci.dv8tion.net/job/JDA/javadoc/')
                             .setDescription('Find the official JDA library documentation here.')
                             .setThumbnail('https://i.imgur.com/6RRG7KO.png');
                        break;
                    case 'csharp_discordnet':
                        embed.setTitle('C# (Discord.Net) Documentation')
                             .setURL('https://discordnet.dev/')
                             .setDescription('Find the official Discord.Net library documentation here.')
                             .setThumbnail('https://i.imgur.com/DLEaPxC.png');
                        break;
                    case 'ruby_discordrb':
                        embed.setTitle('Ruby (discordrb) Documentation')
                             .setURL('https://www.rubydoc.info/github/meew0/discordrb')
                             .setDescription('Find the official discordrb library documentation here.')
                             .setThumbnail('https://i.imgur.com/4Z5YgTR.png');
                        break;
                    case 'rust_serenity':
                        embed.setTitle('Rust (Serenity) Documentation')
                             .setURL('https://docs.rs/serenity')
                             .setDescription('Find the official Serenity library documentation here.')
                             .setThumbnail('https://i.imgur.com/tvF7Eth.png');
                        break;
                    case 'go_discordgo':
                        embed.setTitle('Go (DiscordGo) Documentation')
                             .setURL('https://pkg.go.dev/github.com/bwmarrin/discordgo')
                             .setDescription('Find the official DiscordGo library documentation here.')
                             .setThumbnail('https://i.imgur.com/6Fv3Z2K.png');
                        break;
                    case 'elixir_nostrum':
                        embed.setTitle('Elixir (Nostrum) Documentation')
                             .setURL('https://kraigie.github.io/nostrum/')
                             .setDescription('Find the official Nostrum library documentation here.')
                             .setThumbnail('https://i.imgur.com/MA0Tngz.png');
                        break;
                    case 'php_discordphp':
                        embed.setTitle('PHP (DiscordPHP) Documentation')
                             .setURL('https://discord-php.github.io/DiscordPHP/')
                             .setDescription('Find the official DiscordPHP library documentation here.')
                             .setThumbnail('https://i.imgur.com/vefB2Fm.png');
                        break;
                    default:
                        embed.setDescription('Unknown library selected.');
                }
            
                await interaction.reply({ embeds: [embed] });
                break;
            
            
    }
});

// Handling button interactions for /Active_Developer
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    let responseMessage = '';

    if (interaction.customId === 'active_dev_yes') {
        responseMessage = 'Great! Check out our resources on GitHub and start contributing.';
    } else if (interaction.customId === 'active_dev_no') {
        responseMessage = 'Feel free to explore our GitHub repository for other projects and resources.';
    }

    await interaction.update({ content: responseMessage, components: [] });
});

// Bot login
client.login(process.env.DISCORD_TOKEN);