import React, { useState, useEffect, useRef } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { format, addDays, startOfWeek, startOfMonth, startOfQuarter } from "date-fns";
import { vi } from "date-fns/locale";
import axios from "axios";

// ===== CONFIG =====
const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

const LOGO_B64 = "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAICAgIChAoKAcKDAxLDA4SEA0RDg4TDg4UEBATExAREBESFRkTExQoFRgXFRgYGxj/2wBDAQcHBwoIChMKChMoGBgaKDg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4GBj/wAARCAAKAAsDAREAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8VAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=";

const REPORTS_CATALOG = [
  { code: "LHKTTC-01", name: "Báo cáo thu chi", category: "Dòng tiền", freq: "Ngày", priority: "Cao", owner: ["Nga"], approver: "HuyL", format: "Excel", kpi: "Thu–chi phát sinh trong ngày", dueDate: null },
  { code: "LHKTQT-01", name: "Báo cáo quỹ tiền", category: "Dòng tiền", freq: "Ngày", priority: "Cao", owner: ["Nga"], approver: "HuyL", format: "Excel", kpi: "Số dư quỹ", dueDate: null },
  { code: "LHKTCNPT01", name: "Công nợ phải thu", category: "Sức khoẻ tài chính", freq: "Tuần", priority: "Cao", owner: ["Vinh","Nga"], approver: "HuyL", format: "Excel", kpi: "Công nợ >30 ngày < 3", dueDate: "SAT 17:00" },
  { code: "LHKTCNPT02", name: "Công nợ phải trả", category: "Sức khoẻ tài chính", freq: "Tuần", priority: "Cao", owner: ["HuyL","Nga"], approver: "HuyL", format: "Excel", kpi: "Không tạo thâm hụt", dueDate: "SAT 17:00" },
  { code: "LHKTCQ01", name: "Báo cáo công quỹ", category: "Sức khoẻ tài chính", freq: "Tuần", priority: "Cấp thiết", owner: ["Vinh","Nga"], approver: "HuyL", format: "Dashboard", kpi: "Không phát sinh thâm hụt", dueDate: "SAT 17:00" },
  { code: "LHKNX01", name: "Kho – Nhập xuất kho", category: "Vận hành", freq: "Tháng", priority: "Trung bình", owner: ["Thu"], approver: "HuyL", format: "Excel", kpi: "Kiểm soát xuất kho", dueDate: "27 17:00" },
  { code: "LHKTK01", name: "Kho – Tồn kho", category: "Vận hành", freq: "Tháng", priority: "Cao", owner: ["Thu","Vinh"], approver: "HuyL", format: "Dashboard", kpi: "Định mức tồn kho", dueDate: "27 17:00" },
  { code: "LHHCNSNS01", name: "Nhân sự – KPI ca", category: "Vận hành", freq: "Tháng", priority: "Trung bình", owner: ["Thu"], approver: "HuyL", format: "Dashboard", kpi: "KPI > 70%", dueDate: "26 17:00" },
  { code: "LHMPP01", name: "Marketing – Dự án", category: "Vận hành", freq: "Tháng", priority: "Trung bình", owner: ["Vinh"], approver: "HuyL", format: "Excel", kpi: "% hoàn thành", dueDate: "27 17:00" },
  { code: "LHMCSKH01", name: "Chăm sóc khách hàng", category: "Vận hành", freq: "Tháng", priority: "Trung bình", owner: ["Vinh","HuyL"], approver: "HuyL", format: "PDF", kpi: "Tỷ lệ KH quay lại", dueDate: "05 17:00" },
  { code: "LHKDBC01", name: "Báo cáo HĐKD bán lẻ", category: "Hoạt động", freq: "Tuần", priority: "Cao", owner: ["HuyB"], approver: "HuyL", format: "PDF", kpi: "Doanh thu", dueDate: "SUN 22:00" },
  { code: "LHKDBB01", name: "Báo cáo HĐKD bán buôn", category: "Hoạt động", freq: "Tháng", priority: "Cao", owner: ["Vinh","HuyL"], approver: "HuyL", format: "PDF", kpi: "Doanh thu", dueDate: "02 17:00" },
  { code: "LHQTBCT01", name: "Dashboard tổng hợp HĐKD", category: "Quản trị", freq: "Tháng", priority: "Cấp thiết", owner: ["HuyL","Vinh"], approver: "Sếp Dương", format: "Dashboard", kpi: "Toàn bộ chỉ số KD", dueDate: "02 17:00" },
  { code: "LHMQP01", name: "Marketing – Theo dõi quý", category: "Vận hành", freq: "Quý", priority: "Trung bình", owner: ["Vinh"], approver: "HuyL", format: "Dashboard", kpi: "KPI marketing", dueDate: "LAST_DAY_QUARTER" },
  { code: "LHQTBCQ01", name: "Dashboard HĐKD + Tài chính quý", category: "Quản trị", freq: "Quý", priority: "Cấp thiết", owner: ["HuyL","Vinh"], approver: "Sếp Dương", format: "Dashboard", kpi: "Toàn bộ chỉ số", dueDate: "FIRST_DAY_NEXT_QUARTER" },
];

