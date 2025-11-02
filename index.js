// Importation des modules nécessaires (Syntaxe ES Module)
import { Client, GatewayIntentBits, REST, Routes, EmbedBuilder } from 'discord.js';
import util from 'minecraft-server-util';
import http from 'http'; // Nécessaire pour maintenir le service actif sur Render

// --- Configuration ---
// Le jeton est chargé via les variables d'environnement (process.env.DISCORD_TOKEN)
// Le port est également chargé via l'environnement (pour Render)
const PORT = process.env.PORT || 3000;

const SERVER_IP = 'horizonsmp.progamer.me';
const SERVER_VERSION = '1.21.10';

// Configuration du client Discord
// L'intention MessageContent est OBLIGATOIRE pour la commande !cadre
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.MessageContent 
    ] 
});

// Définition des commandes slash (commande /cadre supprimée)
const commands = [
    {
        name: 'help',
        description: 'Affiche la liste de toutes les commandes disponibles.',
    },
    {
        name: 'server-statut',
        description: 'Affiche le statut actuel du serveur Minecraft Horizon SMP.',
    },
    {
        name: 'ip',
        description: 'Affiche l\'adresse IP et la version du serveur Minecraft.',
    },
    {
        name: 'who-am-i',
        description: 'Informations sur le bot.',
    },
];

// --- Fonction de démarrage HTTP (Pour Render 24/7) ---
// Démarrage d'un serveur HTTP minimal pour que Render ne mette pas le service en veille
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Discord Bot is running and maintained by UptimeRobot.');
}).listen(PORT, () => {
    // Cette console.log n'est pas nécessaire mais confirme que le serveur est lancé
    console.log(`HTTP Server listening on port ${PORT}`);
});


// --- Événement de connexion du bot Discord ---
client.on('ready', async () => {
    console.log(`✅ Le bot est prêt ! Connecté en tant que ${client.user.tag}`);

    // Enregistrement des commandes slash
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

    try {
        console.log('Enregistrement global des commandes (peut prendre du temps)...');

        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands },
        );

        console.log('Commandes slash enregistrées avec succès (4).');
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement des commandes :', error);
    }
});

// --- Gestion des interactions (commandes slash restantes) ---
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    switch (commandName) {
        case 'help':
            await handleHelp(interaction);
            break;

        case 'who-am-i':
            await handleWhoAmI(interaction);
            break;

        case 'ip':
            await handleIP(interaction);
            break;

        case 'server-statut':
            await handleServerStatut(interaction);
            break;
        
        // Commande /cadre retirée
    }
});


// --- GESTION DES COMMANDES PAR PREFIXE (NEW!) ---
client.on('messageCreate', async message => {
    // Ignorer les messages des bots pour éviter les boucles infinies
    if (message.author.bot) return;

    const prefix = '!';
    const commandBody = message.content.trim();

    // Vérifier si le message commence par !cadre
    if (commandBody.toLowerCase().startsWith(`${prefix}cadre`)) {
        
        // Extraire le message à encadrer (tout ce qui vient après "!cadre")
        const contentToFrame = commandBody.slice(prefix.length + 'cadre'.length).trim();
        
        if (!contentToFrame) {
            // Répondre si l'utilisateur n'a rien mis après !cadre
            return message.reply({ content: "Veuillez fournir le message à encadrer après `!cadre` !", allowedMentions: { repliedUser: true }});
        }

        try {
            // Créer le Cadre (Embed) qui conserve le Markdown
            const embed = new EmbedBuilder()
                .setColor(0x3498DB) // Bleu vif pour le cadre
                .setDescription(contentToFrame) // Le contenu (gras, italique, etc. conservés)
                .setFooter({ text: `Encadré demandé par ${message.author.tag}` })
                .setTimestamp();

            // Supprimer le message de commande original pour nettoyer le chat
            await message.delete(); 

            // Envoyer le message encadré (Embed)
            await message.channel.send({ embeds: [embed] });

        } catch (error) {
            console.error("Erreur lors de l'exécution de !cadre:", error);
            message.channel.send(`Une erreur est survenue lors de l'encadrement du message. Contactez un admin.`).catch(() => {});
        }
    }
});

// --- Commandes Slash ---
// ... (handleHelp, handleWhoAmI, handleIP, handleServerStatut restent inchangées)

