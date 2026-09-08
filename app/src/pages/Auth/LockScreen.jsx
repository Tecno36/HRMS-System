import React, { useState } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import axios from '../../services/axios';

export default function LockScreen({ onUnlock }) {
  const [mPin, setMpin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const user = JSON.parse(localStorage.getItem('user')) || { name: 'User', email: '', avatar: '' };

  const handleUnlock = async (e) => {
    e.preventDefault();
    if (mPin.length !== 4) {
      setError('Enter 4-digit mPIN');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/auth/login-mpin', {
        email: user.email,
        mPin: mPin,
        isBiometricLogin: false
      });

      if (response.data.status === 'success') {
        localStorage.setItem('token', response.data.token);
        onUnlock();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid mPIN');
      setMpin('');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <IonPage>
      <IonContent scrollY={false} className="ion-no-padding">
        <div className="h-full w-full bg-gradient-to-b from-[#5B3CD8] to-[#4A2EC6] flex flex-col items-center justify-center font-sans relative px-6">
          
          <div className="bg-white/10 w-24 h-24 rounded-full flex items-center justify-center mb-6 border-2 border-white/20 shadow-lg overflow-hidden">
            {user.avatar ? (
              <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-3xl font-bold">{user.name.charAt(0).toUpperCase()}</span>
            )}
          </div>

          <h2 className="text-white text-2xl font-bold mb-1">Welcome back, {user.name.split(' ')[0]}</h2>
          <p className="text-white/70 text-sm mb-10">Enter your mPIN to unlock</p>

          <form onSubmit={handleUnlock} className="w-full max-w-xs flex flex-col items-center">
            <input
              type="password"
              maxLength="4"
              value={mPin}
              onChange={(e) => setMpin(e.target.value.replace(/[^0-9]/g, ''))}
              className="w-full bg-white/20 border border-white/30 rounded-2xl py-4 text-center text-white text-3xl tracking-[1em] font-bold focus:outline-none focus:border-white focus:bg-white/30 transition-all placeholder:text-white/30 placeholder:tracking-normal placeholder:text-lg"
              placeholder="Enter PIN"
              autoFocus
            />

            {error && <p className="text-red-300 text-sm mt-3 font-medium">{error}</p>}

            <button
              type="submit"
              disabled={loading || mPin.length !== 4}
              className={`w-full py-4 mt-8 rounded-2xl font-bold text-[15px] transition-all ${mPin.length === 4 ? 'bg-white text-[#5B3CD8] shadow-[0_8px_20px_rgba(0,0,0,0.2)] active:scale-95' : 'bg-white/20 text-white/50 cursor-not-allowed'}`}
            >
              {loading ? 'Unlocking...' : 'Unlock App'}
            </button>
          </form>

          <button 
            onClick={handleLogout}
            className="absolute bottom-10 text-white/60 text-sm font-medium active:text-white transition-colors"
          >
            Not {user.name.split(' ')[0]}? Log out
          </button>

        </div>
      </IonContent>
    </IonPage>
  );
}