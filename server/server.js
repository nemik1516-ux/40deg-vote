require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const pool = require("./db");

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many requests",
  },
});

app.use(limiter);

app.get("/", (req, res) => {

  res.json({
    success: true,
    message: "40Deg Voting API Running",
  });

});

app.get("/api/results", async (req, res) => {

  try {

    const result = await pool.query(`
      SELECT city, total_votes
      FROM votes
      ORDER BY total_votes DESC
    `);

    res.json({
      success: true,
      results: result.rows,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      error: error.message,
    });

  }

});

app.get("/api/settings", async (req, res) => {

  try {

    const result = await pool.query(`
      SELECT *
      FROM settings
      LIMIT 1
    `);

    res.json({
      success: true,
      settings: result.rows[0] || null,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      error: error.message,
    });

  }

});

app.post("/api/vote", async (req, res) => {

  try {

    const { city } = req.body;

    if (!city) {

      return res.status(400).json({
        success: false,
        message: "City is required",
      });

    }

    const settings = await pool.query(`
      SELECT *
      FROM settings
      LIMIT 1
    `);

    const votingSettings = settings.rows[0];

    if (!votingSettings?.voting_active) {

      return res.status(400).json({
        success: false,
        message: "Голосование остановлено",
      });

    }

    const endDate = new Date(
      votingSettings.voting_end
    );

    if (new Date() > endDate) {

      return res.status(400).json({
        success: false,
        message: "Время голосования закончилось",
      });

    }

    const userIp =
      req.headers["x-forwarded-for"] ||
      req.socket.remoteAddress;

    const existingUser = await pool.query(
      `
      SELECT *
      FROM users
      WHERE user_ip = $1
      `,
      [userIp]
    );

    if (existingUser.rows.length > 0) {

      return res.status(400).json({
        success: false,
        message: "Вы уже голосовали",
      });

    }

    await pool.query(
      `
      INSERT INTO users (
        user_ip,
        voted,
        voted_city
      )
      VALUES ($1, true, $2)
      `,
      [userIp, city]
    );

    const existingVote = await pool.query(
      `
      SELECT *
      FROM votes
      WHERE city = $1
      `,
      [city]
    );

    if (existingVote.rows.length > 0) {

      await pool.query(
        `
        UPDATE votes
        SET total_votes = total_votes + 1
        WHERE city = $1
        `,
        [city]
      );

    } else {

      await pool.query(
        `
        INSERT INTO votes (
          city,
          total_votes
        )
        VALUES ($1, 1)
        `,
        [city]
      );

    }

    res.json({
      success: true,
      message: "Голос принят",
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      error: error.message,
    });

  }

});

app.post("/api/admin/start", async (req, res) => {

  try {

    const { password, endDate } = req.body;

    if (password !== process.env.ADMIN_PASSWORD) {

      return res.status(401).json({
        success: false,
        message: "Неверный пароль",
      });

    }

    if (!endDate) {

      return res.status(400).json({
        success: false,
        message: "Дата не выбрана",
      });

    }

    const votingEndDate = new Date(endDate);

    await pool.query(`
      DELETE FROM settings
    `);

    await pool.query(
      `
      INSERT INTO settings (
        voting_active,
        voting_end
      )
      VALUES ($1, $2)
      `,
      [true, votingEndDate]
    );

    res.json({
      success: true,
      message: "Voting started",
      endDate: votingEndDate,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      error: error.message,
    });

  }

});

app.post("/api/admin/stop", async (req, res) => {

  try {

    const { password } = req.body;

    if (password !== process.env.ADMIN_PASSWORD) {

      return res.status(401).json({
        success: false,
        message: "Неверный пароль",
      });

    }

    await pool.query(`
      UPDATE settings
      SET voting_active = false
    `);

    res.json({
      success: true,
      message: "Voting stopped",
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      error: error.message,
    });

  }

});

app.post("/api/admin/reset", async (req, res) => {

  try {

    const { password } = req.body;

    if (password !== process.env.ADMIN_PASSWORD) {

      return res.status(401).json({
        success: false,
        message: "Неверный пароль",
      });

    }

    await pool.query(`
      DELETE FROM users
    `);

    await pool.query(`
      DELETE FROM votes
    `);

    res.json({
      success: true,
      message: "Voting reset successful",
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      error: error.message,
    });

  }

});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {

  console.log(
    `Server running on port ${PORT}`
  );

});