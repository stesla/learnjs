var http = require('http');
var AWS = require('aws-sdk');

AWS.config.region = 'us-east-1';

var config = {
  dynamoTableName: 'learnjs',
};

exports.dynamodb = new AWS.DynamoDB.DocumentClient();

function reduceItems(memo, items) {
  items.forEach(function(item) {
    memo[item.answer] = (memo[item.answer] || 0) + 1;
  })
  return memo
}

function byCount(e1, e2) {
  return e2[0] - e1[0];
}

function filterItems(items) {
  var values = [];
  for (i in items) {
    values.push([items[i], i]);
  }
  var topFive = {};
  values.sort(byCount).slice(0,5).forEach(function(e) {
    topFive[e[1]] = e[0];
  });
  return topFive
}

exports.popularAnswers = function(json, context) {
  let req = JSON.parse(json.body);
  exports.dynamodb.scan({
    FilterExpression: "problemId = :problemId",
    ExpressionAttributeValues: {
      ":problemId": req.problemNumber
    },
    TableName: config.dynamoTableName
  }, function(err, data) {
    if(err) {
      context.fail(err);
    } else {
      let items = filterItems(reduceItems({}, data.Items));
      context.succeed({
        statusCode: 200,
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify(items),
        isBase64Encoded: false
      });
    }
  });
}

exports.echo = function(json, context) {  
  context.succeed({
    statusCode: 200,
    headers: {
      "content-type": 'text/plain',
    },
    body: "Hello from the cloud! You sent " + json.body,
    isBase64Encoded: false
  });
};
