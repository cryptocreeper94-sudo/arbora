import {
  Trees, Bike, Mountain, Tent, Fish, Target,
  Waves, Snowflake, Zap, Leaf, TreePine, Anchor
} from "lucide-react";

export const activityCategories = [
  { id: 1, title: "Hiking", icon: Trees, image: "/images/activity-hiking.jpg", color: "from-emerald-600/80" },
  { id: 2, title: "Mountain Biking", icon: Bike, image: "/images/activity-biking.jpg", color: "from-amber-600/80" },
  { id: 3, title: "Rock Climbing", icon: Mountain, image: "/images/activity-climbing.jpg", color: "from-slate-600/80" },
  { id: 4, title: "Camping", icon: Tent, image: "/images/activity-camping.jpg", color: "from-emerald-700/80" },
  { id: 5, title: "Fishing", icon: Fish, image: "/images/activity-fishing.jpg", color: "from-slate-700/80" },
  { id: 6, title: "Hunting", icon: Target, image: "/images/activity-hunting.jpg", color: "from-amber-800/80" },
  { id: 7, title: "Water Sports", icon: Waves, image: "/images/activity-kayaking.jpg", color: "from-emerald-800/80" },
  { id: 8, title: "Winter Sports", icon: Snowflake, image: "/images/activity-skiing.jpg", color: "from-slate-500/80" },
  { id: 9, title: "E-Mobility", icon: Zap, image: "/images/activity-ebike.jpg", color: "from-amber-700/80" },
  { id: 10, title: "Survival", icon: Leaf, image: "/images/activity-survival.jpg", color: "from-stone-700/80" },
  { id: 11, title: "Arborist Pro", icon: TreePine, image: "/images/activity-arborist.jpg", color: "from-emerald-900/80" },
  { id: 12, title: "Charters", icon: Anchor, image: "/images/activity-charter.jpg", color: "from-slate-800/80" },
];

export const featuredTrails = [
  { id: 1, name: "Appalachian Trail - McAfee Knob", location: "Salem, VA", distance: "8.8 mi", elevation: "1,740 ft", difficulty: "Moderate", rating: 4.8, reviews: 2341, image: "/images/trail_1.jpg" },
  { id: 2, name: "Angels Landing", location: "Zion National Park, UT", distance: "5.4 mi", elevation: "1,488 ft", difficulty: "Difficult", rating: 4.9, reviews: 5672, image: "/images/trail_2.jpg" },
  { id: 3, name: "Cascade Canyon Trail", location: "Grand Teton, WY", distance: "9.1 mi", elevation: "1,100 ft", difficulty: "Moderate", rating: 4.7, reviews: 1893, image: "/images/trail_3.jpg" },
  { id: 4, name: "Emerald Lake Trail", location: "Rocky Mountain NP, CO", distance: "3.6 mi", elevation: "605 ft", difficulty: "Easy", rating: 4.6, reviews: 4102, image: "/images/trail_4.jpg" },
  { id: 5, name: "Half Dome Trail", location: "Yosemite, CA", distance: "14.2 mi", elevation: "4,800 ft", difficulty: "Expert", rating: 4.9, reviews: 7823, image: "/images/trail_5.jpg" },
  { id: 6, name: "The Narrows", location: "Zion National Park, UT", distance: "9.4 mi", elevation: "334 ft", difficulty: "Moderate", rating: 4.8, reviews: 6234, image: "/images/trail_6.jpg" },
  { id: 7, name: "Bright Angel Trail", location: "Grand Canyon, AZ", distance: "12.0 mi", elevation: "3,060 ft", difficulty: "Difficult", rating: 4.7, reviews: 3456, image: "/images/trail_7.jpg" },
  { id: 8, name: "Mist Trail", location: "Yosemite, CA", distance: "5.4 mi", elevation: "1,000 ft", difficulty: "Moderate", rating: 4.8, reviews: 8912, image: "/images/trail_8.jpg" },
];

