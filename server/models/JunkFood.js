const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { isMongoActive } = require('../config/db');

const JunkFoodMongooseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  calories: { type: Number, required: true },
  protein: { type: Number, required: true },
  cost: { type: Number, required: true }
}, { timestamps: true });

const JunkFoodMongoose = mongoose.model('JunkFood', JunkFoodMongooseSchema);

const fallbackFilePath = path.join(__dirname, '../data/junk_fallback.json');

function ensureFallbackFile() {
  const dir = path.dirname(fallbackFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(fallbackFilePath)) {
    fs.writeFileSync(fallbackFilePath, JSON.stringify([]));
  }
}

const JunkFoodFallback = {
  find: async () => {
    ensureFallbackFile();
    try {
      return JSON.parse(fs.readFileSync(fallbackFilePath, 'utf8'));
    } catch (e) {
      return [];
    }
  },
  countDocuments: async () => {
    ensureFallbackFile();
    try {
      return JSON.parse(fs.readFileSync(fallbackFilePath, 'utf8')).length;
    } catch (e) {
      return 0;
    }
  },
  insertMany: async (foods) => {
    ensureFallbackFile();
    const seeded = foods.map(f => ({
      _id: f._id || Math.random().toString(36).substr(2, 9),
      ...f
    }));
    fs.writeFileSync(fallbackFilePath, JSON.stringify(seeded, null, 2));
    return seeded;
  }
};

const JunkFoodWrapper = {
  find: async (query) => {
    if (isMongoActive()) return await JunkFoodMongoose.find(query);
    return await JunkFoodFallback.find();
  },
  countDocuments: async () => {
    if (isMongoActive()) return await JunkFoodMongoose.countDocuments();
    return await JunkFoodFallback.countDocuments();
  },
  insertMany: async (foods) => {
    if (isMongoActive()) return await JunkFoodMongoose.insertMany(foods);
    return await JunkFoodFallback.insertMany(foods);
  }
};

module.exports = JunkFoodWrapper;
