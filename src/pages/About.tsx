import { useNavigate } from "react-router-dom";
import aboutPhoto from "@/assets/about-photo.jpg";
import featuredBanner from "@/assets/featured-banner.png";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

const About = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background pt-24">
      {/* Hero Section */}
      <section className="py-12 px-4">
          <div className="container mx-auto max-w-6xl">
            <h1 className="font-serif text-5xl md:text-7xl font-bold text-center mb-16 text-foreground">
              {t('about.title')}
            </h1>

            {/* Main Content Grid */}
            <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
              <div className="order-2 md:order-1">
                <img 
                  src={aboutPhoto} 
                  alt="Sons of Legion band members"
                  className="w-full h-auto rounded-lg shadow-2xl"
                />
              </div>

              <div className="order-1 md:order-2 space-y-6">
                <p className="text-lg leading-relaxed text-foreground/90">
                  {t('about.intro')}
                </p>

                <p className="text-lg leading-relaxed text-foreground/90">
                  {t('about.description1')}
                </p>

                <p className="text-lg leading-relaxed text-foreground/90">
                  {t('about.description2')}
                </p>
              </div>
            </div>

            {/* Featured On Section */}
            <div className="mt-20">
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">
                {t('about.featuredTitle')}
              </h2>
              <div className="max-w-5xl mx-auto">
                <img 
                  src={featuredBanner} 
                  alt="As Featured On - UFC, ESPN, Paramount, Netflix, RAM"
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Free EP CTA Section */}
        <section className="py-16 px-4 bg-card/30">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="font-serif text-4xl md:text-5xl font-bold mb-6 text-foreground">
              {t('about.cta.title')}
            </h2>
            <p className="text-xl text-foreground/80 mb-8">
              {t('about.cta.description')}
            </p>
            <Button
              onClick={() => navigate("/free-ep")}
              className="px-8 py-4 text-lg font-semibold"
              size="lg"
            >
              {t('about.cta.button')}
            </Button>
          </div>
        </section>
      </div>
  );
};

export default About;