const STAFF = ["HuyL","Vinh","Thu","Nga","HuyB","Sếp Dương"];
const FREQ_LIST = ["Ngày","Tuần","Tháng","Quý"];

const PRIORITY_STYLE = {
  "Cấp thiết": { bg: "#FEECEC", text: "#B91C1C", dot: "#DC2626" },
  "Cao":       { bg: "#FEF3C7", text: "#92400E", dot: "#D97706" },
  "Trung bình":{ bg: "#EFF6FF", text: "#1D4ED8", dot: "#3B82F6" },
  "Thấp":      { bg: "#F3F4F6", text: "#374151", dot: "#9CA3AF" },
};

const FREQ_COLORS = { "Ngày":"#DC2626", "Tuần":"#D97706", "Tháng":"#2563EB", "Quý":"#7C3AED" };

const C = { crimson:"#7A0E20", gold:"#C4952A", crimsonLight:"#F9E8EA", goldLight:"#FDF5E0", white:"#FFFFFF", bg:"#FBF8F6", card:"#FFFFFF", border:"#E8D8C0", textDark:"#2D1A0E", textMid:"#6B4C2A", textLight:"#A08060" };

// ===== COMPONENTS =====
function Badge({ priority }) {
  const s = PRIORITY_STYLE[priority] || PRIORITY_STYLE["Thấp"];
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, background:s.bg, color:s.text, fontSize:11, fontWeight:600, padding:"2px 8px", borderRadius:999 }}>
      <span style={{ width:6, height:6, borderRadius:"50%", background:s.dot }} />
      {priority}
    </span>
  );
}

function FreqBadge({ freq }) {
  const color = FREQ_COLORS[freq] || "#6B7280";
  return <span style={{ display:"inline-block", background:color+"18", color, fontSize:11, fontWeight:600, padding:"2px 8px", borderRadius:999, border:`1px solid ${color}40` }}>{freq}</span>;
}

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{ background:C.card, borderRadius:14, border:`1.5px solid ${color}30`, padding:"18px 20px", flex:1, minWidth:130 }}>
      <div style={{ fontSize:12, color:C.textMid, fontWeight:500, marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:28, fontWeight:700, color }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:C.textLight, marginTop:2 }}>{sub}</div>}
    </div>
  );
}

// ===== EXTRACT WITH CHATGPT =====
async function callChatGPTExtract(file, reportCode) {
  const catalog = REPORTS_CATALOG.find(r => r.code === reportCode);
  
  const toBase64 = f => new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result.split(",")[1]);
    reader.onerror = () => rej(new Error("Read failed"));
    reader.readAsDataURL(f);
  });

  const base64 = await toBase64(file);
  const isPDF = file.type === "application/pdf";

  const prompt = `Bạn là trợ lý phân tích báo cáo cho Nhà sách Long Hưng.
Báo cáo: ${catalog?.name} (Mã: ${reportCode})
KPI chính: ${catalog?.kpi}

Trích xuất thông tin quan trọng từ tài liệu và trả về JSON:
{
  "period": "khoảng thời gian",
  "summary": "tóm tắt 1-2 câu",
  "metrics": {
    "Chỉ số 1": "giá trị 1",
    "Chỉ số 2": "giá trị 2",
    "Chỉ số 3": "giá trị 3",
    "Chỉ số 4": "giá trị 4",
    "Chỉ số 5": "giá trị 5"
  },
  "alerts": ["cảnh báo nếu có vấn đề"]
}`;

  try {
    const response = await axios.post("https://api.openai.com/v1/chat/completions", {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: isPDF 
            ? [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: `data:application/pdf;base64,${base64}`, detail: "low" } }
              ]
            : [{ type: "text", text: prompt + "\n\nFile: " + file.name }]
        }
      ],
      max_tokens: 1000,
      temperature: 0.3
    }, {
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      }
    });

    const text = response.data.choices[0].message.content;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    return parsed;
  } catch (error) {
    console.error("ChatGPT error:", error);
    return {
      period: "N/A",
      summary: "Lỗi trích xuất: " + error.message,
      metrics: { "Trạng thái": "Lỗi" },
      alerts: ["Không thể trích xuất dữ liệu"]
    };
  }
}

// ===== SEND TO APPS SCRIPT =====
async function sendToAppsScript(payload) {
  try {
    const response = await axios.post(APPS_SCRIPT_URL, payload, {
      headers: { "Content-Type": "application/json" }
    });
    return { ok: true, data: response.data };
  } catch (error) {
    console.error("Apps Script error:", error);
    return { ok: false, error: error.message };
  }
}

