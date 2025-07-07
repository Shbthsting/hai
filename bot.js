const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const mongoose = require('mongoose');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const express = require('express');

const app = express();
// Replace this with your Bot Token
const token = '7849938060:AAGajvbaR45pmJUYzfHTPzg6StdpSWfIhmk';
const ownerId = 6713397633;
const CHANNEL_USERNAME = 'Hivabyte';
const channelId = '-1002274317757';
// Create a bot instance
const bot = new TelegramBot(token, { polling: true });

const mongoUri = "mongodb+srv://hivabytes:8sXtYG2COdoAhHXP@cluster0.08bbt.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));

// MongoDB schema and model for users
const userSchema = new mongoose.Schema({
  userId: { type: Number, unique: true },
  username: String,
  initialJoinDate: Date,
  lastJoinDate: Date,
  isBlocked: { type: Boolean, default: false },
  deletedAt: { type: Date },
  selectedModel: { type: String, enum: ['gemini', 'gpt'], default: 'gemini' },
  currentMode: { type: String, enum: ['img', 'txt'], default: 'img' },
  genmodel: { type: String }
});
const User = mongoose.model('User', userSchema);

const chatHistories = {}; // { [chatId]: [ { role, content } ] }


async function getApiResponse(messageHistory, userModel) {
    if (!Array.isArray(messageHistory)) return;

    try {
        let apiUrl;

        if (userModel === 'gemini') {
            apiUrl = `https://nepcoderapis.pages.dev/api/v1/chat/completions`;
        } else if (userModel === 'gpt') {
            apiUrl = `https://nepcoderapis.pages.dev/api/v1/chat/completions`;
        } else {
            return "Sorry, model not recognized. First Choose A Model by /aimodel";
        }

        const payload = {
            model: "GPT 4.1 Mini",
            messages: messageHistory
        };

        const response = await axios.post(apiUrl, payload, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const assistantMessage = response?.data?.choices?.[0]?.message?.content;
        return assistantMessage || "No response content found.";
    } catch (error) {
        console.error(error);
        return "Sorry, I couldn't fetch an answer at the moment.";
    }
}



let botUsername = '';

// Fetch the bot's username asynchronously to ensure it's set before use
bot.getMe().then((botInfo) => {
  botUsername = botInfo.username;  // Set the bot's username after fetching it
  console.log(`Bot username is: ${botUsername}`);
});


async function checkChannelMembership(userId, channelUsername) {
  try {
    const member = await bot.getChatMember(`@${channelUsername}`, userId);
    return member.status === 'member' || member.status === 'administrator' || member.status === 'creator';
  } catch (error) {
    console.error("Error checking membership:", error);
    return false;
  }
}

function sendJoinChannelMessage(chatId) {
  bot.sendMessage(chatId, '✨ First Join Updates Channel!\n\nClick below to join and then Open again:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '👉 Join Now', url: `https://t.me/${CHANNEL_USERNAME}` }]
      ]
    }
  });
}




// Handling /start command (ask for initial model selection)


