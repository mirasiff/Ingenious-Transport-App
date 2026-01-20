import React, { useState, useEffect, useRef } from "react";
import {
  Bus,
  Gauge,
  ClipboardList,
  Settings,
  FileText,
  Trash2,
  ChevronRight,
  Save,
  Clock,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Database,
  Upload,
  Download,
  RefreshCw,
  FileSpreadsheet,
  Droplet,
  Fuel,
  User,
  Phone,
  XCircle,
  Calculator,
  PlusCircle,
  Shield,
  Edit3,
  Edit,
} from "lucide-react";
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
  writeBatch,
  getDocs,
} from "firebase/firestore";

// =========================================================
// 1. PASTE YOUR REAL FIREBASE KEYS HERE (OVER THIS BLOCK)
// =========================================================
const firebaseConfig = {
  apiKey: "AIzaSyB4k8f-Mt1RnsiJArdVhM9bfH2UMXLDq78",
  authDomain: "ingenious-school-transport-mgt.firebaseapp.com",
  projectId: "ingenious-school-transport-mgt",
  storageBucket: "ingenious-school-transport-mgt.firebasestorage.app",
  messagingSenderId: "99635710158",
  appId: "1:99635710158:web:d4b1b05c845130cdf1689f",
  measurementId: "G-LVPDY6DTP3",
};
// =========================================================

// --- CONFIG CHECKER ---
const getFirebaseConfig = () => {
  if (typeof __firebase_config !== "undefined")
    return JSON.parse(__firebase_config);
  return firebaseConfig;
};

const finalConfig = getFirebaseConfig();
let app, auth, db;
if (finalConfig.apiKey !== "PASTE_YOUR_KEYS_HERE") {
  app = initializeApp(finalConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}

const appId = "ingenious-transport-mgt";

// --- THEME SETTINGS ---
const COLORS = {
  bg: "#1E140F",
  card: "#2C1E16",
  accent: "#C19A6B",
  text: "#F2E6D8",
  subtext: "#8D6E63",
  border: "#4A3426",
  inputBg: "#120B09",
  danger: "#EF9A9A",
  success: "#A5D6A7",
  fuel: "#FFB74D",
  adblue: "#4FC3F7",
};

const STYLES = {
  container: {
    backgroundColor: COLORS.bg,
    color: COLORS.text,
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    fontFamily: "sans-serif",
    overflow: "hidden",
  },
  header: {
    backgroundColor: COLORS.card,
    padding: "16px",
    borderBottom: `1px solid ${COLORS.border}`,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
  },
  main: { flex: 1, overflowY: "auto", padding: "16px", paddingBottom: "120px" },
  card: {
    backgroundColor: COLORS.card,
    padding: "16px",
    borderRadius: "12px",
    border: `1px solid ${COLORS.border}`,
    marginBottom: "16px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.2)",
  },
  input: {
    width: "100%",
    padding: "14px",
    backgroundColor: COLORS.inputBg,
    border: `1px solid ${COLORS.border}`,
    color: COLORS.text,
    borderRadius: "8px",
    marginBottom: "12px",
    fontSize: "16px",
    outline: "none",
  },
  label: {
    fontSize: "10px",
    color: COLORS.subtext,
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: "4px",
    display: "block",
  },
  btnPrimary: {
    width: "100%",
    padding: "14px",
    backgroundColor: COLORS.accent,
    color: "#1E140F",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: "8px",
    boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  btnSecondary: {
    padding: "8px 12px",
    backgroundColor: COLORS.border,
    color: COLORS.accent,
    border: "none",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "bold",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  btnSmall: {
    padding: "8px 12px",
    backgroundColor: COLORS.accent,
    color: "#1E140F",
    border: "none",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  nav: {
    position: "fixed",
    bottom: 0,
    width: "100%",
    backgroundColor: COLORS.card,
    borderTop: `1px solid ${COLORS.border}`,
    display: "flex",
    justifyContent: "space-around",
    height: "70px",
    alignItems: "center",
    zIndex: 10,
  },
};

// --- HELPER FUNCTIONS ---
const downloadCSV = (data, filename) => {
  if (!data || !data.length) return;
  const keys = Object.keys(data[0]);
  const csv = [
    keys.join(","),
    ...data.map((row) => keys.map((k) => `"${row[k] || ""}"`).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
};

const downloadJSON = (data, filename) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
};

// --- MAIN APP COMPONENT ---
export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("dashboard");
  const [buses, setBuses] = useState([]);
  const [entries, setEntries] = useState([]);
  const [fuelLogs, setFuelLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [targetBusId, setTargetBusId] = useState(null);
  const [viewBusId, setViewBusId] = useState(null);
  const [notification, setNotification] = useState(null);

  const showNotif = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  if (!auth) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#1E140F] text-[#EF9A9A] p-10 text-center">
        <div>
          <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Configuration Needed</h2>
          <p>
            Please open <strong>App.js</strong> and scroll to line 29.
          </p>
          <p className="mt-2 text-sm text-[#8D6E63]">
            Paste your Firebase keys there.
          </p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    signInAnonymously(auth).catch(console.error);
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!user) return;
    const qBus = query(
      collection(db, "artifacts", appId, "public", "data", "buses")
    );
    const qEnt = query(
      collection(db, "artifacts", appId, "public", "data", "entries")
    );
    const qFuel = query(
      collection(db, "artifacts", appId, "public", "data", "fuel_logs")
    );

    const unsubB = onSnapshot(qBus, (s) =>
      setBuses(
        s.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => parseInt(a.busNumber) - parseInt(b.busNumber))
      )
    );
    const unsubE = onSnapshot(qEnt, (s) =>
      setEntries(
        s.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort(
            (a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)
          )
      )
    );
    const unsubF = onSnapshot(qFuel, (s) => {
      setFuelLogs(
        s.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort(
            (a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)
          )
      );
      setLoading(false);
    });
    return () => {
      unsubB();
      unsubE();
      unsubF();
    };
  }, [user]);

  // View Handlers
  const handleEditEntry = (entry) => {
    setSelectedEntry(entry);
    setView("edit_log");
  };
  const handleViewEntry = (entry) => {
    setSelectedEntry(entry);
    setView("view_log");
  };
  const handleDirectLog = (busId) => {
    setTargetBusId(busId);
    setView("entry");
  };
  const handleViewProfile = (busId) => {
    setViewBusId(busId);
    setView("bus_profile");
  };
  const handleEditProfile = (busId) => {
    setViewBusId(busId);
    setView("edit_bus_profile");
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-[#1E140F] text-[#C19A6B] animate-pulse font-bold tracking-widest">
        INGENIOUS LOADING...
      </div>
    );

  return (
    <div style={STYLES.container}>
      <header style={STYLES.header}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Bus color={COLORS.accent} size={24} />
          <div>
            <h1 style={{ margin: 0, fontSize: "18px", fontWeight: "bold" }}>
              Ingenious
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: "10px",
                color: COLORS.accent,
                letterSpacing: "1px",
              }}
            >
              SCHOOL TRANSPORT MGMT
            </p>
          </div>
        </div>
      </header>

      {notification && (
        <div
          className={`fixed top-20 left-4 right-4 z-50 p-4 rounded-xl shadow-2xl flex items-center justify-center font-bold animate-bounce-short ${
            notification.type === "error"
              ? "bg-[#3E1010] text-[#EF9A9A] border border-[#EF9A9A]"
              : "bg-[#1B2E1E] text-[#A5D6A7] border border-[#A5D6A7]"
          }`}
        >
          {notification.type === "error" ? (
            <AlertCircle className="mr-2" />
          ) : (
            <CheckCircle className="mr-2" />
          )}
          {notification.message}
        </div>
      )}

      <main style={STYLES.main}>
        {view === "dashboard" && (
          <Dashboard
            buses={buses}
            entries={entries}
            onLog={handleDirectLog}
            onViewEntry={handleViewEntry}
            onViewProfile={handleViewProfile}
          />
        )}
        {view === "entry" && (
          <EntryForm
            buses={buses}
            setView={setView}
            preSelectedBusId={targetBusId}
            showNotif={showNotif}
          />
        )}
        {view === "fuel" && (
          <FuelManager
            buses={buses}
            fuelLogs={fuelLogs}
            setView={setView}
            showNotif={showNotif}
          />
        )}
        {view === "view_log" && (
          <ViewLogDetails
            entry={selectedEntry}
            setView={setView}
            handleEditEntry={handleEditEntry}
            buses={buses}
          />
        )}
        {view === "edit_log" && (
          <EditLogForm
            entry={selectedEntry}
            setView={setView}
            buses={buses}
            showNotif={showNotif}
          />
        )}
        {view === "docs" && <DocsView buses={buses} />}
        {view === "history" && (
          <ReportsView entries={entries} buses={buses} fuelLogs={fuelLogs} />
        )}
        {view === "admin" && (
          <AdminPanel
            buses={buses}
            entries={entries}
            fuelLogs={fuelLogs}
            showNotif={showNotif}
          />
        )}
        {view === "bus_profile" && (
          <BusProfileView
            busId={viewBusId}
            buses={buses}
            setView={setView}
            onEdit={handleEditProfile}
          />
        )}
        {view === "edit_bus_profile" && (
          <EditBusProfileForm
            busId={viewBusId}
            buses={buses}
            setView={setView}
            showNotif={showNotif}
          />
        )}
      </main>

      <div
        style={{
          position: "fixed",
          bottom: "70px",
          width: "100%",
          textAlign: "center",
          fontSize: "10px",
          color: COLORS.subtext,
          padding: "5px",
          backgroundColor: COLORS.bg,
          zIndex: 9,
          borderTop: `1px solid ${COLORS.card}`,
        }}
      >
        Created by Mir Murtaza Asif Bashir
      </div>

      <nav style={STYLES.nav}>
        <NavBtn
          icon={Gauge}
          label="Dash"
          active={view === "dashboard"}
          onClick={() => setView("dashboard")}
        />
        <NavBtn
          icon={Fuel}
          label="Refuel"
          active={view === "fuel"}
          onClick={() => setView("fuel")}
        />
        <NavBtn
          icon={ClipboardList}
          label="Reports"
          active={view === "history"}
          onClick={() => setView("history")}
        />
        <NavBtn
          icon={FileText}
          label="Docs"
          active={view === "docs"}
          onClick={() => setView("docs")}
        />
        <NavBtn
          icon={Settings}
          label="Manage"
          active={view === "admin"}
          onClick={() => setView("admin")}
        />
      </nav>
    </div>
  );
}

