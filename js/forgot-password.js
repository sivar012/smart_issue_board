import { getAuth, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import { firebaseConfig } from "./config.js";

/* Initialize Firebase */
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

/* Form submit */
document.getElementById("resetForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();

    if (!email) {
        alert("Please enter your email address.");
        return;
    }

    try {
        await sendPasswordResetEmail(auth, email);
        alert("✅ Password reset link sent! Please check your email.");
    } catch (error) {
        console.error(error);
        alert(error.message.replace("Firebase:", ""));
    }
});