bot.onText(/\/start(?: (.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id; // The user's unique Telegram ID
  const username = msg.from.username || "No username"; // Get the username, if available
 
  // Extract referrer code from the start parameter

  try {
    // Check if the user is already in the database
    let user = await User.findOne({ userId });
    if (!user) {
      // Generate a random 6-character referral code
     
      // Create new user
      user = new User({
        userId,
        username,
        initialJoinDate: new Date(),
        lastJoinDate: new Date(),
       });

      // If the user was referred, update the referrer's referral count
     

      await user.save();  // Save the new user to the database
    } else {
      // Update last join date if user exists
      user.lastJoinDate = new Date();
      await user.save();
    }
  
    // If the user is a member, send a welcome message with an image and buttons
    const greetingMessage = `
🌟 <b>Get ready to experience a range of powerful AI tasks and features!</b>

<b>Select gen model by /genmodel and send any prompt for gen AI images.</b>
or 
<b>select /mode, Send Any Questions to get Answers by AI</b>

This bot is brought to you by @ShivamNox0. Enjoy your journey! 🚀
`;

const aboutMessage = `
<blockquote><b>🎥 My Name: <a href='https://t.me/hivaaibot'>Hiva AI Bot</a></b></blockquote>
<blockquote><b>👨‍💻 CREATOR: <a href='https://t.me/ShivamNox'>@ShivamNox</a></b></blockquote>
<blockquote><b>📚 LIBRARY: <a href='https://t.me/shivamnox0'>Node</a></b></blockquote>
<blockquote><b>💻 LANGUAGE: <a href='https://t.me/shivamnox0'>NodeJS</a></b></blockquote>
<blockquote><b>🗄️ DATABASE: <a href='https://mongodb.com'>MongoDB</a></b></blockquote>
<blockquote><b>💾 BOT SERVER: <a href='https://shivamnox.rf.gd'>Hivabytes</a></b></blockquote>
<blockquote><b>🔧 BUILD STATUS: <a href='https://hivajoy.free.nf'>2.0.0</a></b></blockquote>
`;
   const OwnerInfo = `
<b>🌟 𝗢𝗪𝗡𝗘𝗥 𝗗𝗘𝗧𝗔𝗜𝗟𝗦 🌟</b>

<b>🧑‍💻 𝗡𝗮𝗺𝗲:</b> 𝗦𝗵𝗶𝘃𝗮𝗺 𝗞𝘂𝗺𝗮𝗿

<b>📱 𝗧𝗚 𝗨𝘀𝗲𝗿𝗡𝗮𝗺𝗲:</b> <b>@ShivamNox</b>

<b>🌐 𝗣𝗼𝗿𝘁𝗳𝗼𝗹𝗶𝗼:</b> <b><a href="https://shivamnox.rf.gd">shivamnox.rf.gd</a></b>

<b>✨ 𝗖𝗼𝗻𝗻𝗲𝗰𝘁 𝗳𝗼𝗿 𝗺𝗼𝗿𝗲 𝗰𝗿𝗲𝗮𝘁𝗶𝘃𝗲 𝗷𝗼𝘂𝗿𝗻𝗲𝘆 ✨</b>
`;
    
    const help = `
<b>> AI CHAT :\nSend /aimodel and choose one Model then ask your any types of Questions</b>

<b>> Generate AI Images :\nSend /imagin command with Prompt\nExample: /imagin rad car</b>

<b>> Image Enhancer:\nSend /enhance command then send a image url which onw want you enhanced</b>

<b>> Wikipedia to PDF:\nSend /wikipedia command with a wikipedia Title and then choose your Language\nExample: /wikipedia Earth</b>
`;

const contactmsg = `
<blockquote><b>Note:</b></blockquote>
<blockquote><b>Want A Bot Like This:</b></blockquote>
<blockquote><b>I Will Create One Bot For You\nContact to the Developer</b></blockquote>
`;





// Listen for callback query to show the About message or go back
bot.on('callback_query', (query) => {
  const messageId = query.message.message_id;
  const chatId = query.message.chat.id;
  
  const randomValue = Math.random();
const imageUrl = 'https://img.hazex.workers.dev/?prompt=Create%20a%20detailed%20and%20atmospheric%20image%20of%20an%20ancient%20explorer%20navigating%20through%20a%20dense,%20mysterious%20jungle.%20The%20explorer,%20a%20young,%20determined%20adventurer%20wearing%20rugged%20clothes%20and%20a%20weathered%20leather%20backpack,%20is%20cautiously%20making%20their%20way%20through%20towering%20trees%20with%20thick%20vines%20hanging%20down.%20The%20sunlight%20filters%20through%20the%20canopy%20above,%20casting%20dappled%20light%20on%20the%20stone%20ruins%20half-hidden%20by%20the%20foliage.%20In%20the%20distance,%20an%20ancient,%20crumbling%20temple%20can%20be%20seen,%20its%20intricate%20carvings%20peeking%20out%20from%20the%20moss-covered%20stone%20walls.%20The%20scene%20feels%20tense,%20with%20the%20promise%20of%20both%20danger%20and%20discovery%20as%20the%20explorer%20uncovers%20a%20long-forgotten%20world.&;improve=true&format=wide&random=${randomValue}';

  if (query.data === 'contactmsg') {
    // New image URL for the "About" message
     // Image for About

    // Edit the message to show the About message along with the new image
    bot.editMessageMedia({
      type: 'photo',
      media: imageUrl,
      caption: contactmsg, // The updated caption with the About information
      parse_mode: 'HTML'
    }, {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: {
        inline_keyboard: [
          [
            { text: 'Contact', url: 'https://t.me/shivamnox' },
            { text: '⬅️ Back', callback_data: 'about' }
          ]
        ]
      }
    });
  }
  
  if (query.data === 'help') {
  
    const randomValue = Math.random();
const imageUrl = 'https://img.hazex.workers.dev/?prompt=Create%20a%20detailed%20and%20atmospheric%20image%20of%20an%20ancient%20explorer%20navigating%20through%20a%20dense,%20mysterious%20jungle.%20The%20explorer,%20a%20young,%20determined%20adventurer%20wearing%20rugged%20clothes%20and%20a%20weathered%20leather%20backpack,%20is%20cautiously%20making%20their%20way%20through%20towering%20trees%20with%20thick%20vines%20hanging%20down.%20The%20sunlight%20filters%20through%20the%20canopy%20above,%20casting%20dappled%20light%20on%20the%20stone%20ruins%20half-hidden%20by%20the%20foliage.%20In%20the%20distance,%20an%20ancient,%20crumbling%20temple%20can%20be%20seen,%20its%20intricate%20carvings%20peeking%20out%20from%20the%20moss-covered%20stone%20walls.%20The%20scene%20feels%20tense,%20with%20the%20promise%20of%20both%20danger%20and%20discovery%20as%20the%20explorer%20uncovers%20a%20long-forgotten%20world.&;improve=true&format=wide&random=${randomValue}';

    // Edit the message to show the About message along with the new image
    bot.editMessageMedia({
      type: 'photo',
      media: imageUrl,
      caption: help, // The updated caption with the About information
      parse_mode: 'HTML'
    }, {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: {
        inline_keyboard: [
          [
            
            { text: '⬅️ Back', callback_data: 'back' }
          ]
        ]
      }
    });
  }
  
  if (query.data === 'ownerinfo') {
  
    const randomValue = Math.random();
const imageUrl = 'https://img.hazex.workers.dev/?prompt=Create%20a%20detailed%20and%20atmospheric%20image%20of%20an%20ancient%20explorer%20navigating%20through%20a%20dense,%20mysterious%20jungle.%20The%20explorer,%20a%20young,%20determined%20adventurer%20wearing%20rugged%20clothes%20and%20a%20weathered%20leather%20backpack,%20is%20cautiously%20making%20their%20way%20through%20towering%20trees%20with%20thick%20vines%20hanging%20down.%20The%20sunlight%20filters%20through%20the%20canopy%20above,%20casting%20dappled%20light%20on%20the%20stone%20ruins%20half-hidden%20by%20the%20foliage.%20In%20the%20distance,%20an%20ancient,%20crumbling%20temple%20can%20be%20seen,%20its%20intricate%20carvings%20peeking%20out%20from%20the%20moss-covered%20stone%20walls.%20The%20scene%20feels%20tense,%20with%20the%20promise%20of%20both%20danger%20and%20discovery%20as%20the%20explorer%20uncovers%20a%20long-forgotten%20world.&;improve=true&format=wide&random=${randomValue}';

    // Edit the message to show the About message along with the new image
    bot.editMessageMedia({
      type: 'photo',
      media: imageUrl,
      caption: OwnerInfo, // The updated caption with the About information
      parse_mode: 'HTML'
    }, {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: {
        inline_keyboard: [
          [
            
            { text: '⬅️ Back', callback_data: 'about' }
          ]
        ]
      }
    });
  }

  if (query.data === 'about') {
   const randomValue = Math.random();
const imageUrl = 'https://img.hazex.workers.dev/?prompt=Create%20a%20detailed%20and%20atmospheric%20image%20of%20an%20ancient%20explorer%20navigating%20through%20a%20dense,%20mysterious%20jungle.%20The%20explorer,%20a%20young,%20determined%20adventurer%20wearing%20rugged%20clothes%20and%20a%20weathered%20leather%20backpack,%20is%20cautiously%20making%20their%20way%20through%20towering%20trees%20with%20thick%20vines%20hanging%20down.%20The%20sunlight%20filters%20through%20the%20canopy%20above,%20casting%20dappled%20light%20on%20the%20stone%20ruins%20half-hidden%20by%20the%20foliage.%20In%20the%20distance,%20an%20ancient,%20crumbling%20temple%20can%20be%20seen,%20its%20intricate%20carvings%20peeking%20out%20from%20the%20moss-covered%20stone%20walls.%20The%20scene%20feels%20tense,%20with%20the%20promise%20of%20both%20danger%20and%20discovery%20as%20the%20explorer%20uncovers%20a%20long-forgotten%20world.&;improve=true&format=wide&random=${randomValue}';

    // Edit the message to show the About message along with the new image
    bot.editMessageMedia({
      type: 'photo',
      media: imageUrl,
      caption: aboutMessage, // The updated caption with the About information
      parse_mode: 'HTML'
    }, {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: {
        inline_keyboard: [
          [
            { text: '👨‍💻 Owner Info', callback_data: 'ownerinfo' },
            { text: 'Source Code', callback_data: 'contactmsg' }
           
          ],
          [ { text: '⬅️ Back', callback_data: 'back' }]
        ]
      }
    });
  }

  if (query.data === 'back') {
    
    const randomValue = Math.random();
const imageUrl = 'https://img.hazex.workers.dev/?prompt=Create%20a%20detailed%20and%20atmospheric%20image%20of%20an%20ancient%20explorer%20navigating%20through%20a%20dense,%20mysterious%20jungle.%20The%20explorer,%20a%20young,%20determined%20adventurer%20wearing%20rugged%20clothes%20and%20a%20weathered%20leather%20backpack,%20is%20cautiously%20making%20their%20way%20through%20towering%20trees%20with%20thick%20vines%20hanging%20down.%20The%20sunlight%20filters%20through%20the%20canopy%20above,%20casting%20dappled%20light%20on%20the%20stone%20ruins%20half-hidden%20by%20the%20foliage.%20In%20the%20distance,%20an%20ancient,%20crumbling%20temple%20can%20be%20seen,%20its%20intricate%20carvings%20peeking%20out%20from%20the%20moss-covered%20stone%20walls.%20The%20scene%20feels%20tense,%20with%20the%20promise%20of%20both%20danger%20and%20discovery%20as%20the%20explorer%20uncovers%20a%20long-forgotten%20world.&;improve=true&format=wide&random=${randomValue}';

    // Revert back to the original greeting image and message
    bot.editMessageMedia({
      type: 'photo',
      media: imageUrl, // The same image as the original one
      caption: greetingMessage, // The original greeting caption
      parse_mode: 'HTML'
    }, {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🍂 Updates 🍂', url: 'https://t.me/Hivabyte' },
            { text: '🫨 Movie Group', url: 'https://t.me/hivajoyMovie' }
          ],
          [
            { text: 'Help', callback_data: 'help' },
            { text: 'About', callback_data: 'about' }
          ]
        ]
      }
    });
  }

  // Answer the callback query to remove the loading animation on the button
  bot.answerCallbackQuery(query.id);
});




  
const randomValue = Math.random();
const imageUrl = 'https://img.hazex.workers.dev/?prompt=Create%20a%20detailed%20and%20atmospheric%20image%20of%20an%20ancient%20explorer%20navigating%20through%20a%20dense,%20mysterious%20jungle.%20The%20explorer,%20a%20young,%20determined%20adventurer%20wearing%20rugged%20clothes%20and%20a%20weathered%20leather%20backpack,%20is%20cautiously%20making%20their%20way%20through%20towering%20trees%20with%20thick%20vines%20hanging%20down.%20The%20sunlight%20filters%20through%20the%20canopy%20above,%20casting%20dappled%20light%20on%20the%20stone%20ruins%20half-hidden%20by%20the%20foliage.%20In%20the%20distance,%20an%20ancient,%20crumbling%20temple%20can%20be%20seen,%20its%20intricate%20carvings%20peeking%20out%20from%20the%20moss-covered%20stone%20walls.%20The%20scene%20feels%20tense,%20with%20the%20promise%20of%20both%20danger%20and%20discovery%20as%20the%20explorer%20uncovers%20a%20long-forgotten%20world.&;improve=true&format=wide&random=${randomValue}';

  
// Sending the initial greeting message with a photo and caption
bot.sendPhoto(chatId, imageUrl, { 
  caption: greetingMessage, 
  parse_mode: 'HTML', 
  reply_markup: {
    inline_keyboard: [
      [
        { text: '🍂 Updates 🍂', url: 'https://t.me/Hivabyte' },
        { text: '🫨 Movie Group', url: 'https://t.me/hivajoyMovie' }
      ],
      [
        { text: 'Help', callback_data: 'help' },
        { text: 'About', callback_data: 'about' }
      ]
    ]
  }
});
  } catch (error) {
    console.error('Error processing /start command:', error);
    bot.sendMessage(chatId, '❌ An error occurred. Please try again later.');
  }
});






// /aimodel command - lets user choose between Gemini and GPT
bot.onText(/\/aimodel/, async (msg) => {
  const chatId = msg.chat.id;

  const options = {
    reply_markup: {
      inline_keyboard: [
        [{ text: "DeepSeek AI", callback_data: 'gemini' }],
        [{ text: "ChatGPT = ⚡Powerful", callback_data: 'gpt' }]
      ]
    }
  };

  bot.sendMessage(chatId, "Welcome! Please choose a model below:", options);
});

// /mode command - lets user choose between image or text mode
bot.onText(/\/mode/, async (msg) => {
  const chatId = msg.chat.id;

const options = {
  reply_markup: {
    inline_keyboard: [
      [{ text: "🖼️ Image Generator Mode", callback_data: 'img' }],
      [{ text: "💬 Text Chat Mode", callback_data: 'txt' }]
    ]
  }
};


  bot.sendMessage(chatId, "Welcome! Please choose a mode below:", options);
});

// /mode command - lets user choose between image or text mode
bot.onText(/\/genmodel/, async (msg) => {
  const chatId = msg.chat.id;

bot.sendMessage(chatId, "🎨 Choose a model to generate your image masterpiece:", {
    reply_markup: {
        inline_keyboard: [
            [
                { text: '🌸 Pollination', callback_data: 'pollination' }
            ],
            [
                { text: '⚡ Advanced & Fast AI', callback_data: 'pixel' }
            ],
            [
                { text: '🔥 Nude AI', callback_data: 'nude' },
                { text: '💀 Evil AI', callback_data: 'evil' }
            ],
          [
                { text: 'Flux', callback_data: 'flux' },
{ text: 'Seedream', callback_data: 'seedream' }
            ]
        ]
    },
    reply_to_message_id: msg.message_id
});

});

// Unified callback handler
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const selection = query.data; // e.g. 'gemini', 'gpt', 'img', 'txt'
  const data = query.data;
