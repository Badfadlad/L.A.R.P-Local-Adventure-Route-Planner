// Sample data shared by the stories (shaped like the backend's responses).
export const balboa = {
  id: 1, name: "Balboa Park", category: "park", subcategory: "Gardens", neighborhood: "Balboa Park",
  city: "San Diego", estimated_cost: 0, latitude: 32.7341, longitude: -117.1446, average_rating: 4.6, review_count: 12,
};
export const coffee = {
  id: 2, name: "Better Buzz Coffee", category: "cafe", subcategory: "Coffee", neighborhood: "Point Loma",
  city: "San Diego", estimated_cost: 12, latitude: 32.748, longitude: -117.2181,
};
export const prado = {
  id: 3, name: "The Prado", category: "food", subcategory: "Lunch", neighborhood: "Balboa Park",
  city: "San Diego", estimated_cost: 32, latitude: 32.7314, longitude: -117.1505,
};
export const zoo = {
  id: 4, name: "San Diego Zoo", category: "activity", subcategory: "Zoo", neighborhood: "Balboa Park",
  city: "San Diego", estimated_cost: 72, latitude: 32.7353, longitude: -117.149,
};
export const trip = {
  id: 7, name: "San Diego Saturday", destination: "San Diego, CA", trip_date: "2026-10-17",
  status: "planned", stop_count: 4, estimated_total: 60,
};
export const stops = [coffee, balboa, prado].map((place, i) => ({ id: 100 + i, place, cost: place.estimated_cost }));
