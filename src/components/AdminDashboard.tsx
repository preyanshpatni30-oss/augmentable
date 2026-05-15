import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc } from 'firebase/firestore';
import { QRCodeSVG } from 'qrcode.react';
import { cafes } from '../data';
import { Utensils, Users, Clock, CheckCircle2, QrCode, Printer } from 'lucide-react';

interface AdminDashboardProps {
  cafeId: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ cafeId }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'qrcodes'>('orders');
  const [tableCount, setTableCount] = useState(10);
  const cafe = cafes[cafeId];

  useEffect(() => {
    if (!cafeId) return;

    const q = query(
      collection(db, 'orders'),
      where('cafeId', '==', cafeId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newOrders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(newOrders);
    }, (error) => {
      console.error("Error fetching orders:", error);
    });

    return () => unsubscribe();
  }, [cafeId]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus
      });
    } catch (error) {
      console.error("Error updating order:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-500/20 text-amber-500 border-amber-500/30';
      case 'preparing': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'completed': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      default: return 'bg-white/10 text-white/60 border-white/10';
    }
  };

  if (!cafe) return <div className="p-8 text-white">Cafe not found</div>;

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 md:p-12 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-white/10">
          <div>
            <h1 className="text-3xl font-serif text-amber-500 italic mb-1">{cafe.name} Dashboard</h1>
            <p className="text-white/50 font-mono text-sm tracking-widest uppercase">Restaurant Management</p>
          </div>
          <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
            <button 
              onClick={() => setActiveTab('orders')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'orders' ? 'bg-amber-500 text-black' : 'text-white/60 hover:text-white'}`}
            >
              Live Orders
            </button>
            <button 
              onClick={() => setActiveTab('qrcodes')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'qrcodes' ? 'bg-amber-500 text-black' : 'text-white/60 hover:text-white'}`}
            >
              Table QR Codes
            </button>
          </div>
        </header>

        {/* Google Sheets Integration Notice */}
        <div className={`border rounded-2xl p-4 flex items-center justify-between ${import.meta.env.VITE_GOOGLE_SHEETS_WEBHOOK_URL ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
          <div>
            <h3 className={`font-medium mb-1 ${import.meta.env.VITE_GOOGLE_SHEETS_WEBHOOK_URL ? 'text-emerald-400' : 'text-red-400'}`}>
              {import.meta.env.VITE_GOOGLE_SHEETS_WEBHOOK_URL ? 'Google Sheets Integration Active' : 'Google Sheets Integration Missing'}
            </h3>
            <p className="text-white/60 text-sm">
              {import.meta.env.VITE_GOOGLE_SHEETS_WEBHOOK_URL 
                ? 'Orders are automatically synced to your Google Sheet.' 
                : 'Please add VITE_GOOGLE_SHEETS_WEBHOOK_URL to your AI Studio Secrets to enable Google Sheets sync.'}
            </p>
          </div>
        </div>

        {activeTab === 'orders' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pending & Preparing Orders */}
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-xl font-medium flex items-center gap-2">
                <Utensils className="w-5 h-5 text-amber-500" />
                Active Orders
              </h2>
              
              {orders.filter(o => o.status !== 'completed').length === 0 ? (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center text-white/40">
                  No active orders right now.
                </div>
              ) : (
                <div className="grid gap-4">
                  {orders.filter(o => o.status !== 'completed').map(order => (
                    <div key={order.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden">
                      <div className={`absolute top-0 left-0 w-1 h-full ${order.status === 'pending' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                      
                      <div className="flex flex-col md:flex-row justify-between gap-6">
                        <div className="space-y-4 flex-1">
                          <div className="flex items-center gap-4">
                            <div className="bg-white/10 px-4 py-2 rounded-xl">
                              <span className="text-xs text-white/50 uppercase block mb-1">Table</span>
                              <span className="text-2xl font-mono font-bold text-amber-500">{order.tableNumber}</span>
                            </div>
                            <div>
                              <h3 className="text-lg font-medium">{order.customerName}</h3>
                              <div className="flex items-center gap-3 text-sm text-white/50 mt-1">
                                <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {order.numberOfCustomers}</span>
                                <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {order.createdAt?.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-black/40 rounded-xl p-4">
                            <ul className="space-y-2">
                              {order.items.map((item: any, i: number) => (
                                <li key={i} className="flex justify-between items-center text-sm">
                                  <span className="flex items-center gap-2">
                                    <span className="bg-white/10 text-white/70 w-6 h-6 rounded flex items-center justify-center font-mono text-xs">{item.quantity}x</span>
                                    {item.name}
                                  </span>
                                  <span className="font-mono text-white/50">₹{(item.price * item.quantity).toFixed(2)}</span>
                                </li>
                              ))}
                            </ul>
                            <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                              <span className="text-sm text-white/50 uppercase tracking-wider">Total</span>
                              <span className="text-lg font-mono text-amber-500">₹{order.totalAmount.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-3 justify-center min-w-[140px]">
                          <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border text-center ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                          
                          {order.status === 'pending' && (
                            <button 
                              onClick={() => updateOrderStatus(order.id, 'preparing')}
                              className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/50 py-2 px-4 rounded-xl text-sm font-medium transition-colors"
                            >
                              Start Preparing
                            </button>
                          )}
                          
                          {order.status === 'preparing' && (
                            <button 
                              onClick={() => updateOrderStatus(order.id, 'completed')}
                              className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/50 py-2 px-4 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                            >
                              <CheckCircle2 className="w-4 h-4" /> Serve
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Completed Orders */}
            <div className="space-y-6">
              <h2 className="text-xl font-medium flex items-center gap-2 text-white/60">
                <CheckCircle2 className="w-5 h-5" />
                Completed Today
              </h2>
              
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                {orders.filter(o => o.status === 'completed').length === 0 ? (
                  <p className="text-center text-white/30 py-8 text-sm">No completed orders yet.</p>
                ) : (
                  orders.filter(o => o.status === 'completed').map(order => (
                    <div key={order.id} className="bg-black/40 rounded-xl p-4 border border-white/5">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-amber-500 font-mono text-sm mr-2">T{order.tableNumber}</span>
                          <span className="text-white/80 text-sm">{order.customerName}</span>
                        </div>
                        <span className="text-white/40 text-xs">{order.createdAt?.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                      <div className="text-xs text-white/50">
                        {order.items.map((i:any) => `${i.quantity}x ${i.name}`).join(', ')}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'qrcodes' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl p-6">
              <div>
                <h2 className="text-xl font-medium mb-1">Generate Table QR Codes</h2>
                <p className="text-white/50 text-sm">Print these and place them on your tables. Customers scan them to view the AR menu and order directly.</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-xl border border-white/10">
                  <span className="text-sm text-white/60">Tables:</span>
                  <input 
                    type="number" 
                    min="1" 
                    max="100" 
                    value={tableCount}
                    onChange={(e) => setTableCount(parseInt(e.target.value) || 1)}
                    className="bg-transparent w-12 text-center font-mono text-amber-500 focus:outline-none"
                  />
                </div>
                <button 
                  onClick={() => window.print()}
                  className="bg-amber-500 text-black px-4 py-2 rounded-xl font-medium flex items-center gap-2 hover:bg-amber-400 transition-colors"
                >
                  <Printer className="w-4 h-4" /> Print All
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {Array.from({ length: tableCount }).map((_, i) => {
                const tableNum = i + 1;
                // Construct the URL that the QR code will point to
                const baseUrl = window.location.origin;
                const qrUrl = `${baseUrl}/?cafe=${cafeId}&table=${tableNum}`;

                return (
                  <div key={tableNum} className="bg-white border-2 border-dashed border-neutral-300 rounded-2xl p-6 flex flex-col items-center text-center text-black print:break-inside-avoid">
                    <h3 className="font-serif text-xl mb-1">{cafe.name}</h3>
                    <p className="text-xs text-neutral-500 uppercase tracking-widest mb-4">Scan to Order in AR</p>
                    
                    <div className="bg-white p-2 rounded-xl shadow-sm mb-4">
                      <QRCodeSVG value={qrUrl} size={120} level="H" />
                    </div>
                    
                    <div className="bg-black text-white px-4 py-1.5 rounded-full font-mono text-sm font-bold">
                      TABLE {tableNum}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