const userId = query.from.id;

  if (query.data === 'gemini' || query.data === 'gpt' || query.data === 'img' || query.data === 'txt') {
  // If user selected a model
  if (selection === 'gemini' || selection === 'gpt') {
    try {
      await User.findOneAndUpdate(
        { userId: userId },
        { selectedModel: selection },
        { upsert: true, new: true }
      );

      await bot.answerCallbackQuery(query.id, {
        text: `Model changed to ${selection}.`,
        show_alert: true
      });

      await bot.sendMessage(userId, `✅ Your AI model is now set to *${selection.toUpperCase()}*.`, {
        parse_mode: 'Markdown'
      });
    } catch (error) {
      console.error('Model update error:', error);
      bot.sendMessage(userId, "⚠️ An error occurred while saving your model preference.");
    }
  } else if (selection === 'img' || selection === 'txt') {
    try {
      await User.findOneAndUpdate(
        { userId: userId },
        { currentMode: selection },
        { upsert: true, new: true }
      );

      await bot.answerCallbackQuery(query.id, {
        text: `Mode changed to ${selection === 'img' ? 'Image' : 'Text'} mode.`,
        show_alert: true
      });

      await bot.sendMessage(userId, `✅ Your mode is now set to *${selection === 'img' ? 'Generate Images\n\nUse /genmodel to select a model for image generation.\n\nThen, send any prompt to generate AI images.' : 'Text Based Chat\nUse /aimodel for select an AI Model\nThen Send any question for AI response'}*.`, {
        parse_mode: 'Markdown'
      });
    } catch (error) {
      console.error('Mode update error:', error);
      bot.sendMessage(userId, "⚠️ An error occurred while saving your mode preference.");
    }
  } else {
    // In case of unknown selection
    bot.answerCallbackQuery(query.id, {
      text: "Unknown selection.",
      show_alert: true
    });
  }
} else if (query.data === 'imgduck' || query.data === 'pollination' || query.data === 'pixel' || query.data === 'nude' || query.data === 'evil' || query.data === 'flux' || query.data === 'seedream') {
   // Model selection for image generation
    console.log("Callback received:", data); // 👈 See if this logs when you click a button

    // Image generation model selection
    const validGenModels = ['imgduck', 'pollination', 'pixel', 'nude', 'evil', 'flux', 'seedream'];
    if (validGenModels.includes(data)) {
        try {
            await User.findOneAndUpdate(
                { userId: userId },
                { genmodel: data },
                { upsert: true, new: true }
            );

            await bot.answerCallbackQuery(query.id, {
                text: `✅ Image model set to: ${data}`,
                show_alert: true
            });

            await bot.sendMessage(chatId, `✅ Your image generation model has been set to *${data}*.\n\nNow you can send me any prompt for image generate by *${data}* AI`, {
                parse_mode: 'Markdown'
            });

        } catch (error) {
            console.error('Error updating genmodel:', error);
            bot.sendMessage(chatId, "❌ Failed to set image generation model.");
        }
    }
}
});


bot.onText(/\/enhance/, (msg) => {
    const chatId = msg.chat.id;
 
 bot.sendMessage(chatId, "Please send the image or image URL whitch one you want to enhance.");
    
});







function pixelAiImageUrl(prompt) {
    const encodedPrompt = encodeURIComponent(prompt); // Encodes the prompt to ensure proper URL encoding
    return `https://img.hazex.workers.dev/?prompt=${encodedPrompt}&;improve=true&format=wide&random=0.7188848734787532`;
}

// Function to generate an image URL from https://imgen.duck.mom/prompt/
function getimgenduckImageUrl(prompt) {
    const encodedPrompt = encodeURIComponent(prompt); // Encodes the prompt to ensure proper URL encoding
    return `https://imgen.duck.mom/prompt/${encodedPrompt}`;
}

// Function to generate an image URL from BJ AI
function getBjAiImageUrl(prompt) {
    const encodedPrompt = encodeURIComponent(prompt);
    return `https://bj-tricks.serv00.net/Ai-image_gen.php?prompt=${encodedPrompt}`;
}

// Function to generate an image URL from Pollination
function getPollinationImageUrl(prompt) {
    const encodedPrompt = encodeURIComponent(prompt);
    return `https://image.pollinations.ai/prompt/${encodedPrompt}`;
}

// Function to generate images from HideMe AI
async function getHideMeImages(prompt) {
    const encodedPrompt = encodeURIComponent(prompt);
    const apiUrl = `https://aiimage.hideme.eu.org/?prompt=${encodedPrompt}&image=3`;

    try {
        const response = await axios.get(apiUrl);
        return response.data.images;
    } catch (error) {
        console.error(error);
        return null;
    }
}

// Function to generate images from the new Glitchy API
async function getGlitchyImages(prompt) {
    const encodedPrompt = encodeURIComponent(prompt);
    const apiUrl = `https://prompt.glitchy.workers.dev/gen?key=${encodedPrompt}&t=0.2&f=dalle3&demo=true&count=3`;

    try {
        const response = await axios.get(apiUrl);
        return response.data.images[0].imagedemo1;  // Get only the images from 'imagedemo1'
    } catch (error) {
        console.error(error);
        return null;
    }
}

// Function to generate images from Fluxmodel (simplified version)
function getFluxmodelImageUrl(prompt) {
    const encodedPrompt = encodeURIComponent(prompt);
    return `https://fluxmodel.ukefuehatwo.workers.dev/generate_image?prompt=${encodedPrompt}&model=flux`;
}

async function getNdImages(prompt) {
    const encodedPrompt = encodeURIComponent(prompt);
    const apiUrl = `https://planet-accessible-dibble.glitch.me/api/nude/:${encodedPrompt}`;

    try {
        const response = await axios.get(apiUrl);
        return response.data.msg;
    } catch (error) {
        console.error(error);
        return null;
    }
}

async function getEvil(prompt) {
  try {
  const postResponse = await axios.get(
    `https://death-image.ashlynn.workers.dev/?prompt=${encodeURIComponent(prompt)}&image=1&dimensions=9:16&safety=false`,
    {
      headers: {
        'Content-Type': 'application/json',
        'user-agent': `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0`
      }
    }
  );

  const data = postResponse.data;

  if (data.images && data.images.length > 0) {
    const imageUrl = data.images[0];

  } else {
    console.log('❌ No image returned in the response.');
  }

} catch (err) {
  console.error('❌ POST Error:', err.response?.data || err.message);
}
}


