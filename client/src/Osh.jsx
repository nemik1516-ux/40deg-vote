import { useState } from "react";

import axios from "axios";

const API =
  "https://four0deg-backend.onrender.com";

export default function Osh() {

  const [step, setStep] =
    useState(1);

  const [loading, setLoading] =
    useState(false);

  const [fullName, setFullName] =
    useState("");

  const [carNumber, setCarNumber] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [code, setCode] =
    useState("");

  const sendCode = async () => {

    try {

      setLoading(true);

      const res = await axios.post(
        `${API}/api/osh/send-code`,
        {
          full_name: fullName,
          car_number: carNumber,
          phone,
        }
      );

      alert(res.data.message);

      setStep(2);

    } catch (error) {

      console.log(error);

      alert(
        error.response?.data?.message ||
        "Ошибка"
      );

    } finally {

      setLoading(false);

    }

  };

  const verifyCode = async () => {

    try {

      setLoading(true);

      const res = await axios.post(
        `${API}/api/osh/verify`,
        {
          phone,
          code,
        }
      );

      alert(res.data.message);

      setStep(3);

    } catch (error) {

      console.log(error);

      alert(
        error.response?.data?.message ||
        "Ошибка"
      );

    } finally {

      setLoading(false);

    }

  };

  return (

    <div className="min-h-screen bg-black text-white px-4 py-10">

      <div className="max-w-md mx-auto">

        <div className="text-center mb-10">

          <div className="text-7xl mb-5">
            🍛
          </div>

          <h1 className="text-4xl font-bold leading-tight mb-4">

            Ман ба ОШ меравам!

          </h1>

          <p className="text-zinc-400">

            Барои гирифтани оши ройгон
            маълумоти худро ворид кунед

          </p>

        </div>

        {step === 1 && (

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">

            <input
              type="text"
              placeholder="Ному насаб"
              value={fullName}
              onChange={(e) =>
                setFullName(e.target.value)
              }
              className="w-full bg-black border border-zinc-700 rounded-2xl px-4 py-4 outline-none mb-4"
            />

            <input
              type="text"
              placeholder="Рақами мошин"
              value={carNumber}
              onChange={(e) =>
                setCarNumber(e.target.value)
              }
              className="w-full bg-black border border-zinc-700 rounded-2xl px-4 py-4 outline-none mb-4"
            />

            <input
              type="text"
              placeholder="Рақами телефон"
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value)
              }
              className="w-full bg-black border border-zinc-700 rounded-2xl px-4 py-4 outline-none mb-5"
            />

            <button
              onClick={sendCode}
              disabled={loading}
              className="w-full bg-yellow-400 text-black font-bold py-4 rounded-2xl"
            >

              {loading
                ? "Отправка..."
                : "ПОДТВЕРДИТЬ"}

            </button>

          </div>

        )}

        {step === 2 && (

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">

            <div className="text-center mb-5">

              <div className="text-5xl mb-3">
                📲
              </div>

              <h2 className="text-2xl font-bold mb-2">

                Код подтверждения

              </h2>

              <p className="text-zinc-400">

                Код ба рақами шумо фиристода шуд

              </p>

            </div>

            <input
              type="text"
              placeholder="Код"
              value={code}
              onChange={(e) =>
                setCode(e.target.value)
              }
              className="w-full bg-black border border-zinc-700 rounded-2xl px-4 py-4 outline-none mb-5 text-center text-2xl tracking-widest"
            />

            <button
              onClick={verifyCode}
              disabled={loading}
              className="w-full bg-green-500 text-black font-bold py-4 rounded-2xl"
            >

              {loading
                ? "Проверка..."
                : "ПОДТВЕРДИТЬ КОД"}

            </button>

          </div>

        )}

        {step === 3 && (

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 text-center">

            <div className="text-7xl mb-5">
              🎉
            </div>

            <h2 className="text-3xl font-bold mb-4">

              Табрик!

            </h2>

            <p className="text-zinc-300 leading-8">

              Мо шуморо бо мусофиронатон
              рӯзи ҷумъа аз соати
              12:00 то 16:00
              дар 40-ДЕГ интизорем 🍛

            </p>

            <div className="mt-6 bg-black border border-zinc-700 rounded-2xl p-4 text-yellow-400">

              Барои ҳисоб накардани маблағи ош
              ҳамин SMS-ро нишон диҳед

            </div>

          </div>

        )}

      </div>

    </div>

  );

}