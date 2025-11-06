# Distance Filtering Example

## How the System Works

When you change your location and search for wrestling promotions, the system will:

### 1. **Get Your Current Location**
- Uses the location you selected in the location search
- Retrieves coordinates from Supabase

### 2. **Apply Distance Filtering**
- Only shows promotions within your distance slider range
- Calculates exact distance using Haversine formula
- Filters out promotions that are too far away

### 3. **Example Scenarios**

#### **Scenario A: You're in Mexico City, Distance Slider = 25 miles**
```
🔍 Search query: wrestling
📍 YOUR LOCATION coordinates: {lat: 19.4326, lng: -99.1332}
📏 Distance slider setting: 25 miles
🎯 Will show wrestling promotions within 25 miles of YOUR location

📍 CMLL (Mexico City, Mexico): 0.0 miles - ✅ IN RANGE
📍 AAA (Mexico City, Mexico): 0.0 miles - ✅ IN RANGE
📍 IWRG (Mexico City, Mexico): 0.0 miles - ✅ IN RANGE
📍 AEW (Jacksonville, Florida): 1,234.5 miles - ❌ OUT OF RANGE
   🚫 AEW is 1,234.5 miles away, but your distance slider is set to 25 miles
📍 WWE (Stamford, Connecticut): 2,156.7 miles - ❌ OUT OF RANGE
   🚫 WWE is 2,156.7 miles away, but your distance slider is set to 25 miles

🎯 FINAL RESULT: Showing 3 wrestling promotions within 25 miles of your location
   1. CMLL - 0.0 miles away
   2. AAA - 0.0 miles away
   3. IWRG - 0.0 miles away
```

#### **Scenario B: You're in New York, Distance Slider = 50 miles**
```
🔍 Search query: wrestling
📍 YOUR LOCATION coordinates: {lat: 40.7128, lng: -74.0060}
📏 Distance slider setting: 50 miles
🎯 Will show wrestling promotions within 50 miles of YOUR location

📍 AEW (Jacksonville, Florida): 891.2 miles - ❌ OUT OF RANGE
   🚫 AEW is 891.2 miles away, but your distance slider is set to 50 miles
📍 WWE (Stamford, Connecticut): 45.3 miles - ✅ IN RANGE
📍 MLW (New York, New York): 0.0 miles - ✅ IN RANGE
📍 House of Hardcore (New York, New York): 0.0 miles - ✅ IN RANGE

🎯 FINAL RESULT: Showing 3 wrestling promotions within 50 miles of your location
   1. MLW - 0.0 miles away
   2. House of Hardcore - 0.0 miles away
   3. WWE - 45.3 miles away
```

#### **Scenario C: You're in Tokyo, Distance Slider = 100 miles**
```
🔍 Search query: wrestling
📍 YOUR LOCATION coordinates: {lat: 35.6762, lng: 139.6503}
📏 Distance slider setting: 100 miles
🎯 Will show wrestling promotions within 100 miles of YOUR location

📍 NJPW (Tokyo, Japan): 0.0 miles - ✅ IN RANGE
📍 AJPW (Tokyo, Japan): 0.0 miles - ✅ IN RANGE
📍 DDT (Tokyo, Japan): 0.0 miles - ✅ IN RANGE
📍 Stardom (Tokyo, Japan): 0.0 miles - ✅ IN RANGE
📍 Dragongate (Osaka, Japan): 247.8 miles - ❌ OUT OF RANGE
   🚫 Dragongate is 247.8 miles away, but your distance slider is set to 100 miles

🎯 FINAL RESULT: Showing 4 wrestling promotions within 100 miles of your location
   1. NJPW - 0.0 miles away
   2. AJPW - 0.0 miles away
   3. DDT - 0.0 miles away
   4. Stardom - 0.0 miles away
```

## Key Points

✅ **Only shows promotions within your distance slider range**
✅ **Calculates exact distance from your location**
✅ **Filters out promotions from different states/countries**
✅ **Sorts results by distance (closest first)**
✅ **Clear console logging shows exactly what's happening**

## No More Cross-Continental Results!

- ❌ **No California results when you're in Mexico City**
- ❌ **No New York results when you're in Tokyo**
- ❌ **No London results when you're in Florida**
- ✅ **Only results within YOUR distance slider from YOUR location**
