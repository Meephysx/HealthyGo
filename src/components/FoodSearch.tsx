import React, { useState } from 'react';
import { Search, Loader, Check, AlertCircle, ArrowRight } from 'lucide-react';

export interface FoodDetail {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
}

interface FoodSearchProps {
  onSelectFood?: (food: FoodDetail) => void;
}

const AISearch: React.FC<FoodSearchProps> = ({ onSelectFood }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodDetail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addedFood, setAddedFood] = useState<string | null>(null);

  const handleSearch = async () => {
    if (searchQuery.trim() === '') return;

    setIsLoading(true);
    setError(null);
    setSearchResults([]);

    const apiKey = "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";
    const apiUrl = "https://openrouter.ai/api/v1/chat/completions";

    const prompt = `
      Sebagai ahli nutrisi, berikan informasi nutrisi lengkap untuk makanan: '${searchQuery}'.
      
      Instruksi Output:
      1. Berikan output HANYA dalam format JSON Array.
      2. Jangan gunakan markdown block.
      3. Gunakan Bahasa Indonesia.
      
      Struktur JSON Wajib:
      [
        {
          "name": "Nama Makanan",
          "calories": 0,
          "protein": 0,
          "carbs": 0,
          "fat": 0,
          "servingSize": "ukuran porsi"
        }
      ]
    `;

    const body = {
      model: "google/gemini-2.0-flash-001",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    };

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": window.location.origin,
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) throw new Error("Gagal mengambil data.");

      const data = await response.json();
      let cleanedText = data.choices?.[0]?.message?.content || "";
      
      // Bersihkan markdown jika ada
      cleanedText = cleanedText.replace(/```json/g, '').replace(/```/g, '').trim();
      
      // Pastikan format array
      if (cleanedText.startsWith('{')) cleanedText = `[${cleanedText}]`;
      const start = cleanedText.indexOf('[');
      const end = cleanedText.lastIndexOf(']');
      if (start !== -1 && end !== -1) cleanedText = cleanedText.substring(start, end + 1);

      const foods: FoodDetail[] = JSON.parse(cleanedText);
      setSearchResults(foods);

    } catch (err: any) {
      setError("Gagal mencari makanan.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFood = (food: FoodDetail) => {
    if (onSelectFood) {
      onSelectFood(food);
      setAddedFood(food.name);
      setTimeout(() => setAddedFood(null), 1500); 
    }
  };

  return (
    <div className="w-full">
      {/* --- HEADER COMPACT --- */}
      <div className="mb-5 text-center">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-3">
          Powered by AI Search
        </p>

        {/* --- SEARCH BAR BARU (Compact & Modern) --- */}
        <div className="relative w-full max-w-md mx-auto group">
          {/* Ikon Kiri */}
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400 group-focus-within:text-green-500 transition-colors" />
          </div>

          {/* Input Field */}
          <input
            type="text"
            className="block w-full pl-10 pr-12 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-full focus:bg-white focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all shadow-sm outline-none placeholder:text-gray-400"
            placeholder="Cari makanan (misal: Nasi Padang)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />

          {/* Tombol Kanan (Inside Input) */}
          <div className="absolute inset-y-0 right-1.5 flex items-center">
            <button
              onClick={handleSearch}
              disabled={isLoading || !searchQuery.trim()}
              className="p-1.5 bg-green-500 text-white rounded-full hover:bg-green-600 disabled:bg-gray-200 disabled:text-gray-400 transition-all shadow-sm transform active:scale-95"
            >
              {isLoading ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* --- ERROR STATE --- */}
      {error && (
        <div className="flex items-center justify-center gap-2 text-red-500 text-xs bg-red-50 p-2 rounded-lg mb-4 mx-auto max-w-sm">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {/* --- RESULTS LIST --- */}
      <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
        {!isLoading && searchResults.length > 0 ? (
          searchResults.map((food, index) => (
            <div
              key={index}
              className="group border border-gray-100 bg-white rounded-xl p-3 flex justify-between items-center hover:border-green-200 hover:shadow-md transition-all duration-200"
            >
              <div className="flex-grow min-w-0 mr-3">
                <div className="flex justify-between items-start">
                  <h3 className="text-sm font-bold text-gray-800 truncate">{food.name}</h3>
                  <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full ml-2 whitespace-nowrap">
                    {food.calories} kcal
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 mb-2">{food.servingSize}</p>
                
                {/* Makro Mini */}
                <div className="flex gap-2 text-[10px] text-gray-500 font-medium">
                  <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">P: {food.protein}g</span>
                  <span className="bg-yellow-50 text-yellow-600 px-1.5 py-0.5 rounded">K: {food.carbs}g</span>
                  <span className="bg-red-50 text-red-600 px-1.5 py-0.5 rounded">L: {food.fat}g</span>
                </div>
              </div>
              
              <button
                onClick={() => handleAddFood(food)}
                className={`shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-all ${
                  addedFood === food.name 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-100 text-gray-400 hover:bg-green-100 hover:text-green-600'
                }`}
              >
                {addedFood === food.name ? <Check size={16} /> : <span className="text-lg font-light leading-none mb-0.5">+</span>}
              </button>
            </div>
          ))
        ) : (
          /* Empty State yang lebih bersih */
          !isLoading && !error && (
            <div className="flex flex-col items-center justify-center py-8 text-gray-300">
              <Search className="h-8 w-8 mb-2 opacity-20" />
              <p className="text-xs">Hasil pencarian akan muncul di sini</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default AISearch;