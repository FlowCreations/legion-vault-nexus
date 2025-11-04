import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Info, Download, Calendar, Music, ShoppingBag, Ticket, Users } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MonthData {
  month: string;
  totalEarnings: number;
  sales: {
    albums: number;
    merch: number;
    tickets: number;
    community: number;
  };
}

const monthsData: MonthData[] = [
  {
    month: "October 2025",
    totalEarnings: 95300,
    sales: {
      albums: 29500,
      merch: 25000,
      tickets: 14200,
      community: 5300,
    },
  },
  {
    month: "September 2025",
    totalEarnings: 19800,
    sales: {
      albums: 7800,
      merch: 6900,
      tickets: 3900,
      community: 1200,
    },
  },
  {
    month: "August 2025",
    totalEarnings: 18500,
    sales: {
      albums: 7200,
      merch: 6500,
      tickets: 3600,
      community: 1200,
    },
  },
];

const dailySalesData = {
  today: 850,
  yesterday: 920,
  "7days": 5800,
  "14days": 11200,
  "thismonth": 21300,
  "30days": 19800,
  alltime: 127500,
};

export const EarningsOverview = () => {
  const [selectedMonth, setSelectedMonth] = useState("October 2025");
  const [selectedPeriod, setSelectedPeriod] = useState<keyof typeof dailySalesData>("today");
  
  const currentData = monthsData.find(m => m.month === selectedMonth) || monthsData[0];

  const handleDownload = () => {
    const csvContent = `Earnings Report - ${selectedMonth}\n\nTotal Earnings,$${currentData.totalEarnings.toLocaleString()}\n\nSales Breakdown:\nAlbums,$${currentData.sales.albums.toLocaleString()}\nMerch,$${currentData.sales.merch.toLocaleString()}\nTickets,$${currentData.sales.tickets.toLocaleString()}\nCommunity,$${currentData.sales.community.toLocaleString()}`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `earnings-${selectedMonth.toLowerCase().replace(' ', '-')}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header with Earnings */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-foreground/70 font-medium uppercase tracking-wide mb-2">
              EARNINGS / {selectedMonth.toUpperCase()}
            </p>
            <h1 className="text-6xl font-bold text-foreground">
              ${currentData.totalEarnings.toLocaleString()}.00
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Info className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full"
              onClick={handleDownload}
            >
              <Download className="h-5 w-5" />
            </Button>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthsData.map((data) => (
                  <SelectItem key={data.month} value={data.month}>
                    {data.month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Daily Sales Section */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-foreground/70 font-medium uppercase tracking-wide mb-2">
              DAILY SALES
            </p>
            <h2 className="text-4xl font-bold text-foreground">
              ${dailySalesData[selectedPeriod].toLocaleString()}.00
            </h2>
          </div>
          
          <Select value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as keyof typeof dailySalesData)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="7days">7 Days</SelectItem>
              <SelectItem value="14days">14 Days</SelectItem>
              <SelectItem value="thismonth">This Month</SelectItem>
              <SelectItem value="30days">30 Days</SelectItem>
              <SelectItem value="alltime">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Sales Categories */}
      <div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-8 text-center">
              <Music className="h-12 w-12 mx-auto mb-4" />
              <h3 className="font-bold text-xl mb-2">Albums</h3>
              <p className="text-4xl font-bold">${currentData.sales.albums.toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8 text-center">
              <ShoppingBag className="h-12 w-12 mx-auto mb-4" />
              <h3 className="font-bold text-xl mb-2">Merch</h3>
              <p className="text-4xl font-bold">${currentData.sales.merch.toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8 text-center">
              <Ticket className="h-12 w-12 mx-auto mb-4" />
              <h3 className="font-bold text-xl mb-2">Tickets</h3>
              <p className="text-4xl font-bold">${currentData.sales.tickets.toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 mx-auto mb-4" />
              <h3 className="font-bold text-xl mb-2">Community</h3>
              <p className="text-4xl font-bold">${currentData.sales.community.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
