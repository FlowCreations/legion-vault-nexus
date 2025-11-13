import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const SMART_LIST_TEMPLATES = [
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
  },
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
    name: "New Subscribers",
    description: "Recently joined members",
    filter_rules: {
      operator: "AND",
      conditions: [
        { id: crypto.randomUUID(), field: "ptp_current", operator: ">", value: 0 }
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

    // Check existing lists first
    const { data: existingLists } = await supabase
      .from('email_lists')
      .select('name')
      .eq('user_id', user.id);
    
    const existingNames = new Set(existingLists?.map(l => l.name) || []);
    
    // Filter out templates that already exist
    const newTemplates = SMART_LIST_TEMPLATES.filter(
      template => !existingNames.has(template.name)
    );
    
    if (newTemplates.length === 0) {
      return true; // All lists already exist
    }

    // Insert only new lists with ON CONFLICT handling
    const { error } = await supabase
      .from('email_lists')
      .insert(
        newTemplates.map(template => ({
          ...template,
          member_count: 0,
          user_id: user.id
        }))
      )
      .select();

    if (error) {
      // Silently handle duplicate key errors (constraint violation)
      if (error.code === '23505') {
        return true;
      }
      throw error;
    }
    
    if (newTemplates.length > 0) {
      toast.success(`Created ${newTemplates.length} smart list${newTemplates.length > 1 ? 's' : ''}`);
    }
    return true;
  } catch (error: any) {
    console.error('Error creating smart lists:', error);
    if (!error.message?.includes('duplicate') && error.code !== '23505') {
      toast.error("Failed to create smart lists");
    }
    return false;
  }
};
