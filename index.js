const Discord = require('discord.js');
const client = new Discord.Client({ intents: 32767 });
const config = require("./config");
const chalk = require('chalk');
const db = require('./db');
const axios = require('axios');

client.on("ready", () => {
    console.log(chalk.green(`[BOT] Logado como ${client.user.tag}`));
});

client.on("messageCreate", async (ctx) => {
    if (!ctx.guild || ctx.author.bot) return;
    const prefixRegex = new RegExp(`^(<@!?${client.user.id}>|${escapeRegex(config.prefix)})\\s*`);
    if (!prefixRegex.test(ctx.content)) return;
    const [, matchedPrefix] = ctx.content.match(prefixRegex);
    const args = ctx.content.slice(matchedPrefix.length).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();

    if (cmd === "wl") {
        if (!config.owners.includes(ctx.author.id)) return;
        switch (args[0]) {
            case "add":
                const user = !isNaN(args[1]) ? (await client.users.fetch(args[1]).catch(() => {})) : undefined || ctx.mentions.users.first();
                if (db.get(`wl_${user.id}`) === null) {
                    db.set(`wl_${user.id}`, true);
                    ctx.channel.send({ embeds: [{ description: `**${user.username}** foi adicionado na whitelist`, color: "2F3136" }] });
                } else {
                    ctx.channel.send({ embeds: [{ description: `**${user.username}** já está na whitelist`, color: "2F3136" }] });
                }
                break;
            case "remove":
                const user2 = !isNaN(args[1]) ? (await client.users.fetch(args[1]).catch(() => {})) : undefined || ctx.mentions.users.first();
                if (db.get(`wl_${user2.id}`) !== null) {
                    db.delete(`wl_${user2.id}`);
                    ctx.channel.send({ embeds: [{ description: `**${user2.username}** foi removido da whitelist`, color: "2F3136" }] });
                } else {
                    ctx.channel.send({ embeds: [{ description: `**${user2.username}** não está na whitelist`, color: "2F3136" }] });
                }
                break;
            case "list":
                var content = "";
                const blrank = db.all().filter((data) => data.ID.startsWith(`wl_`)).sort((a, b) => b.data - a.data);
                for (let i in blrank) {
                    if (blrank[i].data === null) blrank[i].data = 0;
                    content += `\`${blrank.indexOf(blrank[i]) + 1}\` ${client.users.cache.get(blrank[i].ID.split("_")[1])?.tag || blrank[i].ID.split("_")[1]} (\`${blrank[i].ID.split("_")[1]}\`)\n`;
                }
                ctx.channel.send({ embeds: [{ title: "Usuários na Whitelist", description: `${content || 'Nenhum usuário.'}`, color: "2F3136" }] });
                break;
        }
    }

    if (cmd === "help") {
        if (db.get(`wl_${ctx.author.id}`) !== true && !config.owners.includes(ctx.author.id)) return;
        ctx.channel.send({
            embeds: [{
                color: "2F3136",
                title: '👾 Lista de Comandos',
                description: '**🤖 Bot OAuth2**\n`joinall`, `users`, `links`, `verifica`\n\n🛠️ **Admin**\n`remover-cargo-all <id>` — remove cargo de todos\n`wl add/remove/list` — whitelist\n\n🤖 **Prefix** `' + config.prefix + '`\n\n📌 *Cargo ao verificar:* `' + config.verifyRole + '`',
            }]
        });
    }

    if (cmd === "verifica") {
        if (db.get(`wl_${ctx.author.id}`) !== true && !config.owners.includes(ctx.author.id)) return;
        const embed = new Discord.MessageEmbed()
            .setColor("#2F3136")
            .setTitle("✅ Verificação")
            .setDescription("Clique no botão abaixo para se verificar.\n\n📌 Após concluir a verificação você terá acesso aos canais e receberá o cargo de membro.")
            .setFooter({ text: ctx.guild.name, iconURL: ctx.guild.iconURL({ dynamic: true }) })
            .setTimestamp();
        const row = new Discord.MessageActionRow()
            .addComponents(
                new Discord.MessageButton()
                    .setLabel("✅ Verificar")
                    .setStyle("LINK")
                    .setURL(config.authLink)
            );
        ctx.channel.send({ embeds: [embed], components: [row] });
    }

    if (cmd === "links") {
        if (db.get(`wl_${ctx.author.id}`) !== true && !config.owners.includes(ctx.author.id)) return;
        ctx.channel.send({
            embeds: [{
                title: '👾 OAuth/Invite:',
                description: `📥 **Link OAuth2:** ${config.authLink}\n\`\`\`${config.authLink}\`\`\`\n🤖 **Invite Bot:** https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot\n\`\`\`https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot\`\`\``,
                color: "2F3136"
            }]
        });
    }

    if (cmd === "joinall") {
        if (db.get(`wl_${ctx.author.id}`) !== true && !config.owners.includes(ctx.author.id)) return;
        if (!config.renderUrl) return ctx.channel.send({ embeds: [{ description: '❌ RENDER_URL não configurado.', color: 'FF0000' }] });

        let msg = await ctx.channel.send({ content: '**Buscando usuários...**' });

        let json;
        try {
            const res = await axios.get(config.renderUrl + '/allAuth', { timeout: 15000 });
            json = res.data;
        } catch (e) {
            return msg.edit({ content: '', embeds: [{ description: `❌ Não foi possível conectar ao servidor web.\n\`${e.message}\``, color: 'FF0000' }] });
        }

        let error = 0;
        let success = 0;
        let already_joined = 0;

        for (const i of json) {
            const user = await client.users.fetch(i.userID).catch(() => {});
            if (ctx.guild.members.cache.get(i.userID)) already_joined++;
            await ctx.guild.members.add(user, { accessToken: i.access_token }).catch(() => { error++; });
            const member = ctx.guild.members.cache.get(i.userID);
            if (member && config.verifyRole) {
                await member.roles.add(config.verifyRole).catch(() => {});
            }
            success++;
        }

        await msg.edit({
            content: '',
            embeds: [{
                title: '👾 OAuth2 Joinall',
                description: `📥 **Já estava no servidor:** ${already_joined}\n✅ **Sucesso:** ${success}\n❌ **Erro:** ${error}`,
                color: "2F3136"
            }]
        }).catch(() => {});
    }

    if (cmd === "users") {
        if (db.get(`wl_${ctx.author.id}`) !== true && !config.owners.includes(ctx.author.id)) return;
        if (!config.renderUrl) return ctx.channel.send({ embeds: [{ description: '❌ RENDER_URL não configurado.', color: 'FF0000' }] });

        let count;
        try {
            const res = await axios.get(config.renderUrl + '/allAuth', { timeout: 10000 });
            count = res.data.length;
        } catch (e) {
            return ctx.channel.send({ embeds: [{ description: `❌ Não foi possível conectar ao servidor web.\n\`${e.message}\``, color: 'FF0000' }] });
        }

        ctx.channel.send({
            embeds: [{
                title: '👾 OAuth2 Usuários:',
                description: `📥 **${count}** usuário(s) registrado(s) no bot.\nDigite \`${config.prefix}links\` para ver o link OAuth2.`,
                color: "2F3136"
            }]
        });
    }

    if (cmd === "remover-cargo-all") {
        if (!config.owners.includes(ctx.author.id)) return;
        const roleId = args[0] || config.verifyRole;
        let role = ctx.guild.roles.cache.get(roleId) || await ctx.guild.roles.fetch(roleId).catch(() => null);
        if (!role) {
            return ctx.channel.send({ embeds: [{ description: `❌ Cargo \`${roleId}\` não encontrado.`, color: "FF0000" }] });
        }
        let msg = await ctx.channel.send({ embeds: [{ description: `⏳ Buscando membros com o cargo **${role.name}**...`, color: "2F3136" }] });
        let removed = 0;
        let errors = 0;
        let lastError = '';

        const allMembers = await ctx.guild.members.fetch({ withPresences: false }).catch(() => null);
        if (!allMembers) {
            return msg.edit({ embeds: [{ description: '❌ Não foi possível buscar os membros.', color: 'FF0000' }] });
        }

        const comCargo = allMembers.filter(m => m.roles.cache.has(roleId));
        await msg.edit({ embeds: [{ description: `⏳ Removendo cargo de **${comCargo.size}** membro(s)...`, color: "2F3136" }] });

        for (const [, member] of comCargo) {
            const ok = await member.roles.remove(roleId).then(() => true).catch((e) => {
                lastError = e.message;
                return false;
            });
            if (ok) removed++; else errors++;
        }

        const erroMsg = lastError ? `\n⚠️ Último erro: \`${lastError}\`` : '';
        await msg.edit({
            embeds: [{
                title: '🗑️ Remover Cargo — Concluído',
                description: `**Cargo:** ${role.name}\n✅ **Removido de:** ${removed} membro(s)\n❌ **Erro:** ${errors}${erroMsg}`,
                color: "2F3136"
            }]
        }).catch(() => {});
    }
});

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, `\\$&`);
}

client.login(config.token).catch(() => {
    throw new Error('TOKEN OU INTENT INVÁLIDA!');
});
