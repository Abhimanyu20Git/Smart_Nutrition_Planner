const Food = require('../models/Food');
const JunkFood = require('../models/JunkFood');

const seedData = async () => {
  try {
    const foodCount = await Food.countDocuments();
    if (foodCount === 0) {
      const sampleFoods = [
        { name: 'Rice', protein: 7.0, carbs: 80.0, fats: 0.3, fiber: 1.0, cost: 6.0, conversion_ratio: 3.0, tags: 'veg', unit_name: 'cup', unit_weight: 150.0 },
        { name: 'Dal', protein: 24.0, carbs: 60.0, fats: 1.5, fiber: 11.0, cost: 12.0, conversion_ratio: 2.5, tags: 'veg', unit_name: 'cup', unit_weight: 200.0 },
        { name: 'Eggs', protein: 13.0, carbs: 1.1, fats: 11.0, fiber: 0.0, cost: 14.0, conversion_ratio: 1.0, tags: 'non-veg, dairy, eggs', unit_name: 'piece', unit_weight: 50.0 },
        { name: 'Soya Chunks', protein: 52.0, carbs: 33.0, fats: 0.5, fiber: 13.0, cost: 15.0, conversion_ratio: 3.0, tags: 'veg', unit_name: 'cup', unit_weight: 50.0 },
        { name: 'Milk', protein: 3.4, carbs: 4.8, fats: 3.2, fiber: 0.0, cost: 6.0, conversion_ratio: 1.0, tags: 'veg, no-cook, lactose, dairy', unit_name: 'glass', unit_weight: 250.0 },
        { name: 'Peanuts', protein: 25.8, carbs: 16.1, fats: 49.2, fiber: 8.5, cost: 15.0, conversion_ratio: 1.0, tags: 'veg, no-cook, nuts', unit_name: 'handful', unit_weight: 30.0 },
        { name: 'Paneer', protein: 18.0, carbs: 3.6, fats: 25.0, fiber: 0.0, cost: 35.0, conversion_ratio: 1.0, tags: 'veg, no-cook, lactose, dairy', unit_name: 'cube', unit_weight: 25.0 },
        { name: 'Whey Protein', protein: 75.0, carbs: 5.0, fats: 2.0, fiber: 0.0, cost: 250.0, conversion_ratio: 1.0, tags: 'veg, no-cook, lactose, dairy', unit_name: 'scoop', unit_weight: 30.0 },
        { name: 'Chicken Breast', protein: 31.0, carbs: 0.0, fats: 3.6, fiber: 0.0, cost: 30.0, conversion_ratio: 0.75, tags: 'non-veg', unit_name: 'piece', unit_weight: 150.0 },
        { name: 'Moong Dal', protein: 24.0, carbs: 59.0, fats: 1.2, fiber: 16.0, cost: 10.0, conversion_ratio: 2.5, tags: 'veg, no-cook', unit_name: 'cup', unit_weight: 100.0 },
        { name: 'Walnuts', protein: 15.2, carbs: 13.7, fats: 65.2, fiber: 6.7, cost: 120.0, conversion_ratio: 1.0, tags: 'veg, no-cook, nuts', unit_name: 'piece', unit_weight: 10.0 },
        { name: 'Curd', protein: 3.5, carbs: 4.7, fats: 4.3, fiber: 0.0, cost: 10.0, conversion_ratio: 1.0, tags: 'veg, no-cook, lactose, dairy', unit_name: 'bowl', unit_weight: 150.0 },
        { name: 'Oats', protein: 16.9, carbs: 66.3, fats: 6.9, fiber: 10.6, cost: 15.0, conversion_ratio: 2.5, tags: 'veg', unit_name: 'cup', unit_weight: 80.0 },
        { name: 'Potatoes', protein: 2.0, carbs: 17.0, fats: 0.1, fiber: 2.2, cost: 3.0, conversion_ratio: 1.0, tags: 'veg', unit_name: 'medium potato', unit_weight: 150.0 },
        { name: 'Bananas', protein: 1.1, carbs: 22.8, fats: 0.3, fiber: 2.6, cost: 5.0, conversion_ratio: 1.0, tags: 'veg, no-cook, fruits', unit_name: 'piece', unit_weight: 120.0 },
        { name: 'Whole Wheat Roti', protein: 12.0, carbs: 62.0, fats: 1.7, fiber: 10.0, cost: 8.0, conversion_ratio: 1.0, tags: 'veg', unit_name: 'roti', unit_weight: 40.0 },
        { name: 'Fish (Rohu)', protein: 20.0, carbs: 0.0, fats: 1.8, fiber: 0.0, cost: 25.0, conversion_ratio: 0.75, tags: 'non-veg, seafood', unit_name: 'fillet', unit_weight: 150.0 },
        { name: 'Kala Chana', protein: 20.0, carbs: 63.0, fats: 6.0, fiber: 12.0, cost: 10.0, conversion_ratio: 2.5, tags: 'veg', unit_name: 'cup', unit_weight: 150.0 },
        { name: 'Rajma', protein: 22.0, carbs: 60.0, fats: 1.3, fiber: 24.6, cost: 12.0, conversion_ratio: 2.5, tags: 'veg', unit_name: 'cup', unit_weight: 150.0 },
        { name: 'Almonds', protein: 21.0, carbs: 22.0, fats: 50.0, fiber: 12.0, cost: 80.0, conversion_ratio: 1.0, tags: 'veg, no-cook, nuts', unit_name: 'piece', unit_weight: 1.2 },
        // Expanded Database - Additional Staple Foods
        { name: 'Tofu', protein: 8.0, carbs: 2.0, fats: 4.8, fiber: 0.3, cost: 25.0, conversion_ratio: 1.0, tags: 'veg, no-cook, vegan', unit_name: 'block', unit_weight: 100.0 },
        { name: 'Sweet Potato', protein: 1.6, carbs: 20.0, fats: 0.1, fiber: 3.0, cost: 5.0, conversion_ratio: 1.0, tags: 'veg', unit_name: 'medium potato', unit_weight: 150.0 },
        { name: 'Spinach (Palak)', protein: 2.9, carbs: 3.6, fats: 0.4, fiber: 2.2, cost: 3.0, conversion_ratio: 1.0, tags: 'veg', unit_name: 'bunch', unit_weight: 200.0 },
        { name: 'Chickpeas (White Chana)', protein: 19.0, carbs: 60.0, fats: 6.0, fiber: 17.0, cost: 10.0, conversion_ratio: 2.5, tags: 'veg', unit_name: 'cup', unit_weight: 150.0 },
        { name: 'Greek Yogurt', protein: 10.0, carbs: 3.6, fats: 0.4, fiber: 0.0, cost: 20.0, conversion_ratio: 1.0, tags: 'veg, no-cook, dairy', unit_name: 'cup', unit_weight: 150.0 },
        { name: 'Chicken Thigh', protein: 26.0, carbs: 0.0, fats: 9.0, fiber: 0.0, cost: 22.0, conversion_ratio: 0.75, tags: 'non-veg', unit_name: 'piece', unit_weight: 150.0 },
        { name: 'Ghee', protein: 0.0, carbs: 0.0, fats: 99.0, fiber: 0.0, cost: 70.0, conversion_ratio: 1.0, tags: 'veg, no-cook, dairy', unit_name: 'spoon', unit_weight: 10.0 },
        { name: 'Brown Rice', protein: 7.9, carbs: 77.0, fats: 2.9, fiber: 3.5, cost: 8.0, conversion_ratio: 3.0, tags: 'veg', unit_name: 'cup', unit_weight: 150.0 },
        { name: 'Millet Roti (Ragi/Bajra)', protein: 11.0, carbs: 73.0, fats: 4.2, fiber: 8.5, cost: 7.0, conversion_ratio: 1.0, tags: 'veg', unit_name: 'roti', unit_weight: 40.0 },
        { name: 'Chia Seeds', protein: 16.5, carbs: 42.0, fats: 30.7, fiber: 34.4, cost: 80.0, conversion_ratio: 1.0, tags: 'veg, no-cook, nuts', unit_name: 'spoon', unit_weight: 12.0 },
        { name: 'Flax Seeds', protein: 18.0, carbs: 29.0, fats: 42.0, fiber: 27.0, cost: 40.0, conversion_ratio: 1.0, tags: 'veg, no-cook, nuts', unit_name: 'spoon', unit_weight: 10.0 },
        { name: 'Low Fat Paneer', protein: 14.0, carbs: 3.0, fats: 4.0, fiber: 0.0, cost: 30.0, conversion_ratio: 1.0, tags: 'veg, no-cook, dairy', unit_name: 'cube', unit_weight: 25.0 },
        { name: 'Broccoli', protein: 2.8, carbs: 7.0, fats: 0.3, fiber: 2.6, cost: 25.0, conversion_ratio: 1.0, tags: 'veg', unit_name: 'cup', unit_weight: 150.0 },
        { name: 'Apple', protein: 0.3, carbs: 14.0, fats: 0.2, fiber: 2.4, cost: 15.0, conversion_ratio: 1.0, tags: 'veg, no-cook, fruits', unit_name: 'piece', unit_weight: 150.0 },
        { name: 'Masoor Dal', protein: 25.0, carbs: 60.0, fats: 1.0, fiber: 10.8, cost: 11.0, conversion_ratio: 2.5, tags: 'veg', unit_name: 'cup', unit_weight: 150.0 },
        { name: 'Soy Milk', protein: 3.3, carbs: 4.0, fats: 1.8, fiber: 0.6, cost: 12.0, conversion_ratio: 1.0, tags: 'veg, no-cook, vegan', unit_name: 'glass', unit_weight: 250.0 },
        { name: 'Wheat Bran', protein: 15.6, carbs: 64.5, fats: 4.3, fiber: 42.8, cost: 10.0, conversion_ratio: 1.0, tags: 'veg', unit_name: 'spoon', unit_weight: 10.0 },
        { name: 'Fish (Basa Fillet)', protein: 18.0, carbs: 0.0, fats: 2.0, fiber: 0.0, cost: 28.0, conversion_ratio: 0.75, tags: 'non-veg, seafood', unit_name: 'fillet', unit_weight: 150.0 },
        { name: 'Sattu', protein: 20.0, carbs: 60.0, fats: 5.0, fiber: 12.0, cost: 8.0, conversion_ratio: 1.0, tags: 'veg, no-cook', unit_name: 'spoon', unit_weight: 15.0 },
        { name: 'Pumpkin Seeds', protein: 30.0, carbs: 10.0, fats: 49.0, fiber: 6.0, cost: 90.0, conversion_ratio: 1.0, tags: 'veg, no-cook, nuts', unit_name: 'spoon', unit_weight: 10.0 }
      ];
      await Food.insertMany(sampleFoods);
      console.log('Seeded expanded list of 40 staple Indian foods.');
    }

    const junkCount = await JunkFood.countDocuments();
    if (junkCount === 0) {
      const sampleJunk = [
        { name: 'Burger', calories: 250.0, protein: 12.0, cost: 60.0 },
        { name: 'Samosa', calories: 200.0, protein: 3.0, cost: 20.0 },
        { name: 'Pizza Slice', calories: 300.0, protein: 10.0, cost: 100.0 },
        { name: 'Soft Drink', calories: 150.0, protein: 0.0, cost: 40.0 }
      ];
      await JunkFood.insertMany(sampleJunk);
      console.log('Junk foods comparison base seeded into MongoDB.');
    }
  } catch (error) {
    console.error(`Data seeding failed: ${error.message}`);
  }
};

module.exports = seedData;
