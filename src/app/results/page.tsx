"use client";
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, useMemo, useCallback, useRef, Suspense } from 'react';
import { fetchCutoffsForPrediction } from '@/lib/db';
import { calculatePrediction, sortPredictions } from '@/lib/predictor';
import { generatePredictionPDF } from '@/lib/pdf';
import { PredictionResult } from '@/types';
import { SlidersHorizontal, MapPin, Building2, BookOpen, AlertCircle, Loader2, Share2, Download, BookmarkCheck, BookmarkPlus, ChevronDown, X, Check } from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import Link from 'next/link';
import ResultCard from '@/components/ResultCard';

const MAX_RANK   = 150000;
const PAGE_SIZE  = 20;

const CATEGORIES = [
  { value: 'GENERAL', label: 'General (Open)' },
  { value: 'EWS',     label: 'EWS' },
  { value: 'OBC-A',   label: 'OBC-A' },
  { value: 'OBC-B',   label: 'OBC-B' },
  { value: 'SC',      label: 'SC' },
  { value: 'ST',      label: 'ST' },
  { value: 'TFW',     label: 'TFW' },
];

const DISTRICTS = [
  'Alipurduar','Bankura','Birbhum','Cooch Behar','Darjeeling',
  'Hooghly','Howrah','Jalpaiguri','Kolkata','Malda',
  'Murshidabad','Nadia','North 24 Parganas','Paschim Bardhaman',
  'Paschim Medinipur','Purba Bardhaman','Purba Medinipur','Purulia','South 24 Parganas',
];

/* ─── Toast ─────────────────────────────────────────────────────────────── */
function Toast({ msg }: { msg: string }) {
  return (
    <div style={{
      position:'fixed',
      bottom: 24,
      left:'50%',
      transform:'translateX(-50%)',
      zIndex:9999,
      background:'var(--card-bg)',
      border:'1px solid var(--border-solid)',
      borderRadius:12,
      padding:'10px 20px',
      display:'flex',
      alignItems:'center',
      gap:8,
      boxShadow:'0 4px 24px rgba(0,0,0,0.3)',
      whiteSpace:'nowrap',
    }}>
      <Check style={{width:16,height:16,color:'#10b981'}}/>
      <span style={{fontSize:13,fontWeight:600,color:'var(--text)'}}>{msg}</span>
    </div>
  );
}

/* ─── Filter label ───────────────────────────────────────────────────────── */
function SLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{
      display:'block',
      fontSize:10,
      fontWeight:700,
      textTransform:'uppercase',
      letterSpacing:'0.1em',
      color:'var(--text-subtle)',
      marginBottom:6,
    }}>
      {children}
    </label>
  );
}

/* ─── Filter select ──────────────────────────────────────────────────────── */
function SSelect({ value, onChange, children }: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div style={{position:'relative'}}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width:'100%',
          background:'var(--input-bg)',
          border:'1.5px solid var(--border-solid)',
          borderRadius:10,
          padding:'10px 32px 10px 10px',
          color:'var(--text)',
          fontSize:13,
          outline:'none',
          appearance:'none',
          cursor:'pointer',
          /* Ensure select box fully visible and never clipped */
          minHeight: 44,
          boxSizing: 'border-box',
        }}
      >
        {children}
      </select>
      <ChevronDown style={{
        position:'absolute',
        right:10,
        top:'50%',
        transform:'translateY(-50%)',
        width:14,
        height:14,
        color:'var(--text-subtle)',
        pointerEvents:'none',
      }}/>
    </div>
  );
}

