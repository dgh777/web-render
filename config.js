module.exports = {
  token: process.env.BOT_TOKEN || "",

  // Já configurado — não precisa mudar
  id: "1523114141517348976",
  prefix: "+",
  owners: ["1523099969777827962"],
  verifyRole: "1522636913645981787",
  guildId: process.env.BOT_GUILD_ID || "1480249438034202666",
  logChannel: process.env.BOT_LOG_CHANNEL || "1523358001476534282",

  // URL do servidor web no Render (ex: https://meuapp.onrender.com)
  renderUrl: process.env.RENDER_URL || "",
  authLink: process.env.BOT_AUTH_LINK || "",
}
