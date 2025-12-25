import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { MdClear, MdContentCopy, MdOutlineFileDownload, MdOutlineShare, MdOutlineStar, MdPerson, MdSearch } from "react-icons/md";
import { IoArrowForward } from "react-icons/io5";
import { FiSearch } from "react-icons/fi";
import { HomeTop } from "../components";
import images from "../assets/images";
import { RiHashtag, RiVerifiedBadgeFill } from "react-icons/ri";
import * as htmlToImage from "html-to-image";

const Home = () => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [userData, setUserData] = useState(null);
    const [repoData, setRepoData] = useState(null);
    const [profileLoading, setProfileLoading] = useState(null);
    const [stats, setStats] = useState(null);
    const [achievements, setAchievements] = useState([]);
    const [bgChange, setBgChange] = useState(false);
    const [shareMenu, setShareMenu] = useState(false);
    const navigate = useNavigate();
    const debounceTimer = useRef(null);
    const profileRef = useRef(null);

    const { username } = useParams();
    const isUsernameInParams = username ? true : false

    //Year Calculation
    const CURRENT_YEAR = new Date().getFullYear();

    const isThisYear = (dateStr) =>
        new Date(dateStr).getFullYear() === CURRENT_YEAR;


    // Fetch GitHub users
    const fetchUsers = async (searchQuery) => {
        if (!searchQuery.trim() || searchQuery.length < 2) {
            setResults([]);
            return;
        }

        try {
            setLoading(true);
            setError("");

            const res = await axios.get(
                `${import.meta.env.VITE_GITHUB_API}/search/users`,
                {
                    params: { q: searchQuery },
                    headers: {
                        Authorization: import.meta.env.VITE_GITHUB_TOKEN
                            ? `Bearer ${import.meta.env.VITE_GITHUB_TOKEN}`
                            : undefined,
                    },
                }
            );

            setResults(res.data.items || []);
            // console.log(res.data);
        } catch (err) {
            setError("Failed to fetch users. Try again.");
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    // Debounced search
    const debouncedSearch = useCallback(
        (value) => {
            clearTimeout(debounceTimer.current);
            debounceTimer.current = setTimeout(() => {
                fetchUsers(value);
            }, 500);
        },
        []
    );

    // Watch query
    useEffect(() => {
        // if (username) return; // 🚫 disable search if param exists

        if (query) debouncedSearch(query);
        else setResults([]);

        return () => clearTimeout(debounceTimer.current);
    }, [query, debouncedSearch, username]);

    const handleClear = () => {
        setQuery("");
        setResults([]);
        setError("");
    };

    // Username Fetch form URL
    useEffect(() => {
        if (!username) return;

        // clear search UI
        setQuery("");
        setResults([]);

        // fetch profile directly
        handleSelectUser(username);
    }, [username]);

    // Calculation of Stats
    const calculateStats = async (username, repos) => {
        const limitedRepos = repos.slice(0, 100); // 🔥 max 100 repos
        let activeRepos = new Set();
        let repoContributionCount = {};
        let totalCommits = 0;
        let prsOpened = 0;
        let prsMerged = 0;
        let issuesOpened = 0;
        let issuesClosed = 0;
        let languageUsage = {};
        let monthlyActivity = Array(12).fill(0);
        let starsGained = 0;

        for (const repo of limitedRepos) {
            // ⭐ Stars gained this year
            if (isThisYear(repo.created_at)) {
                starsGained += repo.stargazers_count;
            }

            // 🌐 Languages
            const langRes = await axios.get(repo.languages_url, {
                headers: {
                    Authorization: import.meta.env.VITE_GITHUB_TOKEN
                        ? `Bearer ${import.meta.env.VITE_GITHUB_TOKEN}`
                        : undefined,
                },
            });

            Object.entries(langRes.data).forEach(([lang, bytes]) => {
                languageUsage[lang] = (languageUsage[lang] || 0) + bytes;
            });

            // 🧠 Commits
            try {
                const commitRes = await axios.get(
                    `${repo.url}/commits`,
                    {
                        params: {
                            author: username,
                            per_page: 100,
                            since: `${CURRENT_YEAR}-01-01T00:00:00Z`,
                        },
                        headers: {
                            Authorization: import.meta.env.VITE_GITHUB_TOKEN
                                ? `Bearer ${import.meta.env.VITE_GITHUB_TOKEN}`
                                : undefined,
                        },
                    }
                );

                if (Array.isArray(commitRes.data)) {
                    commitRes.data.forEach(commit => {
                        if (!commit.commit?.author?.date) return;

                        const date = new Date(commit.commit.author.date);
                        if (date.getFullYear() === CURRENT_YEAR) {
                            totalCommits++;
                            activeRepos.add(repo.name);
                            repoContributionCount[repo.name] =
                                (repoContributionCount[repo.name] || 0) + 1;
                            monthlyActivity[date.getMonth()]++;
                        }
                    });
                }
            } catch (e) {
                console.warn(`Skipping commits for ${repo.name}`);
            }
        }

        const mostContributedRepo =
            Object.entries(repoContributionCount).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

        const topLanguages = Object.entries(languageUsage)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        const mostActiveMonthIndex = monthlyActivity.indexOf(Math.max(...monthlyActivity));

        return {
            activeRepos: [...activeRepos],
            mostContributedRepo,
            totalCommits,
            prsOpened,
            prsMerged,
            issuesOpened,
            issuesClosed,
            topLanguages,
            mostActiveMonth: mostActiveMonthIndex,
            starsGained,
        };
    };

    // Achievements Logic
    const calculateAchievements = (stats) => {
        const badges = [];

        /* 💻 COMMITS */
        if (stats.totalCommits >= 100)
            badges.push("🧠 Brainstormer");

        if (stats.totalCommits >= 500)
            badges.push("🏆 Code Machine");

        if (stats.totalCommits >= 1000)
            badges.push("👑 Commit Emperor");

        /* 📦 ACTIVE REPOS */
        if (stats.activeRepos.length >= 3)
            badges.push("🛠️ Marvelous Maker");

        if (stats.activeRepos.length >= 10)
            badges.push("🐯 Champion Tiger");

        if (stats.activeRepos.length >= 25)
            badges.push("🐐 The GOAT");

        /* 🌍 LANGUAGES */
        if (stats.topLanguages.length >= 2)
            badges.push("🗣️ Multilingual Mind");

        if (stats.topLanguages.length >= 5)
            badges.push("🌍 Polyglot Dev");

        if (stats.topLanguages.length >= 8)
            badges.push("🧙 Language Wizard");

        /* ⭐ STARS */
        if (stats.starsGained >= 10)
            badges.push("✨ Rising Spark");

        if (stats.starsGained >= 100)
            badges.push("⭐ Community Favorite");

        if (stats.starsGained >= 500)
            badges.push("🌟 Open Source Royalty");

        /* 🔥 CONSISTENCY */
        if (stats.mostActiveMonth !== null)
            badges.push("🔥 Momentum Monk");

        if (stats.totalCommits >= 300 && stats.activeRepos.length >= 5)
            badges.push("⚡ Hustle Mode");

        if (stats.totalCommits >= 800 && stats.activeRepos.length >= 10)
            badges.push("💥 Unstoppable Force");

        return badges;
    };

    //Handle Select User
    const handleSelectUser = async (username) => {

        setResults([]);

        try {
            setProfileLoading(true);
            setError("");

            // Fetch selected user data
            const res = await axios.get(
                `${import.meta.env.VITE_GITHUB_API}/users/${username}`,
                {
                    headers: {
                        Authorization: import.meta.env.VITE_GITHUB_TOKEN
                            ? `Bearer ${import.meta.env.VITE_GITHUB_TOKEN}`
                            : undefined,
                    },
                }
            );

            // Fetch user's repositories
            const repoRes = await axios.get(
                `${import.meta.env.VITE_GITHUB_API}/users/${username}/repos`,
                {
                    params: {
                        per_page: 100, // max allowed
                        sort: "updated", // optional
                    },
                    headers: {
                        Authorization: import.meta.env.VITE_GITHUB_TOKEN
                            ? `Bearer ${import.meta.env.VITE_GITHUB_TOKEN}`
                            : undefined,
                    },
                }
            );

            // ⭐ Total stars across all repos (lifetime)
            const totalRepoStars = repoRes.data.reduce(
                (sum, repo) => sum + repo.stargazers_count,
                0
            );

            // console.log(res.data);
            // console.log(repoRes.data.map(repo => repo.name));
            setUserData({ ...res.data, total_repo_stars: totalRepoStars, }); // ✅ store here
            setRepoData(repoRes.data);
            const computedStats = await calculateStats(username, repoRes.data);
            setStats(computedStats);
            setAchievements(calculateAchievements(computedStats));
            setQuery("");
            setResults([]);
        } catch (err) {
            setError("Failed to fetch user data.");
        } finally {
            setProfileLoading(false);
        }
    };

    const handleDownload = async () => {
        if (!profileRef.current) return;

        const buttons = profileRef.current.querySelectorAll(".download-btn");

        try {
            // 🧼 Remove button from layout
            buttons.forEach(btn => {
                btn.dataset.prevDisplay = btn.style.display;
                btn.style.display = "none";
            });

            const dataUrl = await htmlToImage.toPng(profileRef.current, {
                cacheBust: true,
                pixelRatio: 2,
            });

            const link = document.createElement("a");
            link.download = `${userData.login}-github-wrapped.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error("Image download failed", err);
        } finally {
            // ♻️ Restore button
            buttons.forEach(btn => {
                btn.style.display = btn.dataset.prevDisplay || "";
                delete btn.dataset.prevDisplay;
            });
        }
    };

    // Copy Link
    const handleCopyLink = async (currUsername) => {
        try {
            const url = `${window.location.href}${currUsername}`;
            await navigator.clipboard.writeText(url);
            // Optionally, show a notification or toast here
            // Assuming react-toastify is installed and imported
            alert('Link copied!');
        } catch (err) {
            console.error('Failed to copy link', err);
        }
    };

    const handleGlobalShare = async (currUsername) => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'GitHub Wrapped',
                    text: `Check out ${userData.login}'s GitHub Wrapped!`,
                    url: `${window.location.href}${currUsername}`,
                });
            } catch (err) {
                console.error('Share failed', err);
            }
        } else {
            // Fallback to copy link
            handleCopyLink();
        }
    };
    // Global Share

    function changeBG() {
        setBgChange(!bgChange);
        setShareMenu(!shareMenu);
    }

    return (
        <div className="py-6">
            <HomeTop handleClear={handleClear} query={query} setQuery={setQuery} results={results} loading={loading} handleSelectUser={handleSelectUser} error={error} />
            <div className="">
                <div className="">
                    <div className="flex justify-center mt-6 ">
                        {
                            profileLoading ?
                                <div className="min-w-fit max-w-3/5 p-6 rounded-3xl text-center flex flex-col font-general border-2 border-neutral-300 animate-skull shadow-lg  bg-gradient-to-b to-white from-neutral-200">
                                    <div className="flex items-center gap-4 pl-4 transition-all duration-300">
                                        <div className="flex md:h-20 w-fit transition-all duration-300">
                                            <div className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-neutral-300 p-1" />
                                            <div className="w-14 h-14 md:w-20 md:h-20 transition-all duration-300 -translate-x-4 md:-translate-x-8 object-cover rounded-full bg-neutral-200 p-1  " />
                                        </div>
                                        <div className=" flex flex-col justify-center transition-all duration-300 text-left h-full -translate-x-8">
                                            <div className="flex items-center justify-center flex-col gap-2 ">
                                                <div className="text-3xl font-bold tracking-tight h-3 w-28 md:h-4 md:w-40 rounded-xl bg-neutral-300"></div>
                                                <div className="text-3xl font-bold tracking-tight h-3 w-28 md:h-4 md:w-40 rounded-xl bg-neutral-300"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="">
                                        <div className="mt-6 grid md:grid-cols-3 gap-4">
                                            <div className="border-2 relative w-80 h-52 border-neutral-300 p-4 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between items-start before:content-[''] before:h-[1000px] before:w-20 before:-translate-y-1/2 before:top-1/2 before:bg-light/80 before:rotate-45 before:-translate-x-[100%] before:absolute before:animate-skullslide ">
                                            </div>
                                            <div className="border-2 relative w-80 h-52 border-neutral-300 p-4 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between items-start before:content-[''] before:h-[1000px] before:w-20 before:-translate-y-1/2 before:top-1/2 before:bg-light/80 before:rotate-45 before:-translate-x-[100%] before:absolute before:animate-skullslide ">
                                            </div>
                                            <div className="border-2 relative w-80 h-52 border-neutral-300 p-4 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between items-start before:content-[''] before:h-[1000px] before:w-20 before:-translate-y-1/2 before:top-1/2 before:bg-light/80 before:rotate-45 before:-translate-x-[100%] before:absolute before:animate-skullslide ">
                                            </div>
                                            <div className="border-2 relative w-80 h-52 border-neutral-300 p-4 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between items-start before:content-[''] before:h-[1000px] before:w-20 before:-translate-y-1/2 before:top-1/2 before:bg-light/80 before:rotate-45 before:-translate-x-[100%] before:absolute before:animate-skullslide ">
                                            </div>
                                            <div className="border-2 relative w-80 h-52 border-neutral-300 p-4 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between items-start before:content-[''] before:h-[1000px] before:w-20 before:-translate-y-1/2 before:top-1/2 before:bg-light/80 before:rotate-45 before:-translate-x-[100%] before:absolute before:animate-skullslide ">
                                            </div>
                                            <div className="border-2 relative w-80 h-52 border-neutral-300 p-4 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between items-start before:content-[''] before:h-[1000px] before:w-20 before:-translate-y-1/2 before:top-1/2 before:bg-light/80 before:rotate-45 before:-translate-x-[100%] before:absolute before:animate-skullslide ">
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                :
                                stats && stats.activeRepos && userData && (
                                    <div ref={profileRef} className="min-w-fit w-full  md:max-w-3/5 md:p-6 rounded-3xl text-center flex flex-col font-general border-2 border-neutral-300 shadow-lg p-2 py-4 bg-gradient-to-b to-white from-neutral-200 ">
                                        <div className="md:flex items-center justify-between ">
                                            <div className="w-full md:h-full flex items-center gap-3 md:gap-4 md:pl-4 group transition-all duration-300">
                                                <div className="flex md:h-20 w-fit group-hover:gap-0 transition-all duration-300 h-14">
                                                    <img src={images.BigLogo} className="md:w-20 w-14 rounded-full bg-white p-1" />
                                                    <img src={userData.avatar_url} className="w-14 md:w-20 group-hover:translate-x-0 transition-all duration-300 -translate-x-6 md:-translate-x-8 object-cover rounded-full bg-white p-1" />
                                                </div>
                                                <div className=" flex flex-col group-hover:translate-x-0 transition-all duration-300 text-left -translate-x-8">
                                                    <div className="flex items-center gap-2 ">
                                                        <h2 className="text-xl md:text-3xl font-bold tracking-tight">{userData.name || userData.login}</h2>
                                                        {userData.login === "thinakaranmanokaran" && (<span className=" text-blue-500 text-2xl -mb-1" title="The one who Build this "><RiVerifiedBadgeFill /></span>)}
                                                    </div>
                                                    <p className="text-neutral-600">@{userData.login}</p>
                                                </div>
                                            </div>
                                            {
                                                !isUsernameInParams && <div className="md:hidden flex p-4 justify-end gap-2 text-xl ">
                                                    <button onClick={() => handleCopyLink(userData.login)} className="bg-white shadow-sm p-2 rounded-xl "><MdContentCopy /></button>
                                                    <button onClick={handleDownload} className="bg-white shadow-sm p-2 rounded-xl "><MdOutlineFileDownload /></button>
                                                    <button onClick={() => handleGlobalShare(userData.login)} className="bg-white shadow-sm p-2 rounded-xl "><MdOutlineShare /></button>
                                                </div>
                                            }
                                            <div className="hidden md:flex items-center gap-6 relative">
                                                <div className="md:flex items-center gap-2 my-4">
                                                    <div className="flex items-center text-4xl mr-2 font-bold  gap-0.5 "><MdPerson className="text-red-500 mt-0.5" /><span className="">{userData?.followers || 32}</span></div>
                                                    <div className="hidden md:block h-8 w-[1px] bg-neutral-500 " />
                                                    <div className="flex items-center text-4xl font-bold  gap-0.5 "><MdOutlineStar className="text-orange-400 mt-0.5" /><span className="">{userData?.total_repo_stars ?? 0}</span></div>
                                                </div>
                                                {/*  */}
                                                {!isUsernameInParams && <button onClick={changeBG} className={`download-btn bg-black px-8 py-3 text-white rounded-full  shadow-sm shadow-black cursor-pointer before:content-[''] before:absolute before:inset-0 before:bg-zinc-200 relative before:-rotate-45 before:-translate-x-full hover:before:translate-x-full transition-all duration-1000 before:transition-all before:duration-1000 overflow-hidden z-20 ${bgChange ? "outline-8 outline-white" : ""}`}>Share</button>}
                                                {
                                                    shareMenu && <div className="bg-white download-btn absolute right-0 shadow-md top-20 z-20  rounded-3xl flex flex-col p-3 ">
                                                        <button className="px-3 transition-all duration-300 cursor-pointer py-1.5 hover:bg-neutral-300 rounded-2xl" onClick={() => handleCopyLink(userData.login)}>Copy Link</button>
                                                        <button onClick={handleDownload} className="px-3 transition-all duration-300 cursor-pointer py-1.5 hover:bg-neutral-300 rounded-2xl">Download</button>
                                                        <button className="px-3 transition-all duration-300 cursor-pointer py-1.5 hover:bg-neutral-300 rounded-2xl" onClick={() => handleGlobalShare(userData.login)}>Share</button>
                                                    </div>
                                                }
                                                {bgChange && <div className="bg-neutral-500/40 fixed z-10 h-screen w-screen top-0 left-0 download-btn"></div>}
                                            </div>
                                        </div>
                                        <div className="">
                                            {stats && stats.activeRepos && (
                                                <div className="mt-6 flex flex-col items-center md:grid  md:grid-cols-2 lg:grid-cols-3 gap-4 ">
                                                    <div className="border-2 relative w-80 h-52 border-neutral-300 p-4 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between items-start">
                                                        <span className="text-xl font-medium tracking-tight text-neutral-500">Active Repos </span>
                                                        <span className="text-8xl font-semibold tracking-tighter font-clash leading-16 text-nowrap">{stats.activeRepos.length}</span>
                                                        <img src={images.Trophy} alt="Trophy" className="absolute top-4 right-4 w-20" />
                                                    </div>
                                                    <div className="border-2 relative w-80 h-52 border-neutral-300 p-4 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between items-start">
                                                        <span className="text-xl font-medium tracking-tight text-neutral-500">Commits </span>
                                                        <span className="text-8xl font-semibold tracking-tighter font-clash leading-16 text-nowrap">{stats.totalCommits}</span>
                                                        <img src={images.Commits} alt="Commits" className="absolute top-4 right-4 w-20" />
                                                    </div>
                                                    <div className="border-2 relative w-80 h-52 border-neutral-300 p-4 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between items-start">
                                                        <span className="text-xl font-medium tracking-tight text-neutral-500">Stars </span>
                                                        <span className="text-8xl font-semibold tracking-tighter font-clash leading-16 text-nowrap">{stats.starsGained}</span>
                                                        <img src={images.Star} alt="Top Repo" className="absolute top-4 right-4 w-20" />
                                                    </div>
                                                    <div className="border-2 relative w-80 h-52 border-neutral-300 p-4 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between items-start">
                                                        <span className="text-xl font-medium tracking-tight text-neutral-500">Top Repo </span>
                                                        <span className="text-4xl font-medium text-nowrap  tracking-tighter">{stats.mostContributedRepo}</span>
                                                        <img src={images.TopRepo} alt="Top Repo" className="absolute top-0 -right-0 w-20" />
                                                    </div>
                                                    <div className="border-2 relative w-80 h-52 border-neutral-300 p-4 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between items-start">
                                                        <span className="text-xl font-medium tracking-tight text-neutral-500">Top Language </span>
                                                        <span className="text-4xl font-medium tracking-tighter text-nowrap">{stats.topLanguages[0]?.[0] || 'N/A'}</span>
                                                        <img src={images.Languages} alt="Top Language" className="absolute top-0 -right-0 w-20" />
                                                    </div>
                                                    <div className="border-2 relative w-80 h-52 border-neutral-300 p-4 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between items-start">
                                                        <span className="text-xl font-medium tracking-tight text-neutral-500">Consistency </span>
                                                        <span className="text-4xl font-medium tracking-tighter text-nowrap">{new Date(0, stats.mostActiveMonth).toLocaleString("default", { month: "long" })}</span>
                                                        <img src={images.Month} alt="Top Repo" className="absolute top-4 right-4 w-20" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="md:max-w-fit">
                                            {achievements.length > 0 && (
                                                <div className="mt-16">
                                                    <h3 className="text-4xl font-medium mb-6 tracking-tighter flex justify-center items-center"><span className="text-orange-400"><RiHashtag /></span><h3 className="selection:bg-orange-400 ">Badges</h3></h3>
                                                    <div className="flex gap-2 md:w-[60vw] flex-wrap justify-center">
                                                        {achievements.map((badge) => (
                                                            <span key={badge} className="px-6 py-3 bg-black text-white rounded-full shadow-sm shadow-black before:content-[''] before:absolute before:inset-0 before:bg-zinc-200 relative before:-rotate-45 before:-translate-x-full hover:before:translate-x-full transition-all duration-1000 before:transition-all before:duration-1000 overflow-hidden pl-4">
                                                                {badge}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
