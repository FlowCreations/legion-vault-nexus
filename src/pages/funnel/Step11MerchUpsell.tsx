import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FunnelLayout from './FunnelLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useFunnelTracking } from '@/hooks/useFunnelTracking';
import { Shirt, Zap } from 'lucide-react';

export default function Step11MerchUpsell() {
  const navigate = useNavigate();
  const { trackConversion } = useFunnelTracking(11);

  const merchItems = [
    {
      id: 'tour_tshirt',
      name: 'JRNY Tour T-Shirt',
      price: 35,
      image: '/merch/tshirt-sol-to-soul-tour.png',
      stock: 18,
    },
    {
      id: 'tour_poster',
      name: 'Limited Tour Poster',
      price: 25,
      image: '/prints/sol-to-soul-poster.png',
      stock: 12,
    },
    {
      id: 'bundle',
      name: 'Complete Experience',
      price: 55,
      image: '/merch/ny-tshirt-final.png',
      stock: 8,
      bundle: true,
    },
  ];

  const handleAddToCart = async (item: typeof merchItems[0]) => {
    await trackConversion('merch_view', item.price, item.id);
    navigate('/merch');
  };

  return (
    <FunnelLayout step={11}>
      <div className="max-w-5xl mx-auto space-y-12 py-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-primary/20 px-4 py-2 rounded-full">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-semibold">Fan Favorites</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-foreground">
            Complete the experience
          </h1>
          
          <p className="text-xl text-muted-foreground">
            Fans who loved the album usually grab one of these
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {merchItems.map((item) => (
            <Card key={item.id} className="p-6 space-y-4 hover:border-primary transition-colors">
              <div className="aspect-square bg-secondary/20 rounded-lg overflow-hidden">
                <img 
                  src={item.image} 
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-lg">{item.name}</h3>
                
                {item.stock < 20 && (
                  <div className="text-sm text-destructive font-semibold">
                    Only {item.stock} left!
                  </div>
                )}

                <div className="text-2xl font-bold">${item.price}</div>
              </div>

              <Button 
                onClick={() => handleAddToCart(item)}
                className="w-full"
                variant={item.bundle ? 'default' : 'outline'}
              >
                <Shirt className="w-4 h-4 mr-2" />
                {item.bundle ? 'Get Bundle' : 'Add to Collection'}
              </Button>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button 
            onClick={() => navigate('/funnel/step-12')}
            variant="ghost"
            size="lg"
          >
            Skip to Rewards
          </Button>
        </div>
      </div>
    </FunnelLayout>
  );
}
