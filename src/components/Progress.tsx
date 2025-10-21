
import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Target, 
  Award,
  Plus,
  Scale,
  Ruler,
  Camera,
  BarChart3
} from 'lucide-react';
import type { User, ProgressEntry } from '../types';

const Progress: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [progressEntries, setProgressEntries] = useState<ProgressEntry[]>([]);
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [newEntry, setNewEntry] = useState({
    weight: '',
    bodyFat: '',
    chest: '',
    waist: '',
    hips: '',
    arms: '',
    thighs: '',
    notes: ''
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Load progress entries
    const savedProgress = localStorage.getItem('progressEntries');
    if (savedProgress) {
      setProgressEntries(JSON.parse(savedProgress));
    } else {
      // Generate some sample data
      const sampleEntries: ProgressEntry[] = [
        {
          id: '1',
          userId: 'user1',
          date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          weight: 75,
          bodyFat: 18,
          measurements: { waist: 85, chest: 100, arms: 35, thighs: 58 },
          notes: 'Starting my fitness journey!'
        },
        {
          id: '2',
          userId: 'user1',
          date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          weight: 73.5,
          bodyFat: 17,
          measurements: { waist: 83, chest: 101, arms: 36, thighs: 58 },
          notes: 'Feeling stronger and more energetic'
        },
        {
          id: '3',
          userId: 'user1',
          date: new Date().toISOString().split('T')[0],
          weight: 72,
          bodyFat: 16,
          measurements: { waist: 81, chest: 102, arms: 37, thighs: 59 },
          notes: 'Great progress! Clothes fitting better'
        }
      ];
      setProgressEntries(sampleEntries);
      localStorage.setItem('progressEntries', JSON.stringify(sampleEntries));
    }
  }, []);

  const addProgressEntry = () => {
    if (!newEntry.weight) return;

    const entry: ProgressEntry = {
      id: Date.now().toString(),
      userId: user?.id || 'user1',
      date: new Date().toISOString().split('T')[0],
      weight: parseFloat(newEntry.weight),
      bodyFat: newEntry.bodyFat ? parseFloat(newEntry.bodyFat) : undefined,
      measurements: {
        chest: newEntry.chest ? parseFloat(newEntry.chest) : undefined,
        waist: newEntry.waist ? parseFloat(newEntry.waist) : undefined,
        hips: newEntry.hips ? parseFloat(newEntry.hips) : undefined,
        arms: newEntry.arms ? parseFloat(newEntry.arms) : undefined,
        thighs: newEntry.thighs ? parseFloat(newEntry.thighs) : undefined
      },
      notes: newEntry.notes
    };

    const updatedEntries = [...progressEntries, entry].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    setProgressEntries(updatedEntries);
    localStorage.setItem('progressEntries', JSON.stringify(updatedEntries));
    
    setNewEntry({
      weight: '',
      bodyFat: '',
      chest: '',
      waist: '',
      hips: '',
      arms: '',
      thighs: '',
      notes: ''
    });
    setShowAddEntry(false);
  };

  const getWeightTrend = () => {
    if (progressEntries.length < 2) return null;
    const latest = progressEntries[progressEntries.length - 1];
    const previous = progressEntries[progressEntries.length - 2];
    const change = latest.weight - previous.weight;
    return {
      change: Math.abs(change),
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
      percentage: Math.abs((change / previous.weight) * 100)
    };
  };

  const getProgressToGoal = () => {
    if (!user || progressEntries.length === 0) return 0;
    const currentWeight = progressEntries[progressEntries.length - 1].weight;
    const startWeight = user.weight;
    const targetWeight = user.idealWeight;
    
    const totalChange = Math.abs(targetWeight - startWeight);
    const currentChange = Math.abs(currentWeight - startWeight);
    
    return Math.min(100, (currentChange / totalChange) * 100);
  };

  const getAchievements = () => {
    const achievements = [];
    
    if (progressEntries.length >= 5) {
      achievements.push({ title: 'Consistent Tracker', description: '5+ progress entries', icon: Calendar });
    }
    
    const weightTrend = getWeightTrend();
    if (weightTrend && weightTrend.change > 0) {
      achievements.push({ 
        title: user?.goal === 'weight-loss' ? 'Weight Loss Progress' : 'Weight Gain Progress', 
        description: `${weightTrend.change.toFixed(1)}kg change`, 
        icon: weightTrend.direction === 'down' ? TrendingDown : TrendingUp 
      });
    }
    
    if (progressEntries.length >= 10) {
      achievements.push({ title: 'Progress Master', description: '10+ progress entries', icon: Award });
    }
    
    return achievements;
  };

  const weightTrend = getWeightTrend();
  const progressToGoal = getProgressToGoal();
  const achievements = getAchievements();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Progress Tracking</h1>
            <p className="text-gray-600 mt-2">Monitor your journey towards your health goals</p>
          </div>
          <button
            onClick={() => setShowAddEntry(true)}
            className="flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Entry
          </button>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Current Weight</p>
                <p className="text-2xl font-bold text-gray-900">
                  {progressEntries.length > 0 ? progressEntries[progressEntries.length - 1].weight : user.weight}kg
                </p>
                {weightTrend && (
                  <div className={`flex items-center mt-2 text-sm ${
                    weightTrend.direction === 'down' ? 'text-green-600' : 
                    weightTrend.direction === 'up' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {weightTrend.direction === 'down' ? <TrendingDown className="h-4 w-4 mr-1" /> : 
                     weightTrend.direction === 'up' ? <TrendingUp className="h-4 w-4 mr-1" /> : null}
                    {weightTrend.change.toFixed(1)}kg
                  </div>
                )}
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Scale className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Goal Progress</p>
                <p className="text-2xl font-bold text-gray-900">{Math.round(progressToGoal)}%</p>
                <p className="text-sm text-gray-500 mt-2">To {user.idealWeight}kg</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Target className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">BMI</p>
                <p className="text-2xl font-bold text-gray-900">
                  {progressEntries.length > 0 ? 
                    ((progressEntries[progressEntries.length - 1].weight / Math.pow(user.height / 100, 2)).toFixed(1)) : 
                    user.bmi
                  }
                </p>
                <p className="text-sm text-green-600 mt-2">Normal range</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Entries</p>
                <p className="text-2xl font-bold text-gray-900">{progressEntries.length}</p>
                <p className="text-sm text-gray-500 mt-2">Total logged</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Progress Chart */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Weight Progress</h2>
            
            {progressEntries.length > 0 ? (
              <div className="space-y-6">
                {/* Simple line representation */}
                <div className="relative h-64 bg-gray-50 rounded-lg p-4">
                  <div className="flex items-end justify-between h-full">
                    {progressEntries.map((entry, index) => {
                      const maxWeight = Math.max(...progressEntries.map(e => e.weight));
                      const minWeight = Math.min(...progressEntries.map(e => e.weight));
                      const range = maxWeight - minWeight || 1;
                      const height = ((entry.weight - minWeight) / range) * 80 + 10;
                      
                      return (
                        <div key={entry.id} className="flex flex-col items-center">
                          <div className="text-xs text-gray-600 mb-2">{entry.weight}kg</div>
                          <div 
                            className="w-8 bg-gradient-to-t from-blue-500 to-green-500 rounded-t"
                            style={{ height: `${height}%` }}
                          ></div>
                          <div className="text-xs text-gray-500 mt-2 transform rotate-45">
                            {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Progress entries list */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Recent Entries</h3>
                  {progressEntries.slice(-5).reverse().map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">
                          {new Date(entry.date).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </div>
                        <div className="text-sm text-gray-600">
                          Weight: {entry.weight}kg
                          {entry.bodyFat && ` • Body Fat: ${entry.bodyFat}%`}
                        </div>
                        {entry.notes && (
                          <div className="text-sm text-gray-500 mt-1">"{entry.notes}"</div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">{entry.weight}kg</div>
                        {entry.bodyFat && (
                          <div className="text-sm text-gray-500">{entry.bodyFat}% BF</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No progress data yet</h3>
                <p className="mb-4">Start tracking your progress to see charts and trends</p>
                <button
                  onClick={() => setShowAddEntry(true)}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Add First Entry
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Goal Progress */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Goal Progress</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Progress to Goal</span>
                    <span className="font-medium">{Math.round(progressToGoal)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${progressToGoal}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Starting Weight:</span>
                    <span className="font-medium">{user.weight}kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Weight:</span>
                    <span className="font-medium">
                      {progressEntries.length > 0 ? progressEntries[progressEntries.length - 1].weight : user.weight}kg
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Target Weight:</span>
                    <span className="font-medium">{user.idealWeight}kg</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Achievements */}
            {achievements.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Achievements</h3>
                <div className="space-y-3">
                  {achievements.map((achievement, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <achievement.icon className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{achievement.title}</h4>
                        <p className="text-sm text-gray-600">{achievement.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Latest Measurements */}
            {progressEntries.length > 0 && progressEntries[progressEntries.length - 1].measurements && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Latest Measurements</h3>
                <div className="space-y-3">
                  {Object.entries(progressEntries[progressEntries.length - 1].measurements || {}).map(([key, value]) => (
                    value && (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600 capitalize">{key}:</span>
                        <span className="font-medium">{value}cm</span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Add Progress Entry Modal */}
        {showAddEntry && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-96 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Add Progress Entry</h3>
                  <button
                    onClick={() => setShowAddEntry(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-80">
                <div className="space-y-6">
                  {/* Weight and Body Fat */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Weight (kg) *
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={newEntry.weight}
                        onChange={(e) => setNewEntry({ ...newEntry, weight: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Enter weight"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Body Fat (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={newEntry.bodyFat}
                        onChange={(e) => setNewEntry({ ...newEntry, bodyFat: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Optional"
                      />
                    </div>
                  </div>

                  {/* Measurements */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Body Measurements (cm)</h4>
                    <div className="grid md:grid-cols-3 gap-4">
                      <input
                        type="number"
                        step="0.1"
                        value={newEntry.chest}
                        onChange={(e) => setNewEntry({ ...newEntry, chest: e.target.value })}
                        placeholder="Chest"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <input
                        type="number"
                        step="0.1"
                        value={newEntry.waist}
                        onChange={(e) => setNewEntry({ ...newEntry, waist: e.target.value })}
                        placeholder="Waist"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <input
                        type="number"
                        step="0.1"
                        value={newEntry.hips}
                        onChange={(e) => setNewEntry({ ...newEntry, hips: e.target.value })}
                        placeholder="Hips"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <input
                        type="number"
                        step="0.1"
                        value={newEntry.arms}
                        onChange={(e) => setNewEntry({ ...newEntry, arms: e.target.value })}
                        placeholder="Arms"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <input
                        type="number"
                        step="0.1"
                        value={newEntry.thighs}
                        onChange={(e) => setNewEntry({ ...newEntry, thighs: e.target.value })}
                        placeholder="Thighs"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                    <textarea
                      value={newEntry.notes}
                      onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      rows={3}
                      placeholder="How are you feeling? Any observations?"
                    />
                  </div>

                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={() => setShowAddEntry(false)}
                      className="px-4 py-2 text-gray-700 hover:text-gray-900"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={addProgressEntry}
                      disabled={!newEntry.weight}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add Entry
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Progress;
