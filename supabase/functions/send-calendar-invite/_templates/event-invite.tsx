import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Hr,
  Section,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface EventInviteEmailProps {
  title: string
  description: string
  location: string
  startDate: string
  endDate: string
}

export const EventInviteEmail = ({
  title,
  description,
  location,
  startDate,
  endDate,
}: EventInviteEmailProps) => {
  const startDateTime = new Date(startDate);
  const formattedDate = startDateTime.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
  });
  const formattedTime = startDateTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  return (
    <Html>
      <Head />
      <Preview>You're confirmed for {title}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>🎉 You're all set!</Heading>
          
          <Section style={eventSection}>
            <Text style={eventTitle}>{title}</Text>
            <Text style={description}>{description}</Text>
            
            <Hr style={divider} />
            
            <div style={detailsContainer}>
              <Text style={detailLabel}>📅 When</Text>
              <Text style={detailValue}>{formattedDate}</Text>
              <Text style={detailValue}>{formattedTime}</Text>
              
              <Text style={detailLabel}>📍 Where</Text>
              <Text style={detailValue}>{location}</Text>
            </div>
          </Section>

          <Section style={instructionsSection}>
            <Text style={instructionsText}>
              A calendar invite (.ics file) is attached to this email. Click on it to add this event to your calendar.
            </Text>
            <Text style={instructionsText}>
              We'll send you a reminder email with the event link 24 hours before the event starts.
            </Text>
          </Section>

          <Hr style={divider} />

          <Text style={footer}>
            Can't make it? Just remove the event from your calendar or email us.
          </Text>
          
          <Text style={signature}>
            See you there!<br />
            <strong>The Sons of Legion Team</strong>
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default EventInviteEmail;

const main = {
  backgroundColor: '#0a0a0a',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '600px',
};

const h1 = {
  color: '#f7c946',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0 0 30px',
  textAlign: 'center' as const,
};

const eventSection = {
  backgroundColor: '#1a1a1a',
  border: '2px solid #f7c946',
  borderRadius: '12px',
  padding: '30px',
  marginBottom: '30px',
};

const eventTitle = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 15px',
};

const description = {
  color: '#a0a0a0',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 20px',
};

const divider = {
  borderColor: '#333333',
  margin: '20px 0',
};

const detailsContainer = {
  marginTop: '20px',
};

const detailLabel = {
  color: '#f7c946',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '15px 0 5px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const detailValue = {
  color: '#ffffff',
  fontSize: '16px',
  margin: '0 0 5px',
};

const instructionsSection = {
  backgroundColor: '#1a1a1a',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '30px',
};

const instructionsText = {
  color: '#a0a0a0',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 15px',
};

const footer = {
  color: '#666666',
  fontSize: '14px',
  textAlign: 'center' as const,
  margin: '30px 0 20px',
};

const signature = {
  color: '#ffffff',
  fontSize: '16px',
  textAlign: 'center' as const,
  margin: '0',
};
