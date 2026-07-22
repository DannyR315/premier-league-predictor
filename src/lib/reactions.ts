// Shared between the reaction picker (client) and toggleReaction (server) —
// the server re-validates against this list since a Server Action is
// reachable directly via POST regardless of what the UI offers.
export const REACTION_EMOJIS = ["👍", "🔥", "😂", "😮", "💀"] as const;
