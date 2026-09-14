const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { isMongoActive } = require('../config/db');

const FoodMongooseSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  protein: { type: Number, required: true },
  carbs: { type: Number, required: true },
  fats: { type: Number, required: true },
  fiber: { type: Number, required: true },
  cost: { type: Number, required: true },
  conversion_ratio: { type: Number, default: 1.0 },
  tags: { type: String, required: true },
  unit_name: { type: String, required: true },
  unit_weight: { type: Number, required: true }
}, { timestamps: true });

const FoodMongoose = mongoose.model('Food', FoodMongooseSchema);

const fallbackFilePath = path.join(__dirname, '../data/foods_fallback.json');

function ensureFallbackFile() {
  const dir = path.dirname(fallbackFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(fallbackFilePath)) {
    fs.writeFileSync(fallbackFilePath, JSON.stringify([]));
  }
}

const FoodFallback = {
  find: async () => {
    ensureFallbackFile();
    try {
      const data = JSON.parse(fs.readFileSync(fallbackFilePath, 'utf8'));
      return data;
    } catch (e) {
      return [];
    }
  },
  countDocuments: async () => {
    ensureFallbackFile();
    try {
      const data = JSON.parse(fs.readFileSync(fallbackFilePath, 'utf8'));
      return data.length;
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
  },
  findByIdAndDelete: async (id) => {
    ensureFallbackFile();
    try {
      let data = JSON.parse(fs.readFileSync(fallbackFilePath, 'utf8'));
      data = data.filter(item => {
        const itemId = item._id ? item._id.toString() : item.id;
        return itemId !== id;
      });
      fs.writeFileSync(fallbackFilePath, JSON.stringify(data, null, 2));
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },
  saveCustom: async (foodData) => {
    ensureFallbackFile();
    const data = JSON.parse(fs.readFileSync(fallbackFilePath, 'utf8'));
    const exists = data.some(f => f.name.toLowerCase() === foodData.name.toLowerCase());
    if (exists) {
      const err = new Error("Food item already exists.");
      err.code = 11000;
      throw err;
    }
    const newFood = {
      _id: Math.random().toString(36).substr(2, 9),
      ...foodData
    };
    data.push(newFood);
    fs.writeFileSync(fallbackFilePath, JSON.stringify(data, null, 2));
    return newFood;
  }
};

const FoodWrapper = {
  find: async (query) => {
    if (isMongoActive()) return await FoodMongoose.find(query);
    return await FoodFallback.find();
  },
  countDocuments: async () => {
    if (isMongoActive()) return await FoodMongoose.countDocuments();
    return await FoodFallback.countDocuments();
  },
  insertMany: async (foods) => {
    if (isMongoActive()) return await FoodMongoose.insertMany(foods);
    return await FoodFallback.insertMany(foods);
  },
  findByIdAndDelete: async (id) => {
    if (isMongoActive()) return await FoodMongoose.findByIdAndDelete(id);
    return await FoodFallback.findByIdAndDelete(id);
  },
  save: async (foodData) => {
    if (isMongoActive()) {
      const doc = new FoodMongoose(foodData);
      return await doc.save();
    }
    return await FoodFallback.saveCustom(foodData);
  }
};

module.exports = FoodWrapper;
