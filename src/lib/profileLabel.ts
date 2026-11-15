import type { Dict } from "@/locales/en";
import type { Profile } from "./profile";

/** A friendly, deterministic one-liner built from the answers, e.g. "Morning rhythm, in focus mode · goal 12 h/wk · leisure: music and games". */
export function profileLabel(p: Profile, t: Dict): string {
  const L = t.profile.label;
  const rhythm = p.chronotype ? L.rhythm[p.chronotype] : L.rhythm.none;
  const goal = p.goals[0] ? L.goal[p.goals[0]] : L.goal.none;
  const parts = [`${rhythm}, ${goal}`, L.goalH.replace("{n}", String(p.weeklyGoalH))];
  if (p.tastes.length) {
    const names = p.tastes.slice(0, 2).map((x) => t.profile.tastes[x].toLowerCase());
    parts.push(L.leisure.replace("{list}", names.join(` ${L.and} `)));
  }
  return parts.join(" · ");
}
