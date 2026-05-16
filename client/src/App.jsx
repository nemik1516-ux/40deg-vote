import { useEffect, useState } from "react";
import axios from "axios";

export default function App() {

  const cities = [
    "Душанбе",
    "Худжанд",
    "Бохтар",
    "Куляб",
    "Вахдат",
    "Гиссар",
    "Рудаки",
    "Турсунзаде",
    "Пенджикент",
    "Истаравшан",
    "Исфара",
    "Канибадам",
    "Нурек",
    "Яван",
    "Дангара",
    "Фархор",
    "Хорог",
    "Рашт",
    "Восе",
    "Шахринав"
  ];

  const [search, setSearch] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [voted, setVoted] = useState(false);
  const [message, setMessage] = useState("");

  const [showAdmin, setShowAdmin] = useState(false);

  const [isAdmin, setIsAdmin] = useState(false);

  const [login, setLogin] = useState("");

  const [password, setPassword] = useState("");

  const [settings, setSettings] = useState(null);

  const [endDate, setEndDate] = useState("");

  const [timeLeft, setTimeLeft] = useState("");

  const filteredCities = cities.filter((city) =>
    city.toLowerCase().includes(search.toLowerCase())
  );

  const fetchResults = async () => {

    try {

      const res = await axios.get(
        "https://four0deg-backend.onrender.com/api/results"
      );

      setResults(res.data.results);

    } catch (error) {

      console.log(error);

    }

  };

  const fetchSettings = async () => {

    try {

      const res = await axios.get(
        "https://four0deg-backend.onrender.com/api/settings"
      );

      setSettings(res.data.settings);

    } catch (error) {

      console.log(error);

    }

  };

  useEffect(() => {

    fetchResults();

    fetchSettings();

  }, []);

  useEffect(() => {

    const interval = setInterval(() => {

      if (settings?.voting_end) {

        const end = new Date(settings.voting_end);

        const now = new Date();

        const diff = end - now;

        if (diff <= 0) {

          setTimeLeft("00д 00ч 00м 00с");

          return;

        }

        const days = Math.floor(
          diff / (1000 * 60 * 60 * 24)
        );

        const hours = Math.floor(
          (diff / (1000 * 60 * 60)) % 24
        );

        const minutes = Math.floor(
          (diff / (1000 * 60)) % 60
        );

        const seconds = Math.floor(
          (diff / 1000) % 60
        );

        setTimeLeft(
          `${days}д ${hours}ч ${minutes}м ${seconds}с`
        );

      }

    }, 1000);

    return () => clearInterval(interval);

  }, [settings]);

  const handleVote = async () => {

    if (!selectedCity) return;

    try {

      setLoading(true);

      const res = await axios.post(
        "https://four0deg-backend.onrender.com/api/vote",
        {
          city: selectedCity,
        }
      );

      setMessage(res.data.message);

      setVoted(true);

      fetchResults();

    } catch (error) {

      console.log(error);

      if (error.response?.data?.message) {

        setMessage(error.response.data.message);

      } else {

        setMessage("Ошибка сервера");

      }

      setVoted(true);

    } finally {

      setLoading(false);

    }

  };

  const handleLogin = () => {

    if (
      login === "admin" &&
      password === "4040"
    ) {

      setIsAdmin(true);

      setShowAdmin(false);

    } else {

      alert("Неверный логин или пароль");

    }

  };

  const startVoting = async () => {

    try {

      const res = await axios.post(
        "https://four0deg-backend.onrender.com/api/admin/start",
        {
          password: "4040degadmin",
          endDate,
        }
      );

      alert(res.data.message);

      fetchSettings();

    } catch (error) {

      alert(
        error.response?.data?.message ||
        "Ошибка"
      );

    }

  };

  const stopVoting = async () => {

    try {

      const res = await axios.post(
        "https://four0deg-backend.onrender.com/api/admin/stop",
        {
          password: "4040degadmin",
        }
      );

      alert(res.data.message);

      fetchSettings();

    } catch (error) {

      alert(
        error.response?.data?.message ||
        "Ошибка"
      );

    }

  };

  const resetVoting = async () => {

    try {

      const res = await axios.post(
        "https://four0deg-backend.onrender.com/api/admin/reset",
        {
          password: "4040degadmin",
        }
      );

      alert(res.data.message);

      fetchResults();

    } catch (error) {

      alert(
        error.response?.data?.message ||
        "Ошибка"
      );

    }

  };

  const maxVotes =
    results.length > 0
      ? results[0].total_votes
      : 1;

  return (

    <div className="min-h-screen bg-black text-white px-4 py-8">

      <div className="max-w-md mx-auto">

        <div className="flex justify-end mb-5">

          <button
            onClick={() => setShowAdmin(true)}
            className="bg-zinc-900 border border-zinc-700 px-5 py-3 rounded-2xl"
          >
            ⚙️ Вход
          </button>

        </div>

        {showAdmin && !isAdmin && (

          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">

            <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6">

              <div className="text-center mb-6">

                <div className="text-5xl mb-4">
                  🔐
                </div>

                <h2 className="text-3xl font-bold">
                  Admin Login
                </h2>

              </div>

              <input
                type="text"
                placeholder="Login"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                className="w-full bg-black border border-zinc-700 rounded-2xl px-4 py-4 outline-none mb-4"
              />

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black border border-zinc-700 rounded-2xl px-4 py-4 outline-none mb-5"
              />

              <div className="grid grid-cols-2 gap-3">

                <button
                  onClick={handleLogin}
                  className="bg-yellow-400 text-black font-bold py-4 rounded-2xl"
                >
                  LOGIN
                </button>

                <button
                  onClick={() => setShowAdmin(false)}
                  className="bg-zinc-800 text-white py-4 rounded-2xl"
                >
                  CLOSE
                </button>

              </div>

            </div>

          </div>

        )}

        <div className="text-center mb-10">

          <div className="text-6xl mb-5">
            🍛
          </div>

          <h1 className="text-4xl font-bold leading-tight">
            Какой город будет есть бесплатный плов?
          </h1>

          <p className="text-zinc-400 mt-4">
            Голосование по городам Таджикистана
          </p>

          <div className="mt-6 bg-zinc-900 border border-zinc-800 rounded-3xl p-5">

            <div className="text-zinc-400 mb-2">
              До окончания голосования
            </div>

            <div className="space-y-3">

              <div className="text-5xl font-bold text-yellow-400 tracking-wider">
                {timeLeft || "00д 00ч 00м 00с"}
              </div>

              <div className="text-zinc-500 text-sm">

                {settings?.voting_end
                  ? `До ${new Date(
                      settings.voting_end
                    ).toLocaleString()}`
                  : "Таймер не установлен"}

              </div>

              <div className={`inline-block px-4 py-2 rounded-2xl text-sm font-bold ${
                settings?.voting_active
                  ? "bg-green-500/20 text-green-400"
                  : "bg-red-500/20 text-red-400"
              }`}>

                {settings?.voting_active
                  ? "ГОЛОСОВАНИЕ АКТИВНО"
                  : "ГОЛОСОВАНИЕ ОСТАНОВЛЕНО"}

              </div>

            </div>

          </div>

        </div>

        {!voted ? (

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">

            <input
              type="text"
              placeholder="Поиск города..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-black border border-zinc-700 rounded-2xl px-4 py-4 outline-none mb-5"
            />

            <div className="max-h-[400px] overflow-y-auto space-y-3 mb-5">

              {filteredCities.map((city, index) => (

                <button
                  key={index}
                  onClick={() => setSelectedCity(city)}
                  className={`w-full text-left px-4 py-4 rounded-2xl border transition-all ${
                    selectedCity === city
                      ? "bg-yellow-400 text-black border-yellow-400"
                      : "bg-zinc-950 border-zinc-800 hover:border-yellow-400"
                  }`}
                >
                  {city}
                </button>

              ))}

            </div>

            <button
              onClick={handleVote}
              disabled={!selectedCity || loading}
              className="w-full bg-yellow-400 text-black font-bold py-4 rounded-2xl disabled:opacity-50"
            >

              {loading
                ? "Отправка..."
                : selectedCity
                ? `Голосовать за ${selectedCity}`
                : "Выберите город"}

            </button>

          </div>

        ) : (

          <div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 mb-8 text-center">

              <div className="text-5xl mb-4">
                🎉
              </div>

              <h2 className="text-2xl font-bold mb-3">
                {message}
              </h2>

              <p className="text-zinc-400">
                Статистика голосования
              </p>

            </div>

            <div className="space-y-4">

              {results.map((item, index) => (

                <div
                  key={index}
                  className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4"
                >

                  <div className="flex justify-between mb-3">

                    <span className="font-semibold">
                      {item.city}
                    </span>

                    <span className="text-yellow-400 font-bold">
                      {item.total_votes}
                    </span>

                  </div>

                  <div className="w-full h-4 bg-zinc-800 rounded-full overflow-hidden">

                    <div
                      className="h-full bg-yellow-400 rounded-full transition-all duration-700"
                      style={{
                        width: `${(item.total_votes / maxVotes) * 100}%`,
                      }}
                    />

                  </div>

                </div>

              ))}

            </div>

          </div>

        )}

        {isAdmin && (

          <div className="mt-10 bg-zinc-900 border border-zinc-800 rounded-3xl p-5">

            <h2 className="text-3xl font-bold mb-5">
              ⚙️ Admin Dashboard
            </h2>

            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-black border border-zinc-700 rounded-2xl px-4 py-4 outline-none mb-5"
            />

            <div className="grid grid-cols-3 gap-3">

              <button
                onClick={startVoting}
                className="bg-green-500 text-black font-bold py-4 rounded-2xl"
              >
                START
              </button>

              <button
                onClick={stopVoting}
                className="bg-yellow-400 text-black font-bold py-4 rounded-2xl"
              >
                STOP
              </button>

              <button
                onClick={resetVoting}
                className="bg-red-500 text-white font-bold py-4 rounded-2xl"
              >
                RESET
              </button>

            </div>

          </div>

        )}

      </div>

    </div>

  );

}