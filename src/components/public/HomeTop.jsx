import React from 'react';
import { MdClear, MdSearch } from "react-icons/md";
import { IoArrowForward } from "react-icons/io5";
import { FiSearch } from "react-icons/fi";

const HomeTop = ({ query, setQuery, handleClear, results, loading, handleSelectUser, error }) => {
    return (
        <div className="flex justify-center items-center">
            <div className="text-center relative">
                <h1 className="text-4xl md:text-6xl font-clash font-semibold tracking-tight">
                    Just wrap your <br /> Github profile
                </h1>

                <div className="text-sm mt-2 md:mt-4 md:text-base font-general">
                    Insert your GitHub username and know your stats and achievements of
                    the current year
                </div>

                <div className="flex flex-col items-center my-6 gap-2 w-full group">
                    <div className="relative w-fit ">
                        <input
                            type="text"
                            autoComplete="username"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Github username"
                            className="border w-80 p-3 md:px-6 md:py-4 focus:outline-none md:w-[25vw] md:focus:w-[30vw] transition-all duration-300 font-general"
                        />

                        <button
                            onClick={handleClear}
                            className="absolute right-0 top-0 h-full w-12 bg-black dark:bg-white dark:enabled:text-black text-white flex items-center justify-center transition-all enabled:cursor-pointer disabled:cursor-not-allowed duration-300 disabled:bg-neutral-600"
                            disabled={loading || results.length < 1 || query.length < 1}
                        >
                            {loading ? (
                                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : results.length < 1 ? (
                                <FiSearch />
                            ) : (
                                <MdClear />
                            )}
                        </button>

                        {/* Dropdown */}
                        {results.length > 0 && (
                            <ul className="absolute left-0 right-0 mt-2 dark:bg-black bg-white border border-neutral-600 py-2  shadow-lg max-h-80 overflow-y-auto z-20">
                                {results.slice(0, 5).map((user) => (
                                    <li
                                        key={user.id}
                                        onClick={() => handleSelectUser(user.login)}
                                        className="group/item flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-light transition dark:hover:bg-neutral-800"
                                    >
                                        <img
                                            src={user.avatar_url}
                                            alt={user.login}
                                            className="w-8 h-8 rounded-full"
                                        />

                                        <span className="text-sm font-medium font-general">
                                            {user.login}
                                        </span>

                                        <IoArrowForward
                                            className="ml-auto text-neutral-600 transform transition-transform duration-200 group-hover/item:translate-x-2"
                                        />
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <div className="md:w-3/5 w-80 flex justify-end  transition-all duration-300 md:group-focus-within:w-[30vw]">
                        <a
                            href="https://github.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-general hover:underline "
                        >
                            forgot username?
                        </a>
                    </div>

                    {error && <p className="text-red-500 mt-2">{error}</p>}
                </div>
            </div>
        </div>
    )
}

export default HomeTop;
