describe('lambda function', function() {
  var index = require('index');
  var context;

  beforeEach(function() {
    context = jasmine.createSpyObj('context', ['succeed', 'fail']);
    index.dynamodb = jasmine.createSpyObj('dynamo', ['scan']);
  });

  describe('echo', function() {
    it('returns a result', function() {
      index.echo({body: '{}'}, context);
      expected = {
        statusCode: 200,
        headers: {
          'content-type': 'text/plain'
        },
        body: "Hello from the cloud! You sent {}",
        isBase64Encoded: false
      };
      expect(context.succeed).toHaveBeenCalledWith(expected);
    });
  });

  describe('popularAnswers', function() {
    it('requests problems with the given problem number', function() {
      index.popularAnswers({body: JSON.stringify({problemNumber: 42})}, context);
      expect(index.dynamodb.scan).toHaveBeenCalledWith({
        FilterExpression: "problemId = :problemId",
        ExpressionAttributeValues: { ":problemId": 42 },
        TableName: 'learnjs'
      }, jasmine.any(Function));
    });

    it('groups answers by minified code', function() {
      index.popularAnswers({body: JSON.stringify({problemNumber: 1})}, context);
      index.dynamodb.scan.calls.first().args[1](undefined, {Items: [
        {answer: "true"},
        {answer: "true"},
        {answer: "true"},
        {answer: "!false"},
        {answer: "!false"},
      ]});
      expect(context.succeed).toHaveBeenCalledWith({
        statusCode: 200,
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({"true": 3, "!false": 2}),
        isBase64Encoded: false
      });
    });
  });
});
