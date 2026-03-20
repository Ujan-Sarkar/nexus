import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import db from "./lib/db.js";
import { spawn, spawnSync } from "child_process";

console.log("SERVER.TS IS STARTING AT", new Date().toISOString());
fs.writeFileSync("server_boot.log", "SERVER.TS IS STARTING AT " + new Date().toISOString() + "\n");

const JWT_SECRET = process.env.JWT_SECRET || "hospital-erp-secret-key";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // --- API Routes ---

  // Auth
  app.post("/api/login", async (req, res) => {
    const { username, password, role } = req.body;
    console.log(`Login attempt: ${username} as ${role}`);
    const user = db.prepare('SELECT * FROM users WHERE username = ? AND role = ?').get(username, role) as any;

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET);
    res.json({ token, user: { id: user.id, username: user.username, role: user.role, name: user.name } });
  });

  // Middleware to verify JWT
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      console.log(`Unauthorized access attempt to ${req.path}`);
      return res.status(401).json({ error: "Unauthorized" });
    }
    try {
      req.user = jwt.verify(token, JWT_SECRET);
      next();
    } catch (e) {
      console.log(`Invalid token for ${req.path}`);
      res.status(401).json({ error: "Invalid token" });
    }
  };

  // Admin Routes
  app.get("/api/admin/stats", authenticate, (req, res) => {
    const patients = db.prepare('SELECT count(*) as count FROM patients').get() as any;
    const doctors = db.prepare("SELECT count(*) as count FROM users WHERE role = 'doctor'").get() as any;
    const appointments = db.prepare('SELECT count(*) as count FROM appointments').get() as any;
    res.json({ patients: patients.count, doctors: doctors.count, appointments: appointments.count });
  });

  app.post("/api/admin/register-patient", authenticate, (req, res) => {
    const { patient_id, name, age, gender, contact, history } = req.body;
    try {
      const existing = db.prepare('SELECT patient_id FROM patients WHERE patient_id = ?').get(patient_id);
      if (existing) {
        return res.status(400).json({ error: "Patient ID already exists" });
      }
      
      db.prepare('INSERT INTO patients (patient_id, name, age, gender, contact, history) VALUES (?, ?, ?, ?, ?, ?)').run(patient_id, name, age, gender, contact, history);
      res.json({ id: patient_id });
    } catch (e: any) {
      console.error("Registration Error:", e);
      res.status(500).json({ error: e.message || "Failed to register patient" });
    }
  });

  app.get("/api/doctors", authenticate, (req, res) => {
    const doctors = db.prepare("SELECT id, name, specialty FROM users WHERE role = 'doctor'").all();
    res.json(doctors);
  });

  app.post("/api/admin/appointment", authenticate, (req, res) => {
    const { patient_id, doctor_id, date, query } = req.body;
    const result = db.prepare("INSERT INTO appointments (patient_id, doctor_id, date, query, status) VALUES (?, ?, ?, ?, 'pending')").run(patient_id, doctor_id, date, query);
    res.json({ id: result.lastInsertRowid });
  });

  // Doctor Routes
  app.get("/api/doctor/appointments", authenticate, (req: any, res) => {
    const appointments = db.prepare(`
      SELECT a.*, p.name as patient_name, p.age, p.gender 
      FROM appointments a 
      JOIN patients p ON a.patient_id = p.patient_id 
      WHERE a.doctor_id = ? AND a.status = 'pending'
    `).all(req.user.id);
    res.json(appointments);
  });

  app.post("/api/doctor/consultation", authenticate, (req, res) => {
    const { appointment_id, diagnosis, prescription, lab_tests } = req.body;
    const appointment = db.prepare('SELECT patient_id FROM appointments WHERE id = ?').get(appointment_id) as any;
    db.prepare("UPDATE appointments SET diagnosis = ?, prescription = ?, status = 'completed' WHERE id = ?").run(diagnosis, prescription, appointment_id);
    if (lab_tests && lab_tests.length > 0 && appointment) {
      const insertLab = db.prepare("INSERT INTO verified_tests (patient_id, test_name, status, timestamp) VALUES (?, ?, 'pending', ?)");
      lab_tests.forEach((test: string) => {
        insertLab.run(appointment.patient_id, test, new Date().toISOString());
      });
    }
    res.json({ success: true });
  });

  app.get("/api/patients", authenticate, (req, res) => {
    const patients = db.prepare('SELECT * FROM patients').all();
    res.json(patients);
  });

  app.get("/api/patient/:id/history", authenticate, (req, res) => {
    const appointments = db.prepare(`
      SELECT a.*, u.name as doctor_name 
      FROM appointments a 
      JOIN users u ON a.doctor_id = u.id 
      WHERE a.patient_id = ?
    `).all(req.params.id);
    const tests = db.prepare(`
      SELECT vt.* FROM verified_tests vt 
      WHERE vt.patient_id = ?
    `).all(req.params.id);
    const labResults = db.prepare(`
      SELECT * FROM lab_results WHERE patient_id = ?
    `).all(req.params.id);
    res.json({ appointments, tests, labResults });
  });

  // Lab Routes
  app.get("/api/lab/tests", authenticate, (req, res) => {
    const tests = db.prepare(`
      SELECT vt.*, 
             p.name as patient_name
      FROM verified_tests vt 
      JOIN patients p ON vt.patient_id = p.patient_id
    `).all();
    res.json(tests);
  });

  app.get("/api/lab/engine-health", authenticate, async (req, res) => {
    try {
      const response = await fetch("http://localhost:8001/health");
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ status: "offline", error: (error as Error).message });
    }
  });

  // Proxy to Python ML Engine
  // server.ts - Proxy to Python ML Engine
