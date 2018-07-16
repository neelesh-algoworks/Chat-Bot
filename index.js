const botkit = require('botkit');
const fs = require('fs');
const NLP = require('natural');

const classifier = new NLP.LogisticRegressionClassifier();
require('dotenv').config;

const scope = [
    'direct_mention',
    'direct_message',
    'mention'
];

const token = 'xoxb-399281062501-399145181730-JBXFa2XVMt3UHxIXKANLQ2rv';

const Bot = botkit.slackbot({
    debug: true,
    storage: undefined
});

function handleMessage(speech, message) {
    const interpretation = interpret(message.text);
    console.log('InternChatBot heard: ', message.text);
    console.log('InternChatBot interpretation', interpretation);
    if (interpretation.guess && trainingData[interpretation.guess]) {
        console.log('Found response');
        speech.reply(message, trainingData[interpretation.guess].answer);
    } else {
        console.log('Couldn\'t match phrase')
        speech.reply(message, 'Sorry, I\'m not sure what you mean');
    }
}


function parseTrainingData(filePath){
    const trainingFile = fs.readFileSync(filePath);
    return JSON.parse(trainingFile);
}

const trainingData = parseTrainingData('./trainingData.json');

function trainClassifier(classifier, label, phrases){
    console.log('Training Classifier', label, phrases);
    phrases.forEach((phrase) => {
        console.log(`Teaching single ${label}: ${phrase}`);
    classifier.addDocument(phrase.toLowerCase(), label);
})
}

function interpret(phrase){
    console.log('interpret', phrase);
    const guesses = classifier.getClassifications(phrase.toLowerCase());
    console.log('guesses', guesses);
    const guess = guesses.reduce((x, y) => {
        return x && x.value > y.value ? x: y;
    })

    return {
        probabilities: guesses,
        guess: guess.value > (0.7) ? guess.label : null
    }
}

var i = 0;
Object.keys(trainingData).forEach((element, key) => {
    trainClassifier(classifier, element, trainingData[element].questions);
    i++;
    if (i === Object.keys(trainingData).length) {
        classifier.train();
        const filePath = './classifier.json';
        classifier.save(filePath, (err, classifier) => {
            if (err) {
                console.error(err);
            }
            console.log('Created a Classifier file in ', filePath);
        });
    }
});

Bot.hears('.*', scope, handleMessage);

Bot.spawn({
    token: token
}).startRTM();