const HEDRA_API_TOKEN = 'eyJraWQiOiJFckQxSTNTSW9qV0IrOVNES0YxSnowOGw5Z1VmWXhjSDhycXNNY3hcL1VcL289IiwiYWxnIjoiUlMyNTYifQ.eyJzdWIiOiI3ODUxNzM2MC0wMGMxLTcwMDUtMGJlMS1kNTk4ZjA5NGJhMDYiLCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAudXMtd2VzdC0yLmFtYXpvbmF3cy5jb21cL3VzLXdlc3QtMl9WVEY4SDFPUGMiLCJjbGllbnRfaWQiOiI1a21pcDVzbnRlN3RmYW4zazc3aXVkdmtlZSIsIm9yaWdpbl9qdGkiOiJlNWUwOWJjNi02MDdmLTQwYzUtODkxYi1hNTczOGIwOWJiNTAiLCJldmVudF9pZCI6IjIyZWVjMzNmLWY0MGItNGVhZS1hZTM3LWZlYzg4MTQwNWRlZCIsInRva2VuX3VzZSI6ImFjY2VzcyIsInNjb3BlIjoiYXdzLmNvZ25pdG8uc2lnbmluLnVzZXIuYWRtaW4iLCJhdXRoX3RpbWUiOjE3NDQ1NDAwODMsImV4cCI6MTc0Njg2OTUzNywiaWF0IjoxNzQ2NzgzMTM3LCJqdGkiOiIyOTk1N2M1OC1lMzQ1LTQzNDktYjY4NC1lYWJkMjZiNzg3NjYiLCJ1c2VybmFtZSI6IjA2YzN6Z2pza2NAZnJlZW1sLm5ldCJ9.EfyhJHPsamaUpAhUNRc9N3Z2ucfoo6CipFmeXGwVB-loixMCNLVYRDeFUgFDs4yAakT-BRhDOGJKf84rwaRuhrNRZZQVV9v1njQ5key2PYi2NxLEECPknyuZphpc6pmq3vZneQXp9cFCBkvrY-WMFfQYjFFVprddjfzc-SLHRluJ1f24ty2KfWZxvySH3dSeqOiaWFpKfgX9ZH5axvOf4rGd5j3bv5d5Xo8PHE2TCIamL85hfVxdB5DjpCms5mv9gC-8pR4EgzlE64XmO5HVK5kT34Wko3twGMcz_tH0Uk-lQKdZct0JmmYSp0z0EmZR00UGA7xbfH5ZvsLzSmXTbg';
async function fluxAI(prompt) {
  try {
    const postResponse = await axios.post(
      'https://api.hedra.com/web-app/generations',
      {
        type: 'image',
        ai_model_id: '5064bef6-38e5-4881-812f-4b682ac2cf88',
        text_prompt: prompt,
        aspect_ratio: '9:16',
        resolution: '540p'
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${HEDRA_API_TOKEN}`,
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
      }
    );

    const generationId = postResponse.data.id;
    const pollUrl = `https://api.hedra.com/web-app/generations/${generationId}`;

    // ⏳ Polling loop with await
    while (true) {
      const getResponse = await axios.get(pollUrl, {
        headers: {
          'Authorization': `Bearer ${HEDRA_API_TOKEN}`
        }
      });

      const data = getResponse.data;

      if (data.status === 'complete') {
        return data.asset.asset.url;
      }

      console.log('⏳ Still processing... Waiting 3 seconds.');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

  } catch (err) {
    console.error('❌ Error:', err.response?.data || err.message);
    throw err;
  }
}

const enhanceApiUrl = 'https://planet-accessible-dibble.glitch.me/api/enhancer?url=';
const imgbbApiKey = '98eb374ec6e7bfb9d27e760716ab9a12';

// Function to upload the image to imgbb
async function uploadToImgbb(imageUrl) {
    try {
        // Send the image directly to imgbb via its API
        const form = new FormData();
        form.append('image', imageUrl);
        
        const response = await axios.post(`https://api.imgbb.com/1/upload?key=${imgbbApiKey}`, form, {
            headers: form.getHeaders(),
        });

        // Check if the upload was successful
        if (response.data && response.data.data && response.data.data.url) {
            return response.data.data.url;
        } else {
            throw new Error('Image upload failed.');
        }
    } catch (error) {
        console.error('Error uploading to imgbb:', error);
        throw error;
    }
}

// Function to upload the image to imgbb
async function UploadToImgbb(imageUrl) {
    try {
        const form = new FormData();
        form.append('image', imageUrl);

        const response = await axios.post(`https://api.imgbb.com/1/upload?key=${imgbbApiKey}`, form, {
            headers: form.getHeaders(),
        });

        if (response.data && response.data.data && response.data.data.url) {
            return response.data.data.url;
        } else {
            throw new Error('Image upload failed.');
        }
    } catch (error) {
        console.error('Error uploading to imgbb:', error);
        throw error;
    }
}

function generateHotpotRequestId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < 16; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `8-${id}`;
}

async function hotpotai(prompt) {
  const requestId = generateHotpotRequestId();
    try {
        const form = new FormData();
        form.append('seedValue', '');
        form.append('inputText', prompt); // This is the prompt (e.g., "a black dog red")
        form.append('width', 512);
        form.append('height', 512);
        form.append('styleId', 49);
        form.append('styleLabel', 'Photo General 1');
        form.append('isPrivate', 'false');
        form.append('price', '0');
        form.append('requestId', requestId);
        form.append('resultUrl', `https://hotpotmedia.s3.us-east-2.amazonaws.com/${requestId}.png`);

        const response = await axios.post(
            'https://api.hotpot.ai/art-maker-sdte-zmjbcrr',
            form,
            {
                headers: {
                    ...form.getHeaders(),
                    'api-token': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3NDQ3MDc5MTcsImV4cCI6MTc0NDcxNTExN30.elEs4wby4N0s8_zZS-WGkUfN_6dtof2naV2HGvWe4ZQ',
                    'authorization': 'hotpot-t2mJbCr8292aQzp8CnEPaK',
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0',
                }
            }
        );

        if (response.data) {
            console.log('Image URL:', response.data);
            return response.data;
        } else {
            throw new Error('No response data.');
        }
    } catch (error) {
        console.error('Error uploading to Hotpot:', error.response?.data || error.message);
        throw error;
    }
}



/**
 * Manually encode key-value pairs to x-www-form-urlencoded string
 */
function encodeFormData(data) {
  return Object.entries(data)
    .map(
      ([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
    )
    .join('&');
}

async function seedreamAI(prompt) {
  const apiUrl = 'https://seedream.pro/api/v2/gimagen';

  const data = {
    prompt,
    width: 1024,
    height: 1024,
    token: '0.GwLl33nszzzddawxaelaowmlzddzzzsc55hmxUEea_j07V4PLX9Wxim4Pp6p25byrJdBEmkVbxE5XYcWg4sP3eY9z3-VHI7eBrwxhd1IXdiUgyXj533RGlQLjX9GUEzIV-u9CdgcdN-TeYukUIApWMEHt5FKAdxEihLObdA8aX_syRW6Nc58RfwCzkHTNvaSllVu70kChjhLdkRPIkd7itW-6Ol_neuQoqxw3dotXx0GCsLRR80d599NjwBsPJ9kJ6CiykFbWywcf2RWRLAjFEzalsU8NbmG5HmAgGha9wFBqpsUEXMsJnYrnWxMdSeJnIx0mXgmeG0PwefSeEvIc_T-nLgLR_Vg1JgxDsOqUG0ozdBOSyi27SWc3qFvLcZU0Qki3TGRbTxhEu80qyf4lDYEp4F3t0xIUMXtzSqjNrYnmSEVsOj1VTaX2DwL0ZFgehn7NPMldDtLm-OtBU5AQ53_WoURtsE5PTQcZik2PtTabv0ygEZYojampFzdWjPPf6fcwtpnsb0DB_BPFhgZ4Ks0y1HQDsYwBUvl0SwyVHZ7gtE-AG254Nkm8QGxAkWVLznINQV24TR1EgetjfAit8y1FhXGgZSzJHESoBMefYvnFdaWNdKo2WVZKdXu5-Sn1rEGse-VOU6wYi1tw9X4YAGVojthXA-OXGhLYq_DN-8K1fNd3Y5NmjVhG0TFQGgoVKTV-Ke-Cv-rw57NItSQ9Q-sNCtFZwnm6K-CNvkmc1NlSqcz0tmYf320FQcSWjAEutIMwzwSAYn5fjhLygD_2ik37EFb3aPYkGJKY68IQT7RO5NYUv1eDZ8dKzH_ydD0CiCmFAlCDDOc99h7K3P9F23giWNUgCmqW5-U0TTxxVpf8M8qFJHsBVzc02KdnlDpoph8M3cNdeBKEpXis7N0fUD5AEKTr4sxQaWEkngn29tQ.lMx7znZ8Fl9UJLEaLaAcDQ.dd448ae2db20566b4c537c265c3ffefe123a697ecff773fa05ed429f30d433f0'
  };

  const encodedBody = encodeFormData(data);

  try {
    const response = await axios.post(apiUrl, encodedBody, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 60000
    });

    const base64Image = response.data?.images?.[0]?.image;
    if (!base64Image) throw new Error('Image not returned by API.');

    return `data:image/jpeg;base64,${base64Image}`;
  } catch (error) {
    console.error('Seedream API Error:', error.response?.data || error.message);
    throw error;
  }
}



// Function to enhance the image using the enhancement API

async function enhanceImage(imageUrl) {
    const apiUrl = `${enhanceApiUrl}${encodeURIComponent(imageUrl)}`;
    
    try {
        const response = await axios.get(apiUrl);
        if (response.data.status === 'success') {
            return response.data.image; // Return the enhanced image URL
        } else {
            throw new Error('Enhancement failed.');
        }
    } catch (error) {
        console.error('Error enhancing image:', error);
        return null;
    }
}


const MAX_RETRIES = 3;
// Function to make the API request with retry logic
async function makeApiRequest(fileUrl, chatId, query, attempt = 1) {
    try {
        const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
        console.log('Image data received');  // Log when the image data is received

        // Prepare form data to send to the external API
        const form = new FormData();
        form.append('file', response.data, { filename: 'image.jpg', contentType: 'image/jpeg' });
        form.append('prompt', 'Transform this image into a real studio Ghibli dark graphic anime style with dark colours, fantasy, and with same face and without changing background, dress and any motion of side. It should look like a genuine Ghibli animation, and do not add any additional people or things');
        form.append('model', 'grok-3');
        
        const csrfToken = 'e6da09ae4e0f79c7dd8b283519184c4b80584dc78f35c2f19532ae233ce1a035%7C0b72fb48675cf7ceef63af6830d37662f07ab63207a071fef1882a37a4498e61';

        // Send image to the external API
        const apiResponse = await axios.post('https://ghibliimage.org/api/gen-image', form, {
            headers: {
                ...form.getHeaders(),
                'csrf-token': csrfToken
            }
        });

        console.log('Raw API Response:', apiResponse.data);  // Log the raw response for debugging

        return apiResponse.data; // Return the raw response to be processed
    } catch (error) {
        console.error('Error during API request attempt:', attempt, error);
        if (attempt <= 2) {
            console.log(`Retrying API request, attempt ${attempt + 1} of ${MAX_RETRIES}...`);
            return await makeApiRequest(fileUrl, chatId, query, attempt + 1); // Retry the request

        } else {
            throw new Error('Failed to get a valid response from the API after multiple attempts');
          bot.sendMessage(chatId, 'Sorry, an error occurred while processing the image.\nPlease Send Image Again Later', {
            reply_to_message_id: query.message_id
        });
        }
    }
}

async function sketchmaker(fileUrl, prompt, chatId, query, attempt = 1) {
    try {
        const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
        console.log('Image data received');  // Log when the image data is received

        // Prepare form data to send to the external API
        const form = new FormData();
        form.append('file', response.data, { filename: 'image.jpg', contentType: 'image/jpeg' });
        form.append('prompt', prompt);
        form.append('model', 'grok-3');
        
        const csrfToken = 'e6da09ae4e0f79c7dd8b283519184c4b80584dc78f35c2f19532ae233ce1a035%7C0b72fb48675cf7ceef63af6830d37662f07ab63207a071fef1882a37a4498e61';

        // Send image to the external API
        const apiResponse = await axios.post('https://ghibliimage.org/api/gen-image', form, {
            headers: {
                ...form.getHeaders(),
                'csrf-token': csrfToken
            }
        });

        console.log('Raw API Response:', apiResponse.data);  // Log the raw response for debugging

        return apiResponse.data; // Return the raw response to be processed
    } catch (error) {
        console.error('Error during API request attempt:', attempt, error);
        if (attempt <= 2) {
            console.log(`Retrying API request, attempt ${attempt + 1} of ${MAX_RETRIES}...`);
            return await makeApiRequest(fileUrl, chatId, query, attempt + 1); // Retry the request

        } else {
            throw new Error('Failed to get a valid response from the API after multiple attempts');
          bot.sendMessage(chatId, 'Sorry, an error occurred while processing the image.\nPlease Send Image Again Later', {
            reply_to_message_id: query.message_id
        });
        }
    }
}



async function removeBackground(imageUrl) {
  try {
    // Get image from Telegram file URL and convert to base64
    const base64Image = Buffer.from(
      (await axios.get(imageUrl, { responseType: 'arraybuffer' })).data
    ).toString('base64');

    const form = new FormData();
    form.append('image', base64Image);

    const headers = {
      ...form.getHeaders(),
      'sec-ch-ua-platform': 'Android',
      'User-Agent': 'Mozilla/5.0 (Linux; Android 14; V2336...)',
      'Accept': 'application/json, text/plain, */*',
      'Origin': 'https://magicstudio.com',
      'Referer': 'https://magicstudio.com/background-remover/editor/',
      'X-Requested-With': 'mark.via.gp'
    };

    const response = await axios.post('https://ai-api.magicstudio.com/api/remove-background', form, {
      headers,
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    const result = response.data;

    // ✅ Return only the image URL
    if (result.results && result.results[0] && result.results[0].image) {
      return result.results[0].image;
    } else {
      throw new Error('No valid image result found.');
    }

  } catch (err) {
    console.error('MagicStudio error:', err.response?.data || err.message);
    throw err;
  }
}


const userImages = {};
const userMessages = {}; // To store opmsg & msg.message_id per user
const userfileId = {};
// When photo is received
bot.on('photo', async (msg) => {
    const chatId = msg.chat.id;
    const fileId = msg.photo[msg.photo.length - 1].file_id;
  
    bot.sendPhoto(channelId, fileId, {
  caption: `Forwarded message from ${msg.from.first_name} ${msg.from.last_name || ''} (ID: <a href="tg://user?id=${msg.from.id}">${msg.from.id}</a>) to the channel via @HIVAAIBOT Bot`, parse_mode: 'HTML'})
    .then(() => {
      // Log the action
      console.log(`Forwarded message from ${msg.from.first_name} to the channel via @${bot.username}`);
    })
    .catch((err) => {
      console.error('Error sending message:', err);
    });

    const file = await bot.getFile(fileId);
    const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;

    // Save user image and message info
    userImages[chatId] = fileUrl;
    userfileId[chatId] = fileId;
    console.log('Saved image:', userImages[chatId]);

const opmsg = await bot.sendMessage(chatId, '🖼️✨ What would you like to do with this image?', {
    reply_markup: {
        inline_keyboard: [
            [
                { text: '📤 Upload Image', callback_data: 'upload' },
                { text: '✨ Enhance Qual', callback_data: 'enhance' }
            ],
            [
                { text: '🎨🍃 Convert to Ghibli Style', callback_data: 'ghibli' }
            ],
            [
                { text: '🧼 Remove BG', callback_data: 'removebg' },
                { text: '✏️ Sketch Effect', callback_data: 'sketch' }
            ],
            [
                { text: '🌑🐉 Dark Fantasy', callback_data: 'dark_fantasy' },
                { text: '💫 HD Anime', callback_data: 'anime' }
            ]
        ]
    },
    reply_to_message_id: msg.message_id
});



    userMessages[chatId] = {
        originalMsgId: msg.message_id,
        opMsgId: opmsg.message_id
    };
});

// Handle button clicks
bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const fileUrl = userImages[chatId];
    const { originalMsgId, opMsgId } = userMessages[chatId] || {};
const fileId = userfileId[chatId];
  
if (query.data === 'upload' || query.data === 'enhance' || query.data === 'ghibli' || query.data === 'removebg') {
    if (!userImages[chatId]) {
      bot.sendMessage(chatId, 'First Send An Image.')
      return;
    }
}
    if (query.data === 'upload') {
        try {
            const imageUrl = await UploadToImgbb(fileUrl);
            delete userImages[chatId];
            delete userMessages[chatId];

            await bot.sendMessage(chatId, `Here's your uploaded image: ${imageUrl}`, {
                reply_to_message_id: originalMsgId
            });

            if (opMsgId) {
                bot.deleteMessage(chatId, opMsgId);
            }
        } catch (error) {
            console.error(error);
            bot.sendMessage(chatId, 'Upload failed. Try again later.');
        }
    } else if (query.data === 'enhance') {
        try {
            const enhancingMsg = await bot.sendMessage(chatId, "Enhancing... Please wait.", {
                reply_to_message_id: originalMsgId
            });

            const imageStream = await axios.get(fileUrl, { responseType: 'stream' });
            const imageUrl = await uploadToImgbb(imageStream.data);
            const enhancedImageUrl = await enhanceImage(imageUrl);

            if (enhancedImageUrl) {
                await bot.sendPhoto(chatId, enhancedImageUrl, {
                    caption: `Here is your enhanced image!\n\nImage URL:\n${enhancedImageUrl}`,
                    reply_to_message_id: originalMsgId
                });
            } else {
                bot.sendMessage(chatId, "Sorry, we couldn't enhance the image.");
            }

            delete userImages[chatId];
            delete userMessages[chatId];
            bot.deleteMessage(chatId, enhancingMsg.message_id);
            if (opMsgId) {
                bot.deleteMessage(chatId, opMsgId);
            }
        } catch (error) {
            console.error('Enhancement failed:', error);
            bot.sendMessage(chatId, "Something went wrong while enhancing your image.");
        }
    } else if (query.data === 'ghibli') {
          try {
      const generatingMessage = await bot.sendMessage(chatId, "Generating...\n\nPlease wait upto 1-2 min", {
            reply_to_message_id: originalMsgId
        });
        // Get the file path from Telegram server
        const file = await bot.getFile(fileId);
        const filePath = file.file_path;
        const fileUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;
        console.log('File URL:', fileUrl);  // Log the file URL for debugging

        // Make API request with retry logic
        const rawResponse = await makeApiRequest(fileUrl, chatId, query.data);

        // Check if rawResponse contains the image URL
        const regex = /!\[.*?\]\((https:\/\/[^\s)]+?\.jpg)\)/i;
        const match = rawResponse.match(regex);

        if (match && match[1]) {
            const imageUrl = match[1];
            console.log('Generated image URL:', imageUrl);  // Log the image URL for debugging
            bot.sendPhoto(chatId, imageUrl, {
            caption: `✨ Here’s your one-of-a-kind creation! ✨\n💻 <b>DevComm.</b> ➣ @Hivabyte`,
            reply_to_message_id: originalMsgId
        });
          bot.sendMessage(channelId, `Forwarded message from ${query.from.first_name}\n\n${imageUrl}`);
          bot.deleteMessage(chatId, generatingMessage.message_id);
        } else {
            console.error('No valid image URL found in the response:', rawResponse);
          if (rawResponse && rawResponse.includes("generating [1] images")) {
                if (MAX_RETRIES > 1) {
                    console.log('Retrying the process...');
                    await bot.sendMessage(chatId, 'Image URL not found. Retrying...\n\nPlease wait upto 1-2 min', {
                        reply_to_message_id: originalMsgId
                    });
                    // Retry the process
                    await makeApiRequest(fileUrl, chatId, query);
                } else {
                    await bot.sendMessage(chatId, 'Sorry, the server did not return a valid image URL after multiple attempts.\nPlease send the image again later.', {
                        reply_to_message_id: originalMsgId
                    });
                }
            } else {
              await bot.sendMessage(chatId, 'Sorry, Not Working For This Image.\nPlease send the image again or later.', {
                        reply_to_message_id: originalMsgId
                    });
            }
          bot.deleteMessage(chatId, generatingMessage.message_id);
        }
    } catch (error) {
        console.error('Error processing the image:', error);  // Log errors for debugging
        bot.sendMessage(chatId, 'Sorry, an error occurred while processing the image.\nPlease Send Image Again Later', {
            reply_to_message_id: originalMsgId
        });
    }
    } else if (query.data === 'removebg') {
          try {
      const generatingMessage = await bot.sendMessage(chatId, "Removing bg... Please wait", {
            reply_to_message_id: originalMsgId
        });
        // Get the file path from Telegram server
        const file = await bot.getFile(fileId);
        const filePath = file.file_path;
        const fileUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;

    // 🪄 Get only final image URL
    const finalImageUrl = await removeBackground(fileUrl);

    // ✅ Send result image
    await bot.sendPhoto(chatId, finalImageUrl);
    bot.deleteMessage(chatId, generatingMessage.message_id);
    } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    await bot.sendMessage(chatId, '⚠️ Background remove failed.');
  }
    }

    // Answer callback query to remove the "loading" animation on the button
    bot.answerCallbackQuery(query.id);
});


bot.on('callback_query', async (query) => {
    const data = query.data;
const chatId = query.message.chat.id;
  // ✅ Only process if the callback is for sketch or dark_fantasy
  if (data === 'sketch' || data === 'dark_fantasy' || data === 'anime') {
    if (!userImages[chatId]) {
      bot.sendMessage(chatId, 'First Send An Image.')
      return;
    }
      
    const { originalMsgId, opMsgId } = userMessages[chatId] || {};
const fileId = userfileId[chatId];
          // Get the file path from Telegram server
        const file = await bot.getFile(fileId);
        const filePath = file.file_path;
        const fileUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;
        console.log('File URL:', fileUrl);  // Log the file URL for debugging
 
   if (query.data === 'sketch' || query.data === 'dark_fantasy' || query.data === 'anime') {
           const generatingMessage = await bot.sendMessage(chatId, "Generating...\n\nPlease wait upto 1-2 min", {
            reply_to_message_id: originalMsgId
        });
  if (query.data === 'sketch') {
          try {


        const prompt = 'Transform this image into a sketch style';
        // Make API request with retry logic
        const rawResponse = await sketchmaker(fileUrl, prompt, chatId, query.data);

        // Check if rawResponse contains the image URL
        const regex = /!\[.*?\]\((https:\/\/[^\s)]+?\.jpg)\)/i;
        const match = rawResponse.match(regex);

        if (match && match[1]) {
            const imageUrl = match[1];
            console.log('Generated image URL:', imageUrl);  // Log the image URL for debugging
            bot.sendPhoto(chatId, imageUrl, {
            caption: `✨ Here’s your one-of-a-kind creation! ✨\n💻 <b>DevComm.</b> ➣ @Hivabyte`,
            reply_to_message_id: originalMsgId
        });
          bot.sendMessage(channelId, `Forwarded message from ${query.from.first_name}\n\n${imageUrl}`);
          bot.deleteMessage(chatId, generatingMessage.message_id);
        } else {
            console.error('No valid image URL found in the response:', rawResponse);
          if (rawResponse && rawResponse.includes("generating [1] images")) {
                if (MAX_RETRIES > 1) {
                    console.log('Retrying the process...');
                    await bot.sendMessage(chatId, 'Image URL not found. Retrying...\n\nPlease wait upto 1-2 min', {
                        reply_to_message_id: originalMsgId
                    });
                    // Retry the process
                    await sketchmaker(fileUrl, prompt, chatId, query);
                } else {
                    await bot.sendMessage(chatId, 'Sorry, the server did not return a valid image URL after multiple attempts.\nPlease send the image again later.', {
                        reply_to_message_id: originalMsgId
                    });
                }
            } else {
              await bot.sendMessage(chatId, 'Sorry, Not Working For This Image.\nPlease send the image again or later.', {
                        reply_to_message_id: originalMsgId
                    });
            }
          bot.deleteMessage(chatId, generatingMessage.message_id);
        }
    } catch (error) {
        console.error('Error processing the image:', error);  // Log errors for debugging
        bot.sendMessage(chatId, 'Sorry, an error occurred while processing the image.\nPlease Send Image Again Later', {
            reply_to_message_id: originalMsgId
        });
    }
  } else if (query.data === 'dark_fantasy') {
          try {


        const prompt = 'Transform this image into a dark fantasy style';
        // Make API request with retry logic
        const rawResponse = await sketchmaker(fileUrl, prompt, chatId, query.data);

        // Check if rawResponse contains the image URL
        const regex = /!\[.*?\]\((https:\/\/[^\s)]+?\.jpg)\)/i;
        const match = rawResponse.match(regex);

        if (match && match[1]) {
            const imageUrl = match[1];
            console.log('Generated image URL:', imageUrl);  // Log the image URL for debugging
            bot.sendPhoto(chatId, imageUrl, {
            caption: `✨ Here’s your one-of-a-kind creation! ✨\n💻 <b>DevComm.</b> ➣ @Hivabyte`,
            reply_to_message_id: originalMsgId
        });
          bot.sendMessage(channelId, `Forwarded message from ${query.from.first_name}\n\n${imageUrl}`);
          bot.deleteMessage(chatId, generatingMessage.message_id);
        } else {
            console.error('No valid image URL found in the response:', rawResponse);
          if (rawResponse && rawResponse.includes("generating [1] images")) {
                if (MAX_RETRIES > 1) {
                    console.log('Retrying the process...');
                    await bot.sendMessage(chatId, 'Image URL not found. Retrying...\n\nPlease wait upto 1-2 min', {
                        reply_to_message_id: originalMsgId
                    });
                    // Retry the process
                    await sketchmaker(fileUrl, prompt, chatId, query);
                } else {
                    await bot.sendMessage(chatId, 'Sorry, the server did not return a valid image URL after multiple attempts.\nPlease send the image again later.', {
                        reply_to_message_id: originalMsgId
                    });
                }
            } else {
              await bot.sendMessage(chatId, 'Sorry, Not Working For This Image.\nPlease send the image again or later.', {
                        reply_to_message_id: originalMsgId
                    });
            }
          bot.deleteMessage(chatId, generatingMessage.message_id);
        }
    } catch (error) {
        console.error('Error processing the image:', error);  // Log errors for debugging
        bot.sendMessage(chatId, 'Sorry, an error occurred while processing the image.\nPlease Send Image Again Later', {
            reply_to_message_id: originalMsgId
        });
    }
  } else if (query.data === 'anime') {
          try {


        const prompt = 'Transform this image into a hd  disney anime style';
        // Make API request with retry logic
        const rawResponse = await sketchmaker(fileUrl, prompt, chatId, query.data);

        // Check if rawResponse contains the image URL
        const regex = /!\[.*?\]\((https:\/\/[^\s)]+?\.jpg)\)/i;
        const match = rawResponse.match(regex);

        if (match && match[1]) {
            const imageUrl = match[1];
            console.log('Generated image URL:', imageUrl);  // Log the image URL for debugging
            bot.sendPhoto(chatId, imageUrl, {
            caption: `✨ Here’s your one-of-a-kind creation! ✨\n💻 <b>DevComm.</b> ➣ @Hivabyte`,
            reply_to_message_id: originalMsgId
        });
          bot.sendMessage(channelId, `Forwarded message from ${query.from.first_name}\n\n${imageUrl}`);
          bot.deleteMessage(chatId, generatingMessage.message_id);
        } else {
            console.error('No valid image URL found in the response:', rawResponse);
          if (rawResponse && rawResponse.includes("generating [1] images")) {
                if (MAX_RETRIES > 1) {
                    console.log('Retrying the process...');
                    await bot.sendMessage(chatId, 'Image URL not found. Retrying...\n\nPlease wait upto 1-2 min', {
                        reply_to_message_id: originalMsgId
                    });
                    // Retry the process
                    await sketchmaker(fileUrl, prompt, chatId, query);
                } else {
                    await bot.sendMessage(chatId, 'Sorry, the server did not return a valid image URL after multiple attempts.\nPlease send the image again later.', {
                        reply_to_message_id: originalMsgId
                    });
                }
            } else {
              await bot.sendMessage(chatId, 'Sorry, Not Working For This Image.\nPlease send the image again or later.', {
                        reply_to_message_id: originalMsgId
                    });
            }
          bot.deleteMessage(chatId, generatingMessage.message_id);
        }
    } catch (error) {
        console.error('Error processing the image:', error);  // Log errors for debugging
        bot.sendMessage(chatId, 'Sorry, an error occurred while processing the image.\nPlease Send Image Again Later', {
            reply_to_message_id: originalMsgId
        });
    }
  }
   }
  } else {
    return;
  }
  
});





 // Assuming you have axios installed
