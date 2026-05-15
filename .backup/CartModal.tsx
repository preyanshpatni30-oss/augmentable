import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, X, Plus, Minus, Loader2, CheckCircle2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface CartModalProps {
  cafeId: string;
  tableNumber: string;
}

export const CartModal: React.FC<CartModalProps> = ({ cafeId, tableNumber }) => {
  const { items, addToCart, removeFromCart, total, clearCart } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [numberOfCustomers, setNumberOfCustomers] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || items.length === 0) return;

    setIsSubmitting(true);
    try {
      const orderData = {
        cafeId,
        tableNumber: tableNumber || 'Unknown',
        customerName: customerName.trim(),
        numberOfCustomers,
        items: items.map(item => ({
          dishId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        totalAmount: total,
        status: 'pending',
        createdAt: serverTimestamp()
      };

      // 1. Save to Firebase (Optional, but good for backup/QR dashboard)
      await addDoc(collection(db, 'orders'), orderData);
      
      // 2. Send to Google Sheets Webhook
      const webhookUrl = import.meta.env.VITE_GOOGLE_SHEETS_WEBHOOK_URL;
      console.log("Webhook URL configured:", !!webhookUrl); // Debug log
      
      if (webhookUrl) {
        try {
          const itemsString = items.map(i => `${i.quantity}x ${i.name}`).join(', ');
          
          // Using a GET request with query parameters completely bypasses CORS preflight issues
          const url = new URL(webhookUrl);
          url.searchParams.append('action', 'order');
          url.searchParams.append('cafeId', cafeId);
          url.searchParams.append('tableNumber', tableNumber || 'Unknown');
          url.searchParams.append('customerName', customerName.trim());
          url.searchParams.append('numberOfCustomers', numberOfCustomers.toString());
          url.searchParams.append('itemsString', itemsString);
          url.searchParams.append('totalAmount', total.toString());
          
          await fetch(url.toString(), {
            method: 'GET',
            mode: 'no-cors', 
          });
          console.log("Order sent to Google Sheets webhook via GET");
        } catch (sheetError) {
          console.error("Failed to send to Google Sheets:", sheetError);
        }
      } else {
        console.warn("VITE_GOOGLE_SHEETS_WEBHOOK_URL is not set in environment variables.");
      }
      
      setIsSuccess(true);
      clearCart();
      setTimeout(() => {
        setIsSuccess(false);
        setIsOpen(false);
      }, 3000);
    } catch (error) {
      console.error("Error placing order:", error);
      alert("There was an error placing your order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (totalItems === 0 && !isOpen) return null;

  return (
    <>
      {/* Floating Cart Button */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-amber-500 text-black p-4 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.4)] flex items-center justify-center hover:scale-105 transition-transform"
        >
          <ShoppingBag className="w-6 h-6" />
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-2 bg-white text-black text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-amber-500">
              {totalItems}
            </span>
          )}
        </motion.button>
      )}

      {/* Cart Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              className="relative w-full max-w-md bg-neutral-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between shrink-0">
                <h2 className="text-2xl font-serif text-amber-500 italic">Your Order</h2>
                <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {isSuccess ? (
                <div className="p-12 flex flex-col items-center justify-center text-center">
                  <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4" />
                  <h3 className="text-xl font-medium text-white mb-2">Order Placed!</h3>
                  <p className="text-white/60">The kitchen has received your order and will start preparing it shortly.</p>
                </div>
              ) : items.length === 0 ? (
                <div className="p-12 text-center text-white/50">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>Your cart is empty.</p>
                </div>
              ) : (
                <>
                  <div className="p-6 overflow-y-auto flex-1 space-y-4">
                    {items.map(item => (
                      <div key={item.id} className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/5">
                        <div className="flex-1">
                          <h4 className="text-white font-medium">{item.name}</h4>
                          <p className="text-amber-500 font-mono text-sm">₹{(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-3 bg-black/40 rounded-lg p-1">
                          <button onClick={() => removeFromCart(item.id)} className="p-1 text-white/70 hover:text-white">
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-4 text-center text-sm font-medium">{item.quantity}</span>
                          <button onClick={() => addToCart(item)} className="p-1 text-white/70 hover:text-white">
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-6 border-t border-white/10 bg-black/20 shrink-0">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-white/60">Total Amount</span>
                        <span className="text-2xl font-mono text-amber-500">₹{total.toFixed(2)}</span>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-white/60 mb-1 uppercase tracking-wider">Your Name</label>
                          <input 
                            type="text" 
                            required
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500 transition-colors"
                            placeholder="John Doe"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-white/60 mb-1 uppercase tracking-wider">Number of People</label>
                          <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl px-4 py-2">
                            <button type="button" onClick={() => setNumberOfCustomers(Math.max(1, numberOfCustomers - 1))} className="p-2 text-white/50 hover:text-white">
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="flex-1 text-center font-medium">{numberOfCustomers}</span>
                            <button type="button" onClick={() => setNumberOfCustomers(numberOfCustomers + 1)} className="p-2 text-white/50 hover:text-white">
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <button 
                        type="submit" 
                        disabled={isSubmitting || !customerName.trim()}
                        className="w-full mt-4 bg-amber-500 text-black font-medium py-4 rounded-xl hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Placing Order...
                          </>
                        ) : (
                          `Place Order for Table ${tableNumber || '?'}`
                        )}
                      </button>
                    </form>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