async function handleHelp(interaction) {
    const embed = new EmbedBuilder()
        .setColor(0xFFA500) // Orange pour le message d'aide
        .setTitle('📚 Guide des Commandes Horizon Bot')
        .setDescription('Je suis là pour vous donner des informations rapides sur le serveur Horizon SMP !')
        .setThumbnail(client.user.displayAvatarURL())
        .addFields(
            { name: '!cadre [message]', value: '**NOUVEAU !** Encadre votre message dans un bloc stylé (Embed).', inline: false },
            { name: '/help', value: 'Affiche cette liste de commandes.', inline: false },
            { name: '/server-statut', value: 'Vérifie en temps réel si le serveur Minecraft est en ligne, le nombre de joueurs, la version et le MOTD.', inline: false },
            { name: '/ip', value: 'Affiche l\'adresse IP et la version requise pour rejoindre le serveur.', inline: false },
            { name: '/who-am-i', value: 'Affiche les informations de base sur ce bot.', inline: false }
        )
        .setFooter({ text: 'Pour toute autre question, contactez un administrateur.' });

    await interaction.reply({ embeds: [embed] });
}


async function handleWhoAmI(interaction) {
    const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle('🤖 Qui suis-je ?')
        .setDescription('Je suis Horizon Bot, conçu pour vous apporter des informations en temps réel sur le serveur Minecraft Horizon SMP !')
        .setThumbnail(client.user.displayAvatarURL())
        .addFields(
            { name: 'Mon rôle', value: 'Faciliter l\'accès aux statistiques et à l\'IP du serveur.' }
        )
        .setFooter({ text: 'Bot par la communauté Horizon SMP' });

    await interaction.reply({ embeds: [embed] });
}

async function handleIP(interaction) {
    const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('🌐 Adresse du Serveur Horizon SMP')
        .setDescription('Voici les informations de connexion pour rejoindre l\'aventure !')
        .addFields(
            { name: 'Adresse IP', value: `\`${SERVER_IP}\``, inline: true },
            { name: 'Version', value: `\`${SERVER_VERSION}\``, inline: true }
        )
        .setFooter({ text: 'Bon jeu sur Horizon SMP !' });

    await interaction.reply({ embeds: [embed] });
}

async function handleServerStatut(interaction) {
    await interaction.deferReply(); // Répondre immédiatement pour ne pas dépasser le délai

    try {
        const response = await util.status(SERVER_IP, 25565, { timeout: 5000 });

        // Correction du bug: S'assurer que le MOTD est une chaîne de caractères
        const motd = Array.isArray(response.motd.clean)
            ? response.motd.clean.join('\n') // Si c'est un tableau de lignes, on les joint
            : response.motd.clean; // Sinon, on prend la chaîne directement

        const embed = new EmbedBuilder()
            .setColor(0x00CCFF)
            .setTitle(`✅ Horizon SMP est EN LIGNE !`)
            .setFields([
                { name: 'Joueurs Actuels', value: `${response.players.online} / ${response.players.max}`, inline: true },
                { name: 'Latence (Ping)', value: `${response.roundTripLatency}ms`, inline: true },
                { name: 'Version Prévue', value: response.version.name, inline: false },
                { name: 'MOTD', value: `\`\`\`${motd.trim()}\`\`\``, inline: false },
            ])
            .setTimestamp()
            .setFooter({ text: `Statut mis à jour à` });

        await interaction.editReply({ embeds: [embed] });

    } catch (error) {
        console.error('Erreur de connexion au serveur Minecraft:', error);

        let errorMessage = "Impossible de contacter le serveur. Il est probablement **stoppé** ou **en maintenance**.";

        if (error.message.includes("Timed out")) {
            errorMessage = "Le serveur n'a pas répondu à temps. Il est peut-être très chargé ou temporairement hors ligne.";
        }

        const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle(`❌ Horizon SMP est HORS LIGNE`)
            .setDescription(errorMessage)
            .addFields(
                { name: 'Dernière IP Tentée', value: SERVER_IP, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: 'Veuillez patienter et réessayer plus tard.' });

        await interaction.editReply({ embeds: [embed] });
    }
}

// Connexion du bot à Discord
client.login(process.env.DISCORD_TOKEN);
