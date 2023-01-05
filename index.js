const { Client, GatewayIntentBits, ActionRow, MessageActivityType, ButtonBuilder, ActionRowBuilder } = require('discord.js');
const {token} = require('./config.json');
const { TicTacToe } = require('./databaseObjects.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]});

client.once('ready', () => {
    console.log('Ready!');
});

client.on('messageCreate', (message) => {
    if(message.author.id == client.user.id) return;

    if(message.content == "ping") {
        message.reply("pong");
    }
});

/* Tic-Tac-Toe */
let EMPTY = Symbol("empty");
let PLAYER = Symbol("Player");
let BOT = Symbol("Bot");

let tictactoe_state

function makeGrid() {
    components = []
    for(let i = 0; i < 3; i++){
        actionRow = new ActionRowBuilder()
        for(let j = 0; j < 3; j++){
            messageButton = new ButtonBuilder()
                .setCustomId('tic-tac-toe_' + i + "_" + j)
            
            switch(tictactoe_state[i][j]) {
                case EMPTY:
                    messageButton.setLabel(' ')
                        .setStyle('Secondary')
                    break;
                case PLAYER:
                    messageButton.setLabel('X')
                        .setStyle('Primary')
                    break;
                case BOT:
                    messageButton.setLabel('O')
                        .setStyle('Danger')
                    break;
            }
            actionRow.addComponents(messageButton);
        }
        components.push(actionRow);
    }
    return components
}

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function isDraw() {
    for(let i = 0; i < 3;i++){
        for(let j = 0; j < 3; j++){
            if(tictactoe_state[i][j] == EMPTY){
                return false;
            }
        }
    }
    return true;
}

function isGameOver() {
    for(let i = 0; i < 3; i++){
        if((tictactoe_state[i][0] == tictactoe_state[i][1] && tictactoe_state[i][1] === tictactoe_state[i][2]) && tictactoe_state[i][2] != EMPTY){
            return true;
        }
        if((tictactoe_state[0][i] == tictactoe_state[1][i] && tictactoe_state[1][i] == tictactoe_state[2][i]) && tictactoe_state[2][i] != EMPTY){
            return true;
        }
    }

    if(tictactoe_state[1][1] != EMPTY){
        if((tictactoe_state[0][0] == tictactoe_state[1][1] && tictactoe_state[1][1] == tictactoe_state[2][2]) || (tictactoe_state[2][0] == tictactoe_state[1][1] && tictactoe_state[1][1]== tictactoe_state[0][2])){
            return true;
        }
    }
    return false;
}

client.on('interactionCreate', async interaction => {
    if(!interaction.isButton()) return;
    if(!interaction.customId.startsWith('tic-tac-toe_')) return;

    if (isGameOver()) {
        interaction.update({
            components: makeGrid()
        })
        return;
    }
    
    parsedFields =  interaction.customId.split("_")
    let row = parsedFields[1]
    let col = parsedFields[2]

    if(tictactoe_state[row][col] != EMPTY){
        interaction.update({
            content: "You can't select this position",
            components: makeGrid()
        })
        return;
    }
    tictactoe_state[row][col] = PLAYER;

    if (isGameOver()) {
        let user = await TicTacToe.findOne({
            where: {
                user_id: interaction.user.id
            }
        });
        if(!user) {
            user = await TicTacToe.create({user_id: interaction.user.id });
        }

        await user.increment('score');

        interaction.update({
            content: "You have won Tic - Tac - Toe! You have now won " + (user.get('score') + 1) + " time(s).",
            components: []
        })
        return;
    }

    if (isDraw()) {
        interaction.update({
            content: "The game resulted in a Draw!!",
            components: []
        })
        return;
    }

    /* Bot Functionality */
    let botrow
    let botCol
    do{
        botrow = getRandomInt(3);
        botCol = getRandomInt(3); 
    } while(tictactoe_state[botrow][botCol] != EMPTY);

    tictactoe_state[botrow][botCol] = BOT;

    if (isGameOver()) {
        interaction.update({
            content: "You have lost Tic - Tac - Toe!",
            components: makeGrid()
        })
        return;
    }

    if (isDraw()) {
        interaction.update({
            content: "The game resulted in a Draw!!",
            components: []
        })
        return;
    }

    interaction.update({
        components: makeGrid()
    })

})

client.on('interactionCreate', async interaction => {
    if(!interaction.isCommand()) return;

    const {commandName} = interaction;

    if(commandName == 'tictactoe'){
        tictactoe_state =  [
            [EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY],
        ]

        await interaction.reply({ content: 'Playing a game of tic-tac-toe', components: makeGrid() });
    }
})

/*  */

client.login(token);
