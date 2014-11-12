var
  AWS = require("aws-sdk"),
  awsRegion = "us-west-2",
  sqs = {},
  Hapi = require('hapi'),
  Good = require('good');

var server = new Hapi.Server(process.env.PORT || 3000);

server.route({
  method: 'POST',
  path: '/hi',
  handler: function (request, reply) {

    server.log('Payload', request.payload);

    server.log('Setting up AWS SDK Object.', 'AWS SDK Setup.');

    AWS.config.update({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_KEY,
      region: awsRegion
    });

    server.log('Instantiating AWS SQS.');

    sqs = new AWS.SQS();

    server.log('received queue request');

    var messageResponse = handleSqsMessage(sqs);

    server.log('Hi!');
    reply('Hello response');
  }
});

function handleSqsMessage(sqs) {
  "use strict";

  sqs.receiveMessage({
    QueueUrl: 'https://sqs.us-west-2.amazonaws.com/621392439615/sample',
    MaxNumberOfMessages: 1, // how many messages do we wanna retrieve?
    VisibilityTimeout: 5, // seconds - how long we want a lock on this job
    WaitTimeSeconds: 3 // seconds - how long should we wait for a message?
  }, function(err, data) {

    if (err) {
      server.log('Error: ' + err);
    } else {
      if (data.Messages) {
        var message = data.Messages[0],
          body = JSON.parse(message.Body);

        server.log('body:' + body);
        server.log('message: ' + message);
        removeFromQueue(message);  // We'll do this in a second
      }
    }


  });
}

var removeFromQueue = function(message) {
  sqs.deleteMessage({
    QueueUrl: sqsQueueUrl,
    ReceiptHandle: message.ReceiptHandle
  }, function(err, data) {
    // If we errored, tell us that we did
    err && server.log(err);
  });
};

server.pack.register(Good, function (err) {
  if (err) {
    throw err;
  }

  server.start(function () {
    server.log('info', 'Server running at: ' + server.info.uri);
  });
});