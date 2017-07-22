var Alexa = require('alexa-sdk');

var AWS = require('aws-sdk');
require('amazon-cognito-js');
require('./CognitoLambdaManager.js');

var historyDataset = null;

exports.handler = function(event, context, callback){
  var alexa = Alexa.handler(event, context);
  alexa.appId = 'amzn1.ask.skill.*';

  if (event.session.user.accessToken == undefined) {
    alexa.emit(':tellWithLinkAccountCard', 'To start using this skill, please use the companion app to authenticate.');
    return;
  }

  var COGNITO_IDENTITY_POOL = 'us-east-1:*';
  var userId = AWS.util.base64.decode(event.session.user.accessToken).toString();
  var datasets = new CognitoLambdaManager(COGNITO_IDENTITY_POOL, userId, function() {
    datasets.getDataset('AlexaHistory').then(function(dataset) {
      historyDataset = dataset;
      alexa.registerHandlers(handlers);
      alexa.execute();
    }).catch(function(err) {
      console.log(err);
      alexa.emit(':tell', 'I\'m sorry, I\'m not able to remember what we talked about earlier.');
    });
  });

  alexa.registerHandlers(handlers);
  alexa.execute();
};

// Some helper functions to post/pull data from a cognito dataset record
function getLastIntent() {
  return new Promise((resolve, reject) => {
    historyDataset.get('LastIntent', function(err, data) {
      if (err) { reject(err); return; }
      resolve(data);
    });
  });
}
function trackIntent(intentName, callback) {
  historyDataset.put('LastIntent', intentName, function() {
    historyDataset.synchronize({
      'onSuccess': function() {
        callback(null, intentName);
      },
      'onFailure': function(err) {
        callback(err);
      }
    })
  });
}

var handlers = {

  'LaunchRequest': function () {
    trackIntent('LaunchRequest', (err, trackedIntent) => {
      this.emit(':ask', 'Say the name of an artist.', 'Try saying the name of an artist');
    });
  },

  'ArtistName': function() {
    var artistName = this.event.request.intent.slots.artist.value;
    this.emit(':ask','You said ' + artistName);
  },

  'AMAZON.StopIntent': function () {
    // State Automatically Saved with :tell
    this.emit(':tell', `Goodbye.`);
  },
  'AMAZON.CancelIntent': function () {
    // State Automatically Saved with :tell
    this.emit(':tell', `Goodbye.`);
  },
  'SessionEndedRequest': function () {
    // Force State Save When User Times Out
    this.emit(':saveState', true);
  },

  'AMAZON.HelpIntent' : function () {
    this.emit(':ask', `You can tell me the name of a musical artist and I will say it back to you.  Who would you like me to find?`,  `Who would you like me to find?`);
  },
  
  'Unhandled' : function () {
    getLastIntent().then((lastIntent) => {
      if (lastIntent == 'Unhandled') {
        this.emit(':ask', 'You keep saying things I cant understand, are you trying to be funny?');
      } else {
        this.emit(':ask', `You can tell me the name of a musical artist and I will say it back to you.  Who would you like me to find?`,  `Who would you like me to find?`);
      }
    });
  }

};