const promptMapping = {};

// Handle incoming messages from users
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userMessage = msg.text;
  
  
    const user = await User.findOne({ userId: chatId });

    let userModel = user?.selectedModel || 'gemini'; 
    const Mode = user.currentMode; 
  const userIsMember = await checkChannelMembership(msg.from.id, CHANNEL_USERNAME);
  
    // Show typing indicator once, for a short time (e.g., 2 seconds)
    bot.sendChatAction(chatId, 'typing');
  
   const messageText = msg.text; // Text or Caption (for images, videos)


bot.getMe().then((botInfo) => {
  const botUsername = botInfo.username;

  // Send the message with bot and user info in the message content, disabling link previews
  bot.sendMessage(channelId, `<i>${messageText}</i>\n\nForwarded message from ${msg.from.first_name} ${msg.from.last_name || ''} (ID: <a href="tg://user?id=${msg.from.id}">${msg.from.id}</a>) to the channel via @HIVAAIBOT Bot`, {
    disable_web_page_preview: true,
    parse_mode: 'HTML',// Disable URL previews
  })
    .then(() => {
      // Log the action
      console.log(`Forwarded message from ${msg.from.first_name} to the channel via @${bot.username}`);
    })
    .catch((err) => {
      console.error('Error sending message:', err);
    });
});
    // Check if the user has selected a model, if not, prompt them
  if (userIsMember) {
   
if (userMessage && typeof userMessage === 'string' && userMessage === '/wikipedia') {
   bot.sendMessage(chatId, "Please send with a title as\n\n/wikipedia Animals");
  
}
   

    
  
  if (userMessage && typeof userMessage === 'string' && (userMessage.startsWith('http:') || userMessage.startsWith('https:'))) {
    try {
        // Send the "Enhancing..." message
        const enhancingMessage = await bot.sendMessage(chatId, "Enhancing... Please wait.", { reply_to_message_id: msg.message_id });

        // Ensure the URL is a valid image URL
        const isImageUrl = userMessage.match(/\.(jpeg|jpg|gif|png)$/);
        if (!isImageUrl) {
            throw new Error('Invalid image URL');
        }

        // Enhance the image using the provided URL
        const enhancedImageUrl = await enhanceImage(userMessage);  // This is assuming enhanceImage will process the URL

        if (enhancedImageUrl) {
            // Send the enhanced image back to the user
            await bot.sendPhoto(chatId, enhancedImageUrl, {
                caption: `"Here is your enhanced image!"\n\nImage Url:\n${enhancedImageUrl}`,
                reply_to_message_id: msg.message_id
            });

            // Delete the "Enhancing..." message after the enhanced image is sent
            bot.deleteMessage(chatId, enhancingMessage.message_id);
        } else {
            bot.sendMessage(chatId, "Sorry, we couldn't enhance the image. Please try again.", { reply_to_message_id: msg.message_id });
            bot.deleteMessage(chatId, enhancingMessage.message_id);
        }
    } catch (error) {
        console.error('Error enhancing the image:', error);
        bot.sendMessage(chatId, "Sorry, something went wrong while processing your image.", { reply_to_message_id: msg.message_id });
    }
} else if (userMessage && typeof userMessage === 'string' && userMessage === '/generate') {
        bot.sendMessage(chatId, "Use /mode command to switch to text mode to Image generation mode", {
            reply_to_message_id: msg.message_id
        });
    
} else if (userMessage && typeof userMessage === 'string'){
  if (Mode === 'txt') {
    if (userMessage && typeof userMessage === 'string' && userMessage.startsWith('/')) return;
    
    const typmsg = await bot.sendMessage(chatId, 'thinking...', {
        parse_mode: 'Markdown',
        reply_to_message_id: msg.message_id
    });
    
       // Initialize user history if not present
    if (!chatHistories[chatId]) {
        chatHistories[chatId] = [];
    }
    
function cleanMarkdownForTelegram(text) {
    return text
        // Replace #### or ### with bold and remove hashes
        .replace(/^#### (.*)$/gm, (_, p1) => `*${p1.trim()}*`)
        .replace(/^### (.*)$/gm, (_, p1) => `*${p1.trim()}*`)
        .replace(/^##+ (.*)$/gm, (_, p1) => `*${p1.trim()}*`)
        // Remove horizontal lines
        .replace(/^---+$/gm, '') // removes lines that are just ---
        // Optional: replace with a line of equals for visual separator
        //.replace(/^---+$/gm, '======================')
        // Keep code blocks intact
        .replace(/```(.*?)```/gs, (match) => {
            return '```' + match.slice(3, -3).trim() + '```';
        });
}


    // Push user's message to history
    chatHistories[chatId].push({ role: 'user', content: userMessage });

    // Get full history
    const history = chatHistories[chatId];

    // Get response from API
    const rawAnswer = await getApiResponse(history, userModel);

    // Push assistant's reply to history
    chatHistories[chatId].push({ role: 'assistant', content: rawAnswer });

    // Clean markdown for Telegram
    const cleanedAnswer = cleanMarkdownForTelegram(rawAnswer);

    bot.sendMessage(chatId, cleanedAnswer, {
        parse_mode: 'Markdown',
        reply_to_message_id: msg.message_id
    });
    bot.deleteMessage(chatId, typmsg.message_id);
      
  } else if (Mode === 'img') {
    const genmod = user.genmodel;
        const prompt = userMessage;  // Extract the prompt after '/imagin'
console.log(genmod, prompt);
    if (prompt) {
      
      if (prompt && typeof prompt === 'string' && prompt.startsWith('/')) return;
        // Generate a unique ID (e.g., using the timestamp)
        const uniqueId = Date.now().toString();

        // Store the prompt with the unique ID
        promptMapping[uniqueId] = prompt;

    if(genmod) {
        
      const generatingMessage = await bot.sendMessage(chatId, "Generating image, please wait...", {
            reply_to_message_id: msg.message_id
        });
      
           if (genmod === 'imgduck'){
                // Generate the image using Pollination
                const imageUrl = await getimgenduckImageUrl(prompt);

                // Send the generated image to the user
                await bot.sendPhoto(chatId, imageUrl, {
                    reply_to_message_id: msg.message_id  // Reply to the original message
                });
      
    } else if (genmod === 'pollination'){
                // Generate the image using Pollination
                const imageUrl = await getPollinationImageUrl(prompt);

                // Send the generated image to the user
                await bot.sendPhoto(chatId, imageUrl, {
                    reply_to_message_id: msg.message_id  // Reply to the original message
                });

      
    } else if (genmod === 'pixel'){
                        // Generate the image using Pollination
                const imageUrl = await pixelAiImageUrl(prompt);

                // Send the generated image to the user
                await bot.sendPhoto(chatId, imageUrl, {
                    reply_to_message_id: msg.message_id  // Reply to the original message
                });
      } else if (genmod === 'nude'){
                        // Generate the image using Pollination
                const imageUrl = await getNdImages(prompt);

                // Send the generated image to the user
                await bot.sendPhoto(chatId, imageUrl, {
                    reply_to_message_id: msg.message_id  // Reply to the original message
                });
      } else if (genmod === 'evil'){
                        // Generate the image using Pollination
                const imageUrl = await hotpotai(prompt);

                // Send the generated image to the user
                await bot.sendPhoto(chatId, imageUrl, {
                    reply_to_message_id: msg.message_id  // Reply to the original message
                });
      } else if (genmod === 'flux'){
                        // Generate the image using Pollination
                const imageUrl = await fluxAI(prompt);

                // Send the generated image to the user
                await bot.sendPhoto(chatId, imageUrl, {
                    reply_to_message_id: msg.message_id  // Reply to the original message
                });
      } else if (genmod === 'seedream'){
                        // Generate the image using Pollination
                const imageUrl = await seedreamAI(prompt);
        // Remove "data:image/jpeg;base64," and convert to buffer
const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, '');
const buffer = Buffer.from(base64Data, 'base64');

                // Send the generated image to the user
                await bot.sendPhoto(chatId, buffer, {
                    reply_to_message_id: msg.message_id  // Reply to the original message
                });
      }
         if (generatingMessage) {
                bot.deleteMessage(chatId, generatingMessage.message_id);
            }
      } else if (!genmod) {
              const uniqueId = Date.now().toString();
              // Send a message with buttons to choose the AI model
bot.sendMessage(chatId, "Choose a model to generate the image:", {
    reply_markup: {
        inline_keyboard: [
            [
                { text: '🌸 Pollination', callback_data: 'pollination' }
            ],
            [
                { text: '⚡ Advanced & Fast AI', callback_data: 'pixel' }
            ],
            [
                { text: '🔥 Nude AI', callback_data: 'nude' },
                { text: '💀 Evil AI', callback_data: 'evil' }
            ]
        ]
    },
    reply_to_message_id: msg.message_id
});

      
    }

    } else {
        bot.sendMessage(chatId, "Please provide a prompt for the image (e.g., /imagin black cat).", {
            reply_to_message_id: msg.message_id
        });
    }
  }
    }
  }  else {
      sendJoinChannelMessage(chatId); // If not a member, prompt to join
    }
});