export const allTrails = [
  ...featuredTrails,
  { id: 9, name: "Longs Peak Trail", location: "Rocky Mountain NP, CO", distance: "14.5 mi", elevation: "5,100 ft", difficulty: "Expert", rating: 4.6, reviews: 1230, image: "/images/trail_1.jpg" },
  { id: 10, name: "Skyline Trail", location: "Mt. Rainier, WA", distance: "5.5 mi", elevation: "1,700 ft", difficulty: "Difficult", rating: 4.7, reviews: 890, image: "/images/trail_2.jpg" },
  { id: 11, name: "Beehive Trail", location: "Acadia NP, ME", distance: "1.6 mi", elevation: "500 ft", difficulty: "Moderate", rating: 4.5, reviews: 2100, image: "/images/trail_3.jpg" },
  { id: 12, name: "Lake Solitude Trail", location: "Grand Teton, WY", distance: "14.4 mi", elevation: "2,300 ft", difficulty: "Difficult", rating: 4.6, reviews: 670, image: "/images/trail_4.jpg" },
  { id: 13, name: "Devil's Bridge Trail", location: "Sedona, AZ", distance: "4.2 mi", elevation: "560 ft", difficulty: "Moderate", rating: 4.4, reviews: 3400, image: "/images/trail_5.jpg" },
  { id: 14, name: "Kalalau Trail", location: "Kauai, HI", distance: "22.0 mi", elevation: "6,100 ft", difficulty: "Expert", rating: 4.9, reviews: 1560, image: "/images/trail_6.jpg" },
  { id: 15, name: "Grinnell Glacier Trail", location: "Glacier NP, MT", distance: "7.6 mi", elevation: "1,600 ft", difficulty: "Moderate", rating: 4.8, reviews: 2340, image: "/images/trail_7.jpg" },
  { id: 16, name: "Breakneck Ridge Trail", location: "Hudson Valley, NY", distance: "3.7 mi", elevation: "1,250 ft", difficulty: "Difficult", rating: 4.3, reviews: 4500, image: "/images/trail_8.jpg" },
  { id: 17, name: "Precipice Trail", location: "Acadia NP, ME", distance: "1.6 mi", elevation: "1,000 ft", difficulty: "Expert", rating: 4.7, reviews: 1890, image: "/images/trail_1.jpg" },
  { id: 18, name: "Enchantments Trail", location: "Leavenworth, WA", distance: "18.0 mi", elevation: "4,500 ft", difficulty: "Expert", rating: 4.9, reviews: 3200, image: "/images/trail_2.jpg" },
  { id: 19, name: "Bear Lake Loop", location: "Rocky Mountain NP, CO", distance: "0.8 mi", elevation: "50 ft", difficulty: "Easy", rating: 4.2, reviews: 9800, image: "/images/trail_3.jpg" },
  { id: 20, name: "Hanging Lake Trail", location: "Glenwood Springs, CO", distance: "2.4 mi", elevation: "1,020 ft", difficulty: "Moderate", rating: 4.7, reviews: 5600, image: "/images/trail_4.jpg" },
];

export const gearCategories = [
  {
    name: "Clothing",
    items: [
      { id: 1, name: "Moisture-wicking base layer", checked: true },
      { id: 2, name: "Insulating mid-layer", checked: true },
      { id: 3, name: "Waterproof shell jacket", checked: false },
      { id: 4, name: "Hiking pants (convertible)", checked: true },
      { id: 5, name: "Wool hiking socks (2 pairs)", checked: false },
      { id: 6, name: "Wide-brim hat", checked: true },
    ],
  },
  {
    name: "Safety & Navigation",
    items: [
      { id: 7, name: "First aid kit", checked: true },
      { id: 8, name: "Headlamp + extra batteries", checked: false },
      { id: 9, name: "Compass & topographic map", checked: true },
      { id: 10, name: "Emergency whistle", checked: true },
      { id: 11, name: "Fire starter kit", checked: false },
      { id: 12, name: "Emergency blanket", checked: true },
    ],
  },
  {
    name: "Shelter & Sleep",
    items: [
      { id: 13, name: "Tent (3-season)", checked: true },
      { id: 14, name: "Sleeping bag (20°F rated)", checked: true },
      { id: 15, name: "Sleeping pad", checked: false },
      { id: 16, name: "Tent footprint/ground cloth", checked: true },
      { id: 17, name: "Pillow (compressible)", checked: false },
    ],
  },
  {
    name: "Food & Water",
    items: [
      { id: 18, name: "Water filter/purifier", checked: true },
      { id: 19, name: "Water bottles (2L total)", checked: true },
      { id: 20, name: "Camp stove + fuel", checked: false },
      { id: 21, name: "Cooking pot & utensils", checked: true },
      { id: 22, name: "Dehydrated meals (3 days)", checked: false },
      { id: 23, name: "Trail snacks & energy bars", checked: true },
      { id: 24, name: "Bear canister / hang bag", checked: true },
    ],
  },
  {
    name: "Pack & Accessories",
    items: [
      { id: 25, name: "Backpack (55-65L)", checked: true },
      { id: 26, name: "Pack rain cover", checked: false },
      { id: 27, name: "Trekking poles", checked: true },
      { id: 28, name: "Dry bags (assorted sizes)", checked: false },
      { id: 29, name: "Sunscreen (SPF 50+)", checked: true },
      { id: 30, name: "Insect repellent", checked: true },
    ],
  },
  {
    name: "Tech & Communication",
    items: [
      { id: 31, name: "GPS device / phone mount", checked: true },
      { id: 32, name: "Portable charger (10000mAh+)", checked: false },
      { id: 33, name: "Satellite communicator (InReach)", checked: false },
      { id: 34, name: "Camera + extra SD card", checked: true },
    ],
  },
  {
    name: "Hygiene",
    items: [
      { id: 35, name: "Biodegradable soap", checked: false },
      { id: 36, name: "Toothbrush & paste", checked: true },
      { id: 37, name: "Trowel (for cat holes)", checked: true },
      { id: 38, name: "Hand sanitizer", checked: true },
      { id: 39, name: "Microfiber towel", checked: false },
    ],
  },
  {
    name: "Miscellaneous",
    items: [
      { id: 40, name: "Multi-tool / knife", checked: true },
      { id: 41, name: "Duct tape (small roll)", checked: false },
      { id: 42, name: "Paracord (50 ft)", checked: true },
      { id: 43, name: "Ziplock bags (various sizes)", checked: true },
      { id: 44, name: "Trash bags (Leave No Trace)", checked: true },
      { id: 45, name: "Field guide / nature book", checked: false },
    ],
  },
];

