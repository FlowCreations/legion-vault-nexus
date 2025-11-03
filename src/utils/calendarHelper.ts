export const generateICSFile = (eventDetails: {
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
}) => {
  const startDateTime = new Date(eventDetails.startDate);
  const endDateTime = new Date(eventDetails.endDate);
  
  const formatDateForICS = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Sons of Legion//EN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${crypto.randomUUID()}@sonsoflegion.com
DTSTAMP:${formatDateForICS(new Date())}
DTSTART:${formatDateForICS(startDateTime)}
DTEND:${formatDateForICS(endDateTime)}
SUMMARY:${eventDetails.title}
DESCRIPTION:${eventDetails.description}
LOCATION:${eventDetails.location}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;

  return icsContent;
};

export const downloadICSFile = (icsContent: string, filename: string = 'event.ics') => {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
