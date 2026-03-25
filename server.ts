import express from "express";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// Configure Nodemailer
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
      console.log("Using Ethereal Email for testing.");
    }
  } catch (error) {
    console.error("Failed to initialize mailer:", error);
  }
}

initMailer();

// API Routes
app.get("/api/entries", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("entries")
      .select("*")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
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
    const { data, error } = await supabase
      .from("entries")
      .insert([
        { name, date, observations: observations || "", email1: email1 || "", email2: email2 || "" }
      ])
      .select();

    if (error) throw error;

    const emailsToNotify = [email1, email2].filter(Boolean);
    
    if (emailsToNotify.length > 0 && transporter) {
      const mailOptions = {
        from: '"Almoço Escola" <noreply@escola.com>',
        to: emailsToNotify.join(", "),
        subject: "Comprovante de Almoço Escola",
        text: `Olá,\n\nSegue o comprovante de almoço:\n\nNome: ${name}\nData: ${date}\nObservações: ${observations || 'Nenhuma'}\n\nObrigado!`,
        html: `<p>Olá,</p><p>Segue o comprovante de almoço:</p><ul><li><strong>Nome:</strong> ${name}</li><li><strong>Data:</strong> ${date}</li><li><strong>Observações:</strong> ${observations || 'Nenhuma'}</li></ul><p>Obrigado!</p>`,
      };

      await transporter.sendMail(mailOptions);
    }

    res.status(201).json({ success: true, entry: data[0] });
  } catch (error) {
    console.error("Error saving entry:", error);
    res.status(500).json({ error: "Failed to save entry" });
  }
});

app.delete("/api/entries", async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: "startDate and endDate are required" });
  }

  try {
    const { count, error } = await supabase
      .from("entries")
      .delete({ count: 'exact' })
      .gte("date", startDate)
      .lte("date", endDate);

    if (error) throw error;
    res.json({ success: true, deletedCount: count });
  } catch (error) {
    console.error("Error deleting entries:", error);
    res.status(500).json({ error: "Failed to delete entries" });
  }
});

async function startServer() {
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
