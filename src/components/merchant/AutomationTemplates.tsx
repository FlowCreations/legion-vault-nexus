import { AutomationTemplate } from "@/types/automation";

export const AUTOMATION_TEMPLATES: AutomationTemplate[] = [
  {
    name: "Welcome Series",
    description: "Onboard new subscribers with a 3-email series",
    trigger_type: "new_subscriber",
    steps: [
      {
        id: '1',
        type: 'email',
        name: 'Welcome Email',
        position: { x: 250, y: 50 },
        subject: 'Welcome to the family, {{user_name}}!',
        body: `Hey {{user_name}}!

Thanks for joining the journey. I'm excited to have you here.

As a welcome gift, here's exclusive access to my latest unreleased track.

[Listen Now]

- JRNY`,
        sendTimeOptimization: false,
        emailTemplateId: undefined
      },
      {
        id: '2',
        type: 'delay',
        name: 'Wait 2 Days',
        position: { x: 250, y: 200 },
        delayValue: 2,
        delayUnit: 'days',
        delayType: 'fixed'
      },
      {
        id: '3',
        type: 'email',
        name: 'Introduce Content',
        position: { x: 250, y: 350 },
        subject: 'Check out my latest releases',
        body: `What's up {{user_name}},

Here's what I've been working on recently:

🎵 Latest Album: "Walking on the Edge"
📹 New Music Video: Power
🎤 Behind the Scenes content

[Explore Everything]

Stay tuned for more!`,
        sendTimeOptimization: true,
        emailTemplateId: undefined
      },
      {
        id: '4',
        type: 'delay',
        name: 'Wait 3 Days',
        position: { x: 250, y: 500 },
        delayValue: 3,
        delayUnit: 'days',
        delayType: 'fixed'
      },
      {
        id: '5',
        type: 'condition',
        name: 'Opened Email?',
        position: { x: 250, y: 650 },
        conditionType: 'email_opened',
        operator: 'equals',
        value: true,
        truePathStepId: '6',
        falsePathStepId: '7'
      }
    ]
  },
  {
    name: "Abandoned Cart Recovery",
    description: "Recover sales with timely reminders",
    trigger_type: "cart_abandoned",
    trigger_rules: { min_cart_value: 20 },
    steps: [
      {
        id: '1',
        type: 'delay',
        name: 'Wait 2 Hours',
        position: { x: 250, y: 50 },
        delayValue: 2,
        delayUnit: 'hours',
        delayType: 'fixed'
      },
      {
        id: '2',
        type: 'email',
        name: 'Cart Reminder',
        position: { x: 250, y: 200 },
        subject: 'You left something behind...',
        body: `Hey {{user_name}},

I noticed you didn't complete your order.

Your cart is waiting with some great items. Complete your purchase in the next 24 hours and get 10% off!

Use code: COMEBACK10

[Complete Purchase]

- JRNY Team`,
        sendTimeOptimization: false,
        emailTemplateId: undefined
      },
      {
        id: '3',
        type: 'delay',
        name: 'Wait 24 Hours',
        position: { x: 250, y: 350 },
        delayValue: 24,
        delayUnit: 'hours',
        delayType: 'fixed'
      },
      {
        id: '4',
        type: 'condition',
        name: 'Purchased?',
        position: { x: 250, y: 500 },
        conditionType: 'purchased',
        operator: 'equals',
        value: true,
        truePathStepId: '5',
        falsePathStepId: '6'
      },
      {
        id: '5',
        type: 'goal',
        name: 'Purchase Complete',
        position: { x: 150, y: 650 },
        goalType: 'purchase'
      }
    ]
  },
  {
    name: "VIP Engagement Flow",
    description: "Nurture your top fans with exclusive content",
    trigger_type: "ptp_threshold",
    trigger_rules: { min_ptp: 80 },
    steps: [
      {
        id: '1',
        type: 'email',
        name: 'VIP Recognition',
        position: { x: 250, y: 50 },
        subject: "You're a VIP - here's something special 🌟",
        body: `{{user_name}},

You're one of my top supporters and I wanted to give you something special.

As a VIP member, you get:
✨ Early access to new releases
🎫 Priority concert tickets
📦 Exclusive merch drops
💬 Direct line to me

[Claim Your VIP Benefits]

Thank you for being part of this journey.

- JRNY`,
        sendTimeOptimization: true,
        emailTemplateId: undefined
      },
      {
        id: '2',
        type: 'action',
        name: 'Add to VIP List',
        position: { x: 250, y: 200 },
        actionType: 'add_to_list',
        actionConfig: { listId: 'vip-list' }
      },
      {
        id: '3',
        type: 'goal',
        name: 'VIP Purchase',
        position: { x: 250, y: 350 },
        goalType: 'purchase'
      }
    ]
  },
  {
    name: "Re-engagement Campaign",
    description: "Win back inactive subscribers",
    trigger_type: "inactivity",
    trigger_rules: { days_inactive: 30 },
    steps: [
      {
        id: '1',
        type: 'email',
        name: 'We Miss You',
        position: { x: 250, y: 50 },
        subject: 'We miss you, {{user_name}}',
        body: `Hey {{user_name}},

I noticed you haven't been around lately. 

Here's what you've been missing:
🎵 3 new singles
📹 Behind the scenes content
🎤 Live performance videos

[Catch Up Now]

Want to hear less from me? [Update preferences]

Hope to see you back soon!`,
        sendTimeOptimization: true,
        emailTemplateId: undefined
      },
      {
        id: '2',
        type: 'delay',
        name: 'Wait 7 Days',
        position: { x: 250, y: 200 },
        delayValue: 7,
        delayUnit: 'days',
        delayType: 'fixed'
      },
      {
        id: '3',
        type: 'condition',
        name: 'Engaged?',
        position: { x: 250, y: 350 },
        conditionType: 'email_opened',
        operator: 'equals',
        value: true,
        truePathStepId: '4',
        falsePathStepId: '5'
      }
    ]
  }
];
