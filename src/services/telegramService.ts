const TelegramBot = require('node-telegram-bot-api');



export function sendMessage(msg: String){
    let users = getUsers();
    let bot = getBot();
    for(let i=0;i!=users.length;i++){
        bot.sendMessage(users[i], msg);
    }
}

function getUsers(): string[]{
    let users = process.env.usuarios;
    if(users!=undefined){
        return users.split(',');
    }
    return [];
}

function getBot(){
    const token = process.env.token;
    const bot = new TelegramBot(token, {polling: false});
    return bot;
}