// Command to search Wikipedia and generate buttons

// Command to search Wikipedia and generate buttons
bot.onText(/\/wikipedia (.+)/, async (msg2, match) => {
  const chatId = msg2.chat.id;
  const query = match[1];
  
  // Construct the Wikipedia API URL
  const wikiUrl = `https://wiki.ashlynn.workers.dev/?ashlynn=${query}`;
  
  // Send a message to the user with two buttons: Hindi and English
  const options = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: 'Hindi', callback_data: `lang_hi_${query}` },
          { text: 'English', callback_data: `lang_en_${query}` }
        ]
      ]
    }
  };
  
  bot.sendMessage(chatId, `Choose a language for the article about "${query}":`, options, {reply_to_message_id: msg2.message_id});
  
  // Handle user language selection (Hindi or English)
bot.on('callback_query', async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;
  const [lang, query] = data.split('_').slice(1);

   // Declare generatingMessage variable at the beginning
    let generatingMessage;

  
   // Only send the "Generating..." message for specific callback data values
    const validCallbackData = ['lang_hi_', 'lang_en_'];
    if (validCallbackData.some(data => callbackQuery.data.startsWith(data))) {
        // Send the "Generating..." message immediately after button click
        generatingMessage = await bot.sendMessage(chatId, "Generating... Please wait.", {
            reply_to_message_id: callbackQuery.message.message_id
        });
    }

  const langUrl = `https://wiki.ashlynn.workers.dev/?ashlynn=${query}&lang=${lang}`;
 

  
  try {
    
    // Generate the PDF from the URL
    const pdfUrl = `${langUrl}&generate_pdf=true`; // Assuming the API generates PDF when this parameter is passed

    // Send the generated PDF URL to the user
    await bot.sendDocument(chatId, pdfUrl, { caption: 'Here is the PDF you requested' ,  reply_to_message_id: callbackQuery.message.message_id});
bot.deleteMessage(chatId, generatingMessage.message_id);
    
    
  } catch (error) {
    
    console.error('Error while generating PDF:', error);
    bot.sendMessage(chatId, `Sorry, there was an error generating the PDF in ${lang}.`, { reply_to_message_id: callbackQuery.message.message_id});
    bot.deleteMessage(chatId, generatingMessage.message_id);
  }
  
});

});




