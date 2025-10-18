export const getTierColor = (tier: string) => {
  switch (tier) {
    case "Legionnaires":
      return "bg-amber-500/20 text-amber-600 border-amber-500/30";
    case "Outlaws":
      return "bg-purple-500/20 text-purple-600 border-purple-500/30";
    case "Rebels":
      return "bg-red-500/20 text-red-600 border-red-500/30";
    default:
      return "bg-primary/20 text-primary border-primary/30";
  }
};
