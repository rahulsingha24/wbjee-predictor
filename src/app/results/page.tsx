"use client";

import { useSearchParams, useRouter } from "next/navigation";
import {
  useEffect,
  useState,
  useMemo,
  useCallback,
  Suspense,
} from "react";
import { fetchCutoffsForPrediction, getCategoriesWithPwd } from "@/lib/db";
import { calculatePrediction, sortPredictions } from "@/lib/predictor";
import { generatePredictionPDF } from "@/lib/pdf";
import { PredictionResult } from "@/types";
import {
  SlidersHorizontal,
  AlertCircle,
  Loader2,
  Share2,
  Download,
  ChevronDown,
  X,
  Check,
} from "lucide-react";
import { useUserStore } from "@/store/userStore";
import Link from "next/link";
import ResultCard from "@/components/ResultCard";
import localCutoffs from "@/data/cutoffs.json";

const ALL_PROGRAMS = Array.from(
  new Set((localCutoffs as any[]).map((d) => d.program))
)
  .filter(Boolean)
  .sort() as string[];

const MAX_RANK = 150000;
const PAGE_SIZE = 20;

const CATEGORIES = [
  { value: "GENERAL", label: "General (Open)" },
  { value: "GENERAL_TFW", label: "General + TFW" },
  { value: "EWS", label: "EWS" },
  { value: "OBC-A", label: "OBC-A" },
  { value: "OBC-B", label: "OBC-B" },
  { value: "SC", label: "SC" },
  { value: "ST", label: "ST" },
];

const DISTRICTS = [
  "Alipurduar",
  "Bankura",
  "Birbhum",
  "Cooch Behar",
  "Darjeeling",
  "Hooghly",
  "Howrah",
  "Jalpaiguri",
  "Kolkata",
  "Malda",
  "Murshidabad",
  "Nadia",
  "North 24 Parganas",
  "Paschim Bardhaman",
  "Paschim Medinipur",
  "Purba Bardhaman",
  "Purba Medinipur",
  "Purulia",
  "South 24 Parganas",
];

function Toast({ msg }: { msg: string }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        background: "var(--card-bg)",
        border: "1px solid var(--border-solid)",
        borderRadius: 12,
        padding: "10px 20px",
        display: "flex",
        alignItems: "center",
        gap: 8,
        boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
        whiteSpace: "nowrap",
      }}
    >
      <Check style={{ width: 16, height: 16, color: "#10b981" }} />
      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
        {msg}
      </span>
    </div>
  );
}

function SLabel({ children }: { children: React.ReactNode }) {
  return (
    <label
      style={{
        display: "block",
        fontSize: 10,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        color: "var(--text-subtle)",
        marginBottom: 5,
      }}
    >
      {children}
    </label>
  );
}