// ===== MAIN APP =====
export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [reports, setReports] = useState([]);
  const [catalog, setCatalog] = useState(REPORTS_CATALOG);
  const [selectedCode, setSelectedCode] = useState("");
  const [submitter, setSubmitter] = useState("");
  const [file, setFile] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState(null);
  const [submitNote, setSubmitNote] = useState("");
  const [filterPerson, setFilterPerson] = useState("Tất cả");
  const [filterFreq, setFilterFreq] = useState("Tất cả");
  const [detailReport, setDetailReport] = useState(null);
  const [approverMode, setApproverMode] = useState(false);
  const [approverUser, setApproverUser] = useState("");
  const [draggedAssign, setDraggedAssign] = useState(null);
  const fileRef = useRef(null);
  const primaryColor = C.crimson;

  // Tải báo cáo từ Apps Script
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await axios.get(`${APPS_SCRIPT_URL}?action=getReports`);
        setReports(response.data || []);
      } catch (error) {
        console.log("Loaded demo data instead");
        setReports([]);
      }
    };
    fetchReports();
  }, []);

  const filteredCatalog = catalog.filter(r => {
    const byPerson = filterPerson === "Tất cả" || r.owner.includes(filterPerson);
    const byFreq = filterFreq === "Tất cả" || r.freq === filterFreq;
    return byPerson && byFreq;
  });

  const handleExtract = async () => {
    if (!file || !selectedCode) return;
    setExtracting(true);
    try {
      const result = await callChatGPTExtract(file, selectedCode);
      setExtracted(result);
    } catch (e) {
      setExtracted({ period:"Lỗi", summary:e.message, metrics:{}, alerts:[] });
    }
    setExtracting(false);
  };

  const handleSubmit = async () => {
    if (!selectedCode || !submitter) return;
    
    const reportCatalog = REPORTS_CATALOG.find(r => r.code === selectedCode);
    const now = new Date();
    const formattedDate = format(now, "dd/MM/yyyy HH:mm", { locale: vi });

    const newReport = {
      id: Date.now(),
      code: selectedCode,
      name: reportCatalog?.name || selectedCode,
      submittedBy: submitter,
      submittedAt: formattedDate,
      period: extracted?.period || "N/A",
      status: "Chờ duyệt",
      file: file?.name || "Không có file",
      extracted: extracted?.metrics || {},
      summary: extracted?.summary || "",
      alerts: extracted?.alerts || [],
      note: submitNote,
      fileUrl: "",
      approver: reportCatalog?.approver || "HuyL"
    };

    // Chuẩn bị payload gửi Apps Script
    const payload = {
      ...newReport,
      metrics: newReport.extracted,
      fileContent: file ? await fileToBase64(file) : null
    };

    const result = await sendToAppsScript(payload);
    
    if (result.ok) {
      setReports(prev => [{ ...newReport, fileUrl: result.data?.fileUrl || "" }, ...prev]);
      setSelectedCode("");
      setSubmitter("");
      setFile(null);
      setExtracted(null);
      setSubmitNote("");
      setTab("history");
      alert("✅ Báo cáo đã được nộp thành công!");
    } else {
      alert("❌ Lỗi: " + result.error);
    }
  };

  const fileToBase64 = (file) => new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result.split(",")[1]);
    reader.onerror = () => rej(new Error("Read failed"));
    reader.readAsAsArrayBuffer(file);
  });

  const handleDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    const reportCode = draggableId;
    const newOwner = destination.droppableId;

    setCatalog(prev => prev.map(r => 
      r.code === reportCode 
        ? { ...r, owner: [newOwner] }
        : r
    ));
  };

  const updateReportStatus = async (reportId, newStatus) => {
    try {
      await axios.get(`${APPS_SCRIPT_URL}?action=updateStatus&reportId=${reportId}&status=${newStatus}`);
      setReports(prev => prev.map(r => 
        r.id === reportId ? { ...r, status: newStatus } : r
      ));
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const navItems = [
    { key:"dashboard", label:"Tổng quan", icon:"📊" },
    { key:"submit", label:"Nộp báo cáo", icon:"📤" },
    { key:"history", label:"Lịch sử", icon:"📋" },
    { key:"schedule", label:"Lịch báo cáo", icon:"📅" },
    { key:"approver", label:"Duyệt báo cáo", icon:"✅" },
    { key:"settings", label:"Cài đặt", icon:"⚙️" },
  ];

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"system-ui,-apple-system,sans-serif" }}>
      {/* HEADER */}
      <div style={{ background:`linear-gradient(135deg, ${primaryColor} 0%, #5C0E0E 100%)`, padding:"0 24px", boxShadow:"0 4px 20px rgba(0,0,0,0.25)" }}>
        <div style={{ maxWidth:1400, margin:"0 auto", display:"flex", alignItems:"center", gap:16, padding:"12px 0" }}>
          <img src={`data:image/jpeg;base64,${LOGO_B64}`} alt="Long Hung" style={{ width:52, height:52, borderRadius:"50%", border:"2px solid "+C.gold }} />
          <div>
            <div style={{ color:C.gold, fontWeight:800, fontSize:18, letterSpacing:0.5 }}>NHÀ SÁCH LONG HƯNG</div>
            <div style={{ color:"rgba(255,255,255,0.75)", fontSize:11, fontWeight:500 }}>Hệ thống quản lý báo cáo vận hành</div>
          </div>
          <div style={{ flex:1 }} />
          <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
            {navItems.map(n => (
              <button key={n.key} onClick={() => setTab(n.key)} style={{ background: tab===n.key ? C.gold : "rgba(255,255,255,0.12)", color: tab===n.key ? "#2D1A0E" : "rgba(255,255,255,0.85)", border:"none", borderRadius:8, padding:"7px 14px", cursor:"pointer", fontSize:12, fontWeight:tab===n.key?700:500, display:"flex", alignItems:"center", gap:5, transition:"all 0.2s" }}>
                <span>{n.icon}</span> {n.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:1400, margin:"0 auto", padding:"24px" }}>

        {/* ===== DASHBOARD ===== */}
        {tab === "dashboard" && (
          <div>
            <h2 style={{ fontSize:20, fontWeight:700, color:C.textDark, marginBottom:6 }}>Tổng quan vận hành</h2>
            <p style={{ color:C.textMid, fontSize:13, marginBottom:24 }}>Business Rhythm – Nhịp độ báo cáo tháng {format(new Date(), "MM/yyyy", { locale: vi })}</p>
            
            <div style={{ display:"flex", gap:14, marginBottom:24, flexWrap:"wrap" }}>
              <StatCard label="Tổng báo cáo" value={catalog.length} sub="trong hệ thống" color={primaryColor} />
              <StatCard label="Báo cáo Ngày" value={catalog.filter(r=>r.freq==="Ngày").length} sub="mỗi ngày" color="#DC2626" />
              <StatCard label="Báo cáo Tuần" value={catalog.filter(r=>r.freq==="Tuần").length} sub="mỗi tuần" color="#D97706" />
              <StatCard label="Báo cáo Tháng" value={catalog.filter(r=>r.freq==="Tháng").length} sub="mỗi tháng" color="#2563EB" />
              <StatCard label="Báo cáo Quý" value={catalog.filter(r=>r.freq==="Quý").length} sub="mỗi quý" color="#7C3AED" />
              <StatCard label="Đã nộp" value={reports.length} sub={reports.filter(r=>r.status==="Đã duyệt").length + " đã duyệt"} color="#059669" />
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
              {/* Recent */}
              <div style={{ background:C.card, borderRadius:14, border:`1px solid ${C.border}`, padding:20 }}>
                <h3 style={{ fontSize:14, fontWeight:700, color:C.textDark, marginBottom:16 }}>📄 Báo cáo vừa nộp</h3>
                {reports.slice(0,4).map(r => (
                  <div key={r.id} onClick={() => setDetailReport(r)} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:`1px solid ${C.border}`, cursor:"pointer" }}>
                    <div style={{ width:36, height:36, borderRadius:"50%", background:primaryColor+"15", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>📄</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:C.textDark }}>{r.name}</div>
                      <div style={{ fontSize:11, color:C.textMid }}>{r.submittedBy} · {r.submittedAt}</div>
                    </div>
                    <span style={{ fontSize:11, fontWeight:600, padding:"3px 8px", borderRadius:999, background: r.status==="Đã duyệt" ? "#D1FAE5" : "#FEF3C7", color: r.status==="Đã duyệt" ? "#065F46" : "#92400E" }}>{r.status}</span>
                  </div>
                ))}
              </div>

              {/* Upcoming */}
              <div style={{ background:C.card, borderRadius:14, border:`1px solid ${C.border}`, padding:20 }}>
                <h3 style={{ fontSize:14, fontWeight:700, color:C.textDark, marginBottom:16 }}>📅 Cần nộp</h3>
                {catalog.filter(r => r.priority === "Cấp thiết" || r.priority === "Cao").slice(0,5).map(r => (
                  <div key={r.code} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:`1px solid ${C.border}` }}>
                    <FreqBadge freq={r.freq} />
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, fontWeight:600, color:C.textDark }}>{r.name}</div>
                      <div style={{ fontSize:11, color:C.textMid }}>{r.dueDate || "Không có deadline"} · {r.owner.join(", ")}</div>
                    </div>
                    <Badge priority={r.priority} />
                  </div>
                ))}
              </div>
            </div>

            {detailReport && (
              <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }} onClick={() => setDetailReport(null)}>
                <div onClick={e => e.stopPropagation()} style={{ background:C.card, borderRadius:16, padding:28, maxWidth:520, width:"90%", maxHeight:"80vh", overflowY:"auto" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
                    <div>
                      <div style={{ fontSize:15, fontWeight:700, color:C.textDark }}>{detailReport.name}</div>
                      <div style={{ fontSize:12, color:C.textMid, marginTop:2 }}>{detailReport.code} · {detailReport.period}</div>
                    </div>
                    <button onClick={() => setDetailReport(null)} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:C.textMid }}>✕</button>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
                    {Object.entries(detailReport.extracted || {}).map(([k,v]) => (
                      <div key={k} style={{ background:C.bg, borderRadius:10, padding:"10px 12px" }}>
                        <div style={{ fontSize:10, color:C.textLight, fontWeight:600, textTransform:"uppercase", marginBottom:3 }}>{k}</div>
                        <div style={{ fontSize:13, fontWeight:700, color:primaryColor }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  {detailReport.summary && <div style={{ background:C.crimsonLight, borderRadius:10, padding:12, fontSize:12, color:C.textDark }}>{detailReport.summary}</div>}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== SUBMIT ===== */}
        {tab === "submit" && (
          <div style={{ maxWidth:780, margin:"0 auto" }}>
            <h2 style={{ fontSize:20, fontWeight:700, color:C.textDark, marginBottom:6 }}>Nộp báo cáo mới</h2>
            <p style={{ color:C.textMid, fontSize:13, marginBottom:24 }}>Chọn loại báo cáo, tải file lên và trích xuất dữ liệu bằng ChatGPT</p>

            <div style={{ background:C.card, borderRadius:16, border:`1px solid ${C.border}`, padding:28 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14, marginBottom:20 }}>
                <div>
                  <label style={{ fontSize:12, fontWeight:600, color:C.textMid, display:"block", marginBottom:6 }}>Người báo cáo</label>
                  <select value={submitter} onChange={e => setSubmitter(e.target.value)} style={{ width:"100%", padding:"9px 12px", borderRadius:9, border:`1.5px solid ${C.border}`, fontSize:13, background:C.bg, color:C.textDark }}>
                    <option value="">-- Chọn người --</option>
                    {STAFF.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:12, fontWeight:600, color:C.textMid, display:"block", marginBottom:6 }}>Lọc tần suất</label>
                  <select value={filterFreq} onChange={e => setFilterFreq(e.target.value)} style={{ width:"100%", padding:"9px 12px", borderRadius:9, border:`1.5px solid ${C.border}`, fontSize:13, background:C.bg, color:C.textDark }}>
                    <option>Tất cả</option>
                    {FREQ_LIST.map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:12, fontWeight:600, color:C.textMid, display:"block", marginBottom:6 }}>Lọc theo người</label>
                  <select value={filterPerson} onChange={e => setFilterPerson(e.target.value)} style={{ width:"100%", padding:"9px 12px", borderRadius:9, border:`1.5px solid ${C.border}`, fontSize:13, background:C.bg, color:C.textDark }}>
                    <option>Tất cả</option>
                    {STAFF.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom:20 }}>
                <label style={{ fontSize:12, fontWeight:600, color:C.textMid, display:"block", marginBottom:8 }}>Loại báo cáo <span style={{ color:"#DC2626" }}>*</span></label>
                <div style={{ display:"grid", gap:8, maxHeight:260, overflowY:"auto", paddingRight:4 }}>
                  {filteredCatalog.map(r => (
                    <div key={r.code} onClick={() => setSelectedCode(r.code)} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", borderRadius:10, border:`2px solid ${selectedCode===r.code ? primaryColor : C.border}`, background: selectedCode===r.code ? primaryColor+"0D" : C.bg, cursor:"pointer", transition:"all 0.15s" }}>
                      <div style={{ width:36, height:36, borderRadius:"50%", background: selectedCode===r.code ? primaryColor : primaryColor+"20", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:14, color: selectedCode===r.code ? "white" : primaryColor, fontWeight:700 }}>
                        {r.code.charAt(2).toUpperCase()}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:C.textDark }}>{r.name}</div>
                        <div style={{ fontSize:11, color:C.textMid, marginTop:1 }}>{r.code} · {r.dueDate || "Không deadline"}</div>
                      </div>
                      <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
                        <FreqBadge freq={r.freq} />
                        <Badge priority={r.priority} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom:20 }}>
                <label style={{ fontSize:12, fontWeight:600, color:C.textMid, display:"block", marginBottom:8 }}>Tải file báo cáo lên</label>
                <div onClick={() => fileRef.current?.click()} style={{ border:`2px dashed ${file ? primaryColor : C.border}`, borderRadius:12, padding:"24px", textAlign:"center", cursor:"pointer", background: file ? primaryColor+"08" : C.bg, transition:"all 0.2s" }}>
                  {file ? (
                    <div>
                      <div style={{ fontSize:28, marginBottom:6 }}>📄</div>
                      <div style={{ fontSize:13, fontWeight:600, color:primaryColor }}>{file.name}</div>
                      <div style={{ fontSize:11, color:C.textLight, marginTop:2 }}>{(file.size/1024).toFixed(1)} KB</div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize:32, marginBottom:8 }}>📂</div>
                      <div style={{ fontSize:13, fontWeight:600, color:C.textMid }}>Nhấp để chọn file</div>
                      <div style={{ fontSize:11, color:C.textLight, marginTop:3 }}>PDF, Excel, ảnh · Tối đa 10MB</div>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" style={{ display:"none" }} onChange={e => { setFile(e.target.files[0]); setExtracted(null); }} />
              </div>

              <div style={{ marginBottom:20 }}>
                <label style={{ fontSize:12, fontWeight:600, color:C.textMid, display:"block", marginBottom:6 }}>Ghi chú (tuỳ chọn)</label>
                <textarea value={submitNote} onChange={e => setSubmitNote(e.target.value)} placeholder="Ghi chú về báo cáo..." style={{ width:"100%", padding:"9px 12px", borderRadius:9, border:`1.5px solid ${C.border}`, fontSize:13, resize:"vertical", minHeight:60, background:C.bg, color:C.textDark, boxSizing:"border-box" }} />
              </div>

              <div style={{ display:"flex", gap:12, marginBottom: extracted ? 20 : 0 }}>
                <button onClick={handleExtract} disabled={!file || !selectedCode || extracting} style={{ flex:1, background: (!file||!selectedCode||extracting) ? "#D1D5DB" : C.gold, color: (!file||!selectedCode||extracting) ? "#9CA3AF" : "#2D1A0E", border:"none", borderRadius:10, padding:"12px", cursor: (!file||!selectedCode||extracting) ? "not-allowed" : "pointer", fontSize:13, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                  {extracting ? <><span>⟳</span> Đang phân tích...</> : <><span>🤖</span> Trích xuất với ChatGPT</>}
                </button>
                <button onClick={handleSubmit} disabled={!selectedCode || !submitter || extracting} style={{ flex:1, background: (!selectedCode||!submitter||extracting) ? "#D1D5DB" : primaryColor, color: (!selectedCode||!submitter||extracting) ? "#9CA3AF" : "white", border:"none", borderRadius:10, padding:"12px", cursor: (!selectedCode||!submitter||extracting) ? "not-allowed" : "pointer", fontSize:13, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                  <span>✅</span> Xác nhận nộp
                </button>
              </div>

              {extracted && (
                <div style={{ background:"#F0FDF4", border:"1.5px solid #86EFAC", borderRadius:12, padding:20 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                    <span>✨</span>
                    <span style={{ fontSize:13, fontWeight:700, color:"#065F46" }}>Trích xuất thành công</span>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                    {Object.entries(extracted.metrics).map(([k,v]) => (
                      <div key={k} style={{ background:"white", borderRadius:8, padding:"8px 10px", borderLeft:`3px solid ${primaryColor}` }}>
                        <div style={{ fontSize:10, color:C.textLight, fontWeight:600 }}>{k}</div>
                        <div style={{ fontSize:12, fontWeight:700, color:C.textDark }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== HISTORY ===== */}
        {tab === "history" && (
          <div>
            <h2 style={{ fontSize:20, fontWeight:700, color:C.textDark, marginBottom:6 }}>Lịch sử báo cáo</h2>
            <p style={{ color:C.textMid, fontSize:13, marginBottom:24 }}>Danh sách tất cả báo cáo đã nộp</p>

            <div style={{ background:C.card, borderRadius:14, border:`1px solid ${C.border}`, padding:20, overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr style={{ borderBottom:`2px solid ${C.border}` }}>
                    <th style={{ textAlign:"left", padding:"12px 8px", fontSize:12, fontWeight:700, color:C.textMid }}>Báo cáo</th>
                    <th style={{ textAlign:"left", padding:"12px 8px", fontSize:12, fontWeight:700, color:C.textMid }}>Người nộp</th>
                    <th style={{ textAlign:"left", padding:"12px 8px", fontSize:12, fontWeight:700, color:C.textMid }}>Ngày nộp</th>
                    <th style={{ textAlign:"left", padding:"12px 8px", fontSize:12, fontWeight:700, color:C.textMid }}>Kỳ</th>
                    <th style={{ textAlign:"left", padding:"12px 8px", fontSize:12, fontWeight:700, color:C.textMid }}>Trạng thái</th>
                    <th style={{ textAlign:"center", padding:"12px 8px", fontSize:12, fontWeight:700, color:C.textMid }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map(r => (
                    <tr key={r.id} style={{ borderBottom:`1px solid ${C.border}` }}>
                      <td style={{ padding:"12px 8px" }}>
                        <div style={{ fontSize:12, fontWeight:600, color:C.textDark }}>{r.name}</div>
                        <div style={{ fontSize:11, color:C.textMid }}>{r.code}</div>
                      </td>
                      <td style={{ padding:"12px 8px", fontSize:12, color:C.textDark }}>{r.submittedBy}</td>
                      <td style={{ padding:"12px 8px", fontSize:12, color:C.textMid }}>{r.submittedAt}</td>
                      <td style={{ padding:"12px 8px", fontSize:12, color:C.textMid }}>{r.period}</td>
                      <td style={{ padding:"12px 8px" }}>
                        <span style={{ fontSize:11, fontWeight:600, padding:"3px 8px", borderRadius:999, background: r.status==="Đã duyệt" ? "#D1FAE5" : r.status==="Từ chối" ? "#FEE2E2" : "#FEF3C7", color: r.status==="Đã duyệt" ? "#065F46" : r.status==="Từ chối" ? "#991B1B" : "#92400E" }}>
                          {r.status}
                        </span>
                      </td>
                      <td style={{ padding:"12px 8px", textAlign:"center" }}>
                        <button onClick={() => setDetailReport(r)} style={{ background:"none", border:"none", color:primaryColor, cursor:"pointer", fontSize:12, fontWeight:600 }}>Xem</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {reports.length === 0 && <div style={{ textAlign:"center", padding:40, color:C.textLight }}>Chưa có báo cáo nào</div>}
            </div>
          </div>
        )}

        {/* ===== SCHEDULE ===== */}
        {tab === "schedule" && (
          <DragDropContext onDragEnd={handleDragEnd}>
            <h2 style={{ fontSize:20, fontWeight:700, color:C.textDark, marginBottom:6 }}>Lịch báo cáo & Phân công</h2>
            <p style={{ color:C.textMid, fontSize:13, marginBottom:24 }}>Kéo thả để đổi người được assign báo cáo (không áp dụng cho báo cáo hàng ngày)</p>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(250px, 1fr))", gap:16 }}>
              {STAFF.map(person => (
                <Droppable key={person} droppableId={person}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      style={{
                        background:C.card,
                        borderRadius:14,
                        border:`2px solid ${snapshot.isDraggingOver ? primaryColor : C.border}`,
                        padding:16,
                        minHeight:400,
                        background: snapshot.isDraggingOver ? primaryColor+"08" : C.card
                      }}
                    >
                      <h3 style={{ fontSize:14, fontWeight:700, color:C.textDark, marginBottom:12 }}>👤 {person}</h3>
                      {catalog
                        .filter(r => r.owner.includes(person) && r.freq !== "Ngày")
                        .map((report, idx) => (
                          <Draggable key={report.code} draggableId={report.code} index={idx}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={{
                                  background:C.bg,
                                  borderRadius:8,
                                  padding:10,
                                  marginBottom:8,
                                  border:`1px solid ${C.border}`,
                                  background: snapshot.isDragging ? primaryColor+"20" : C.bg,
                                  cursor:"grab",
                                  ...provided.draggableProps.style
                                }}
                              >
                                <div style={{ fontSize:12, fontWeight:600, color:C.textDark }}>{report.name}</div>
                                <div style={{ fontSize:10, color:C.textMid, marginTop:4 }}>
                                  {report.dueDate && <div>📅 {report.dueDate}</div>}
                                  <div>🎯 {report.kpi}</div>
                                </div>
                                <Badge priority={report.priority} />
                              </div>
                            )}
                          </Draggable>
                        ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              ))}
            </div>
          </DragDropContext>
        )}

        {/* ===== APPROVER ===== */}
        {tab === "approver" && (
          <div>
            <h2 style={{ fontSize:20, fontWeight:700, color:C.textDark, marginBottom:6 }}>Duyệt báo cáo</h2>
            <p style={{ color:C.textMid, fontSize:13, marginBottom:24 }}>Duyệt hoặc từ chối báo cáo đã nộp</p>

            {/* Approver filter */}
            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:12, fontWeight:600, color:C.textMid, display:"block", marginBottom:8 }}>Lọc theo người duyệt</label>
              <select value={approverUser} onChange={e => setApproverUser(e.target.value)} style={{ padding:"9px 12px", borderRadius:9, border:`1.5px solid ${C.border}`, fontSize:13, background:C.bg, color:C.textDark }}>
                <option value="">Tất cả</option>
                {STAFF.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(300px, 1fr))", gap:16 }}>
              {reports
                .filter(r => r.status === "Chờ duyệt" && (!approverUser || r.approver === approverUser))
                .map(r => (
                  <div key={r.id} style={{ background:C.card, borderRadius:14, border:`1px solid ${C.border}`, padding:20 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                      <div>
                        <div style={{ fontSize:13, fontWeight:700, color:C.textDark }}>{r.name}</div>
                        <div style={{ fontSize:11, color:C.textMid, marginTop:2 }}>{r.code} · {r.period}</div>
                      </div>
                      <Badge priority={REPORTS_CATALOG.find(x => x.code === r.code)?.priority || "Thấp"} />
                    </div>

                    <div style={{ background:C.bg, borderRadius:10, padding:10, marginBottom:12 }}>
                      <div style={{ fontSize:11, color:C.textLight, fontWeight:600, marginBottom:4 }}>TÓMLẠI</div>
                      <div style={{ fontSize:12, color:C.textDark }}>{r.summary}</div>
                    </div>

                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
                      {Object.entries(r.extracted).slice(0,4).map(([k,v]) => (
                        <div key={k} style={{ background:C.bg, borderRadius:8, padding:"8px 10px" }}>
                          <div style={{ fontSize:10, color:C.textLight }}>{k}</div>
                          <div style={{ fontSize:11, fontWeight:700, color:C.textDark }}>{v}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{ fontSize:11, color:C.textMid, marginBottom:12 }}>
                      <div>👤 {r.submittedBy} - {r.submittedAt}</div>
                      {r.note && <div style={{ marginTop:6 }}>📝 {r.note}</div>}
                    </div>

                    <div style={{ display:"flex", gap:8 }}>
                      <button onClick={() => updateReportStatus(r.id, "Đã duyệt")} style={{ flex:1, background:"#10B981", color:"white", border:"none", borderRadius:8, padding:"8px", cursor:"pointer", fontSize:12, fontWeight:600 }}>
                        ✅ Duyệt
                      </button>
                      <button onClick={() => updateReportStatus(r.id, "Từ chối")} style={{ flex:1, background:"#EF4444", color:"white", border:"none", borderRadius:8, padding:"8px", cursor:"pointer", fontSize:12, fontWeight:600 }}>
                        ❌ Từ chối
                      </button>
                    </div>
                  </div>
                ))}
            </div>
            {reports.filter(r => r.status === "Chờ duyệt").length === 0 && <div style={{ textAlign:"center", padding:40, color:C.textLight }}>Không có báo cáo chờ duyệt</div>}
          </div>
        )}

        {/* ===== SETTINGS ===== */}
        {tab === "settings" && (
          <div style={{ maxWidth:600 }}>
            <h2 style={{ fontSize:20, fontWeight:700, color:C.textDark, marginBottom:24 }}>Cài đặt</h2>

            <div style={{ background:C.card, borderRadius:14, border:`1px solid ${C.border}`, padding:20, marginBottom:16 }}>
              <label style={{ fontSize:12, fontWeight:600, color:C.textMid, display:"block", marginBottom:8 }}>🔑 ChatGPT API Key</label>
              <input 
                type="password" 
                value={OPENAI_API_KEY} 
                readOnly
                style={{ width:"100%", padding:"9px 12px", borderRadius:9, border:`1.5px solid ${C.border}`, fontSize:12, background:C.bg, color:C.textDark, boxSizing:"border-box" }} 
              />
              <div style={{ fontSize:11, color:C.textLight, marginTop:6 }}>Được lưu ở client. Thay đổi: Trang Settings của bạn</div>
            </div>

            <div style={{ background:C.card, borderRadius:14, border:`1px solid ${C.border}`, padding:20, marginBottom:16 }}>
              <label style={{ fontSize:12, fontWeight:600, color:C.textMid, display:"block", marginBottom:8 }}>🔗 Apps Script URL</label>
              <input 
                type="text" 
                value={APPS_SCRIPT_URL} 
                readOnly
                style={{ width:"100%", padding:"9px 12px", borderRadius:9, border:`1.5px solid ${C.border}`, fontSize:12, background:C.bg, color:C.textDark, boxSizing:"border-box" }} 
              />
              <div style={{ fontSize:11, color:C.textLight, marginTop:6 }}>Điểm kết nối Google Apps Script</div>
            </div>

            <div style={{ background:C.card, borderRadius:14, border:`1px solid ${C.border}`, padding:20 }}>
              <label style={{ fontSize:12, fontWeight:600, color:C.textMid, display:"block", marginBottom:8 }}>📊 Tổng số báo cáo trong hệ thống</label>
              <div style={{ fontSize:24, fontWeight:700, color:primaryColor }}>{catalog.length}</div>
              <div style={{ fontSize:12, color:C.textMid, marginTop:8 }}>
                <div>• Hàng ngày: {catalog.filter(r => r.freq === "Ngày").length}</div>
                <div>• Hàng tuần: {catalog.filter(r => r.freq === "Tuần").length}</div>
                <div>• Hàng tháng: {catalog.filter(r => r.freq === "Tháng").length}</div>
                <div>• Hàng quý: {catalog.filter(r => r.freq === "Quý").length}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}