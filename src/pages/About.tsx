import featuredOn from "@/assets/featured-on.jpg";
import aboutPhoto from "@/assets/about-photo.jpg";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <h1 className="text-5xl md:text-7xl font-bold text-center mb-16 text-foreground">
              SONS OF LEGION
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
                  Just two guys from opposite sides of the country that happened to cross paths and chose to walk down the same road.
                </p>

                <p className="text-lg leading-relaxed text-foreground/90">
                  Sons of Legion is a dynamic band blending the raw energy of rock, the soulful depth of blues, and the timeless appeal of soul music. With a style that marries rugged grit with sophisticated class, they channel a vibe reminiscent of the GREATEST bands of the past.
                </p>

                <p className="text-lg leading-relaxed text-foreground/90">
                  Renowned for their powerful performances and compelling lyrics, Sons of Legion have captivated audiences worldwide. Their music, featuring standout tracks like "Brand New Day," "Power," and "Firestarter," has garnered over 55 million streams and is featured on major platforms like ESPN, Dodge Ram commercials, Netflix, and NBC.
                </p>
              </div>
            </div>

            {/* Featured On Section */}
            <div className="mt-20">
              <img 
                src={featuredOn} 
                alt="As Featured On - Netflix, RAM, UFC, NBC"
                className="w-full h-auto max-w-4xl mx-auto"
              />
            </div>
          </div>
        </section>
      </div>
  );
};

export default About;