function SSelect({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          background: "var(--input-bg)",
          border: "1.5px solid var(--border-solid)",
          borderRadius: 10,
          padding: "8px 34px 8px 11px",
          color: "var(--text)",
          fontSize: 13,
          outline: "none",
          appearance: "none",
          cursor: "pointer",
          minHeight: 38,
          boxSizing: "border-box",
          transition: "border-color 0.2s ease, background 0.2s ease",
        }}
      >
        {children}
      </select>

      <ChevronDown
        style={{
          position: "absolute",
          right: 10,
          top: "50%",
          transform: "translateY(-50%)",
          width: 14,
          height: 14,
          color: "var(--text-subtle)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

function ResultsContent() {
  const sp = useSearchParams();
  const router = useRouter();

  const normalizeQueryValue = (value: string | null, defaultValue: string) => {
    if (!value) return defaultValue;

    const trimmed = value.trim();

    if (trimmed === "All Programs") return "All";
    if (trimmed === "All Quotas") return "All";
    if (trimmed === "All Types") return "All";
    if (trimmed === "Open") return "GENERAL";
    if (trimmed === "Tuition Fee Waiver") return "TFW";
    if (trimmed === "OBC - A" || trimmed === "OBC-A") return "OBC-A";
    if (trimmed === "OBC - B" || trimmed === "OBC-B") return "OBC-B";

    return trimmed;
  };

  const initRank = Number(sp.get("rank")) || 0;
  const initCat = normalizeQueryValue(sp.get("category"), "GENERAL");
  const initPwd = sp.get("pwd") === "true";
  const initQuota = normalizeQueryValue(sp.get("quota"), "Both");
  const initRound = normalizeQueryValue(sp.get("round"), "All Rounds");
  const initSeat = normalizeQueryValue(sp.get("seatType"), "WBJEE Seats");
  const initProgram = normalizeQueryValue(sp.get("program"), "All");
  const initDistrict = normalizeQueryValue(sp.get("district"), "All");
  const initChance = normalizeQueryValue(sp.get("chance"), "All");
  const initType = normalizeQueryValue(sp.get("type"), "All");

  const { user } = useUserStore();

  const [results, setResults] = useState<PredictionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [mounted, setMounted] = useState(false);
  const [page, setPage] = useState(1);
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(false);

  const [lRank, setLRank] = useState(initRank > 0 ? String(initRank) : "");
  const [lCat, setLCat] = useState(initCat);
  const [lPwd, setLPwd] = useState(initPwd);
  const [lQuota, setLQuota] = useState(initQuota);
  const [lRound, setLRound] = useState(initRound);
  const [lSeat, setLSeat] = useState(initSeat);
  const [lProgram, setLProgram] = useState(initProgram);
  const [lDistrict, setLDistrict] = useState(initDistrict);
  const [lChance, setLChance] = useState(initChance);
  const [lType, setLType] = useState(initType);
  const [rankErr, setRankErr] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setLRank(initRank > 0 ? String(initRank) : "");
    setLCat(initCat);
    setLPwd(initPwd);
    setLQuota(initQuota);
    setLRound(initRound);
    setLSeat(initSeat);
    setLProgram(initProgram);
    setLDistrict(initDistrict);
    setLChance(initChance);
    setLType(initType);
    setPage(1);
  }, [
    initRank,
    initCat,
    initPwd,
    initQuota,
    initRound,
    initSeat,
    initProgram,
    initDistrict,
    initChance,
    initType,
  ]);

  useEffect(() => {
    if (initRank < 1 || initRank > MAX_RANK) {
      setLoading(false);
      return;
    }

    setLoading(true);

    fetchCutoffsForPrediction(initCat, {
      round: initRound,
      quota: initQuota,
      pwd: initPwd,
      seatType: initSeat,
      type: initType,
    }).then((data) => {
      setResults(sortPredictions(data.map((d) => calculatePrediction(initRank, d))));
      setLoading(false);
    });
  }, [initRank, initCat, initPwd, initQuota, initRound, initSeat, initType]);

  useEffect(() => {
    if (bottomSheetOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [bottomSheetOpen]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const filtered = useMemo(
    () =>
      results.filter((r) => {
        if (lProgram !== "All" && r.program !== lProgram) return false;
        if (lDistrict !== "All" && r.district !== lDistrict) return false;
        if (lChance !== "All" && r.predictionLevel !== lChance) return false;
        return true;
      }),
    [results, lProgram, lDistrict, lChance]
  );

  const paginated = useMemo(
    () => filtered.slice(0, page * PAGE_SIZE),
    [filtered, page]
  );

  const hasMore = paginated.length < filtered.length;

  const handleUpdate = useCallback(() => {
    const n = Number(lRank);

    if (!lRank || isNaN(n) || n < 1 || n > MAX_RANK) {
      setRankErr(
        `Please enter a valid WBJEE rank between 1 and ${MAX_RANK.toLocaleString()}.`
      );
      return;
    }

    setRankErr("");
    setPage(1);

    router.push(
      `/results?${new URLSearchParams({
        rank: lRank,
        category: lCat,
        pwd: lPwd ? "true" : "false",
        quota: lQuota,
        seatType: lSeat,
        round: lRound,
        program: lProgram,
        district: lDistrict,
        chance: lChance,
        type: lType,
      })}`,
      { scroll: false }
    );

    setBottomSheetOpen(false);
  }, [
    lRank,
    lCat,
    lPwd,
    lQuota,
    lSeat,
    lRound,
    lProgram,
    lDistrict,
    lChance,
    lType,
    router,
  ]);

  const handleReset = () => {
    setLRank("");
    setLCat("GENERAL");
    setLPwd(false);
    setLQuota("Both");
    setLRound("All Rounds");
    setLSeat("WBJEE Seats");
    setLProgram("All");
    setLDistrict("All");
    setLChance("All");
    setLType("All");
    setPage(1);
    setRankErr("");
    router.push("/predictor");
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      // fallback ignored
    }

    showToast("Link copied successfully");
  };

  const handleExportPDF = () => {
    generatePredictionPDF(filtered, {
      rank: initRank,
      category: CATEGORIES.find(c => c.value === initCat)?.label || initCat,
      quota: initQuota,
      seatType: initSeat,
      pwdStatus: initPwd ? "PwD" : "No PwD",
      round: initRound,
      instituteType: initType,
      chanceLevel: lChance,
      program: lProgram,
      district: lDistrict,
      name: user?.name,
    });

    showToast("Results exported successfully");
  };

  if (!mounted) {
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
        }}
      >
        <Loader2
          style={{ width: 36, height: 36, color: "#3b82f6" }}
          className="animate-spin"
        />
        <p style={{ color: "var(--text)", fontWeight: 600 }}>Loading…</p>
      </div>
    );
  }

  if (!user || !user.isProfileComplete) {
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          textAlign: "center",
          padding: "0 16px",
        }}
      >
        <AlertCircle
          style={{ width: 48, height: 48, color: "var(--text-subtle)" }}
        />

        <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text)" }}>
          {!user ? "Login Required" : "Profile Required"}
        </h2>

        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
          {!user
            ? "Please sign in to view prediction results."
            : "Please complete your profile to continue."}
        </p>

        <a
          href={!user ? "/login" : "/onboarding"}
          style={{
            marginTop: 8,
            background: "linear-gradient(135deg,#2563eb,#4f46e5)",
            color: "#fff",
            padding: "10px 24px",
            borderRadius: 10,
            fontWeight: 600,
            fontSize: 13,
            textDecoration: "none",
          }}
        >
          {!user ? "Go to Login" : "Complete Profile"}
        </a>
      </div>
    );
  }

  const FilterPanel = (
    <div
      style={{
        background: "var(--card-bg)",
        border: "1px solid var(--border-solid)",
        borderRadius: 16,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        height: isFilterCollapsed ? "auto" : "calc(100vh - 100px)",
        boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
      }}
    >
      <div
        onClick={() => setIsFilterCollapsed(!isFilterCollapsed)}
        style={{
          padding: "14px 14px",
          borderBottom: isFilterCollapsed
            ? "none"
            : "1px solid var(--border-solid)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
          cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <SlidersHorizontal
            style={{ width: 15, height: 15, color: "#3b82f6" }}
          />

          <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>
            Filters
          </span>

          <ChevronDown
            style={{
              width: 14,
              height: 14,
              color: "var(--text-subtle)",
              transform: isFilterCollapsed ? "rotate(-90deg)" : "none",
              transition: "transform 0.2s",
            }}
          />
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleUpdate();
          }}
          style={{
            background: "linear-gradient(135deg,#2563eb,#4f46e5)",
            color: "#fff",
            border: "none",
            borderRadius: 9,
            padding: "8px 12px",
            fontWeight: 700,
            fontSize: 12,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            boxShadow: "0 0 14px rgba(37,99,235,0.25)",
            whiteSpace: "nowrap",
            minHeight: 38,
          }}
        >
          Update Results
        </button>
      </div>

      {!isFilterCollapsed && (
        <div
          style={{
            padding: "11px 16px 20px",
            overflowY: "auto",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div>
            <SLabel>Your Rank (GMR)</SLabel>

            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_RANK}
              value={lRank}
              onKeyDown={(e) =>
                ["e", "E", "+", "-", "."].includes(e.key) && e.preventDefault()
              }
              onWheel={(e) => e.currentTarget.blur()}
              onChange={(e) => {
                setLRank(e.target.value);
                setRankErr("");
              }}
              placeholder="e.g. 5420"
              style={{
                width: "100%",
                background: "var(--input-bg)",
                border: `1.5px solid ${
                  rankErr ? "#ef4444" : "var(--border-solid)"
                }`,
                borderRadius: 10,
                padding: "8px 10px",
                color: "var(--text)",
                fontSize: 13,
                outline: "none",
                boxSizing: "border-box",
                minHeight: 38,
              }}
            />

            {rankErr && (
              <p style={{ fontSize: 10, color: "#ef4444", marginTop: 4 }}>
                {rankErr}
              </p>
            )}
          </div>

          <div>
            <SLabel>Category</SLabel>
            <SSelect value={lCat} onChange={setLCat}>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </SSelect>
          </div>

          <div>
            <SLabel>Quota</SLabel>
            <SSelect value={lQuota} onChange={setLQuota}>
              <option value="Both">Home State + All India</option>
              <option value="Home State">Home State</option>
              <option value="All India">All India</option>
            </SSelect>
          </div>

          <div>
            <SLabel>Seat Type</SLabel>
            <SSelect value={lSeat} onChange={setLSeat}>
              <option value="WBJEE Seats">WBJEE Seats</option>
              <option value="JEE(Main) Seats">JEE(Main) Seats</option>
            </SSelect>
          </div>

          <div>
            <SLabel>PwD Status</SLabel>
            <SSelect
              value={lPwd ? "PwD" : "No PwD"}
              onChange={(v) => setLPwd(v === "PwD")}
            >
              <option value="No PwD">No PwD</option>
              <option value="PwD">PwD</option>
            </SSelect>
          </div>

          <div>
            <SLabel>Round</SLabel>
            <SSelect value={lRound} onChange={setLRound}>
              <option value="All Rounds">All Rounds</option>
              <option value="Round 1">Round 1</option>
              <option value="Round 2">Round 2</option>
            </SSelect>
          </div>

          <div>
            <SLabel>Institute Type</SLabel>
            <SSelect value={lType} onChange={setLType}>
              <option value="All">Government + Private</option>
              <option value="Government">Government</option>
              <option value="Private">Private</option>
            </SSelect>
          </div>

          <div>
            <SLabel>Chance Level</SLabel>
            <SSelect value={lChance} onChange={setLChance}>
              <option value="All">All Chances</option>
              <option value="SAFE">Safe</option>
              <option value="MODERATE">Moderate</option>
              <option value="RISKY">Risky</option>
            </SSelect>
          </div>

          <div>
            <SLabel>Program / Branch</SLabel>
            <SSelect value={lProgram} onChange={setLProgram}>
              <option value="All">All Branches</option>
              {ALL_PROGRAMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </SSelect>
          </div>

          <div>
            <SLabel>District</SLabel>
            <SSelect value={lDistrict} onChange={setLDistrict}>
              <option value="All">All Districts</option>
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </SSelect>
          </div>
        </div>
      )}
    </div>
  );

  const isInvalid = initRank < 1 || initRank > MAX_RANK;

  return (
    <div
      style={{
        minHeight: "calc(100vh - 60px)",
        background: "var(--bg)",
        paddingBottom: 80,
      }}
    >
      {toast && <Toast msg={toast} />}

      {bottomSheetOpen && (
        <div
          className="bottom-sheet-backdrop lg:hidden"
          onClick={() => setBottomSheetOpen(false)}
        />
      )}

      {bottomSheetOpen && (
        <div className="bottom-sheet lg:hidden">
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "12px 0 6px",
            }}
          >
            <div
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                background: "var(--border-solid)",
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              padding: "0 16px 4px",
            }}
          >
            <button
              onClick={() => setBottomSheetOpen(false)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-subtle)",
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 12,
                minHeight: 36,
                minWidth: 36,
              }}
            >
              <X style={{ width: 16, height: 16 }} /> Close
            </button>
          </div>

          {FilterPanel}
        </div>
      )}

      <div className="max-w-[1380px] mx-auto px-3 sm:px-4 pt-5 sm:pt-6">
        <div className="flex flex-col lg:flex-row gap-5 items-start">
          {!isFilterCollapsed && (
  <div
    className="w-full lg:w-[270px] flex-shrink-0 lg:sticky lg:top-[80px]"
    style={{
      maxHeight: "calc(100vh - 100px)",
      zIndex: 40,
    }}
  >
    {FilterPanel}
  </div>
)}

          <div style={{ flex: 1, minWidth: 0, width: "100%" }}>
            {isFilterCollapsed && (
  <div
    style={{
      marginBottom: 18,
      display: "inline-flex",
      alignItems: "center",
      gap: 12,
      background: "var(--card-bg)",
      border: "1px solid var(--border-solid)",
      borderRadius: 14,
      padding: "12px 14px",
      boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
    }}
  >
    <button
      onClick={() => setIsFilterCollapsed(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: "transparent",
        border: "none",
        color: "var(--text)",
        fontSize: 14,
        fontWeight: 700,
        cursor: "pointer",
        padding: 0,
        minHeight: 36,
      }}
    >
      <SlidersHorizontal
        style={{ width: 15, height: 15, color: "#3b82f6" }}
      />
      Filters
      <ChevronDown
        style={{
          width: 14,
          height: 14,
          color: "var(--text-subtle)",
          transform: "rotate(-90deg)",
        }}
      />
    </button>

    <button
      onClick={handleUpdate}
      style={{
        background: "linear-gradient(135deg,#2563eb,#4f46e5)",
        color: "#fff",
        border: "none",
        borderRadius: 9,
        padding: "8px 12px",
        fontWeight: 700,
        fontSize: 12,
        cursor: "pointer",
        boxShadow: "0 0 14px rgba(37,99,235,0.25)",
        whiteSpace: "nowrap",
        minHeight: 38,
      }}
    >
      Update Results
    </button>
  </div>
)}
            {isInvalid ? (
              <div
                style={{
                  minHeight: "50vh",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  gap: 12,
                  padding: "0 16px",
                }}
              >
                <AlertCircle
                  style={{
                    width: 48,
                    height: 48,
                    color: "var(--text-subtle)",
                  }}
                />

                <h2
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: "var(--text)",
                  }}
                >
                  Enter your WBJEE rank to start
                </h2>

                <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
                  Use the filters panel or go back to the predictor.
                </p>

                <Link
                  href="/predictor"
                  style={{
                    marginTop: 8,
                    background: "linear-gradient(135deg,#2563eb,#4f46e5)",
                    color: "#fff",
                    padding: "10px 24px",
                    borderRadius: 10,
                    fontWeight: 600,
                    fontSize: 13,
                    textDecoration: "none",
                  }}
                >
                  Back to Predictor
                </Link>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 22 }}>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 16,
                      marginBottom: 18,
                    }}
                  >
                    <div>
                      <h1
                        style={{
                          fontSize: "clamp(21px, 5vw, 28px)",
                          fontWeight: 800,
                          color: "var(--text)",
                          marginBottom: 5,
                          lineHeight: 1.15,
                        }}
                      >
                        Prediction Results
                      </h1>

                      <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
                        Showing{" "}
                        <strong style={{ color: "#3b82f6" }}>
                          {filtered.length} matching possibilities
                        </strong>{" "}
                        for Rank{" "}
                        <strong style={{ color: "var(--text)" }}>
                          {initRank}
                        </strong>
                      </p>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        overflowX: "auto",
                        WebkitOverflowScrolling: "touch",
                        scrollbarWidth: "none",
                        paddingTop: 8,
                        paddingBottom: 2,
                        flexShrink: 0,
                        maxWidth: "100%",
                      }}
                    >
                      <button
                        onClick={handleShare}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 7,
                          background: "linear-gradient(135deg,#2563eb,#4f46e5)",
                          color: "#fff",
                          border: "none",
                          padding: "10px 16px",
                          borderRadius: 10,
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                          minHeight: 42,
                          boxShadow: "0 0 16px rgba(37,99,235,0.25)",
                        }}
                      >
                        <Share2 style={{ width: 14, height: 14 }} /> Share
                      </button>

                      <button
                        onClick={handleExportPDF}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 7,
                          background: "linear-gradient(135deg,#2563eb,#4f46e5)",
                          color: "#fff",
                          border: "none",
                          padding: "10px 16px",
                          borderRadius: 10,
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                          minHeight: 42,
                          boxShadow: "0 0 16px rgba(37,99,235,0.25)",
                        }}
                      >
                        <Download style={{ width: 14, height: 14 }} /> Export PDF
                      </button>
                    </div>
                  </div>

                  <div className="lg:hidden flex items-center justify-between">
                    <span
                      style={{
                        fontSize: 13,
                        color: "var(--text-subtle)",
                        fontWeight: 600,
                      }}
                    >
                      {filtered.length} results found
                    </span>
                  </div>
                </div>

                {loading ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 12,
                      minHeight: 200,
                      background: "var(--card-bg)",
                      border: "1px solid var(--border-solid)",
                      borderRadius: 16,
                      padding: 40,
                    }}
                  >
                    <Loader2
                      style={{ width: 36, height: 36, color: "#3b82f6" }}
                      className="animate-spin"
                    />

                    <p style={{ color: "var(--text)", fontWeight: 600 }}>
                      Analysing cutoff data…
                    </p>

                    <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
                      Calculating predictions based on 2025 trends.
                    </p>
                  </div>
                ) : filtered.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      background: "var(--card-bg)",
                      border: "1px solid var(--border-solid)",
                      borderRadius: 16,
                      padding: 48,
                    }}
                  >
                    <AlertCircle
                      style={{
                        width: 36,
                        height: 36,
                        color: "var(--text-subtle)",
                        margin: "0 auto 12px",
                      }}
                    />

                    <p
                      style={{
                        color: "var(--text)",
                        fontWeight: 700,
                        fontSize: 16,
                      }}
                    >
                      No Matching Colleges
                    </p>

                    <p
                      style={{
                        color: "var(--text-muted)",
                        fontSize: 13,
                        marginTop: 4,
                      }}
                    >
                      Try adjusting your filters.
                    </p>

                    <button
                      onClick={handleReset}
                      className="w-full sm:w-auto transition-all duration-200 active:scale-[0.98]"
                      style={{
                        marginTop: 16,
                        background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)",
                        border: "none",
                        color: "#fff",
                        padding: "10px 24px",
                        borderRadius: "12px",
                        fontSize: 14,
                        fontWeight: 700,
                        cursor: "pointer",
                        minHeight: 40,
                        boxShadow: "0 0 20px rgba(37,99,235,0.30)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = "0 0 32px rgba(37,99,235,0.50)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = "0 0 20px rgba(37,99,235,0.30)";
                      }}
                    >
                      Back to Predictor
                    </button>
                  </div>
                ) : (
                  <>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                      }}
                    >
                      {paginated.map((item) => (
                        <ResultCard
                          key={`${item.institute}-${item.program}-${item.quota}-${item.category}-${item.round}`}
                          college={item}
                          userRank={initRank}
                        />
                      ))}
                    </div>

                    {hasMore && (
                      <div style={{ textAlign: "center", marginTop: 24 }}>
                        <button
                          onClick={() => setPage((p) => p + 1)}
                          className="w-full sm:w-auto transition-all duration-200 active:scale-[0.98]"
                          style={{
                            background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)",
                            border: "none",
                            color: "#fff",
                            padding: "12px 32px",
                            borderRadius: "12px",
                            fontSize: 14,
                            fontWeight: 700,
                            cursor: "pointer",
                            minHeight: 48,
                            boxShadow: "0 0 20px rgba(37,99,235,0.30)",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = "0 0 32px rgba(37,99,235,0.50)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = "0 0 20px rgba(37,99,235,0.30)";
                          }}
                        >
                          Load More ({filtered.length - paginated.length}{" "}
                          remaining)
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
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "60vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
          }}
        >
          <Loader2
            style={{ width: 36, height: 36, color: "#3b82f6" }}
            className="animate-spin"
          />

          <p style={{ color: "var(--text)", fontWeight: 600 }}>
            Loading Predictions…
          </p>
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}