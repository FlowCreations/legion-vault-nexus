import { Download, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import show1 from "@/assets/shows/show-1.jpg";
import show2 from "@/assets/shows/show-2.jpg";
import show3 from "@/assets/shows/show-3.jpg";
import nyCap from "@/assets/merch/ny-cap-updated.png";
import nyTshirt from "@/assets/merch/ny-tshirt-yellow.png";
import nyTshirt2 from "@/assets/merch/ny-tshirt-final.png";
import nySweater from "@/assets/merch/ny-hoodie-final.png";

export default function Gallery() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Back Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/shows')}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Shows
        </Button>
      </div>

      {/* Hero Banner */}
      <section className="relative aspect-[21/9] bg-background-dark overflow-hidden mb-12">
        <img
          src={show1}
          alt="Concert venue"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-start gap-4 mb-4">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-3 text-center">
                <div className="text-xs text-white/70 uppercase">Mar</div>
                <div className="text-2xl font-bold text-white">15</div>
              </div>
              <div>
                <h1 className="text-3xl sm:text-5xl font-bold text-white mb-2">
                  New York, NY
                </h1>
                <p className="text-xl text-white/80">Madison Square Garden</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="mb-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {socialReadyPhotos.map((item) => (
              <div
                key={item.id}
                className="bg-card border border-border rounded-lg overflow-hidden hover:border-primary/30 transition-all duration-300 group cursor-pointer"
              >
                <div className="aspect-square relative overflow-hidden bg-background-dark">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="text-white text-sm font-medium bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full">
                      Quick view
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-medium mb-2 group-hover:text-primary transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-lg font-bold text-primary">{item.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* New York Merch */}
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-6">New York Merch</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {nyMerch.map((item) => (
              <div
                key={item.id}
                className="bg-card border border-border rounded-lg overflow-hidden hover:border-primary/30 transition-all duration-300 group cursor-pointer"
              >
                <div className="aspect-square relative overflow-hidden bg-background-dark">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    style={{ objectPosition: '40% center' }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="text-white text-sm font-medium bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full">
                      Quick view
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-medium mb-2 group-hover:text-primary transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-lg font-bold text-primary">{item.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

const socialReadyPhotos = [
  {
    id: "1",
    title: "Download social ready photos",
    image: show1,
    price: "FREE",
  },
  {
    id: "3",
    title: "High resolution print quality photos",
    image: show3,
    price: "$14.99",
  },
];

const nyMerch = [
  {
    id: "1",
    title: "SOL NYC Cap",
    image: nyCap,
    price: "$29.99",
  },
  {
    id: "2",
    title: "LEGION NYC T-Shirt",
    image: nyTshirt,
    price: "$34.99",
  },
  {
    id: "3",
    title: "Sons of Legion Tour T-Shirt",
    image: nyTshirt2,
    price: "$39.99",
  },
  {
    id: "4",
    title: "Sons of Legion NYC Hoodie",
    image: nySweater,
    price: "$54.99",
  },
];
