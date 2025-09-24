// ==UserScript==
// @name         Roblox Alt Creator
// @namespace    http://tampermonkey.net/
// @version      v1.0.2
// @description  Automatically and quickly fills out the Sign Up page, generates a strong password, and copies the login to the clipboard.
// @author       mstudio45
// @match        https://*.roblox.com/CreateAccount
// @match        https://*.roblox.com/CreateAccount?*
// @match        https://*.roblox.com/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=roblox.com
// @updateURL    https://github.com/mstudio45/RobloxAutoSignup/raw/refs/heads/main/script.user.js
// @downloadURL  https://github.com/mstudio45/RobloxAutoSignup/raw/refs/heads/main/script.user.js
// @grant        GM_setClipboard
// ==/UserScript==

// storage //
const genders = ["Male", "Female"];
const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const adjectives = ["Brave","Clever","Swift","Mighty","Silent","Fierce","Lucky","Bold","Wise","Happy","Sly","Gentle","Rapid","Bright","Epic","Fearless","Curious","Noble","Vast","Sharp","Radiant","Playful","Quiet","Loyal","Grim","Daring","Elegant","Strong","Cheerful","Mysterious"];
const nouns = ["Tiger","Falcon","Wizard","Ninja","Dragon","Knight","Phoenix","Shadow","Hunter","Wolf","Samurai","Lion","Rider","Falconer","Eagle","Panther","Bear","Viper","Stallion","Rogue","Sphinx","Griffin","Wizardry","Voyager","Sentinel","Ranger","Warrior","Champion","Seeker","Guardian"];

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// generation //
function generateStrongPassword() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;,.<>?";
    let password = "";
    for (let i = 0; i < 32; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

function getRandomProfile() {
    // strong random password //
    const password = generateStrongPassword();

    // random username //
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const number = Math.floor(Math.random() * 1000);
    const username = `${adjective}${noun}${number}`;

    // random gender //
    const gender = genders[Math.floor(Math.random() * genders.length)];

    // 17+ year old, random birthday //
    const today = new Date();
    const minYear = today.getFullYear() - 21;
    const maxYear = today.getFullYear() - 17;
    const year = Math.floor(Math.random() * (maxYear - minYear + 1)) + minYear;
    const month = Math.floor(Math.random() * 12);
    const day = Math.floor(Math.random() * 18) + 11;
    const birthday = new Date(year, month, day);

    return {
        password,
        username,
        gender,
        birthday: {
            year: birthday.getFullYear(),
            month: months[month],
            day: day
        }
    };
}

// input handlers //
async function simulateMouseMovement(element, duration = 150, steps = 10) {
    const rect = element.getBoundingClientRect();

    for (let i = 0; i < steps; i++) {
        const x = rect.left + Math.random() * rect.width;
        const y = rect.top + Math.random() * rect.height;

        element.dispatchEvent(new MouseEvent("mousemove", {
            bubbles: true,
            clientX: x,
            clientY: y,
            movementX: 0,
            movementY: 0
        }));

        await sleep(duration / steps);
    }

    const finalX = rect.left + Math.random() * rect.width;
    const finalY = rect.top + Math.random() * rect.height;
    element.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true, clientX: finalX, clientY: finalY }));
    element.dispatchEvent(new MouseEvent("mouseover", { bubbles: true, clientX: finalX, clientY: finalY }));
}

async function typeIntoInput(element, sentence, speed = 3) {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    element.focus();

    return new Promise(resolve => {
        let index = 0;
        const timer = setInterval(() => {
            const char = sentence[index];
            index++;

            nativeInputValueSetter.call(element, sentence.slice(0, index));
            element.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: char }));

            if (index === sentence.length) {
                clearInterval(timer);
                element.dispatchEvent(new Event("change", { bubbles: true }));
                resolve();
            }
        }, speed);
    });
}

async function changeValue(element, value) {
    const targetValue = String(value);
    const maxAttempts = 10;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        element.focus();

        const nativeSetter = Object.getOwnPropertyDescriptor(element.__proto__, 'value').set;
        nativeSetter.call(element, targetValue);

        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));

        await sleep(50);

        if (element.value === targetValue) {
            return;
        }

        if (attempt < maxAttempts) await sleep(50);
    }

    console.error(`Failed to set value for #${element.id} to "${targetValue}" after ${maxAttempts} attempts.`);
}

// handler //
async function createAccount() {
    const profile = getRandomProfile();
    console.log(profile);

    // Copy login info to clipboard
    const loginInfo = `${profile.username}:${profile.password}`;
    GM_setClipboard(loginInfo);

    // elements //
    const signUpButton = document.querySelector("#signup-button");
    const usernameInput = document.querySelector("#signup-username");
    const passwordInput = document.querySelector("#signup-password");
    const genderButton = document.querySelector("#" + profile.gender + "Button");
    const yearInput = document.querySelector("#YearDropdown");
    const monthInput = document.querySelector("#MonthDropdown");
    const dayInput = document.querySelector("#DayDropdown");

    // Set birthday //
    await changeValue(monthInput, profile.birthday.month);
    await changeValue(dayInput, profile.birthday.day);
    await changeValue(yearInput, profile.birthday.year);

    // Type username //
    await typeIntoInput(usernameInput, profile.username);

    // Fill password //
    await changeValue(passwordInput, profile.password);

    // Set gender //
    await simulateMouseMovement(genderButton);
    genderButton.click();
    await sleep(150);

    // Click Accept //
    try { document.querySelector("#signup-checkbox").click(); } catch { }
    await sleep(150);

    // Click Sign Up //
    await simulateMouseMovement(signUpButton);
    signUpButton.click();
}

// button creation //
function createButton() {
    const area = document.querySelector(".signup-input-area");
    if (!area) { setTimeout(createButton, 100); return; }

    const button = document.createElement("button");
    button.id = "signup-randon-button";
    button.type = "button";
    button.className = "btn-primary-md signup-submit-button btn-full-width";
    button.name = "signupRandom";
    button.textContent = "Sign Up (Random Account)";
    button.onclick = createAccount;

    area.appendChild(button);
}
createButton();