// Proxy to Python ML Engine - STABLE VERSION
app.post("/api/analyze", authenticate, async (req, res) => {
  try {
    const response = await fetch("http://127.0.0.1:8001/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();

    // We send back ONLY the score as a number and the verdict as a string
    // This prevents React from accidentally trying to render a whole object
    res.json({
      score: data.summary.score,
      verdict: data.summary.verdict,
      success: true,
      // We keep the summary object too, just in case
      summary: data.summary 
    });
  } catch (error) {
    console.error("Analysis Error:", error);
    res.json({ score: 0, verdict: "ERROR", success: false });
  }
});
  app.post("/api/lab/manual-test", authenticate, (req, res) => {
    const { patient_id, test_name } = req.body;
    const result = db.prepare("INSERT INTO verified_tests (patient_id, test_name, status, timestamp) VALUES (?, ?, 'pending', ?)")
      .run(patient_id, test_name, new Date().toISOString());
    res.json({ id: result.lastInsertRowid });
  });

  app.post("/api/lab/update-test", authenticate, (req, res) => {
    const { test_id, result, tns_score, proof_hash } = req.body;
    const testInfo = db.prepare('SELECT patient_id, test_name FROM verified_tests WHERE id = ?').get(test_id) as any;
    db.prepare("UPDATE verified_tests SET proof_hash = ?, tns_score = ?, status = 'AUTO-APPROVED', timestamp = ? WHERE id = ?")
      .run(proof_hash || 'hash_' + Math.random().toString(36).substr(2, 9), tns_score || 0.85, new Date().toISOString(), test_id);
    if (testInfo) {
      db.prepare("INSERT INTO lab_results (patient_id, test_name, result_value, timestamp) VALUES (?, ?, ?, ?)")
        .run(testInfo.patient_id, testInfo.test_name, parseFloat(result) || 0, new Date().toISOString());
    }
    res.json({ success: true });
  });

  // Revenue Routes
  app.get("/api/admin/revenue", authenticate, (req, res) => {
    const payments = db.prepare(`
      SELECT p.*, pt.name as patient_name 
      FROM payments p 
      JOIN patients pt ON p.patient_id = pt.patient_id
      ORDER BY p.timestamp DESC
    `).all();
    res.json(payments);
  });

  app.post("/api/revenue/bill", authenticate, (req, res) => {
    const { patient_id, amount, reason } = req.body;
    const timestamp = new Date().toISOString();
    const hash = bcrypt.hashSync(`${patient_id}-${amount}-${timestamp}`, 10);
    const result = db.prepare('INSERT INTO payments (patient_id, amount, reason, timestamp, hash) VALUES (?, ?, ?, ?, ?)').run(patient_id, amount, reason, timestamp, hash);
    res.json({ id: result.lastInsertRowid, hash });
  });

  // --- Vite Setup ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
    let pythonProcess: any = null;
    let pythonLogs: string[] = [];
    let restartTimer: any = null;
    const maxLogs = 100;

    const addLog = (msg: string) => {
      const logMsg = `${new Date().toISOString()} - ${msg}`;
      pythonLogs.push(logMsg);
      if (pythonLogs.length > maxLogs) pythonLogs.shift();
      try {
        fs.appendFileSync("engine_debug.log", logMsg + "\n");
      } catch (e) {}
    };

    const startPython = (cmd: string) => {
      if (restartTimer) {
        clearTimeout(restartTimer);
        restartTimer = null;
      }

      if (pythonProcess) {
        try {
          pythonProcess.kill();
        } catch (e) {}
        pythonProcess = null;
      }

      addLog(`Attempting to start Python engine with: ${cmd}`);
      
      // FIXED: Added shell:true and 'py' fallback rotation for Windows
      pythonProcess = spawn(cmd, ["-u", "main.py"], { shell: true });
      
      pythonProcess.stdout.on("data", (data: any) => {
        addLog(`[STDOUT] ${data}`);
        console.log(`[Python] ${data}`);
      });
      
      pythonProcess.stderr.on("data", (data: any) => {
        addLog(`[STDERR] ${data}`);
        console.error(`[Python Error] ${data}`);
      });

      pythonProcess.on("error", (err: any) => {
        addLog(`[ERROR] Failed to start with ${cmd}: ${err.message}`);
        if (cmd === "python3") {
          restartTimer = setTimeout(() => startPython("python"), 2000);
        } else if (cmd === "python") {
          restartTimer = setTimeout(() => startPython("py"), 2000);
        } else if (cmd === "py") {
          restartTimer = setTimeout(() => startPython("python3"), 5000);
        }
      });

      pythonProcess.on("exit", (code: any) => {
        addLog(`[EXIT] Python process exited with code ${code}`);
        if (code !== 0 && code !== null) {
          console.error(`Python process exited with code ${code}. Trying next alias...`);
          // If code is 9009 (Not found), rotate commands immediately
          if (code === 9009) {
             if (cmd === "python3") startPython("python");
             else if (cmd === "python") startPython("py");
             else restartTimer = setTimeout(() => startPython("python3"), 5000);
          } else {
             restartTimer = setTimeout(() => startPython(cmd), 5000);
          }
        }
      });
    };

    app.get("/api/lab/engine-logs", authenticate, (req, res) => {
      res.json({ logs: pythonLogs });
    });

    startPython("python3");
  });
}

startServer();