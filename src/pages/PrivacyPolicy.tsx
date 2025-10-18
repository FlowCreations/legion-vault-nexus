export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen pt-32 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-serif text-5xl md:text-6xl font-bold text-center mb-8 text-white">
          Privacy Policy
        </h1>
        
        <div className="space-y-8 text-foreground/90">
          <div>
            <p className="text-lg mb-4">
              <strong>Last updated:</strong> September 13, 2024
            </p>
            <p className="leading-relaxed">
              Sons of Legion ("we," "us," or "our") is committed to protecting the privacy of our website visitors and fans. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website https://www.sonsoflegion.com/ or interact with us through our online platforms.
            </p>
            <p className="leading-relaxed mt-4">
              Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white mb-4">Information We Collect</h2>
            <p className="leading-relaxed mb-4">
              We collect information that you provide directly to us, as well as information collected automatically when you use our website.
            </p>
            
            <div className="ml-4 space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Information You Provide to Us:</h3>
                <ul className="list-disc ml-6 space-y-2">
                  <li>Personal information, such as your name and email address, when you sign up for our mailing list</li>
                  <li>Communication preferences</li>
                  <li>Any other information you choose to provide</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Information We Collect Automatically:</h3>
                <ul className="list-disc ml-6 space-y-2">
                  <li>Usage details, IP address, browser type, and operating system</li>
                  <li>Information collected through cookies and similar technologies</li>
                  <li>Information about your interactions with our website and advertisements</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white mb-4">Use of Your Information</h2>
            <p className="leading-relaxed mb-4">
              We use the information we collect about you for various purposes, including:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li>To provide, maintain, and improve our website and services</li>
              <li>To send you updates, newsletters, and marketing communications</li>
              <li>To respond to your comments, questions, and requests</li>
              <li>To monitor and analyze trends, usage, and activities in connection with our website</li>
              <li>To personalize your experience on our website and deliver content relevant to your interests</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white mb-4">Sharing of Your Information</h2>
            <p className="leading-relaxed mb-4">
              We may share your information in the following situations:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li>With service providers who perform services on our behalf</li>
              <li>To comply with legal obligations</li>
              <li>To protect and defend our rights and property</li>
              <li>With your consent or at your direction</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white mb-4">Third-Party Tools and Services</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Meta Pixel</h3>
                <p className="leading-relaxed">
                  We use Meta Pixel on our website, which allows us to measure, optimize, and build audiences for our advertising campaigns. Meta may use the data collected to provide advertising services on and off our website.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Google Analytics</h3>
                <p className="leading-relaxed">
                  We use Google Analytics to help us understand how our customers use the Site. You can read more about how Google uses your Personal Information here:{" "}
                  <a 
                    href="https://www.google.com/intl/en/policies/privacy/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    https://www.google.com/intl/en/policies/privacy/
                  </a>
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Advertising</h3>
                <p className="leading-relaxed">
                  We may use third-party advertising companies to serve ads when you visit our website. These companies may use information about your visits to our website and other websites to provide advertisements about goods and services of interest to you.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white mb-4">Your Privacy Choices</h2>
            <p className="leading-relaxed">
              You can opt out of receiving promotional emails from us by following the instructions in those emails. You can also modify your cookie settings through your browser.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white mb-4">Data Security</h2>
            <p className="leading-relaxed">
              We have implemented measures designed to secure your personal information from accidental loss and from unauthorized access, use, alteration, and disclosure.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white mb-4">Changes to Our Privacy Policy</h2>
            <p className="leading-relaxed">
              We may update our privacy policy from time to time. We will notify you of any changes by posting the new privacy policy on this page and updating the "Last updated" date at the top of this policy.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white mb-4">Contact Us</h2>
            <p className="leading-relaxed">
              If you have any questions about this privacy policy, please contact us at:{" "}
              <a 
                href="mailto:sonsoflegionmusic@gmail.com" 
                className="text-primary hover:underline"
              >
                sonsoflegionmusic@gmail.com
              </a>
            </p>
          </div>

          <div className="pt-4 border-t border-border">
            <p className="leading-relaxed font-medium">
              By using our website, you consent to our privacy policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}