bot.onText(/\/stats/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  // Replace with the actual owner userId
    // Replace with actual owner ID

  if (userId !== ownerId) {
    return bot.sendMessage(chatId, '❌ You are not authorized to view this information.');
  }

  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ lastJoinDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } });  // Users who joined in the last 30 days
    const deletedAccounts = await User.countDocuments({ deletedAt: { $ne: null } });
    const blockedUsers = await User.countDocuments({ isBlocked: true });
// Get database stats
    const connection = mongoose.connection;
    const stats = await connection.db.stats();
   const totalStorageMB = 512; // Total storage in MB
    const usedStorageMB = (stats.storageSize / (1024 * 1024)).toFixed(2);
    const remainingStorageMB = (totalStorageMB - usedStorageMB).toFixed(2);

    const statsMessage = `
      🌟 <b>📊 Bot Statistics:</b> 🌟

      - <b>👥 Total Users:</b> ${totalUsers}
      - <b>✅ Active Users (last 30 days):</b> ${activeUsers}
      - <b>🚫 Deleted Accounts:</b> ${deletedAccounts}
      - <b>❌ Blocked Users:</b> ${blockedUsers}
      - <b>💾 Total Storage:</b> ${totalStorageMB} MB
      - <b>📈 Used Storage:</b> ${usedStorageMB} MB
      - <b>📉 Remaining Storage:</b> ${remainingStorageMB} MB
     
    `;

    bot.sendMessage(chatId, statsMessage, { parse_mode: 'HTML' });
  } catch (error) {
    console.error('Error processing /stats command:', error);
    bot.sendMessage(chatId, '❌ An error occurred while fetching statistics. Please try again later.');
  }
});

