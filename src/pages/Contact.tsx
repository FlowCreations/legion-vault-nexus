export default function Contact() {
  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-8">Beware of Scammers</h1>
          
          <div className="space-y-6 text-lg text-foreground/80">
            <p>
              There are loads of fake accounts, pages, and people who prey on fans pretending to be us.
            </p>
            
            <p>
              Currently, we DO NOT have any backup accounts on any of these platforms - all our official pages are linked here on our website above and below via the icons.
            </p>
            
            <p>
              We DO NOT use Telegram, Discord, WhatsApp, or Signal to chat.
            </p>
            
            <p>
              We will NEVER ask you to buy a random gift card from other companies.
            </p>
            
            <p>
              We do not offer &quot;membership cards&quot; or private VIP merch.
            </p>
            
            <p>
              We DO NOT have a social media representative reaching out for a personal conversation with us.
            </p>
            
            <p>
              We are NOT doing &quot;private investigations&quot; with fans.
            </p>
            
            <p>
              Please NEVER give your personal financial details in a direct message, chat, or through email.
            </p>
            
            <p>
              They DO NOT have private, secret, or backup chats/accounts - those tend to be romance scammers where they are trying to make you believe they want to date you, fall in love with you, and then ask you to send them money.
            </p>
            
            <p>
              The DM&apos;s we send are ones you initiate to get our FREE &quot;Power&quot; Album which you can get by going to{" "}
              <a href="/free-ep" className="text-primary hover:underline">
                https://sonsoflegion.com/free-ep
              </a>
            </p>
            
            <p>
              Access our official community in Heartbeat by going to{" "}
              <a 
                href="https://community.sonsoflegion.com/invitation?code=BEDG4G" 
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                https://community.sonsoflegion.com/invitation?code=BEDG4G
              </a>
            </p>
          </div>
        </div>

        {/* Social Media Icons */}
        <div className="flex justify-center gap-4 mt-12 mb-8">
          <a href="https://www.tiktok.com/@sonsoflegion" target="_blank" rel="noopener noreferrer" 
             className="w-12 h-12 bg-foreground text-background flex items-center justify-center rounded hover:opacity-80 transition-opacity">
            <span className="text-xl font-bold">T</span>
          </a>
          <a href="https://www.instagram.com/sonsoflegion" target="_blank" rel="noopener noreferrer"
             className="w-12 h-12 bg-foreground text-background flex items-center justify-center rounded hover:opacity-80 transition-opacity">
            <span className="text-xl font-bold">I</span>
          </a>
          <a href="https://www.facebook.com/sonsoflegion" target="_blank" rel="noopener noreferrer"
             className="w-12 h-12 bg-foreground text-background flex items-center justify-center rounded hover:opacity-80 transition-opacity">
            <span className="text-xl font-bold">F</span>
          </a>
          <a href="https://www.youtube.com/@sonsoflegion" target="_blank" rel="noopener noreferrer"
             className="w-12 h-12 bg-foreground text-background flex items-center justify-center rounded hover:opacity-80 transition-opacity">
            <span className="text-xl font-bold">Y</span>
          </a>
          <a href="https://open.spotify.com/artist/sonsoflegion" target="_blank" rel="noopener noreferrer"
             className="w-12 h-12 bg-foreground text-background flex items-center justify-center rounded hover:opacity-80 transition-opacity">
            <span className="text-xl font-bold">S</span>
          </a>
          <a href="https://music.apple.com/us/artist/sonsoflegion" target="_blank" rel="noopener noreferrer"
             className="w-12 h-12 bg-foreground text-background flex items-center justify-center rounded hover:opacity-80 transition-opacity">
            <span className="text-xl font-bold">A</span>
          </a>
          <a href="https://twitter.com/sonsoflegion" target="_blank" rel="noopener noreferrer"
             className="w-12 h-12 bg-foreground text-background flex items-center justify-center rounded hover:opacity-80 transition-opacity">
            <span className="text-xl font-bold">X</span>
          </a>
        </div>

        <h2 className="text-6xl font-bold text-center text-primary mb-8">CONTACT</h2>
        
        <div className="text-center space-y-4 text-lg">
          <p>
            <strong>Booking & Press:</strong>{" "}
            <a href="mailto:booking@sonsoflegion.com" className="text-primary hover:underline">
              booking@sonsoflegion.com
            </a>
          </p>
          
          <p>
            <strong>General Inquiries:</strong>{" "}
            <a href="mailto:info@sonsoflegion.com" className="text-primary hover:underline">
              info@sonsoflegion.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
