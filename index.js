// Importations nécessaires pour Discord.js et la consultation du serveur Minecraft
import { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { status } from 'minecraft-server-util';
import 'dotenv/config'; // Pour charger les variables d'environnement du fichier .env

// --- CONFIGURATION DU BOT ET DU SERVEUR MINECRAFT ---

// Récupération du jeton du bot depuis les variables d'environnement (nécessite un fichier .env)
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
// ID du serveur (Guild ID) où les commandes seront enregistrées (facultatif, pour un enregistrement plus rapide)
const GUILD_ID = process.env.GUILD_ID; // Laissez vide ou commentez si vous souhaitez enregistrer globalement

// Informations de votre serveur Minecraft
const MINECRAFT_IP = 'horizonsmp.progamer.me';
const MINECRAFT_PORT = 25565; // Port standard de Minecraft
const MINECRAFT_VERSION = '1.21.10';

// Initialisation du client Discord avec les intentions nécessaires
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, // Nécessaire pour les interactions et les commandes slash
    ]
});

// --- DÉFINITION DES COMMANDES SLASH ---

const commands = [
    // Commande /ip
    new SlashCommandBuilder()
        .setName('ip')
        .setDescription("Affiche l'adresse IP et la version du serveur Horizon SMP."),

    // Commande /who-am-i
    new SlashCommandBuilder()
        .setName('who-am-i')
        .setDescription("Fournit des informations sur le rôle du bot."),

    // Commande /server-statut
    new SlashCommandBuilder()
        .setName('server-statut')
        .setDescription("Vérifie l'état actuel (en ligne/hors ligne) du serveur Horizon SMP."),
].map(command => command.toJSON());

// --- GESTION DES ÉVÉNEMENTS DU BOT ---

// Événement : Le bot est prêt
client.once('ready', async () => {
    console.log(`✅ Le bot est prêt ! Connecté en tant que ${client.user.tag}`);

    try {
        // Enregistrement des commandes
        let applicationCommands;

        if (GUILD_ID) {
            // Enregistrement spécifique à un serveur (rapide pour les tests)
            const guild = client.guilds.cache.get(GUILD_ID);
            if (guild) {
                applicationCommands = guild.commands;
                console.log(`Enregistrement des commandes sur le serveur : ${guild.name}`);
            }
        } else {
            // Enregistrement global (peut prendre jusqu'à 1 heure)
            applicationCommands = client.application?.commands;
            console.log("Enregistrement global des commandes (peut prendre du temps)...");
        }

        if (applicationCommands) {
            await applicationCommands.set(commands);
            console.log(`Commandes slash enregistrées avec succès (${commands.length}).`);
        }

    } catch (error) {
        console.error("Erreur lors de l'enregistrement des commandes :", error);
    }
});


// Événement : Gestion des interactions (Commandes Slash)
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    switch (commandName) {
        // --- /ip : Affichage de l'IP et de la Version ---
        case 'ip':
            const ipEmbed = new EmbedBuilder()
                .setColor('#2ecc71') // Vert
                .setTitle("🌐 Adresse et Version du Serveur")
                .setDescription(`Rejoignez **Horizon SMP** !`)
                .addFields(
                    { name: 'Adresse IP', value: `\`${MINECRAFT_IP}\``, inline: true },
                    { name: 'Version Recommandée', value: `\`${MINECRAFT_VERSION}\``, inline: true }
                )
                .setFooter({ text: "Bon jeu sur Horizon SMP !" });

            await interaction.reply({ embeds: [ipEmbed] });
            break;

        // --- /who-am-i : Description du Bot ---
        case 'who-am-i':
            const whoAmIEmbed = new EmbedBuilder()
                .setColor('#3498db') // Bleu
                .setTitle("🤖 Qui suis-je ?")
                .setDescription(
                    "Je suis le bot **Horizon Helper**, un assistant dévoué au serveur Minecraft Horizon SMP. " +
                    "Mon but est de fournir rapidement des informations essentielles sur le serveur, telles que son statut, " +
                    "le nombre de joueurs en ligne et l'adresse de connexion."
                )
                .setThumbnail(client.user.displayAvatarURL())
                .addFields(
                    { name: 'Commandes Utiles', value: '`/server-statut`, `/ip`', inline: false }
                );

            await interaction.reply({ embeds: [whoAmIEmbed] });
            break;

        // --- /server-statut : Vérification de l'État du Serveur ---
        case 'server-statut':
            // Réponse immédiate pour indiquer que la vérification est en cours
            await interaction.deferReply();

            try {
                // Interrogation du serveur Minecraft
                const response = await status(MINECRAFT_IP, MINECRAFT_PORT, { timeout: 5000 });

                // Extraction des données
                const playerCount = response.players.online;
                const maxPlayers = response.players.max;
                const motdClean = response.motd.clean.join('\n');
                const protocolVersion = response.version.name;

                // Construction de l'embed pour le statut EN LIGNE
                const onlineEmbed = new EmbedBuilder()
                    .setColor('#00ff00') // Vert pour en ligne
                    .setTitle(`🟢 Horizon SMP est EN LIGNE !`)
                    .setDescription(`**${playerCount}** joueur(s) sont connectés actuellement.`)
                    .addFields(
                        { name: 'Joueurs', value: `${playerCount} / ${maxPlayers}`, inline: true },
                        { name: 'Version', value: `${protocolVersion}`, inline: true },
                        { name: 'Message du Jour (MOTD)', value: motdClean, inline: false }
                    )
                    .setTimestamp();

                await interaction.editReply({ embeds: [onlineEmbed] });

            } catch (error) {
                // Le serveur n'a pas répondu ou est hors ligne
                console.error(`Erreur de connexion au serveur Minecraft: ${error.message}`);

                const offlineEmbed = new EmbedBuilder()
                    .setColor('#ff0000') // Rouge pour hors ligne
                    .setTitle('🔴 Horizon SMP est HORS LIGNE')
                    .setDescription(
                        "Impossible d'obtenir le statut. Le serveur est probablement éteint ou en cours de redémarrage. " +
                        "Veuillez réessayer plus tard ou contacter un administrateur."
                    )
                    .setTimestamp();

                await interaction.editReply({ embeds: [offlineEmbed] });
            }
            break;
    }
});

// Connexion du bot à Discord
client.login(DISCORD_TOKEN).catch(err => {
    console.error("Échec de la connexion. Vérifiez si votre DISCORD_TOKEN est correct :", err.message);
});
