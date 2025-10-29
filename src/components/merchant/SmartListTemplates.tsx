import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const SMART_LIST_TEMPLATES = [
  {
    name: "Hot Leads",
    description: "High purchase intent, no recent purchases",
    filter_rules: {
      operator: "AND",
      conditions: [
        { id: crypto.randomUUID(), field: "ptp_current", operator: ">", value: 70 },
        { id: crypto.randomUUID(), field: "total_spend", operator: "=", value: 0 }
      ],
      smart: true
    }
  },
  {
    name: "VIP Fans",
    description: "Loyal customers with high lifetime value",
    filter_rules: {
      operator: "AND",
      conditions: [
        { id: crypto.randomUUID(), field: "era_label", operator: "=", value: "Loyal" },
        { id: crypto.randomUUID(), field: "total_spend", operator: ">", value: 200 }
      ],
      smart: true
    }
  },
  {
    name: "New Subscribers",
    description: "Recently joined members",
    filter_rules: {
      operator: "AND",
      conditions: [
        { id: crypto.randomUUID(), field: "ptp_current", operator: ">", value: 0 }
      ],
      smart: true
    }
  },
  {
    name: "Engaged Fans",
    description: "High engagement scores",
    filter_rules: {
      operator: "OR",
      conditions: [
        { id: crypto.randomUUID(), field: "era_label", operator: "=", value: "Engage" },
        { id: crypto.randomUUID(), field: "era_label", operator: "=", value: "Invest" }
      ],
      smart: true
    }
  },
  {
    name: "Cold Leads",
    description: "Low purchase intent that need nurturing",
    filter_rules: {
      operator: "AND",
      conditions: [
        { id: crypto.randomUUID(), field: "ptp_status", operator: "=", value: "Cold" }
      ],
      smart: true
    }
  },
  {
    name: "Warm Prospects",
    description: "Medium purchase intent ready to convert",
    filter_rules: {
      operator: "AND",
      conditions: [
        { id: crypto.randomUUID(), field: "ptp_status", operator: "=", value: "Warm" }
      ],
      smart: true
    }
  }
];

export const createSmartLists = async () => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be logged in to create lists");
      return false;
    }

    const { error } = await supabase
      .from('email_lists')
      .insert(
        SMART_LIST_TEMPLATES.map(template => ({
          ...template,
          member_count: 0,
          user_id: user.id
        }))
      );

    if (error) throw error;
    toast.success("Smart lists created successfully");
    return true;
  } catch (error: any) {
    // Ignore duplicate errors
    if (!error.message?.includes('duplicate')) {
      toast.error("Failed to create smart lists");
    }
    return false;
  }
};
