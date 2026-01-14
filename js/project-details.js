import { db, auth } from "./firebase.js";
import {
    collection,
    query,
    where,
    orderBy,
    getDocs,
    doc,
    getDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { timeAgo, priorityClass, canMoveStatus } from "./utils.js";

const urlParams = new URLSearchParams(window.location.search);
let projectId = urlParams.get('id');

// Fallback to localStorage if URL param is missing
if (!projectId) {
    console.warn("Project ID missing from URL, trying localStorage...");
    projectId = localStorage.getItem('currentProjectId');
}

console.log("Current URL:", window.location.href);
console.log("Project ID (Final):", projectId);

onAuthStateChanged(auth, async user => {
    if (!user) return (location.href = "index.html");
    document.getElementById("user").innerText = user.email;

    if (!projectId) {
        console.error("Project ID is strictly missing.");
        alert("Unable to load project. ID missing.");
        location.href = "projects.html";
        return;
    }

    // Persist it back to URL if missing for better shareability (optional, but good for UX)
    if (!urlParams.get('id')) {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('id', projectId);
        window.history.replaceState({}, '', newUrl);
    }

    await loadProjectDetails();
    await loadProjectIssues();
});

window.logout = async () => {
    await signOut(auth);
    location.href = "index.html";
};

window.createProjectIssue = () => {
    location.href = `create-issue.html?projectId=${projectId}`;
};

async function loadProjectDetails() {
    try {
        const docSnap = await getDoc(doc(db, "projects", projectId));
        if (docSnap.exists()) {
            const data = docSnap.data();
            document.getElementById("project-title").innerText = data.name;
            document.getElementById("project-desc").innerText = data.description || "No description";
            document.title = `${data.name} - IssueTracker`;
        } else {
            alert("Project not found");
            location.href = "projects.html";
        }
    } catch (e) {
        console.error("Error loading project:", e);
    }
}

async function loadProjectIssues() {
    const list = document.getElementById("project-issues");
    list.innerHTML = '<tr><td colspan="6" class="px-4 py-8 text-center text-gray-500">Loading issues...</td></tr>';

    try {
        console.log("Fetching issues for Project ID:", projectId);

        // Try optimal query first
        let q = query(collection(db, "issues"), where("projectId", "==", projectId), orderBy("createdAt", "desc"));
        let snap;

        try {
            snap = await getDocs(q);
        } catch (e) {
            console.warn("Optimal query failed (likely index), trying simple query...", e);
            // Fallback: Simple filter, client-side sort
            q = query(collection(db, "issues"), where("projectId", "==", projectId));
            snap = await getDocs(q);
        }

        console.log("Issues found:", snap.size);

        list.innerHTML = "";

        if (snap.empty) {
            console.warn("No issues found for this project. Running DEEP DEBUG to check all issues...");

            // Deep Debug: Fetch recent issues to see what's actually in the DB
            try {
                const debugQ = query(collection(db, "issues"), orderBy("createdAt", "desc")); // Fetch last 10
                const debugSnap = await getDocs(debugQ); // Get a batch

                console.log("Deep Debug: Total issues in DB:", debugSnap.size);
                debugSnap.forEach(doc => {
                    const d = doc.data();
                    console.log(`Issue [${doc.id}]: projectId [${d.projectId}] (Type: ${typeof d.projectId}) | Title: ${d.title}`);
                    if (d.projectId && d.projectId.trim() !== d.projectId) {
                        console.error("WARNING: Whitespace detected in saved projectId!");
                    }
                });
            } catch (debugErr) {
                console.error("Deep debug failed", debugErr);
            }

            list.innerHTML = `
                <tr>
                    <td colspan="6" class="px-4 py-12 text-center">
                        <p class="text-gray-400 font-medium mb-1">No issues in this project yet.</p>
                        <p class="text-gray-600 text-xs font-mono">Project ID: ${projectId}</p>
                        <p class="text-yellow-500 text-[10px] mt-2">Check Console (F12) for detailed debug info.</p>
                    </td>
                </tr>
            `;
            return;
        }

        let docs = [];
        snap.forEach(d => docs.push({ id: d.id, ...d.data() }));

        // Always sort client-side to be safe if fallback was used
        docs.sort((a, b) => {
            const timeA = a.createdAt ? a.createdAt.toMillis() : 0;
            const timeB = b.createdAt ? b.createdAt.toMillis() : 0;
            return timeB - timeA;
        });

        docs.forEach(i => {
            const row = document.createElement("tr");
            row.className = "group hover:bg-border-dark/30 transition-colors cursor-pointer";

            // Status color helper
            let statusColor = "text-gray-400";
            let statusBg = "bg-gray-500/10";
            let statusIcon = "circle";

            if (i.status === "Open") { statusColor = "text-green-500"; statusBg = "bg-green-500/10"; statusIcon = "adjust"; }
            else if (i.status === "In Progress") { statusColor = "text-blue-500"; statusBg = "bg-blue-500/10"; statusIcon = "pending"; }
            else if (i.status === "Done") { statusColor = "text-purple-400"; statusBg = "bg-purple-500/10"; statusIcon = "check_circle"; }

            const isDoneDisabled = i.status === 'Open' ? 'disabled' : '';

            row.innerHTML = `
            <td class="px-4 py-4 text-gray-500 font-mono">#${i.id.slice(0, 6)}</td>
            <td class="px-4 py-4">
                <div class="flex flex-col gap-1">
                    <span class="text-white font-medium group-hover:text-primary transition-colors">${i.title}</span>
                    <span class="text-gray-500 text-xs line-clamp-1">${i.description || 'No description'}</span>
                </div>
            </td>
            <td class="px-4 py-4">
                <span class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${priorityClass(i.priority).replace("text-", "bg-").replace("500", "500/10").replace("400", "500/10")} ${priorityClass(i.priority)} ring-${priorityClass(i.priority).replace("text-", "").replace("500", "500/20").replace("400", "500/20")}">
                        ${i.priority}
                </span>
            </td>
            <td class="px-4 py-4">
                <select id="status-${i.id}" onclick="event.stopPropagation()" onchange="changeStatus('${i.id}', this.value, '${i.status}')" class="inline-flex items-center gap-1 rounded-md ${statusBg} px-2 py-1 text-xs font-medium ${statusColor} ring-1 ring-inset ring-white/10 hover:ring-white/30 transition-all">
                    <option value="Open" ${i.status === 'Open' ? 'selected' : ''}>Open</option>
                    <option value="In Progress" ${i.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                    <option value="Done" ${i.status === 'Done' ? 'selected' : ''} ${isDoneDisabled}>Done</option>
                </select>
            </td>
            <td class="px-4 py-4">
                <div class="flex items-center gap-2">
                    <div class="flex items-center justify-center bg-gray-700 text-gray-300 text-[10px] font-bold rounded-full size-6 ring-2 ring-background-dark">
                        ${i.assignedTo ? i.assignedTo.substring(0, 2).toUpperCase() : 'UN'}
                    </div>
                    <span class="text-gray-400 text-xs">${i.assignedTo || 'Unassigned'}</span>
                </div>
            </td>
            <td class="px-4 py-4 text-right">
                <div class="flex flex-col items-end">
                    <span class="text-gray-300">${timeAgo(i.createdAt)}</span>
                    <span class="text-gray-600 text-xs">by ${i.createdBy ? i.createdBy.split('@')[0] : 'Unknown'}</span>
                </div>
            </td>
        `;
            list.appendChild(row);
        });

    } catch (e) {
        console.error("Error loading issues:", e);
        list.innerHTML = `<tr><td colspan="6" class="px-4 text-center text-red-400">Error loading issues: ${e.message}</td></tr>`;
    }
}

// Reuse changeStatus logic
// Reuse changeStatus logic
window.changeStatus = async (id, newStatus, currentStatus) => {
    // Define status order
    const statusOrder = { 'Open': 1, 'In Progress': 2, 'Done': 3 };
    const currentOrder = statusOrder[currentStatus] || 0;
    const newOrder = statusOrder[newStatus] || 0;

    // Validation: Strict forward flow
    // 1. Prevent skipping steps (e.g. Open -> Done)
    if (currentStatus === 'Open' && newStatus === 'Done') {
        alert("Invalid transition: You must mark the issue as 'In Progress' before setting it to 'Done'.");
        await loadProjectIssues(); // Refresh to revert
        return;
    }

    // 2. Prevent backward movement
    if (newOrder < currentOrder) {
        alert(`Invalid transition: You cannot revert status from '${currentStatus}' to '${newStatus}'.`);
        await loadProjectIssues(); // Refresh to revert
        return;
    }

    try {
        await updateDoc(doc(db, "issues", id), { status: newStatus });
        await loadProjectIssues(); // Refresh list
    } catch (e) {
        console.error("Error updating status:", e);
        alert("Error updating status: " + e.message);
    }
}