export const campgrounds = [
  { id: 1, name: "Elkmont Campground", location: "Great Smoky Mountains, TN", price: 28, rating: 4.5, sites: 220, amenities: ["Water", "Toilets", "Fire Rings", "Picnic Tables"], image: "/images/campground_1.jpg" },
  { id: 2, name: "Moraine Park Campground", location: "Rocky Mountain NP, CO", price: 35, rating: 4.7, sites: 244, amenities: ["Water", "Toilets", "Showers", "Bear Boxes"], image: "/images/campground_2.jpg" },
  { id: 3, name: "Upper Pines Campground", location: "Yosemite Valley, CA", price: 36, rating: 4.6, sites: 238, amenities: ["Water", "Toilets", "Showers", "Fire Rings"], image: "/images/campground_3.jpg" },
  { id: 4, name: "Devil's Garden Campground", location: "Arches NP, UT", price: 30, rating: 4.4, sites: 51, amenities: ["Water", "Toilets", "Picnic Tables"], image: "/images/campground_4.jpg" },
  { id: 5, name: "Watchman Campground", location: "Zion NP, UT", price: 32, rating: 4.6, sites: 176, amenities: ["Water", "Toilets", "Showers", "Hookups"], image: "/images/campground_5.jpg" },
];

export const woodListings = [
  { id: 1, species: "Black Walnut", grade: "FAS", dimensions: '8/4 x 8" x 10\'', pricePerBf: 18.50, seller: "Appalachian Hardwoods", trustLevel: 4 as const, trustScore: 965, location: "Asheville, NC", image: "/images/wood_1.jpg" },
  { id: 2, species: "White Oak", grade: "Select", dimensions: '4/4 x 6" x 8\'', pricePerBf: 8.75, seller: "Mountain Lumber Co.", trustLevel: 3 as const, trustScore: 842, location: "Roanoke, VA", image: "/images/wood_2.jpg" },
  { id: 3, species: "Cherry", grade: "FAS", dimensions: '6/4 x 10" x 12\'', pricePerBf: 12.25, seller: "Heritage Wood Supply", trustLevel: 3 as const, trustScore: 798, location: "Lancaster, PA", image: "/images/wood_3.jpg" },
  { id: 4, species: "Hard Maple", grade: "No. 1 Common", dimensions: '4/4 x 5" x 8\'', pricePerBf: 6.50, seller: "Great Lakes Timber", trustLevel: 2 as const, trustScore: 721, location: "Traverse City, MI", image: "/images/wood_4.jpg" },
  { id: 5, species: "Western Red Cedar", grade: "Clear", dimensions: '8/4 x 12" x 16\'', pricePerBf: 14.00, seller: "Pacific Northwest Woods", trustLevel: 4 as const, trustScore: 980, location: "Portland, OR", image: "/images/wood_5.jpg" },
  { id: 6, species: "Live Edge Walnut", grade: "Premium Slab", dimensions: '3" x 24" x 7\'', pricePerBf: 25.00, seller: "Slab Masters", trustLevel: 2 as const, trustScore: 689, location: "Chattanooga, TN", image: "/images/wood_6.jpg" },
  { id: 7, species: "Hickory", grade: "FAS", dimensions: '4/4 x 7" x 10\'', pricePerBf: 9.25, seller: "Ozark Hardwood", trustLevel: 3 as const, trustScore: 856, location: "Springfield, MO", image: "/images/wood_1.jpg" },
  { id: 8, species: "White Ash", grade: "Select", dimensions: '6/4 x 8" x 12\'', pricePerBf: 7.50, seller: "Green Mountain Lumber", trustLevel: 1 as const, trustScore: 654, location: "Burlington, VT", image: "/images/wood_2.jpg" },
  { id: 9, species: "Spalted Maple", grade: "Character", dimensions: '8/4 x 14" x 6\'', pricePerBf: 16.75, seller: "Artisan Wood Co.", trustLevel: 4 as const, trustScore: 923, location: "Bend, OR", image: "/images/wood_3.jpg" },
  { id: 10, species: "Eastern Red Cedar", grade: "Rustic", dimensions: '4/4 x 6" x 8\'', pricePerBf: 5.25, seller: "Heartland Sawmill", trustLevel: 1 as const, trustScore: 672, location: "Nashville, TN", image: "/images/wood_4.jpg" },
];

