export const calculateBMI = (weight: number, height: number): number => {
  // weight in kg, height in cm
  const heightInMeters = height / 100;
  return Number((weight / (heightInMeters * heightInMeters)).toFixed(1));
};

export const calculateIdealWeight = (height: number, gender: 'male' | 'female'): number => {
  // Using Devine formula
  const heightInInches = height / 2.54;
  const baseWeight = gender === 'male' ? 50 : 45.5;
  const multiplier = gender === 'male' ? 2.3 : 2.3;
  const additionalHeight = Math.max(0, heightInInches - 60);
  
  return Number((baseWeight + (multiplier * additionalHeight)).toFixed(1));
};

export const calculateDailyCalories = (
  weight: number,
  height: number,
  age: number,
  gender: 'male' | 'female',
  activityLevel: string,
  goal: string
): number => {
  // Using Mifflin-St Jeor Equation
  const bmr = gender === 'male'
    ? (10 * weight) + (6.25 * height) - (5 * age) + 5
    : (10 * weight) + (6.25 * height) - (5 * age) - 161;

  const activityMultipliers = {
    'sedentary': 1.2,
    'light': 1.375,
    'moderate': 1.55,
    'active': 1.725,
    'very-active': 1.9
  };

  const tdee = bmr * activityMultipliers[activityLevel as keyof typeof activityMultipliers];

  // Adjust based on goal
  const goalAdjustments = {
    'weight-loss': -500, // 1 lb per week
    'weight-gain': 500,  // 1 lb per week
    'muscle-gain': 300   // Lean gain
  };

  return Math.round(tdee + goalAdjustments[goal as keyof typeof goalAdjustments]);
};

export const getBMICategory = (bmi: number): { category: string; color: string } => {
  if (bmi < 18.5) return { category: 'Underweight', color: 'text-blue-600' };
  if (bmi < 25) return { category: 'Normal weight', color: 'text-green-600' };
  if (bmi < 30) return { category: 'Overweight', color: 'text-yellow-600' };
  return { category: 'Obese', color: 'text-red-600' };
};

export const calculateMacroTargets = (calories: number, goal: string) => {
  const macroRatios = {
    'weight-loss': { protein: 0.35, carbs: 0.35, fat: 0.30 },
    'weight-gain': { protein: 0.25, carbs: 0.45, fat: 0.30 },
    'muscle-gain': { protein: 0.30, carbs: 0.40, fat: 0.30 }
  };

  const ratios = macroRatios[goal as keyof typeof macroRatios];
  
  return {
    protein: Math.round((calories * ratios.protein) / 4), // 4 cal per gram
    carbs: Math.round((calories * ratios.carbs) / 4),     // 4 cal per gram
    fat: Math.round((calories * ratios.fat) / 9)          // 9 cal per gram
  };
};