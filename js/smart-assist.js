import { db } from "./firebase.js";
import {
    collection,
    query,
    where,
    getDocs,
    limit
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/**
 * Fetch similar issues based on title keywords
 * @param {string} title
 * @param {HTMLElement} container - sidebar DOM element
 */
export async function loadSimilarIssues(title, container) {
    if (!container) return; // Guard clause
    container.innerHTML = "";

    if (!title || title.length < 3) {
        container.innerHTML = `
            <div class="p-4 text-center">
                <p class="text-sm text-[#9da8b9]">Start typing a title to see suggestions...</p>
            </div>`;
        return;
    }

    const keywords = title.toLowerCase().split(" ").filter(k => k.length > 2).slice(0, 5);
    
    if (keywords.length === 0) return;

    try {
        const q = query(
            collection(db, "issues"),
            where("searchKeywords", "array-contains-any", keywords),
            limit(5)
        );

        const snap = await getDocs(q);

        if (snap.empty) {
            container.innerHTML = `
                <div class="p-4 text-center">
                    <p class="text-sm text-[#9da8b9]">No similar issues found.</p>
                </div>`;
            return;
        }

        snap.forEach(doc => {
            const issue = doc.data();
            const issueId = doc.id; // Get the document ID

            const div = document.createElement("div");
            div.className = "p-4 hover:bg-[#282f39] transition-colors group cursor-pointer border-b border-[#282f39] last:border-b-0";

            // Determine status color (simplified logic for now)
            let statusColor = "bg-green-500/10 text-green-500 border-green-500/20";
            if (issue.status === "In Progress") statusColor = "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
            if (issue.status === "Done") statusColor = "bg-purple-500/10 text-purple-500 border-purple-500/20";

            div.innerHTML = `
                <div class="flex justify-between items-start gap-3 mb-2">
                    <h5 class="text-[#dbe1e8] text-sm font-medium leading-snug group-hover:text-primary transition-colors">
                        ${issue.title}
                    </h5>
                    <span class="shrink-0 px-2 py-0.5 rounded text-[10px] font-bold border ${statusColor}">
                        ${issue.status ? issue.status.toUpperCase() : 'OPEN'}
                    </span>
                </div>
                <div class="flex items-center gap-3 text-xs text-[#9da8b9]">
                    <span>#${issueId.substring(0, 6)}</span>
                    <span>•</span>
                    <span>${issue.priority || 'Medium'}</span>
                </div>
            `;
            
            // Optional: Click to view details
            div.addEventListener('click', () => {
                 window.open(`issue-details.html?id=${issueId}`, '_blank');
            });

            container.appendChild(div);
        });
    } catch (error) {
        console.error("Error loading similar issues:", error);
    }
}
