/**
 * The first-view intro flag for the home page terminal. A plain module (not
 * "use client") so the server page can inline the script below.
 */
export const TERM_INTRO_KEY = "ajd-term-intro";

/** Runs before paint on the first view of the home page; see globals.css. */
export const TERM_INTRO_SCRIPT = `try{if(!matchMedia("(prefers-reduced-motion: reduce)").matches&&!sessionStorage.getItem("${TERM_INTRO_KEY}")){document.documentElement.dataset.termIntro="play"}}catch(e){}`;
