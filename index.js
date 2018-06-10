import { request, GraphQLClient } from 'graphql-request'
import tmi from 'tmi.js'

// TWITCH VARS -----------------------------------------------------------------
const token = 'oauth:6yiqzgnpwirq1jbd9i5keull44q5jt'

// valid commands start with:
let commandPrefix = '!'

// Define configuration options:
let opts = {
  identity: {
    username: 'laboratoryone',
    password: token
  },
  channels: [
    'LaboratoryOne'
  ]
}

// These are commands the bot knows
let knownCommands = { clue, guess }

// GRAPHQL VARS ----------------------------------------------------------------
const graphqlEndpoint = 'http://localhost:8081/graphql'

// graphql queries
const getClues = `{
  clues {
    text,
    id
  }
}`

const getAnswers = `{
  answers {
    text,
    id
  }
}`

// FUNCTIONS -------------------------------------------------------------------
// Function called when 'clue' command is issued:
function clue (target, context, params) {
  // get clues from db
  graphqlClient.request(getClues).then(data => {
    const msg = data.clues[0].text

    // send it back to the correct place:
    sendMessage(target, context, msg)
  })
}

// Function called when 'guess' command is issued:
function guess (target, context, params) {
  // if there's something to echo:
  if (params.length) {
    // join the guess into a string
    let userGuess = params.join(' ')

    // convert it to lower case
    userGuess = userGuess.toLowerCase()

    // get answers from db
    graphqlClient.request(getAnswers).then(data => {
      let answer = data.answers[0].text

      // convert it to lower case
      answer = answer.toLowerCase()

      if (userGuess === answer) {
        // Join the params into a string:
        const msg = `@${context.username}: Correct guess!`

        // send it back to the correct place:
        sendMessage(target, context, msg)

        // let the server know that someone got the right answer:
        console.log(`User ${context.username} (${context['user-id']}) got the right answer at: ${context['tmi-sent-ts']}`)
      }
    })
  } else {
    // nothing to echo
    console.log(`* Nothing to echo`)
  }
}

// Helper function to send the correct type of message:
function sendMessage (target, context, message) {
  if (context['message-type'] === 'whipser') {
    client.whisper(target, message)
  } else {
    client.say(target, message)
  }
}


// Called every time a message comes in:
function onMessageHandler (target, context, msg, self) {
  if (self) { return } // ignore messages from the bot

  // This isn't a command since it has no prefix
  if (msg.substr(0, 1) !== commandPrefix) {
    console.log(`[${target}] (${context['message_type']}) ${context.username}: ${msg}`)
    return
  }

  // split the message into individual words:
  const parse = msg.slice(1).split(' ')

  // the command is the first one
  const commandName = parse[0]

  // the rest if any are parameters
  const params = parse.splice(1)

  // if the command is known, execute interval
  if (commandName in knownCommands) {
    // Retrive the function by its name
    const command = knownCommands[commandName]

    // then call it with parameters
    command(target, context, params)
    console.log(`* Executed ${commandName} command for ${context.username}`)
  } else {
    console.log(`* Unknown command ${commandName} from ${context.username}`)
  }
}

// Called every time the bot connects to twitch chat
function onConnectedHandler (addr, port) {
  console.log(`* Connected to ${addr}:${port}`)
}

// Called every time the bot disconnects to twitch chat
function onDisconnectedHandler (reason) {
  console.log(`* Womp womp, disconnected: ${reason}`)
}

// GRAPHQL CLIENT ---------------------------------------------------------------
// Create a graphql client
const graphqlClient = new GraphQLClient(graphqlEndpoint, {
  headers: {}
})

// TWITCH CLIENT ---------------------------------------------------------------
// Create a client with our options:
let client = new tmi.client(opts)

// Register our event handliers
client.on('message', onMessageHandler)
client.on('connected', onConnectedHandler)
client.on('disconnected', onDisconnectedHandler)

// Connect to twitch:
client.connect()
