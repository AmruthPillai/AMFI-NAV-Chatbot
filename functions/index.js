const mongoose = require('mongoose');
const functions = require('firebase-functions');
const { WebhookClient } = require('dialogflow-fulfillment');
const { List } = require('actions-on-google');

mongoose
  .connect('mongodb://localhost:27017/amfi', {
    useCreateIndex: true,
    useNewUrlParser: true
  })
  .then(success => {
    console.log('Database Successfully Connected!');
    return success;
  })
  .catch(error => {
    console.log('There was an error connecting to the database!');
    throw error;
  });

const schemeSchema = new mongoose.Schema({
  schemeCode: 'number',
  nav: 'number',
  date: 'date',
  isin: 'string',
  name: { type: 'string', index: 'text' }
});

const Schema = mongoose.model('Scheme', schemeSchema);

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(
  (request, response) => {
    const agent = new WebhookClient({ request, response });

    function askNav(agent) {
      const conv = agent.conv();
      const schemeName = agent.parameters['scheme'];

      return new Promise((resolve, reject) => {
        Schema.find(
          { $text: { $search: schemeName } },
          { score: { $meta: 'textScore' } }
        )
          .sort({ score: { $meta: 'textScore' } })
          .limit(6)
          .then(data => {
            const result = data.reduce((obj, item) => {
              obj[item.isin] = {
                title: item.name,
                description: 'NAV: ' + item.nav + ' as of ' + item.date.toISOString().substring(0, 10)
              };
              return obj;
            }, {});

            conv.add(`Here's what I found:`);

            conv.add(
              new List({
                title: 'Schemes',
                items: result
              })
            );

            agent.add(conv);

            resolve();
            return;
          })
          .catch(err => {
            reject(err);
          });
      });
    }

    let intentMap = new Map();
    intentMap.set('nav.ask', askNav);
    agent.handleRequest(intentMap);
  }
);
