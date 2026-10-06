import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Clock, Shield, TrendingUp, Users } from 'lucide-react';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-luxury-black text-white overflow-hidden">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center px-6 overflow-hidden">
        {/* Background Glow Effect */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-luxury-gold/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-luxury-gold/10 blur-[120px] rounded-full" />

        <div className="relative z-10 text-center max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-6xl md:text-8xl font-bold mb-6 tracking-tighter">
              Master Your <span className="text-luxury-gold">Time</span>, <br />
              Maximize Your <span className="text-luxury-gold">Earnings</span>.
            </h1>
            <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              The ultimate luxury time-management ecosystem for elite freelancers and managers.
              Track hours with precision and manage payments with elegance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="px-8 py-4 bg-luxury-gold text-luxury-black font-bold rounded-full hover:bg-luxury-goldLight transition-all duration-300 transform hover:scale-105 shadow-[0_0_20px_rgba(212,175,55,0.3)]">
                Get Started Now
              </Link>
              <Link to="/login" className="px-8 py-4 border border-luxury-gold text-luxury-gold font-bold rounded-full hover:bg-luxury-gold/10 transition-all duration-300">
                Client Login
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 bg-luxury-darkGray/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Engineered for <span className="text-luxury-gold">Excellence</span></h2>
            <p className="text-gray-400">Everything you need to scale your productivity and revenue.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: <Clock className="w-8 h-8" />, title: "Precision Tracking", desc: "Log your hours with surgical precision. Never miss a minute of billable work." },
              { icon: <TrendingUp className="w-8 h-8" />, title: "Earnings Insight", desc: "Real-time visual reports of your monthly growth and payment status." },
              { icon: <Users className="w-8 h-8" />, title: "Elite Groups", desc: "Join premium project groups and collaborate with high-tier managers." },
              { icon: <Shield className="w-8 h-8" />, title: "Secure Payments", desc: "Transparent payment tracking. Know exactly when and how you get paid." },
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -10 }}
                className="p-8 rounded-2xl bg-luxury-darkGray border border-white/5 hover:border-luxury-gold/50 transition-all duration-300 group"
              >
                <div className="text-luxury-gold mb-6 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-3xl mx-auto p-12 rounded-3xl bg-gradient-to-br from-luxury-gold/20 to-transparent border border-luxury-gold/30">
          <h2 className="text-4xl font-bold mb-6">Ready to Elevate Your Workflow?</h2>
          <p className="text-gray-300 mb-10">Join a community of high-performers who value their time and their worth.</p>
          <Link to="/register" className="px-10 py-4 bg-luxury-gold text-luxury-black font-bold rounded-full hover:bg-luxury-goldLight transition-all duration-300 transform hover:scale-105">
            Start Your Journey
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
