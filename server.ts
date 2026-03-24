import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import nodemailer from "nodemailer";

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize SQLite Database
const db = new Database("escola.db");

db.exec(`
  CREATE TABLE IF NOT EXISTS entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    date TEXT NOT NULL,
    observations TEXT,
    email1 TEXT,
    email2 TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Configure Nodemailer
// We will use Ethereal Email for testing if no real credentials are provided
let transporter: nodemailer.Transporter | null = null;

async function initMailer() {
  try {
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      // Fallback to Ethereal for testing
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log("Using Ethereal Email for testing. Check console for preview URLs.");
    }
  } catch (error) {
    console.error("Failed to initialize mailer:", error);
  }
}

initMailer();

// API Routes
app.get("/api/entries", (req, res) => {
  try {
    const entries = db.prepare("SELECT * FROM entries ORDER BY date DESC, created_at DESC").all();
    res.json(entries);
  } catch (error) {
    console.error("Error fetching entries:", error);
    res.status(500).json({ error: "Failed to fetch entries" });
  }
});

app.post("/api/entries", async (req, res) => {
  const { name, date, observations, email1, email2 } = req.body;

  if (!name || !date) {
    return res.status(400).json({ error: "Name and date are required" });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO entries (name, date, observations, email1, email2)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(name, date, observations || "", email1 || "", email2 || "");

    // Send emails if provided
    const emailsToNotify = [email1, email2].filter(Boolean);
    
    if (emailsToNotify.length > 0 && transporter) {
      const mailOptions = {
        from: '"Almoço Escola" <noreply@escola.com>',
        to: emailsToNotify.join(", "),
        subject: "Comprovante de Almoço Escola",
        text: `Olá,\n\nSegue o comprovante de almoço:\n\nNome: ${name}\nData: ${date}\nObservações: ${observations || 'Nenhuma'}\n\nObrigado!`,
        html: `<p>Olá,</p><p>Segue o comprovante de almoço:</p><ul><li><strong>Nome:</strong> ${name}</li><li><strong>Data:</strong> ${date}</li><li><strong>Observações:</strong> ${observations || 'Nenhuma'}</li></ul><p>Obrigado!</p>`,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log("Message sent: %s", info.messageId);
      if (info.messageId.includes("ethereal")) {
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
      }
    }

    res.status(201).json({ id: info.lastInsertRowid, success: true });
  } catch (error) {
    console.error("Error saving entry:", error);
    res.status(500).json({ error: "Failed to save entry" });
  }
});

app.delete("/api/entries", (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: "startDate and endDate are required" });
  }

  try {
    const stmt = db.prepare("DELETE FROM entries WHERE date >= ? AND date <= ?");
    const info = stmt.run(startDate, endDate);
    
    res.json({ success: true, deletedCount: info.changes });
  } catch (error) {
    console.error("Error deleting entries:", error);
    res.status(500).json({ error: "Failed to delete entries" });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
