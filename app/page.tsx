"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

type TimelineItem = {
  year: number;
  value: number;
};

type HistoryItem = {
  goal: number;
  years: number;
  sip: number;
  date: string;
};

export default function Home() {
  const [currentCost, setCurrentCost] = useState("");
  const [years, setYears] = useState("");
  const [inflation, setInflation] = useState(6);
  const [returnRate, setReturnRate] = useState(12);
  const [currency, setCurrency] = useState("INR");

  const [futureValue, setFutureValue] = useState<number | null>(null);
  const [sip, setSip] = useState<number | null>(null);

  const [timeline, setTimeline] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const [whatIfSip, setWhatIfSip] = useState("");
  const [newYears, setNewYears] = useState<number | null>(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem("calcHistory");

    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        if (Array.isArray(parsed)) {
          setHistory(parsed);
        }
      } catch {
        setHistory([]);
      }
    }
  }, []);

  const currencySymbols: Record<string, string> = {
    INR: "₹",
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
    AUD: "A$",
  };

  const exchangeRates: Record<string, number> = {
    INR: 1,
    USD: 0.012,
    EUR: 0.011,
    GBP: 0.0095,
    JPY: 1.8,
    AUD: 0.018,
  };

  const formatLakhs = (value: number) => {
    if (value >= 100000) {
      return (value / 100000).toFixed(0) + "L";
    }
    return value.toLocaleString();
  };

  const convertedTimeline = timeline.map((item) => ({
    ...item,
    value: item.value * exchangeRates[currency],
  }));

  const calculate = async () => {
    const cost = Number(currentCost);
    const yrs = Number(years);

    if (cost <= 0 || yrs <= 0) {
      alert("Please enter valid values");
      return;
    }

    try {
      const res = await fetch("/api/calculate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cost,
          years: yrs,
          inflation,
          returnRate,
        }),
      });

      if (!res.ok) {
        throw new Error("Calculation failed");
      }

      const data = await res.json();

      setFutureValue(data.futureValue);
      setSip(data.sip);
      setTimeline(data.timeline);

      const newItem = {
        goal: cost,
        years: yrs,
        sip: data.sip,
        date: new Date().toLocaleDateString(),
      };

      const updatedHistory = [newItem, ...history].slice(0, 5);
      setHistory(updatedHistory);
      localStorage.setItem("calcHistory", JSON.stringify(updatedHistory));
    } catch (error) {
      alert("Error calculating SIP. Please try again.");
      console.error(error);
    }
  };

  const calculateWhatIf = () => {
    if (!futureValue) return;

    const sipAmount = Number(whatIfSip) / exchangeRates[currency];

    if (sipAmount <= 0) {
      alert("Please enter a valid SIP amount");
      return;
    }

    const r = returnRate / 100 / 12;
    let months = 1;

    while (months < 600) {
      const fv = sipAmount * ((Math.pow(1 + r, months) - 1) / r) * (1 + r);
      if (fv >= futureValue) break;
      months++;
    }

    setNewYears(months / 12);
  };

  return (
    <div style={pageStyle}>
      {!showHistory && (
        <button
          onClick={() => setShowHistory(true)}
          style={historyButtonStyle}
        >
          ☰
        </button>
      )}

      {showHistory && (
        <div style={sidebarStyle}>
          <div style={sidebarHeaderStyle}>
            <h3 style={{ color: "white", margin: 0 }}>Calculation History</h3>
            <button
              onClick={() => setShowHistory(false)}
              style={closeButtonStyle}
            >
              ✕
            </button>
          </div>

          {history.length === 0 && (
            <p style={{ color: "white" }}>No calculations yet</p>
          )}

          {history.map((item, index) => (
            <div key={index} style={historyItemStyle}>
              <p>
                Goal: {currencySymbols[currency]}
                {(item.goal * exchangeRates[currency]).toLocaleString()}
              </p>
              <p>Years: {item.years}</p>
              <p>
                SIP: {currencySymbols[currency]}
                {Math.round(item.sip * exchangeRates[currency]).toLocaleString()}
              </p>
              <small>{item.date}</small>
            </div>
          ))}
        </div>
      )}

      <div
        style={{
          ...cardStyle,
          marginLeft: showHistory ? "320px" : "0px",
        }}
      >
        <h2 style={titleStyle}>Goal-Based Investment Calculator</h2>

        <label style={labelStyle}>Current Cost of Goal</label>
        <input
          type="number"
          placeholder="Enter goal cost"
          value={currentCost}
          onChange={(e) => setCurrentCost(e.target.value)}
          style={inputStyle}
        />

        <label style={labelStyle}>Years to Goal</label>
        <input
          type="number"
          placeholder="Enter years"
          value={years}
          onChange={(e) => setYears(e.target.value)}
          style={inputStyle}
        />

        <label style={labelStyle}>Inflation Rate (%)</label>
        <input
          type="number"
          value={inflation}
          onChange={(e) => setInflation(Number(e.target.value))}
          style={inputStyle}
        />

        <label style={labelStyle}>Expected Return (%)</label>
        <input
          type="number"
          value={returnRate}
          onChange={(e) => setReturnRate(Number(e.target.value))}
          style={inputStyle}
        />

        <label style={labelStyle}>Select Currency</label>
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          style={inputStyle}
        >
          <option value="INR">INR – Indian Rupee</option>
          <option value="USD">USD – US Dollar</option>
          <option value="EUR">EUR – Euro</option>
          <option value="GBP">GBP – British Pound</option>
          <option value="JPY">JPY – Japanese Yen</option>
          <option value="AUD">AUD – Australian Dollar</option>
        </select>

        <button onClick={calculate} style={buttonStyle}>
          Calculate SIP
        </button>

        {futureValue !== null && sip !== null && (
          <div style={resultBox}>
            <p>
              Future Goal Value: {currencySymbols[currency]}
              {(futureValue * exchangeRates[currency]).toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}
            </p>
            <p style={{ fontWeight: "bold" }}>
              Required Monthly SIP: {currencySymbols[currency]}
              {(sip * exchangeRates[currency]).toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}
            </p>
            <p>Goal achieved in {years} years</p>
          </div>
        )}

        {timeline.length > 0 && (
          <div style={{ marginTop: "25px" }}>
            <h3 style={{ color: "#224c87" }}>Investment Growth Journey</h3>
            <ResponsiveContainer width="100%" height={230}>
              <LineChart
                data={convertedTimeline}
                margin={{ top: 10, right: 10, left: 10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis
                  tickFormatter={(value) =>
                    currencySymbols[currency] + formatLakhs(value)
                  }
                  width={60}
                />
                <Tooltip
  formatter={(value) =>
    currencySymbols[currency] +
    new Intl.NumberFormat("en-IN").format(Number(value))
  }
/>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#da3832"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {sip !== null && (
          <>
            <h3 style={subTitleStyle}>What-If Scenario</h3>
            <label style={labelStyle}>Enter Higher SIP Amount</label>
            <input
              type="number"
              placeholder="Enter SIP amount"
              value={whatIfSip}
              onChange={(e) => setWhatIfSip(e.target.value)}
              style={inputStyle}
            />
            <button onClick={calculateWhatIf} style={buttonStyle}>
              Check Scenario
            </button>

            {newYears !== null && (
              <div style={resultBox}>
                <p>
                  Goal will be achieved in
                  <strong> {newYears.toFixed(1)} years</strong>
                </p>
                <p>
                  You achieve your goal
                  <strong> {(Number(years) - newYears).toFixed(1)} years earlier</strong>
                </p>
              </div>
            )}
          </>
        )}

        <div style={disclaimerStyle}>
          Disclaimer: This tool has been designed for information purposes only.
          Actual results may vary depending on various factors involved in
          capital market. Investor should not consider above as a recommendation
          for any schemes of HDFC Mutual Fund. Past performance may or may not
          be sustained in future and is not a guarantee of any future returns.
        </div>
      </div>
    </div>
  );
}

// Styles
const pageStyle = {
  fontFamily: "Montserrat, Arial, Verdana",
  background: "#224c87",
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: "20px",
};

const cardStyle = {
  maxWidth: "450px",
  width: "100%",
  background: "white",
  padding: "30px",
  borderRadius: "10px",
  boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
  transition: "margin-left 0.3s",
};

const titleStyle = {
  textAlign: "center" as const,
  marginBottom: "25px",
  color: "#224c87",
};

const subTitleStyle = {
  marginTop: "20px",
  color: "#224c87",
};

const labelStyle = {
  fontWeight: "bold" as const,
  color: "#919090",
  display: "block",
  marginBottom: "5px",
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  fontSize: "16px",
  marginBottom: "15px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  backgroundColor: "#224c87",
  color: "white",
  boxSizing: "border-box" as const,
};

const buttonStyle = {
  width: "100%",
  padding: "12px",
  background: "#da3832",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "bold" as const,
  fontSize: "16px",
};

const resultBox = {
  marginTop: "20px",
  padding: "15px",
  background: "#f3f3f3",
  borderRadius: "6px",
  color: "#333",
};

const disclaimerStyle = {
  marginTop: "25px",
  fontSize: "12px",
  color: "#666",
  borderTop: "1px solid #ddd",
  paddingTop: "15px",
  lineHeight: "1.6",
};

const historyButtonStyle = {
  position: "fixed" as const,
  left: "20px",
  top: "20px",
  zIndex: 1000,
  fontSize: "26px",
  background: "#da3832",
  color: "white",
  border: "none",
  borderRadius: "6px",
  padding: "5px 10px",
  cursor: "pointer",
};

const sidebarStyle = {
  position: "fixed" as const,
  left: "0",
  top: "0",
  height: "100%",
  width: "300px",
  background: "#224c87",
  padding: "20px",
  overflowY: "auto" as const,
  zIndex: 999,
};

const sidebarHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px",
};

const closeButtonStyle = {
  background: "white",
  border: "none",
  borderRadius: "50%",
  width: "30px",
  height: "30px",
  cursor: "pointer",
  fontWeight: "bold" as const,
};

const historyItemStyle = {
  background: "white",
  padding: "10px",
  borderRadius: "6px",
  marginTop: "10px",
  color: "#224c87",
};
