import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check, Clock, Phone, MessageSquare, Globe, ShieldCheck } from 'lucide-react';

export default function SuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { duration = 'Daily', voice = 4, sms = 7, data = 1.7, price = '0.21' } = location.state || {};

  const styles = {
    appContainer: { width: '100%', maxWidth: '480px', margin: '0 auto', backgroundColor: '#f8f9fc', minHeight: '100vh', position: 'relative', boxShadow: '0 0 30px rgba(0,0,0,0.1)', overflowX: 'hidden', fontFamily: "'Inter', sans-serif" } as React.CSSProperties,
    header: { background: 'linear-gradient(135deg, #0b40c4 0%, #1e5ce6 100%)', padding: '20px 20px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as React.CSSProperties,
    brandLogos: { display: 'flex', alignItems: 'center', gap: '8px' } as React.CSSProperties,
    logoEconet: { background: 'white', color: '#0b40c4', padding: '4px 8px', borderRadius: '6px', fontWeight: 800, fontSize: '12px', fontStyle: 'italic' } as React.CSSProperties,
    logoEconetSpan: { fontSize: '7px', fontWeight: 500, display: 'block' } as React.CSSProperties,
    logoEcocash: { color: '#e53935', fontWeight: 800, fontSize: '14px', background: 'white', padding: '4px 8px', borderRadius: '6px' } as React.CSSProperties,
    receivedBadge: { background: 'rgba(0, 200, 83, 0.2)', color: '#69f0ae', padding: '6px 12px', borderRadius: '16px', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid rgba(105, 240, 174, 0.3)' } as React.CSSProperties,
    heroSection: { background: 'linear-gradient(135deg, #0b40c4 0%, #0f766e 100%)', padding: '0 20px 30px', color: 'white', borderBottomLeftRadius: '20px', borderBottomRightRadius: '20px' } as React.CSSProperties,
    heroLabel: { fontSize: '11px', opacity: 0.8, letterSpacing: '0.5px', marginBottom: '4px', marginTop: '10px' } as React.CSSProperties,
    heroPrice: { fontSize: '46px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'baseline', gap: '6px' } as React.CSSProperties,
    heroPriceSpan: { fontSize: '16px', fontWeight: 500, opacity: 0.9 } as React.CSSProperties,
    statusRow: { display: 'flex', alignItems: 'center', gap: '12px', marginTop: '24px' } as React.CSSProperties,
    checkCircle: { width: '40px', height: '40px', borderRadius: '50%', background: '#0d9488', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #14b8a6' } as React.CSSProperties,
    statusText: { display: 'flex', flexDirection: 'column' } as React.CSSProperties,
    statusTitle: { fontSize: '16px', fontWeight: 700, margin: 0 } as React.CSSProperties,
    statusSub: { fontSize: '13px', opacity: 0.8, margin: 0 } as React.CSSProperties,
    content: { padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' } as React.CSSProperties,
    card: { background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', position: 'relative', overflow: 'hidden' } as React.CSSProperties,
    cardHeaderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' } as React.CSSProperties,
    cardH3: { fontSize: '18px', color: '#1a1a1a', margin: 0, fontWeight: 700 } as React.CSSProperties,
    cardSubtitle: { fontSize: '13px', color: '#888', margin: '4px 0 20px 0' } as React.CSSProperties,
    confirmedBadge: { background: '#e8f5e9', color: '#00c853', padding: '4px 10px', borderRadius: '12px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px' } as React.CSSProperties,
    listItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #f0f0f0' } as React.CSSProperties,
    listItemLeft: { display: 'flex', alignItems: 'center', gap: '12px' } as React.CSSProperties,
    iconWrapper: { width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fc', color: '#888' } as React.CSSProperties,
    itemLabel: { fontSize: '14px', color: '#666', fontWeight: 500 } as React.CSSProperties,
    itemValue: { fontSize: '15px', color: '#1a1a1a', fontWeight: 600 } as React.CSSProperties,
    totalSection: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: '#f0f5ff', margin: '20px -20px -20px -20px' } as React.CSSProperties,
    totalLabel: { fontSize: '15px', color: '#1e5ce6', fontWeight: 700, margin: 0 } as React.CSSProperties,
    totalAmount: { fontSize: '24px', color: '#0b40c4', fontWeight: 800, margin: 0 } as React.CSSProperties,
    infoBox: { background: 'white', borderRadius: '16px', padding: '20px', fontSize: '14px', color: '#666', lineHeight: 1.6, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' } as React.CSSProperties,
    footer: { marginTop: '10px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '12px' } as React.CSSProperties,
    securityBadges: { display: 'flex', justifyContent: 'center', gap: '16px', fontSize: '10px', color: '#00c853', fontWeight: 600 } as React.CSSProperties,
    securityBadgeSpan: { display: 'flex', alignItems: 'center', gap: '4px' } as React.CSSProperties,
    poweredBy: { fontSize: '10px', color: '#aaa', fontWeight: 500, letterSpacing: '0.5px' } as React.CSSProperties,
    homeButton: { marginTop: '10px', background: 'transparent', border: 'none', color: '#1e5ce6', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', fontSize: '14px' } as React.CSSProperties
  };

  return (
    <div style={styles.appContainer}>
      <div style={styles.header}>
        <div style={styles.brandLogos}>
          <div style={styles.logoEconet}>ECONET <span style={styles.logoEconetSpan}>Wireless</span></div>
          <div style={styles.logoEcocash}>EcoCash</div>
        </div>
        <div style={styles.receivedBadge}>Received <Check size={14} strokeWidth={3} /></div>
      </div>

      <div style={styles.heroSection}>
        <p style={styles.heroLabel}>BUNDLE AMOUNT</p>
        <h1 style={styles.heroPrice}><span style={styles.heroPriceSpan}>USD</span> {price}</h1>
        <div style={styles.statusRow}>
          <div style={styles.checkCircle}><Check size={20} color="#ccfbf1" strokeWidth={3} /></div>
          <div style={styles.statusText}>
            <p style={styles.statusTitle}>Bundle Request Received</p>
            <p style={styles.statusSub}>Activating your bundle shortly</p>
          </div>
        </div>
      </div>

      <div style={styles.content}>
        <div style={styles.card}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #e53935, #1e5ce6)' }}></div>
          <div style={styles.cardHeaderRow}>
            <div>
              <h3 style={styles.cardH3}>Bundle Configuration</h3>
              <p style={styles.cardSubtitle}>Your selected mix bundle</p>
            </div>
            <span style={styles.confirmedBadge}>CONFIRMED</span>
          </div>

          <div style={styles.listItem}>
            <div style={styles.listItemLeft}>
              <div style={styles.iconWrapper}><Clock size={16} /></div>
              <span style={styles.itemLabel}>Duration</span>
            </div>
            <span style={styles.itemValue}>{duration}</span>
          </div>
          <div style={styles.listItem}>
            <div style={styles.listItemLeft}>
              <div style={{ ...styles.iconWrapper, background: '#ffe5e5', color: '#ff4b4b' }}><Phone size={16} /></div>
              <span style={styles.itemLabel}>Voice</span>
            </div>
            <span style={styles.itemValue}>{voice} Minutes</span>
          </div>
          <div style={styles.listItem}>
            <div style={styles.listItemLeft}>
              <div style={{ ...styles.iconWrapper, background: '#e5e0ff', color: '#6a5acd' }}><MessageSquare size={16} /></div>
              <span style={styles.itemLabel}>SMS</span>
            </div>
            <span style={styles.itemValue}>{sms} SMS</span>
          </div>
          <div style={styles.listItem}>
            <div style={styles.listItemLeft}>
              <div style={{ ...styles.iconWrapper, background: '#e0f0ff', color: '#1e90ff' }}><Globe size={16} /></div>
              <span style={styles.itemLabel}>Data</span>
            </div>
            <span style={styles.itemValue}>{data} GB</span>
          </div>

          <div style={styles.totalSection}>
            <p style={styles.totalLabel}>Total Amount</p>
            <p style={styles.totalAmount}>USD {price}</p>
          </div>
        </div>

        <div style={styles.infoBox}>
          Your mix bundle configuration has been captured and is queued for activation. Your Voice, SMS and Data allocation will be applied to your number shortly.
        </div>

        <div style={styles.footer}>
          <div style={styles.securityBadges}>
            <span style={styles.securityBadgeSpan}><ShieldCheck size={14} /> 256-BIT ENCRYPTED</span>
            <span style={styles.securityBadgeSpan}><ShieldCheck size={14} /> PCI DSS COMPLIANT</span>
          </div>
          <p style={styles.poweredBy}>ECONET FINANCIAL SERVICES · Terms & Conditions Apply</p>
          <button style={styles.homeButton} onClick={() => navigate('/')}>Return to Home</button>
        </div>
      </div>
    </div>
  );
}