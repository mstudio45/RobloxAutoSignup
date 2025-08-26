// ==UserScript==
// @name         Roblox Alt Creator
// @namespace    http://tampermonkey.net/
// @version      2025-08-26
// @description  Automatically fills out thee Sign Up page with random username.
// @author       mstudio45
// @match        https://*.roblox.com/CreateAccount
// @match        https://*.roblox.com/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=roblox.com
// @updateURL    https://github.com/mstudio45/RobloxAutoSignup/raw/refs/heads/main/script.user.js
// @downloadURL  https://github.com/mstudio45/RobloxAutoSignup/raw/refs/heads/main/script.user.js
// @grant        none
// ==/UserScript==

// storage //
const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const adjectives = ["Brave","Clever","Swift","Mighty","Silent","Fierce","Lucky","Bold","Wise","Happy","Sly","Gentle","Rapid","Bright","Epic","Fearless","Curious","Noble","Vast","Sharp","Radiant","Playful","Quiet","Loyal","Grim","Daring","Elegant","Strong","Cheerful","Mysterious"];
const nouns = ["Tiger","Falcon","Wizard","Ninja","Dragon","Knight","Phoenix","Shadow","Hunter","Wolf","Samurai","Lion","Rider","Falconer","Eagle","Panther","Bear","Viper","Stallion","Rogue","Sphinx","Griffin","Wizardry","Voyager","Sentinel","Ranger","Warrior","Champion","Seeker","Guardian"];

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// generation //
function getRandomProfile() {
    // random username //
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const number = Math.floor(Math.random() * 1000);
    const username = `${adjective}${noun}${number}`;

    // random gender //
    const genders = ["Male", "Female"];
    const gender = genders[Math.floor(Math.random() * genders.length)];

    // 13+ year old, random birthday //
    const today = new Date();
    const minYear = today.getFullYear() - 20;
    const maxYear = today.getFullYear() - 13;
    const year = Math.floor(Math.random() * (maxYear - minYear + 1)) + minYear;
    const month = Math.floor(Math.random() * 12);
    const day = Math.floor(Math.random() * 28) + 1;

    const birthday = new Date(year, month, day);

    return {
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
async function simulateMouseMovement(element, duration = 275, steps = 17) {
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

        await sleep(duration / steps + Math.random() * 20);
    }

    const finalX = rect.left + Math.random() * rect.width;
    const finalY = rect.top + Math.random() * rect.height;
    element.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true, clientX: finalX, clientY: finalY }));
    element.dispatchEvent(new MouseEvent("mouseover", { bubbles: true, clientX: finalX, clientY: finalY }));
}

async function typeIntoInput(element, sentence, speed = 125) {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;

    await simulateMouseMovement(element);
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
    await simulateMouseMovement(element);
    element.focus();
    await sleep(351);

    const nativeSetter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value").set;
    nativeSetter.call(element, value);

    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));

    await sleep(775);
}

// handler //
async function createAccount() {
    const profile = getRandomProfile();
    console.log(profile)

    // elements //
    const signUpButton = document.querySelector("#signup-button");

    const usernameInput = document.querySelector("#signup-username");
    const passwordInput = document.querySelector("#signup-password");
    const genderButton = document.querySelector("#" + profile.gender + "Button");

    const yearInput = document.querySelector("#YearDropdown");
    const monthInput = document.querySelector("#MonthDropdown");
    const dayInput = document.querySelector("#DayDropdown");

    // change birthday //
    changeValue(monthInput, profile.birthday.month); await sleep(10);
    changeValue(dayInput, profile.birthday.day); await sleep(10);
    changeValue(yearInput, profile.birthday.year); await sleep(10);
    await sleep(469);

    // type username //
    await typeIntoInput(usernameInput, profile.username, 125);
    await sleep(500);

    // type password //
    await typeIntoInput(passwordInput, profile.username + profile.gender, 125);
    await sleep(500);

    // set gender //
    await simulateMouseMovement(genderButton);
    genderButton.click();
    await sleep(500);

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
