import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, Mail, Bell, Newspaper, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function Subscribe() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [preferences, setPreferences] = useState({
    breakingNews: true,
    dailyDigest: true,
    weeklyRoundup: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubscribed(true);
    }
  };

  const benefits = [
    { icon: Bell, title: 'Breaking News Alerts', description: 'Get instant notifications for major stories' },
    { icon: Newspaper, title: 'Daily Digest', description: 'Morning roundup of top headlines' },
    { icon: Gift, title: 'Exclusive Content', description: 'Access to subscriber-only articles' },
  ];

  return (
    <div className="py-6 sm:py-8 lg:py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back Button */}
        <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-[#e53935] transition-colors mb-6 sm:mb-8">
          <ArrowLeft size={18} />
          <span className="text-sm">Back to Home</span>
        </Link>

        {isSubscribed ? (
          // Success State
          <div className="text-center py-8 sm:py-12">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <Check size={32} className="text-green-600" />
            </div>
            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1a1a1a] mb-3 sm:mb-4">
              Welcome to FMN News!
            </h1>
            <p className="text-gray-600 text-sm sm:text-base mb-6 sm:mb-8 max-w-md mx-auto">
              Thank you for subscribing. You'll start receiving our newsletters at <strong>{email}</strong> soon.
            </p>
            <Link to="/">
              <Button className="bg-[#e53935] hover:bg-[#c62828] text-white text-sm">
                Back to Homepage
              </Button>
            </Link>
          </div>
        ) : (
          // Subscription Form
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Left Side - Benefits */}
            <div>
              <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1a1a1a] mb-3 sm:mb-4">
                Subscribe to FMN News
              </h1>
              <p className="text-gray-600 text-sm sm:text-base mb-6 sm:mb-8">
                Join over 100,000 subscribers who get the latest news delivered to their inbox.
              </p>

              <div className="space-y-4 sm:space-y-6">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-50 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
                      <benefit.icon size={18} className="text-[#e53935]" />
                    </div>
                    <div>
                      <h3 className="font-accent font-semibold text-sm sm:text-base text-[#1a1a1a]">
                        {benefit.title}
                      </h3>
                      <p className="text-gray-500 text-xs sm:text-sm">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side - Form */}
            <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-5 sm:p-8">
              <h2 className="font-display text-lg sm:text-xl font-bold text-[#1a1a1a] mb-4 sm:mb-6">
                Create Your Account
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Full Name
                  </label>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="pl-10 text-sm"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                    Email Preferences
                  </label>
                  <div className="space-y-2 sm:space-y-3">
                    {Object.entries(preferences).map(([key, value]) => (
                      <label key={key} className="flex items-center gap-2 sm:gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => setPreferences(prev => ({ ...prev, [key]: e.target.checked }))}
                          className="w-4 h-4 text-[#e53935] rounded focus:ring-[#e53935]"
                        />
                        <span className="text-xs sm:text-sm text-gray-700 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#e53935] hover:bg-[#c62828] text-white h-11 sm:h-12 text-sm"
                >
                  Subscribe Now
                </Button>

                <p className="text-[10px] sm:text-xs text-gray-500 text-center">
                  By subscribing, you agree to our Privacy Policy and Terms of Service.
                  You can unsubscribe at any time.
                </p>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
