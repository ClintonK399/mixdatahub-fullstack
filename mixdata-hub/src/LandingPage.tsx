import React, { useState, useMemo } from 'react';
import { Phone, MessageSquare, Globe, Star, ShieldCheck, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './App.css';

type DurationKey = 'Daily' | '3 Days' | 'Weekly' | '2 Weeks' | 'Monthly';

interface DurationData {
  voice: number;
  sms: number;
  data: number;
  price: number;
  color: string;
}

const durationsData: Record<DurationKey, DurationData> = {
  'Daily': { voice: 10, sms: 15, data: 3, price: 0.60, color: '#ff8c00' },
  '3 Days': { voice: 50, sms: 75, data: 8, price: 1.40, color: '#ff8c00' },
  'Weekly': { voice: 120, sms: 200, data: 20, price: 2.80, color: '#00c853' },
  '2 Weeks': { voice: 300, sms: 500, data: 50, price: 5.20, color: '#6a5acd' },
  'Monthly': { voice: 600, sms: 1000, data: 100, price: 9.90, color: '#e53935' },
};

const durationKeys: DurationKey[] = ['Daily', '3 Days', 'Weekly', '2 Weeks', 'Monthly'];

export default function LandingPage() {
  const navigate = useNavigate();
  const [selectedDuration, setSelectedDuration] = useState<DurationKey>('Weekly');
  const [voice, setVoice] = useState<number>(120);
  const [sms, setSms] = useState<number>(200);
  const [data, setData] = useState<number>(20);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const currentMax = durationsData[selectedDuration];

  const currentPrice = useMemo<string>(() => {
    const voiceWeight = (voice / currentMax.voice) * 0.3;
    const smsWeight = (sms / currentMax.sms) * 0.2;
    const dataWeight = (data / currentMax.data) * 0.5;
    const totalWeight = voiceWeight + smsWeight + dataWeight;
    return (totalWeight * currentMax.price).toFixed(2);
  }, [voice, sms, data, selectedDuration, currentMax]);

  const handleDurationChange = (dur: DurationKey): void => {
    setSelectedDuration(dur);
    setVoice(durationsData[dur].voice);
    setSms(durationsData[dur].sms);
    setData(durationsData[dur].data);
  };

  const getSliderStyle = (value: number, max: number, color: string): React.CSSProperties => {
    const percentage = (value / max) * 100;
    return { background: `linear-gradient(to right, ${color} ${percentage}%, #f0f0f0 ${percentage}%)` };
  };

  const handlePay = () => {
    navigate('/login', { 
      state: { duration: selectedDuration, voice, sms, data, price: currentPrice } 
    });
  };

  return (
    <div className="app-container">
      <div className="hero-section">
        <div className="brand-logos">
          <div className="logo-econet">ECONET <span>Wireless</span></div>
          <div className="logo-ecocash">EcoCash</div>
          <span className="duration-badge">{selectedDuration.toUpperCase()}</span>
        </div>

        <div className="price-display">
          <p className="label">YOUR BUNDLE PRICE</p>
          <h1 className="price"><span>USD</span> {currentPrice}</h1>
        </div>

        <div className="summary-bar">
          <div className="summary-item">
            <span>VOICE</span>
            <span>{voice} Min</span>
            <div className="progress-line" style={{ background: '#ff4b4b' }}></div>
          </div>
          <div className="summary-item">
            <span>SMS</span>
            <span>{sms} SMS</span>
            <div className="progress-line" style={{ background: '#6a5acd' }}></div>
          </div>
          <div className="summary-item">
            <span>DATA</span>
            <span>{data} GB</span>
            <div className="progress-line" style={{ background: '#1e90ff' }}></div>
          </div>
        </div>
      </div>

      <div className="content-area">
        <div className="duration-tabs">
          {durationKeys.map((dur) => (
            <button
              key={dur}
              className={`tab-btn ${selectedDuration === dur ? 'active' : ''}`}
              onClick={() => handleDurationChange(dur)}
            >
              {dur === 'Monthly' && (
                <div className="star-icon"><Star size={10} fill="white" color="white" /></div>
              )}
              <span className="tab-title">{dur}</span>
              <span className="tab-price">${durationsData[dur].price.toFixed(2)}</span>
            </button>
          ))}
        </div>

        <div className="section-header">
          <h2>{selectedDuration} Bundle</h2>
          <span className="max-price">Max USD {currentMax.price.toFixed(2)}</span>
        </div>

        <div className="slider-card">
          <div className="card-top">
            <div className="card-title-group">
              <div className="icon-wrapper voice-icon"><Phone size={20} /></div>
              <div><h3>Voice calls</h3><p>Local minutes</p></div>
            </div>
            <div className="card-value">{voice} Min</div>
          </div>
          <div className="slider-container">
             <div className="slider-labels"><span>0 MIN</span><span>{currentMax.voice} MIN</span></div>
             <input type="range" min="0" max={currentMax.voice} value={voice} 
               onChange={(e) => setVoice(Number(e.target.value))}
               style={getSliderStyle(voice, currentMax.voice, '#ff4b4b')} className="custom-slider" />
          </div>
        </div>

        <div className="slider-card">
          <div className="card-top">
            <div className="card-title-group">
              <div className="icon-wrapper sms-icon"><MessageSquare size={20} /></div>
              <div><h3>SMS messages</h3><p>Text messages</p></div>
            </div>
            <div className="card-value">{sms} SMS</div>
          </div>
          <div className="slider-container">
             <div className="slider-labels"><span>0 SMS</span><span>{currentMax.sms} SMS</span></div>
             <input type="range" min="0" max={currentMax.sms} value={sms} 
               onChange={(e) => setSms(Number(e.target.value))}
               style={getSliderStyle(sms, currentMax.sms, '#6a5acd')} className="custom-slider" />
          </div>
        </div>

        <div className="slider-card">
          <div className="card-top">
            <div className="card-title-group">
              <div className="icon-wrapper data-icon"><Globe size={20} /></div>
              <div><h3>Mobile data</h3><p>Internet usage</p></div>
            </div>
            <div className="card-value">{data} GB</div>
          </div>
          <div className="slider-container">
             <div className="slider-labels"><span>0 GB</span><span>{currentMax.data} GB</span></div>
             <input type="range" min="0" max={currentMax.data} value={data} 
               onChange={(e) => setData(Number(e.target.value))}
               style={getSliderStyle(data, currentMax.data, '#1e90ff')} className="custom-slider" />
          </div>
        </div>

        <div className="price-footer">
          <div>
            <h4>Your {selectedDuration.toLowerCase()} price</h4>
            <p>Adjust sliders to customise</p>
          </div>
          <div className="final-price">USD {currentPrice}</div>
        </div>

        <button className="subscribe-btn" style={{ backgroundColor: currentMax.color }} onClick={() => setIsModalOpen(true)}>
          Subscribe — {selectedDuration}
        </button>

        <div className="security-badges">
          <span><ShieldCheck size={14} /> 256-BIT ENCRYPTED</span>
          <span><ShieldCheck size={14} /> PCI DSS COMPLIANT</span>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-drag-handle"></div>
            <div className="modal-header">
              <h2>Confirm your bundle</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <div className="modal-details">
              <p className="details-title">BUNDLE DETAILS</p>
              <div className="detail-row"><span>Duration</span><span>{selectedDuration}</span></div>
              <div className="detail-row"><span>Voice</span><span>{voice} Min</span></div>
              <div className="detail-row"><span>SMS</span><span>{sms} SMS</span></div>
              <div className="detail-row"><span>Data</span><span>{data} GB</span></div>
            </div>
            <div className="modal-total">
              <span>Total to pay</span>
              <span className="modal-price">USD {currentPrice}</span>
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className="pay-btn" onClick={handlePay}>Pay with EcoCash</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}