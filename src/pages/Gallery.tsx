import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import show1 from "@/assets/shows/show-1.jpg";
import show2 from "@/assets/shows/show-2.jpg";
import show3 from "@/assets/shows/show-3.jpg";

export default function Gallery() {
  return (
    <div className="min-h-screen bg-background">
      {/* Gallery Grid */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {galleryItems.map((item) => (
              <div
                key={item.id}
                className="bg-card border border-border rounded-lg overflow-hidden hover:border-primary/30 transition-all duration-300 group cursor-pointer"
              >
                {/* Image */}
                <div className="aspect-square relative overflow-hidden bg-background-dark">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Info */}
                <div className="p-6">
                  <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {item.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-primary">
                      {item.price}
                    </span>
                    <Button 
                      size="sm" 
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {item.buttonText}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

const galleryItems = [
  {
    id: "1",
    title: "Download social ready photos",
    description: "High-quality concert photos optimized for social media",
    image: show1,
    price: "Free",
    buttonText: "Download",
  },
  {
    id: "2",
    title: "Columbus, Ohio - Live Photos",
    description: "Sons of Legion live in Columbus",
    image: show1,
    price: "$9.99",
    buttonText: "Purchase",
  },
  {
    id: "3",
    title: "Miami, Florida - Concert Set",
    description: "Exclusive photos from Miami show",
    image: show2,
    price: "$9.99",
    buttonText: "Purchase",
  },
  {
    id: "4",
    title: "Austin, Texas - Performance",
    description: "Behind the scenes and on stage",
    image: show3,
    price: "$9.99",
    buttonText: "Purchase",
  },
  {
    id: "5",
    title: "Tour Collection 2025",
    description: "Complete photo collection from 2025 tour",
    image: show1,
    price: "$24.99",
    buttonText: "Purchase",
  },
  {
    id: "6",
    title: "Backstage Access",
    description: "Exclusive backstage moments",
    image: show2,
    price: "$14.99",
    buttonText: "Purchase",
  },
];
