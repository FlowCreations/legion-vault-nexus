import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ListPreview } from "./ListPreview";

interface FilterCondition {
  id: string;
  field: string;
  operator: string;
  value: string | number;
}

interface FilterGroup {
  id: string;
  operator: "AND" | "OR";
  conditions: FilterCondition[];
}

interface EmailListBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onListCreated: () => void;
  editingList?: any;
}

export const EmailListBuilder = ({ open, onOpenChange, onListCreated, editingList }: EmailListBuilderProps) => {
  const [name, setName] = useState(editingList?.name || "");
  const [description, setDescription] = useState(editingList?.description || "");
  const [filterGroup, setFilterGroup] = useState<FilterGroup>({
    id: "main",
    operator: "AND",
    conditions: editingList?.filter_rules?.conditions || [
      { id: crypto.randomUUID(), field: "ptp_current", operator: ">", value: 0 }
    ]
  });
  const [memberCount, setMemberCount] = useState<number | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const filterFields = [
    { value: "ptp_current", label: "PTP Score" },
    { value: "ptp_status", label: "PTP Status" },
    { value: "era_current", label: "ERA Score" },
    { value: "era_label", label: "ERA Label" },
    { value: "total_spend", label: "Total Spend" },
    { value: "subscription_tier", label: "Subscription Tier" },
    { value: "created_at", label: "Member Since" },
  ];

  const operators = {
    numeric: [
      { value: ">", label: "Greater than" },
      { value: "<", label: "Less than" },
      { value: ">=", label: "Greater or equal" },
      { value: "<=", label: "Less or equal" },
      { value: "=", label: "Equals" },
    ],
    text: [
      { value: "=", label: "Equals" },
      { value: "!=", label: "Not equals" },
      { value: "contains", label: "Contains" },
    ]
  };

  const addCondition = () => {
    setFilterGroup({
      ...filterGroup,
      conditions: [
        ...filterGroup.conditions,
        { id: crypto.randomUUID(), field: "ptp_current", operator: ">", value: 0 }
      ]
    });
  };

  const removeCondition = (id: string) => {
    setFilterGroup({
      ...filterGroup,
      conditions: filterGroup.conditions.filter(c => c.id !== id)
    });
  };

  const updateCondition = (id: string, updates: Partial<FilterCondition>) => {
    setFilterGroup({
      ...filterGroup,
      conditions: filterGroup.conditions.map(c => 
        c.id === id ? { ...c, ...updates } : c
      )
    });
  };

  const calculateMemberCount = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('query-list-members', {
        body: { filterRules: { operator: filterGroup.operator, conditions: filterGroup.conditions }, countOnly: true }
      });
      if (error) throw error;
      setMemberCount(data.count);
    } catch (error: any) {
      toast.error("Failed to calculate member count");
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Please enter a list name");
      return;
    }

    setLoading(true);
    try {
      const listData = {
        name,
        description,
        filter_rules: { operator: filterGroup.operator, conditions: filterGroup.conditions },
        member_count: memberCount || 0
      };

      if (editingList) {
        const { error } = await supabase
          .from('email_lists')
          .update(listData)
          .eq('id', editingList.id);
        if (error) throw error;
        toast.success("List updated successfully");
      } else {
        const { error } = await supabase
          .from('email_lists')
          .insert([listData]);
        if (error) throw error;
        toast.success("List created successfully");
      }

      onListCreated();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingList ? 'Edit List' : 'Create New List'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">List Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Hot Leads - NYC"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Filter Conditions</Label>
                <Select
                  value={filterGroup.operator}
                  onValueChange={(value: "AND" | "OR") => setFilterGroup({ ...filterGroup, operator: value })}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AND">AND</SelectItem>
                    <SelectItem value="OR">OR</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                {filterGroup.conditions.map((condition, index) => (
                  <div key={condition.id} className="flex gap-2 items-center p-3 border rounded-lg">
                    {index > 0 && (
                      <span className="text-xs text-muted-foreground font-semibold w-12">
                        {filterGroup.operator}
                      </span>
                    )}
                    <Select
                      value={condition.field}
                      onValueChange={(value) => updateCondition(condition.id, { field: value })}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {filterFields.map(field => (
                          <SelectItem key={field.value} value={field.value}>
                            {field.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={condition.operator}
                      onValueChange={(value) => updateCondition(condition.id, { operator: value })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {operators.numeric.map(op => (
                          <SelectItem key={op.value} value={op.value}>
                            {op.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Input
                      type="text"
                      value={condition.value}
                      onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                      className="flex-1"
                      placeholder="Value"
                    />

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCondition(condition.id)}
                      disabled={filterGroup.conditions.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button onClick={addCondition} variant="outline" size="sm" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Condition
              </Button>
            </div>

            <div className="flex gap-2">
              <Button onClick={calculateMemberCount} variant="outline" className="flex-1">
                Calculate Members
              </Button>
              <Button onClick={() => setIsPreviewOpen(true)} variant="outline" className="flex-1">
                <Eye className="h-4 w-4 mr-2" />
                Preview Members
              </Button>
            </div>

            {memberCount !== null && (
              <div className="p-3 bg-muted rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Estimated Members</p>
                <p className="text-2xl font-bold">{memberCount.toLocaleString()}</p>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? "Saving..." : editingList ? "Update List" : "Create List"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ListPreview
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        filterRules={{ operator: filterGroup.operator, conditions: filterGroup.conditions }}
      />
    </>
  );
};
