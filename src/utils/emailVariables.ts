export const AVAILABLE_VARIABLES = {
  user: {
    user_name: { label: "Full Name", example: "John Doe" },
    first_name: { label: "First Name", example: "John" },
    email: { label: "Email Address", example: "john@example.com" },
  },
  scoring: {
    ptp_score: { label: "Purchase Intent Score", example: "75" },
    ptp_status: { label: "Purchase Intent Level", example: "Hot Lead" },
    era_label: { label: "Engagement Stage", example: "Invested" },
  },
  behavior: {
    total_spend: { label: "Total Spend", example: "$125.00" },
    last_purchase_date: { label: "Last Purchase Date", example: "March 15, 2025" },
    favorite_track: { label: "Favorite Track", example: "Running Wild" },
  },
  location: {
    city: { label: "City", example: "Nashville" },
    state: { label: "State", example: "Tennessee" },
  },
};

export type EmailVariable = keyof typeof AVAILABLE_VARIABLES.user | 
  keyof typeof AVAILABLE_VARIABLES.scoring | 
  keyof typeof AVAILABLE_VARIABLES.behavior | 
  keyof typeof AVAILABLE_VARIABLES.location;

export function renderEmailContent(
  template: string,
  userData: any
): string {
  let rendered = template;

  // Replace user variables
  rendered = rendered.replace(/\{\{user_name\}\}/g, userData.display_name || userData.user_name || "there");
  rendered = rendered.replace(/\{\{first_name\}\}/g, (userData.display_name || "there").split(" ")[0]);
  rendered = rendered.replace(/\{\{email\}\}/g, userData.email || "");

  // Replace scoring variables
  rendered = rendered.replace(/\{\{ptp_score\}\}/g, userData.ptp_score?.toString() || "0");
  rendered = rendered.replace(/\{\{ptp_status\}\}/g, getPtpStatus(userData.ptp_score));
  rendered = rendered.replace(/\{\{era_label\}\}/g, userData.era_label || "New Fan");

  // Replace behavior variables
  rendered = rendered.replace(/\{\{total_spend\}\}/g, `$${(userData.total_spend || 0).toFixed(2)}`);
  rendered = rendered.replace(/\{\{last_purchase_date\}\}/g, 
    userData.last_purchase_date 
      ? new Date(userData.last_purchase_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : "N/A"
  );
  rendered = rendered.replace(/\{\{favorite_track\}\}/g, userData.favorite_track || "your favorite track");

  // Replace location variables
  rendered = rendered.replace(/\{\{city\}\}/g, userData.city || "");
  rendered = rendered.replace(/\{\{state\}\}/g, userData.state || "");

  return rendered;
}

function getPtpStatus(score: number | undefined): string {
  if (!score) return "New Fan";
  if (score >= 80) return "Ready to Buy";
  if (score >= 60) return "Hot Lead";
  if (score >= 40) return "Warm Prospect";
  if (score >= 20) return "Curious";
  return "Cold Lead";
}

export function getVariablesByCategory() {
  return Object.entries(AVAILABLE_VARIABLES).map(([category, variables]) => ({
    category: category.charAt(0).toUpperCase() + category.slice(1),
    variables: Object.entries(variables).map(([key, value]) => ({
      key,
      ...value,
      token: `{{${key}}}`,
    })),
  }));
}
