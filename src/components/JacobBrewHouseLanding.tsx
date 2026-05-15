import React from 'react';
import { motion } from 'motion/react';
import { Coffee, Flame, Leaf, Music, Camera, Star, ChevronDown, MapPin, Clock, Phone } from 'lucide-react';

interface JacobBrewHouseLandingProps {
  onEnterMenu: () => void;
}

export const JacobBrewHouseLanding: React.FC<JacobBrewHouseLandingProps> = ({ onEnterMenu }) => {
  return (
    <div className="min-h-screen bg-[#0C0F0A] text-[#F5F0E8] overflow-hidden relative">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] bg-[#1B4332]/30 rounded-full mix-blend-screen filter blur-[140px] animate-blob" />
        <div className="absolute bottom-[-10%] right-[-15%] w-[50%] h-[50%] bg-[#B45309]/15 rounded-full mix-blend-screen filter blur-[140px] animate-blob animation-delay-2000" />
        <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] bg-[#7C2D12]/10 rounded-full mix-blend-screen filter blur-[120px] animate-blob animation-delay-4000" />
        {/* Noise texture overlay */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.07] mix-blend-overlay" />
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(90deg,rgba(245,240,232,0.1)_1px,transparent_1px),linear-gradient(0deg,rgba(245,240,232,0.1)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      <div className="relative z-10">
        {/* Nav Bar */}
        <motion.nav
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex items-center justify-between px-6 py-5"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#2D6A4F] flex items-center justify-center">
              <span className="text-[#F5F0E8] font-serif text-sm font-bold">J</span>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#F5F0E8]/50">Est. 2024</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-[#F5F0E8]/40">
            <MapPin className="w-3 h-3" />
            Jaipur
          </div>
        </motion.nav>

        {/* Hero Section */}
        <section className="min-h-[85vh] flex flex-col items-center justify-center px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="space-y-8 max-w-3xl"
          >
            {/* Badge */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#2D6A4F]/20 border border-[#2D6A4F]/30 text-[#52B788] text-xs font-mono tracking-[0.3em] uppercase"
            >
              <Coffee className="w-3.5 h-3.5" />
              Premium European Café
            </motion.div>

            {/* Title */}
            <div className="space-y-2">
              <h1 className="text-6xl md:text-8xl lg:text-9xl font-serif italic leading-[0.9] tracking-tight">
                <span className="text-[#F5F0E8]">Jacob's</span>
                <br />
                <span className="text-[#52B788]">Brew</span>{' '}
                <span className="text-[#D4A373]">House</span>
              </h1>
            </div>

            {/* Tagline */}
            <p className="text-[#F5F0E8]/50 text-lg md:text-xl font-light max-w-lg mx-auto leading-relaxed">
              Where European sophistication meets Indian warmth. Every detail crafted to create moments worth savoring.
            </p>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            >
              <button
                onClick={onEnterMenu}
                className="group px-10 py-4 bg-[#2D6A4F] hover:bg-[#40916C] text-[#F5F0E8] rounded-2xl font-semibold tracking-wide transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(45,106,79,0.35)] flex items-center gap-3"
              >
                <Flame className="w-5 h-5 text-[#D4A373] group-hover:animate-pulse" />
                Explore AR Menu
              </button>
              <a
                href="tel:+917229966700"
                className="px-10 py-4 border border-[#F5F0E8]/15 hover:border-[#52B788]/40 text-[#F5F0E8]/70 hover:text-[#52B788] rounded-2xl font-semibold tracking-wide transition-all duration-500 hover:-translate-y-1 flex items-center gap-3"
              >
                <Phone className="w-4 h-4" />
                Reserve a Table
              </a>
            </motion.div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="absolute bottom-8 flex flex-col items-center gap-2"
          >
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#F5F0E8]/30">Scroll</span>
            <ChevronDown className="w-4 h-4 text-[#52B788]/50 animate-bounce" />
          </motion.div>
        </section>

        {/* Spaces Section */}
        <section className="px-6 py-20">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-5xl mx-auto"
          >
            <div className="flex items-center gap-4 mb-12">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#2D6A4F]/30" />
              <h2 className="text-xs font-mono uppercase tracking-[0.4em] text-[#52B788]/60">Experience Our Spaces</h2>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#2D6A4F]/30" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: <Flame className="w-5 h-5" />, title: 'The Main Hall', desc: 'Double-height dining with industrial charm & green steel beams', color: '#2D6A4F' },
                { icon: <Music className="w-5 h-5" />, title: 'Swing Lounge', desc: 'Playful suspended seating for a one-of-a-kind experience', color: '#D4A373' },
                { icon: <Leaf className="w-5 h-5" />, title: 'Garden Terrace', desc: 'Al fresco dining surrounded by lush tropical greenery', color: '#52B788' },
                { icon: <Camera className="w-5 h-5" />, title: 'Photo Booth', desc: 'Vintage-inspired corner to capture your best moments', color: '#B45309' },
              ].map((space, i) => (
                <motion.div
                  key={space.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.6 }}
                  className="group p-6 rounded-[1.5rem] border border-[#F5F0E8]/8 bg-[#F5F0E8]/[0.03] hover:bg-[#F5F0E8]/[0.06] backdrop-blur-xl transition-all duration-500 hover:-translate-y-1"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${space.color}20`, color: space.color }}
                  >
                    {space.icon}
                  </div>
                  <h3 className="text-base font-semibold mb-2 text-[#F5F0E8]/90">{space.title}</h3>
                  <p className="text-xs text-[#F5F0E8]/40 leading-relaxed">{space.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Signature Offerings */}
        <section className="px-6 py-16">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="max-w-5xl mx-auto"
          >
            <div className="flex items-center gap-4 mb-12">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#D4A373]/30" />
              <h2 className="text-xs font-mono uppercase tracking-[0.4em] text-[#D4A373]/60">Crafted with Passion</h2>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#D4A373]/30" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { emoji: '🍕', title: 'Wood-Fired Pizzas', desc: 'San Marzano tomatoes, hand-stretched dough, locally sourced toppings', quote: '"The best pizza I\'ve had outside of Naples."', author: 'Rahul D.' },
                { emoji: '☕', title: 'Specialty Coffee', desc: 'Single-origin beans, pour-over precision, and latte art perfection', quote: '"Rivals the best cafés in Melbourne."', author: 'Karan J.' },
                { emoji: '🍢', title: 'Gourmet Skewers', desc: 'Tender cuts grilled over open flame with signature herb glaze', quote: '"Perfectly charred, incredibly flavourful."', author: 'Sneha T.' },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.6 }}
                  className="relative p-8 rounded-[2rem] border border-[#F5F0E8]/8 bg-gradient-to-b from-[#F5F0E8]/[0.04] to-transparent overflow-hidden group hover:border-[#2D6A4F]/30 transition-all duration-500"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#2D6A4F]/5 rounded-full blur-[60px] group-hover:bg-[#2D6A4F]/10 transition-all duration-700" />
                  <span className="text-4xl mb-4 block">{item.emoji}</span>
                  <h3 className="text-xl font-serif italic text-[#F5F0E8] mb-3">{item.title}</h3>
                  <p className="text-sm text-[#F5F0E8]/40 leading-relaxed mb-6">{item.desc}</p>
                  <div className="pt-4 border-t border-[#F5F0E8]/8">
                    <p className="text-xs italic text-[#D4A373]/70 mb-1">{item.quote}</p>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-[#F5F0E8]/30">{item.author}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Testimonial */}
        <section className="px-6 py-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto text-center space-y-6"
          >
            <div className="flex justify-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-[#D4A373] text-[#D4A373]" />
              ))}
            </div>
            <blockquote className="text-xl md:text-2xl font-serif italic text-[#F5F0E8]/80 leading-relaxed">
              "Jacob's Brew House transformed our idea of what a café could be. The atmosphere, the food, the coffee — everything is impeccable."
            </blockquote>
            <p className="text-sm font-mono text-[#52B788]/60 uppercase tracking-widest">Priya M. — Food Blogger</p>
          </motion.div>
        </section>

        {/* Final CTA */}
        <section className="px-6 py-20">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="max-w-xl mx-auto text-center space-y-8"
          >
            <h2 className="text-3xl md:text-4xl font-serif italic text-[#F5F0E8]">
              Ready to experience<br /><span className="text-[#52B788]">Jacob's Brew House?</span>
            </h2>
            <button
              onClick={onEnterMenu}
              className="px-12 py-5 bg-gradient-to-r from-[#2D6A4F] to-[#40916C] text-[#F5F0E8] rounded-2xl font-semibold text-lg tracking-wide transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_25px_70px_rgba(45,106,79,0.4)]"
            >
              View AR Menu →
            </button>
            <p className="text-[#F5F0E8]/30 text-sm">Or just walk in — we love surprises</p>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="px-6 py-12 border-t border-[#F5F0E8]/8">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div>
                <h3 className="font-serif italic text-xl text-[#F5F0E8] mb-3">Jacob's Brew House</h3>
                <p className="text-xs text-[#F5F0E8]/40 leading-relaxed">A modern European café experience crafted with passion and precision.</p>
              </div>
              <div>
                <h4 className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#52B788]/60 mb-3">Visit Us</h4>
                <p className="text-sm text-[#F5F0E8]/50 leading-relaxed">Plot No 7, JLN Marg<br />Opp. Clarks Amer Hotel<br />Malviya Nagar, Jaipur</p>
              </div>
              <div>
                <h4 className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#52B788]/60 mb-3">Hours & Contact</h4>
                <div className="space-y-2 text-sm text-[#F5F0E8]/50">
                  <p className="flex items-center gap-2"><Clock className="w-3 h-3" /> Mon – Sun, 8AM – 11PM</p>
                  <p className="flex items-center gap-2"><Phone className="w-3 h-3" /> +91 7229966700</p>
                </div>
              </div>
            </div>
            <div className="pt-6 border-t border-[#F5F0E8]/5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-[10px] font-mono text-[#F5F0E8]/25 uppercase tracking-widest">Powered by AugmenTable AR Engine</p>
              <p className="text-[10px] font-mono text-[#F5F0E8]/25">© 2026 Jacob's Brew House</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
