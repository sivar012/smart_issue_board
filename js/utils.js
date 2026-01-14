/**
 * Format Firestore timestamp -> "2 hours ago"
 */
export function timeAgo(timestamp) {
    if (!timestamp) return "Just now";

    const seconds = Math.floor((Date.now() - timestamp.toDate()) / 1000);

    const intervals = [
        { label: "year", seconds: 31536000 },
        { label: "month", seconds: 2592000 },
        { label: "day", seconds: 86400 },
        { label: "hour", seconds: 3600 },
        { label: "minute", seconds: 60 }
    ];

    for (const i of intervals) {
        const count = Math.floor(seconds / i.seconds);
        if (count >= 1) return `${count} ${i.label}${count > 1 ? "s" : ""} ago`;
    }

    return "Just now";
}

/**
 * Map priority -> color class
 */
export function priorityClass(priority) {
    switch (priority) {
        case "High":
            return "text-red-500";
        case "Medium":
            return "text-yellow-500";
        case "Low":
            return "text-green-500";
        default:
            return "text-gray-400";
    }
}

/**
 * Enforce status rule
 */
export function canMoveStatus(oldStatus, newStatus) {
    if (oldStatus === "Open" && newStatus === "Done") {
        alert("Issue must go through In Progress before Done.");
        return false;
    }
    return true;
}