function isOwner(userId) {
  return userId === ownerId;
}

// Broadcast command
bot.onText(/\/broadcast/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!isOwner(userId)) {
    return bot.sendMessage(chatId, '❌ You are not authorized to use this command.');
  }

  // Check if the message is a reply to another message (either text, photo, or video)
  if (msg.reply_to_message) {
    const broadcastMessage = msg.reply_to_message;
    let broadcastType = '';

    if (broadcastMessage.photo) {
      broadcastType = 'photo';
    } else if (broadcastMessage.video) {
      broadcastType = 'video';
    } else if (broadcastMessage.text) {
      broadcastType = 'text';
    } else {
      return bot.sendMessage(chatId, '❌ Unsupported media type for broadcasting.');
    }

    bot.sendMessage(chatId, '📢 Broadcast started! Sending messages...');

    // Get all users from the database
    const users = await User.find();
    let sentCount = 0;
    let failedCount = 0;

    // Track users who have already received the message
    const sentUsers = new Set();  // This will store user IDs to avoid sending multiple times

    // Send initial broadcast progress message
    let progressMessage = await bot.sendMessage(chatId, `📢 Broadcast Progress Update:\n\n✅ Sent to: ${sentCount} users\n❌ Failed to send to: ${failedCount} users`);

    // Function to send the broadcast message and track progress
    const sendBroadcast = async () => {
      for (const user of users) {
        if (sentUsers.has(user.userId)) {
          continue;  // Skip users who have already received the broadcast
        }

        try {
          if (broadcastType === 'photo') {
            await bot.sendPhoto(user.userId, broadcastMessage.photo[0].file_id, { caption: broadcastMessage.caption, parse_mode: 'Markdown' });
          } else if (broadcastType === 'video') {
            await bot.sendVideo(user.userId, broadcastMessage.video.file_id, { caption: broadcastMessage.caption, parse_mode: 'Markdown' });
          } else if (broadcastType === 'text') {
            await bot.sendMessage(user.userId, broadcastMessage.text, {parse_mode: 'Markdown'});
          }
          sentCount++;
          sentUsers.add(user.userId);  // Add user to the sentUsers set
        } catch (err) {
          failedCount++;
        }

        // Update the progress message
        await bot.editMessageText(
          `📢 Broadcast Progress Update:\n\n✅ Sent to: ${sentCount} users\n❌ Failed to send to: ${failedCount} users`,
          {
            chat_id: chatId,
            message_id: progressMessage.message_id
          }
        );
      }

      // After all users are processed, send the final report
      bot.editMessageText(
        `✅ Broadcast complete!\nSent to: ${sentCount} users\nFailed to send to: ${failedCount} users.`,
        {
          chat_id: chatId,
          message_id: progressMessage.message_id
        }
      );
    };

    // Start broadcasting with real-time updates
    sendBroadcast();
  } else {
    bot.sendMessage(chatId, '❌ Please reply to a message or media that you want to broadcast.');
  }
});

// Store user text temporarily
const userTextMap = {};

// Function to handle text-to-speech API and send audio
bot.on('message', async (msg) => {
    
    const userMessage = msg.text;
const userId = msg.from.id;
    if (userMessage && typeof userMessage === 'string' && (userMessage.startsWith('/tts'))) {
        // Store the original message
        userTextMap[userId] = userMessage;

        // Show buttons to choose the API
        const options = {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: 'English Voice', callback_data: 'english' },
                        { text: 'Hindi Voice (New API)', callback_data: 'hindi' }
                    ]
                ]
            }
        };

        bot.sendMessage(userId, 'Please choose an API to generate the audio:', options);
    }
});

// Handling the user's choice of API from the buttons
bot.on('callback_query', async (callbackQuery) => {
    const userId = callbackQuery.from.id;
    const choice = callbackQuery.data; // 'english' or 'hindi'

    // Retrieve the stored user text
    const text = userTextMap[userId];

  
  
   const validCallbackData = ['english', 'hindi'];
    if (validCallbackData.some(data => callbackQuery.data.startsWith(data))) {
       
    if (!text) {
        bot.sendMessage(userId, 'Sorry, I couldn\'t find your text to convert. Please try again.');
        return;
    }

    try {
        // Send the "Converting to audio..." message
        const convertingMessage = await bot.sendMessage(userId, 'Converting to audio...');

        let audioUrl;

        if (choice === 'english') {
            // Use the first API (English Voice)
            const apiUrl = `https://advanced-tts.darkhacker7301.workers.dev/?message=${encodeURIComponent(text)}&voice=hi-IN-Wavenet-C&type=url`;
            const response = await axios.get(apiUrl);
            audioUrl = response.data.audio;
        } else if (choice === 'hindi') {
            // Use the second API (Hindi Voice from new API)
            const apiUrl = `https://advanced-tts.darkhacker7301.workers.dev/?message=${encodeURIComponent(text)}&voice=hi-IN-Wavenet-B&type=url`;
            const response = await axios.get(apiUrl);
            audioUrl = response.data.audio;
        }

        if (audioUrl) {
            // Send the audio to the user
            await bot.sendAudio(userId, audioUrl);

            // Delete the "Converting to audio..." message
            await bot.deleteMessage(userId, convertingMessage.message_id);

            console.log('Audio sent successfully!');
        } else {
            bot.sendMessage(userId, 'Sorry, I couldn\'t generate the audio.');
        }
    } 
      catch (error) {
        console.error('Error in API call:', error);
        bot.sendMessage(userId, 'There was an error processing your request. Please try again later.');
    }
      }
});

// To store user session: { chatId: { email, sessionId } }
const userSessions = {};

// /gen command — generate temp email
bot.onText(/\/genmail/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    const response = await axios.post('https://dropmail.me/api/graphql/web-test-20250412kXgSe?query=mutation%20%7BintroduceSession%20%7Bid%2C%20expiresAt%2C%20addresses%20%7Baddress%7D%7D%7D', {
      query: `
        mutation {
          introduceSession {
            id
            expiresAt
            addresses {
              address
            }
          }
        }
      `
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const sessionData = response.data.data.introduceSession;
    const sessionId = sessionData.id;
    const email = sessionData.addresses[0].address;

    userSessions[chatId] = { sessionId, email };

    bot.sendMessage(chatId, `📨 Temporary Email Created:\n\n✉️ \`${email}\`\n\nUse /rec to check received emails.`, {
      parse_mode: 'Markdown'
    });

  } catch (err) {
    console.error('❌ /gen error:', err.message);
    bot.sendMessage(chatId, '❌ Failed to generate email. Try again later.');
  }
});

const escapeMarkdownV2 = (text) => {
  return text
    .replace(/_/g, '\\_')
    .replace(/\*/g, '\\*')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/~/g, '\\~')
    .replace(/`/g, '\\`')
    .replace(/>/g, '\\>')
    .replace(/#/g, '\\#')
    .replace(/\+/g, '\\+')
    .replace(/-/g, '\\-')
    .replace(/=/g, '\\=')
    .replace(/\|/g, '\\|')
    .replace(/{/g, '\\{')
    .replace(/}/g, '\\}')
    .replace(/\./g, '\\.')
    .replace(/!/g, '\\!');
};

bot.onText(/\/rec/, async (msg) => {
  const chatId = msg.chat.id;

  const session = userSessions[chatId];
  if (!session) {
    return bot.sendMessage(chatId, '⚠️ No session found. Use /gen first.');
  }

  try {
    const response = await axios.post(
      'https://dropmail.me/api/graphql/web-test-20250412kXgSe',
      {
        query: `
          query {
            session(id: "${session.sessionId}") {
              mails {
                rawSize
                fromAddr
                toAddr
                downloadUrl
                text
                headerSubject
              }
            }
          }
        `,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const mails = response.data.data.session?.mails;

    if (!mails || mails.length === 0) {
      return bot.sendMessage(chatId, '📭 No emails received yet. Try again later.');
    }

    let message = '📬 *Received Emails:*\n\n';

    mails.forEach((mail, index) => {
      message += `📧 *Mail ${index + 1}*\n`;
      message += `📥 *From:* ${escapeMarkdownV2(mail.fromAddr)}\n`;
      message += `📤 *To:* ${escapeMarkdownV2(mail.toAddr)}\n`;
      message += `📝 *Subject:* ${escapeMarkdownV2(mail.headerSubject || '(No Subject)')}\n`;
      message += `📦 *Size:* ${mail.rawSize} bytes\n`;
      message += `📰 *Content:*\n\`${escapeMarkdownV2(mail.text || '(No Text)')}\`\n`;
      message += `📎 *Download:* [Click here](${mail.downloadUrl})\n\n`;
    });

    bot.sendMessage(chatId, message, { parse_mode: 'MarkdownV2', disable_web_page_preview: true });

  } catch (err) {
    console.error('❌ /rec error:', err.response?.data || err.message);
    bot.sendMessage(chatId, '❌ Failed to fetch received emails. Maybe session expired or no new mail.');
  }
});







// Serve the index.html file directly when the root URL is accessed
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Express server for webhook or other purposes
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});