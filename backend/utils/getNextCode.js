/* utils/getNextCode.js */
const Counter = require("../models/Counter");

async function getNextSequence(key) {
  const doc = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return doc.seq;
}

async function peekNextSequence(key) {
  const doc = await Counter.findOne({ key });
  return doc ? doc.seq + 1 : 1;
}

module.exports = { getNextSequence, peekNextSequence };
