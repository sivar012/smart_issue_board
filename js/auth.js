import { auth } from "./firebase.js";
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    sendPasswordResetEmail,
    GoogleAuthProvider,
    signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

window.login = async () => {
    try {
        await signInWithEmailAndPassword(auth, email.value, password.value);
        location.href = "dashboard.html";
    } catch (e) {
        alert("Login failed: " + e.message);
        console.error(e);
    }
};

window.signup = async () => {
    try {
        await createUserWithEmailAndPassword(auth, email.value, password.value);
        location.href = "dashboard.html";
    } catch (e) {
        alert("Signup failed: " + e.message);
        console.error(e);
    }
};

window.loginWithGoogle = async () => {
    try {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
        location.href = "dashboard.html";
    } catch (e) {
        console.error("Google Sign-In Error:", e);
        alert("Google Sign-In failed: " + e.message);
    }
};

window.logout = async () => {
    try {
        await signOut(auth);
        location.href = "index.html";
    } catch (e) {
        console.error(e);
    }
};

export function protect() {
    onAuthStateChanged(auth, user => {
        if (!user) location.href = "index.html";
    });
}

// Toggle Button Text Logic
const radios = document.getElementsByName("auth-toggle");
const submitBtnSpan = document.querySelector("#auth-form button[type='submit'] span");

if (radios.length > 0 && submitBtnSpan) {
    radios.forEach(radio => {
        radio.addEventListener("change", (e) => {
            if (e.target.value === "Sign Up") {
                submitBtnSpan.innerText = "Sign Up";
            } else {
                submitBtnSpan.innerText = "Sign In";
            }
        });
    });
}

// Password Visibility Toggle
const togglePasswordBtn = document.querySelector("#password + button");
const passwordInput = document.querySelector("#password");

if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener("click", () => {
        const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
        passwordInput.setAttribute("type", type);

        // Toggle Icon
        const iconSpan = togglePasswordBtn.querySelector("span");
        if (iconSpan) {
            iconSpan.textContent = type === "password" ? "visibility_off" : "visibility";
        }
    });
}

function resetPassword() {
    const email = document.getElementById('reset-email').value;
    if (!email) {
        alert('Please enter your email address');
        return;
    }
    // Use Firebase to send a password reset email
    sendPasswordResetEmail(auth, email)
        .then(() => {
            alert('Password reset email sent to ' + email);
        })
        .catch((error) => {
            console.error('Error sending reset email:', error);
            alert('Failed to send reset email: ' + error.message);
        });
}
window.resetPassword = resetPassword;
