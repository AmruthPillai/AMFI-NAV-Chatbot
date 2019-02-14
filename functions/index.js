const functions = require('firebase-functions');
const { WebhookClient } = require('dialogflow-fulfillment');

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });

  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

  function askNav(agent) {
    agent.add(`Welcome to my agent!`);
  }

  let intentMap = new Map();
  intentMap.set('nav.ask', askNav);
  agent.handleRequest(intentMap);
});
