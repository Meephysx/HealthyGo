import React, { useState } from 'react';
import { Search, Loader, Info, Check } from 'lucide-react';

interface FoodDetail {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
}

interface FoodSearchProps {
  onSelectFood?: (food: FoodDetail) => void; // dipanggil ketika user klik Add
}

const AISearch: React.FC<FoodSearchProps> = ({ onSelectFood }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodDetail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addedFood, setAddedFood] = useState<string | null>(null);

  const handleSearch = async () => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setSearchResults([]);

    const apiKey = "AIzaSyAtFPZ9ZMr350lAx7Mg8u6CnI95dHBdvK4"; // ganti sesuai API key-mu
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const prompt = `Sebagai ahli nutrisi, berikan informasi nutrisi lengkap untuk '${searchQuery}' dalam format JSON.
Contoh format:
[
  {
    "name": "Nasi Goreng",
    "calories": 250,
    "protein": 8,
    "carbs": 35,
    "fat": 10,
    "servingSize": "1 porsi"
  }
]`;

    const body = {
      contents: [{ parts: [{ text: prompt }] }]
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

      if (!text) throw new Error("Tidak ada respons dari AI.");

      // Bersihkan dan parse JSON
      let cleanedText = text.trim();
      if (cleanedText.includes('```json')) {
        cleanedText = cleanedText.replace(/```json\s*\n?/, '').replace(/\n?\s*```/, '');
      } else if (cleanedText.includes('```')) {
        cleanedText = cleanedText.replace(/```\s*\n?/, '').replace(/\n?\s*```/, '');
      }

      const jsonStart = cleanedText.indexOf('[');
      const jsonEnd = cleanedText.lastIndexOf(']');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        cleanedText = cleanedText.substring(jsonStart, jsonEnd + 1);
      }

      const foods: FoodDetail[] = JSON.parse(cleanedText);
      setSearchResults(foods);
    } catch (err: any) {
      console.error('Error during AI search:', err);
      setError(`Gagal mencari makanan: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFood = (food: FoodDetail) => {
    if (onSelectFood) {
      onSelectFood(food);
      setAddedFood(food.name);
      setTimeout(() => setAddedFood(null), 1500); // animasi sukses 1.5 detik
    }
  };

  return (
    <div className="bg-gray-50 py-4 rounded-xl">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Pencarian Makanan AI</h1>
        <p className="text-gray-600 mb-4">
          Cari informasi nutrisi untuk berbagai makanan menggunakan AI.
        </p>

        {/* Search Bar */}
        <div className="flex items-center border border-gray-300 rounded-lg mb-6 overflow-hidden">
          <input
            type="text"
            placeholder="Cari makanan.."
            className="flex-grow p-3 outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="p-3 bg-purple-600 text-white hover:bg-purple-700 transition disabled:opacity-50"
          >
            {isLoading ? <Loader className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong className="font-bold">Error:</strong> {error}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="text-center py-6 text-gray-500 flex justify-center items-center">
            <Loader className="h-6 w-6 animate-spin mr-2 text-purple-500" />
            Mencari makanan...
          </div>
        )}

        {/* Results */}
        {!isLoading && searchResults.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Hasil Pencarian</h2>
            <div className="space-y-3">
              {searchResults.map((food, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 flex justify-between items-start hover:bg-green-50 transition"
                >
                  <div>
                    <h3 className="text-lg font-medium text-gray-800">{food.name}</h3>
                    <p className="text-sm text-gray-600 mb-1">Porsi: {food.servingSize}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm text-gray-700">
                      <p><span className="font-medium">Kalori:</span> {food.calories} kcal</p>
                      <p><span className="font-medium">Protein:</span> {food.protein} g</p>
                      <p><span className="font-medium">Karbo:</span> {food.carbs} g</p>
                      <p><span className="font-medium">Lemak:</span> {food.fat} g</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddFood(food)}
                    className="ml-3 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-1.5 px-3 rounded-lg"
                  >
                    + Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && searchResults.length === 0 && (
          <div className="bg-white text-center text-gray-500 p-6 rounded-xl">
            <Search className="mx-auto h-8 w-8 mb-2 text-gray-400" />
            <p>Masukkan nama makanan untuk memulai pencarian.</p>
          </div>
        )}

        {/* Success Toast */}
        {addedFood && (
          <div className="fixed bottom-6 right-6 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
            <Check className="w-5 h-5" /> {addedFood} ditambahkan!
          </div>
        )}
      </div>
    </div>
  );
};

export default AISearch;
