require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const axios = require("axios");

const pool = require("./db");

const app = express();

app.use(cors());

app.use(helmet());

app.use(express.json());

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: "Too many requests",
  },
});

app.use(limiter);

/* =========================
   ROOT
========================= */

app.get("/", (req, res) => {

  res.json({
    success: true,
    message: "40Deg Voting API Running",
  });

});

/* =========================
   RESULTS
========================= */

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
      message: error.message,
    });

  }

});

/* =========================
   SETTINGS
========================= */

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
      message: error.message,
    });

  }

});

/* =========================
   VOTERS
========================= */

app.get("/api/voters", async (req, res) => {

  try {

    const result = await pool.query(`
      SELECT *
      FROM users
      ORDER BY id DESC
    `);

    res.json({
      success: true,
      voters: result.rows,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

});

/* =========================
   VOTE
========================= */

app.post("/api/vote", async (req, res) => {

  try {

    const { city } = req.body;

    if (!city) {

      return res.status(400).json({
        success: false,
        message: "Выберите город",
      });

    }

    const settingsResult = await pool.query(`
      SELECT *
      FROM settings
      LIMIT 1
    `);

    const settings = settingsResult.rows[0];

    if (!settings?.voting_active) {

      return res.status(400).json({
        success: false,
        message: "Голосование остановлено",
      });

    }

    const votingEnd = new Date(
      settings.voting_end
    );

    if (new Date() > votingEnd) {

      return res.status(400).json({
        success: false,
        message:
          "Время голосования закончилось",
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
      message: error.message,
    });

  }

});

/* =========================
   ADMIN START
========================= */

app.post("/api/admin/start", async (req, res) => {

  try {

    const { password, endDate } = req.body;

    if (
      password !==
      process.env.ADMIN_PASSWORD
    ) {

      return res.status(401).json({
        success: false,
        message: "Неверный пароль",
      });

    }

    if (!endDate) {

      return res.status(400).json({
        success: false,
        message: "Выберите дату",
      });

    }

    const votingEndDate = new Date(
      endDate
    );

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
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

});

/* =========================
   ADMIN STOP
========================= */

app.post("/api/admin/stop", async (req, res) => {

  try {

    const { password } = req.body;

    if (
      password !==
      process.env.ADMIN_PASSWORD
    ) {

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
      message: error.message,
    });

  }

});

/* =========================
   ADMIN RESET
========================= */

app.post("/api/admin/reset", async (req, res) => {

  try {

    const { password } = req.body;

    if (
      password !==
      process.env.ADMIN_PASSWORD
    ) {

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
      message:
        "Voting reset successful",
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

});

/* =========================
   ADMIN UPDATE VOTES
========================= */

app.post(
  "/api/admin/update-votes",
  async (req, res) => {

    try {

      const {
        password,
        city,
        votes,
      } = req.body;

      if (
        password !==
        process.env.ADMIN_PASSWORD
      ) {

        return res.status(401).json({
          success: false,
          message: "Неверный пароль",
        });

      }

      const existingVote =
        await pool.query(
          `
        SELECT *
        FROM votes
        WHERE city = $1
        `,
          [city]
        );

      if (
        existingVote.rows.length > 0
      ) {

        await pool.query(
          `
          UPDATE votes
          SET total_votes = $1
          WHERE city = $2
          `,
          [votes, city]
        );

      } else {

        await pool.query(
          `
          INSERT INTO votes (
            city,
            total_votes
          )
          VALUES ($1, $2)
          `,
          [city, votes]
        );

      }

      res.json({
        success: true,
        message: "Votes updated",
      });

    } catch (error) {

      console.log(error);

      res.status(500).json({
        success: false,
        message: error.message,
      });

    }

  }
);

/* =========================
   OSH SEND CODE
========================= */

app.post(
  "/api/osh/send-code",
  async (req, res) => {

    try {

      const {
        full_name,
        car_number,
        phone,
      } = req.body;

      if (
        !full_name ||
        !car_number ||
        !phone
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Заполните все поля",
        });

      }

      const cleanPhone =
        phone.replace(/\D/g, "");

      const code = Math.floor(
        1000 + Math.random() * 9000
      ).toString();

      const existingUser =
        await pool.query(
          `
        SELECT *
        FROM osh_users
        WHERE phone = $1
        `,
          [cleanPhone]
        );

      if (
        existingUser.rows.length > 0
      ) {

        await pool.query(
          `
          UPDATE osh_users
          SET
            full_name = $1,
            car_number = $2,
            verification_code = $3,
            verified = false
          WHERE phone = $4
          `,
          [
            full_name,
            car_number,
            code,
            cleanPhone,
          ]
        );

      } else {

        await pool.query(
          `
          INSERT INTO osh_users (
            full_name,
            car_number,
            phone,
            verification_code
          )
          VALUES ($1, $2, $3, $4)
          `,
          [
            full_name,
            car_number,
            cleanPhone,
            code,
          ]
        );

      }

      const txnId =
        "txn_" + Date.now();

      const smsResponse =
        await axios.get(
          process.env.SMS_SERVER,
          {
            headers: {
              Authorization: `Bearer ${process.env.SMS_HASH}`,
            },

            params: {
              login:
                process.env.SMS_LOGIN,

              from:
                process.env.SMS_SENDER,

              phone_number:
                cleanPhone,

              msg:
                `Код подтверждения 40-ДЕГ: ${code}`,

              txn_id: txnId,
            },
          }
        );

      console.log(
        "SMS RESPONSE:",
        smsResponse.data
      );

      res.json({
        success: true,
        message: "Код отправлен",
      });

    } catch (error) {

      console.log(
        "SMS ERROR:",
        error?.response?.data ||
          error.message
      );

      res.status(500).json({
        success: false,
        message:
          JSON.stringify(
            error?.response?.data
          ) || error.message,
      });

    }

  }
);

/* =========================
   OSH VERIFY
========================= */

app.post(
  "/api/osh/verify",
  async (req, res) => {

    try {

      const { phone, code } =
        req.body;

      const cleanPhone =
        phone.replace(/\D/g, "");

      const user = await pool.query(
        `
      SELECT *
      FROM osh_users
      WHERE phone = $1
      `,
        [cleanPhone]
      );

      if (user.rows.length === 0) {

        return res.status(400).json({
          success: false,
          message:
            "Пользователь не найден",
        });

      }

      const dbUser = user.rows[0];

      if (
        dbUser.verification_code !==
        code
      ) {

        return res.status(400).json({
          success: false,
          message: "Неверный код",
        });

      }

      await pool.query(
        `
        UPDATE osh_users
        SET verified = true
        WHERE phone = $1
        `,
        [cleanPhone]
      );

      const txnId =
        "invite_" + Date.now();

      const smsResponse =
        await axios.get(
          process.env.SMS_SERVER,
          {
            headers: {
              Authorization: `Bearer ${process.env.SMS_HASH}`,
            },

            params: {
              login:
                process.env.SMS_LOGIN,

              from:
                process.env.SMS_SENDER,

              phone_number:
                cleanPhone,

              msg:
                "Табрик! Мо шуморо бо мусофиронатон рӯзи ҷумъа аз соати 12:00 то 16:00 дар 40-ДЕГ интизорем. Барои ҳисоб накардани маблағи ош дар касса ҳамин паёмакро нишон диҳед 🍛",

              txn_id: txnId,
            },
          }
        );

      console.log(
        "INVITE SMS:",
        smsResponse.data
      );

      res.json({
        success: true,
        message:
          "Телефон подтвержден",
      });

    } catch (error) {

      console.log(
        "VERIFY ERROR:",
        error?.response?.data ||
          error.message
      );

      res.status(500).json({
        success: false,
        message:
          JSON.stringify(
            error?.response?.data
          ) || error.message,
      });

    }

  }
);

const PORT =
  process.env.PORT || 5000;

app.listen(PORT, () => {

  console.log(
    `Server running on port ${PORT}`
  );

});