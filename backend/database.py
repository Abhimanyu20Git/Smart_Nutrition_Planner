import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'nutrition.db')

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Drop existing table to ensure fresh schema
    cursor.execute('DROP TABLE IF EXISTS foods')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS foods (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        protein REAL NOT NULL,
        carbs REAL NOT NULL,
        fats REAL NOT NULL,
        fiber REAL NOT NULL,
        cost REAL NOT NULL,
        conversion_ratio REAL NOT NULL,
        tags TEXT NOT NULL,
        unit_name TEXT NOT NULL,
        unit_weight REAL NOT NULL
    )
    ''')
    
    cursor.execute('DROP TABLE IF EXISTS junk_foods')
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS junk_foods (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        calories REAL NOT NULL,
        protein REAL NOT NULL,
        cost REAL NOT NULL
    )
    ''')
    
    sample_data = [
        # name, protein, carbs, fats, fiber, cost, conversion_ratio, tags, unit_name, unit_weight
        # Macros per 100g raw/uncooked (or 100ml). Sources: USDA FoodData Central, IFCT 2017.
        ('Rice', 7.0, 80.0, 0.3, 1.0, 6.0, 3.0, 'veg', 'cup', 150.0),
        ('Dal', 24.0, 60.0, 1.5, 11.0, 12.0, 2.5, 'veg', 'cup', 200.0),
        ('Eggs', 13.0, 1.1, 11.0, 0.0, 14.0, 1.0, 'non-veg, dairy, eggs', 'piece', 50.0),
        ('Soya Chunks', 52.0, 33.0, 0.5, 13.0, 15.0, 3.0, 'veg', 'cup', 50.0),
        ('Milk', 3.4, 4.8, 3.2, 0.0, 6.0, 1.0, 'veg, no-cook, lactose, dairy', 'glass', 250.0),
        ('Peanuts', 25.8, 16.1, 49.2, 8.5, 15.0, 1.0, 'veg, no-cook, nuts', 'handful', 30.0),
        ('Paneer', 18.0, 3.6, 25.0, 0.0, 35.0, 1.0, 'veg, no-cook, lactose, dairy', 'cube', 25.0),
        ('Whey Protein', 75.0, 5.0, 2.0, 0.0, 250.0, 1.0, 'veg, no-cook, lactose, dairy', 'scoop', 30.0),
        ('Chicken Breast', 31.0, 0.0, 3.6, 0.0, 30.0, 0.75, 'non-veg', 'piece', 150.0),
        ('Moong Dal', 24.0, 59.0, 1.2, 16.0, 10.0, 2.5, 'veg, no-cook', 'cup', 100.0),
        ('Walnuts', 15.2, 13.7, 65.2, 6.7, 120.0, 1.0, 'veg, no-cook, nuts', 'piece', 10.0),
        ('Curd', 3.5, 4.7, 4.3, 0.0, 10.0, 1.0, 'veg, no-cook, lactose, dairy', 'bowl', 150.0),
        ('Oats', 16.9, 66.3, 6.9, 10.6, 15.0, 2.5, 'veg', 'cup', 80.0),
        ('Potatoes', 2.0, 17.0, 0.1, 2.2, 3.0, 1.0, 'veg', 'medium potato', 150.0),
        ('Bananas', 1.1, 22.8, 0.3, 2.6, 5.0, 1.0, 'veg, no-cook, fruits', 'piece', 120.0),
        ('Whole Wheat Roti', 12.0, 62.0, 1.7, 10.0, 8.0, 1.0, 'veg', 'roti', 40.0),
        ('Fish (Rohu)', 20.0, 0.0, 1.8, 0.0, 25.0, 0.75, 'non-veg, seafood', 'fillet', 150.0),
        ('Kala Chana', 20.0, 63.0, 6.0, 12.0, 10.0, 2.5, 'veg', 'cup', 150.0),
        ('Rajma', 22.0, 60.0, 1.3, 24.6, 12.0, 2.5, 'veg', 'cup', 150.0),
        ('Almonds', 21.0, 22.0, 50.0, 12.0, 80.0, 1.0, 'veg, no-cook, nuts', 'piece', 1.2),
    ]
    cursor.executemany('''
    INSERT INTO foods (name, protein, carbs, fats, fiber, cost, conversion_ratio, tags, unit_name, unit_weight)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', sample_data)
    
    junk_data = [
        ('Burger', 250.0, 12.0, 60.0),
        ('Samosa', 200.0, 3.0, 20.0),
        ('Pizza Slice', 300.0, 10.0, 100.0),
        ('Soft Drink', 150.0, 0.0, 40.0)
    ]
    cursor.executemany('''
    INSERT INTO junk_foods (name, calories, protein, cost)
    VALUES (?, ?, ?, ?)
    ''', junk_data)
        
    conn.commit()
    conn.close()

def get_all_foods():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM foods')
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_all_junk_foods():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM junk_foods')
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_all_food_names():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT DISTINCT name FROM foods ORDER BY name')
    rows = cursor.fetchall()
    conn.close()
    return [row[0] for row in rows]

# Initialize db when this module is imported
init_db()
