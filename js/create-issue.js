import { db, auth } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
    addDoc,
    collection,
    query,
    where,
    getDocs,
    serverTimestamp,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { loadSimilarIssues } from "./smart-assist.js";

// Initialize Page
window.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    let projectId = urlParams.get('projectId');

    // Robust Fallback
    if (!projectId) {
        projectId = localStorage.getItem('currentProjectId');
        // If we recovered it, update URL for consistency
        if (projectId) {
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.set('projectId', projectId);
            window.history.replaceState({}, '', newUrl);
        }
    }

    if (projectId) {
        document.getElementById("project-banner").classList.remove("hidden");
        document.getElementById("back-link").href = `project-details.html?id=${projectId}`;
        document.getElementById("back-link").innerHTML = `<span class="material-symbols-outlined text-[18px] mr-1">arrow_back</span>Back to Project`;

        try {
            onAuthStateChanged(auth, async user => {
                if (user) {
                    const docSnap = await getDoc(doc(db, "projects", projectId));
                    if (docSnap.exists()) {
                        document.getElementById("project-name-display").innerText = docSnap.data().name;
                    } else {
                        document.getElementById("project-name-display").innerText = "Unknown Project (ID Invalid)";
                    }
                }
            });
        } catch (e) {
            console.error("Error fetching project details:", e);
        }
    }

    // Initialize Smart Assist
    const titleInput = document.getElementById("title");
    const suggestionsContainer = document.getElementById("similar-issues-list");

    if (titleInput && suggestionsContainer) {
        let debounceTimer;
        titleInput.addEventListener("input", (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                loadSimilarIssues(e.target.value, suggestionsContainer);
            }, 500);
        });
    }
});

window.createIssue = async () => {
    try {
        const title = document.getElementById("title").value;
        const desc = document.getElementById("desc").value;
        const priority = document.getElementById("priority").value;
        const status = document.getElementById("status").value;
        const assignedTo = document.getElementById("assigned").value;

        const keywords = title.toLowerCase().split(" ");

        // Check for duplicates before submitting (optional, since sidebar already shows them)
        // Leaving this logic here as a final gatekeeper, but using the same query logic as smart-assist
        // allows consistency. For now, we trust the user has seen the sidebar.

        const urlParams = new URLSearchParams(window.location.search);
        const projectId = urlParams.get('projectId');

        console.log("Creating issue for Project ID:", projectId);

        await addDoc(collection(db, "issues"), {
            title,
            description: desc,
            priority,
            status,
            assignedTo,
            createdBy: auth.currentUser.email,
            createdAt: serverTimestamp(),
            searchKeywords: keywords,
            projectId: projectId || null
        });

        alert("Issue Created");
        if (projectId) {
            location.href = `project-details.html?id=${projectId}`;
        } else {
            location.href = "dashboard.html";
        }
    } catch (e) {
        console.error("Error creating issue:", e);
        alert("Failed to create issue: " + e.message);
    }
};
