exports.getMsUtc = function() {
  return new Date().getTime();
};

exports.getDateFromMsUtc = function(incomingMsUtc) {
  return new Date(incomingMsUtc);
};

exports.addSeconds = function(incomingMsUtc, secondsToAdd) {
  var oneSecond = 1000;
  var msToAdd = (oneSecond * secondsToAdd);
  var resultInMs = incomingMsUtc + msToAdd;
  return resultInMs;
};

exports.addMinutes = function(incomingMsUtc, minsToAdd) {
  var oneMinute = 60000;
  var msToAdd = (oneMinute * minsToAdd);
  var resultInMs = (incomingMsUtc + msToAdd);
  return resultInMs;
};

exports.addHours = function(incomingMsUtc, hoursToAdd) {
  var oneHour = 3600000;
  var msToAdd = (oneHour * hoursToAdd);
  var resultInMs = (incomingMsUtc + msToAdd);
  return resultInMs;
};
