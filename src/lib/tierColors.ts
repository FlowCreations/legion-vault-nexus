export const getTierColor = (tier?: string | null) => {
  const normalizedTier = tier?.toLowerCase()?.trim();
  
  switch (normalizedTier) {
    case "legionnaires":
    case "legionnaire":
      return "bg-amber-500/20 text-amber-300 border-amber-500/30";
    case "outlaws":
    case "outlaw":
      return "bg-purple-500/20 text-purple-300 border-purple-500/30";
    case "rebels":
    case "rebel":
      return "bg-red-500/20 text-red-300 border-red-500/30";
    case "free":
    case "free member":
      return "bg-slate-500/20 text-slate-300 border-slate-500/30";
    default:
      return "bg-slate-500/20 text-slate-300 border-slate-500/30";
  }
};