/* ─── Main results content ───────────────────────────────────────────────── */
function ResultsContent() {
  const sp     = useSearchParams();
  const router = useRouter();

  const normalizeQueryValue = (value: string | null, defaultValue: string) => {
    if (!value) return defaultValue;
    const trimmed = value.trim();
    if (trimmed === 'All Programs') return 'All';
    if (trimmed === 'All Quotas') return 'All';
    if (trimmed === 'Open') return 'GENERAL';
    if (trimmed === 'Tuition Fee Waiver') return 'TFW';
    if (trimmed === 'OBC - A' || trimmed === 'OBC-A') return 'OBC-A';
    if (trimmed === 'OBC - B' || trimmed === 'OBC-B') return 'OBC-B';
    return trimmed;
  };

  const initRank    = Number(sp.get('rank')) || 0;
  const initCat     = normalizeQueryValue(sp.get('category'), 'GENERAL');
  const initQuota   = normalizeQueryValue(sp.get('quota'), 'Home State');
  const initRound   = normalizeQueryValue(sp.get('round'), 'All Rounds');
  const initSeat    = normalizeQueryValue(sp.get('seatType'), 'WBJEE Seats');
  const initProgram = normalizeQueryValue(sp.get('program'), 'All');

  const { user, savePrediction } = useUserStore();

  const [results,       setResults]       = useState<PredictionResult[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [toast,         setToast]         = useState('');
  const [saved,         setSaved]         = useState(false);
  const [mounted,       setMounted]       = useState(false);
  const [page,          setPage]          = useState(1);

  // Sidebar / filter state
  const [lRank,    setLRank]    = useState(initRank > 0 ? String(initRank) : '');
  const [lCat,     setLCat]     = useState(initCat);
  const [lQuota,   setLQuota]   = useState(initQuota);
  const [lRound,   setLRound]   = useState(initRound);
  const [lSeat,    setLSeat]    = useState(initSeat);
  const [lProgram, setLProgram] = useState(initProgram);
  const [lDistrict,setLDistrict]= useState('All');
  const [lChance,  setLChance]  = useState('All');
  const [rankErr,  setRankErr]  = useState('');

  /* Wait for Zustand hydration */
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (initRank < 1 || initRank > MAX_RANK) { setLoading(false); return; }
    setLoading(true);
    fetchCutoffsForPrediction(initCat, { round: initRound, quota: initQuota })
      .then(data => {
        setResults(sortPredictions(data.map(d => calculatePrediction(initRank, d))));
        setLoading(false);
      });
  }, [initRank, initCat, initQuota, initRound]);

  /* Close bottom sheet on scroll lock */
  useEffect(() => {
    if (bottomSheetOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [bottomSheetOpen]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const uniquePrograms = useMemo(
    () => Array.from(new Set(results.filter(r=>r.predictionLevel!=='NO_DATA').map(r=>r.program))).sort(),
    [results]
  );

  const filtered = useMemo(() => results.filter(r => {
    if (lProgram !== 'All' && r.program !== lProgram) return false;
    if (lDistrict!== 'All' && r.district!== lDistrict) return false;
    if (lChance  !== 'All' && r.predictionLevel !== lChance) return false;
    return true;
  }), [results, lProgram, lDistrict, lChance]);

  /* Paginated slice */
  const paginated = useMemo(() => filtered.slice(0, page * PAGE_SIZE), [filtered, page]);
  const hasMore   = paginated.length < filtered.length;

  const handleUpdate = useCallback(() => {
    const n = Number(lRank);
    if (!lRank || isNaN(n) || n < 1 || n > MAX_RANK) {
      setRankErr(`Please enter a valid WBJEE rank between 1 and ${MAX_RANK.toLocaleString()}.`);
      return;
    }
    setRankErr('');
    setPage(1);
    router.push(`/results?${new URLSearchParams({ rank:lRank, category:lCat, quota:lQuota, seatType:lSeat, round:lRound })}`, { scroll: false });
    setBottomSheetOpen(false);
  }, [lRank, lCat, lQuota, lSeat, lRound, router]);

  const handleReset = () => {
    setLProgram('All'); setLDistrict('All'); setLChance('All');
    setPage(1);
  };

  const handleShare = async () => {
    try { await navigator.clipboard.writeText(window.location.href); }
    catch { /* fallback */ }
    showToast('Link copied successfully');
  };

  const handleSave = () => {
    if (saved) return;
    savePrediction({ rank: initRank, category: initCat, quota: initQuota, focus: `${initCat} · ${initQuota} – Rank ${initRank}` });
    setSaved(true);
    showToast('Prediction saved to your profile');
  };

  const handleExportPDF = () => {
    generatePredictionPDF(filtered, { rank: initRank, category: initCat, quota: initQuota, tfwStatus: initCat === 'TFW' ? 'Yes' : 'No' });
    showToast('Results exported successfully');
  };

  /* ── Pre-hydration or auth check ── */
  if (!mounted || !user || !user.isProfileComplete) return null;

  /* ─── Sidebar / Filter panel ─────────────────────────────────────────── */
  const FilterPanel = (
    <div style={{background:'var(--card-bg)',border:'1px solid var(--border-solid)',borderRadius:16,overflow:'hidden'}}>
      {/* Header */}
      <div style={{padding:'14px 16px',borderBottom:'1px solid var(--border-solid)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <SlidersHorizontal style={{width:15,height:15,color:'#3b82f6'}}/>
          <span style={{fontWeight:700,fontSize:14,color:'var(--text)'}}>Filters</span>
        </div>
        <button
          onClick={handleReset}
          style={{fontSize:11,color:'var(--text-subtle)',textDecoration:'underline',background:'none',border:'none',cursor:'pointer',minHeight:'auto',minWidth:'auto'}}
        >
          Reset
        </button>
      </div>

      {/* Scrollable body */}
      <div style={{padding:'14px 16px',overflowY:'auto',maxHeight:'calc(80vh - 120px)',display:'flex',flexDirection:'column',gap:14}}>

        {/* Rank */}
        <div>
          <SLabel>Your Rank</SLabel>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_RANK}
            value={lRank}
            onKeyDown={e=>['e','E','+','-','.'].includes(e.key)&&e.preventDefault()}
            onChange={e=>{setLRank(e.target.value);setRankErr('');}}
            placeholder="e.g. 5420"
            style={{
              width:'100%',
              background:'var(--input-bg)',
              border:`1.5px solid ${rankErr?'#ef4444':'var(--border-solid)'}`,
              borderRadius:10,
              padding:'10px 10px',
              color:'var(--text)',
              fontSize:13,
              outline:'none',
              boxSizing:'border-box',
              minHeight: 44,
            }}
          />
          {rankErr && <p style={{fontSize:10,color:'#ef4444',marginTop:4}}>{rankErr}</p>}
        </div>

        {/* Category */}
        <div>
          <SLabel>Category</SLabel>
          <SSelect value={lCat} onChange={setLCat}>
            {CATEGORIES.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}
          </SSelect>
        </div>

        {/* Quota */}
        <div>
          <SLabel>Quota</SLabel>
          <SSelect value={lQuota} onChange={setLQuota}>
            <option value="Home State">Home State</option>
            <option value="All India">All India</option>
          </SSelect>
        </div>

        {/* Seat Type */}
        <div>
          <SLabel>Seat Type</SLabel>
          <SSelect value={lSeat} onChange={setLSeat}>
            <option value="WBJEE Seats">WBJEE Seats</option>
            <option value="JEE(Main) Seats">JEE(Main) Seats</option>
          </SSelect>
        </div>

        {/* Chance Level */}
        <div>
          <SLabel>Chance Level</SLabel>
          <SSelect value={lChance} onChange={setLChance}>
            <option value="All">All Chances</option>
            <option value="SAFE">Safe</option>
            <option value="MODERATE">Moderate</option>
            <option value="RISKY">Risky</option>
          </SSelect>
        </div>

        {/* Program */}
        <div>
          <SLabel>Program / Branch</SLabel>
          <SSelect value={lProgram} onChange={setLProgram}>
            <option value="All">All Branches</option>
            {uniquePrograms.map(p=><option key={p} value={p}>{p}</option>)}
          </SSelect>
        </div>

        {/* District */}
        <div>
          <SLabel>District</SLabel>
          <SSelect value={lDistrict} onChange={setLDistrict}>
            <option value="All">All Districts</option>
            {DISTRICTS.map(d=><option key={d} value={d}>{d}</option>)}
          </SSelect>
        </div>

        {/* Update button */}
        <button
          onClick={handleUpdate}
          style={{
            width:'100%',
            background:'linear-gradient(135deg,#2563eb,#4f46e5)',
            color:'#fff',
            border:'none',
            borderRadius:10,
            padding:'12px 0',
            fontWeight:700,
            fontSize:13,
            cursor:'pointer',
            display:'flex',
            alignItems:'center',
            justifyContent:'center',
            gap:6,
            boxShadow:'0 0 16px rgba(37,99,235,0.25)',
            minHeight: 48,
          }}
        >
          <SlidersHorizontal style={{width:14,height:14}}/> Update Results
        </button>
      </div>
    </div>
  );

  const isInvalid = initRank < 1 || initRank > MAX_RANK;

  return (
    <div style={{minHeight:'calc(100vh - 60px)',background:'var(--bg)',paddingBottom:80}}>
      {toast && <Toast msg={toast}/>}

      {/* ── Mobile bottom-sheet backdrop ── */}
      {bottomSheetOpen && (
        <div
          className="bottom-sheet-backdrop lg:hidden"
          onClick={() => setBottomSheetOpen(false)}
        />
      )}

      {/* ── Mobile bottom-sheet ── */}
      {bottomSheetOpen && (
        <div className="bottom-sheet lg:hidden">
          {/* Drag handle */}
          <div style={{display:'flex',justifyContent:'center',padding:'12px 0 6px'}}>
            <div style={{width:40,height:4,borderRadius:2,background:'var(--border-solid)'}}/>
          </div>
          {/* Close button */}
          <div style={{display:'flex',justifyContent:'flex-end',padding:'0 16px 4px'}}>
            <button
              onClick={() => setBottomSheetOpen(false)}
              style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-subtle)',display:'flex',alignItems:'center',gap:4,fontSize:12,minHeight:36,minWidth:36}}
            >
              <X style={{width:16,height:16}}/> Close
            </button>
          </div>
          {FilterPanel}
        </div>
      )}

      <div style={{maxWidth:1380,margin:'0 auto',padding:'16px 12px sm:24px sm:16px'}}>

        {/* ── Main layout: sidebar (desktop) + content ── */}
        <div style={{display:'flex',gap:20,alignItems:'flex-start'}}>

          {/* Desktop sidebar — sticky */}
          <div className="hidden lg:block" style={{width:260,flexShrink:0,position:'sticky',top:80}}>
            {FilterPanel}
          </div>

          {/* Main content */}
          <div style={{flex:1,minWidth:0}}>
            {isInvalid ? (
              <div style={{minHeight:'50vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center',gap:12,padding:'0 16px'}}>
                <AlertCircle style={{width:48,height:48,color:'var(--text-subtle)'}}/>
                <h2 style={{fontSize:22,fontWeight:700,color:'var(--text)'}}>Enter your WBJEE rank to start</h2>
                <p style={{color:'var(--text-muted)',fontSize:14}}>Use the filters panel or go back to the predictor.</p>
                <Link href="/predictor" style={{marginTop:8,background:'linear-gradient(135deg,#2563eb,#4f46e5)',color:'#fff',padding:'10px 24px',borderRadius:10,fontWeight:600,fontSize:13,textDecoration:'none'}}>
                  Back to Predictor
                </Link>
              </div>
            ) : (
              <>
                {/* ── Results header ── */}
                <div style={{marginBottom:16}}>
                  <div style={{display:'flex',flexWrap:'wrap',alignItems:'flex-start',justifyContent:'space-between',gap:10,marginBottom:8}}>
                    <div>
                      <h1 style={{fontSize:'clamp(18px, 5vw, 24px)',fontWeight:800,color:'var(--text)',marginBottom:4}}>
                        Prediction Results
                      </h1>
                      <p style={{fontSize:13,color:'var(--text-muted)'}}>
                        Showing{' '}
                        <strong style={{color:'#3b82f6'}}>{filtered.length} matching possibilities</strong>
                        {' '}for Rank{' '}
                        <strong style={{color:'var(--text)'}}>{initRank}</strong>
                      </p>
                    </div>

                    {/* Action buttons — horizontally scrollable on mobile */}
                    <div
                      style={{
                        display:'flex',
                        gap:8,
                        overflowX:'auto',
                        WebkitOverflowScrolling:'touch',
                        scrollbarWidth:'none',
                        paddingBottom:2,
                        flexShrink:0,
                        maxWidth:'100%',
                      }}
                    >
                      <button
                        onClick={handleShare}
                        style={{display:'flex',alignItems:'center',gap:6,background:'var(--card-bg)',border:'1px solid var(--border-solid)',color:'var(--text-muted)',padding:'8px 13px',borderRadius:9,fontSize:12,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap',flexShrink:0,minHeight:40}}
                      >
                        <Share2 style={{width:13,height:13}}/> Share
                      </button>
                      <button
                        onClick={handleSave}
                        style={{display:'flex',alignItems:'center',gap:6,background:saved?'rgba(16,185,129,0.12)':'var(--card-bg)',border:`1px solid ${saved?'#10b981':'var(--border-solid)'}`,color:saved?'#10b981':'var(--text-muted)',padding:'8px 13px',borderRadius:9,fontSize:12,fontWeight:600,cursor:saved?'default':'pointer',whiteSpace:'nowrap',flexShrink:0,minHeight:40}}
                      >
                        {saved?<BookmarkCheck style={{width:13,height:13}}/>:<BookmarkPlus style={{width:13,height:13}}/>}
                        {saved?'Saved':'Save'}
                      </button>
                      <button
                        onClick={handleExportPDF}
                        style={{display:'flex',alignItems:'center',gap:6,background:'linear-gradient(135deg,#2563eb,#4f46e5)',color:'#fff',border:'none',padding:'8px 13px',borderRadius:9,fontSize:12,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap',flexShrink:0,minHeight:40}}
                      >
                        <Download style={{width:13,height:13}}/> Export PDF
                      </button>
                    </div>
                  </div>

                  {/* Mobile filter toggle bar (above results) */}
                  <div
                    className="lg:hidden"
                    style={{display:'flex',alignItems:'center',gap:8,padding:'8px 0'}}
                  >
                    <button
                      onClick={() => setBottomSheetOpen(true)}
                      style={{
                        display:'flex',
                        alignItems:'center',
                        gap:6,
                        background:'var(--card-bg)',
                        border:'1px solid var(--border-solid)',
                        color:'var(--text)',
                        padding:'8px 14px',
                        borderRadius:10,
                        fontSize:13,
                        fontWeight:600,
                        cursor:'pointer',
                        minHeight:40,
                      }}
                    >
                      <SlidersHorizontal style={{width:14,height:14,color:'#3b82f6'}}/> Filters
                    </button>
                    {(lProgram !== 'All' || lDistrict !== 'All' || lChance !== 'All') && (
                      <button
                        onClick={handleReset}
                        style={{
                          fontSize:12,
                          color:'var(--text-subtle)',
                          textDecoration:'underline',
                          background:'none',
                          border:'none',
                          cursor:'pointer',
                          minHeight:36,
                        }}
                      >
                        Reset filters
                      </button>
                    )}
                    <span style={{marginLeft:'auto',fontSize:12,color:'var(--text-subtle)'}}>
                      {filtered.length} results
                    </span>
                  </div>
                </div>

                {/* ── Results list ── */}
                {loading ? (
                  <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12,minHeight:200,background:'var(--card-bg)',border:'1px solid var(--border-solid)',borderRadius:16,padding:40}}>
                    <Loader2 style={{width:36,height:36,color:'#3b82f6'}} className="animate-spin"/>
                    <p style={{color:'var(--text)',fontWeight:600}}>Analysing cutoff data…</p>
                    <p style={{color:'var(--text-muted)',fontSize:13}}>Calculating predictions based on 2025 trends.</p>
                  </div>
                ) : filtered.length === 0 ? (
                  <div style={{textAlign:'center',background:'var(--card-bg)',border:'1px solid var(--border-solid)',borderRadius:16,padding:48}}>
                    <AlertCircle style={{width:36,height:36,color:'var(--text-subtle)',margin:'0 auto 12px'}}/>
                    <p style={{color:'var(--text)',fontWeight:700,fontSize:16}}>No Matching Colleges</p>
                    <p style={{color:'var(--text-muted)',fontSize:13,marginTop:4}}>Try adjusting or resetting your filters.</p>
                    <button
                      onClick={handleReset}
                      style={{marginTop:16,background:'var(--input-bg)',border:'1px solid var(--border-solid)',color:'var(--text)',padding:'8px 20px',borderRadius:9,fontSize:13,fontWeight:600,cursor:'pointer',minHeight:40}}
                    >
                      Reset Filters
                    </button>
                  </div>
                ) : (
                  <>
                    <div style={{display:'flex',flexDirection:'column',gap:10}}>
                      {paginated.map(item => (
                        <ResultCard
                          key={`${item.id ?? item.institute}-${item.program}-${item.round}`}
                          college={item}
                          userRank={initRank}
                        />
                      ))}
                    </div>

                    {/* Pagination — Load More */}
                    {hasMore && (
                      <div style={{textAlign:'center',marginTop:24}}>
                        <button
                          onClick={() => setPage(p => p + 1)}
                          style={{
                            background:'var(--card-bg)',
                            border:'1px solid var(--border-solid)',
                            color:'var(--text)',
                            padding:'12px 32px',
                            borderRadius:10,
                            fontSize:13,
                            fontWeight:600,
                            cursor:'pointer',
                            minHeight:48,
                          }}
                        >
                          Load More ({filtered.length - paginated.length} remaining)
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Floating Filter FAB (mobile only) — visible only when bottom-sheet closed ── */}
      {!bottomSheetOpen && !isInvalid && (
        <button
          className="filter-fab lg:hidden"
          onClick={() => setBottomSheetOpen(true)}
          aria-label="Open filters"
        >
          <SlidersHorizontal style={{width:15,height:15}}/> Filters
        </button>
      )}
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div style={{minHeight:'60vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12}}>
        <Loader2 style={{width:36,height:36,color:'#3b82f6'}} className="animate-spin"/>
        <p style={{color:'var(--text)',fontWeight:600}}>Loading Predictions…</p>
      </div>
    }>
      <ResultsContent/>
    </Suspense>
  );
}
