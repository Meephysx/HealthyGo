import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Heart, 
  Target, 
  TrendingUp, 
  Users, 
  CheckCircle,
  Star,
  Zap
} from 'lucide-react';

const LandingPage: React.FC = () => {
  const goals = [
    {
      id: 'weight-loss',
      title: 'Weight Loss',
      description: 'Lose weight healthily with personalized meal plans and workouts',
      icon: TrendingUp,
      gradient: 'from-blue-500 to-cyan-500',
      features: ['Calorie tracking', 'Fat-burning workouts', 'Progress monitoring']
    },
    {
      id: 'weight-gain',
      title: 'Weight Gain',
      description: 'Gain healthy weight with nutrient-rich foods and strength training',
      icon: Target,
      gradient: 'from-green-500 to-emerald-500',
      features: ['High-calorie meals', 'Strength building', 'Muscle development']
    },
    {
      id: 'muscle-gain',
      title: 'Muscle Gain',
      description: 'Build lean muscle with protein-rich diets and targeted exercises',
      icon: Zap,
      gradient: 'from-purple-500 to-pink-500',
      features: ['Protein optimization', 'Resistance training', 'Body composition']
    }
  ];

  const features = [
    {
      icon: Heart,
      title: 'Personalized Plans',
      description: 'Get custom meal and workout plans based on your goals and preferences'
    },
    {
      icon: Target,
      title: 'Goal Tracking',
      description: 'Track your progress with detailed analytics and visual reports'
    },
    {
      icon: Users,
      title: 'Expert Guidance',
      description: 'Access professional nutrition and fitness advice whenever you need it'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Lost 25 lbs',
      content: 'This app completely changed my relationship with food and exercise. The personalized approach made all the difference.',
      rating: 5
    },
    {
      name: 'Mike Chen',
      role: 'Gained 15 lbs muscle',
      content: 'Finally found a program that helped me gain healthy weight. The meal plans are amazing and easy to follow.',
      rating: 5
    },
    {
      name: 'Emily Davis',
      role: 'Improved fitness',
      content: 'Love how everything is tracked automatically. The workouts are challenging but achievable.',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-blue-50"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <Heart className="h-16 w-16 text-green-600" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Your Journey to a
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600"> Healthier You</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Transform your lifestyle with personalized nutrition and fitness plans. 
              Whether you want to lose weight, gain muscle, or improve your overall health, 
              we've got the perfect plan for you.
            </p>
            <Link
              to="/onboarding"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              Start Your Journey
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Goals Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Goal</h2>
            <p className="text-xl text-gray-600">Select what you want to achieve and we'll create a personalized plan for you</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {goals.map((goal) => (
              <Link
                key={goal.id}
                to="/onboarding"
                state={{ selectedGoal: goal.id }}
                className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${goal.gradient} opacity-5 group-hover:opacity-10 transition-opacity`}></div>
                <div className="relative p-8">
                  <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${goal.gradient} mb-4`}>
                    <goal.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{goal.title}</h3>
                  <p className="text-gray-600 mb-6">{goal.description}</p>
                  <ul className="space-y-2">
                    {goal.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-700">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 flex items-center text-green-600 font-semibold group-hover:text-green-700">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose HealthPlanner?</h2>
            <p className="text-xl text-gray-600">Everything you need to succeed in your health journey</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex p-4 rounded-full bg-green-100 mb-6">
                  <feature.icon className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Success Stories</h2>
            <p className="text-xl text-gray-600">Join thousands who have transformed their lives</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-8">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">"{testimonial.content}"</p>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-green-600 text-sm">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-green-600 to-blue-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Transform Your Life?</h2>
          <p className="text-xl text-green-100 mb-8">
            Join our community and start your personalized health journey today. It only takes 2 minutes to get started.
          </p>
          <Link
            to="/onboarding"
            className="inline-flex items-center px-8 py-4 bg-white text-green-600 font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            Start Free Today
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;