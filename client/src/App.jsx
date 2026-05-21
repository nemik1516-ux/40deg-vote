import { useEffect, useState } from "react";
import axios from "axios";

const API =
  "https://four0deg-backend.onrender.com";

export default function App() {

  const cities = [
    "Душанбе",
    "Худжанд",
    "Бохтар",
    "Кӯлоб",
    "Ваҳдат",
    "Норак",
    "Панҷакент",
    "Фархор",
    "Восеъ",
    "Данғара",
    "Ҳисор",
    "Турсунзода",
    "Рашт",
    "Хоруғ",
    "Канибадам",
    "Исфара",
    "Истаравшан",
    "Ёвон",
    "Ванҷ",
    "Рӯдакӣ"
  ];

  const [search, setSearch] = useState("");

  const [selectedCity, setSelectedCity] =
    useState("");

  const [results, setResults] = useState([]);

  const [loading, setLoading] =
    useState(false);

  const [voted, setVoted] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [showAdmin, setShowAdmin] =
    useState(false);

  const [isAdmin, setIsAdmin] =
    useState(false);

  const [login, setLogin] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [settings, setSettings] =
    useState(null);

  const [endDate, setEndDate] =
    useState("");

  const [timeLeft, setTimeLeft] =
    useState("");

  const filteredCities = cities.filter(
    (city) =>
      city
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  const fetchResults = async () => {

    try {

      const res = await axios.get(
        `${API}/api/results`
      );

      setResults(res.data.results || []);

    } catch (error) {

      console.log(error);

    }

  };

  const fetchSettings = async () => {

    try {

      const res = await axios.get(
        `${API}/api/settings`
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

        const end = new Date(
          settings.voting_end
        );

        const now = new Date();

        const diff = end - now;

        if (diff <= 0) {

          setTimeLeft(
            "Время голосования закончилось"
          );

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

    try {

      if (!selectedCity) {

        alert("Выберите город");

        return;

      }

      setLoading(true);

      const res = await axios.post(
        `${API}/api/vote`,
        {
          city: selectedCity,
        }
      );

      setMessage(res.data.message);

      setVoted(true);

      fetchResults();

    } catch (error) {

      console.log(error);

      setMessage(
        error.response?.data?.message ||
        "Ошибка"
      );

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

      await axios.post(
        `${API}/api/admin/start`,
        {
          password: "4040degadmin",
          endDate,
        }
      );

      alert("Голосование запущено");

      fetchSettings();

    } catch (error) {

      console.log(error);

    }

  };

  const stopVoting = async () => {

    try {

      await axios.post(
        `${API}/api/admin/stop`,
        {
          password: "4040degadmin",
        }
      );

      alert("Голосование остановлено");

      fetchSettings();

    } catch (error) {

      console.log(error);

    }

  };

  const resetVoting = async () => {

    const confirmReset = confirm(
      "Удалить все голоса?"
    );

    if (!confirmReset) return;

    try {

      await axios.post(
        `${API}/api/admin/reset`,
        {
          password: "4040degadmin",
        }
      );

      setResults([]);

      setVoted(false);

      fetchResults();

      alert("Голоса удалены");

    } catch (error) {

      console.log(error);

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
            onClick={() =>
              setShowAdmin(true)
            }
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
                onChange={(e) =>
                  setLogin(e.target.value)
                }
                className="w-full bg-black border border-zinc-700 rounded-2xl px-4 py-4 outline-none mb-4"
              />

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
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
                  onClick={() =>
                    setShowAdmin(false)
                  }
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

          <h1 className="text-4xl font-bold leading-tight mb-4">
            Какой город будет есть бесплатный плов?
          </h1>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">

            <div className="text-zinc-400 mb-3">
              До окончания голосования
            </div>

            <div className="text-4xl font-bold text-yellow-400">
              {timeLeft}
            </div>

          </div>

        </div>

        {!voted && settings?.voting_active && (

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 mb-8">

            <input
              type="text"
              placeholder="Поиск города..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="w-full bg-black border border-zinc-700 rounded-2xl px-4 py-4 outline-none mb-5"
            />

            <div className="max-h-[400px] overflow-y-auto space-y-3 mb-5">

              {filteredCities.map(
                (city, index) => (

                  <button
                    key={index}
                    onClick={() =>
                      setSelectedCity(city)
                    }
                    className={`w-full text-left px-4 py-4 rounded-2xl border ${
                      selectedCity === city
                        ? "bg-yellow-400 text-black border-yellow-400"
                        : "bg-zinc-950 border-zinc-800"
                    }`}
                  >
                    {city}
                  </button>

                )
              )}

            </div>

            <button
              onClick={handleVote}
              disabled={loading}
              className="w-full bg-yellow-400 text-black font-bold py-4 rounded-2xl"
            >
              {loading
                ? "Отправка..."
                : "Голосовать"}
            </button>

          </div>

        )}

        {(voted ||
          !settings?.voting_active) && (

          <div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 mb-8 text-center">

              <div className="text-5xl mb-4">
                🎉
              </div>

              <h2 className="text-2xl font-bold mb-3">
                {message ||
                  "Время голосования закончилось"}
              </h2>

              <p className="text-zinc-400">
                Статистика голосования
              </p>

            </div>

            <div className="space-y-4">

              {results.map(
                (item, index) => (

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

                    <div className="w-full h-4 bg-zinc-800 rounded-full overflow-hidden mb-4">

                      <div
                        className="h-full bg-yellow-400 rounded-full"
                        style={{
                          width: `${(item.total_votes / maxVotes) * 100}%`,
                        }}
                      />

                    </div>

                    {isAdmin && (

                      <div className="grid grid-cols-3 gap-2">

                        <button
                          onClick={async () => {

                            const newVotes =
                              Number(
                                item.total_votes
                              ) + 1;

                            await axios.post(
                              `${API}/api/admin/update-votes`,
                              {
                                password:
                                  "4040degadmin",
                                city: item.city,
                                votes: newVotes,
                              }
                            );

                            fetchResults();

                          }}
                          className="bg-green-500 text-black font-bold py-2 rounded-xl"
                        >
                          +1
                        </button>

                        <button
                          onClick={async () => {

                            const newVotes =
                              Math.max(
                                0,
                                Number(
                                  item.total_votes
                                ) - 1
                              );

                            await axios.post(
                              `${API}/api/admin/update-votes`,
                              {
                                password:
                                  "4040degadmin",
                                city: item.city,
                                votes: newVotes,
                              }
                            );

                            fetchResults();

                          }}
                          className="bg-red-500 text-white font-bold py-2 rounded-xl"
                        >
                          -1
                        </button>

                        <button
                          onClick={async () => {

                            const customVotes =
                              prompt(
                                "Введите количество голосов",
                                item.total_votes
                              );

                            if (
                              customVotes ===
                              null
                            )
                              return;

                            await axios.post(
                              `${API}/api/admin/update-votes`,
                              {
                                password:
                                  "4040degadmin",
                                city: item.city,
                                votes:
                                  Number(
                                    customVotes
                                  ),
                              }
                            );

                            fetchResults();

                          }}
                          className="bg-blue-500 text-white font-bold py-2 rounded-xl"
                        >
                          EDIT
                        </button>

                      </div>

                    )}

                  </div>

                )
              )}

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
              onChange={(e) =>
                setEndDate(e.target.value)
              }
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