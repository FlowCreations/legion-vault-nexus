import { Facebook, Instagram, Youtube, Twitter } from "lucide-react";

interface EmailFooterProps {
  brandName?: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    youtube?: string;
    twitter?: string;
  };
}

export function EmailFooter({ 
  brandName = "Sons of Legion",
  socialLinks = {
    facebook: "https://facebook.com/sonsoflegion",
    instagram: "https://instagram.com/sonsoflegion",
    youtube: "https://youtube.com/sonsoflegion",
    twitter: "https://twitter.com/sonsoflegion"
  }
}: EmailFooterProps) {
  return (
    <div style={{
      backgroundColor: '#1a1a1a',
      padding: '40px 20px',
      textAlign: 'center',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff'
    }}>
      {/* Brand Name */}
      <h2 style={{
        fontSize: '24px',
        fontWeight: 'bold',
        marginBottom: '20px',
        color: '#ffffff',
        letterSpacing: '2px'
      }}>
        {brandName.toUpperCase()}
      </h2>

      {/* Social Media Icons */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '20px',
        marginBottom: '30px'
      }}>
        {socialLinks.facebook && (
          <a href={socialLinks.facebook} style={{ color: '#ffffff', textDecoration: 'none' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#333',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ fontSize: '20px' }}>f</span>
            </div>
          </a>
        )}
        {socialLinks.instagram && (
          <a href={socialLinks.instagram} style={{ color: '#ffffff', textDecoration: 'none' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#333',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ fontSize: '20px' }}>📷</span>
            </div>
          </a>
        )}
        {socialLinks.youtube && (
          <a href={socialLinks.youtube} style={{ color: '#ffffff', textDecoration: 'none' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#333',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ fontSize: '20px' }}>▶</span>
            </div>
          </a>
        )}
        {socialLinks.twitter && (
          <a href={socialLinks.twitter} style={{ color: '#ffffff', textDecoration: 'none' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#333',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ fontSize: '20px' }}>𝕏</span>
            </div>
          </a>
        )}
      </div>

      {/* Divider */}
      <div style={{
        height: '1px',
        backgroundColor: '#333',
        margin: '30px auto',
        maxWidth: '600px'
      }} />

      {/* Footer Links */}
      <div style={{
        marginBottom: '20px',
        fontSize: '14px'
      }}>
        <a href="#" style={{ color: '#999', textDecoration: 'none', margin: '0 15px' }}>Privacy Policy</a>
        <span style={{ color: '#333' }}>|</span>
        <a href="#" style={{ color: '#999', textDecoration: 'none', margin: '0 15px' }}>Terms of Service</a>
        <span style={{ color: '#333' }}>|</span>
        <a href="#" style={{ color: '#999', textDecoration: 'none', margin: '0 15px' }}>Unsubscribe</a>
      </div>

      {/* Copyright */}
      <p style={{
        fontSize: '12px',
        color: '#666',
        marginBottom: '10px'
      }}>
        © {new Date().getFullYear()} {brandName}. All rights reserved.
      </p>

      {/* Address */}
      <p style={{
        fontSize: '11px',
        color: '#555',
        lineHeight: '1.6'
      }}>
        Made with ❤️ for the Legion<br />
        You're receiving this because you're part of the family
      </p>
    </div>
  );
}

// Helper function to generate HTML string for email templates
export function getEmailFooterHTML(brandName = "Sons of Legion"): string {
  return `
    <div style="background-color: #1a1a1a; padding: 40px 20px; text-align: center; font-family: Arial, sans-serif; color: #ffffff;">
      <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 20px; color: #ffffff; letter-spacing: 2px;">
        ${brandName.toUpperCase()}
      </h2>
      
      <div style="display: flex; justify-content: center; gap: 20px; margin-bottom: 30px;">
        <a href="https://facebook.com/sonsoflegion" style="color: #ffffff; text-decoration: none;">
          <div style="width: 40px; height: 40px; border-radius: 50%; background-color: #333; display: inline-flex; align-items: center; justify-content: center;">
            <span style="font-size: 20px;">f</span>
          </div>
        </a>
        <a href="https://instagram.com/sonsoflegion" style="color: #ffffff; text-decoration: none;">
          <div style="width: 40px; height: 40px; border-radius: 50%; background-color: #333; display: inline-flex; align-items: center; justify-content: center;">
            <span style="font-size: 20px;">📷</span>
          </div>
        </a>
        <a href="https://youtube.com/sonsoflegion" style="color: #ffffff; text-decoration: none;">
          <div style="width: 40px; height: 40px; border-radius: 50%; background-color: #333; display: inline-flex; align-items: center; justify-content: center;">
            <span style="font-size: 20px;">▶</span>
          </div>
        </a>
        <a href="https://twitter.com/sonsoflegion" style="color: #ffffff; text-decoration: none;">
          <div style="width: 40px; height: 40px; border-radius: 50%; background-color: #333; display: inline-flex; align-items: center; justify-content: center;">
            <span style="font-size: 20px;">𝕏</span>
          </div>
        </a>
      </div>

      <div style="height: 1px; background-color: #333; margin: 30px auto; max-width: 600px;"></div>

      <div style="margin-bottom: 20px; font-size: 14px;">
        <a href="#" style="color: #999; text-decoration: none; margin: 0 15px;">Privacy Policy</a>
        <span style="color: #333;">|</span>
        <a href="#" style="color: #999; text-decoration: none; margin: 0 15px;">Terms of Service</a>
        <span style="color: #333;">|</span>
        <a href="#" style="color: #999; text-decoration: none; margin: 0 15px;">Unsubscribe</a>
      </div>

      <p style="font-size: 12px; color: #666; margin-bottom: 10px;">
        © ${new Date().getFullYear()} ${brandName}. All rights reserved.
      </p>

      <p style="font-size: 11px; color: #555; line-height: 1.6;">
        Made with ❤️ for the Legion<br />
        You're receiving this because you're part of the family
      </p>
    </div>
  `;
}