export const similarSpecies = [
  { name: "Scots Pine", scientific: "Pinus sylvestris", image: "/images/species-oak.jpg" },
  { name: "Red Pine", scientific: "Pinus resinosa", image: "/images/species-maple.jpg" },
  { name: "Jack Pine", scientific: "Pinus banksiana", image: "/images/species-birch.jpg" },
  { name: "Pitch Pine", scientific: "Pinus rigida", image: "/images/species-cedar.jpg" },
  { name: "Loblolly Pine", scientific: "Pinus taeda", image: "/images/species-spruce.jpg" },
  { name: "Sugar Pine", scientific: "Pinus lambertiana", image: "/images/species-pine.jpg" },
];

export const userProfile = {
  name: "Alex Thompson",
  avatar: "/images/avatar-user.jpg",
  tier: "Outdoor Explorer",
  tierPrice: "$19.99/yr",
  trailsCompleted: 127,
  speciesIdentified: 43,
  conservationDonated: 150,
  equipmentTracked: 8,
  memberSince: "March 2024",
};

export const userActivities = [
  { id: 1, type: "identification" as const, title: "Identified Eastern White Pine", date: "2 hours ago", image: "/images/species-pine.jpg" },
  { id: 2, type: "trail" as const, title: "Completed Appalachian Trail - McAfee Knob", date: "Yesterday", image: "/images/trail_1.jpg" },
  { id: 3, type: "marketplace" as const, title: "Purchased Black Walnut - 20 board feet", date: "3 days ago", image: "/images/wood_1.jpg" },
  { id: 4, type: "conservation" as const, title: "Donated $25 to RMEF", date: "1 week ago", image: "/images/activity-conservation.jpg" },
  { id: 5, type: "trail" as const, title: "Completed Emerald Lake Trail", date: "2 weeks ago", image: "/images/trail_4.jpg" },
  { id: 6, type: "identification" as const, title: "Identified Sugar Maple", date: "2 weeks ago", image: "/images/species-maple.jpg" },
];

export const tripWaypoints = [
  { id: 1, name: "Trailhead Parking - Elkmont", time: "Day 1 - 7:00 AM", duration: "Start" },
  { id: 2, name: "Jakes Creek Trail Junction", time: "Day 1 - 9:30 AM", duration: "2.5 hrs" },
  { id: 3, name: "Campsite #24 - Backcountry", time: "Day 1 - 3:00 PM", duration: "5.5 hrs" },
  { id: 4, name: "Clingmans Dome Summit", time: "Day 2 - 11:00 AM", duration: "4 hrs" },
  { id: 5, name: "Newfound Gap Overlook", time: "Day 2 - 2:00 PM", duration: "3 hrs" },
  { id: 6, name: "Return to Trailhead", time: "Day 3 - 12:00 PM", duration: "5 hrs" },
];

export const weeklyForecast = [
  { day: "Mon", high: 72, low: 54, icon: "sun", condition: "Sunny" },
  { day: "Tue", high: 68, low: 51, icon: "cloud-sun", condition: "Partly Cloudy" },
  { day: "Wed", high: 65, low: 48, icon: "cloud-rain", condition: "Rain" },
  { day: "Thu", high: 70, low: 52, icon: "sun", condition: "Sunny" },
  { day: "Fri", high: 74, low: 56, icon: "sun", condition: "Clear" },
  { day: "Sat", high: 71, low: 53, icon: "cloud", condition: "Overcast" },
  { day: "Sun", high: 69, low: 50, icon: "cloud-sun", condition: "Partly Cloudy" },
];
