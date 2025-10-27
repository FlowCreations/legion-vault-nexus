export type AutomationStepType = 
  | 'email'
  | 'delay'
  | 'condition'
  | 'action'
  | 'ab_test'
  | 'goal';

export interface BaseAutomationStep {
  id: string;
  type: AutomationStepType;
  name: string;
  position: { x: number; y: number };
}

export interface EmailStep extends BaseAutomationStep {
  type: 'email';
  emailTemplateId?: string;
  subject: string;
  body: string;
  sendTimeOptimization: boolean;
}

export interface DelayStep extends BaseAutomationStep {
  type: 'delay';
  delayType: 'fixed' | 'until_time' | 'until_day';
  delayValue: number;
  delayUnit: 'minutes' | 'hours' | 'days';
}

export interface ConditionStep extends BaseAutomationStep {
  type: 'condition';
  conditionType: 'ptp_score' | 'era_label' | 'email_opened' | 'email_clicked' | 'purchased' | 'custom';
  operator: 'greater_than' | 'less_than' | 'equals' | 'not_equals' | 'contains';
  value: any;
  truePathStepId: string;
  falsePathStepId: string;
}

export interface ActionStep extends BaseAutomationStep {
  type: 'action';
  actionType: 'add_to_list' | 'remove_from_list' | 'update_field' | 'trigger_webhook';
  actionConfig: Record<string, any>;
}

export interface ABTestStep extends BaseAutomationStep {
  type: 'ab_test';
  variants: {
    name: string;
    subject: string;
    body: string;
    percentage: number;
  }[];
  winnerCriteria: 'open_rate' | 'click_rate' | 'conversion_rate';
  testDuration: number;
}

export interface GoalStep extends BaseAutomationStep {
  type: 'goal';
  goalType: 'purchase' | 'click_link' | 'visit_page' | 'custom_event';
  goalValue?: string;
}

export type AutomationStep = EmailStep | DelayStep | ConditionStep | ActionStep | ABTestStep | GoalStep;

export interface AutomationTemplate {
  name: string;
  description: string;
  trigger_type: string;
  trigger_rules?: Record<string, any>;
  steps: AutomationStep[];
}