const NavBtn = ({ icon: Icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all ${
      active
        ? "text-[#C19A6B] scale-105"
        : "text-[#5D4037] hover:text-[#8D6E63]"
    }`}
  >
    <Icon className={`h-6 w-6 ${active ? "stroke-[2.5px]" : "stroke-2"}`} />
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

// --- COMPONENT: ENTRY DETAILS VIEW (Read-Only) ---
const ViewLogDetails = ({ entry, setView, handleEditEntry, buses }) => {
  if (!entry) return null;
  const b = buses.find((x) => x.busNumber === entry.busNumber);
  const studentsAssigned = b?.assignedStudents || 0;
  const teachersAssigned = b?.assignedTeachers || 0;
  const stuAbsent = studentsAssigned - entry.studentsPresent;
  const tchAbsent = teachersAssigned - entry.teachersPresent;

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center mb-6">
        <button
          onClick={() => setView("dashboard")}
          className="mr-3 text-[#8D6E63]"
        >
          <ChevronRight className="rotate-180" />
        </button>
        <h2 className="text-xl font-bold text-[#F2E6D8]">Entry Details</h2>
      </div>
      <div style={STYLES.card}>
        <div className="flex justify-between items-center border-b border-[#4A3426] pb-3 mb-3">
          <span className="text-[#C19A6B] font-bold text-lg">
            Bus {entry.busNumber}
          </span>
          <span className="text-xs text-[#8D6E63]">
            {new Date(entry.timestamp?.seconds * 1000).toLocaleString()}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm text-[#F2E6D8] mb-4">
          <div>
            <p className="text-[#8D6E63] text-xs uppercase">Odometer</p>
            <p className="font-bold font-mono text-xl">{entry.odometer}</p>
          </div>
          <div>
            <p className="text-[#8D6E63] text-xs uppercase">Distance</p>
            <p className="font-bold text-xl">{entry.distance} km</p>
          </div>
          <div>
            <p className="text-[#8D6E63] text-xs uppercase">Students</p>
            <p className="font-bold">
              {entry.studentsPresent} (Abs: {stuAbsent})
            </p>
          </div>
          <div>
            <p className="text-[#8D6E63] text-xs uppercase">Teachers</p>
            <p className="font-bold">
              {entry.teachersPresent} (Abs: {tchAbsent})
            </p>
          </div>
        </div>
        <button
          onClick={() => handleEditEntry(entry)}
          style={STYLES.btnPrimary}
        >
          <Edit3 className="mr-2 h-4 w-4" /> Edit Record
        </button>
      </div>
    </div>
  );
};

// --- COMPONENT: BUS PROFILE VIEW ---
const BusProfileView = ({ busId, buses, setView, onEdit }) => {
  const b = buses.find((x) => x.id === busId);
  if (!b) return null;

  const check = (d) => {
    if (!d) return { c: "text-[#5D4037]", t: "N/A" };
    const days = Math.ceil((new Date(d) - new Date()) / 86400000);
    if (days < 0) return { c: "text-[#EF9A9A]", t: "EXPIRED" };
    if (days < 30) return { c: "text-[#FFE082]", t: "EXP SOON" };
    return { c: "text-[#A5D6A7]", t: "VALID" };
  };

  const docFields = [
    { k: "insuranceExpiry", l: "Insurance" },
    { k: "permitExpiry", l: "Route Permit" },
    { k: "taxExpiry", l: "Token Tax" },
    { k: "fitnessExpiry", l: "Fitness Cert" },
    { k: "pollutionExpiry", l: "Pollution (PUC)" },
    { k: "gpsExpiry", l: "GPS Cert" },
    { k: "cameraExpiry", l: "Camera App" },
    { k: "extinguisherExpiry", l: "Fire Ext." },
    { k: "firstAidExpiry", l: "First Aid" },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center mb-4">
        <button
          onClick={() => setView("dashboard")}
          className="mr-3 text-[#8D6E63]"
        >
          <ChevronRight className="rotate-180" />
        </button>
        <h2 className="text-xl font-bold text-[#F2E6D8]">
          Bus Profile: {b.busNumber}
        </h2>
      </div>

      <div style={STYLES.card}>
        <div className="flex justify-between items-center border-b border-[#4A3426] pb-3 mb-3">
          <span className="text-[#C19A6B] font-bold text-lg">
            {b.regNumber}
          </span>
          <span className="text-xs text-[#8D6E63]">{b.lastOdometer} km</span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4 border-b border-[#4A3426] pb-4">
          <div>
            <label style={STYLES.label}>Driver</label>
            <div className="text-[#F2E6D8] font-bold text-sm">
              {b.driverName || "-"}
            </div>
            {b.driverContact && (
              <a
                href={`tel:${b.driverContact}`}
                className="text-[#4FC3F7] text-xs flex items-center mt-1"
              >
                <Phone size={10} className="mr-1" /> {b.driverContact}
              </a>
            )}
          </div>
          <div>
            <label style={STYLES.label}>Attendant</label>
            <div className="text-[#F2E6D8] font-bold text-sm">
              {b.attendantName || "-"}
            </div>
            {b.attendantContact && (
              <a
                href={`tel:${b.attendantContact}`}
                className="text-[#4FC3F7] text-xs flex items-center mt-1"
              >
                <Phone size={10} className="mr-1" /> {b.attendantContact}
              </a>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label style={STYLES.label}>Capacity</label>
            <div className="text-[#F2E6D8] text-xs">
              {b.assignedStudents} Students
            </div>
            <div className="text-[#F2E6D8] text-xs">
              {b.assignedTeachers} Teachers
            </div>
          </div>
          <div>
            <label style={STYLES.label}>Fuel Specs</label>
            <div className="text-[#F2E6D8] text-xs">
              Tank: {b.tankCapacity || "-"} L
            </div>
            <div className="text-[#F2E6D8] text-xs">
              Mileage: {b.estMileage || "-"} km/L
            </div>
          </div>
        </div>

        <h4 className="text-[#C19A6B] text-xs font-bold uppercase mb-2 border-b border-[#4A3426] pb-1">
          Compliance Status
        </h4>
        <div className="grid grid-cols-2 gap-3 text-xs mb-4">
          {docFields.map((f) => {
            const s = check(b[f.k]);
            return (
              <div
                key={f.k}
                className="bg-[#120B09] p-2 rounded border border-[#4A3426]"
              >
                <div className="text-[#5D4037] uppercase text-[9px] font-bold mb-1">
                  {f.l}
                </div>
                <div className={`font-bold ${s.c}`}>{s.t}</div>
                <div className="text-[9px] text-[#8D6E63] mt-1">
                  {b[f.k] || "-"}
                </div>
              </div>
            );
          })}
        </div>

        <button onClick={() => onEdit(b.id)} style={STYLES.btnPrimary}>
          <Edit className="mr-2 h-4 w-4" /> EDIT PROFILE
        </button>
      </div>
    </div>
  );
};

// --- COMPONENT: EDIT BUS PROFILE FORM ---
const EditBusProfileForm = ({ busId, buses, setView, showNotif }) => {
  const b = buses.find((x) => x.id === busId);
  const [f, setF] = useState(b || {});

  const save = async () => {
    await updateDoc(
      doc(db, "artifacts", appId, "public", "data", "buses", busId),
      f
    );
    showNotif("BUS PROFILE UPDATED!");
    setView("bus_profile");
  };

  if (!b) return null;

  return (
    <div className="space-y-6 p-2">
      <div className="flex items-center mb-4">
        <button
          onClick={() => setView("bus_profile")}
          className="mr-3 text-[#8D6E63]"
        >
          <ChevronRight className="rotate-180" />
        </button>
        <h2 className="text-xl font-bold text-[#F2E6D8]">
          Edit Bus {b.busNumber}
        </h2>
      </div>
      <div style={STYLES.card}>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label style={STYLES.label}>BUS NO</label>
            <input
              className="w-full p-2 bg-[#120B09] border border-[#4A3426] rounded text-[#F2E6D8] text-sm"
              value={f.busNumber}
              onChange={(e) => setF({ ...f, busNumber: e.target.value })}
            />
          </div>
          <div>
            <label style={STYLES.label}>REG NO</label>
            <input
              className="w-full p-2 bg-[#120B09] border border-[#4A3426] rounded text-[#F2E6D8] text-sm"
              value={f.regNumber}
              onChange={(e) => setF({ ...f, regNumber: e.target.value })}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label style={STYLES.label}>DRIVER</label>
            <input
              className="w-full p-2 bg-[#120B09] border border-[#4A3426] rounded text-[#F2E6D8] text-sm"
              value={f.driverName}
              onChange={(e) => setF({ ...f, driverName: e.target.value })}
            />
          </div>
          <div>
            <label style={STYLES.label}>PHONE</label>
            <input
              className="w-full p-2 bg-[#120B09] border border-[#4A3426] rounded text-[#F2E6D8] text-sm"
              value={f.driverContact}
              onChange={(e) => setF({ ...f, driverContact: e.target.value })}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label style={STYLES.label}>ATTENDANT</label>
            <input
              className="w-full p-2 bg-[#120B09] border border-[#4A3426] rounded text-[#F2E6D8] text-sm"
              value={f.attendantName}
              onChange={(e) => setF({ ...f, attendantName: e.target.value })}
            />
          </div>
          <div>
            <label style={STYLES.label}>PHONE</label>
            <input
              className="w-full p-2 bg-[#120B09] border border-[#4A3426] rounded text-[#F2E6D8] text-sm"
              value={f.attendantContact}
              onChange={(e) => setF({ ...f, attendantContact: e.target.value })}
            />
          </div>
        </div>

        <h4 className="text-xs text-[#C19A6B] font-bold uppercase mt-4 mb-2">
          Capacities & Specs
        </h4>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label style={STYLES.label}>STU CAP</label>
            <input
              className="w-full p-2 bg-[#120B09] border border-[#4A3426] rounded text-[#F2E6D8] text-sm"
              type="number"
              value={f.assignedStudents}
              onChange={(e) => setF({ ...f, assignedStudents: e.target.value })}
            />
          </div>
          <div>
            <label style={STYLES.label}>TCH CAP</label>
            <input
              className="w-full p-2 bg-[#120B09] border border-[#4A3426] rounded text-[#F2E6D8] text-sm"
              type="number"
              value={f.assignedTeachers}
              onChange={(e) => setF({ ...f, assignedTeachers: e.target.value })}
            />
          </div>
          <div>
            <label style={STYLES.label}>TANK (L)</label>
            <input
              className="w-full p-2 bg-[#120B09] border border-[#4A3426] rounded text-[#F2E6D8] text-sm"
              type="number"
              value={f.tankCapacity}
              onChange={(e) => setF({ ...f, tankCapacity: e.target.value })}
            />
          </div>
          <div>
            <label style={STYLES.label}>MILEAGE</label>
            <input
              className="w-full p-2 bg-[#120B09] border border-[#4A3426] rounded text-[#F2E6D8] text-sm"
              type="number"
              value={f.estMileage}
              onChange={(e) => setF({ ...f, estMileage: e.target.value })}
            />
          </div>
        </div>

        <h4 className="text-xs text-[#C19A6B] font-bold uppercase mt-4 mb-2">
          Document Dates
        </h4>
        <div className="grid grid-cols-2 gap-3">
          {[
            "insuranceExpiry",
            "permitExpiry",
            "taxExpiry",
            "fitnessExpiry",
            "pollutionExpiry",
            "gpsExpiry",
            "cameraExpiry",
            "extinguisherExpiry",
            "firstAidExpiry",
          ].map((k) => (
            <div key={k}>
              <label style={STYLES.label}>
                {k.replace("Expiry", "").toUpperCase()}
              </label>
              <input
                className="w-full p-2 bg-[#120B09] border border-[#4A3426] rounded text-[#F2E6D8] text-sm"
                type="date"
                value={f[k]}
                onChange={(e) => setF({ ...f, [k]: e.target.value })}
              />
            </div>
          ))}
        </div>
        <button
          onClick={save}
          style={{ ...STYLES.btnPrimary, marginTop: "20px" }}
        >
          SAVE CHANGES
        </button>
      </div>
    </div>
  );
};

// --- COMPONENT: ENTRY FORM (With Enhanced Validation) ---
const EntryForm = ({ buses, setView, preSelectedBusId, showNotif }) => {
  const [id, setId] = useState(preSelectedBusId || "");
  const [odo, setOdo] = useState("");
  const [stu, setStu] = useState("");
  const [tch, setTch] = useState("");
  const b = buses.find((x) => x.id === id);

  useEffect(() => {
    if (preSelectedBusId) setId(preSelectedBusId);
  }, [preSelectedBusId]);

  const save = async () => {
    if (!id || !odo) return;
    const lastOdo = b.lastOdometer || 0;
    const currentOdo = parseFloat(odo);
    const dist = currentOdo - lastOdo;
    const studentsPresent = parseInt(stu) || 0;
    const teachersPresent = parseInt(tch) || 0;
    const studentsAssigned = b.assignedStudents || 0;
    const teachersAssigned = b.assignedTeachers || 0;

    // VALIDATION CHECKS
    if (currentOdo < lastOdo) {
      alert(
        `ERROR: Current Odometer (${currentOdo}) cannot be less than previous (${lastOdo})!`
      );
      return;
    }

    // Check 1: Distance > 100
    if (dist > 100) {
      if (
        !window.confirm(
          `WARNING: Distance is ${dist}km (Over 100km). Do you want to proceed?`
        )
      )
        return;
    }
    // Check 2: Student Capacity
    if (studentsAssigned > 0 && studentsPresent > studentsAssigned) {
      if (
        !window.confirm(
          `WARNING: Entered student count (${studentsPresent}) exceeds capacity (${studentsAssigned}). Proceed?`
        )
      )
        return;
    }
    // Check 3: Teacher Capacity (NEW)
    if (teachersAssigned > 0 && teachersPresent > teachersAssigned) {
      if (
        !window.confirm(
          `WARNING: Entered teacher count (${teachersPresent}) exceeds capacity (${teachersAssigned}). Proceed?`
        )
      )
        return;
    }

    await addDoc(
      collection(db, "artifacts", appId, "public", "data", "entries"),
      {
        busNumber: b.busNumber,
        busId: id,
        odometer: currentOdo,
        previousOdometer: lastOdo,
        distance: dist,
        studentsPresent: studentsPresent,
        teachersPresent: teachersPresent,
        timestamp: serverTimestamp(),
      }
    );
    await updateDoc(
      doc(db, "artifacts", appId, "public", "data", "buses", id),
      { lastOdometer: currentOdo }
    );

    // GREEN POPUP
    showNotif("ENTRY RECORDED SUCCESSFULLY!");
    setView("dashboard");
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center mb-6">
        <button
          onClick={() => setView("dashboard")}
          className="mr-3 text-[#8D6E63]"
        >
          <ChevronRight className="rotate-180" />
        </button>
        <h2 className="text-xl font-bold text-[#F2E6D8]">Log Arrival</h2>
      </div>
      {!preSelectedBusId && (
        <div className="mb-6 relative">
          <select
            className="w-full p-4 bg-[#2C1E16] border border-[#4A3426] text-[#F2E6D8] rounded-xl font-bold focus:ring-2 focus:ring-[#C19A6B] outline-none"
            onChange={(e) => setId(e.target.value)}
            value={id}
          >
            <option value="">-- Select Bus --</option>
            {buses.map((x) => (
              <option key={x.id} value={x.id}>
                Bus {x.busNumber}
              </option>
            ))}
          </select>
        </div>
      )}
      {id && b && (
        <div className="space-y-4 animate-fade-in">
          {preSelectedBusId && (
            <div className="bg-[#C19A6B] p-3 rounded-lg text-[#1E140F] font-bold text-center mb-4">
              LOGGING BUS {b.busNumber}
            </div>
          )}
          <div className="bg-[#2C1E16] p-4 rounded-xl shadow-md border border-[#4A3426]">
            <div className="flex justify-between items-end mb-2">
              <label className="text-[10px] font-bold text-[#8D6E63] uppercase">
                Odometer Reading
              </label>
              <div className="text-right">
                <span className="text-[10px] text-[#8D6E63] uppercase block">
                  Previous
                </span>
                <span className="text-2xl font-black text-[#C19A6B] block tracking-wide">
                  {b.lastOdometer || 0}
                </span>
              </div>
            </div>
            <input
              type="number"
              style={{ ...STYLES.input, fontSize: "24px", fontWeight: "bold" }}
              value={odo}
              onChange={(e) => setOdo(e.target.value)}
              placeholder="00000"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-[#8D6E63] uppercase mb-1 block">
                Students (Max: {b.assignedStudents})
              </label>
              <input
                type="number"
                style={STYLES.input}
                value={stu}
                onChange={(e) => setStu(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#8D6E63] uppercase mb-1 block">
                Teachers (Max: {b.assignedTeachers})
              </label>
              <input
                type="number"
                style={STYLES.input}
                value={tch}
                onChange={(e) => setTch(e.target.value)}
              />
            </div>
          </div>
          <button onClick={save} style={STYLES.btnPrimary}>
            <Save className="mr-2 h-5 w-5" /> CONFIRM ENTRY
          </button>
        </div>
      )}
    </div>
  );
};

// --- COMPONENT: DASHBOARD (Clickable Overview + BOLD Stats) ---
const Dashboard = ({ buses, entries, onLog, onViewEntry, onViewProfile }) => {
  const today = new Date().toDateString();
  const tE = entries.filter(
    (e) =>
      e.timestamp &&
      new Date(e.timestamp.seconds * 1000).toDateString() === today
  );
  const pendingBuses = buses.filter((b) => !tE.find((e) => e.busId === b.id));

  const scrollToArrived = () => {
    const el = document.getElementById("arrived-section");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="space-y-6">
      <div
        onClick={scrollToArrived}
        className="bg-[#2C1E16] p-4 rounded-xl border border-[#4A3426] shadow-lg cursor-pointer hover:border-[#C19A6B] transition-colors group"
      >
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-[#C19A6B] text-xs font-bold uppercase flex items-center">
            <Clock className="w-3 h-3 mr-2" /> Today's Overview
          </h3>
          <span className="text-[9px] text-[#8D6E63] uppercase group-hover:text-[#F2E6D8] transition-colors">
            Click to View List &darr;
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#1E140F] p-3 rounded-lg text-center border border-[#4A3426]">
            <span className="block text-2xl font-bold text-[#F2E6D8]">
              {tE.length}{" "}
              <span className="text-sm text-[#5D4037]">/ {buses.length}</span>
            </span>
            <span className="text-[9px] text-[#8D6E63] uppercase font-bold">
              Buses Arrived
            </span>
          </div>
          <div className="bg-[#1E140F] p-3 rounded-lg text-center border border-[#4A3426]">
            <span className="block text-2xl font-bold text-[#F2E6D8]">
              {tE.reduce((a, c) => a + (c.studentsPresent || 0), 0)}
            </span>
            <span className="text-[9px] text-[#8D6E63] uppercase font-bold">
              Students
            </span>
          </div>
        </div>
      </div>
      <div>
        <h3 className="text-[#8D6E63] text-xs font-bold uppercase mb-2 ml-1">
          Pending Arrivals ({pendingBuses.length})
        </h3>
        <div className="space-y-2">
          {pendingBuses.length === 0 ? (
            <div className="p-3 bg-[#1B2E1E] text-[#A5D6A7] rounded-lg border border-[#2E4C33] text-xs font-bold flex items-center justify-center">
              <CheckCircle className="h-4 w-4 mr-2" /> All buses have arrived!
            </div>
          ) : (
            pendingBuses.map((b) => (
              <div
                key={b.id}
                className="bg-[#2C1E16] p-3 rounded-lg border border-[#4A3426] flex justify-between items-center shadow-sm"
              >
                <div className="flex items-center space-x-3">
                  <div className="bg-[#1E140F] text-[#C19A6B] font-bold text-xs p-2 rounded w-10 text-center border border-[#4A3426]">
                    {b.busNumber}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#F2E6D8]">
                      {b.regNumber}
                    </div>
                    <div className="text-[10px] text-[#8D6E63]">
                      {b.driverName || "No Driver"}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onViewProfile(b.id)}
                    style={STYLES.btnSecondary}
                  >
                    View
                  </button>
                  <button onClick={() => onLog(b.id)} style={STYLES.btnSmall}>
                    Log
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {tE.length > 0 && (
        <div id="arrived-section">
          <h3 className="text-[#8D6E63] text-xs font-bold uppercase mb-2 ml-1 mt-6">
            Arrived Today (Click to View)
          </h3>
          <div className="space-y-3">
            {tE.map((e) => {
              const b = buses.find((x) => x.id === e.busId) || {};
              const sAbs = (b.assignedStudents || 0) - e.studentsPresent;
              const tAbs = (b.assignedTeachers || 0) - e.teachersPresent;
              return (
                <div
                  key={e.id}
                  onClick={() => onViewEntry(e)}
                  className="bg-[#1E140F] p-4 rounded-xl border-l-4 border-[#C19A6B] cursor-pointer hover:bg-[#251610] transition-colors shadow-lg"
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-lg text-[#F2E6D8]">
                      Bus {e.busNumber}
                    </span>
                    <span className="text-xs text-[#8D6E63] bg-[#2C1E16] px-2 py-1 rounded border border-[#4A3426]">
                      CLICK TO VIEW
                    </span>
                  </div>
                  {/* BOLD STATS GRID */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-[#F2E6D8] font-bold">
                      ⏰{" "}
                      {new Date(e.timestamp?.seconds * 1000).toLocaleTimeString(
                        [],
                        { hour: "2-digit", minute: "2-digit" }
                      )}
                    </div>
                    <div className="text-[#F2E6D8] font-bold">
                      🚗 {e.distance} km
                    </div>
                    <div className="text-[#A5D6A7] font-bold">
                      👨‍🎓 P: {e.studentsPresent} /{" "}
                      <span className="text-[#EF9A9A]">A: {sAbs}</span>
                    </div>
                    <div className="text-[#FFB74D] font-bold">
                      👨‍🏫 P: {e.teachersPresent} /{" "}
                      <span className="text-[#EF9A9A]">A: {tAbs}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// --- FUEL MANAGEMENT ---
const FuelManager = ({ buses, fuelLogs, setView, showNotif }) => {
  const [mode, setMode] = useState("log");
  const [rates, setRates] = useState({ diesel: 90, adblue: 50 });
  const [f, setF] = useState({
    busId: "",
    type: "Diesel",
    quantity: "",
    cost: "",
    odo: "",
  });

  const b = buses.find((x) => x.id === f.busId);
  const lastRefuelOdo = b?.lastRefuelOdometer || 0;
  useEffect(() => {
    if (b && b.lastOdometer) setF((prev) => ({ ...prev, odo: b.lastOdometer }));
  }, [f.busId, b]);

  const calcMileage = () => {
    if (!f.odo || !b) return 0;
    const dist = parseFloat(f.odo) - lastRefuelOdo;
    return dist > 0 && f.quantity
      ? (dist / parseFloat(f.quantity)).toFixed(2)
      : 0;
  };

  const handleQtyChange = (val) => {
    const qty = parseFloat(val);
    const rate = f.type === "Diesel" ? rates.diesel : rates.adblue;
    setF({ ...f, quantity: val, cost: qty ? (qty * rate).toFixed(0) : "" });
  };

  const saveFuel = async () => {
    if (!f.busId || !f.quantity || !f.odo) return;
    if (parseFloat(f.odo) < lastRefuelOdo) {
      alert("Odometer cannot be less than previous refuel!");
      return;
    }
    const dist = parseFloat(f.odo) - lastRefuelOdo;
    const logData = {
      busId: f.busId,
      busNumber: b.busNumber,
      type: f.type,
      quantity: parseFloat(f.quantity),
      cost: parseFloat(f.cost) || 0,
      odometer: parseFloat(f.odo),
      distanceSinceLast: dist,
      mileage: f.type === "Diesel" ? parseFloat(calcMileage()) : 0,
      timestamp: serverTimestamp(),
    };
    await addDoc(
      collection(db, "artifacts", appId, "public", "data", "fuel_logs"),
      logData
    );
    if (f.type === "Diesel") {
      await updateDoc(
        doc(db, "artifacts", appId, "public", "data", "buses", f.busId),
        { lastRefuelOdometer: parseFloat(f.odo) }
      );
    }
    showNotif("FUEL LOGGED SUCCESSFULLY!");
    setF({ ...f, quantity: "", cost: "", odo: "" });
  };

  const currentMonth = new Date().getMonth();
  const monthLogs = fuelLogs.filter(
    (l) =>
      l.timestamp &&
      new Date(l.timestamp.seconds * 1000).getMonth() === currentMonth
  );
  const totalDiesel = monthLogs
    .filter((l) => l.type === "Diesel")
    .reduce((a, c) => a + c.quantity, 0);
  const totalAdBlue = monthLogs
    .filter((l) => l.type === "AdBlue")
    .reduce((a, c) => a + c.quantity, 0);

  return (
    <div className="space-y-4 pb-20">
      <div className="flex bg-[#2C1E16] p-1 rounded-lg border border-[#4A3426] mb-4">
        <button
          onClick={() => setMode("log")}
          className={`flex-1 py-2 rounded-md text-[10px] font-bold ${
            mode === "log" ? "bg-[#C19A6B] text-[#1E140F]" : "text-[#8D6E63]"
          }`}
        >
          LOG FUEL
        </button>
        <button
          onClick={() => setMode("alerts")}
          className={`flex-1 py-2 rounded-md text-[10px] font-bold ${
            mode === "alerts" ? "bg-[#C19A6B] text-[#1E140F]" : "text-[#8D6E63]"
          }`}
        >
          STATUS
        </button>
        <button
          onClick={() => setMode("refill_due")}
          className={`flex-1 py-2 rounded-md text-[10px] font-bold ${
            mode === "refill_due"
              ? "bg-[#C19A6B] text-[#1E140F]"
              : "text-[#8D6E63]"
          }`}
        >
          REFILL DUE
        </button>
      </div>

      {mode === "log" ? (
        <div style={STYLES.card}>
          <h3 className="text-[#C19A6B] font-bold mb-4 flex items-center">
            <Droplet className="mr-2 h-5 w-5" /> Record Fueling
          </h3>
          <div className="bg-[#120B09] p-2 rounded mb-4 flex justify-between items-center text-xs">
            <span className="text-[#8D6E63]">RATES:</span>
            <div className="flex gap-2">
              <input
                type="number"
                className="w-12 bg-transparent text-[#FFB74D] outline-none text-right"
                value={rates.diesel}
                onChange={(e) => setRates({ ...rates, diesel: e.target.value })}
              />{" "}
              <span className="text-[#FFB74D]">D</span>
              <input
                type="number"
                className="w-12 bg-transparent text-[#4FC3F7] outline-none text-right"
                value={rates.adblue}
                onChange={(e) => setRates({ ...rates, adblue: e.target.value })}
              />{" "}
              <span className="text-[#4FC3F7]">A</span>
            </div>
          </div>
          <select
            style={STYLES.input}
            value={f.busId}
            onChange={(e) => setF({ ...f, busId: e.target.value, odo: "" })}
          >
            <option value="">-- Select Bus --</option>
            {buses.map((x) => (
              <option key={x.id} value={x.id}>
                Bus {x.busNumber} ({x.regNumber})
              </option>
            ))}
          </select>
          {f.busId && (
            <div className="animate-fade-in">
              <div className="flex gap-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={f.type === "Diesel"}
                    onChange={() => setF({ ...f, type: "Diesel" })}
                    className="accent-[#FFB74D]"
                  />{" "}
                  <span className="text-[#FFB74D] font-bold">Diesel</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={f.type === "AdBlue"}
                    onChange={() => setF({ ...f, type: "AdBlue" })}
                    className="accent-[#4FC3F7]"
                  />{" "}
                  <span className="text-[#4FC3F7] font-bold">AdBlue</span>
                </label>
              </div>
              <label style={STYLES.label}>Odometer (Auto-filled)</label>
              <input
                type="number"
                style={STYLES.input}
                value={f.odo}
                onChange={(e) => setF({ ...f, odo: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={STYLES.label}>Liters</label>
                  <input
                    type="number"
                    style={STYLES.input}
                    value={f.quantity}
                    onChange={(e) => handleQtyChange(e.target.value)}
                  />
                </div>
                <div>
                  <label style={STYLES.label}>Total Cost</label>
                  <input
                    type="number"
                    style={STYLES.input}
                    value={f.cost}
                    onChange={(e) => setF({ ...f, cost: e.target.value })}
                  />
                </div>
              </div>
              <button onClick={saveFuel} style={STYLES.btnPrimary}>
                Save Fuel Log
              </button>
            </div>
          )}
        </div>
      ) : mode === "alerts" ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#2C1E16] p-4 rounded-xl border border-[#FFB74D] text-center">
              <p className="text-2xl font-bold text-[#FFB74D]">
                {totalDiesel.toFixed(1)} L
              </p>
              <p className="text-[10px] text-[#8D6E63]">DIESEL (MONTH)</p>
            </div>
            <div className="bg-[#2C1E16] p-4 rounded-xl border border-[#4FC3F7] text-center">
              <p className="text-2xl font-bold text-[#4FC3F7]">
                {totalAdBlue.toFixed(1)} L
              </p>
              <p className="text-[10px] text-[#8D6E63]">ADBLUE (MONTH)</p>
            </div>
          </div>
          {fuelLogs.slice(0, 10).map((l) => (
            <div
              key={l.id}
              className="bg-[#2C1E16] p-3 rounded-lg border border-[#4A3426] flex justify-between items-center"
            >
              <div>
                <span className="font-bold text-sm text-[#F2E6D8]">
                  Bus {l.busNumber}
                </span>{" "}
                <span className="text-[10px] text-[#8D6E63]">
                  {new Date(l.timestamp?.seconds * 1000).toLocaleDateString()}
                </span>
              </div>
              <div className="text-right">
                <p className="font-bold text-[#F2E6D8]">{l.quantity} L</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="text-[#EF9A9A] font-bold text-sm mb-2 flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2" /> Refill Required Soon
          </h3>
          {buses.map((b) => {
            const driven = (b.lastOdometer || 0) - (b.lastRefuelOdometer || 0);
            const estUsed = b.estMileage
              ? driven / parseFloat(b.estMileage)
              : 0;
            const estLeft = (b.tankCapacity || 0) - estUsed;
            const range = estLeft * (b.estMileage || 0);
            if (b.tankCapacity && range < 150) {
              return (
                <div
                  key={b.id}
                  className="bg-[#3E1010] p-3 rounded-lg border border-[#EF9A9A] flex justify-between items-center"
                >
                  <div>
                    <span className="font-bold text-[#F2E6D8]">
                      Bus {b.busNumber}
                    </span>
                    <p className="text-[10px] text-[#EF9A9A]">
                      {Math.max(0, range.toFixed(0))} km Range Left
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#EF9A9A]">
                      {Math.max(0, estLeft.toFixed(1))} L
                    </p>
                  </div>
                </div>
              );
            }
            return null;
          })}
        </div>
      )}
    </div>
  );
};

const EditLogForm = ({ entry, setView, buses, showNotif }) => {
  const [odo, setOdo] = useState(entry?.odometer || "");
  const [stu, setStu] = useState(entry?.studentsPresent || "");
  const [tch, setTch] = useState(entry?.teachersPresent || "");
  const b = buses.find((x) => x.busNumber === entry?.busNumber);

  const saveUpdate = async () => {
    const prevOdo = entry.previousOdometer || 0;
    const newDist = parseFloat(odo) - prevOdo;
    await updateDoc(
      doc(db, "artifacts", appId, "public", "data", "entries", entry.id),
      {
        odometer: parseFloat(odo),
        distance: newDist,
        studentsPresent: parseInt(stu),
        teachersPresent: parseInt(tch),
      }
    );
    if (b) {
      await updateDoc(
        doc(db, "artifacts", appId, "public", "data", "buses", b.id),
        { lastOdometer: parseFloat(odo) }
      );
    }
    showNotif("LOG UPDATED SUCCESSFULLY!");
    setView("dashboard");
  };

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className="flex items-center mb-6">
        <button
          onClick={() => setView("dashboard")}
          className="mr-3 text-[#8D6E63]"
        >
          <ChevronRight className="rotate-180" />
        </button>
        <h2 className="text-xl font-bold text-[#F2E6D8]">
          Correction: Bus {entry?.busNumber}
        </h2>
      </div>
      <div className="bg-[#2C1E16] p-4 rounded-xl border border-[#4A3426]">
        <div className="bg-[#120B09] p-2 mb-4 rounded border border-[#4A3426]">
          <p className="text-[10px] text-[#8D6E63]">PREVIOUS READING (FIXED)</p>
          <p className="text-lg font-mono text-[#F2E6D8]">
            {entry?.previousOdometer || "Unknown"}
          </p>
        </div>
        <label className="text-[10px] font-bold text-[#8D6E63] uppercase mb-1 block">
          Corrected Odometer
        </label>
        <input
          type="number"
          className="w-full p-3 bg-[#120B09] border border-[#4A3426] rounded-lg text-[#F2E6D8] mb-3 focus:border-[#C19A6B] outline-none"
          value={odo}
          onChange={(e) => setOdo(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold text-[#8D6E63] uppercase mb-1 block">
              Students
            </label>
            <input
              type="number"
              className="w-full p-3 bg-[#120B09] border border-[#4A3426] rounded-lg text-[#F2E6D8] outline-none"
              value={stu}
              onChange={(e) => setStu(e.target.value)}
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-[#8D6E63] uppercase mb-1 block">
              Teachers
            </label>
            <input
              type="number"
              className="w-full p-3 bg-[#120B09] border border-[#4A3426] rounded-lg text-[#F2E6D8] outline-none"
              value={tch}
              onChange={(e) => setTch(e.target.value)}
            />
          </div>
        </div>
      </div>
      <button onClick={saveUpdate} style={STYLES.btnPrimary}>
        Update & Sync
      </button>
    </div>
  );
};

// --- COMPONENT: REPORTS VIEW (Renamed from History) ---
const ReportsView = ({ entries, buses, fuelLogs }) => {
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const generateReport = () => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    const filteredEntries = entries.filter((e) => {
      const d = new Date(e.timestamp?.seconds * 1000);
      return d >= start && d <= end;
    });

    if (filteredEntries.length === 0) {
      alert("No data found for selected range.");
      return;
    }

    const reportData = filteredEntries.map((e) => {
      const b = buses.find((x) => x.busNumber === e.busNumber) || {};
      return {
        Date: new Date(e.timestamp?.seconds * 1000).toLocaleDateString(),
        Time: new Date(e.timestamp?.seconds * 1000).toLocaleTimeString(),
        BusNumber: e.busNumber,
        RegNumber: b.regNumber || "",
        DriverName: b.driverName || "",
        DriverContact: b.driverContact || "",
        Attendant: b.attendantName || "",
        Odometer: e.odometer,
        Distance: e.distance,
        StudentsPresent: e.studentsPresent,
        TeachersPresent: e.teachersPresent,
        InsuranceExpiry: b.insuranceExpiry || "",
        PermitExpiry: b.permitExpiry || "",
        FitnessExpiry: b.fitnessExpiry || "",
      };
    });
    downloadCSV(reportData, `Master_Report_${startDate}_to_${endDate}.csv`);
  };

  return (
    <div className="space-y-4 p-2">
      <h2 className="text-xl font-bold text-[#F2E6D8] mb-4 flex items-center">
        <ClipboardList className="mr-2 text-[#C19A6B]" /> Reports Center
      </h2>
      <div style={STYLES.card}>
        <h3 className="text-[#8D6E63] text-xs font-bold uppercase mb-3">
          Export Data Range
        </h3>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label style={STYLES.label}>From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-[#120B09] text-[#F2E6D8] border border-[#4A3426] rounded p-2 text-xs outline-none"
            />
          </div>
          <div>
            <label style={STYLES.label}>To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-[#120B09] text-[#F2E6D8] border border-[#4A3426] rounded p-2 text-xs outline-none"
            />
          </div>
        </div>
        <button onClick={generateReport} style={STYLES.btnPrimary}>
          <FileSpreadsheet className="mr-2 h-4 w-4" /> Download Excel (CSV)
        </button>
      </div>
      <h3 className="text-[#C19A6B] text-xs font-bold uppercase mt-6 mb-2">
        Recent Activity
      </h3>
      <div className="space-y-2">
        {entries.slice(0, 5).map((e) => (
          <div
            key={e.id}
            className="bg-[#2C1E16] p-3 rounded-lg border-l-4 border-[#C19A6B] flex justify-between items-center"
          >
            <div>
              <span className="font-bold text-sm text-[#F2E6D8]">
                Bus {e.busNumber}
              </span>
            </div>
            <div className="text-[10px] text-[#8D6E63]">
              {new Date(e.timestamp?.seconds * 1000).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const DocsView = ({ buses }) => {
  const check = (d) => {
    if (!d) return { c: "text-[#5D4037]", t: "N/A", score: 0 };
    const days = Math.ceil((new Date(d) - new Date()) / 86400000);
    if (days < 0) return { c: "text-[#EF9A9A]", t: "EXPIRED", score: 100 };
    if (days < 30) return { c: "text-[#FFE082]", t: "EXP SOON", score: 50 };
    return { c: "text-[#A5D6A7]", t: "VALID", score: 1 };
  };

  const getRiskScore = (b) => {
    let s = 0;
    [
      "insuranceExpiry",
      "permitExpiry",
      "taxExpiry",
      "fitnessExpiry",
      "pollutionExpiry",
      "gpsExpiry",
    ].forEach((k) => (s += check(b[k]).score));
    return s;
  };

  const sortedBuses = [...buses].sort(
    (a, b) => getRiskScore(b) - getRiskScore(a)
  );

  return (
    <div className="p-2 space-y-4">
      <h2 className="text-xl font-bold text-[#F2E6D8] mb-4 flex items-center">
        <FileText className="mr-2 text-[#C19A6B]" /> Compliance
      </h2>
      {sortedBuses.map((b) => (
        <div
          key={b.id}
          className="bg-[#2C1E16] rounded-xl border border-[#4A3426] overflow-hidden shadow-sm"
        >
          <div className="bg-[#1E140F] p-3 flex justify-between items-center border-b border-[#3E2723]">
            <span className="text-[#C19A6B] font-bold text-sm">
              Bus {b.busNumber}
            </span>
            <span className="text-[10px] text-[#8D6E63] font-mono">
              {b.regNumber}
            </span>
          </div>
          <div className="p-3 grid grid-cols-2 gap-3 text-xs">
            {[
              "insuranceExpiry",
              "permitExpiry",
              "taxExpiry",
              "fitnessExpiry",
              "pollutionExpiry",
              "gpsExpiry",
            ].map((k) => {
              const s = check(b[k]);
              return (
                <div
                  key={k}
                  className="bg-[#120B09] p-2 rounded border border-[#4A3426]"
                >
                  <div className="text-[#5D4037] uppercase text-[9px] font-bold mb-1">
                    {k.replace("Expiry", "")}
                  </div>
                  <div className={`flex items-center gap-1 font-bold ${s.c}`}>
                    {s.t}
                  </div>
                  <div className="text-[9px] text-[#8D6E63] mt-1">
                    {b[k] || "-"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

const AdminPanel = ({ buses, entries, fuelLogs, showNotif }) => {
  const [f, setF] = useState({});
  const fRef = useRef(null);
  const rRef = useRef(null);

  const add = async () => {
    if (!f.busNumber) return;
    await addDoc(
      collection(db, "artifacts", appId, "public", "data", "buses"),
      {
        ...f,
        lastOdometer: parseFloat(f.lastOdometer) || 0,
        tankCapacity: parseFloat(f.tankCapacity) || 0,
        estMileage: parseFloat(f.estMileage) || 0,
        assignedStudents: parseInt(f.assignedStudents) || 0,
        assignedTeachers: parseInt(f.assignedTeachers) || 0,
        lastRefuelOdometer: parseFloat(f.lastOdometer) || 0,
      }
    );
    setF({});
    showNotif("BUS ADDED SUCCESSFULLY!");
  };

  const handleClearAllData = async () => {
    if (
      !window.confirm(
        "CRITICAL WARNING: This will permanently DELETE ALL buses, logs, and fuel data. Are you sure?"
      )
    )
      return;
    if (
      !window.confirm(
        "Last Chance: Type 'YES' to confirm deletion (In your mind) and click OK."
      )
    )
      return;

    const deleteCollection = async (coll) => {
      const q = query(
        collection(db, "artifacts", appId, "public", "data", coll)
      );
      const s = await getDocs(q);
      const batch = writeBatch(db);
      s.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    };

    await deleteCollection("buses");
    await deleteCollection("entries");
    await deleteCollection("fuel_logs");
    showNotif("SYSTEM RESET COMPLETE.");
  };

  const handleBackup = () =>
    downloadJSON(
      { buses, entries, fuelLogs },
      `Backup_${new Date().toISOString().split("T")[0]}.json`
    );
  const handleRestore = (e) => {
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const d = JSON.parse(ev.target.result);
        const batch = writeBatch(db);
        if (d.buses)
          d.buses.forEach((b) => {
            const { id, ...rest } = b;
            batch.set(
              doc(
                db,
                "artifacts",
                appId,
                "public",
                "data",
                "buses",
                b.busNumber
              ),
              rest
            );
          });
        if (d.entries)
          d.entries.forEach((e) => {
            const { id, ...rest } = e;
            batch.set(
              doc(
                collection(db, "artifacts", appId, "public", "data", "entries")
              ),
              rest
            );
          });
        if (d.fuelLogs)
          d.fuelLogs.forEach((f) => {
            const { id, ...rest } = f;
            batch.set(
              doc(
                collection(
                  db,
                  "artifacts",
                  appId,
                  "public",
                  "data",
                  "fuel_logs"
                )
              ),
              rest
            );
          });
        await batch.commit();
        showNotif("RESTORED SUCCESSFULLY!");
      } catch (err) {
        alert("Restore Failed: " + err.message);
      }
    };
    reader.readAsText(e.target.files[0]);
  };

  const handleCSV = (e) => {
    const r = new FileReader();
    r.onload = async (ev) => {
      const rows = ev.target.result.split("\n").slice(1);
      const batch = writeBatch(db);
      let count = 0;
      rows.forEach((row) => {
        const c = row.split(",");
        if (c.length > 2) {
          const busData = {
            busNumber: c[0]?.trim(),
            regNumber: c[1]?.trim(),
            lastOdometer: parseFloat(c[2]) || 0,
            assignedStudents: parseInt(c[3]) || 0,
            assignedTeachers: parseInt(c[4]) || 0,
            driverName: c[5]?.trim(),
            driverContact: c[6]?.trim(),
            insuranceExpiry: c[7]?.trim(),
            permitExpiry: c[8]?.trim(),
            taxExpiry: c[9]?.trim(),
            fitnessExpiry: c[10]?.trim(),
            tankCapacity: parseFloat(c[11]) || 0,
            estMileage: parseFloat(c[12]) || 0,
            lastRefuelOdometer: parseFloat(c[2]) || 0,
          };
          if (busData.busNumber) {
            batch.set(
              doc(
                db,
                "artifacts",
                appId,
                "public",
                "data",
                "buses",
                busData.busNumber
              ),
              busData
            );
            count++;
          }
        }
      });
      await batch.commit();
      showNotif(`IMPORTED ${count} BUSES!`);
    };
    r.readAsText(e.target.files[0]);
  };

  return (
    <div className="space-y-6 p-2">
      <div className="bg-[#2C1E16] p-5 rounded-xl border border-[#4A3426] shadow-lg">
        <h3 className="font-bold mb-4 text-[#C19A6B] flex items-center">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Bus Profile
        </h3>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label style={STYLES.label}>BUS NO</label>
            <input
              className="w-full p-2 bg-[#120B09] border border-[#4A3426] rounded text-[#F2E6D8] text-sm"
              value={f.busNumber || ""}
              onChange={(e) => setF({ ...f, busNumber: e.target.value })}
            />
          </div>
          <div>
            <label style={STYLES.label}>REG NO</label>
            <input
              className="w-full p-2 bg-[#120B09] border border-[#4A3426] rounded text-[#F2E6D8] text-sm"
              value={f.regNumber || ""}
              onChange={(e) => setF({ ...f, regNumber: e.target.value })}
            />
          </div>
        </div>

        {/* EXPANDED FIELDS */}
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <label style={STYLES.label}>DRIVER</label>
            <input
              className="w-full p-2 bg-[#120B09] border border-[#4A3426] rounded text-[#F2E6D8] text-sm"
              value={f.driverName || ""}
              onChange={(e) => setF({ ...f, driverName: e.target.value })}
            />
          </div>
          <div>
            <label style={STYLES.label}>PHONE</label>
            <input
              className="w-full p-2 bg-[#120B09] border border-[#4A3426] rounded text-[#F2E6D8] text-sm"
              value={f.driverContact || ""}
              onChange={(e) => setF({ ...f, driverContact: e.target.value })}
            />
          </div>
          <div>
            <label style={STYLES.label}>ATTENDANT</label>
            <input
              className="w-full p-2 bg-[#120B09] border border-[#4A3426] rounded text-[#F2E6D8] text-sm"
              value={f.attendantName || ""}
              onChange={(e) => setF({ ...f, attendantName: e.target.value })}
            />
          </div>
          <div>
            <label style={STYLES.label}>PHONE</label>
            <input
              className="w-full p-2 bg-[#120B09] border border-[#4A3426] rounded text-[#F2E6D8] text-sm"
              value={f.attendantContact || ""}
              onChange={(e) => setF({ ...f, attendantContact: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <label style={STYLES.label}>INITIAL ODO</label>
            <input
              className="w-full p-2 bg-[#120B09] border border-[#4A3426] rounded text-[#F2E6D8] text-sm"
              type="number"
              value={f.lastOdometer || ""}
              onChange={(e) => setF({ ...f, lastOdometer: e.target.value })}
            />
          </div>
          <div>
            <label style={STYLES.label}>TANK (L)</label>
            <input
              className="w-full p-2 bg-[#120B09] border border-[#4A3426] rounded text-[#F2E6D8] text-sm"
              type="number"
              value={f.tankCapacity || ""}
              onChange={(e) => setF({ ...f, tankCapacity: e.target.value })}
            />
          </div>
          <div>
            <label style={STYLES.label}>MILEAGE</label>
            <input
              className="w-full p-2 bg-[#120B09] border border-[#4A3426] rounded text-[#F2E6D8] text-sm"
              type="number"
              value={f.estMileage || ""}
              onChange={(e) => setF({ ...f, estMileage: e.target.value })}
            />
          </div>
          <div>
            <label style={STYLES.label}>STU CAP</label>
            <input
              className="w-full p-2 bg-[#120B09] border border-[#4A3426] rounded text-[#F2E6D8] text-sm"
              type="number"
              value={f.assignedStudents || ""}
              onChange={(e) => setF({ ...f, assignedStudents: e.target.value })}
            />
          </div>
          <div>
            <label style={STYLES.label}>TCH CAP</label>
            <input
              className="w-full p-2 bg-[#120B09] border border-[#4A3426] rounded text-[#F2E6D8] text-sm"
              type="number"
              value={f.assignedTeachers || ""}
              onChange={(e) => setF({ ...f, assignedTeachers: e.target.value })}
            />
          </div>
        </div>

        <h4 className="text-xs text-[#8D6E63] uppercase font-bold mt-4 mb-2">
          Expiry Dates
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label style={STYLES.label}>INSURANCE</label>
            <input
              className="w-full p-2 bg-[#120B09] border border-[#4A3426] rounded text-[#F2E6D8] text-sm"
              type="date"
              value={f.insuranceExpiry || ""}
              onChange={(e) => setF({ ...f, insuranceExpiry: e.target.value })}
            />
          </div>
          <div>
            <label style={STYLES.label}>PERMIT</label>
            <input
              className="w-full p-2 bg-[#120B09] border border-[#4A3426] rounded text-[#F2E6D8] text-sm"
              type="date"
              value={f.permitExpiry || ""}
              onChange={(e) => setF({ ...f, permitExpiry: e.target.value })}
            />
          </div>
          <div>
            <label style={STYLES.label}>TAX</label>
            <input
              className="w-full p-2 bg-[#120B09] border border-[#4A3426] rounded text-[#F2E6D8] text-sm"
              type="date"
              value={f.taxExpiry || ""}
              onChange={(e) => setF({ ...f, taxExpiry: e.target.value })}
            />
          </div>
          <div>
            <label style={STYLES.label}>POLLUTION</label>
            <input
              className="w-full p-2 bg-[#120B09] border border-[#4A3426] rounded text-[#F2E6D8] text-sm"
              type="date"
              value={f.pollutionExpiry || ""}
              onChange={(e) => setF({ ...f, pollutionExpiry: e.target.value })}
            />
          </div>
          <div>
            <label style={STYLES.label}>GPS</label>
            <input
              className="w-full p-2 bg-[#120B09] border border-[#4A3426] rounded text-[#F2E6D8] text-sm"
              type="date"
              value={f.gpsExpiry || ""}
              onChange={(e) => setF({ ...f, gpsExpiry: e.target.value })}
            />
          </div>
          <div>
            <label style={STYLES.label}>FIRE EXT</label>
            <input
              className="w-full p-2 bg-[#120B09] border border-[#4A3426] rounded text-[#F2E6D8] text-sm"
              type="date"
              value={f.extinguisherExpiry || ""}
              onChange={(e) =>
                setF({ ...f, extinguisherExpiry: e.target.value })
              }
            />
          </div>
          <div>
            <label style={STYLES.label}>FIRST AID</label>
            <input
              className="w-full p-2 bg-[#120B09] border border-[#4A3426] rounded text-[#F2E6D8] text-sm"
              type="date"
              value={f.firstAidExpiry || ""}
              onChange={(e) => setF({ ...f, firstAidExpiry: e.target.value })}
            />
          </div>
          <div>
            <label style={STYLES.label}>CAMERA</label>
            <input
              className="w-full p-2 bg-[#120B09] border border-[#4A3426] rounded text-[#F2E6D8] text-sm"
              type="date"
              value={f.cameraExpiry || ""}
              onChange={(e) => setF({ ...f, cameraExpiry: e.target.value })}
            />
          </div>
        </div>

        <button onClick={add} style={STYLES.btnPrimary}>
          Add to Fleet
        </button>
      </div>

      <div className="bg-[#2C1E16] p-5 rounded-xl border border-[#4A3426] shadow-lg">
        <h3 className="font-bold mb-4 text-[#C19A6B] flex items-center">
          <Database className="mr-2 h-4 w-4" /> Data Center
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleBackup}
            className="bg-[#1E140F] text-[#F2E6D8] p-3 rounded-lg text-xs font-bold border border-[#4A3426] flex items-center justify-center hover:border-[#C19A6B]"
          >
            <Download className="mr-2 h-4 w-4" /> Backup
          </button>
          <button
            onClick={() => fRef.current.click()}
            className="bg-[#1E140F] text-[#F2E6D8] p-3 rounded-lg text-xs font-bold border border-[#4A3426] flex items-center justify-center hover:border-[#C19A6B]"
          >
            <Upload className="mr-2 h-4 w-4" /> Import CSV
          </button>
          <input
            type="file"
            ref={fRef}
            className="hidden"
            onChange={handleCSV}
            accept=".csv"
          />

          <button
            onClick={() => rRef.current.click()}
            className="bg-[#1E140F] text-[#EF9A9A] p-3 rounded-lg text-xs font-bold border border-[#4A3426] flex items-center justify-center hover:border-[#EF9A9A]"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Restore System
          </button>
          <input
            type="file"
            ref={rRef}
            className="hidden"
            onChange={handleRestore}
            accept=".json"
          />
        </div>

        <button
          onClick={handleClearAllData}
          className="w-full mt-4 bg-[#3E1010] text-[#EF9A9A] p-3 rounded-lg text-xs font-bold border border-[#EF9A9A] flex items-center justify-center hover:bg-[#5E1B1B]"
        >
          <XCircle className="mr-2 h-4 w-4" /> RESET APP (CLEAR ALL)
        </button>
      </div>
    </div>
  );
};
